// המסלול (D-21): שלב לכל מושג מלא, ובכל שלב תחנות קצרות בסדר קבוע:
// פתיחה ← תרגול ראשון ← בדיקת זיהוי ← כרטיסים ← דו־קרב ← מבחן השלב. כתובת: #/go/<concept>/<key>
// הצעד הבא הוא תמיד אחד: התחנה הראשונה שלא הושלמה, והשקיה שהגיע זמנה קודמת לה (nextAction).
// "הושלמה" נגזר קודם מסולם העומק, כך שמי שהתקדם דרך המפה לא חוזר על אותו דבר.
// רק תרגול, כרטיסים ומבחן השלב נרשמים במסלול עצמו (p.path).
import { data, node, title, fullOf, cardOf, levelOf, dueList, emblemOf, isFull } from './data.js';

export const KINDS = {
  lesson: { he: 'פתיחה', icon: 'book', desc: 'הסיפור, התמצית ואיך מזהים, בצעדים קצרים.' },
  practice: { he: 'תרגול ראשון', icon: 'target', desc: 'כמה שאלות קצרות, כדי לוודא שהמושג ברור.' },
  check: { he: 'בדיקת זיהוי', icon: 'magnifier', desc: 'שלושה מקרים חדשים. מזהים שניים, והשורש מתפצל.' },
  cards: { he: 'כרטיסים', icon: 'cards', desc: 'מושגים קרובים בכרטיסים קצרים, ובסוף סבב התאמה.' },
  duel: { he: 'דו־קרב', icon: 'scale', desc: 'קודם ההבדלים בין התאומים, ואז שני מקרים: מי זה מי?' },
  test: { he: 'מבחן השלב', icon: 'medal', desc: 'סבב מסכם על כל השלב. מי שעובר מקבל את החותמת של המושג לאוסף.' },
};

export const stages = () => (data() && data().path && data().path.stages) || [];
export const hrefOf = (s) => `#/go/${s.sid}`;

// התרגילים של כל תחנה במושג מלא. בדיקת הזיהוי נבחרת ראשונה ובדיוק כמו בדף המושג,
// ואחריה הדו־קרב, התרגול (שאלות הבנה) והמבחן מתוך מה שנשאר. "הסבר במילים שלך" סוגר את המבחן.
export function pools(id) {
  const c = fullOf(id);
  if (!c) return null;
  const ex = c.exercises || [];
  const used = new Set();
  const take = (list, n) => {
    const out = [];
    for (const e of list) { if (out.length >= n) break; if (!used.has(e.id)) { out.push(e); used.add(e.id); } }
    return out;
  };
  const rec = ex.filter((e) => ['case', 'hunt'].includes(e.type));
  const check = take([...rec.filter((e) => e.level === 'recognize'), ...rec.filter((e) => e.level !== 'recognize')], 3);
  const duel = take(ex.filter((e) => e.type === 'duel'), 2);
  const practice = take([
    ...ex.filter((e) => ['mcq', 'truefalse', 'firstfall'].includes(e.type) && e.level === 'understand'),
    ...ex.filter((e) => ['mcq', 'truefalse'].includes(e.type)),
  ], 4);
  const rest = ex.filter((e) => !used.has(e.id) && !['explain', 'firstfall'].includes(e.type));
  const test = take([...rest.filter((e) => e.level === 'apply' || e.level === 'distinguish'), ...rest], 4);
  const explain = ex.find((e) => e.type === 'explain') || null;
  return { practice, check, duel, test, explain };
}

// כל התחנות לפי הסדר. מצב: done | current | locked | soon (התוכן עוד לא עבר את שער האימות)
export function stations(p) {
  const out = [];
  const passed = (sid) => !!(p.path && p.path[sid] && p.path[sid].passed);
  stages().forEach((st, si) => {
    const id = st.concept;
    const pl = pools(id);
    const lv = levelOf(p, id);
    const ch = (p.concepts[id] && p.concepts[id].checks) || {};
    const add = (kind, key, ready, done, extra = {}) => out.push({ sid: `${id}/${key}`, key, stage: si, concept: id, kind, ready, done, ...extra });
    add('lesson', 'lesson', !!pl, lv >= 2 || passed(`${id}/lesson`));
    add('practice', 'practice', !!(pl && pl.practice.length), passed(`${id}/practice`) || lv >= 3);
    add('check', 'check', !!(pl && pl.check.length >= 2), !!ch.recognize || lv >= 3);
    // מזהה תחנת כרטיסים לפי הכרטיס הראשון בה, ולא לפי המיקום: כשמוסיפים כרטיסים למסלול, הרישומים לא זזים לתחנה אחרת.
    // והיא "הושלמה" רק לפי הסולם: כל כרטיס בה ב"מבין" (מי שקרא אותם במפה לא חוזר עליהם)
    st.cards.forEach((group) => {
      const key = `cards-${group[0]}`;
      add('cards', key, group.some((x) => cardOf(x)), group.every((x) => !cardOf(x) || levelOf(p, x) >= 2), { cards: group });
    });
    add('duel', 'duel', !!(pl && pl.duel.length), !!ch.distinguish || lv >= 4 || passed(`${id}/duel`));
    add('test', 'test', !!(pl && pl.test.length), passed(`${id}/test`));
  });
  // תחנה בלי תוכן מאומת לא חוסמת את המסלול
  let cur = -1;
  out.forEach((s, i) => { s.i = i; if (cur < 0 && s.ready && !s.done) cur = i; });
  out.forEach((s, i) => { s.state = !s.ready ? 'soon' : s.done ? 'done' : i === cur ? 'current' : 'locked'; });
  return out;
}

// שם התחנה ושורת המשנה שלה: "בדיקת זיהוי" + "הטיית אישוש", או "כרטיסים" + שמות הכרטיסים
export const stationName = (s) => KINDS[s.kind].he;
export const stationSub = (s) => (s.kind === 'cards' ? s.cards.filter((x) => node(x)).map(title).join(' · ') : title(s.concept));
// גרסה קצרה, לשורה אחת (פס הצעד הבא): בכרטיסים רק המושג של השלב וכמה כרטיסים יש
export const stationShort = (s) => (s.kind === 'cards' ? `${title(s.concept)} · ${s.cards.length === 1 ? 'כרטיס אחד' : `${s.cards.length} כרטיסים`}` : title(s.concept));

export function minutesOf(s) {
  if (s.kind === 'lesson') { const c = fullOf(s.concept); return c ? c.readingMinutes.core + 1 : 4; }
  if (s.kind === 'cards') return Math.round(s.cards.length * 1.5 + 1);
  if (s.kind === 'test') return 6;
  return 3;
}

// הצעד הבא: השקיה אם הגיע הזמן, אחרת התחנה הנוכחית
export function nextAction(p, list = stations(p)) {
  const due = dueList(p);
  const cur = list.find((s) => s.state === 'current') || null;
  if (due.length) return { kind: 'water', href: '#/water', due, cur };
  if (cur) return { kind: 'station', href: hrefOf(cur), cur };
  return { kind: 'end', cur: null };
}

// ── אוסף החותמות (D-21) ──
// כרטיס נכנס לאוסף כשמגיעים בו ל"מבין". הסמל של מושג מלא נחשף רק כשעוברים את מבחן השלב שלו.
export function hasStamp(p, id) {
  if (!emblemOf(id)) return false;
  if (isFull(id)) { const r = p.path && p.path[`${id}/test`]; return !!(r && r.passed); }
  return levelOf(p, id) >= 2;
}
export function stampStats(p) {
  const ids = Object.keys((data() && data().emblems) || {});
  return { have: ids.filter((id) => hasStamp(p, id)).length, total: ids.length };
}
// החותמות לפי סדר המסלול: לכל שלב המושג המלא והכרטיסים שלו
export const stampGroups = () => stages().map((st, i) => ({ stage: i, concept: st.concept, ids: [st.concept, ...st.cards.flat()].filter((id) => emblemOf(id)) }));
export const stampSet = (p) => new Set(Object.keys((data() && data().emblems) || {}).filter((id) => hasStamp(p, id)));

// זוגות להתאמה: שם המושג מול התיאור שלו במשפט אחד (oneLiner). שניהם מהתוכן המאומת,
// ולכן ההתאמה לא מוסיפה אף טענה חדשה.
export function pairsFor(ids) {
  return ids.map((id) => { const c = cardOf(id) || fullOf(id); return c ? { id, name: title(id), text: c.oneLiner } : null; }).filter(Boolean);
}
// בתחנת כרטיסים: הכרטיסים שלה, ואם יש פחות משלושה, משלימים מהמושג של השלב ומכרטיסים קודמים בו
export function cardPairs(s) {
  const st = stages()[s.stage];
  const own = s.cards.filter((x) => cardOf(x));
  const before = st.cards.flat().slice(0, st.cards.flat().indexOf(s.cards[0])).filter((x) => cardOf(x));
  const fill = [s.concept, ...before.reverse()].filter((x) => !own.includes(x));
  return pairsFor([...own, ...fill].slice(0, Math.max(3, own.length)).slice(0, 4));
}
// במבחן השלב: עד חמישה מהכרטיסים של השלב
export const testPairs = (s) => pairsFor(stages()[s.stage].cards.flat().filter((x) => cardOf(x)).slice(0, 5));

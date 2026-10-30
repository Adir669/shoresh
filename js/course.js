// המסלול (D-21): שלב לכל מושג מלא, ובכל שלב תחנות קצרות בסדר קבוע:
// פתיחה ← תרגול ראשון ← בדיקת זיהוי ← כרטיסים ← דו־קרב ← מבחן השלב. כתובת: #/go/<concept>/<key>
// הצעד הבא הוא תמיד אחד: התחנה הראשונה שלא הושלמה, והשקיה שהגיע זמנה קודמת לה (nextAction).
// "הושלמה" נגזר קודם מסולם העומק, כך שמי שהתקדם דרך המפה לא חוזר על אותו דבר.
// רק תרגול, כרטיסים ומבחן השלב נרשמים במסלול עצמו (p.path).
import { data, node, title, fullOf, cardOf, levelOf, dueList, emblemOf, isFull } from './data.js';
import { compile } from './gloss-match.js';

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

// אילו מושגים אחרים שאלה מזכירה בשמם (שם או כינוי), בנוסח השאלה ובאפשרויות שהן משפטים.
// באפשרויות של תיק ושל ציד לא בודקים: שם, כי שם הן רשימת שמות של מושגים בכוונה (מה מהם מופיע כאן?).
let nameMatcher = null, namesFor = null;
function mentions(e, self) {
  const D = data();
  if (namesFor !== D) {
    const list = D.nodes.map((n) => { const c = fullOf(n.id) || cardOf(n.id); return { id: n.id, forms: [n.he, ...((c && c.aka) || [])] }; });
    nameMatcher = compile(list, []);
    namesFor = D;
  }
  const text = [e.prompt, e.statement, e.scenario, e.setup, e.artifact && e.artifact.text, e.a, e.b,
    ...(['mcq', 'truefalse', 'firstfall'].includes(e.type) ? e.options || [] : [])].filter(Boolean).join(' \n ');
  return [...new Set(nameMatcher.split(text, { once: false }).filter((x) => x.id && x.id !== self).map((x) => x.id))];
}

// מה הלומד כבר פגש כשהוא מגיע לתחנה: כל מה שבשלבים הקודמים (מושגים וכרטיסים) והמושג עצמו.
// בדו־קרב ובמבחן גם הכרטיסים של השלב, שכבר נקראו, והתאומים, שהדו־קרב מציג לפני המקרים.
function knownAt(id) {
  const st = stages();
  const si = st.findIndex((x) => x.concept === id);
  if (si < 0) return null;
  const before = new Set([id]);
  st.slice(0, si).forEach((x) => { before.add(x.concept); x.cards.flat().forEach((k) => before.add(k)); });
  const after = new Set(before);
  st[si].cards.flat().forEach((k) => after.add(k));
  ((fullOf(id) && fullOf(id).twins) || []).forEach((t) => { if (t.id) after.add(t.id); });
  return { before, after };
}

// התרגילים של כל תחנה במושג מלא. בדיקת הזיהוי נבחרת ראשונה ובדיוק כמו בדף המושג,
// ואחריה הדו־קרב, התרגול (שאלות הבנה) והמבחן מתוך מה שנשאר. "הסבר במילים שלך" סוגר את המבחן.
// לא שואלים על מה שעוד לא נלמד (אדיר, 29.10): התרגול הראשון בא מיד אחרי הפתיחה, ולכן אין בו שאלות
// ברמת "מבחין" (הבחנה מתאום היא הדרגה הרביעית, והיא מגיעה בדו־קרב) ואף שאלה שמזכירה מושג שהלומד
// עוד לא פגש. שאלה שמזכירה מושג כזה נכנסת רק לתחנה שבה הוא כבר מוכר, ואם אין כזו, היא נשארת לדף המושג.
// התוצאה תלויה רק בתוכן, ולכן נשמרת: המסלול קורא לזה לכל שלב בכל ציור
let poolCache = new Map(), poolFor = null;
export function pools(id) {
  if (poolFor !== data()) { poolCache = new Map(); poolFor = data(); }
  if (!poolCache.has(id)) poolCache.set(id, buildPools(id));
  return poolCache.get(id);
}
function buildPools(id) {
  const c = fullOf(id);
  if (!c) return null;
  const ex = c.exercises || [];
  const k = knownAt(id);
  const fits = (set) => (e) => !k || mentions(e, id).every((x) => set.has(x));
  // הסיווג הידני ב־path.json: שאלה שצריכה את הכרטיסים או את התאומים (afterCards) נכנסת רק לדו־קרב ולמבחן,
  // ושאלה שנשענת על תוכן שמופיע רק בדף המושג המלא (pageOnly) לא נכנסת למסלול בכלל
  const st = stages().find((x) => x.concept === id);
  const tag = (st && st.exercises) || {};
  const pageOnly = new Set(tag.pageOnly || []), afterCards = new Set(tag.afterCards || []);
  const inPath = (e) => !pageOnly.has(e.id);
  const used = new Set();
  const take = (list, n) => {
    const out = [];
    for (const e of list) { if (out.length >= n) break; if (!used.has(e.id)) { out.push(e); used.add(e.id); } }
    return out;
  };
  // בדיקת הזיהוי באה לפני הכרטיסים, ולכן גם בה רק מקרים שלא צריכים אותם. אם נשארים פחות משניים,
  // משלימים ממה שנשאר, כדי שהתחנה תמיד תעבוד (שניים נכונים מעבירים)
  const rec = ex.filter((e) => ['case', 'hunt'].includes(e.type)).filter(inPath);
  const recFair = rec.filter((e) => !afterCards.has(e.id));
  const byLevel = (list) => [...list.filter((e) => e.level === 'recognize'), ...list.filter((e) => e.level !== 'recognize')];
  const check = take(recFair.length >= 2 ? byLevel(recFair) : byLevel(rec), 3);
  const duel = take(ex.filter((e) => e.type === 'duel').filter(inPath).filter(fits(k ? k.after : null)), 2);
  // בתרגול הראשון אף פעם לא שאלות ברמת "מבחין", והסיווג הידני מוסיף על הכלל הזה ולא מחליף אותו
  const early = ex.filter(inPath).filter((e) => !afterCards.has(e.id) && e.level !== 'distinguish').filter(fits(k ? k.before : null));
  const practice = take([
    ...early.filter((e) => ['mcq', 'truefalse', 'firstfall'].includes(e.type) && e.level === 'understand'),
    ...early.filter((e) => ['mcq', 'truefalse'].includes(e.type)),
  ], 4);
  // פחות משתי שאלות שנספרות: משלימים ממקרים הוגנים שבדיקת הזיהוי לא לקחה
  const scored = practice.filter((e) => e.type !== 'firstfall').length;
  if (scored < 2) practice.push(...take(early.filter((e) => ['case', 'hunt'].includes(e.type)), 2 - scored));
  const rest = ex.filter((e) => !used.has(e.id) && !['explain', 'firstfall'].includes(e.type)).filter(inPath).filter(fits(k ? k.after : null));
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
// התיאור בגיליון התחנה. בבדיקת הזיהוי לפי מספר המקרים בפועל: בשלב שבו נשארו רק שני מקרים הוגנים
// (דילמת האסיר), התיאור לא מבטיח שלושה
export function stationDesc(s) {
  if (s.kind !== 'check') return KINDS[s.kind].desc;
  const n = ((pools(s.concept) || {}).check || []).length;
  return n === 2 ? 'שני מקרים חדשים. מזהים את שניהם, והשורש מתפצל.' : KINDS.check.desc;
}
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

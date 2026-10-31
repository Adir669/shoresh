// טעינת התוכן, אינדקסים על הגרף, וכללי ההתקדמות:
// סולם העומק, ענפים שנפתחים אחרי בדיקת זיהוי, השקיה, נקודות ורמות (D-21), ומצב הדגמה.
// המסלול עצמו (שלבים ותחנות) נמצא ב־course.js.
import { store } from './store.js';

export const LEVELS = [
  { n: 1, key: 'heard', he: 'שמעתי' },
  { n: 2, key: 'understand', he: 'מבין' },
  { n: 3, key: 'recognize', he: 'מזהה' },
  { n: 4, key: 'distinguish', he: 'מבחין' },
  { n: 5, key: 'use', he: 'משתמש' },
];
export const CTYPES = {
  depth: { he: 'עומק', desc: 'עוד מושג מאותה משפחה' },
  twin: { he: 'תאום', desc: 'מושג דומה שצריך ללמוד להבדיל ממנו' },
  bridge: { he: 'גשר', desc: 'מושג מתחום אחר שמתחבר' },
  foundation: { he: 'יסוד', desc: 'המנגנון שמתחת' },
};
export const EVIDENCE = {
  solid: { he: 'מבוסס היטב', icon: 'shield', desc: 'שוחזר פעמים רבות, או תוצאה לוגית או מתמטית' },
  good: { he: 'נתמך היטב', icon: 'shield', desc: 'ראיות טובות, עם הסתייגויות' },
  mixed: { he: 'ראיות מעורבות', icon: 'info', desc: 'חלק מהשחזורים נכשלו או שגודל האפקט שנוי במחלוקת' },
  contested: { he: 'שנוי במחלוקת', icon: 'alert', desc: 'יש מחלוקת מחקרית גדולה' },
  anecdotal: { he: 'בעיקר סיפורים', icon: 'info', desc: 'נשען בעיקר על סיפורים ולא על מחקר' },
  conceptual: { he: 'כלי חשיבה', icon: 'layers', desc: 'הגדרה, מודל או כלי ניתוח, ולא ממצא אמפירי' },
};
export const INTERVALS = [1, 3, 7, 16, 35]; // ימים עד ההשקיה הבאה, לפי שלב
const DAY = 86400000;

// ── נקודות ורמות (D-21) ──
// הנקודות מודדות מאמץ ולמידה; סולם העומק נשאר המדד לשליטה במושג (VISION, עיקרון 2).
// רוב הפרסים קשורים למעבר בסולם, ולכן אותו הישג לא מזכה פעמיים. "ראיתי את זה" שווה כמו מבחן שלב,
// כי זה המדד האמיתי (VISION, עיקרון 3).
export const POINTS = {
  correct: 2,    // תשובה נכונה ראשונה לתרגיל
  again: 1,      // תשובה נכונה לתרגיל שכבר נפתר
  read: 10,      // מושג מלא הגיע ל"מבין"
  readCard: 3,   // כרטיס הגיע ל"מבין"
  check: 15,     // בדיקת זיהוי ראשונה שעברה ("מזהה")
  duel: 10,      // דו־קרב ראשון שעבר ("מבחין")
  seen: 25,      // רישום ב"ראיתי את זה" (פעם ביום לכל מושג). כמו מבחן שלב
  water: 2,      // כל מושג שהושקה
  match: 1,      // כל זוג נכון בהתאמה
  // בונוס לתחנה במסלול שהושלמה בפעם הראשונה. לפתיחה, לבדיקה ולדו־קרב אין בונוס נפרד:
  // הנקודות שלהן מגיעות מהמעבר בסולם (read, check, duel), כדי שלא יינתנו פעמיים
  station: { practice: 5, cards: 5, test: 25 },
};
// רמה n מתחילה ב־10·n·(n+1)−20 נקודות: 0, 40, 100, 180, 280, 400...
export const levelStart = (n) => 10 * n * (n + 1) - 20;
export function levelInfo(points = 0) {
  let n = 1;
  while (levelStart(n + 1) <= points) n++;
  const a = levelStart(n), b = levelStart(n + 1);
  return { n, into: points - a, span: b - a, next: b };
}
const dayKey = (ts) => new Date(ts).toDateString();

// התקדמות שנצברה לפני שהיו נקודות (D-21) נספרת פעם אחת, לפי אותה טבלה:
// "מבין", "מזהה" ו"מבחין" בכל מושג, רישום ביומן (פעם ביום לכל מושג), ותרגיל שנפתר נכון.
export function pointsFromProgress(d) {
  let n = 0;
  for (const [id, c] of Object.entries(d.concepts || {})) {
    if (!D.byId[id]) continue;
    if ((c.level || 0) >= 2) n += isFull(id) ? POINTS.read : POINTS.readCard;
    if (c.checks && c.checks.recognize) n += POINTS.check;
    if (c.checks && c.checks.distinguish) n += POINTS.duel;
  }
  n += new Set((d.journal || []).map((j) => `${j.concept}|${dayKey(j.at)}`)).size * POINTS.seen;
  n += Object.values(d.ex || {}).filter((x) => x && x.ok).length * POINTS.correct;
  return n;
}

let D = null;

export async function loadContent() {
  const res = await fetch('data/content.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bundle = await res.json();
  const byId = {}; bundle.nodes.forEach((n) => { byId[n.id] = n; });
  const fieldById = {}; bundle.fields.fields.forEach((f) => { fieldById[f.id] = f; });
  const out = {}, inn = {};
  bundle.edges.forEach((e) => { (out[e.from] ||= []).push(e); (inn[e.to] ||= []).push(e); });
  D = { ...bundle, byId, fieldById, out, inn };
  return D;
}

export const data = () => D;
export const node = (id) => D.byId[id];
export const field = (id) => D.fieldById[id];
export const title = (id) => (D.byId[id] ? D.byId[id].he : id);
export const fullOf = (id) => D.concepts[id] || null;
export const cardOf = (id) => D.cards[id] || null;
export const isFull = (id) => !!D.byId[id] && D.byId[id].tier === 'full';
export const hasContent = (id) => !!(D.concepts[id] || D.cards[id]);
export const edgesOut = (id) => D.out[id] || [];
export const edgesIn = (id) => D.inn[id] || [];
export const edge = (from, to) => (D.out[from] || []).find((e) => e.to === to) || null;
export const interestById = (id) => D.interests.interests.find((x) => x.id === id);
export const sourcesOf = (id) => (fullOf(id) || cardOf(id) || {}).sources || [];
// סמל המושג (D-20): קיים רק אם יחידת visuals עברה את שער האימות בבנייה
export const emblemOf = (id) => (D.emblems && D.emblems[id]) || null;
// הקראה (D-20, ניסוי): רק כשהקובץ קשור בטביעה לנוסח המאומת הנוכחי
export const audioOf = (id) => (D.audio && D.audio[id]) || null;
export const verificationOf = (id) => {
  const n = D.byId[id];
  return n ? D.verification[n.unit] || null : null;
};

export function interestFields(interests) {
  return new Set((interests || []).flatMap((i) => (interestById(i) || {}).fields || []));
}
export function exampleKey(interests) {
  for (const i of interests || []) { const it = interestById(i); if (it) return it.example; }
  return 'daily';
}

// ── מצב הדגמה: עותק בזיכרון בלבד, לא נוגע בהתקדמות האמיתית ──
let demo = null;
const demoSubs = new Set();
export const demoStore = {
  get: () => (demo ||= makeDemo()),
  update(fn) { fn(demoStore.get()); demoSubs.forEach((f) => f()); },
  subscribe(f) { demoSubs.add(f); return () => demoSubs.delete(f); },
};
export const progressOf = (state) => (state.demo ? demoStore.get() : state);
export const targetOf = (state) => (state.demo ? demoStore : store);

function makeDemo() {
  const now = Date.now();
  const ago = (d, h = 0) => now - d * DAY - h * 3600000;
  const C = {};
  const put = (id, level, stage, dueInDays, learnedDaysAgo) => {
    C[id] = { level, stage, due: now + dueInDays * DAY, seenAt: ago(learnedDaysAgo), learnedAt: ago(learnedDaysAgo), checks: { recognize: level >= 3, distinguish: level >= 4, use: level >= 5 } };
  };
  put('confirmation-bias', 5, 4, 12, 29);
  put('sunk-cost', 4, 3, -1, 25);
  put('survivorship-bias', 4, 3, 6, 21);
  put('affirming-the-consequent', 3, 2, 2, 17);
  put('prisoners-dilemma', 3, 2, -2, 13);
  put('falsifiability', 2, 1, 1, 8);
  put('chicken', 1, 0, 3, 2);
  put('motivated-reasoning', 2, 2, 4, 27); put('belief-perseverance', 2, 1, -3, 26);
  put('backfire-effect', 2, 1, 2, 24); put('groupthink', 1, 0, 5, 22);
  put('streisand-effect', 2, 1, 5, 23); put('availability-heuristic', 2, 1, 4, 27);
  put('conditional', 2, 2, 6, 16); put('denying-the-antecedent', 2, 1, 1, 15);
  put('escalation-of-commitment', 2, 2, 9, 24); put('loss-aversion', 2, 1, -1, 23);
  put('opportunity-cost', 2, 1, 3, 23); put('expected-value', 1, 0, 2, 20);
  put('selection-bias', 2, 1, -2, 20); put('publication-bias', 1, 0, 4, 19); put('correlation-causation', 1, 0, 2, 18);
  put('nash-equilibrium', 2, 1, 5, 12); put('tit-for-tat', 1, 0, 2, 11); put('free-rider', 1, 0, 3, 10);
  put('problem-of-induction', 1, 0, 4, 7); put('black-swan', 1, 0, 2, 6); put('inversion', 1, 0, 6, 20);
  put('anchoring', 2, 1, 3, 28); put('replication-crisis', 1, 0, 2, 9); put('pyrrhic-victory', 1, 0, 5, 24);
  const journal = [
    { id: 'j1', concept: 'confirmation-bias', at: ago(27, 3), note: 'בוויכוח על מחקר חדש שמתי לב שאני מחפש רק כתבות שמסכימות איתי. עצרתי וחיפשתי את הצד השני.' },
    { id: 'j2', concept: 'sunk-cost', at: ago(22, 5), note: 'כמעט נשארנו להופעה משעממת “כי כבר שילמנו”. יצאנו בהפסקה, והערב רק השתפר.' },
    { id: 'j3', concept: 'survivorship-bias', at: ago(18, 2), note: 'פוסט על “ההרגלים של אנשים מצליחים”. ומה עם כל מי שעשה בדיוק את אותו הדבר ולא הצליח?' },
    { id: 'j4', concept: 'confirmation-bias', at: ago(12, 6), note: 'בישיבת צוות הצעתי לחפש נתון שיכול להפריך את התוכנית שלנו, ולא רק נתונים שמאששים אותה.' },
    { id: 'j5', concept: 'prisoners-dilemma', at: ago(9, 1), note: 'שני בתי קפה ברחוב הורידו מחירים אחד אחרי השני, ועכשיו שניהם מרוויחים פחות.' },
    { id: 'j6', concept: 'affirming-the-consequent', at: ago(4, 4), note: '"אם הוא היה אשם, הוא היה לחוץ. הוא לחוץ, אז הוא אשם." תפסתי את זה בסדרה, ושמחתי שזיהיתי.' },
  ];
  // המסלול אחרי חודש (D-21): שלב 1 הושלם עם החותמת, ושלב 2 עומד בתחנת הכרטיסים השנייה
  const rec = (d, best = 0.8) => ({ passed: true, at: ago(d), last: ago(d), n: 1, best });
  const path = {
    'confirmation-bias/practice': rec(28, 1), 'confirmation-bias/cards-motivated-reasoning': rec(26, 1), 'confirmation-bias/cards-backfire-effect': rec(24, 1),
    'confirmation-bias/cards-anchoring': rec(23, 1), 'confirmation-bias/test': rec(21, 0.83),
    'affirming-the-consequent/practice': rec(17, 0.75), 'affirming-the-consequent/cards-conditional': rec(15, 1),
  };
  return { concepts: C, journal, ex: {}, points: 585, levelSeen: 7, path, demo: true };
}

// ── כללי ההתקדמות ──
export const levelOf = (p, id) => (p.concepts[id] ? p.concepts[id].level || 0 : 0);
export const isDue = (p, id, now = Date.now()) => { const c = p.concepts[id]; return !!c && c.level >= 2 && !!c.due && c.due <= now; };
export const dueList = (p) => Object.keys(p.concepts).filter((id) => D.byId[id] && isDue(p, id));
export const caughtCount = (p, id) => p.journal.filter((j) => j.concept === id).length;

export function seeds(interests) {
  const wanted = interestFields(interests);
  const fulls = D.nodes.filter((n) => n.tier === 'full');
  return fulls
    .map((n, i) => ({ id: n.id, s: (wanted.has(n.field) ? 2 : 0) + (n.id === 'confirmation-bias' ? 1 : 0), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, 3)
    .map((x) => x.id);
}

// מצב צומת במפה: learned | due | open | locked | fog
export function nodeState(p, id, seedIds) {
  const lv = levelOf(p, id);
  if (lv > 0) return isDue(p, id) ? 'due' : 'learned';
  if (seedIds.includes(id) || edgesIn(id).some((e) => levelOf(p, e.from) >= 3)) return 'open';
  if (edgesIn(id).some((e) => levelOf(p, e.from) >= 1)) return 'locked';
  return 'fog';
}
// מי צריך לעבור בדיקת זיהוי כדי שהצומת ייפתח
export const lockedBy = (p, id) => edgesIn(id).filter((e) => levelOf(p, e.from) >= 1 && levelOf(p, e.from) < 3).map((e) => e.from);

// ── פעולות: כל אחת מוחלת על המקור הנכון (אמיתי או הדגמה), והנקודות נצברות באותה שמירה ──
function upd(state, fn) { targetOf(state).update(fn); }
const ensure = (d, id) => (d.concepts[id] ||= { level: 0, stage: 0, due: 0, seenAt: 0, learnedAt: 0, checks: {} });
const add = (d, n) => { d.points = (d.points || 0) + n; };
// הסוג של תחנה לפי המזהה שלה: 'sunk-cost/cards-opportunity-cost' → 'cards'
export const kindOfStation = (sid) => { const k = String(sid).split('/')[1] || ''; return k.startsWith('cards-') ? 'cards' : k; };

export const actions = {
  visit(state, id) {
    if (levelOf(progressOf(state), id) >= 1) return;
    upd(state, (d) => { const c = ensure(d, id); c.level = Math.max(c.level, 1); c.seenAt = Date.now(); });
  },
  read(state, id) {
    upd(state, (d) => {
      const c = ensure(d, id);
      if (c.level < 2) add(d, isFull(id) ? POINTS.read : POINTS.readCard);
      c.level = Math.max(c.level, 2);
      if (!c.due) { c.stage = 0; c.due = Date.now() + INTERVALS[0] * DAY; }
      c.learnedAt ||= Date.now();
    });
  },
  check(state, id, passed) {
    upd(state, (d) => {
      const c = ensure(d, id);
      if (!passed) return;
      if (!c.checks.recognize) add(d, POINTS.check);
      c.level = Math.max(c.level, c.checks.distinguish ? 4 : 3);
      c.checks.recognize = true;
      c.stage = Math.max(c.stage, 1);
      c.due = Date.now() + INTERVALS[c.stage] * DAY;
      c.learnedAt ||= Date.now();
    });
  },
  duel(state, id, passed) {
    if (!passed) return;
    upd(state, (d) => {
      const c = ensure(d, id);
      if (!c.checks.distinguish) add(d, POINTS.duel);
      c.checks.distinguish = true;
      if (c.level >= 3) c.level = Math.max(c.level, 4);
    });
  },
  seen(state, id, note) {
    upd(state, (d) => {
      // פעם ביום לכל מושג: הרישום עצמו תמיד נשמר, אבל הנקודות לא נצברות מחזרה על אותו רישום
      const today = dayKey(Date.now());
      if (!d.journal.some((j) => j.concept === id && dayKey(j.at) === today)) add(d, POINTS.seen);
      d.journal.unshift({ id: `j${Date.now()}`, concept: id, at: Date.now(), note: (note || '').trim() });
      const c = ensure(d, id);
      c.level = Math.max(c.level, 1);
      if (c.level >= 3) { c.level = 5; c.checks.use = true; }
    });
  },
  water(state, id, ok) {
    upd(state, (d) => {
      const c = ensure(d, id);
      add(d, POINTS.water);
      c.stage = ok ? Math.min(c.stage + 1, INTERVALS.length - 1) : Math.max(c.stage - 1, 0);
      c.due = Date.now() + (ok ? INTERVALS[c.stage] : 1) * DAY;
    });
  },
  answer(state, exId, ok) {
    upd(state, (d) => {
      // "נפתר כבר": גם רשומה ישנה בלי won (מלפני D-21) עם ok, כי עליה כבר ניתנו נקודות ב־pointsFromProgress
      const prev = d.ex[exId];
      const won = !!(prev && (prev.won || prev.ok));
      if (ok) add(d, won ? POINTS.again : POINTS.correct);
      d.ex[exId] = { ok, at: Date.now(), won: won || ok };
    });
  },
  // נקודות שלא קשורות לתרגיל בודד (למשל זוגות נכונים בהתאמה)
  award(state, n) { if (n > 0) upd(state, (d) => add(d, n)); },
  // הרמה האחרונה שכבר הוצגה למשתמש, כדי שחלון "עלית לרמה" יופיע פעם אחת בדיוק (גם בכמה לשוניות)
  levelShown(state, n) { if (n > (progressOf(state).levelSeen || 1)) upd(state, (d) => { d.levelSeen = Math.max(d.levelSeen || 1, n); }); },
  // תחנה במסלול הסתיימה. הבונוס ניתן רק בפעם הראשונה שהיא עוברת
  station(state, sid, { passed = true, score = 0, total = 0 } = {}) {
    upd(state, (d) => {
      d.path ||= {};
      const r = d.path[sid] || { n: 0 };
      r.n += 1;
      r.last = Date.now();
      r.best = Math.max(r.best || 0, total ? score / total : 1);
      if (passed && !r.passed) { r.passed = true; r.at = Date.now(); add(d, POINTS.station[kindOfStation(sid)] || 0); }
      d.path[sid] = r;
    });
  },
};

// תרגילים לפי סוג, מכל המושגים המאומתים (קודם ממושגים שנלמדו)
export function exercisesOf(type, p) {
  const all = [];
  for (const [cid, c] of Object.entries(D.concepts)) for (const ex of c.exercises || []) if (ex.type === type) all.push({ ...ex, concept: cid });
  return all.sort((a, b) => levelOf(p, b.concept) - levelOf(p, a.concept));
}

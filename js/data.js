// טעינת התוכן, אינדקסים על הגרף, וכללי ההתקדמות:
// סולם העומק, ענפים שנפתחים אחרי בדיקת זיהוי, השקיה, "לאן עכשיו", ומצב הדגמה.
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
  put('backfire-effect', 1, 0, 2, 24); put('groupthink', 1, 0, 5, 22);
  put('conditional', 2, 2, 6, 16); put('denying-the-antecedent', 1, 0, 1, 15);
  put('escalation-of-commitment', 2, 2, 9, 24); put('loss-aversion', 2, 1, -1, 23);
  put('opportunity-cost', 2, 1, 3, 23); put('expected-value', 1, 0, 2, 20);
  put('selection-bias', 2, 1, -2, 20); put('publication-bias', 1, 0, 4, 19); put('correlation-causation', 1, 0, 2, 18);
  put('nash-equilibrium', 2, 1, 5, 12); put('tit-for-tat', 1, 0, 2, 11); put('free-rider', 1, 0, 3, 10);
  put('problem-of-induction', 1, 0, 4, 7); put('black-swan', 1, 0, 2, 6); put('inversion', 1, 0, 6, 20);
  put('anchoring', 1, 0, 3, 28); put('replication-crisis', 1, 0, 2, 9); put('pyrrhic-victory', 1, 0, 5, 24);
  const journal = [
    { id: 'j1', concept: 'confirmation-bias', at: ago(27, 3), note: 'בוויכוח על מחקר חדש שמתי לב שאני מחפש רק כתבות שמסכימות איתי. עצרתי וחיפשתי את הצד השני.' },
    { id: 'j2', concept: 'sunk-cost', at: ago(22, 5), note: 'כמעט נשארנו להופעה משעממת "כי כבר שילמנו". יצאנו בהפסקה, והערב רק השתפר.' },
    { id: 'j3', concept: 'survivorship-bias', at: ago(18, 2), note: 'פוסט על "ההרגלים של אנשים מצליחים". ומה עם כל מי שעשה בדיוק את אותו הדבר ולא הצליח?' },
    { id: 'j4', concept: 'confirmation-bias', at: ago(12, 6), note: 'בישיבת צוות הצעתי לחפש נתון שיכול להפריך את התוכנית שלנו, ולא רק נתונים שמאששים אותה.' },
    { id: 'j5', concept: 'prisoners-dilemma', at: ago(9, 1), note: 'שני בתי קפה ברחוב הורידו מחירים אחד אחרי השני, ועכשיו שניהם מרוויחים פחות.' },
    { id: 'j6', concept: 'affirming-the-consequent', at: ago(4, 4), note: '"אם הוא היה אשם, הוא היה לחוץ. הוא לחוץ, אז הוא אשם." תפסתי את זה בסדרה, ושמחתי שזיהיתי.' },
  ];
  return { concepts: C, journal, ex: {}, demo: true };
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

// "לאן עכשיו": עד 3 אפשרויות, אחת מומלצת. כ־70% מהתחומים שנבחרו, וכ־30% גילוי.
export function suggestions(p, interests) {
  const wanted = interestFields(interests);
  const seen = new Set();
  const cands = [];
  const push = (c) => { if (!seen.has(c.id) && D.byId[c.id]) { seen.add(c.id); cands.push(c); } };
  for (const id of Object.keys(p.concepts)) {
    const lv = levelOf(p, id);
    if (lv > 0 && lv < 3 && isFull(id)) push({ id, kind: 'continue' });
  }
  for (const id of Object.keys(p.concepts)) {
    if (levelOf(p, id) < 3) continue;
    for (const e of edgesOut(id)) if (levelOf(p, e.to) === 0) push({ id: e.to, kind: 'branch', via: id, type: e.type });
  }
  if (cands.length < 3) seeds(interests).forEach((id) => { if (levelOf(p, id) === 0) push({ id, kind: 'seed' }); });
  const score = (c) => (c.kind === 'continue' ? 5 : 0) + (wanted.has(D.byId[c.id].field) ? 3 : 0) + (isFull(c.id) ? 2 : 0) + (hasContent(c.id) ? 1 : -6);
  cands.forEach((c) => { c.score = score(c); c.discovery = !wanted.has(D.byId[c.id].field); });
  cands.sort((a, b) => b.score - a.score);
  const pick = cands.slice(0, 1);
  const rest = cands.slice(1);
  const disc = rest.find((c) => c.discovery);
  const types = new Set(pick.map((c) => c.type));
  for (const c of rest) {
    if (pick.length >= 3) break;
    if (pick.length === 2 && disc && !pick.some((x) => x.discovery) && c !== disc) continue;
    if (!types.has(c.type) || pick.length < 2 || c === disc) { pick.push(c); types.add(c.type); }
  }
  for (const c of rest) { if (pick.length >= 3) break; if (!pick.includes(c)) pick.push(c); }
  return pick.map((c, i) => ({ ...c, recommended: i === 0 }));
}

// ── פעולות: כל אחת מוחלת על המקור הנכון (אמיתי או הדגמה) ──
function upd(state, fn) { targetOf(state).update(fn); }
const ensure = (d, id) => (d.concepts[id] ||= { level: 0, stage: 0, due: 0, seenAt: 0, learnedAt: 0, checks: {} });

export const actions = {
  visit(state, id) {
    if (levelOf(progressOf(state), id) >= 1) return;
    upd(state, (d) => { const c = ensure(d, id); c.level = Math.max(c.level, 1); c.seenAt = Date.now(); });
  },
  read(state, id) {
    upd(state, (d) => {
      const c = ensure(d, id);
      c.level = Math.max(c.level, 2);
      if (!c.due) { c.stage = 0; c.due = Date.now() + INTERVALS[0] * DAY; }
      c.learnedAt ||= Date.now();
    });
  },
  check(state, id, passed) {
    upd(state, (d) => {
      const c = ensure(d, id);
      if (!passed) return;
      c.level = Math.max(c.level, c.checks.distinguish ? 4 : 3);
      c.checks.recognize = true;
      c.stage = Math.max(c.stage, 1);
      c.due = Date.now() + INTERVALS[c.stage] * DAY;
      c.learnedAt ||= Date.now();
    });
  },
  duel(state, id, passed) {
    if (!passed) return;
    upd(state, (d) => { const c = ensure(d, id); c.checks.distinguish = true; if (c.level >= 3) c.level = Math.max(c.level, 4); });
  },
  seen(state, id, note) {
    upd(state, (d) => {
      d.journal.unshift({ id: `j${Date.now()}`, concept: id, at: Date.now(), note: (note || '').trim() });
      const c = ensure(d, id);
      c.level = Math.max(c.level, 1);
      if (c.level >= 3) { c.level = 5; c.checks.use = true; }
    });
  },
  water(state, id, ok) {
    upd(state, (d) => {
      const c = ensure(d, id);
      c.stage = ok ? Math.min(c.stage + 1, INTERVALS.length - 1) : Math.max(c.stage - 1, 0);
      c.due = Date.now() + (ok ? INTERVALS[c.stage] : 1) * DAY;
    });
  },
  answer(state, exId, ok) { upd(state, (d) => { d.ex[exId] = { ok, at: Date.now() }; }); },
};

// תרגילים לפי סוג, מכל המושגים המאומתים (קודם ממושגים שנלמדו)
export function exercisesOf(type, p) {
  const all = [];
  for (const [cid, c] of Object.entries(D.concepts)) for (const ex of c.exercises || []) if (ex.type === type) all.push({ ...ex, concept: cid });
  return all.sort((a, b) => levelOf(p, b.concept) - levelOf(p, a.concept));
}

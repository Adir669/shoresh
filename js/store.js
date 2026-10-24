// מצב והתמדה. כל גישה ל־localStorage מגודרת (L-015). כל שינוי מוחל על העותק העדכני
// מהדיסק ואז נשמר (read-merge-write), ולשונית אחרת שהשתנתה מתרעננת (L-075).
const KEY = 'shoresh:v1';

export const DEFAULTS = () => ({
  v: 1,
  onboarded: false,
  interests: [],          // לפי סדר הבחירה; הראשון קובע את הדוגמה הראשונה
  dir: 'library',         // library | night | atlas
  mode: 'auto',           // auto | light | dark
  demo: false,            // מצב הדגמה: איך המפה נראית אחרי חודש
  concepts: {},           // id → { level, stage, due, seenAt, learnedAt, checks: {} }
  journal: [],            // { id, concept, at, note }
  ex: {},                 // exerciseId → { ok, at }
  updatedAt: 0,
});

let storageOk = true;
function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) { storageOk = false; return null; }
}
function write(obj) {
  try { window.localStorage.setItem(KEY, JSON.stringify(obj)); storageOk = true; return true; }
  catch (e) { storageOk = false; return false; }
}
const normalize = (o) => ({ ...DEFAULTS(), ...(o || {}) });
const clone = (o) => JSON.parse(JSON.stringify(o));

let mem = normalize(read());
const subs = new Set();
const emit = () => subs.forEach((fn) => { try { fn(mem); } catch (e) { console.error(e); } });

export const store = {
  get: () => mem,
  storageOk: () => storageOk,
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  // fn מקבל טיוטה של העותק העדכני ביותר ומשנה אותה במקום
  update(fn) {
    const base = normalize(read() || mem);
    const draft = clone(base);
    fn(draft);
    draft.updatedAt = Date.now();
    write(draft);
    mem = draft;
    emit();
  },
  reset(keep = {}) { const fresh = { ...DEFAULTS(), ...keep }; write(fresh); mem = fresh; emit(); },
  reload() {
    const disk = read();
    if (disk && disk.updatedAt !== mem.updatedAt) { mem = normalize(disk); emit(); }
  },
};

// סנכרון בין לשוניות וחזרה לאפליקציה
try {
  window.addEventListener('storage', (e) => { if (e.key === KEY) store.reload(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') store.reload(); });
  window.addEventListener('pageshow', () => store.reload());
} catch (e) { /* סביבה בלי חלון */ }

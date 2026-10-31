// נקודת הכניסה: טעינה, ניתוב לפי hash, המסגרת (סרגלים), והגיליונות הגלובליים.
import { html, render, useState, useEffect } from './vendor/standalone.module.js';
import { store } from './store.js';
import { loadContent, progressOf, demoStore, actions, data, levelOf, title, field, levelInfo, POINTS, pointsFromProgress } from './data.js';
import { Icon, BrandMark, FieldGlyph } from './icons.js';
import { Sheet, ToastHost, toast, ErrorBanner, MomentHost, celebrate } from './ui.js';
import { GlossHost } from './glossary.js';
import { Onboarding } from './screens/onboarding.js';
import { PathScreen } from './screens/path.js';
import { StationScreen } from './screens/station.js';
import { MapScreen } from './screens/map.js';
import { ConceptScreen, CheckScreen } from './screens/concept.js';
import { Practice, CaseRun, DuelRun, FirstFall, HuntRun, WaterRun } from './screens/practice.js';
import { PDSim } from './screens/pdsim.js';
import { BridgeScreen } from './screens/bridge.js';
import { ProgressScreen } from './screens/progress.js';
import { Debate, Eli10 } from './screens/labs.js';
import { AtlasDefs, Compass } from './atlas.js';

// עיצוב אחד: אטלס · סקר גאולוגי (D-19). ספרייה ולילה יצאו מהממשק.
export const DIR = 'atlas';

// פרמטרים בכתובת, לבדיקות ולצילומי מסך: ?m=dark&demo=1&reset=1&interests=finance,history
(function applyParams() {
  try {
    const q = new URLSearchParams(location.search);
    if (![...q.keys()].length) return;
    if (q.get('reset') === '1') store.reset();
    store.update((d) => {
      if (q.get('m')) d.mode = q.get('m');
      if (q.has('demo')) d.demo = q.get('demo') === '1';
      if (q.get('interests')) { d.interests = q.get('interests').split(',').filter(Boolean); d.onboarded = true; }
    });
  } catch (e) { /* כתובת לא תקינה: מתעלמים */ }
})();

function effectiveMode(mode) {
  if (mode !== 'auto') return mode;
  try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
}
function applyTheme(s) {
  const root = document.documentElement;
  root.dataset.dir = DIR;
  root.dataset.mode = effectiveMode(s.mode);
  requestAnimationFrame(() => {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute('content', bg);
  });
}

function useHash() {
  const [h, setH] = useState(location.hash || '#/home');
  useEffect(() => {
    const f = () => { setH(location.hash || '#/home'); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return h;
}
const parse = (h) => { const parts = h.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); return { name: parts[0] || 'home', args: parts.slice(1) }; };

// מסך הבית הוא המסלול (D-21). הנתיב נשאר #/home, כדי שכל קישור "חזרה" ימשיך לעבוד.
const TABS = [
  { id: 'home', href: '#/home', icon: 'path', he: 'מסלול' },
  { id: 'map', href: '#/map', icon: 'roots', he: 'מפה' },
  { id: 'practice', href: '#/practice', icon: 'target', he: 'תרגול' },
  { id: 'progress', href: '#/progress', icon: 'chart', he: 'התקדמות' },
];
const TAB_OF = { home: 'home', path: 'home', water: 'home', map: 'map', c: 'map', bridge: 'map', practice: 'practice', check: 'practice', debate: 'practice', eli10: 'practice', progress: 'progress' };

function Shell({ tab, state, openSheet }) {
  const demoBadge = state.demo && html`<span class="badge badge-demo" title="מראה איך המפה נראית אחרי חודש של למידה"><${Icon} name="clock" />מצב הדגמה</span>`;
  return html`
    <header class="topbar">
      <a class="brand" href="#/home"><${BrandMark} /><span class="brand-name">שורש</span></a>
      <div class="topbar-actions">
        ${demoBadge}
        <button class="icon-btn" onClick=${() => openSheet('seen')} aria-label="ראיתי את זה היום"><${Icon} name="eye" /></button>
        <button class="icon-btn" onClick=${() => openSheet('settings')} aria-label="הגדרות ועיצוב"><${Icon} name="sliders" /></button>
      </div>
    </header>
    <aside class="rail">
      <a class="brand" href="#/home"><${BrandMark} /><span class="brand-name">שורש</span></a>
      <nav aria-label="ניווט ראשי">
        ${TABS.map((t) => html`<a class="rail-link" href=${t.href} aria-current=${tab === t.id ? 'page' : undefined}><${Icon} name=${t.icon} />${t.he}</a>`)}
      </nav>
      <button class="btn btn-ghost btn-sm rail-seen" onClick=${() => openSheet('seen')}><${Icon} name="eye" />ראיתי את זה היום</button>
      <div class="rail-foot">
        ${demoBadge}
        <${Compass} size=${44} />
        <button class="btn btn-quiet btn-sm" onClick=${() => openSheet('settings')}><${Icon} name="sliders" />הגדרות</button>
      </div>
    </aside>
    <nav class="tabbar" aria-label="ניווט ראשי">
      ${TABS.map((t) => html`<a class="tab" href=${t.href} aria-current=${tab === t.id ? 'page' : undefined}><${Icon} name=${t.icon} /><span>${t.he}</span></a>`)}
    </nav>`;
}

function SettingsSheet({ state, onClose }) {
  const set = (fn) => store.update(fn);
  return html`<${Sheet} title="הגדרות" sub="מצב התצוגה, הדגמה ותחומי העניין." onClose=${onClose}>
    <div class="stack">
      <div class="row-between"><span class="field-label">מצב תצוגה</span>
        <div class="seg">${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([k, he]) => html`<button aria-pressed=${String(state.mode === k)} onClick=${() => set((s) => { s.mode = k; })}>${he}</button>`)}</div>
      </div>
      <label class="switch panel panel-quiet">
        <span><strong>מצב הדגמה</strong><br /><span class="muted">איך המסלול, המפה וההתקדמות נראים אחרי חודש של למידה. ההתקדמות האמיתית שלך לא משתנה.</span></span>
        <input type="checkbox" checked=${state.demo} onChange=${(e) => set((s) => { s.demo = e.target.checked; })} /><span class="track"></span>
      </label>
      <div class="row">
        <a class="btn btn-ghost btn-sm" href="#/welcome" onClick=${onClose}><${Icon} name="heart" />לשנות תחומי עניין</a>
        <button class="btn btn-quiet btn-sm" onClick=${() => { if (confirm('לאפס את כל ההתקדמות? אי אפשר לבטל.')) { store.reset({ dir: DIR, mode: state.mode, interests: state.interests, onboarded: true, scored: true }); onClose(); toast('ההתקדמות אופסה'); } }}>איפוס התקדמות</button>
      </div>
      ${!store.storageOk() && html`<${ErrorBanner} text="הדפדפן הזה לא שומר נתונים (אולי מצב פרטי). ההתקדמות תישמר רק עד שתסגור את הלשונית." />`}
    </div>
  </${Sheet}>`;
}

function SeenSheet({ state, onClose, preset }) {
  const p = progressOf(state);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState(preset || null);
  const [note, setNote] = useState('');
  const D = data();
  const list = D.nodes
    .filter((n) => !q || n.he.includes(q) || n.en.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => levelOf(p, b.id) - levelOf(p, a.id))
    .slice(0, q ? 12 : 8);
  const save = () => {
    const before = levelOf(p, pick);
    // הנקודות על רישום ניתנות פעם ביום לכל מושג (actions.seen)
    const today = new Date().toDateString();
    const fresh = !p.journal.some((j) => j.concept === pick && new Date(j.at).toDateString() === today);
    actions.seen(state, pick, note);
    onClose();
    // מי שכבר מזהה ופוגש את המושג בחיים מגיע לדרגה העמוקה: "משתמש"
    if (before >= 3 && before < 5) celebrate({ title: 'עלית דרגה: משתמש', sub: fresh ? `${title(pick)} (+${POINTS.seen} נקודות)` : title(pick), text: 'פגשת את המושג בחיים ורשמת אותו. זו הדרגה העמוקה בסולם: הידע הפך לזיהוי.' });
    else toast(`נרשם ביומן: ${title(pick)}${fresh ? ` (+${POINTS.seen} נקודות)` : ''}`);
  };
  return html`<${Sheet} title="ראיתי את זה היום" sub="איפה פגשת מושג בחיים? כל רישום כזה מקבע את הזיכרון יותר מכל תרגיל." onClose=${onClose}>
    ${!pick ? html`<div class="stack">
      <input class="input" type="search" dir="auto" placeholder="חיפוש מושג" value=${q} onInput=${(e) => setQ(e.target.value)} aria-label="חיפוש מושג" />
      <div class="pick-list">${list.map((n) => html`<button class="pick" data-field=${n.field} onClick=${() => setPick(n.id)}>
        <${FieldGlyph} id=${n.field} /><span class="pick-name">${n.he}</span><span class="faint pick-field">${field(n.field) ? field(n.field).short : ''}</span>
      </button>`)}</div>
    </div>` : html`<div class="stack">
      <div class="row"><strong class="seen-title">${title(pick)}</strong><button class="btn btn-quiet btn-sm" onClick=${() => setPick(null)}>להחליף</button></div>
      <label><span class="field-label">מה קרה? (לא חובה)</span>
        <textarea class="textarea" dir="auto" placeholder="למשל: בישיבה כולם רצו להמשיך פרויקט כי כבר השקענו בו" value=${note} onInput=${(e) => setNote(e.target.value)}></textarea></label>
      <button class="btn btn-block" onClick=${save}><${Icon} name="eye" />לרשום ביומן</button>
    </div>`}
  </${Sheet}>`;
}

function Loading() {
  return html`<div class="app"><main class="main"><div class="wrap stack" aria-busy="true" aria-label="טוען">
    <div class="skeleton" style="height:28px;width:40%"></div>
    <div class="skeleton" style="height:120px"></div>
    <div class="skeleton" style="height:90px"></div>
    <div class="skeleton" style="height:90px"></div>
  </div></main></div>`;
}

function App() {
  const [state, setState] = useState(store.get());
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(null);
  const [sheet, setSheet] = useState(() => { try { const q = new URLSearchParams(location.search).get('sheet'); return q === 'settings' || q === 'seen' ? q : null; } catch (e) { return null; } });
  useEffect(() => store.subscribe((s) => setState({ ...s })), []);
  useEffect(() => demoStore.subscribe(() => setTick((x) => x + 1)), []);
  useEffect(() => applyTheme(state), [state.mode]);
  useEffect(() => {
    try {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      const f = () => applyTheme(store.get());
      mq.addEventListener('change', f);
      return () => mq.removeEventListener('change', f);
    } catch (e) { return undefined; }
  }, []);
  // אחרי הטעינה, ולפני הציור הראשון: התקדמות ישנה מתורגמת לנקודות פעם אחת, כדי שלא תיחשב "עלייה ברמה"
  const backfill = () => { if (!store.get().scored) store.update((d) => { if (!d.scored) { d.points = (d.points || 0) + pointsFromProgress(d); d.scored = true; d.levelSeen = Math.max(d.levelSeen || 1, levelInfo(d.points).n); } }); };
  const load = () => { setErr(null); loadContent().then(() => { backfill(); setReady(true); }).catch((e) => setErr(String(e && e.message ? e.message : e))); };
  useEffect(load, []);
  const hash = useHash();
  const route = parse(hash);
  // עלייה ברמה (D-21): חלון קטן, פעם אחת לכל רמה. הרמה שכבר הוצגה נשמרת (levelSeen), כך שלשונית אחרת
  // לא מציגה אותו שוב, ומי שיצא מתחנה לפני מסך הסיום רואה אותו כשהוא חוזר. במסך התחנה מסך הסיום מציג את זה.
  const pp = progressOf(state);
  const ptsNow = pp.points || 0;
  const lvNow = levelInfo(ptsNow).n;
  useEffect(() => {
    if (!ready || route.name === 'go' || lvNow <= (pp.levelSeen || 1)) return;
    actions.levelShown(state, lvNow);
    celebrate({ level: lvNow, title: `עלית לרמה ${lvNow}`, sub: `${ptsNow} נקודות`, text: `כל תחנה במסלול, תשובה נכונה, השקיה ורישום ב“ראיתי את זה” מקדמים אותך. הרמה הבאה מתחילה ב־${levelInfo(ptsNow).next} נקודות.` });
  });

  if (err) return html`<div class="app"><main class="main"><div class="wrap stack"><${ErrorBanner} text=${`לא הצלחתי לטעון את התוכן (${err}).`} onRetry=${load} /></div></main></div>`;
  if (!ready) return html`<${Loading} />`;
  if (!state.onboarded && route.name !== 'welcome') { location.replace('#/welcome'); return html`<${Loading} />`; }

  const ctx = { state, p: progressOf(state), openSheet: setSheet };
  const a = route.args;
  const screens = {
    welcome: () => html`<${Onboarding} ctx=${ctx} />`,
    home: () => html`<${PathScreen} ctx=${ctx} />`,
    path: () => html`<${PathScreen} ctx=${ctx} />`,
    go: () => html`<${StationScreen} ctx=${ctx} concept=${a[0]} part=${a[1]} />`,
    map: () => html`<${MapScreen} ctx=${ctx} focus=${a[0]} />`,
    c: () => html`<${ConceptScreen} ctx=${ctx} id=${a[0]} />`,
    check: () => html`<${CheckScreen} ctx=${ctx} id=${a[0]} />`,
    practice: () => {
      const sub = a[0];
      if (sub === 'case') return html`<${CaseRun} ctx=${ctx} />`;
      if (sub === 'duel') return html`<${DuelRun} ctx=${ctx} />`;
      if (sub === 'firstfall') return html`<${FirstFall} ctx=${ctx} />`;
      if (sub === 'hunt') return html`<${HuntRun} ctx=${ctx} />`;
      if (sub === 'pd') return html`<${PDSim} ctx=${ctx} />`;
      return html`<${Practice} ctx=${ctx} />`;
    },
    water: () => html`<${WaterRun} ctx=${ctx} />`,
    bridge: () => html`<${BridgeScreen} ctx=${ctx} from=${a[0]} to=${a[1]} />`,
    progress: () => html`<${ProgressScreen} ctx=${ctx} />`,
    debate: () => html`<${Debate} ctx=${ctx} />`,
    eli10: () => html`<${Eli10} ctx=${ctx} />`,
  };
  const screen = (screens[route.name] || screens.home)();
  // כניסה ראשונה ותחנה במסלול: בלי סרגלים, כדי שלא יהיה על מה ללחוץ חוץ מהצעד עצמו
  const bare = route.name === 'welcome' || route.name === 'go';
  const mainCls = route.name === 'go' ? 'main main-sess' : bare ? 'main main-bare' : route.name === 'map' ? 'main main-map' : 'main';
  return html`<div class="app" data-screen=${route.name}>
    <${AtlasDefs} />
    ${!bare && html`<${Shell} tab=${TAB_OF[route.name] || 'home'} state=${state} openSheet=${setSheet} />`}
    <main class=${mainCls} id="main">
      <div class=${route.name === 'map' ? 'screen-fade' : route.name === 'home' || route.name === 'path' ? 'wrap screen-fade' : 'wrap screen-enter'} key=${hash}>${screen}</div>
    </main>
    ${sheet === 'settings' && html`<${SettingsSheet} state=${state} onClose=${() => setSheet(null)} />`}
    ${(sheet === 'seen' || (sheet && sheet.seen)) && html`<${SeenSheet} state=${state} preset=${sheet.seen} onClose=${() => setSheet(null)} />`}
    <${ToastHost} />
    <${MomentHost} />
    <${GlossHost} />
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));

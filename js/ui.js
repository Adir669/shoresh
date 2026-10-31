// רכיבי ממשק משותפים.
import { html, useState, useEffect, useRef } from './vendor/standalone.module.js';
import { Icon, ConnGlyph, FieldGlyph } from './icons.js';
import { LEVELS, CTYPES, EVIDENCE, field, emblemOf } from './data.js';
import { T } from './glossary.js';

export const KEYS = ['א', 'ב', 'ג', 'ד'];

// טקסט עם מעברי פסקה (\n\n) לפסקאות. מונחי המילון מסומנים בכל פסקה (D-22)
export const Paras = ({ text }) => String(text || '').split(/\n\n+/).filter(Boolean).map((t) => html`<p><${T} text=${t} /></p>`);

export function FieldChip({ id, long }) {
  const f = field(id);
  return html`<span class="chip" data-field=${id}><${FieldGlyph} id=${id} />${f ? (long ? f.he : f.short) : id}</span>`;
}

// איור אטלס (רגעי חוויה, תחומי עניין): קישוטי, ולכן alt ריק. במצב כהה הוא יושב על לוח נייר.
export function Ill({ name, size = 'md' }) {
  return html`<span class=${`ill ill-${size}`}><img src=${`img/atlas/${name}.webp`} alt="" width="480" height="480" loading="lazy" decoding="async" /></span>`;
}

// סמל המושג (D-20): מטאפורה שעברה את שער האימות. מושג בלי סמל מאומת לא מציג כלום.
// locked: צללית של חותמת שעוד לא נאספה לאוסף (D-21)
export function Emblem({ id, size = 'md', locked = false }) {
  const e = emblemOf(id);
  if (!e) return null;
  return html`<span class=${`ill emblem ill-${size}${locked ? ' is-locked' : ''}`} title=${locked ? 'חותמת שעוד לא נאספה' : e.metaphor || ''}><img src=${e.src} alt=${locked ? '' : e.alt} width="480" height="480" loading="lazy" decoding="async" /></span>`;
}

// תג רמה (D-21): מספר בתוך חותמת מרובעת, כמו סימון גובה במפה
export function LevelBadge({ n, size = 'md' }) {
  return html`<span class=${`lv-badge lv-${size}`} role="img" aria-label=${`רמה ${n}`}><span class="num">${n}</span></span>`;
}

export function CType({ type }) {
  const t = CTYPES[type];
  return t ? html`<span class="ctype" data-type=${type} title=${t.desc}><${ConnGlyph} type=${type} />${t.he}</span>` : null;
}

export function Evidence({ level, note }) {
  const e = EVIDENCE[level];
  if (!e) return null;
  return html`<span class="evidence" data-level=${level} title=${note || e.desc}><${Icon} name=${e.icon} />${e.he}</span>`;
}

export function Verified({ v }) {
  if (!v) return null;
  if (v.status === 'passed') return html`<span class="badge badge-ok" title=${`יומן אימות: ${v.verified} אומתו, ${v.corrected} תוקנו, ${v.removed} הוסרו, 0 פתוחות`}><${Icon} name="check" />נבדקו ${v.claims} טענות</span>`;
  if (v.status === 'draft') return html`<span class="badge badge-gold"><${Icon} name="alert" />טיוטה שעוד לא נבדקה</span>`;
  return null;
}

export function Ladder({ level = 0, fieldId, showNames = true }) {
  return html`<div class="ladder" data-field=${fieldId} role="img" aria-label=${`סולם העומק: ${level ? LEVELS[level - 1].he : 'עוד לא התחלת'}`}>
    ${LEVELS.map((l) => html`<div class="rung" data-on=${String(level >= l.n)} data-current=${String(level === l.n)}>
      <div class="rung-bar"></div>
      ${showNames && html`<div class="rung-name">${l.he}</div>`}
    </div>`)}
  </div>`;
}

export function Bar({ value, max, fieldId, label }) {
  const p = max ? Math.min(1, value / max) : 0;
  return html`<div class="bar" data-field=${fieldId} role="progressbar" aria-label=${label} aria-valuemin="0" aria-valuenow=${value} aria-valuemax=${max}><i style=${`--p:${p}`}></i></div>`;
}

export function Sheet({ title, sub, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.activeElement;
    if (ref.current) ref.current.focus();
    return () => { document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  return html`<div>
    <div class="scrim" onClick=${onClose}></div>
    <section class="sheet" role="dialog" aria-modal="true" aria-label=${title} tabindex="-1" ref=${ref}>
      <div class="sheet-grip"></div>
      <div class="sheet-head">
        <div><h2>${title}</h2>${sub && html`<p class="muted">${sub}</p>`}</div>
        <button class="icon-btn" onClick=${onClose} aria-label="סגירה"><${Icon} name="x" /></button>
      </div>
      ${children}
    </section>
  </div>`;
}

// הודעה צפה גלובלית
let pushToast = null;
let toastTimer = 0;
export function toast(msg) { if (pushToast) pushToast(msg); }
export function ToastHost() {
  const [m, setM] = useState(null);
  pushToast = (msg) => { setM(msg); clearTimeout(toastTimer); toastTimer = setTimeout(() => setM(null), 3200); };
  return m ? html`<div class="toast" role="status" aria-live="polite"><${Icon} name="sprout" />${m}</div>` : null;
}

// רגע חוויה (D-20): חלון קטן עם איור כשעולים דרגה או רמה. השלב הבא מופיע בו כקישור.
// כמה רגעים באותה פעולה (למשל דרגה ורמה) מוצגים בתור, אחד אחרי השני, ולא דורסים זה את זה.
let pushMoment = null;
let momentSeq = 0;
export function celebrate(m) { if (pushMoment) pushMoment(m); }
export function MomentHost() {
  const [q, setQ] = useState([]);
  pushMoment = (m) => setQ((x) => [...x, { ...m, k: ++momentSeq }]);
  const m = q[0];
  if (!m) return null;
  const close = () => setQ((x) => x.slice(1));
  return html`<${Sheet} key=${m.k} title=${m.title} sub=${m.sub} onClose=${close}>
    <div class="moment">
      ${m.level ? html`<${LevelBadge} n=${m.level} size="xl" />` : html`<${Ill} name=${m.ill || 'mo-depth'} size="lg" />`}
      <div class="moment-copy">
        ${m.text && html`<p>${m.text}</p>`}
        <div class="row">
          ${m.href && html`<a class="btn" href=${m.href} onClick=${close}>${m.cta}<${Icon} name="next" /></a>`}
          <button class=${m.href ? 'btn btn-ghost' : 'btn'} onClick=${close}>${m.href ? 'אחר כך' : 'להמשיך'}</button>
        </div>
      </div>
    </div>
  </${Sheet}>`;
}

export function Empty({ icon = 'sprout', ill, title, children }) {
  return html`<div class=${ill ? 'empty empty-ill' : 'empty'}>${ill ? html`<${Ill} name=${ill} />` : html`<${Icon} name=${icon} />`}<div class="empty-copy"><strong>${title}</strong>${children}</div></div>`;
}

export function ErrorBanner({ text, onRetry }) {
  return html`<div class="error-banner" role="alert"><span>${text}</span>${onRetry && html`<button class="btn btn-sm btn-ghost" onClick=${onRetry}><${Icon} name="refresh" />לנסות שוב</button>`}</div>`;
}

export function Opt({ i, text, state, onClick, disabled }) {
  return html`<button class="opt" data-state=${state || ''} disabled=${disabled} onClick=${onClick}><span class="key">${KEYS[i]}</span><span>${text}</span></button>`;
}

export function Feedback({ ok, title, children }) {
  const mark = ok === true ? 'check' : ok === false ? 'x' : null;
  return html`<div class="feedback" data-ok=${ok === undefined ? '' : String(ok)} role="status"><h4>${mark && html`<${Icon} name=${mark} />`}${title}</h4>${children}</div>`;
}

export function Back({ href = '#/home', label = 'חזרה' }) {
  return html`<a class="btn btn-quiet btn-sm" href=${href}><${Icon} name="back" />${label}</a>`;
}

const dtf = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long' });
const dtfFull = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
const rtf = new Intl.RelativeTimeFormat('he', { numeric: 'auto' });
export const fmtDate = (ts) => dtf.format(ts);
export const fmtToday = () => dtfFull.format(Date.now());
export function fmtRel(ts) {
  const days = Math.round((ts - Date.now()) / 86400000);
  return Math.abs(days) < 1 ? 'היום' : rtf.format(days, 'day');
}
export function fmtHistDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

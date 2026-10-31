// מילון המונחים (D-22): קו תחתון מנוקד מתחת למונח קשה, וחלונית קטנה עם הגדרה מאומתת.
// עכבר: ריחוף פותח, ויציאה סוגרת. אפשר לעבור עם העכבר לתוך החלונית, ולחיצה על המונח מצמידה אותה.
// מגע: הקשה פותחת, והקשה מחוץ לחלונית סוגרת. מקלדת: Enter או רווח פותחים והמיקוד עובר לחלונית,
// Esc סוגר ומחזיר את המיקוד למונח, ו־Tab ממשיך הלאה בטקסט כאילו החלונית יושבת מיד אחרי המונח.
// החלונית אחת לכל האפליקציה ויושבת מחוץ למסך (כמו הרגעים), כדי שאנימציה של המסך לא תלכוד אותה (L-020).
import { html, useState, useLayoutEffect, useRef } from './vendor/standalone.module.js';
import { data } from './data.js';
import { compile } from './gloss-match.js';
import { Icon } from './icons.js';

let matcher = null;
let builtFor = null;
let byId = {};
function current() {
  const D = data();
  const g = D && D.glossary;
  if (!g || !Array.isArray(g.terms) || !g.terms.length) return null;
  if (builtFor !== g) {
    matcher = compile(g.terms, g.blockers || []);
    byId = Object.fromEntries(g.terms.map((t) => [t.id, t]));
    builtFor = g;
  }
  return matcher;
}
export const glossTerm = (id) => (current() ? byId[id] || null : null);

// טקסט עם המונחים מסומנים. כל מונח מסומן רק במופע הראשון שלו בטקסט.
// רק בטקסט רגיל: לא בתוך כפתור, קישור או תווית, כי שם אסור עוד אלמנט אינטראקטיבי.
export function T({ text }) {
  const s = text == null ? '' : String(text);
  const m = current();
  if (!m || !s) return s;
  const parts = m.split(s);
  if (parts.length === 1 && !parts[0].id) return s;
  return parts.map((p) => (p.id ? html`<${Term} id=${p.id} s=${p.s} />` : p.s));
}

const isMouse = (e) => e.pointerType === 'mouse';
function Term({ id, s }) {
  const ref = useRef(null);
  const t = glossTerm(id);
  if (!t) return s;
  const el = () => ref.current;
  return html`<span class="term" ref=${ref} role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false" data-term=${id}
    onClick=${(e) => { e.preventDefault(); api && api.toggle(id, el(), 'click'); }}
    onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api && api.toggle(id, el(), 'key'); } }}
    onPointerEnter=${(e) => { if (isMouse(e) && api) api.hoverIn(id, el()); }}
    onPointerLeave=${(e) => { if (isMouse(e) && api) api.hoverOut(); }}>${s}</span>`;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const OPEN_DELAY = 160;
const CLOSE_DELAY = 220;

let api = null;
export function GlossHost() {
  const [cur, setCur] = useState(null); // { id, el, how: 'hover' | 'click' | 'key' }
  const pop = useRef(null);
  const timer = useRef(0);
  const live = useRef(null);
  live.current = cur;

  const mark = (c, on) => { if (c && c.el) { c.el.setAttribute('aria-expanded', String(on)); c.el.classList.toggle('is-open', on); } };
  const show = (id, el, how) => {
    clearTimeout(timer.current);
    const prev = live.current;
    if (prev && prev.el !== el) mark(prev, false);
    mark({ el }, true);
    // live מתעדכן מיד, ולא רק בציור הבא: לחיצה שמגיעה מיד אחרי pointerdown צריכה לראות את המצב החדש
    const next = { id, el, how, k: (prev ? prev.k : 0) + 1 };
    live.current = next;
    setCur(next);
  };
  const close = (focusBack) => {
    clearTimeout(timer.current);
    const c = live.current;
    if (!c) return;
    mark(c, false);
    live.current = null;
    setCur(null);
    if (focusBack && c.el && c.el.isConnected) c.el.focus({ preventScroll: true });
  };
  api = {
    toggle(id, el, how) {
      const c = live.current;
      // ריחוף כבר פתח את החלונית: לחיצה מצמידה אותה במקום לסגור
      if (c && c.el === el && c.how !== 'hover') close(how === 'key');
      else show(id, el, how);
    },
    hoverIn(id, el) {
      const c = live.current;
      clearTimeout(timer.current);
      if (c && c.el === el) return;
      if (c && c.how !== 'hover') return; // חלונית מוצמדת לא מתחלפת בריחוף
      timer.current = setTimeout(() => show(id, el, 'hover'), c ? 60 : OPEN_DELAY);
    },
    hoverOut() {
      clearTimeout(timer.current);
      const c = live.current;
      if (c && c.how === 'hover') timer.current = setTimeout(() => close(false), CLOSE_DELAY);
    },
  };

  const place = () => {
    const c = live.current, p = pop.current;
    if (!c || !p) return;
    if (!c.el || !c.el.isConnected) { close(false); return; }
    const rects = c.el.getClientRects();
    if (!rects.length) { close(false); return; }
    const first = rects[0], last = rects[rects.length - 1];
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const G = 12, GAP = 8;
    p.style.maxHeight = '';
    const pw = p.offsetWidth;
    let ph = p.offsetHeight;
    const below = vh - last.bottom - GAP - G, above = first.top - GAP - G;
    // מתחת למילה אם יש מקום, אחרת מעליה. אם אין מקום מלא באף צד (מסך נמוך), בצד שיש בו יותר מקום,
    // עם גובה מוגבל וגלילה בתוך החלונית, כדי שהראש וכפתור הסגירה לא ייחתכו
    const where = ph <= below ? 'below' : ph <= above ? 'above' : below >= above ? 'below' : 'above';
    const room = Math.max(120, where === 'below' ? below : above);
    if (ph > room) { p.style.maxHeight = `${Math.floor(room)}px`; ph = p.offsetHeight; }
    const a = where === 'below' ? last : first;
    // מימין לשמאל: הקצה הימני של החלונית מתיישר עם הקצה הימני של המילה, ואז נצמד לגבולות המסך
    const left = Math.max(G, Math.min(a.right - pw, vw - G - pw));
    const top = Math.max(G, Math.min(where === 'below' ? a.bottom + GAP : a.top - GAP - ph, vh - G - ph));
    p.style.left = `${Math.round(left)}px`;
    p.style.top = `${Math.round(top)}px`;
    p.style.setProperty('--ax', `${Math.round(Math.max(14, Math.min(pw - 14, (a.left + a.right) / 2 - left)))}px`);
    p.dataset.place = where;
    const off = a.bottom < 0 || a.top > vh;
    // המילה יצאה מהמסך בגלילה: אם המיקוד בתוך החלונית, סוגרים ומחזירים אותו למונח, כדי שהוא לא ייפול לראש הדף
    if (off && p.contains(document.activeElement)) { close(false); if (c.el.isConnected) c.el.focus({ preventScroll: true }); return; }
    p.style.visibility = off ? 'hidden' : 'visible';
  };

  useLayoutEffect(() => {
    if (!cur) return;
    place();
    if (cur.how !== 'hover' && pop.current) pop.current.focus({ preventScroll: true });
  }, [cur && cur.k]);

  // המאזינים נרשמים מיד עם הפתיחה (layout effect ולא effect רגיל, שרץ רק אחרי הציור):
  // Esc או לחיצה בחוץ שמגיעים מיד אחרי הפתיחה צריכים לסגור
  useLayoutEffect(() => {
    if (!cur) return undefined;
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    const onDown = (e) => {
      const c = live.current;
      if (!c || (pop.current && pop.current.contains(e.target)) || (c.el && c.el.contains(e.target))) return;
      close(false);
    };
    // Esc סוגר קודם את החלונית, ולא את הגיליון שמתחתיה
    const onKey = (e) => { if (e.key === 'Escape' && live.current) { e.stopPropagation(); e.preventDefault(); close(live.current.how !== 'hover'); } };
    const onHash = () => close(false);
    // צעד שמתחלף (למשל Enter על "להמשיך" בזמן ריחוף) מוציא את המונח מהעמוד: אז החלונית נסגרת, ולא נשארת יתומה
    const mo = new MutationObserver(() => { const c = live.current; if (c && c.el && !c.el.isConnected) close(false); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onMove, { passive: true, capture: true });
    window.addEventListener('resize', onMove);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('hashchange', onHash);
    return () => {
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onMove, { capture: true });
      window.removeEventListener('resize', onMove);
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('hashchange', onHash);
    };
  }, [cur && cur.k]);

  // Tab בתוך החלונית: אחרי הפריט האחרון ממשיכים לטקסט שאחרי המונח; Shift+Tab מהראשון חוזר למונח
  const onPopKey = (e) => {
    if (e.key !== 'Tab' || !pop.current || !cur) return;
    const items = [...pop.current.querySelectorAll(FOCUSABLE)];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); close(true); return; }
    if (!e.shiftKey && i === items.length - 1) {
      e.preventDefault();
      const all = [...document.querySelectorAll(FOCUSABLE)].filter((x) => !pop.current.contains(x) && x.getClientRects().length);
      const nx = all[all.indexOf(cur.el) + 1];
      close(false);
      if (nx) nx.focus();
    }
  };

  const t = cur && glossTerm(cur.id);
  if (!t) return null;
  return html`<div class="gloss-pop" role="dialog" aria-modal="false" aria-labelledby="gloss-h" aria-describedby="gloss-d" tabindex="-1" ref=${pop} key=${cur.k}
    onKeyDown=${onPopKey}
    onPointerEnter=${(e) => { if (isMouse(e)) clearTimeout(timer.current); }}
    onPointerLeave=${(e) => { if (isMouse(e) && live.current && live.current.how === 'hover') api.hoverOut(); }}>
    <div class="gloss-head">
      <p class="gloss-term"><strong id="gloss-h">${t.term}</strong>${t.en && html`<span class="gloss-en en" dir="ltr" lang="en">${t.en}</span>`}</p>
      <button class="gloss-x" onClick=${() => close(true)} aria-label="סגירת ההגדרה"><${Icon} name="x" /></button>
    </div>
    <p class="gloss-def" id="gloss-d">${t.def}</p>
    ${t.src && t.src.length > 0 && html`<p class="gloss-src">מקור: ${t.src.map((x, i) => html`${i ? ', ' : ''}<a href=${x.url} target="_blank" rel="noopener" dir="auto">${x.name}<${Icon} name="external" /></a>`)}</p>`}
    ${t.draft && html`<span class="badge badge-gold">טיוטה שעוד לא נבדקה</span>`}
  </div>`;
}

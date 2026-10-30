// מסך 3: מפת השורשים — קבוצות בצבעים שלהן, סוגי קשר, עובי לפי עומק, דהייה למה שצריך השקיה,
// ערפל על מה שלא נלמד, וענפים שנפתחים רק אחרי בדיקת זיהוי.
import { html, useState, useEffect, useRef, useMemo } from '../vendor/standalone.module.js';
import { store } from '../store.js';
import { data, node, field, title, fullOf, cardOf, seeds, nodeState, levelOf, caughtCount, edgesOut, lockedBy, isFull, LEVELS, CTYPES } from '../data.js';
import { layout, smooth, arc, ORDER } from '../maplayout.js';
import { Icon, ConnGlyph } from '../icons.js';
import { Sheet, FieldChip, CType, Ladder, Emblem } from '../ui.js';
import { T } from '../glossary.js';
import { Strata, Sprout, Compass, ScaleBar } from '../atlas.js';

// חותמת ב־SVG: מודדים את הטקסט אחרי הציור (וגם אחרי שהפונטים נטענו) ומתאימים את המלבן
function fitStamps(root) {
  if (!root) return;
  root.querySelectorAll('g[data-stamp]').forEach((g) => {
    const t = g.querySelector('text'), r = g.querySelector('rect');
    if (!t || !r) return;
    let w = 0;
    try { w = t.getComputedTextLength(); } catch (e) { return; }
    if (!w) return;
    const x = parseFloat(t.getAttribute('x')) || 0, y = parseFloat(t.getAttribute('y')) || 0;
    const fs = parseFloat(g.getAttribute('data-fs')) || 15, px = parseFloat(g.getAttribute('data-px')) || 8;
    const anchor = t.getAttribute('text-anchor');
    // בעברית: start = הקצה הימני של הטקסט, end = הקצה השמאלי
    const x0 = anchor === 'middle' ? x - w / 2 - px : anchor === 'end' ? x - px : x - w - px;
    r.setAttribute('x', x0.toFixed(1)); r.setAttribute('width', (w + px * 2).toFixed(1));
    r.setAttribute('y', (y - fs * 0.95).toFixed(1)); r.setAttribute('height', (fs * 1.35).toFixed(1));
  });
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const GROUP_LABEL = { toolkit: ['ארגז הכלים', 'איך חושבים'], atlas: ['האטלס', 'על מה חושבים'], collections: ['אוספים', 'חוצי עולמות'] };
const STATE_TEXT = {
  learned: 'נלמד',
  due: 'צריך השקיה',
  open: 'ענף פתוח: אפשר לצמוח לכאן',
  locked: 'נעול: נפתח אחרי בדיקת זיהוי',
  fog: 'בערפל: עוד לא הגעת לכאן',
};
const MIST = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23f)'/%3E%3C/svg%3E";

function nodeRadius(id, st, lv) {
  const base = isFull(id) ? 1.6 : 0;
  if (st === 'learned' || st === 'due') return 5 + lv * 1.7 + base;
  if (st === 'open') return 7 + base;
  if (st === 'locked') return 5.5 + base;
  return 3.6 + base * 0.5;
}

function Roots({ L, D, p, states, faint }) {
  const levelInField = {};
  for (const [id, pos] of Object.entries(L.pos)) levelInField[pos.field] = Math.max(levelInField[pos.field] || 0, levelOf(p, id));
  const seen = new Set();
  const edges = D.edges.filter((e) => {
    const k = [e.from, e.to].sort().join('|');
    if (seen.has(k) || !L.pos[e.from] || !L.pos[e.to]) return false;
    seen.add(k); return true;
  });
  return html`<g class=${faint ? 'layer-faint' : 'layer-clear'}>
    <path class="taproot" d=${smooth(L.tap)} />
    ${L.laterals.map((l) => html`<path class=${l.empty ? 'lateral lateral-empty' : 'lateral'} data-field=${l.field} d=${smooth(l.pts)} style=${`stroke-width:${(l.empty ? 1.4 : 2 + (levelInField[l.field] || 0) * 0.55).toFixed(2)}`} />`)}
    ${!faint && edges.map((e) => {
      const a = L.pos[e.from], b = L.pos[e.to];
      const d = arc(a, b);
      const lit = levelOf(p, e.from) > 0 || levelOf(p, e.to) > 0;
      if (!lit) return null;
      if (e.type === 'twin') return html`<g class=${lit ? 'edge lit' : 'edge'} data-field=${a.field}><path class="e-twin-outer" d=${d} /><path class="e-twin-inner" d=${d} /></g>`;
      return html`<path class=${`edge e-${e.type}${lit ? ' lit' : ''}`} data-field=${a.field} d=${d} />`;
    })}
    ${faint && Object.entries(L.pos).map(([id, pos]) => html`<circle class="fog-node" data-field=${pos.field} cx=${pos.x} cy=${pos.y} r=${isFull(id) ? 5 : 3.6} />`)}
  </g>`;
}

function NodeMark({ id, pos, st, lv, caught, selected }) {
  const r = nodeRadius(id, st, lv);
  const n = node(id);
  return html`<g class=${`nm nm-${st}${selected ? ' nm-sel' : ''}${isFull(id) ? ' nm-full' : ''}`} data-node=${id} data-field=${pos.field} transform=${`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`} role="button" tabindex="0" aria-label=${`${n.he}: ${STATE_TEXT[st]}`}>
    ${st === 'open' && html`<circle class="nm-pulse" r=${r + 3} />`}
    <circle class="nm-hit" r=${Math.max(r + 10, 18)} />
    <circle class="nm-dot" r=${r} />
    ${st === 'locked' && html`<path class="nm-lock" d="M-2.6 -0.6 h5.2 v4 h-5.2 z M-1.6 -0.6 v-1.4 a1.6 1.6 0 0 1 3.2 0 v1.4" />`}
    ${st === 'due' && html`<path class="nm-drop" transform=${`translate(${(r + 3).toFixed(1)} ${(-r - 4).toFixed(1)}) scale(.62)`} d="M0 -9 C5 -3 7 0 7 3 a7 7 0 0 1 -14 0 c0 -3 2 -6 7 -12 z" />`}
    ${caught > 0 && html`<circle class="nm-caught" r=${r + 4.5} />`}
    ${selected && html`<circle class="nm-ring" r=${r + 7} />`}
    ${isFull(id)
      ? html`<g class="nm-stamp" data-stamp="" data-fs="16.5" data-px="9"><rect class="nm-stamp-box" rx="2" /><text class="nm-label" x=${-pos.side * 14} y=${r + 21} text-anchor="middle">${n.he}</text></g>`
      : html`<text class="nm-label" x=${-pos.side * 14} y=${r + 17} text-anchor="middle">${n.he}</text>`}
  </g>`;
}

function Legend({ onClose }) {
  return html`<div class="legend" role="region" aria-label="מקרא">
    <div class="row-between"><strong>מקרא</strong>${onClose && html`<button class="icon-btn" onClick=${onClose} aria-label="סגירת המקרא"><${Icon} name="x" /></button>`}</div>
    <div class="legend-groups">
      ${['toolkit', 'atlas', 'collections'].map((g) => html`<span class="legend-group"><i style=${`background:var(--g-${g})`}></i>${GROUP_LABEL[g][0]}<span class="faint">${GROUP_LABEL[g][1]}</span></span>`)}
    </div>
    <div class="legend-types">${Object.keys(CTYPES).map((t) => html`<span class="legend-type"><${CType} type=${t} /><span class="faint">${CTYPES[t].desc}</span></span>`)}</div>
    <div class="legend-states">
      <span><svg viewBox="0 0 40 16" class="lg-svg"><circle cx="8" cy="8" r="4" class="lg-learned" /><circle cx="26" cy="8" r="7" class="lg-learned" /></svg>עובי לפי עומק</span>
      <span><svg viewBox="0 0 16 16" class="lg-svg lg-small"><circle cx="8" cy="8" r="6" class="lg-due" /></svg>דהוי: צריך השקיה</span>
      <span><svg viewBox="0 0 16 16" class="lg-svg lg-small"><circle cx="8" cy="8" r="6" class="lg-open" /></svg>ענף פתוח</span>
      <span><svg viewBox="0 0 16 16" class="lg-svg lg-small"><circle cx="8" cy="8" r="5.5" class="lg-locked" /></svg>נפתח אחרי בדיקת זיהוי</span>
      <span><svg viewBox="0 0 16 16" class="lg-svg lg-small"><circle cx="8" cy="8" r="6.5" class="lg-caught" /><circle cx="8" cy="8" r="3.5" class="lg-learned" /></svg>נתפס ביומן</span>
    </div>
  </div>`;
}

function NodeSheet({ id, p, st, onClose }) {
  const n = node(id);
  const c = fullOf(id) || cardOf(id);
  const lv = levelOf(p, id);
  const locks = st === 'locked' ? lockedBy(p, id) : [];
  const out = edgesOut(id);
  return html`<${Sheet} title=${n.he} sub=${n.en} onClose=${onClose}>
    <div class="stack">
      <div class="row"><${FieldChip} id=${n.field} long=${true} /><span class="badge">${STATE_TEXT[st]}</span>${isFull(id) ? html`<span class="badge badge-accent">מושג מלא</span>` : html`<span class="badge">כרטיס</span>`}</div>
      ${lv > 0 && html`<${Ladder} level=${lv} fieldId=${n.field} />`}
      ${c && html`<div class="sheet-lead"><${Emblem} id=${id} size="md" /><p class="lead"><${T} text=${c.oneLiner} /></p></div>`}
      ${locks.length > 0 && html`<p class="muted">כדי לפתוח: בדיקת זיהוי של ${locks.map(title).join(' או ')}.</p>`}
      <div class="row">
        ${st !== 'fog' && st !== 'locked' && html`<a class="btn" href=${`#/c/${id}`}><${Icon} name="book" />${lv > 0 ? 'לחזור למושג' : 'ללמוד'}</a>`}
        ${st === 'due' && html`<a class="btn btn-ghost" href="#/water"><${Icon} name="drop" />להשקות</a>`}
        ${locks.length > 0 && html`<a class="btn btn-ghost" href=${`#/check/${locks[0]}`}><${Icon} name="unlock" />לבדיקת הזיהוי</a>`}
        ${st === 'fog' && html`<a class="btn btn-ghost" href=${`#/c/${id}`}><${Icon} name="eye" />להציץ בכל זאת</a>`}
      </div>
      ${out.length > 0 && html`<div>
        <span class="label">לאן השורש מתפצל מכאן</span>
        <div class="conn-list">${out.map((e) => html`<a class="conn" href=${`#/bridge/${id}/${e.to}`} data-field=${node(e.to).field}>
          <${CType} type=${e.type} /><span class="conn-name">${title(e.to)}</span>${e.label && html`<span class="faint conn-label">${e.label}</span>`}<${Icon} name="next" />
        </a>`)}</div>
      </div>`}
    </div>
  </${Sheet}>`;
}

export function MapScreen({ ctx, focus }) {
  const { state, p } = ctx;
  const D = data();
  const L = useMemo(() => layout(D), [D]);
  const seedIds = seeds(state.interests);
  const states = {};
  for (const n of D.nodes) states[n.id] = nodeState(p, n.id, seedIds);
  const [sel, setSel] = useState(null);
  const [legend, setLegend] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const wrap = useRef(null), svgRef = useRef(null), gRef = useRef(null);
  const view = useRef({ k: 0.8, x: 0, y: 0, init: false });

  const apply = () => {
    const v = view.current;
    if (gRef.current) gRef.current.setAttribute('transform', `translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) scale(${v.k.toFixed(3)})`);
    if (svgRef.current) svgRef.current.dataset.zoom = v.k < 0.5 ? 'far' : 'near';
  };
  const zoomAt = (factor, cx, cy) => {
    const v = view.current;
    const k = clamp(v.k * factor, 0.2, 2.4);
    const f = k / v.k;
    v.x = cx - (cx - v.x) * f; v.y = cy - (cy - v.y) * f; v.k = k; apply();
  };
  const centerOn = (wx, wy, k) => { const v = view.current; v.k = k; v.x = size.w / 2 - wx * k; v.y = size.h / 2 - wy * k; apply(); };
  const fitAll = () => {
    const b = L.bounds;
    const k = Math.min(size.w / (b.x1 - b.x0), size.h / (b.y1 - b.y0)) * 0.96;
    centerOn((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, k);
  };
  const focusDefault = () => {
    const ids = focus && L.pos[focus] ? [focus] : Object.keys(states).filter((id) => states[id] !== 'fog' && states[id] !== 'locked');
    const pts = (ids.length ? ids : seedIds).map((id) => L.pos[id]).filter(Boolean);
    const cx = pts.reduce((s, q) => s + q.x, 0) / (pts.length || 1);
    const cy = pts.reduce((s, q) => s + q.y, 0) / (pts.length || 1);
    centerOn(cx, Math.max(cy, 160), size.w < 640 ? 0.82 : 0.95);
  };

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!size.w) return;
    if (!view.current.init) { view.current.init = true; focusDefault(); } else apply();
  }, [size.w, size.h]);
  useEffect(() => { if (sel === null && focus && L.pos[focus] && view.current.init) focusDefault(); }, [focus]);
  useEffect(() => {
    fitStamps(svgRef.current);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitStamps(svgRef.current));
  });

  // הזזה וזום: אצבע אחת מזיזה, שתיים מגדילות, גלגלת מגדילה סביב הסמן
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const pts = new Map();
    let moved = 0, multi = false;
    const local = (e) => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e) => { pts.set(e.pointerId, local(e)); if (pts.size === 1) { moved = 0; multi = false; } else multi = true; try { svg.setPointerCapture(e.pointerId); } catch (_) {} };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId), cur = local(e);
      if (pts.size === 1) {
        const v = view.current; v.x += cur.x - prev.x; v.y += cur.y - prev.y; apply();
        moved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.entries()].map(([pid, q]) => (pid === e.pointerId ? cur : q));
        const [a0, b0] = [...pts.values()];
        const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1, d1 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        zoomAt(d1 / d0, (a.x + b.x) / 2, (a.y + b.y) / 2);
        moved += 20;
      }
      pts.set(e.pointerId, cur);
    };
    const up = (e) => {
      const was = pts.size;
      pts.delete(e.pointerId);
      if (was === 1 && !multi && moved < 8) {
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const g = hit && hit.closest ? hit.closest('[data-node]') : null;
        if (g) setSel(g.getAttribute('data-node'));
      }
    };
    const wheel = (e) => { e.preventDefault(); const q = local(e); zoomAt(Math.exp(-e.deltaY * 0.0016), q.x, q.y); };
    const key = (e) => { const g = e.target.closest && e.target.closest('[data-node]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSel(g.getAttribute('data-node')); } };
    // Tab לצומת שמחוץ לאזור הנראה: המפה זזה אליו באותו זום. אחרת הפוקוס יושב על צומת שלא רואים.
    // האזור הנראה לא כולל את סרגל הכלים למעלה ואת קנה המידה והמצפן למטה
    const focusIn = (e) => {
      const g = e.target.closest && e.target.closest('[data-node]');
      const q = g && L.pos[g.getAttribute('data-node')];
      if (!q) return;
      const v = view.current, r = svg.getBoundingClientRect();
      const bar = wrap.current && wrap.current.querySelector('.map-toolbar');
      const top = (bar ? bar.getBoundingClientRect().bottom - r.top : 0) + 24;
      const bottom = r.height - 90;
      const sx = v.x + q.x * v.k, sy = v.y + q.y * v.k;
      if (sx < 32 || sx > r.width - 32 || sy < top || sy > bottom) {
        v.x = r.width / 2 - q.x * v.k;
        v.y = (top + bottom) / 2 - q.y * v.k;
        apply();
      }
      // הדפדפן גולל אל מה שקיבל פוקוס גם בתוך מכל עם overflow מוסתר, וזה מזיז את כל המפה
      const w = wrap.current;
      if (w && (w.scrollTop || w.scrollLeft)) { w.scrollTop = 0; w.scrollLeft = 0; }
    };
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', wheel, { passive: false });
    svg.addEventListener('keydown', key);
    svg.addEventListener('focusin', focusIn);
    return () => {
      svg.removeEventListener('pointerdown', down); svg.removeEventListener('pointermove', move);
      svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', up);
      svg.removeEventListener('wheel', wheel); svg.removeEventListener('keydown', key);
      svg.removeEventListener('focusin', focusIn);
    };
  }, [size.w]);

  const b = L.bounds;
  const reveal = Object.entries(states).filter(([, s]) => s !== 'fog').map(([id, s]) => ({ ...L.pos[id], r: s === 'learned' || s === 'due' ? 175 : 125 }));
  const learnedCount = Object.values(states).filter((s) => s === 'learned' || s === 'due').length;
  const openCount = Object.values(states).filter((s) => s === 'open').length;
  const dueCount = Object.values(states).filter((s) => s === 'due').length;
  const W = b.x1 - b.x0, H = b.y1 - b.y0;

  return html`<div class="map-screen">
    <div class="map-wrap" ref=${wrap}>
      <svg class="map-svg" ref=${svgRef} width=${size.w} height=${size.h} viewBox=${`0 0 ${size.w || 1} ${size.h || 1}`} role="application" aria-label="מפת השורשים">
        <defs>
          <radialGradient id="rv"><stop offset="0" stop-color="#fff" /><stop offset="0.5" stop-color="#fff" stop-opacity="0.92" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
          <radialGradient id="rvi"><stop offset="0" stop-color="#000" /><stop offset="0.5" stop-color="#000" stop-opacity="0.92" /><stop offset="1" stop-color="#000" stop-opacity="0" /></radialGradient>
          <mask id="reveal" maskUnits="userSpaceOnUse" x=${b.x0 - 300} y=${b.y0 - 300} width=${W + 600} height=${H + 600}>
            <rect x=${b.x0 - 300} y=${b.y0 - 300} width=${W + 600} height=${H + 600} fill="#000" />
            <circle cx="0" cy="40" r="190" fill="url(#rv)" />
            ${reveal.map((q) => html`<circle cx=${q.x} cy=${q.y} r=${q.r} fill="url(#rv)" />`)}
          </mask>
          <mask id="fogmask" maskUnits="userSpaceOnUse" x=${b.x0 - 300} y=${b.y0 - 300} width=${W + 600} height=${H + 600}>
            <rect x=${b.x0 - 300} y=${b.y0 - 300} width=${W + 600} height=${H + 600} fill="#fff" />
            <circle cx="0" cy="40" r="190" fill="url(#rvi)" />
            ${reveal.map((q) => html`<circle cx=${q.x} cy=${q.y} r=${q.r} fill="url(#rvi)" />`)}
          </mask>
          <pattern id="mist" patternUnits="userSpaceOnUse" width="520" height="520"><image href=${MIST} width="520" height="520" preserveAspectRatio="none" /></pattern>
        </defs>
        <g ref=${gRef}>
          <g class="strata">
            <${Strata} x0=${b.x0 - 700} x1=${b.x1 + 700} amp=${12} seed=${0.13}
              layers=${L.strata.map((s, i) => ({ y0: i === 0 ? 18 : s.y0, y1: i === L.strata.length - 1 ? s.y1 + 700 : s.y1, n: i + 1 }))} />
            ${L.strata.map((s, i) => {
              const y = (i === 0 ? 18 : s.y0) + 46;
              return html`<g class=${`stratum-tag st-tag-${i + 1}`}>
                <g data-stamp="" data-fs="28" data-px="14"><rect class="stratum-box" rx="2" /><text class="stratum-label" x=${b.x1 + 20} y=${y} text-anchor="end">${GROUP_LABEL[s.group][0]}</text></g>
                <text class="stratum-sub" x=${b.x1 + 20} y=${y + 30} text-anchor="end">${GROUP_LABEL[s.group][1]}</text>
              </g>`;
            })}
          </g>
          <${Roots} L=${L} D=${D} p=${p} states=${states} faint=${true} />
          <rect class="mist" x=${b.x0 - 300} y=${b.y0 - 300} width=${W + 600} height=${H + 600} fill="url(#mist)" mask="url(#fogmask)" />
          <g mask="url(#reveal)"><${Roots} L=${L} D=${D} p=${p} states=${states} faint=${false} /></g>
          <${Sprout} x=${0} y=${18} s=${1.4} />
          ${L.laterals.map((l) => html`<text class=${l.empty ? 'field-label field-label-empty' : 'field-label'} data-field=${l.field} x=${l.end[0] + l.side * 14} y=${l.end[1] + 30} text-anchor="middle">${field(l.field).short}${l.empty ? ' · בקרוב' : ''}</text>`)}
          <g class="marks">${Object.entries(L.pos).filter(([id]) => states[id] !== 'fog').map(([id, pos]) => html`<${NodeMark} id=${id} pos=${pos} st=${states[id]} lv=${levelOf(p, id)} caught=${caughtCount(p, id)} selected=${sel === id} />`)}</g>
        </g>
      </svg>

      <div class="map-toolbar">
        <div class="map-title">
          <h1>מפת השורשים</h1>
          <span class="faint">${learnedCount} מושגים בשורשים · ${openCount} ענפים פתוחים${dueCount ? ` · ${dueCount} צריכים השקיה` : ''}</span>
        </div>
        <div class="map-tools">
          <label class="map-demo"><input type="checkbox" checked=${state.demo} onChange=${(e) => store.update((s) => { s.demo = e.target.checked; })} /><span class="track"></span><span>אחרי חודש</span></label>
          <button class="icon-btn" onClick=${() => zoomAt(1.25, size.w / 2, size.h / 2)} aria-label="הגדלה"><${Icon} name="plus" /></button>
          <button class="icon-btn" onClick=${() => zoomAt(0.8, size.w / 2, size.h / 2)} aria-label="הקטנה"><${Icon} name="minus" /></button>
          <button class="icon-btn" onClick=${fitAll} aria-label="כל המפה"><${Icon} name="crosshair" /></button>
          <button class="icon-btn" onClick=${() => setLegend(!legend)} aria-pressed=${String(legend)} aria-label="מקרא"><${Icon} name="info" /></button>
        </div>
      </div>
      ${legend && html`<${Legend} onClose=${() => setLegend(false)} />`}
      <div class="map-deco" aria-hidden="true"><${ScaleBar} /><${Compass} size=${48} /></div>
    </div>
    ${sel && html`<${NodeSheet} id=${sel} p=${p} st=${states[sel]} onClose=${() => setSel(null)} />`}
  </div>`;
}

// רכיבי האטלס (D-19): מרקמי הקרקע, שכבות עם גבול גלי, מצפן, סרגל קנה מידה, נבט, ומחולל שורשים.
// כל הצבעים מגיעים מ־CSS (tokens.css), כך שהכול עובד בבהיר ובכהה בלי קוד נוסף.
import { html } from './vendor/standalone.module.js';
import { hash01 } from './maplayout.js';

// התבניות מוגדרות פעם אחת במסגרת האפליקציה, וכל SVG בעמוד משתמש בהן דרך url(#id).
// לא display:none: בחלק מהדפדפנים תבנית בתוך SVG מוסתר לא מצוירת.
export function AtlasDefs() {
  return html`<svg class="atlas-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <pattern id="pt-hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(-35)">
        <line class="pt-hatch" x1="0" y1="0" x2="0" y2="9" />
      </pattern>
      <pattern id="pt-dots" patternUnits="userSpaceOnUse" width="14" height="12">
        <circle class="pt-dot" cx="3" cy="3" r="1.25" /><circle class="pt-dot" cx="10" cy="9" r="1.05" />
      </pattern>
      <pattern id="pt-gravel" patternUnits="userSpaceOnUse" width="34" height="26">
        <ellipse class="pt-stone" cx="6" cy="6" rx="3.2" ry="2.2" /><ellipse class="pt-stone" cx="22" cy="5" rx="2" ry="1.5" />
        <ellipse class="pt-stone" cx="15" cy="16" rx="3.8" ry="2.5" /><ellipse class="pt-stone" cx="29" cy="20" rx="2.4" ry="1.7" />
        <circle class="pt-grain" cx="10" cy="22" r="0.9" /><circle class="pt-grain" cx="27" cy="12" r="0.8" />
      </pattern>
      <pattern id="pt-stipple" patternUnits="userSpaceOnUse" width="16" height="16">
        <circle class="pt-grain" cx="2" cy="3" r="0.8" /><circle class="pt-grain" cx="9" cy="1" r="0.6" /><circle class="pt-grain" cx="13" cy="8" r="0.8" />
        <circle class="pt-grain" cx="5" cy="11" r="0.7" /><circle class="pt-grain" cx="11" cy="14" r="0.6" />
      </pattern>
      <pattern id="pt-grid" patternUnits="userSpaceOnUse" width="20" height="20">
        <path class="pt-grid" d="M20 0H0V20" />
      </pattern>
    </defs>
  </svg>`;
}

// מחולל מספרים יציב: אותו מזהה, אותה צורה, בכל טעינה
export function rng(seedStr) {
  let a = Math.floor(hash01(String(seedStr)) * 4294967295) || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// עקומה חלקה דרך נקודות (Catmull-Rom ל־Bezier). move=false מחזיר רק את הקטעים, להמשך מסלול קיים.
export function curve(pts, move = true) {
  if (!pts.length) return '';
  let d = move ? `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` : `L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// גבול שכבה גלי לאורך x
export function wavy(x0, x1, y, amp, seed, step = 48) {
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) {
    const t = x / 170;
    pts.push([Math.min(x, x1), y + amp * (Math.sin(t + seed * 6.28) * 0.7 + Math.sin(t * 2.3 + seed * 3.1) * 0.3)]);
  }
  return pts;
}

const TEX = { 1: 'pt-hatch', 2: 'pt-dots', 3: 'pt-gravel' };

// שכבות קרקע: [{ y0, y1, n: 1|2|3 }] מלמעלה למטה. הגבול העליון של כל שכבה גלי.
export function Strata({ x0, x1, layers, amp = 6, seed = 0.3, surface = true }) {
  const edges = layers.map((l, i) => wavy(x0, x1, l.y0, i === 0 ? amp * 0.5 : amp, seed + i * 0.37));
  return html`<g class="strata-g">
    ${layers.map((l, i) => {
      const top = edges[i];
      const bottom = i + 1 < layers.length ? edges[i + 1] : [[x0, l.y1], [x1, l.y1]];
      const d = curve(top) + ' ' + curve(bottom.slice().reverse(), false) + ' Z';
      return html`<g class=${`st st-${l.n}`}>
        <path class="st-band" d=${d} />
        <path class="st-tex" d=${d} fill=${`url(#${TEX[l.n]})`} />
        <path class=${i === 0 && surface ? 'st-surface' : 'st-edge'} d=${curve(top)} />
      </g>`;
    })}
  </g>`;
}

// שורש פרוצדורלי: שורש מרכזי שיורד לעומק נתון ומתפצל. מחזיר מסלולים עם עובי.
export function growRoot(seedStr, x, y, depth, width = 3.2, spreadX = 1) {
  const r = rng(seedStr);
  const out = [];
  const branch = (bx, by, ang, len, w, gen) => {
    const pts = [[bx, by]];
    let cx = bx, cy = by, a = ang;
    const steps = Math.max(3, Math.round(len / 16));
    for (let i = 0; i < steps; i++) {
      a += (r() - 0.5) * 0.55;
      a = a * 0.82 + (Math.PI / 2) * 0.18;              // נמשך מטה, כמו שורש אמיתי
      cx += Math.cos(a) * (len / steps) * spreadX;
      cy += Math.sin(a) * (len / steps);
      pts.push([cx, cy]);
      if (gen < 3 && i > 0 && i < steps - 1 && r() < 0.5) {
        const side = r() < 0.5 ? -1 : 1;
        branch(cx, cy, a + side * (0.7 + r() * 0.55), len * (0.32 + r() * 0.22), w * 0.55, gen + 1);
      }
    }
    out.push({ d: curve(pts), w, gen, pts, end: pts[pts.length - 1], mid: pts[Math.floor(pts.length / 2)] });
  };
  branch(x, y, Math.PI / 2, depth, width, 0);
  return out;
}

// נבט קטן מעל פני הקרקע
export function Sprout({ x, y, s = 1 }) {
  return html`<g class="sprout" transform=${`translate(${x} ${y}) scale(${s})`}>
    <path class="sp-stem" d="M0 0 C0 -7 0 -13 0 -19" />
    <path class="sp-leaf" d="M0 -12 C-3 -20 -11 -23 -18 -20 C-14 -13 -6 -10 0 -12 Z" />
    <path class="sp-leaf" d="M0 -16 C3 -24 11 -27 18 -24 C14 -17 6 -14 0 -16 Z" />
  </g>`;
}

// מצפן. "צ" מסמן צפון.
export function Compass({ size = 46, cls = '' }) {
  return html`<svg class=${`compass ${cls}`} viewBox="-24 -24 48 48" width=${size} height=${size} aria-hidden="true">
    <circle class="cp-ring" r="16" /><circle class="cp-ring cp-in" r="12.5" />
    <path class="cp-tick" d="M0 -16v3M0 16v-3M16 0h-3M-16 0h3" />
    <path class="cp-star" d="M0 -14 L2.6 -2.6 L0 0 L-2.6 -2.6 Z" />
    <path class="cp-star-o" d="M0 14 L2.6 2.6 L0 0 L-2.6 2.6 Z M14 0 L2.6 -2.6 L0 0 L2.6 2.6 Z M-14 0 L-2.6 -2.6 L0 0 L-2.6 2.6 Z" />
    <text class="cp-n" y="-18.5" text-anchor="middle">צ</text>
  </svg>`;
}

// סרגל קנה מידה (קישוט בלבד)
export function ScaleBar({ cls = '' }) {
  return html`<svg class=${`scalebar ${cls}`} viewBox="0 0 122 12" width="122" height="12" aria-hidden="true">
    <rect class="sb-frame" x="1" y="3" width="120" height="6" />
    <rect class="sb-fill" x="1" y="3" width="30" height="6" /><rect class="sb-fill" x="61" y="3" width="30" height="6" />
    <path class="sb-tick" d="M1 1v10M31 2v8M61 1v10M91 2v8M121 1v10" />
  </svg>`;
}

// סמני קואורדינטות על שולי מסגרת (קישוט)
export function Ticks({ w, h, every = 50 }) {
  const xs = [];
  for (let x = every; x < w; x += every) xs.push(x);
  const ys = [];
  for (let y = every; y < h; y += every) ys.push(y);
  return html`<g class="frame-ticks">
    ${xs.map((x) => html`<path d=${`M${x} 0v5M${x} ${h}v-5`} />`)}
    ${ys.map((y) => html`<path d=${`M0 ${y}h5M${w} ${y}h-5`} />`)}
  </g>`;
}

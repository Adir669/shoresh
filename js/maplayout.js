// פריסת מפת השורשים: שורש ראשי שיורד מהזרע, ושורש צד לכל תחום, לסירוגין ימינה ושמאלה.
// הקבוצות הן שכבות אדמה: ארגז הכלים למעלה, האטלס באמצע, האוספים בעומק.
export const ORDER = ['biases', 'fallacies', 'statistics', 'decisions', 'games', 'models', 'rhetoric',
  'philosophy', 'economics', 'science', 'history', 'psychology', 'politics', 'cultures',
  'effects', 'laws', 'expressions', 'paradoxes'];
const SPACING = 116;
const TOP = 96;
const STEP = 6;
const angle = (t) => 0.27 + 0.0008 * t; // שורש צד מתחיל כמעט אופקי ונוטה למטה עם המרחק

export function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export function layout(D) {
  const byField = {};
  D.nodes.forEach((n) => (byField[n.field] ||= []).push(n));
  const pos = {};
  const laterals = [];
  const tap = [[0, 18]];
  ORDER.forEach((fid, i) => {
    const side = i % 2 === 0 ? 1 : -1; // 1 = ימינה (תחילת השורה בעברית)
    const y0 = TOP + i * SPACING;
    const x0 = Math.sin(y0 / 230) * 14;
    tap.push([x0, y0]);
    const list = (byField[fid] || []).slice().sort((a, b) => (a.tier === b.tier ? 0 : a.tier === 'full' ? -1 : 1));
    const length = list.length ? 64 + (list.length - 1) * 92 + 46 : 86;
    const samples = [];
    let x = x0, y = y0;
    for (let t = 0; t <= length; t += STEP) {
      samples.push([x, y]);
      const a = angle(t);
      x += side * Math.cos(a) * STEP;
      y += Math.sin(a) * STEP;
    }
    const nodeIds = [];
    list.forEach((nd, k) => {
      const tk = 64 + k * 92 + (hash01(nd.id) - 0.5) * 22;
      const s = samples[Math.max(0, Math.min(samples.length - 1, Math.round(tk / STEP)))];
      pos[nd.id] = { x: s[0], y: s[1], field: fid, side, k };
      nodeIds.push(nd.id);
    });
    laterals.push({ field: fid, side, i, empty: !list.length, pts: samples.filter((_, j) => j % 2 === 0 || j === samples.length - 1), end: samples[samples.length - 1], nodeIds });
  });
  const last = tap[tap.length - 1];
  tap.push([last[0] * 0.5, last[1] + 120]);
  const xs = Object.values(pos).map((p) => p.x).concat(laterals.map((l) => l.end[0]));
  const ys = Object.values(pos).map((p) => p.y).concat(tap.map((t) => t[1]));
  const bounds = { x0: Math.min(...xs) - 90, x1: Math.max(...xs) + 90, y0: -40, y1: Math.max(...ys) + 70 };
  // שכבות האדמה: גבולות הקבוצות לאורך השורש הראשי
  const strata = [
    { group: 'toolkit', y0: bounds.y0, y1: TOP + 6.5 * SPACING },
    { group: 'atlas', y0: TOP + 6.5 * SPACING, y1: TOP + 13.5 * SPACING },
    { group: 'collections', y0: TOP + 13.5 * SPACING, y1: bounds.y1 },
  ];
  return { pos, laterals, tap, bounds, strata };
}

// מסלול חלק (Catmull-Rom ל־Bezier)
export function smooth(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// קשר חוצה: קשת שנוטה למטה, כמו שורש
export function arc(a, b) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist, ny = dx / dist;
  if (ny < 0) { nx = -nx; ny = -ny; }
  const bend = Math.min(140, dist * 0.2);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${(mx + nx * bend).toFixed(1)} ${(my + ny * bend).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

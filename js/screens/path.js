// מסך הבית (D-21): המסלול. שורש אחד שיורד דרך שכבות הקרקע, שלב לכל מושג מלא,
// ותחנה נוכחית אחת עם כפתור אחד: להמשיך. השקיה שהגיע זמנה קודמת לתחנה.
// הקואורדינטות של השורש ושל התחנות פיזיות (כמו ב־SVG), באחוזים מרוחב המסלול, ולכן left ולא תכונות לוגיות.
import { html, useState, useEffect, useRef } from '../vendor/standalone.module.js';
import { node, title, levelInfo, POINTS } from '../data.js';
import { stations, stages, nextAction, stationName, stationDesc, stationSub, stationShort, minutesOf, hrefOf, KINDS, hasStamp, stampStats } from '../course.js';
import { Icon } from '../icons.js';
import { FieldChip, Emblem, LevelBadge, Bar, Sheet, Empty, fmtToday } from '../ui.js';
import { Sprout } from '../atlas.js';

const W = 340;                                   // רוחב המסלול ביחידות של ה־SVG
const HEAD = 128;                                // גובה האזור של תווית השלב
const FIRST = HEAD + 70;                         // מרכז התחנה הראשונה
const RH = 114;                                  // מרווח בין תחנות (התווית "להתחיל" מתחת לתחנה הנוכחית לא נוגעת בבאה)
const OFF = [0, 54, 84, 54, 0, -54, -84, -54];   // היסט אופקי: השורש מתפתל
const TEX = ['pt-hatch', 'pt-dots', 'pt-gravel'];
const STATE_HE = { done: 'הושלמה', current: 'התחנה הנוכחית', locked: 'נעולה', soon: 'בבדיקת עובדות' };

const f1 = (n) => n.toFixed(1);
const pct = (x) => `${((x + W / 2) / W * 100).toFixed(2)}%`;
// Catmull-Rom ל־Bezier, קטע אחרי קטע (כמו curve ב־atlas.js), כדי שהחלק שכבר נחפר יעבור בדיוק על השורש המלא
function segs(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    out.push(`C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`);
  }
  return out;
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

function StationNode({ s, x, y, onPick }) {
  const k = KINDS[s.kind];
  // בכרטיסים הכיתוב קצר; השמות עצמם בגיליון התחנה ובמסך התחנה. התווית הנגישה מתחילה בכיתוב הגלוי (WCAG 2.5.3)
  const short = s.kind === 'cards' ? `כרטיסים · ${s.cards.length}` : stationName(s);
  const cap = s.state === 'current' ? `להתחיל: ${short}` : short;
  return html`<button class=${`node node-${s.state}`} data-sid=${s.sid} data-kind=${s.kind} style=${`left:${pct(x)};top:${y}px`}
    aria-label=${`${cap} · ${stationSub(s)} · ${STATE_HE[s.state]}`} onClick=${() => onPick(s)}>
    <span class="node-disc"><${Icon} name=${s.state === 'locked' ? 'lock' : k.icon} /></span>
    ${s.state === 'done' && html`<span class="node-tick"><${Icon} name="check" /></span>`}
    <span class="node-cap">${cap}</span>
  </button>`;
}

function Stage({ st, i, list, frontier, p, onPick }) {
  const own = list.filter((s) => s.stage === i);
  const n = own.length;
  const done = own.filter((s) => s.state === 'done').length;
  const pts = own.map((s, k) => [OFF[k % OFF.length], FIRST + k * RH]);
  const sealY = FIRST + (n - 1) * RH + 132;
  const H = sealY + 118;
  const all = [[0, 0], [0, HEAD], ...pts, [0, sealY], [0, H]];
  const S = segs(all);
  // החלק שכבר נחפר: שלב שלפני התחנה הנוכחית כולו, ובשלב הנוכחי עד התחנה הנוכחית (כולל)
  let dug = 0;
  if (frontier < 0 || i < frontier.stage) dug = S.length;
  else if (i === frontier.stage) dug = own.indexOf(frontier.s) + 2;
  const nd = node(st.concept);
  const stamp = hasStamp(p, st.concept);
  return html`<section class=${`stage st-${(i % 3) + 1}`} data-field=${nd.field} aria-labelledby=${`stage-${i}`}>
    ${i > 0 && html`<svg class="stage-edge" viewBox="0 0 400 16" preserveAspectRatio="none" aria-hidden="true"><path class="stage-lip" d="M0 9 C40 3 80 3 120 8 S200 15 250 9 S340 2 400 8 V16 H0 Z" /><path class="st-edge" d="M0 9 C40 3 80 3 120 8 S200 15 250 9 S340 2 400 8" /></svg>`}
    <svg class="stage-tex" aria-hidden="true"><rect width="100%" height="100%" fill=${`url(#${TEX[i % 3]})`} /></svg>
    <div class="stage-track" style=${`height:${H}px`}>
      <svg class="stage-root" viewBox=${`${-W / 2} 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path class="root-way" d=${`M0 0 ${S.join(' ')}`} />
        ${dug > 0 && html`<path class="root-dug" d=${`M0 0 ${S.slice(0, dug).join(' ')}`} />`}
      </svg>
      <header class="stage-head" data-field=${nd.field}>
        <span class="stage-kicker">שלב ${i + 1} · <span class="num">${done} מתוך ${n}</span></span>
        <h2 id=${`stage-${i}`}>${title(st.concept)}</h2>
        <${FieldChip} id=${nd.field} />
      </header>
      ${own.map((s, k) => html`<${StationNode} s=${s} x=${pts[k][0]} y=${pts[k][1]} onPick=${onPick} />`)}
      <div class=${`stage-seal${stamp ? ' is-earned' : ''}`} style=${`top:${sealY}px`}>
        <span class="seal-ring"><${Emblem} id=${st.concept} size="md" locked=${!stamp} /></span>
        <span class="seal-cap">${stamp ? `החותמת של ${title(st.concept)}` : 'החותמת נפתחת במבחן השלב'}</span>
      </div>
    </div>
  </section>`;
}

// הצעד הבא, בשני מקומות: כפתור דביק בטלפון, וכרטיס בצד במחשב. אותו תוכן, אותו קישור.
function nextCopy(next) {
  if (next.kind === 'water') {
    const n = next.due.length;
    return { icon: 'drop', kicker: 'קודם השקיה קצרה', title: `${n} ${n === 1 ? 'מושג מתחיל' : 'מושגים מתחילים'} להישכח`, bar: `השקיה קצרה: ${n === 1 ? 'מושג אחד' : `${n} מושגים`}`, sub: next.cur ? `אחר כך: ${stationName(next.cur)} · ${title(next.cur.concept)}` : 'כ־2 דקות', cta: 'להשקות' };
  }
  if (next.kind === 'station') {
    const s = next.cur;
    return { icon: KINDS[s.kind].icon, kicker: `שלב ${s.stage + 1} · ${title(s.concept)}`, title: stationName(s), bar: `להמשיך: ${stationName(s)}`, sub: `${stationSub(s)} · כ־${minutesOf(s)} דק׳`, short: `${stationShort(s)} · כ־${minutesOf(s)} דק׳`, cta: 'להמשיך' };
  }
  return { icon: 'medal', kicker: 'סוף המסלול בסקיצה', title: 'עברת את כל השלבים', bar: 'עברת את כל השלבים', sub: 'שלבים חדשים ייכנסו עם המושגים הבאים.', cta: 'למפה' };
}

function NextCard({ next }) {
  const c = nextCopy(next);
  const href = next.kind === 'end' ? '#/map' : next.href;
  return html`<div class="next-card" data-kind=${next.kind}>
    <span class="kicker"><${Icon} name=${c.icon} />${c.kicker}</span>
    <strong class="next-title">${c.title}</strong>
    <span class="muted">${c.sub}</span>
    <a class="btn btn-block path-go" href=${href}>${c.cta}<${Icon} name="next" /></a>
  </div>`;
}

function NextBar({ next }) {
  const c = nextCopy(next);
  const href = next.kind === 'end' ? '#/map' : next.href;
  return html`<a class="path-go-bar" data-kind=${next.kind} href=${href}>
    <span class="go-icon"><${Icon} name=${c.icon} /></span>
    <span class="go-text"><strong>${c.bar}</strong><span>${c.short || c.sub}</span></span>
    <span class="go-arrow"><${Icon} name="next" /></span>
  </a>`;
}

function StationSheet({ s, cur, p, onClose }) {
  const k = KINDS[s.kind];
  const go = s.state === 'current' || s.state === 'done';
  return html`<${Sheet} title=${stationName(s)} sub=${`שלב ${s.stage + 1} · ${title(s.concept)}`} onClose=${onClose}>
    <div class="stack station-sheet">
      <div class="st-lead"><span class="st-icon" data-state=${s.state}><${Icon} name=${k.icon} /></span><p>${stationDesc(s)}</p></div>
      ${s.kind === 'cards' && html`<ul class="st-cards">${s.cards.filter((x) => node(x)).map((x) => html`<li><${Emblem} id=${x} size="sm" locked=${!hasStamp(p, x)} /><span>${title(x)}</span></li>`)}</ul>`}
      ${s.kind === 'test' && html`<div class="st-cards"><${Emblem} id=${s.concept} size="sm" locked=${!hasStamp(p, s.concept)} /><span>${hasStamp(p, s.concept) ? 'החותמת כבר באוסף שלך.' : `מי שעובר מקבל לאוסף את החותמת של ${title(s.concept)}.`}</span></div>`}
      <p class="faint num">כ־${minutesOf(s)} דקות · ${STATE_HE[s.state]}</p>
      ${go ? html`<a class=${s.state === 'current' ? 'btn btn-block' : 'btn btn-ghost btn-block'} href=${hrefOf(s)} onClick=${onClose}>${s.state === 'current' ? 'להתחיל' : 'לחזור על התחנה'}<${Icon} name="next" /></a>`
        : s.state === 'soon' ? html`<p class="muted">התחנה תיפתח כשהתוכן שלה יעבור בדיקת עובדות.</p>`
          : html`<div class="stack"><p class="muted">התחנה נפתחת אחרי התחנות שלפניה. ככה כל שלב נבנה על הקודם.</p>${cur && html`<a class="btn btn-ghost btn-block" href=${hrefOf(cur)} onClick=${onClose}>לתחנה הנוכחית: ${stationName(cur)}</a>`}</div>`}
    </div>
  </${Sheet}>`;
}

export function PathScreen({ ctx }) {
  const { p, openSheet } = ctx;
  const st = stages();
  const list = stations(p);
  const next = nextAction(p, list);
  const lv = levelInfo(p.points || 0);
  const ss = stampStats(p);
  const [pick, setPick] = useState(null);
  const ref = useRef(null);
  const curS = list.find((s) => s.state === 'current') || null;
  const frontier = curS ? { stage: curS.stage, s: curS } : -1;
  // התחנה הנוכחית צריכה להיראות בלי לחפש: אם היא מתחת לקו המסך, גוללים אליה
  useEffect(() => {
    const el = ref.current && ref.current.querySelector('.node-current');
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight - 190) el.scrollIntoView({ block: 'center' });
  }, []);
  if (!st.length) return html`<${Empty} ill="mo-review" title="המסלול עוד לא מוכן"><span>הוא ייבנה מהמושגים שעברו את שער האימות.</span></${Empty}>`;
  const started = list.some((s) => s.state === 'done');
  return html`<div class="path" ref=${ref}>
    <header class="path-head">
      <div class="path-hello"><span class="faint">${fmtToday()}</span><h1>${greeting()}</h1></div>
      <a class="path-stats" href="#/progress" aria-label=${`רמה ${lv.n}, ${p.points || 0} נקודות, ${ss.have} מתוך ${ss.total} חותמות. לפרטים במסך ההתקדמות`}>
        <span class="ps-level"><${LevelBadge} n=${lv.n} size="sm" /><span class="ps-lv-body"><strong>רמה ${lv.n}</strong><${Bar} value=${lv.into} max=${lv.span} label=${`התקדמות לרמה ${lv.n + 1}`} /></span></span>
        <span class="ps-item" title="נקודות"><${Icon} name="star" /><strong class="num">${p.points || 0}</strong><span class="faint">נקודות</span></span>
        <span class="ps-item" title="חותמות באוסף"><${Icon} name="medal" /><strong class="num">${ss.have}/${ss.total}</strong><span class="faint">חותמות</span></span>
      </a>
    </header>
    <div class="path-grid">
      <div class="path-track" role="region" aria-label="המסלול">
        <div class="path-surface">
          <span class="surface-cap">${started ? 'השורש שלך יורד מכאן, תחנה אחרי תחנה' : 'כאן השורש מתחיל. כל תחנה מורידה אותו עוד קצת.'}</span>
          <svg class="surface-sprout" viewBox="-26 -28 52 30" width="58" height="34" aria-hidden="true"><${Sprout} x=${0} y=${0} s=${1} /></svg>
        </div>
        ${st.map((s, i) => html`<${Stage} st=${s} i=${i} list=${list} frontier=${frontier} p=${p} onPick=${setPick} />`)}
        <div class="path-end">
          <${Icon} name="medal" />
          <strong>סוף המסלול בסקיצה</strong>
          <span class="muted">שלבים חדשים ייכנסו עם המושגים הבאים. בינתיים: <a href="#/map">המפה</a> לשיטוט חופשי, ו<a href="#/practice">התרגול</a> לסבבים לפי סוג.</span>
        </div>
      </div>
      <aside class="path-side">
        <${NextCard} next=${next} />
        <button class="seen-cta" onClick=${() => openSheet('seen')}>
          <span class="seen-icon"><${Icon} name="eye" /></span>
          <span><strong>ראיתי את זה היום</strong><span class="muted">פגשת מושג בחיים? רשום אותו. זה מה שמקבע אותו, ושווה ${POINTS.seen} נקודות, כמו מבחן שלב.</span></span>
        </button>
      </aside>
    </div>
    <div class="path-cta"><${NextBar} next=${next} /></div>
    ${pick && html`<${StationSheet} s=${pick} cur=${curS} p=${p} onClose=${() => setPick(null)} />`}
  </div>`;
}

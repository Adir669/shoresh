// מסך 2: בית — חתך הקרקע של המשתמש, "לאן עכשיו", השקיה קצרה מול צמיחה ארוכה, "ראיתי את זה היום".
import { html, useRef, useState, useEffect } from '../vendor/standalone.module.js';
import { data, node, title, fullOf, cardOf, suggestions, dueList, levelOf, CTYPES, LEVELS } from '../data.js';
import { Icon } from '../icons.js';
import { FieldChip, fmtToday, fmtDate, fmtRel } from '../ui.js';
import { Strata, growRoot, Sprout, Compass, ScaleBar, Ticks } from '../atlas.js';

function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return w;
}

// חתך הקרקע: כל מושג שנלמד הוא שורש. העומק לפי דרגת העומק, והחותמת מראה שם ודרגה.
// הקואורדינטות פיזיות (שמאל←ימין) כמו ב־SVG, ולכן התוויות ממוקמות ב־left ולא בתכונות לוגיות.
function CrossSection({ anchors }) {
  const ref = useRef(null);
  const W = useWidth(ref) || 900;
  const narrow = W < 620;
  const H = narrow ? 230 : 268;
  const ground = 52;
  const span = H - ground;
  const layers = [
    { y0: ground, y1: ground + span * 0.36, n: 1 },
    { y0: ground + span * 0.36, y1: ground + span * 0.7, n: 2 },
    { y0: ground + span * 0.7, y1: H, n: 3 },
  ];
  const slots = narrow ? [0.8, 0.5, 0.2] : [0.84, 0.62, 0.4, 0.18];
  const list = anchors.slice(0, slots.length);
  // שתי שורות של חותמות לסירוגין, כדי ששכנות לא יתנגשו. כל חותמת נוטה לצד השמאלי, חוץ מהשורש השמאלי ביותר
  const rows = narrow ? [0.22, 0.5, 0.78] : [0.3, 0.62];
  const roots = list.map((a, i) => {
    const x = slots[i] * W;
    const depth = Math.min(span - 16, a.lv ? 70 + a.lv * 30 : 46);
    const paths = growRoot(a.id, x, ground, depth, a.lv ? 3.4 : 2.4, narrow ? 0.7 : 1);
    const main = paths.find((q) => q.gen === 0) || paths[0];
    const wantY = ground + span * rows[narrow ? i : i % 2];
    const pin = main.pts.reduce((best, pt) => (Math.abs(pt[1] - wantY) < Math.abs(best[1] - wantY) ? pt : best), main.pts[0]);
    const toLeft = slots[i] > 0.3;
    return { a, x, paths, pin, toLeft };
  });
  return html`<div class="xsec corners" ref=${ref}>
    <svg class="xsec-svg" viewBox=${`0 0 ${W} ${H}`} width=${W} height=${H} aria-hidden="true">
      <${Strata} x0=${0} x1=${W} layers=${layers} amp=${5} seed=${0.21} />
      <${Ticks} w=${W} h=${H} every=${60} />
      ${roots.map((r) => html`<g class=${r.a.lv ? 'xroot' : 'xroot xroot-seed'} data-field=${node(r.a.id).field}>
        ${r.paths.map((q) => html`<path class=${`xr xr-${Math.min(q.gen, 2)}`} d=${q.d} style=${`stroke-width:${q.w.toFixed(2)}`} />`)}
        <path class="xr-lead" d=${`M${r.pin[0].toFixed(1)} ${r.pin[1].toFixed(1)}h${r.toLeft ? -16 : 16}`} />
        <circle class="xr-pin" cx=${r.pin[0].toFixed(1)} cy=${r.pin[1].toFixed(1)} r="3.2" />
      </g>`)}
      ${roots.map((r) => html`<${Sprout} x=${r.x} y=${ground} s=${0.75} />`)}
    </svg>
    ${roots.map((r) => html`<a class=${r.toLeft ? 'stamp xsec-tag to-left' : 'stamp xsec-tag'} data-field=${node(r.a.id).field} href=${`#/c/${r.a.id}`}
      style=${`left:${((r.pin[0] + (r.toLeft ? -18 : 18)) / W * 100).toFixed(2)}%;top:${r.pin[1].toFixed(1)}px;max-width:${Math.max(90, Math.round(r.toLeft ? r.pin[0] - 26 : W - r.pin[0] - 26))}px`}>
      <span class="dot"></span>${title(r.a.id)}<span class="lv">· ${r.a.lv ? LEVELS[r.a.lv - 1].he : 'נקודת התחלה'}</span>
    </a>`)}
    <div class="xsec-tools"><${ScaleBar} /><${Compass} size=${40} /></div>
  </div>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

function whyLine(s) {
  if (s.kind === 'continue') return 'המשך מאיפה שעצרת';
  if (s.kind === 'seed') return 'נקודת התחלה לפי תחומי העניין שלך';
  const t = CTYPES[s.type];
  return (t ? t.he : 'קשר') + ' מתוך ' + title(s.via);
}

function Suggestion({ s, i }) {
  const n = node(s.id);
  const c = fullOf(s.id) || cardOf(s.id);
  const href = s.kind === 'branch' ? '#/bridge/' + s.via + '/' + s.id : '#/c/' + s.id;
  const cls = s.recommended ? 'tile tile-field sugg sugg-rec' : 'tile tile-field sugg';
  return html`<a class=${cls} data-field=${n.field} href=${href} style=${'--i:' + i}>
    <div class="row-between">
      <${FieldChip} id=${n.field} />
      <span class="row sugg-badges">
        ${s.discovery && html`<span class="badge">גילוי</span>`}
        ${s.recommended && html`<span class="badge badge-gold"><${Icon} name="star" />מומלץ</span>`}
      </span>
    </div>
    <h3>${n.he}</h3>
    ${c && html`<p class="muted sugg-line">${c.oneLiner}</p>`}
    <span class="sugg-why">${whyLine(s)}<${Icon} name="next" /></span>
  </a>`;
}

export function Home({ ctx }) {
  const { state, p, openSheet } = ctx;
  const D = data();
  const sug = suggestions(p, state.interests);
  const due = dueList(p);
  const rec = sug[0];
  const ids = Object.keys(p.concepts).filter((id) => D.byId[id]);
  const learned = ids.filter((id) => levelOf(p, id) > 0).length;
  const deep = ids.filter((id) => levelOf(p, id) >= 3).length;
  const upcoming = ids.map((id) => [id, p.concepts[id]]).filter(([, c]) => c.due && c.due > Date.now()).sort((a, b) => a[1].due - b[1].due)[0];
  const last = p.journal[0];

  const waterTitle = due.length ? due.length + ' מושגים מחכים להשקיה' : 'הכול מושקה';
  let waterSub = 'עוד לא למדת מושג. השקיה מתחילה אחרי המושג הראשון.';
  if (due.length) waterSub = due.slice(0, 3).map(title).join(' · ');
  else if (upcoming) waterSub = 'הבא בתור: ' + title(upcoming[0]) + ', ' + fmtRel(upcoming[1].due);
  const growTitle = rec ? rec.kind === 'continue' ? 'להמשיך את ' + title(rec.id) : 'לצמוח אל ' + title(rec.id) : 'לבחור נקודת התחלה';
  const growHref = rec ? '#/c/' + rec.id : '#/map';
  const learnedIds = ids.filter((id) => levelOf(p, id) > 0).sort((a, b) => levelOf(p, b) - levelOf(p, a));
  const anchors = learnedIds.length
    ? learnedIds.slice(0, 4).map((id) => ({ id, lv: levelOf(p, id) }))
    : sug.slice(0, 3).map((s) => ({ id: s.id, lv: 0 }));

  return html`<div class="home">
    <header class="home-head">
      <span class="faint">${fmtToday()}</span>
      <h1>${greeting()}. לאן עכשיו?</h1>
    </header>
    ${anchors.length > 0 && html`<${CrossSection} anchors=${anchors} />`}
    <div class="home-grid">
      <div class="home-main stack-lg">
        <section class="sessions" aria-label="סוגי מפגש">
          <a class="session session-water" href=${due.length ? '#/water' : '#/map'}>
            <span class="session-kind"><span class="session-icon"><${Icon} name="drop" /></span>השקיה קצרה · כ־5 דקות</span>
            <strong class="session-title">${waterTitle}</strong>
            <span class="muted">${waterSub}</span>
          </a>
          <a class="session session-grow" href=${growHref}>
            <span class="session-kind"><span class="session-icon"><${Icon} name="sprout" /></span>צמיחה ארוכה · כ־25 דקות</span>
            <strong class="session-title">${growTitle}</strong>
            <span class="muted">מושג מלא: סיפור פתיחה, מנגנון, מחקר, מקרים אמיתיים ובדיקת זיהוי.</span>
            <span class="btn btn-moss btn-sm session-go">${rec && rec.kind === 'continue' ? 'להמשיך' : 'להתחיל'}<${Icon} name="next" /></span>
          </a>
        </section>
        <section>
          <div class="section-head"><h2>לאן עכשיו</h2><a class="btn btn-quiet btn-sm" href="#/map">לכל המפה<${Icon} name="next" /></a></div>
          <div class="sugg-list reveal">${sug.map((s, i) => html`<${Suggestion} s=${s} i=${i} />`)}</div>
        </section>
      </div>
      <aside class="home-side stack">
        <button class="seen-cta" onClick=${() => openSheet('seen')}>
          <span class="seen-icon"><${Icon} name="eye" /></span>
          <span><strong>ראיתי את זה היום</strong><span class="muted">פגשת מושג בחיים? רשום אותו. זה מה שמקבע אותו.</span></span>
        </button>
        ${last && html`<figure class="journal-quote">
          <blockquote>${last.note || 'נרשם בלי הערה'}</blockquote>
          <figcaption><span class="faint">${fmtDate(last.at)}</span> · <a href=${'#/c/' + last.concept}>${title(last.concept)}</a></figcaption>
        </figure>`}
        <div class="stats">
          <div><strong class="num">${learned}</strong><span>מושגים בשורשים</span></div>
          <div><strong class="num">${deep}</strong><span>ברמת זיהוי ומעלה</span></div>
          <div><strong class="num">${p.journal.length}</strong><span>רישומים ביומן</span></div>
        </div>
      </aside>
    </div>
  </div>`;
}

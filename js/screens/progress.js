// מסך 7: התקדמות — רמה ונקודות, טביעת האצבע של השורשים, סולם העומק, אוסף החותמות (D-21),
// התקדמות לכל תחום, ויומן "ראיתי את זה".
import { html, useMemo } from '../vendor/standalone.module.js';
import { data, node, title, levelOf, LEVELS, levelInfo, POINTS } from '../data.js';
import { stampGroups, hasStamp, stampStats } from '../course.js';
import { layout, smooth } from '../maplayout.js';
import { Icon, FieldGlyph } from '../icons.js';
import { FieldChip, Bar, Empty, fmtDate, LevelBadge, Emblem } from '../ui.js';
import { Strata } from '../atlas.js';

// אוסף החותמות לפי סדר המסלול: כרטיס נאסף ב"מבין", ומושג מלא במבחן השלב שלו
function Stamps({ p }) {
  const ss = stampStats(p);
  return html`<section class="stamps" id="stamps">
    <div class="section-head"><h2>אוסף החותמות</h2><span class="faint num">${ss.have} מתוך ${ss.total}</span></div>
    <p class="muted stamps-note">כרטיס נכנס לאוסף כשמבינים אותו. הסמל של מושג מלא נחשף רק כשעוברים את מבחן השלב שלו במסלול.</p>
    ${stampGroups().map((g) => html`<div class="stamp-group">
      <span class="label">שלב ${g.stage + 1}: ${title(g.concept)}</span>
      <div class="stamp-grid">${g.ids.map((id) => {
        const got = hasStamp(p, id);
        return html`<a class=${`stamp-cell${got ? ' is-got' : ''}${id === g.concept ? ' is-main' : ''}`} href=${`#/c/${id}`} aria-label=${`${title(id)}: ${got ? 'נאספה' : 'עוד לא נאספה'}`}>
          <${Emblem} id=${id} size="sm" locked=${!got} />
          <span class="stamp-name">${title(id)}</span>
        </a>`;
      })}</div>
    </div>`)}
  </section>`;
}

// טביעת האצבע כדיסק דגימה: השורשים שלך בתוך עיגול, על רקע שכבות הקרקע, עם טבעת שנתות מסביב.
// בלי מספרי מעלות: הם לא מודדים כלום (ביקורת Hallmark, 31.10)
function Fingerprint({ p }) {
  const D = data();
  const L = useMemo(() => layout(D), [D]);
  const learnedPos = Object.entries(L.pos).filter(([id]) => levelOf(p, id) > 0).map(([, q]) => q);
  const pts = learnedPos.length ? learnedPos : Object.values(L.pos);
  const xs = pts.map((q) => q.x).concat([-40, 40]), ys = pts.map((q) => q.y).concat([0]);
  const b = { x0: Math.min(...xs) - 40, x1: Math.max(...xs) + 40, y0: Math.min(...ys) - 30, y1: Math.max(...ys) + 40 };
  const R = 132;
  const k = (R * 1.7) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const fit = `translate(${(-cx * k).toFixed(1)} ${(-cy * k).toFixed(1)}) scale(${k.toFixed(4)})`;
  const ticks = [];
  for (let d = 0; d < 360; d += 10) ticks.push(d);
  return html`<svg class="fingerprint fp-chart" viewBox="-152 -152 304 304" role="img" aria-label="תרשים: טביעת האצבע של השורשים שלך">
    <defs><clipPath id="fp-clip"><circle r=${R} /></clipPath></defs>
    <g clip-path="url(#fp-clip)">
      <rect class="fp-sky" x="-170" y="-170" width="340" height="340" />
      <${Strata} x0=${-170} x1=${170} amp=${4} seed=${0.4} layers=${[{ y0: -104, y1: -20, n: 1 }, { y0: -20, y1: 62, n: 2 }, { y0: 62, y1: 170, n: 3 }]} />
      <g transform=${fit}>
        <path class="fp-tap" d=${smooth(L.tap)} />
        ${L.laterals.map((l) => {
          const lv = Math.max(0, ...l.nodeIds.map((id) => levelOf(p, id)));
          return html`<path class=${lv ? 'fp-lat on' : 'fp-lat'} data-field=${l.field} d=${smooth(l.pts)} style=${`stroke-width:${2 + lv * 1.6}`} />`;
        })}
        ${Object.entries(L.pos).filter(([id]) => levelOf(p, id) > 0).map(([id, q]) => html`<circle class="fp-node" data-field=${q.field} cx=${q.x} cy=${q.y} r=${((2.2 + levelOf(p, id) * 0.8) / k).toFixed(1)} />`)}
      </g>
    </g>
    <circle class="fp-rim" r=${R} />
    <circle class="fp-rim fp-rim-out" r=${R + 6} />
    <g class="fp-ticks">${ticks.map((d) => {
      const a = (d - 90) * Math.PI / 180, long = d % 30 === 0;
      const r0 = R + 6, r1 = R + (long ? 14 : 10);
      return html`<path d=${`M${(Math.cos(a) * r0).toFixed(1)} ${(Math.sin(a) * r0).toFixed(1)}L${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)}`} class=${long ? 'long' : ''} />`;
    })}</g>
  </svg>`;
}

// סולם העומק כגליל קידוח: כל שכבה היא דרגה, ועמוק יותר פירושו שליטה גבוהה יותר
const CORE_TEX = ['pt-stipple', 'pt-hatch', 'pt-dots', 'pt-gravel', 'pt-hatch'];
function CoreSample({ dist }) {
  const segH = 46, top = 22, w = 74, x = 8;
  return html`<div class="core">
    <ol class="core-labels">${LEVELS.map((l, k) => html`<li style=${`--h:${segH}px`}><span class="core-name">${l.he}</span><span class="core-n num">${dist[k]}</span></li>`)}</ol>
    <svg class="core-svg" viewBox=${`0 0 ${w + x * 2} ${top + segH * 5 + 16}`} width=${w + x * 2} height=${top + segH * 5 + 16} aria-hidden="true">
      ${LEVELS.map((l, k) => {
        const y = top + k * segH;
        return html`<g class=${`core-seg cs-${k + 1}`}>
          <rect class="core-band" x=${x} y=${y} width=${w} height=${segH} />
          <rect x=${x} y=${y} width=${w} height=${segH} fill=${`url(#${CORE_TEX[k]})`} class="core-tex" />
          <path class="core-line" d=${`M${x} ${y}h${w}`} />
        </g>`;
      })}
      <path class="core-side" d=${`M${x} ${top}v${segH * 5}M${x + w} ${top}v${segH * 5}`} />
      <ellipse class="core-cap" cx=${x + w / 2} cy=${top} rx=${w / 2} ry="9" />
      <path class="core-bottom" d=${`M${x} ${top + segH * 5}a${w / 2} 9 0 0 0 ${w} 0`} />
    </svg>
  </div>`;
}

export function ProgressScreen({ ctx }) {
  const { p, openSheet } = ctx;
  const D = data();
  const ids = D.nodes.map((n) => n.id);
  const learned = ids.filter((id) => levelOf(p, id) > 0);
  const dist = LEVELS.map((l) => ids.filter((id) => levelOf(p, id) === l.n).length);
  const maxDist = Math.max(1, ...dist);
  const groups = D.fields.groups;
  const lv = levelInfo(p.points || 0);
  return html`<div class="progress-screen">
    <div class="screen-title"><h1>מה כבר צמח</h1><p>אין שתי מערכות שורשים זהות. זו טביעת האצבע של הסקרנות שלך.</p></div>
    <section class="panel level-panel">
      <${LevelBadge} n=${lv.n} size="lg" />
      <div class="lm-body">
        <strong>רמה ${lv.n}</strong>
        <${Bar} value=${lv.into} max=${lv.span} label=${`התקדמות לרמה ${lv.n + 1}`} />
        <span class="faint num">${p.points || 0} נקודות, עוד ${lv.span - lv.into} לרמה ${lv.n + 1}</span>
      </div>
      <p class="faint level-note">נקודות מגיעות מכל תחנה במסלול, מתשובות נכונות ומהשקיה. רישום ב“ראיתי את זה” שווה ${POINTS.seen}, כמו מבחן שלב שלם. סולם העומק של כל מושג נשאר המדד לשליטה בו.</p>
    </section>
    <div class="progress-grid">
      <section class="panel fp-panel">
        <${Fingerprint} p=${p} />
        <div class="stats">
          <div><strong class="num">${learned.length}</strong><span>מושגים בשורשים</span></div>
          <div><strong class="num">${ids.filter((id) => levelOf(p, id) >= 3).length}</strong><span>ברמת זיהוי ומעלה</span></div>
          <div><strong class="num">${p.journal.length}</strong><span>רישומים ביומן</span></div>
        </div>
      </section>
      <section class="panel depth-panel">
        <div class="section-head"><h2>סולם העומק</h2><span class="faint">כמה מושגים בכל דרגה</span></div>
        <${CoreSample} dist=${dist} />
        <p class="faint dd-note">עמוק יותר בגליל = שליטה גבוהה יותר. מזהה פותח ענפים, מבחין עובר דו־קרב, משתמש נתפס ביומן.</p>
      </section>
    </div>

    <${Stamps} p=${p} />

    <section class="fields-progress">
      <div class="section-head"><h2>לפי תחום</h2></div>
      ${groups.map((g) => html`<div class="fp-group">
        <span class="label">${g.he} <span class="group-sub">${g.sub}</span></span>
        <div class="field-rows">${D.fields.fields.filter((f) => f.group === g.id).map((f) => {
          const n = ids.filter((id) => node(id).field === f.id && levelOf(p, id) > 0).length;
          return html`<div class="field-row" data-field=${f.id}>
            <span class="fr-name"><${FieldGlyph} id=${f.id} />${f.short}</span>
            <${Bar} value=${n} max=${f.planned} fieldId=${f.id} label=${f.he} />
            <span class="fr-count num">${n} מתוך ${f.planned}</span>
          </div>`;
        })}</div>
      </div>`)}
    </section>

    <section class="journal">
      <div class="section-head"><h2>יומן “ראיתי את זה”</h2><button class="btn btn-quiet btn-sm" onClick=${() => openSheet('seen')}><${Icon} name="plus" />רישום חדש</button></div>
      ${p.journal.length ? html`<ol class="journal-list">${p.journal.map((j) => html`<li class="journal-item" data-field=${node(j.concept) ? node(j.concept).field : ''}>
        <span class="ji-date faint">${fmtDate(j.at)}</span>
        <div><a class="ji-title" href=${`#/c/${j.concept}`}>${title(j.concept)}</a>${j.note && html`<p>${j.note}</p>`}</div>
      </li>`)}</ol>` : html`<${Empty} ill="mo-journal" title="היומן עוד ריק"><span>בפעם הבאה שתפגוש מושג בחיים, רשום אותו כאן. זה הרגע שבו הידע הופך לזיהוי.</span><button class="btn btn-sm" onClick=${() => openSheet('seen')}>רישום ראשון</button></${Empty}>`}
    </section>
  </div>`;
}

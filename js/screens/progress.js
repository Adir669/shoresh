// מסך 7: התקדמות — טביעת האצבע של השורשים, סולם העומק, התקדמות לכל תחום, ויומן "ראיתי את זה".
import { html, useMemo } from '../vendor/standalone.module.js';
import { data, node, title, levelOf, LEVELS } from '../data.js';
import { layout, smooth } from '../maplayout.js';
import { Icon } from '../icons.js';
import { FieldChip, Bar, Empty, fmtDate } from '../ui.js';

function Fingerprint({ p }) {
  const D = data();
  const L = useMemo(() => layout(D), [D]);
  const learnedPos = Object.entries(L.pos).filter(([id]) => levelOf(p, id) > 0).map(([, q]) => q);
  const pts = learnedPos.length ? learnedPos : Object.values(L.pos);
  const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  const pad = 70;
  const b = { x0: Math.min(...xs, -40) - pad, x1: Math.max(...xs, 40) + pad, y0: Math.min(...ys, 0) - pad, y1: Math.max(...ys) + pad };
  return html`<svg class="fingerprint" viewBox=${`${b.x0} ${b.y0} ${b.x1 - b.x0} ${b.y1 - b.y0}`} role="img" aria-label="טביעת האצבע של השורשים שלך">
    <path class="fp-tap" d=${smooth(L.tap)} />
    ${L.laterals.map((l) => {
      const lv = Math.max(0, ...l.nodeIds.map((id) => levelOf(p, id)));
      return html`<path class=${lv ? 'fp-lat on' : 'fp-lat'} data-field=${l.field} d=${smooth(l.pts)} style=${`stroke-width:${2 + lv * 1.6}`} />`;
    })}
    ${Object.entries(L.pos).filter(([id]) => levelOf(p, id) > 0).map(([id, q]) => html`<circle class="fp-node" data-field=${q.field} cx=${q.x} cy=${q.y} r=${6 + levelOf(p, id) * 3} />`)}
  </svg>`;
}

export function ProgressScreen({ ctx }) {
  const { p, openSheet } = ctx;
  const D = data();
  const ids = D.nodes.map((n) => n.id);
  const learned = ids.filter((id) => levelOf(p, id) > 0);
  const dist = LEVELS.map((l) => ids.filter((id) => levelOf(p, id) === l.n).length);
  const maxDist = Math.max(1, ...dist);
  const groups = D.fields.groups;
  return html`<div class="progress-screen">
    <div class="screen-title"><span class="kicker">התקדמות</span><h1>מה כבר צמח</h1><p>אין שתי מערכות שורשים זהות. זו טביעת האצבע של הסקרנות שלך.</p></div>
    <div class="progress-grid">
      <section class="panel fp-panel">
        <${Fingerprint} p=${p} />
        <div class="stats">
          <div><strong class="num">${learned.length}</strong><span>מושגים בשורשים</span></div>
          <div><strong class="num">${ids.filter((id) => levelOf(p, id) >= 3).length}</strong><span>ברמת זיהוי ומעלה</span></div>
          <div><strong class="num">${p.journal.length}</strong><span>רישומים ביומן</span></div>
        </div>
      </section>
      <section class="panel">
        <div class="section-head"><h2>סולם העומק</h2><span class="faint">כמה מושגים בכל דרגה</span></div>
        <div class="depth-dist">${LEVELS.map((l, k) => html`<div class="dd-col">
          <span class="num dd-n">${dist[k]}</span>
          <div class="dd-bar"><i style=${`--p:${(dist[k] / maxDist).toFixed(3)}`}></i></div>
          <span class="dd-name">${l.he}</span>
        </div>`)}</div>
        <p class="faint dd-note">שמעתי ← מבין ← מזהה (פותח ענפים) ← מבחין (דו־קרב) ← משתמש (נתפס ביומן)</p>
      </section>
    </div>

    <section class="fields-progress">
      <div class="section-head"><h2>לפי תחום</h2></div>
      ${groups.map((g) => html`<div class="fp-group">
        <span class="label">${g.he} · ${g.sub}</span>
        <div class="field-rows">${D.fields.fields.filter((f) => f.group === g.id).map((f) => {
          const n = ids.filter((id) => node(id).field === f.id && levelOf(p, id) > 0).length;
          return html`<div class="field-row" data-field=${f.id}>
            <span class="fr-name"><span class="dot"></span>${f.short}</span>
            <${Bar} value=${n} max=${f.planned} fieldId=${f.id} />
            <span class="fr-count num">${n} מתוך ${f.planned}</span>
          </div>`;
        })}</div>
      </div>`)}
    </section>

    <section class="journal">
      <div class="section-head"><h2>יומן "ראיתי את זה"</h2><button class="btn btn-quiet btn-sm" onClick=${() => openSheet('seen')}><${Icon} name="plus" />רישום חדש</button></div>
      ${p.journal.length ? html`<ol class="journal-list">${p.journal.map((j) => html`<li class="journal-item" data-field=${node(j.concept) ? node(j.concept).field : ''}>
        <span class="ji-date faint">${fmtDate(j.at)}</span>
        <div><a class="ji-title" href=${`#/c/${j.concept}`}>${title(j.concept)}</a>${j.note && html`<p>${j.note}</p>`}</div>
      </li>`)}</ol>` : html`<${Empty} icon="eye" title="היומן עוד ריק"><span>בפעם הבאה שתפגוש מושג בחיים, רשום אותו כאן. זה הרגע שבו הידע הופך לזיהוי.</span><button class="btn btn-sm" onClick=${() => openSheet('seen')}>רישום ראשון</button></${Empty}>`}
    </section>
  </div>`;
}

// מסך 6: כרטיס גשר — מסביר את הקשר בין שני מושגים.
import { html } from '../vendor/standalone.module.js';
import { node, field, title, edge, edgesOut, levelOf, sourcesOf, fullOf, cardOf, CTYPES } from '../data.js';
import { Icon } from '../icons.js';
import { FieldChip, CType, Back, Empty, Paras } from '../ui.js';

export function BridgeScreen({ ctx, from, to }) {
  const { p } = ctx;
  const a = node(from), b = node(to);
  if (!a || !b) return html`<${Empty} icon="alert" title="הגשר הזה לא קיים"><a href="#/map">למפה</a></${Empty}>`;
  const e = edge(from, to) || edge(to, from);
  const br = e && e.bridge;
  const owner = e ? e.from : from;
  const srcs = sourcesOf(owner);
  const used = br && br.sourceIds ? srcs.filter((s) => br.sourceIds.includes(s.id)) : [];
  const open = levelOf(p, from) >= 3;
  const ca = fullOf(from) || cardOf(from), cb = fullOf(to) || cardOf(to);
  const others = edgesOut(from).filter((x) => x.to !== to).slice(0, 4);
  return html`<article class="bridge read">
    <${Back} href=${`#/c/${from}`} label=${a.he} />
    <div class="bridge-visual" aria-hidden="true">
      <div class="bridge-node" data-field=${a.field}><span class="bn-dot"></span><strong>${a.he}</strong><span class="faint">${field(a.field).short}</span></div>
      <svg class="bridge-root" viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M196 30 C150 4 50 56 4 30" pathLength="1" /></svg>
      <div class="bridge-node" data-field=${b.field}><span class="bn-dot"></span><strong>${b.he}</strong><span class="faint">${field(b.field).short}</span></div>
    </div>
    <div class="bridge-card">
      <div class="row-between">${e ? html`<${CType} type=${e.type} />` : html`<span class="ctype">קשר</span>`}${e && html`<span class="faint">${CTYPES[e.type].desc}</span>`}</div>
      ${br ? html`<h1>${br.title}</h1><div class="stack"><${Paras} text=${br.body} /></div>`
        : html`<h1>${a.he} ו${b.he}</h1><p class="muted">${e && e.label ? e.label : 'ההסבר המלא של הגשר הזה ייכנס כשהתוכן שלו יעבור בדיקת עובדות.'}</p>`}
      ${used.length > 0 && html`<div class="bridge-sources"><span class="label">מקורות</span><ul>${used.map((s) => html`<li><span class="en">${s.citation}</span> <a href=${s.url} target="_blank" rel="noopener">קישור</a></li>`)}</ul></div>`}
    </div>
    <div class="bridge-pair">
      ${[[from, a, ca], [to, b, cb]].map(([id, n, c]) => html`<a class="tile tile-field" data-field=${n.field} href=${`#/c/${id}`}><${FieldChip} id=${n.field} /><strong>${n.he}</strong>${c && html`<span class="muted">${c.oneLiner}</span>`}</a>`)}
    </div>
    <div class="row">
      ${open ? html`<a class="btn" href=${`#/c/${to}`}>להמשיך אל ${b.he}<${Icon} name="next" /></a>`
        : html`<a class="btn" href=${`#/check/${from}`}><${Icon} name="unlock" />בדיקת זיהוי של ${a.he} תפתח את הענף</a>`}
      <a class="btn btn-ghost" href=${`#/map/${to}`}><${Icon} name="roots" />במפה</a>
    </div>
    ${others.length > 0 && html`<section><span class="label">עוד ענפים מ${a.he}</span><div class="conn-list">${others.map((x) => html`<a class="conn" data-field=${node(x.to).field} href=${`#/bridge/${from}/${x.to}`}><${CType} type=${x.type} /><span class="conn-name">${title(x.to)}</span><${Icon} name="next" /></a>`)}</div></section>`}
  </article>`;
}

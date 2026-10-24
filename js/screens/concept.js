// מסך 4: דף מושג בשכבות (ומסך 8: דוגמאות שמתחלפות לפי תחומי העניין), דף כרטיס, ובדיקת זיהוי.
import { html, useState, useEffect } from '../vendor/standalone.module.js';
import { node, field, title, fullOf, cardOf, levelOf, edgesOut, exampleKey, verificationOf, actions, isFull, EVIDENCE, LEVELS } from '../data.js';
import { Icon } from '../icons.js';
import { Paras, FieldChip, CType, Evidence, Verified, Ladder, Back, Empty, Feedback, toast, fmtHistDate } from '../ui.js';
import { ExerciseView } from '../exercises.js';

const EX_TABS = [['daily', 'יומיום'], ['finance', 'כסף'], ['politics', 'פוליטיקה'], ['history', 'היסטוריה'], ['science', 'מדע'], ['business', 'עבודה'], ['relationships', 'יחסים']];
const DOMAIN = { history: 'היסטוריה', politics: 'פוליטיקה', business: 'עסקים', finance: 'כסף', science: 'מדע', health: 'בריאות', law: 'משפט', tech: 'טכנולוגיה', sport: 'ספורט', daily: 'יומיום', military: 'צבא וביטחון' };
const HOOK_KIND = { experiment: 'ניסוי', story: 'סיפור', case: 'מקרה', riddle: 'חידה' };

const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

function Src({ ids, sources }) {
  if (!ids || !ids.length) return null;
  return html`<span class="src-refs">${ids.map((sid) => {
    const n = sources.findIndex((s) => s.id === sid) + 1;
    return n > 0 ? html`<button class="src-ref" onClick=${() => scrollTo(`src-${sid}`)} aria-label=${`מקור ${n}`}>${n}</button>` : null;
  })}</span>`;
}

function Layer({ id, n, name, children, cls = '' }) {
  return html`<section class=${`layer ${cls}`} id=${id} aria-labelledby=${`${id}-h`}>
    <div class="layer-head"><span class="layer-n">${n}</span><h2 id=${`${id}-h`}>${name}</h2></div>
    ${children}
  </section>`;
}

// משחק המטוסים של ואלד (בתוך הטיית השורדים)
function Planes({ it, sources }) {
  const [pick, setPick] = useState(null);
  const zones = it.zones || [];
  const names = Object.fromEntries(zones.map((z) => [z.id, z.name]));
  const holes = [[60, 96], [92, 112], [228, 108], [262, 96], [150, 132], [168, 150], [154, 176], [166, 92], [128, 196], [192, 198], [80, 104], [242, 112], [146, 112]];
  const Z = ({ zid, children }) => html`<g class=${`pz${pick ? (zid === it.answer ? ' pz-ok' : zid === pick ? ' pz-bad' : '') : ''}`} data-zone=${zid} onClick=${() => !pick && names[zid] && setPick(zid)} role="button" tabindex="0" aria-label=${names[zid] || zid}>${children}</g>`;
  return html`<div class="planes">
    <p>${it.intro}</p>
    <p class="ex-prompt">${it.question}</p>
    <svg class="plane-svg" viewBox="0 0 320 240" aria-label="מטוס במבט מלמעלה, עם סימני פגיעות">
      <${Z} zid="wings"><path d="M22 112 L140 92 L180 92 L298 112 L298 124 L180 118 L140 118 L22 124 Z" /></${Z}>
      <${Z} zid="fuselage"><path d="M150 54 Q160 40 170 54 L172 200 Q160 214 148 200 Z" /></${Z}>
      <${Z} zid="tail"><path d="M112 196 L148 188 L172 188 L208 196 L208 206 L172 202 L148 202 L112 206 Z" /></${Z}>
      <${Z} zid="engines"><ellipse cx="72" cy="114" rx="9" ry="13" /><ellipse cx="114" cy="108" rx="9" ry="13" /><ellipse cx="206" cy="108" rx="9" ry="13" /><ellipse cx="248" cy="114" rx="9" ry="13" /></${Z}>
      <${Z} zid="cockpit"><ellipse cx="160" cy="58" rx="7" ry="10" /></${Z}>
      ${holes.map(([x, y]) => html`<circle class="hole" cx=${x} cy=${y} r="2.6" />`)}
    </svg>
    <div class="zone-row">${zones.map((z) => html`<button class="duel-pick" aria-pressed=${String(pick === z.id)} disabled=${!!pick} onClick=${() => setPick(z.id)}>${z.name}</button>`)}</div>
    ${pick && html`<${Feedback} ok=${pick === it.answer} title=${pick === it.answer ? 'בדיוק כמו ואלד.' : `ואלד המליץ אחרת: ${names[it.answer] || it.answer}`}><p>${it.reveal}</p><${Src} ids=${it.sourceIds} sources=${sources} /></${Feedback}>`}
  </div>`;
}

function Timeline({ it, sources }) {
  return html`<div class="timeline">
    <h3>${it.title}</h3>
    <ol>${it.events.map((e) => html`<li><span class="tl-date num">${fmtHistDate(e.date)}</span><strong>${e.title}</strong><p>${e.body}</p><${Src} ids=${e.sourceIds} sources=${sources} /></li>`)}</ol>
  </div>`;
}

function Hook({ c }) {
  const [open, setOpen] = useState(false);
  const h = c.hook;
  return html`<div class="hook">
    <span class="kicker">${HOOK_KIND[h.kind] || 'פתיחה'}</span>
    <h3>${h.title}</h3>
    <${Paras} text=${h.body} />
    ${h.question && html`<p class="hook-q">${h.question}</p>`}
    ${!open ? html`<button class="btn btn-ghost" onClick=${() => setOpen(true)}><${Icon} name="eye" />מה קרה באמת?</button>`
      : html`<div class="reveal-box"><${Paras} text=${h.reveal} /><${Src} ids=${h.sourceIds} sources=${c.sources} /></div>`}
  </div>`;
}

function Example({ c, interests }) {
  const first = exampleKey(interests);
  const [k, setK] = useState(c.examples[first] ? first : 'daily');
  const e = c.examples[k];
  return html`<div class="example">
    <div class="row-between"><span class="kicker">דוגמה מהעולם שלך</span><span class="faint ex-hint">הדוגמה הראשונה נבחרת לפי תחומי העניין</span></div>
    <div class="tabs" role="tablist">${EX_TABS.filter(([key]) => c.examples[key]).map(([key, he]) => html`<button role="tab" aria-selected=${String(k === key)} class=${key === first ? 'tab-mine' : ''} onClick=${() => setK(key)}>${he}</button>`)}</div>
    ${e && html`<div class="example-body" key=${k}><h3>${e.title}</h3><${Paras} text=${e.body} />
      <span class="faint">${e.kind === 'real' ? 'מקרה אמיתי' : 'דוגמה להמחשה'}</span><${Src} ids=${e.sourceIds} sources=${c.sources} /></div>`}
  </div>`;
}

function Connections({ id, lv }) {
  const out = edgesOut(id);
  if (!out.length) return null;
  const open = lv >= 3;
  return html`<section class="branches">
    <div class="section-head"><h2>לאן השורש מתפצל</h2>${!open && html`<span class="badge"><${Icon} name="lock" />נפתח אחרי בדיקת זיהוי</span>`}</div>
    <div class="conn-list">${out.map((e) => html`<a class=${`conn${open ? '' : ' conn-locked'}`} data-field=${node(e.to).field} href=${open ? `#/bridge/${id}/${e.to}` : `#/check/${id}`}>
      <${CType} type=${e.type} /><span class="conn-name">${title(e.to)}</span>${e.label && html`<span class="faint conn-label">${e.label}</span>`}<${Icon} name=${open ? 'next' : 'lock'} />
    </a>`)}</div>
  </section>`;
}

function CardPage({ ctx, id }) {
  const { state, p, openSheet } = ctx;
  const n = node(id), c = cardOf(id), lv = levelOf(p, id);
  useEffect(() => { actions.visit(state, id); }, [id]);
  return html`<article class="concept" data-field=${n.field}>
    <header class="concept-head">
      <div class="row-between"><${Back} href=${`#/map/${id}`} label="למפה" /><${FieldChip} id=${n.field} long=${true} /></div>
      <span class="badge">כרטיס קצר</span>
      <h1>${n.he}</h1><span class="en title-en">${n.en}</span>
      ${c ? html`<p class="lead">${c.oneLiner}</p>` : null}
      ${c && html`<div class="row meta"><${Evidence} level=${c.evidence.level} note=${c.evidence.note} /><${Verified} v=${verificationOf(id)} /></div>`}
      <${Ladder} level=${lv} fieldId=${n.field} />
    </header>
    ${!c ? html`<${Empty} icon="clock" title="המושג הזה עוד בכתיבה ובבדיקה"><span>הוא ייכנס רק אחרי שבודק עובדות עצמאי יאשר כל טענה בו.</span></${Empty}>` : html`<div class="read stack-lg">
      <div class="stack"><${Paras} text=${c.body} /></div>
      <div class="example"><span class="kicker">${c.example.kind === 'real' ? 'מקרה אמיתי' : 'דוגמה'}</span><p>${c.example.text}</p><${Src} ids=${c.example.sourceIds} sources=${c.sources} /></div>
      <p class="muted evidence-note"><strong>${EVIDENCE[c.evidence.level].he}: </strong>${c.evidence.note}</p>
      <div class="row">
        <button class="btn" onClick=${() => { actions.read(state, id); toast(`${n.he}: דרגה "מבין"`); }}><${Icon} name="check" />הבנתי</button>
        <button class="btn btn-ghost" onClick=${() => openSheet({ seen: id })}><${Icon} name="eye" />ראיתי את זה היום</button>
      </div>
      <${Connections} id=${id} lv=${3} />
      <section class="sources"><h2>מקורות</h2><ol>${c.sources.map((s) => html`<li id=${`src-${s.id}`}><span class="en">${s.citation}</span> <a href=${s.url} target="_blank" rel="noopener">קישור</a></li>`)}</ol></section>
    </div>`}
  </article>`;
}

export function ConceptScreen({ ctx, id }) {
  const n = node(id);
  if (!n) return html`<${Empty} icon="alert" title="לא מצאתי את המושג הזה"><a href="#/map">למפה</a></${Empty}>`;
  if (!isFull(id)) return html`<${CardPage} ctx=${ctx} id=${id} />`;
  const { state, p, openSheet } = ctx;
  const c = fullOf(id);
  const lv = levelOf(p, id);
  const [mode, setMode] = useState('full');
  useEffect(() => { actions.visit(state, id); }, [id]);
  if (!c) return html`<div class="stack"><${Back} href="#/map" /><h1>${n.he}</h1><${Empty} icon="clock" title="המושג הזה עוד בכתיבה ובבדיקה"><span>הוא ייכנס רק אחרי שבודק עובדות עצמאי יאשר כל טענה בו.</span></${Empty}></div>`;
  const v = verificationOf(id);
  const full = mode === 'full';
  const it = c.interactive;
  const toc = [['l-hook', 'פתיחה'], ['l-essence', 'תמצית'], full && ['l-mech', 'מנגנון'], full && ['l-research', 'מחקר'], full && ['l-cases', 'מקרים'], ['l-spot', 'איך מזהים'], ['l-twins', 'תאומים'], full && ['l-action', 'מה עושים'], full && ['l-sources', 'מקורות'], ['l-practice', 'תרגול']].filter(Boolean);
  return html`<article class="concept" data-field=${n.field}>
    <header class="concept-head">
      <div class="row-between"><${Back} href=${`#/map/${id}`} label="למפה" /><${FieldChip} id=${n.field} long=${true} /></div>
      <span class="faint concept-family">${c.family}</span>
      <h1>${c.title.he}</h1><span class="en title-en">${c.title.en}</span>
      <p class="lead">${c.oneLiner}</p>
      <div class="row meta"><${Evidence} level=${c.evidence.level} note=${c.evidence.note} /><${Verified} v=${v} />${c.draft && html`<span class="badge badge-gold">טיוטה</span>`}</div>
      <div class="concept-ladder"><span class="label">סולם העומק שלך</span><${Ladder} level=${lv} fieldId=${n.field} /></div>
      <div class="seg mode-seg" role="group" aria-label="אורך הקריאה">
        <button aria-pressed=${String(!full)} onClick=${() => setMode('core')}>קריאה קצרה · ${c.readingMinutes.core} דק׳</button>
        <button aria-pressed=${String(full)} onClick=${() => setMode('full')}>עומק מלא · ${c.readingMinutes.full} דק׳</button>
      </div>
    </header>

    <div class="concept-body">
      <nav class="toc" aria-label="שכבות">${toc.map(([tid, he], i) => html`<button onClick=${() => scrollTo(tid)}><span class="num">${i + 1}</span>${he}</button>`)}</nav>
      <div class="layers">
        <${Layer} id="l-hook" n="1" name="פתיחה"><${Hook} c=${c} />${it && it.kind === 'planes' && html`<${Planes} it=${it} sources=${c.sources} />`}</${Layer}>
        ${it && it.kind === 'timeline' && html`<${Timeline} it=${it} sources=${c.sources} />`}
        <${Layer} id="l-essence" n="2" name="תמצית">
          <p class="essence">${c.essence.sentence}</p>
          <ul class="essence-lines">${c.essence.lines.map((l) => html`<li>${l}</li>`)}</ul>
          <${Example} c=${c} interests=${state.interests} />
        </${Layer}>
        ${full && html`<${Layer} id="l-mech" n="3" name="למה זה קורה">
          <p>${c.mechanism.intro}</p>
          <div class="points">${c.mechanism.points.map((pt) => html`<div class="point"><h3>${pt.title}</h3><${Paras} text=${pt.body} /><${Src} ids=${pt.sourceIds} sources=${c.sources} /></div>`)}</div>
        </${Layer}>`}
        ${full && html`<${Layer} id="l-research" n="4" name="המחקר">
          <ol class="studies">${c.research.studies.map((s) => html`<li class="study"><span class="study-year num">${s.year}</span><div><h3>${s.title}</h3><span class="faint">${s.who}</span><p>${s.what}</p><p><strong>מה נמצא: </strong>${s.finding}</p><${Src} ids=${s.sourceIds} sources=${c.sources} /></div></li>`)}</ol>
          <div class="panel panel-quiet stack"><p><strong>מצב הראיות: </strong>${c.research.status}</p><p><strong>ביקורת ומגבלות: </strong>${c.research.criticism}</p><p class="evidence-note"><${Evidence} level=${c.evidence.level} /> ${c.evidence.note}</p></div>
        </${Layer}>`}
        ${full && html`<${Layer} id="l-cases" n="5" name="מקרים מהעולם">
          <div class="cases">${c.cases.map((cs) => html`<div class="case-card"><span class="kicker">${DOMAIN[cs.domain] || cs.domain}</span><h3>${cs.title}</h3><${Paras} text=${cs.body} /><${Src} ids=${cs.sourceIds} sources=${c.sources} /></div>`)}</div>
        </${Layer}>`}
        <${Layer} id="l-spot" n=${full ? 6 : 3} name="איך מזהים">
          <div class="spot">
            <div><span class="label">סימנים</span><ul>${c.spotting.signals.map((s) => html`<li>${s}</li>`)}</ul></div>
            <div><span class="label">משפטים אופייניים</span><ul class="phrases">${c.spotting.phrases.map((s) => html`<li><${Icon} name="quote" />${s}</li>`)}</ul></div>
            <div><span class="label">איפה זה צץ</span><ul>${c.spotting.situations.map((s) => html`<li>${s}</li>`)}</ul></div>
          </div>
        </${Layer}>
        <${Layer} id="l-twins" n=${full ? 7 : 4} name="התאומים המבלבלים">
          <div class="twins">${c.twins.map((t) => html`<div class="twin"><div class="row-between"><h3>${t.name}</h3>${t.id && node(t.id) && html`<a class="btn btn-quiet btn-sm" href=${`#/c/${t.id}`}>למושג<${Icon} name="next" /></a>`}</div><p>${t.difference}</p><p class="twin-tell"><${Icon} name="scale" />${t.tell}</p></div>`)}</div>
        </${Layer}>
        ${full && html`<${Layer} id="l-action" n="8" name=${c.action.title}>
          <ol class="steps">${c.action.steps.map((s) => html`<li><h3>${s.title}</h3><p>${s.body}</p></li>`)}</ol>
        </${Layer}>`}
        ${full && html`<${Layer} id="l-sources" n="9" name="מקורות והעמקה">
          ${v && v.status === 'passed' && html`<p class="verify-line"><${Icon} name="shield" />יומן האימות: ${v.claims} טענות נבדקו מול המקורות · ${v.corrected} תוקנו · ${v.removed} הוסרו · אף טענה לא נשארה פתוחה.</p>`}
          <ol class="sources">${c.sources.map((s) => html`<li id=${`src-${s.id}`}><span class="en">${s.citation}</span> <a href=${s.url} target="_blank" rel="noopener">קישור<${Icon} name="external" /></a></li>`)}</ol>
          <div class="further">${c.further.map((f) => html`<a class="tile" href=${f.url} target="_blank" rel="noopener"><span class="kicker">${{ book: 'ספר', video: 'וידאו', article: 'מאמר', podcast: 'פודקאסט', course: 'קורס' }[f.kind]}</span><strong>${f.title}</strong><span class="faint">${f.by}</span><p class="muted">${f.why}</p></a>`)}</div>
        </${Layer}>`}
        <${Layer} id="l-practice" n=${full ? 10 : 5} name="תרגול">
          <p class="muted">${c.exercises.length} תרגילים במושג הזה. בדיקת הזיהוי בוחרת שלושה מקרים חדשים, ושניים נכונים מתוכם פותחים את הענפים.</p>
          ${it && it.kind === 'pd-sim' && html`<a class="tile pd-cta" href="#/practice/pd"><${Icon} name="grid" /><div><strong>לשחק את הדילמה</strong><p class="muted">עשרה סיבובים מול אסטרטגיה נסתרת, ואחר כך טורניר.</p></div></a>`}
          <div class="row">
            ${lv < 2 && html`<button class="btn btn-ghost" onClick=${() => { actions.read(state, id); toast(`${n.he}: דרגה "מבין"`); }}><${Icon} name="check" />סיימתי לקרוא</button>`}
            <a class="btn" href=${`#/check/${id}`}><${Icon} name="target" />${lv >= 3 ? 'בדיקת זיהוי נוספת' : 'לבדיקת הזיהוי'}</a>
            <button class="btn btn-quiet" onClick=${() => openSheet({ seen: id })}><${Icon} name="eye" />ראיתי את זה היום</button>
          </div>
        </${Layer}>
        <${Connections} id=${id} lv=${lv} />
      </div>
    </div>
  </article>`;
}

export function CheckScreen({ ctx, id }) {
  const { state, p } = ctx;
  const c = fullOf(id);
  const [i, setI] = useState(0);
  const [score, setScore] = useState([]);
  if (!c) return html`<${Empty} icon="alert" title="אין עדיין תרגילים למושג הזה" />`;
  const rec = c.exercises.filter((e) => ['case', 'hunt'].includes(e.type));
  const pool = [...rec.filter((e) => e.level === 'recognize'), ...rec.filter((e) => e.level !== 'recognize')];
  const items = pool.slice(0, 3);
  const done = score.length === items.length && items.length > 0;
  const right = score.filter(Boolean).length;
  const passed = done && right >= 2;
  const record = (ok) => {
    actions.answer(state, items[i].id, ok);
    const next = [...score, ok];
    setScore(next);
    if (next.length === items.length) {
      const pass = next.filter(Boolean).length >= 2;
      actions.check(state, id, pass);
      if (pass) toast(`${edgesOut(id).length} ענפים חדשים נפתחו מ${c.title.he}`);
    }
  };
  return html`<div class="check read">
    <div class="row-between"><${Back} href=${`#/c/${id}`} label=${c.title.he} /><span class="faint num">${Math.min(score.length + 1, items.length)} מתוך ${items.length}</span></div>
    <div class="screen-title"><span class="kicker">בדיקת זיהוי</span><h1>${c.title.he}</h1><p>שלושה מקרים חדשים. מזהים שניים, והשורש מתפצל.</p></div>
    <div class="dots">${items.map((_, k) => html`<span class=${`dot-step${k < score.length ? (score[k] ? ' ok' : ' bad') : k === i ? ' now' : ''}`}></span>`)}</div>
    ${!done ? html`<div key=${i}>
      <${ExerciseView} ex=${items[i]} onDone=${record} />
      ${score.length > i && html`<div class="row next-row"><button class="btn" onClick=${() => setI(i + 1)}>${i + 1 < items.length ? 'למקרה הבא' : 'לתוצאה'}<${Icon} name="next" /></button></div>`}
    </div>` : html`<div class="result stack">
      <div class=${`result-badge${passed ? ' ok' : ''}`}><${Icon} name=${passed ? 'unlock' : 'refresh'} /><strong>${right} מתוך ${items.length}</strong></div>
      <h2>${passed ? 'זיהית. השורש מתפצל.' : 'כמעט. עוד סיבוב קטן.'}</h2>
      <p class="muted">${passed ? 'הגעת לדרגת "מזהה". אלה הענפים שנפתחו עכשיו:' : 'כדאי לעבור שוב על "איך מזהים" ועל התאומים, ולנסות שוב.'}</p>
      ${passed ? html`<div class="conn-list">${edgesOut(id).map((e) => html`<a class="conn" data-field=${node(e.to).field} href=${`#/bridge/${id}/${e.to}`}><${CType} type=${e.type} /><span class="conn-name">${title(e.to)}</span><${Icon} name="next" /></a>`)}</div>`
        : html`<div class="row"><a class="btn" href=${`#/c/${id}`}>חזרה למושג</a><button class="btn btn-ghost" onClick=${() => { setI(0); setScore([]); }}>לנסות שוב</button></div>`}
    </div>`}
  </div>`;
}

// מסך 9: מעבדה — ויכוח עם סופיסט, ו"תסביר כאילו אני בן 10". מסכים מעוצבים עם תוכן לדוגמה, בלי בינה מלאכותית אמיתית.
import { html, useState } from '../vendor/standalone.module.js';
import { data, title } from '../data.js';
import { Icon } from '../icons.js';
import { Back, Empty, Feedback, Opt, Paras } from '../ui.js';
import { T } from '../glossary.js';

const DemoNote = ({ children }) => html`<p class="demo-note"><span class="badge badge-demo">הדגמה</span>${children}</p>`;

export function Debate() {
  const s = data().samples;
  const [shown, setShown] = useState(1);
  const [answers, setAnswers] = useState({});
  const [asking, setAsking] = useState(null);
  if (!s || !s.debate) return html`<div class="stack"><${Back} href="#/practice" label="לתרגול" /><${Empty} icon="clock" title="הוויכוח לדוגמה עוד בבדיקת עובדות" /></div>`;
  const d = s.debate;
  const turns = d.turns.slice(0, shown);
  const fallacyTurns = d.turns.map((t, i) => [t, i]).filter(([t]) => t.fallacy);
  const caught = fallacyTurns.filter(([t, i]) => answers[i] === t.fallacy).length;
  const end = shown >= d.turns.length;
  const next = () => {
    const i = shown - 1, t = d.turns[i];
    if (t.fallacy && answers[i] === undefined) setAnswers({ ...answers, [i]: null }); // פספוס
    setAsking(null);
    setShown(shown + 1);
  };
  return html`<div class="debate read">
    <${Back} href="#/practice" label="לתרגול" />
    <div class="screen-title"><span class="kicker">ויכוח עם סופיסט</span><h1>${d.title}</h1><p><${T} text=${d.intro} /></p></div>
    <${DemoNote}>בגרסה המלאה הבינה המלאכותית מתווכחת איתך באמת, על נושא שתבחר. כאן הוויכוח כתוב מראש.</${DemoNote}>
    <div class="chat" aria-live="polite">
      ${turns.map((t, i) => html`<div class=${`bubble-row ${t.who}`}>
        <div class="bubble">
          <span class="who">${t.who === 'sophist' ? 'הסופיסט' : 'אתה'}</span>
          <p><${T} text=${t.text} /></p>
          ${t.fallacy && i === shown - 1 && answers[i] === undefined && asking !== i && html`<button class="btn btn-sm btn-gold catch" onClick=${() => setAsking(i)}><${Icon} name="magnifier" />תפסתי כשל</button>`}
        </div>
        ${asking === i && answers[i] === undefined && html`<div class="catch-box">
          <span class="label">איזה כשל?</span>
          <div class="opts">${t.options.map((o, k) => html`<${Opt} i=${k} text=${title(o)} onClick=${() => setAnswers({ ...answers, [i]: o })} />`)}</div>
        </div>`}
        ${answers[i] !== undefined && html`<${Feedback} ok=${answers[i] === t.fallacy} title=${answers[i] === t.fallacy ? `נתפס: ${title(t.fallacy)}` : answers[i] === null ? `פספסת: כאן היה ${title(t.fallacy)}` : `לא בדיוק. זה היה ${title(t.fallacy)}`}><p><${T} text=${t.feedback} /></p></${Feedback}>`}
      </div>`)}
    </div>
    ${!end ? html`<div class="row next-row"><button class="btn btn-ghost" onClick=${next}>${d.turns[shown - 1] && d.turns[shown - 1].fallacy && answers[shown - 1] === undefined ? 'להמשיך בלי לעצור' : 'להמשיך'}<${Icon} name="next" /></button></div>`
      : html`<div class="result stack"><div class="result-badge ok"><${Icon} name="magnifier" /><strong>${caught} מתוך ${fallacyTurns.length}</strong></div><p><${T} text=${d.outro} /></p><a class="btn" href="#/practice">למרכז התרגול</a></div>`}
  </div>`;
}

export function Eli10() {
  const s = data().samples;
  const e = s && s.eli10;
  const [text, setText] = useState(e ? e.sampleAnswer : '');
  const [fb, setFb] = useState(false);
  if (!e) return html`<div class="stack"><${Back} href="#/practice" label="לתרגול" /><${Empty} icon="clock" title="הדוגמה עוד בבדיקת עובדות" /></div>`;
  const f = e.feedback;
  return html`<div class="eli10 read">
    <${Back} href="#/practice" label="לתרגול" />
    <div class="screen-title"><span class="kicker">תסביר כאילו אני בן 10</span><h1>${title(e.concept)}</h1><p><${T} text=${e.prompt} /></p></div>
    <${DemoNote}>המשוב כאן הוכן מראש לתשובה לדוגמה שכבר כתובה בתיבה. בגרסה המלאה הבינה המלאכותית קוראת את מה שאתה כותב.</${DemoNote}>
    <label><span class="field-label">ההסבר שלך</span><textarea class="textarea" dir="auto" value=${text} onInput=${(ev) => setText(ev.target.value)}></textarea></label>
    ${!fb ? html`<button class="btn" onClick=${() => setFb(true)}><${Icon} name="pencil" />לקבל משוב</button>` : html`<div class="eli-feedback stack">
      <div class="score-ring" style=${`--p:${(f.score / f.of).toFixed(3)}`}><strong class="num">${f.score}</strong><span>מתוך ${f.of}</span></div>
      <div class="eli-cols">
        <div><span class="label">מה עבד</span><ul class="ticks">${f.strengths.map((x) => html`<li><${Icon} name="check" />${x}</li>`)}</ul></div>
        <div><span class="label">מה חסר</span><ul class="ticks miss">${f.missing.map((x) => html`<li><${Icon} name="plus" />${x}</li>`)}</ul></div>
      </div>
      <div class="panel panel-quiet"><span class="label">טעות נפוצה ששווה לשים לב אליה</span><p><${T} text=${f.misconception} /></p></div>
      <div class="model-answer"><span class="label">גרסה משופרת</span><${Paras} text=${f.improved} /></div>
      <details class="rubric-details"><summary>המחוון שלפיו נבדק ההסבר</summary><ul>${e.rubric.map((r) => html`<li>${r}</li>`)}</ul></details>
    </div>`}
  </div>`;
}

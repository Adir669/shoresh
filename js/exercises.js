// מנוע התרגילים: מציג כל סוג תרגיל ומחזיר תוצאה (נכון / לא נכון).
import { html, useState } from './vendor/standalone.module.js';
import { Icon } from './icons.js';
import { Opt, Feedback, KEYS } from './ui.js';

export const TYPE_NAME = {
  case: 'תיק לפענוח', duel: 'דו־קרב תאומים', hunt: 'ציד בשטח', mcq: 'שאלה',
  truefalse: 'נכון או לא נכון', firstfall: 'קודם נופלים', explain: 'תסביר במילים שלך',
};
const ART_NAME = { headline: 'כותרת', ad: 'פרסומת', post: 'פוסט', quote: 'ציטוט', chat: 'הודעה', 'chart-caption': 'כיתוב לגרף' };

// מדגיש קטע מדויק מתוך טקסט (אחרי שעונים)
function Highlight({ text, part, on }) {
  if (!on || !part || !text.includes(part)) return text;
  const i = text.indexOf(part);
  return html`${text.slice(0, i)}<mark class="clue">${part}</mark>${text.slice(i + part.length)}`;
}

function Choice({ ex, onDone, children }) {
  const [pick, setPick] = useState(null);
  const answered = pick !== null;
  const ok = answered && pick === ex.answer;
  const choose = (i) => { if (answered) return; setPick(i); onDone && onDone(i === ex.answer); };
  return html`<div class="stack">
    ${children(answered)}
    <p class="ex-prompt">${ex.prompt}</p>
    <div class="opts">${ex.options.map((o, i) => html`<${Opt} i=${i} text=${o} disabled=${answered}
      state=${!answered ? '' : i === ex.answer ? 'correct' : i === pick ? 'wrong' : 'dim'} onClick=${() => choose(i)} />`)}</div>
    ${answered && html`<${Feedback} ok=${ok} title=${ok ? 'נכון.' : `לא בדיוק. התשובה: ${ex.options[ex.answer]}`}><p>${ex.explanation}</p></${Feedback}>`}
  </div>`;
}

function CaseEx({ ex, onDone }) {
  return html`<${Choice} ex=${ex} onDone=${onDone}>${(answered) => html`<div class="dossier">
    <div class="dossier-tab"><${Icon} name="folder" />תיק</div>
    <h3>${ex.title}</h3>
    <p class="dossier-text"><${Highlight} text=${ex.scenario} part=${ex.clue} on=${answered} /></p>
  </div>`}</${Choice}>`;
}

function HuntEx({ ex, onDone }) {
  const a = ex.artifact || {};
  return html`<${Choice} ex=${ex} onDone=${onDone}>${(answered) => html`<figure class=${`artifact art-${a.kind}`}>
    <figcaption class="art-label"><${Icon} name="magnifier" />${a.label || ART_NAME[a.kind]}</figcaption>
    <p class="art-text"><${Highlight} text=${a.text} part=${ex.highlight} on=${answered} /></p>
  </figure>`}</${Choice}>`;
}

function McqEx({ ex, onDone }) {
  return html`<${Choice} ex=${ex} onDone=${onDone}>${() => null}</${Choice}>`;
}

function TrueFalseEx({ ex, onDone }) {
  const [pick, setPick] = useState(null);
  const answered = pick !== null;
  const ok = answered && pick === ex.answer;
  const choose = (v) => { if (answered) return; setPick(v); onDone && onDone(v === ex.answer); };
  const st = (v) => (!answered ? '' : v === ex.answer ? 'correct' : v === pick ? 'wrong' : 'dim');
  return html`<div class="stack">
    <blockquote class="tf-statement">${ex.statement}</blockquote>
    <div class="tf-row">
      <button class="opt" data-state=${st(true)} disabled=${answered} onClick=${() => choose(true)}><${Icon} name="check" />נכון</button>
      <button class="opt" data-state=${st(false)} disabled=${answered} onClick=${() => choose(false)}><${Icon} name="x" />לא נכון</button>
    </div>
    ${answered && html`<${Feedback} ok=${ok} title=${ok ? 'נכון.' : `לא בדיוק. התשובה: ${ex.answer ? 'נכון' : 'לא נכון'}`}><p>${ex.explanation}</p></${Feedback}>`}
  </div>`;
}

function DuelEx({ ex, onDone }) {
  const [sel, setSel] = useState({ a: null, b: null });
  const [done, setDone] = useState(false);
  const ready = sel.a !== null && sel.b !== null;
  const ok = done && sel.a === ex.answer.a && sel.b === ex.answer.b;
  const set = (side, i) => { if (done) return; setSel({ ...sel, [side]: i }); };
  const check = () => { setDone(true); onDone && onDone(sel.a === ex.answer.a && sel.b === ex.answer.b); };
  const Side = ({ side, label }) => html`<div class=${`duel-card${done ? (sel[side] === ex.answer[side] ? ' is-ok' : ' is-bad') : ''}`}>
    <span class="duel-tag">${label}</span>
    <p>${ex[side]}</p>
    <div class="duel-picks">${ex.concepts.map((c, i) => html`<button class="duel-pick" aria-pressed=${String(sel[side] === i)} disabled=${done} onClick=${() => set(side, i)}>${c}</button>`)}</div>
    ${done && html`<span class="duel-answer">${ex.concepts[ex.answer[side]]}</span>`}
  </div>`;
  return html`<div class="stack">
    <p class="ex-prompt">${ex.prompt}</p>
    <div class="duel"><${Side} side="a" label="מקרה א׳" /><span class="duel-vs" aria-hidden="true">מול</span><${Side} side="b" label="מקרה ב׳" /></div>
    ${!done ? html`<button class="btn" disabled=${!ready} onClick=${check}>לבדוק</button>`
      : html`<${Feedback} ok=${ok} title=${ok ? 'הבחנה מדויקת.' : 'כמעט. שווה לעבור שוב על ההבדל.'}><p>${ex.explanation}</p></${Feedback}>`}
  </div>`;
}

export function FirstFallEx({ ex, onDone, stat }) {
  const [pick, setPick] = useState(null);
  const answered = pick !== null;
  const choose = (i) => { if (answered) return; setPick(i); onDone && onDone(i === ex.answer); };
  return html`<div class="stack">
    <div class="firstfall-setup"><p>${ex.setup}</p></div>
    <div class="opts">${ex.options.map((o, i) => html`<${Opt} i=${i} text=${o} disabled=${answered}
      state=${!answered ? '' : i === ex.answer ? 'correct' : i === pick ? 'wrong' : 'dim'} onClick=${() => choose(i)} />`)}</div>
    ${answered && html`<div class="reveal-box">
      <span class="kicker">${pick === ex.intuitive && pick !== ex.answer ? 'נפלת, כמו רוב האנשים.' : pick === ex.answer ? 'לא נפלת. רוב האנשים כן.' : 'מעניין.'}</span>
      ${stat && html`<p class="reveal-stat">${stat}</p>`}
      <p>${ex.reveal}</p>
      ${ex.explanation && html`<p class="muted">${ex.explanation}</p>`}
    </div>`}
  </div>`;
}

function ExplainEx({ ex, onDone }) {
  const [text, setText] = useState('');
  const [shown, setShown] = useState(false);
  const [checks, setChecks] = useState([]);
  const toggle = (i) => setChecks(checks.includes(i) ? checks.filter((x) => x !== i) : [...checks, i]);
  return html`<div class="stack">
    <p class="ex-prompt">${ex.prompt}</p>
    <textarea class="textarea" dir="auto" placeholder="כתוב כאן את ההסבר שלך" value=${text} onInput=${(e) => setText(e.target.value)}></textarea>
    ${!shown ? html`<button class="btn btn-ghost" onClick=${() => { setShown(true); }}>להשוות לתשובה לדוגמה</button>` : html`<div class="stack">
      <div class="model-answer"><span class="label">תשובה לדוגמה</span><p>${ex.modelAnswer}</p></div>
      <div><span class="label">מה הסבר טוב כולל? סמן מה היה אצלך</span>
        <div class="rubric">${ex.rubric.map((r, i) => html`<label class="rubric-item"><input type="checkbox" checked=${checks.includes(i)} onChange=${() => toggle(i)} /><span>${r}</span></label>`)}</div>
      </div>
      <button class="btn" onClick=${() => onDone && onDone(checks.length >= Math.ceil(ex.rubric.length / 2))}>סיימתי</button>
    </div>`}
  </div>`;
}

export function ExerciseView({ ex, onDone }) {
  const C = { case: CaseEx, hunt: HuntEx, mcq: McqEx, truefalse: TrueFalseEx, duel: DuelEx, firstfall: FirstFallEx, explain: ExplainEx }[ex.type];
  return C ? html`<div class="exercise" data-type=${ex.type}>
    <span class="ex-type">${TYPE_NAME[ex.type]}</span>
    <${C} ex=${ex} onDone=${onDone} key=${ex.id} />
  </div>` : null;
}

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

// התאמה (D-21): שם המושג מול התיאור שלו במשפט אחד. נבנית בזמן ריצה מהתוכן המאומת, ולכן
// לא נשמרת כתרגיל ולא עוברת את SCHEMA. בוחרים שם ואז את התיאור; טעות רק מהבהבת ונספרת.
// onDone(ok, { miss, firstTry }): ok כשהיו לכל היותר טעות אחת.
export function MatchEx({ pairs, seed = 'm', onDone }) {
  const [names] = useState(() => mix(pairs.map((x) => x.id), `${seed}:n`));
  // התיאורים לא באותו סדר כמו השמות, אחרת ההתאמה נפתרת מעצמה
  const [texts] = useState(() => { const t = mix(pairs.map((x) => x.id), `${seed}:t`); return t.length > 1 && t.every((x, i) => x === names[i]) ? [...t.slice(1), t[0]] : t; });
  const [sel, setSel] = useState(null);
  const [got, setGot] = useState([]);
  const [miss, setMiss] = useState(0);
  const [missed, setMissed] = useState([]); // מזהים שהייתה בהם טעות, לניקוד "בפעם הראשונה"
  const [bad, setBad] = useState(null);
  const [say, setSay] = useState(''); // הודעה לקורא מסך: מה קרה בבחירה האחרונה
  const by = Object.fromEntries(pairs.map((x) => [x.id, x]));
  const finished = got.length === pairs.length;
  const pick = (tid) => {
    if (!sel || got.includes(tid) || finished) return;
    if (sel === tid) {
      const next = [...got, tid];
      setGot(next); setSel(null); setSay(`נכון: ${by[tid].name}`);
      if (next.length === pairs.length && onDone) onDone(miss <= 1, { miss, firstTry: pairs.length - missed.length });
    } else {
      setMiss(miss + 1); setBad(tid); setSay(`לא מתאים ל"${by[sel].name}". נסו תיאור אחר.`);
      if (!missed.includes(sel)) setMissed([...missed, sel]);
      setTimeout(() => setBad(null), 650);
    }
  };
  return html`<div class="stack match">
    <p class="ex-prompt">איזה תיאור שייך לאיזה מושג?</p>
    <div class="match-names" role="group" aria-label="שמות המושגים">${names.map((id) => html`<button class="match-name" data-id=${id} aria-pressed=${String(sel === id)} disabled=${got.includes(id)} onClick=${() => setSel(sel === id ? null : id)}>${by[id].name}</button>`)}</div>
    <div class="match-texts">${texts.map((id) => {
      const ok = got.includes(id);
      return html`<button class=${`match-text${ok ? ' is-ok' : ''}${bad === id ? ' is-bad' : ''}`} data-id=${id} disabled=${ok || finished} onClick=${() => pick(id)}>
        ${ok && html`<span class="match-tag"><${Icon} name="check" />${by[id].name}</span>`}
        <span>${by[id].text}</span>
      </button>`;
    })}</div>
    <p class="sr-only" aria-live="polite">${say}</p>
    ${finished ? html`<${Feedback} ok=${miss <= 1} title=${miss === 0 ? 'הכול במקום, בלי טעות אחת.' : miss === 1 ? 'הכול במקום, עם טעות אחת בדרך.' : `הכול במקום, אחרי ${miss} טעויות. שווה לעבור שוב על הכרטיסים.`} />`
      : html`<p class="faint match-hint">${sel ? `עכשיו בחרו את התיאור של "${by[sel].name}".` : 'בחרו שם, ואז את התיאור שמתאים לו.'}</p>`}
  </div>`;
}
// ערבוב יציב לפי מחרוזת, כדי שאותו סבב ייראה אותו דבר בכל טעינה (וגם בצילומי המסך)
function mix(arr, seed) {
  let h = 2166136261;
  for (const ch of seed + arr.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177); const j = Math.abs(h) % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function ExerciseView({ ex, onDone }) {
  const C = { case: CaseEx, hunt: HuntEx, mcq: McqEx, truefalse: TrueFalseEx, duel: DuelEx, firstfall: FirstFallEx, explain: ExplainEx }[ex.type];
  return C ? html`<div class="exercise" data-type=${ex.type} data-id=${ex.id}>
    <span class="ex-type">${TYPE_NAME[ex.type]}</span>
    <${C} ex=${ex} onDone=${onDone} key=${ex.id} />
  </div>` : null;
}

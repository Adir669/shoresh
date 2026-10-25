// מסך 5: תרגול — מרכז התרגול, סבבים לפי סוג, "קודם נופלים", והשקיה.
import { html, useState } from '../vendor/standalone.module.js';
import { data, node, title, fullOf, cardOf, exercisesOf, dueList, actions, levelOf } from '../data.js';
import { Icon } from '../icons.js';
import { FieldChip, Back, Empty, Feedback, toast, fmtRel, Emblem, Ill } from '../ui.js';
import { ExerciseView, FirstFallEx, TYPE_NAME } from '../exercises.js';

// לכל סוג תרגול איור משלו (Higgsfield, בסגנון האטלס): app/img/atlas/ill-<id>.webp
const KINDS = [
  { id: 'case', href: '#/practice/case', he: 'תיק לפענוח', desc: 'סיפור קצר עם אנשים והחלטה. מה הכשל המרכזי?' },
  { id: 'duel', href: '#/practice/duel', he: 'דו־קרב תאומים', desc: 'שני מקרים דומים, שני מושגים דומים. מי זה מי?' },
  { id: 'firstfall', href: '#/practice/firstfall', he: 'קודם נופלים', desc: 'שאלה שרוב האנשים טועים בה, ורק אחר כך ההסבר.' },
  { id: 'hunt', href: '#/practice/hunt', he: 'ציד בשטח', desc: 'כותרת, פרסומת או פוסט. איפה הכשל?' },
  { id: 'pd', href: '#/practice/pd', he: 'דילמת האסיר', desc: 'סימולציה: עשרה סיבובים מול אסטרטגיה נסתרת, ואז טורניר.' },
];
const LABS = [
  { id: 'debate', href: '#/debate', he: 'ויכוח עם סופיסט', desc: 'הוא מתווכח איתך ומשחיל כשלים. תתפוס אותם תוך כדי.' },
  { id: 'eli10', href: '#/eli10', he: 'תסביר כאילו אני בן 10', desc: 'אתה מסביר במילים שלך, ומקבל משוב לפי מחוון.' },
];
const KindIll = ({ id }) => html`<span class="kind-ill"><img src=${`img/atlas/ill-${id}.webp`} alt="" width="480" height="480" loading="lazy" decoding="async" /></span>`;

export function Practice({ ctx }) {
  const { p } = ctx;
  const due = dueList(p);
  const count = (t) => exercisesOf(t, p).length;
  return html`<div class="practice">
    <div class="screen-title"><span class="kicker">תרגול</span><h1>לזהות, להבחין, להשתמש</h1><p>כל תרגיל כאן בודק זיהוי במצב חדש, לא שינון של הגדרה. המקרים מגיעים קודם מהמושגים שכבר למדת.</p></div>
    ${due.length > 0 && html`<a class="tile water-banner" href="#/water"><${Icon} name="drop" /><div><strong>${due.length} מושגים מחכים להשקיה</strong><p class="muted">${due.slice(0, 4).map(title).join(' · ')}</p></div><${Icon} name="next" /></a>`}
    <div class="kind-grid reveal">
      ${KINDS.map((k, i) => html`<a class=${`tile kind kind-${k.id}`} href=${k.href} style=${`--i:${i}`}>
        <span class="kind-text">
          <strong>${k.he}</strong><span class="muted">${k.desc}</span>
          ${['case', 'duel', 'hunt'].includes(k.id) && html`<span class="faint num kind-count">${count(k.id)} תרגילים</span>`}
        </span>
        <${KindIll} id=${k.id} />
      </a>`)}
    </div>
    <div class="section-head labs-head"><h2>מעבדה</h2><span class="badge badge-demo">הדגמה עם תוכן לדוגמה</span></div>
    <div class="lab-grid">${LABS.map((k) => html`<a class=${`tile kind kind-lab kind-${k.id}`} href=${k.href}><span class="kind-text"><strong>${k.he}</strong><span class="muted">${k.desc}</span></span><${KindIll} id=${k.id} /></a>`)}</div>
  </div>`;
}

function Runner({ ctx, type, intro }) {
  const { state, p } = ctx;
  const [items] = useState(() => exercisesOf(type, p).slice(0, 5));
  const [i, setI] = useState(0);
  const [score, setScore] = useState([]);
  const [leveled, setLeveled] = useState([]);
  if (!items.length) return html`<div class="stack"><${Back} href="#/practice" label="לתרגול" /><${Empty} ill="mo-seeds" title="עוד אין תרגילים מהסוג הזה"><span>הם ייכנסו כשהמושגים יעברו בדיקת עובדות.</span></${Empty}></div>`;
  const done = i >= items.length;
  const ex = items[i];
  const record = (ok) => {
    actions.answer(state, ex.id, ok);
    if (type === 'duel' && ok) {
      // דו־קרב שעבר מעלה ממזהה למבחין. הרגע מוצג בסיכום, כדי לא לקטוע את הסבב
      if (levelOf(p, ex.concept) === 3 && !leveled.includes(ex.concept)) setLeveled([...leveled, ex.concept]);
      actions.duel(state, ex.concept, true);
    }
    setScore([...score, ok]);
  };
  return html`<div class="runner read">
    <div class="row-between"><${Back} href="#/practice" label="לתרגול" /><span class="faint num">${Math.min(score.length + 1, items.length)} מתוך ${items.length}</span></div>
    <div class="screen-title"><span class="kicker">${TYPE_NAME[type]}</span><h1>${intro}</h1></div>
    <div class="dots">${items.map((_, k) => html`<span class=${`dot-step${k < score.length ? (score[k] ? ' ok' : ' bad') : k === i ? ' now' : ''}`}></span>`)}</div>
    ${!done ? html`<div key=${i} class="stack">
      <div class="row"><${FieldChip} id=${node(ex.concept).field} /><a class="faint" href=${`#/c/${ex.concept}`}>${title(ex.concept)}</a></div>
      <${ExerciseView} ex=${ex} onDone=${record} />
      ${score.length > i && html`<div class="row next-row"><button class="btn" onClick=${() => setI(i + 1)}>${i + 1 < items.length ? 'לתרגיל הבא' : 'לסיכום'}<${Icon} name="next" /></button></div>`}
    </div>` : html`<div class="result stack">
      ${leveled.length > 0 && html`<${Ill} name="mo-depth" size="lg" />`}
      <div class="result-badge ok"><${Icon} name="target" /><strong>${score.filter(Boolean).length} מתוך ${items.length}</strong></div>
      <h2>סבב הושלם</h2>
      ${leveled.length > 0 && html`<p class="muted">עלית לדרגת "מבחין" ב${leveled.map(title).join(', ')}: הבחנת בינו לבין מושג קרוב. הדרגה הבאה, "משתמש", מגיעה כשתפגוש אותו בחיים ותרשום אותו ביומן.</p>`}
      <div class="row"><a class="btn" href="#/practice">למרכז התרגול</a><a class="btn btn-ghost" href="#/map">למפה</a></div>
    </div>`}
  </div>`;
}

export const CaseRun = ({ ctx }) => html`<${Runner} ctx=${ctx} type="case" intro="חמישה תיקים. בכל אחד מסתתר מושג אחד." />`;
export const DuelRun = ({ ctx }) => html`<${Runner} ctx=${ctx} type="duel" intro="שני מקרים, שני מושגים דומים." />`;
export const HuntRun = ({ ctx }) => html`<${Runner} ctx=${ctx} type="hunt" intro="טקסטים מהעולם. איפה הכשל?" />`;

export function FirstFall({ ctx }) {
  const s = data().samples;
  const [done, setDone] = useState(false);
  if (!s || !s.firstfall) return html`<div class="stack"><${Back} href="#/practice" label="לתרגול" /><${Empty} ill="mo-review" title="התרגיל הזה עוד בבדיקת עובדות" /></div>`;
  const f = s.firstfall;
  return html`<div class="runner read">
    <${Back} href="#/practice" label="לתרגול" />
    <div class="screen-title"><span class="kicker">קודם נופלים</span><h1>${f.title}</h1><p>ענה מהבטן, לפני שאתה חושב יותר מדי.</p></div>
    <div class="exercise"><${FirstFallEx} ex=${f} onDone=${() => setDone(true)} /></div>
    ${done && html`<div class="row next-row"><a class="btn" href=${`#/c/${f.concept}`}>לכרטיס של ${title(f.concept)}<${Icon} name="next" /></a></div>`}
  </div>`;
}

// השקיה: שאלה מהירה לכל מושג שהגיע זמנו
function quickFor(id) {
  const c = fullOf(id);
  if (c) {
    const tf = c.exercises.find((e) => e.type === 'truefalse');
    const cs = c.exercises.find((e) => e.type === 'case');
    return tf || cs || null;
  }
  return null;
}

function RecallCard({ id, onDone }) {
  const [shown, setShown] = useState(false);
  const c = cardOf(id) || fullOf(id);
  return html`<div class="recall">
    <span class="ex-type">זוכר?</span>
    <h2>${title(id)}</h2>
    <p class="muted">מה המושג אומר, ואיפה הוא מופיע ביום־יום?</p>
    ${!shown ? html`<button class="btn btn-ghost" onClick=${() => setShown(true)}>להציג</button>` : html`<div class="stack">
      <div class="reveal-box"><p>${c ? c.oneLiner : ''}</p></div>
      <div class="row"><button class="btn" onClick=${() => onDone(true)}><${Icon} name="check" />זכרתי</button><button class="btn btn-ghost" onClick=${() => onDone(false)}>לא ממש</button></div>
    </div>`}
  </div>`;
}

export function WaterRun({ ctx }) {
  const { state, p } = ctx;
  const [ids] = useState(() => dueList(p).slice(0, 6));
  const [i, setI] = useState(0);
  const [res, setRes] = useState([]);
  if (!ids.length) return html`<div class="stack"><${Back} href="#/home" /><${Empty} ill="mo-water" title="אין מה להשקות עכשיו"><span>כל השורשים רטובים. ההשקיה הבאה תופיע בבית כשיגיע הזמן.</span></${Empty}></div>`;
  const done = i >= ids.length;
  const id = ids[i];
  const record = (ok) => { actions.water(state, id, ok); setRes([...res, ok]); };
  const q = !done && quickFor(id);
  return html`<div class="runner read">
    <div class="row-between"><${Back} href="#/home" /><span class="faint num">${Math.min(res.length + 1, ids.length)} מתוך ${ids.length}</span></div>
    <div class="screen-title"><span class="kicker"><${Icon} name="drop" /> השקיה</span><h1>חוזרים בדיוק על מה שמתחיל להישכח</h1></div>
    <div class="dots">${ids.map((_, k) => html`<span class=${`dot-step${k < res.length ? (res[k] ? ' ok' : ' bad') : k === i ? ' now' : ''}`}></span>`)}</div>
    ${!done ? html`<div key=${i} class="stack">
      <div class="water-cue"><${Emblem} id=${id} size="md" /><div class="row"><${FieldChip} id=${node(id).field} /><strong>${title(id)}</strong></div></div>
      ${res.length > i ? html`<${Feedback} ok=${res[i]} title=${res[i] ? 'הושקה. החזרה הבאה תהיה רחוקה יותר.' : 'נרשם. המושג יחזור כבר מחר.'} />`
        : q ? html`<${ExerciseView} ex=${q} onDone=${record} />` : html`<${RecallCard} id=${id} onDone=${record} />`}
      ${res.length > i && html`<div class="row next-row"><button class="btn" onClick=${() => setI(i + 1)}>${i + 1 < ids.length ? 'הבא' : 'לסיכום'}<${Icon} name="next" /></button></div>`}
    </div>` : html`<div class="result stack">
      <${Ill} name="mo-water" size="lg" />
      <div class="result-badge ok"><${Icon} name="drop" /><strong>${res.filter(Boolean).length} מתוך ${ids.length}</strong></div>
      <h2>השורשים הושקו</h2>
      <p class="muted">מה שזכרת יחזור בעוד כמה ימים, ומה שפחות יחזור מחר.</p>
      <div class="row"><a class="btn" href="#/home">לבית</a><a class="btn btn-ghost" href="#/map">למפה</a></div>
    </div>`}
  </div>`;
}

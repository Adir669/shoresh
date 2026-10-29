// תחנה במסלול (D-21): מסך ממוקד בלי סרגלים, צעד אחרי צעד, כמו שיעור בדואולינגו.
// בסוף: הנקודות שנצברו, עלייה בדרגה או ברמה, חותמות חדשות באוסף, וכפתור אחד לצעד הבא.
// כל הטקסט מגיע מהתוכן המאומת כלשונו; ההתאמה נבנית מהמשפט המאומת של כל מושג (pairsFor).
import { html, useState, useEffect } from '../vendor/standalone.module.js';
import { node, title, fullOf, cardOf, levelOf, actions, levelInfo, LEVELS, data, exampleKey, POINTS } from '../data.js';
import { stations, pools, KINDS, stationName, stationSub, nextAction, hrefOf, cardPairs, testPairs, stampSet } from '../course.js';
import { Icon } from '../icons.js';
import { Paras, Emblem, Ill, LevelBadge, Bar, Evidence, Empty } from '../ui.js';
import { ExerciseView, FirstFallEx, MatchEx } from '../exercises.js';
import { Planes } from './concept.js';

const HOOK_KIND = { experiment: 'ניסוי', story: 'סיפור', case: 'מקרה', riddle: 'חידה' };
const EX_ORDER = ['daily', 'finance', 'politics', 'history', 'science', 'business', 'relationships'];
const EX_NAME = { daily: 'יומיום', finance: 'כסף', politics: 'פוליטיקה', history: 'היסטוריה', science: 'מדע', business: 'עבודה', relationships: 'יחסים' };
const ANSWERED = ['ex', 'match', 'firstfall'];

function buildSteps(s) {
  const pl = pools(s.concept);
  const c = fullOf(s.concept);
  if (s.kind === 'lesson') {
    const it = c.interactive;
    return [{ t: 'hook' }, ...(it && it.kind === 'planes' ? [{ t: 'planes' }] : []), { t: 'essence' }, { t: 'example' }, { t: 'spot' }];
  }
  // "קודם נופלים" בנוי כך שרוב האנשים טועים בו, ולכן הוא לא נספר בציון של התרגול
  if (s.kind === 'practice') return pl.practice.map((ex) => ({ t: 'ex', ex, scored: ex.type !== 'firstfall' }));
  if (s.kind === 'check') return pl.check.map((ex) => ({ t: 'ex', ex, scored: true }));
  if (s.kind === 'duel') return [{ t: 'twins' }, ...pl.duel.map((ex) => ({ t: 'ex', ex, scored: true }))];
  if (s.kind === 'cards') {
    const ff = data().samples && data().samples.firstfall;
    const out = [];
    s.cards.filter((x) => cardOf(x)).forEach((x) => {
      // "קודם נופלים" לפני הכרטיס שהוא שייך אליו (בעיית לינדה לפני כשל הצירוף)
      if (ff && ff.concept === x) out.push({ t: 'firstfall' });
      out.push({ t: 'card', id: x });
    });
    const pairs = cardPairs(s);
    if (pairs.length >= 3) out.push({ t: 'match', pairs, scored: true });
    return out;
  }
  const out = pl.test.map((ex) => ({ t: 'ex', ex, scored: true }));
  const pairs = testPairs(s);
  if (pairs.length >= 3) out.push({ t: 'match', pairs, scored: true });
  if (pl.explain) out.push({ t: 'ex', ex: pl.explain, scored: false });
  return out;
}

// כמה תשובות נכונות צריך כדי לעבור: בדיקת זיהוי 2 מתוך 3, דו־קרב חצי, מבחן השלב 60%. השאר תמיד עוברות.
function passMark(kind, n) {
  if (kind === 'check') return Math.min(2, n);
  if (kind === 'duel') return Math.ceil(n / 2);
  if (kind === 'test') return Math.ceil(n * 0.6);
  return 0;
}

// ── הצעדים ──
function HookStep({ c, revealed }) {
  const h = c.hook;
  return html`<div class="stack sess-read">
    <span class="kicker">${HOOK_KIND[h.kind] || 'פתיחה'}</span>
    <h1 class="sess-h">${h.title}</h1>
    <${Paras} text=${h.body} />
    ${h.question && html`<p class="hook-q">${h.question}</p>`}
    ${revealed && html`<div class="reveal-box"><${Paras} text=${h.reveal} /></div>`}
  </div>`;
}

function EssenceStep({ c }) {
  return html`<div class="stack sess-read">
    <span class="kicker">התמצית</span>
    <p class="essence">${c.essence.sentence}</p>
    <ul class="essence-lines">${c.essence.lines.map((l) => html`<li>${l}</li>`)}</ul>
  </div>`;
}

function ExampleStep({ c, interests }) {
  const keys = EX_ORDER.filter((k) => c.examples[k]);
  const want = exampleKey(interests);
  const [k, setK] = useState(keys.includes(want) ? want : keys[0]);
  const e = c.examples[k];
  return html`<div class="stack sess-read">
    <span class="kicker">דוגמה מהעולם שלך · ${EX_NAME[k]}</span>
    <h2 class="sess-h2">${e.title}</h2>
    <div class="example-body" key=${k}><${Paras} text=${e.body} /></div>
    <span class="faint">${e.kind === 'real' ? 'מקרה אמיתי' : 'דוגמה להמחשה'}</span>
    ${keys.length > 1 && html`<button class="btn btn-ghost btn-sm sess-more" onClick=${() => setK(keys[(keys.indexOf(k) + 1) % keys.length])}><${Icon} name="refresh" />דוגמה מעולם אחר</button>`}
  </div>`;
}

function SpotStep({ c, id }) {
  return html`<div class="stack sess-read">
    <span class="kicker">איך מזהים</span>
    <h2 class="sess-h2">הסימנים שמסגירים את ${c.title.he}</h2>
    <ul class="spot-list">${c.spotting.signals.map((x) => html`<li>${x}</li>`)}</ul>
    <span class="label">משפטים אופייניים</span>
    <ul class="phrases">${c.spotting.phrases.map((x) => html`<li><${Icon} name="quote" />${x}</li>`)}</ul>
    <p class="faint sess-deeper">המנגנון, המחקר, המקרים והמקורות לכל טענה נמצאים <a href=${`#/c/${id}`}>בדף המושג המלא</a> (כ־${c.readingMinutes.full} דק׳).</p>
  </div>`;
}

function TwinsStep({ c }) {
  return html`<div class="stack sess-read">
    <span class="kicker">התאומים המבלבלים</span>
    <h2 class="sess-h2">לפני הדו־קרב: מה מבדיל את ${c.title.he} מהקרובים שלו</h2>
    <div class="twins">${c.twins.map((t) => html`<div class="twin"><h3>${t.name}</h3><p>${t.difference}</p><p class="twin-tell"><${Icon} name="scale" />${t.tell}</p></div>`)}</div>
  </div>`;
}

function CardStep({ id }) {
  const c = cardOf(id), n = node(id);
  return html`<article class="stack sess-read sess-card" data-field=${n.field}>
    <div class="concept-title">
      <div class="concept-title-text"><span class="badge">כרטיס קצר</span><h1 class="sess-h">${n.he}</h1><span class="en title-en">${n.en}</span></div>
      <${Emblem} id=${id} size="md" />
    </div>
    <p class="lead sess-lead">${c.oneLiner}</p>
    <${Paras} text=${c.body} />
    <div class="example"><span class="kicker">${c.example.kind === 'real' ? 'מקרה אמיתי' : 'דוגמה'}</span><p>${c.example.text}</p></div>
    <p class="muted evidence-note"><${Evidence} level=${c.evidence.level} /> ${c.evidence.note}</p>
  </article>`;
}

function FirstFallStep({ onDone }) {
  const ff = data().samples.firstfall;
  return html`<div class="stack sess-read">
    <span class="kicker">קודם נופלים</span>
    <h2 class="sess-h2">${ff.title}</h2>
    <p class="muted">ענו מהבטן, לפני שאתם חושבים יותר מדי. ההסבר מגיע בכרטיס הבא.</p>
    <div class="exercise"><${FirstFallEx} ex=${ff} onDone=${onDone} /></div>
  </div>`;
}

// ── סוף התחנה ──
function Result({ s, p, state, start, res, onRetry }) {
  const id = s.concept;
  // מסך הסיום מציג את העלייה ברמה בעצמו, ולכן מסמן אותה כמוצגת (בלי חלון נוסף כשחוזרים למסלול)
  useEffect(() => { actions.levelShown(state, levelInfo(p.points || 0).n); }, []);
  const earned = Math.max(0, (p.points || 0) - start.points);
  const lvA = levelInfo(start.points).n;
  const lv = levelInfo(p.points || 0);
  const now = stampSet(p);
  const fresh = [...now].filter((x) => !start.stamps.has(x));
  const rungA = start.rung, rungB = levelOf(p, id);
  const next = nextAction(p);
  const sealed = s.kind === 'test' && res.passed && fresh.includes(id);
  const head = !res.passed ? 'כמעט. עוד ניסיון קטן.'
    : sealed ? 'השלב הושלם'
      : s.kind === 'check' ? 'זיהית. השורש מתפצל.'
        : s.kind === 'duel' ? 'הבחנה מדויקת'
          : 'התחנה הושלמה';
  const line = !res.passed
    ? (s.kind === 'test' ? `צריך ${res.need} נכונות מתוך ${res.total}. אפשר לנסות שוב מיד, או לחזור קודם לתחנות של השלב.` : `צריך ${res.need} נכונות מתוך ${res.total}. כדאי לעבור שוב על "איך מזהים" ועל התאומים, ולנסות שוב.`)
    : start.done ? 'חזרה על תחנה שכבר הושלמה. חזרה מחזקת את הזיכרון, ובחזרה הנקודות מגיעות רק מתשובות נכונות.'
    : sealed ? `החותמת של ${title(id)} נכנסה לאוסף. מכאן, כשתפגוש את המושג בחיים, רשום אותו ב"ראיתי את זה".`
      : s.kind === 'lesson' ? 'השורש ירד שכבה. בתחנה הבאה בודקים שהמושג ברור, ואחר כך מזהים אותו במקרים חדשים.'
        : s.kind === 'check' ? 'הענפים של המושג נפתחו: הכרטיסים הבאים במסלול הם המושגים הקרובים אליו.'
          : s.kind === 'cards' ? 'הכרטיסים נכנסו לאוסף, וההשקיה תחזיר אותם בעוד יום.'
            : s.kind === 'duel' ? 'מבחין בין תאומים זו הדרגה הרביעית בסולם. הבאה מגיעה כשתפגוש את המושג בחיים.'
              : 'עוד צעד במסלול.';
  const visual = sealed ? html`<span class="seal-reveal"><${Emblem} id=${id} size="lg" /></span>`
    : !res.passed ? html`<${Ill} name="mo-review" size="lg" />`
      : s.kind === 'lesson' ? html`<${Ill} name="mo-depth" size="lg" />`
        : s.kind === 'check' ? html`<${Ill} name="mo-branch" size="lg" />`
          : s.kind === 'duel' ? html`<${Ill} name="mo-depth" size="lg" />`
            : s.kind === 'cards' && fresh.length ? html`<span class="seal-row">${fresh.slice(0, 3).map((x) => html`<span class="seal-reveal"><${Emblem} id=${x} size="md" /></span>`)}</span>`
              : html`<${Ill} name="mo-seeds" size="lg" />`;
  const nx = next.kind === 'water' ? { href: '#/water', label: 'להשקיה קצרה' }
    : next.kind === 'station' ? { href: hrefOf(next.cur), label: next.cur.stage !== s.stage ? `לשלב ${next.cur.stage + 1}: ${title(next.cur.concept)}` : `לתחנה הבאה: ${stationName(next.cur)}` }
      : { href: '#/map', label: 'למפה, לשיטוט חופשי' };
  return html`<div class="sess-result" data-passed=${String(res.passed)}>
    <div class="result-visual">${visual}</div>
    <h1>${head}</h1>
    <p class="muted result-line">${line}</p>
    <div class="reward-row">
      ${earned > 0 && html`<span class="reward reward-pts"><${Icon} name="star" /><strong class="num">+${earned}</strong><span>נקודות</span></span>`}
      ${res.total > 0 && html`<span class="reward"><${Icon} name="target" /><strong class="num">${res.right} מתוך ${res.total}</strong><span>נכונות</span></span>`}
    </div>
    ${rungB > rungA && html`<p class="reward-line"><${Icon} name="sprout" />עלית דרגה ב${title(id)}: <strong>${LEVELS[rungB - 1].he}</strong></p>`}
    ${fresh.length > 0 && !sealed && s.kind !== 'cards' && html`<p class="reward-line"><${Icon} name="medal" />${fresh.length === 1 ? 'חותמת חדשה באוסף' : `${fresh.length} חותמות חדשות באוסף`}</p>`}
    <div class=${`level-meter${lv.n > lvA ? ' is-up' : ''}`}>
      <${LevelBadge} n=${lv.n} />
      <div class="lm-body">
        <strong>${lv.n > lvA ? `עלית לרמה ${lv.n}` : `רמה ${lv.n}`}</strong>
        <${Bar} value=${lv.into} max=${lv.span} label=${`התקדמות לרמה ${lv.n + 1}`} />
        <span class="faint num">${lv.into} מתוך ${lv.span} לרמה ${lv.n + 1}</span>
      </div>
    </div>
    <div class="sess-actions">
      ${res.passed ? html`<a class="btn btn-block" href=${nx.href}>${nx.label}<${Icon} name="next" /></a>`
        : html`<button class="btn btn-block" onClick=${onRetry}><${Icon} name="refresh" />לנסות שוב</button>`}
      <a class="btn btn-ghost btn-block" href="#/home">למסלול</a>
    </div>
  </div>`;
}

function Run({ ctx, sid, onRetry }) {
  const { state, p } = ctx;
  const s = stations(p).find((x) => x.sid === sid) || null;
  const [start] = useState(() => ({ points: p.points || 0, stamps: stampSet(p), rung: s ? levelOf(p, s.concept) : 0, locked: !!s && s.state === 'locked', done: !!s && s.state === 'done' }));
  const [steps] = useState(() => (s && s.ready && !start.locked ? buildSteps(s) : []));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [res, setRes] = useState(null);
  // ביקור ("שמעתי") רק כשהתחנה באמת נפתחה: לא בתחנה נעולה או כזו שעוד בבדיקה
  useEffect(() => { if (s && s.kind === 'lesson' && steps.length) actions.visit(state, s.concept); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [i, !!res]);
  const exit = html`<a class="icon-btn sess-x" href="#/home" aria-label="יציאה למסלול"><${Icon} name="x" /></a>`;
  if (!s) return html`<div class="sess"><header class="sess-head">${exit}</header><${Empty} icon="alert" title="לא מצאתי את התחנה הזאת"><a href="#/home">למסלול</a></${Empty}></div>`;
  if (start.locked) {
    const cur = stations(p).find((x) => x.state === 'current');
    return html`<div class="sess"><header class="sess-head">${exit}</header><${Empty} icon="lock" title="התחנה עוד נעולה"><span>היא נפתחת אחרי התחנות שלפניה במסלול.</span>${cur && html`<a class="btn btn-sm" href=${hrefOf(cur)}>לתחנה הנוכחית: ${stationName(cur)}</a>`}</${Empty}></div>`;
  }
  if (!steps.length) return html`<div class="sess"><header class="sess-head">${exit}</header><${Empty} ill="mo-review" title="התחנה עוד בבדיקת עובדות"><span>היא תיפתח כשהתוכן שלה יעבור את שער האימות.</span></${Empty}></div>`;

  const c = fullOf(s.concept);
  const step = steps[i];
  const answered = !step || !ANSWERED.includes(step.t) || answers[i] !== undefined;
  const last = i === steps.length - 1;
  const earned = Math.max(0, (p.points || 0) - start.points);
  const record = (ok) => {
    if (answers[i] !== undefined) return;
    setAnswers({ ...answers, [i]: ok });
    if (step.t === 'ex') actions.answer(state, step.ex.id, ok);
  };
  const finish = () => {
    const scored = steps.map((x, k) => [x, k]).filter(([x]) => x.scored);
    const right = scored.filter(([, k]) => answers[k] === true).length;
    const total = scored.length;
    const need = passMark(s.kind, total);
    const passed = right >= need;
    if (s.kind === 'lesson') actions.read(state, s.concept);
    if (s.kind === 'check') actions.check(state, s.concept, passed);
    if (s.kind === 'duel') actions.duel(state, s.concept, passed);
    actions.station(state, sid, { passed, score: right, total });
    setRes({ passed, right, total, need });
  };
  const advance = () => {
    if (step.t === 'card') actions.read(state, step.id);
    if (last) finish();
    else { setI(i + 1); setRevealed(false); }
  };
  const progress = res ? 1 : (i + (answered && ANSWERED.includes(step.t) ? 1 : 0)) / steps.length;

  let body;
  if (res) body = html`<${Result} s=${s} p=${p} state=${state} start=${start} res=${res} onRetry=${onRetry} />`;
  else if (step.t === 'hook') body = html`<${HookStep} c=${c} revealed=${revealed} />`;
  else if (step.t === 'planes') body = html`<div class="sess-read"><${Planes} it=${c.interactive} sources=${c.sources} /></div>`;
  else if (step.t === 'essence') body = html`<${EssenceStep} c=${c} />`;
  else if (step.t === 'example') body = html`<${ExampleStep} c=${c} interests=${state.interests} />`;
  else if (step.t === 'spot') body = html`<${SpotStep} c=${c} id=${s.concept} />`;
  else if (step.t === 'twins') body = html`<${TwinsStep} c=${c} />`;
  else if (step.t === 'card') body = html`<${CardStep} id=${step.id} />`;
  else if (step.t === 'firstfall') body = html`<${FirstFallStep} onDone=${record} />`;
  else if (step.t === 'match') body = html`<div class="sess-read"><${MatchEx} pairs=${step.pairs} seed=${sid} onDone=${(ok, info) => { record(ok); if (!start.done) actions.award(state, info.firstTry * POINTS.match); }} /></div>`;
  else body = html`<div class="sess-read"><${ExerciseView} ex=${step.ex} onDone=${record} /></div>`;

  // הכפתור הראשי: "מה קרה באמת?" לפני החשיפה בפתיחה, "הבנתי" בכרטיס, ואחרת "להמשיך"
  let foot = null;
  if (!res) {
    if (step.t === 'hook' && !revealed && c.hook.reveal) foot = html`<button class="btn btn-block" onClick=${() => setRevealed(true)}><${Icon} name="eye" />מה קרה באמת?</button>`;
    else if (step.t === 'card') foot = html`<button class="btn btn-block" onClick=${advance}><${Icon} name="check" />הבנתי${last ? '' : ', להמשיך'}</button>`;
    else foot = html`<button class="btn btn-block" disabled=${!answered} onClick=${advance}>${last ? 'לסיום התחנה' : 'להמשיך'}<${Icon} name="next" /></button>`;
  }

  return html`<div class="sess" data-kind=${s.kind} data-step=${res ? 'result' : step.t}>
    <header class="sess-head">
      ${exit}
      <div class="sess-bar" role="progressbar" aria-label="ההתקדמות בתחנה" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress * 100)}><i style=${`--p:${progress}`}></i></div>
      <span class="sess-pts num"><${Icon} name="star" /><span class="sr-only">נקודות בתחנה הזאת: </span>${earned}</span>
    </header>
    ${!res && html`<div class="sess-title"><span class="kicker"><${Icon} name=${KINDS[s.kind].icon} />${stationName(s)}</span><span class="faint">${stationSub(s)} · שלב ${s.stage + 1}</span></div>`}
    <div class="sess-body" key=${res ? 'r' : i}>${body}</div>
    ${foot && html`<footer class="sess-foot">${foot}</footer>`}
  </div>`;
}

export function StationScreen({ ctx, concept, part }) {
  const [attempt, setAttempt] = useState(0);
  return html`<${Run} key=${`${concept}/${part}/${attempt}`} ctx=${ctx} sid=${`${concept}/${part}`} onRetry=${() => setAttempt(attempt + 1)} />`;
}

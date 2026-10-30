// סימולציה: דילמת האסיר — עשרה סיבובים מול אסטרטגיה נסתרת, ואחר כך טורניר בין כל האסטרטגיות.
import { html, useState, useMemo } from '../vendor/standalone.module.js';
import { fullOf, title } from '../data.js';
import { Icon } from '../icons.js';
import { Back, Feedback, Paras } from '../ui.js';
import { T } from '../glossary.js';

const C = 'C', D = 'D';
const ROUNDS = 10;
// שמות תצוגה כשהתוכן עוד לא אומת (המנגנון עצמו הוא חשבון, לא טענה עובדתית)
const FALLBACK = [
  { id: 'tft', name: 'מידה כנגד מידה' }, { id: 'alld', name: 'תמיד לבגוד' }, { id: 'allc', name: 'תמיד לשתף פעולה' },
  { id: 'grudger', name: 'נוטר טינה' }, { id: 'random', name: 'אקראי' }, { id: 'tf2t', name: 'מידה כנגד שתי מידות' },
];
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const MOVE = {
  tft: (mine, theirs) => (theirs.length ? theirs[theirs.length - 1] : C),
  alld: () => D,
  allc: () => C,
  grudger: (mine, theirs) => (theirs.includes(D) ? D : C),
  random: (mine, theirs, r) => (r() < 0.5 ? C : D),
  tf2t: (mine, theirs) => (theirs.length >= 2 && theirs[theirs.length - 1] === D && theirs[theirs.length - 2] === D ? D : C),
};
const payoff = (P, a, b) => (a === C && b === C ? [P.R, P.R] : a === C ? [P.S, P.T] : b === C ? [P.T, P.S] : [P.P, P.P]);

function tournament(P, ids) {
  const r = rng(2026);
  const total = Object.fromEntries(ids.map((x) => [x, 0]));
  for (const a of ids) for (const b of ids) {
    const ha = [], hb = [];
    for (let k = 0; k < 200; k++) {
      const ma = MOVE[a](ha, hb, r), mb = MOVE[b](hb, ha, r);
      const [pa] = payoff(P, ma, mb);
      total[a] += pa; ha.push(ma); hb.push(mb);
    }
  }
  return ids.map((id) => ({ id, score: total[id] })).sort((x, y) => y.score - x.score);
}

export function PDSim() {
  const c = fullOf('prisoners-dilemma');
  const it = c && c.interactive && c.interactive.kind === 'pd-sim' ? c.interactive : null;
  const P = it ? it.payoffs : { T: 5, R: 3, P: 1, S: 0 };
  const strategies = (it ? it.strategies : FALLBACK).filter((s) => MOVE[s.id]);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const r = useMemo(() => rng(seed), [seed]);
  const opp = useMemo(() => strategies[seed % strategies.length], [seed]);
  const [mine, setMine] = useState([]);
  const [theirs, setTheirs] = useState([]);
  const [showT, setShowT] = useState(false);
  const done = mine.length >= ROUNDS;
  const scores = mine.reduce((acc, m, k) => { const [a, b] = payoff(P, m, theirs[k]); return [acc[0] + a, acc[1] + b]; }, [0, 0]);
  const play = (m) => { if (done) return; const o = MOVE[opp.id](theirs, mine, r); setMine([...mine, m]); setTheirs([...theirs, o]); };
  const last = mine.length ? payoff(P, mine[mine.length - 1], theirs[theirs.length - 1]) : null;
  const tour = useMemo(() => tournament(P, strategies.map((s) => s.id)), []);
  const name = (id) => (strategies.find((s) => s.id === id) || {}).name || id;
  const max = tour.length ? tour[0].score : 1;

  return html`<div class="pdsim read">
    <${Back} href="#/practice" label="לתרגול" />
    <div class="screen-title"><span class="kicker">סימולציה</span><h1>דילמת האסיר</h1><p>${it ? html`<${T} text=${it.intro} />` : 'שני שחקנים בוחרים בו־זמנית: לשתף פעולה או לבגוד. כל אחד מעדיף לבגוד, אבל אם שניהם בוגדים, שניהם מפסידים.'}</p></div>
    ${c && c.draft && html`<span class="badge badge-gold">טיוטה שעוד לא נבדקה</span>`}

    <div class="matrix" role="table" aria-label="טבלת התשלומים: הנקודות שלך, הנקודות של היריב">
      <div class="m-corner" role="cell"></div>
      <div class="m-head" role="columnheader">הוא משתף</div>
      <div class="m-head" role="columnheader">הוא בוגד</div>
      <div class="m-head m-row" role="rowheader">אתה משתף</div>
      <div class="m-cell" role="cell"><b class="num">${P.R}</b> · <span class="num">${P.R}</span></div>
      <div class="m-cell" role="cell"><b class="num">${P.S}</b> · <span class="num">${P.T}</span></div>
      <div class="m-head m-row" role="rowheader">אתה בוגד</div>
      <div class="m-cell" role="cell"><b class="num">${P.T}</b> · <span class="num">${P.S}</span></div>
      <div class="m-cell" role="cell"><b class="num">${P.P}</b> · <span class="num">${P.P}</span></div>
    </div>
    <p class="faint matrix-note">המספר המודגש הוא שלך. בכל משבצת: הנקודות שלך · הנקודות שלו.</p>

    <div class="pd-board panel">
      <div class="row-between"><span class="label">סיבוב ${Math.min(mine.length + 1, ROUNDS)} מתוך ${ROUNDS}</span><span class="pd-score num"><b>${scores[0]}</b> : ${scores[1]}</span></div>
      <div class="pd-history" aria-label="היסטוריית הסיבובים">
        ${Array.from({ length: ROUNDS }, (_, k) => html`<div class="pd-round">
          <span class=${`pd-chip ${mine[k] ? (mine[k] === C ? 'c' : 'd') : ''}`} title="אתה">${mine[k] ? (mine[k] === C ? 'ש' : 'ב') : ''}</span>
          <span class=${`pd-chip ${theirs[k] ? (theirs[k] === C ? 'c' : 'd') : ''}`} title="היריב">${theirs[k] ? (theirs[k] === C ? 'ש' : 'ב') : ''}</span>
        </div>`)}
      </div>
      ${!done ? html`<div class="pd-actions">
        <button class="btn" onClick=${() => play(C)}><${Icon} name="heart" />לשתף פעולה</button>
        <button class="btn btn-ghost" onClick=${() => play(D)}><${Icon} name="x" />לבגוד</button>
      </div>` : null}
      ${last && !done && html`<p class="faint">בסיבוב הקודם: אתה ${mine[mine.length - 1] === C ? 'שיתפת' : 'בגדת'}, הוא ${theirs[theirs.length - 1] === C ? 'שיתף' : 'בגד'}. קיבלת ${last[0]}, הוא קיבל ${last[1]}.</p>`}
    </div>

    ${done && html`<${Feedback} ok=${scores[0] >= scores[1]} title=${`היריב שלך: ${opp.name}`}>
      <p>${opp.desc || ''}</p>
      <p>סך הכול: <b class="num">${scores[0]}</b> לך, <span class="num">${scores[1]}</span> לו. אילו שניכם הייתם משתפים פעולה בכל הסיבובים, כל אחד היה מקבל <span class="num">${P.R * ROUNDS}</span>.</p>
      <div class="row"><button class="btn btn-ghost btn-sm" onClick=${() => location.reload()}>יריב חדש</button><button class="btn btn-sm" onClick=${() => setShowT(true)}>לטורניר</button></div>
    </${Feedback}>`}

    ${showT && html`<section class="tournament stack">
      <h2>טורניר: כל אסטרטגיה מול כל אסטרטגיה, 200 סיבובים</h2>
      <div class="bars">${tour.map((t, k) => html`<div class="bar-row"><span class="bar-name">${name(t.id)}</span><div class="bar"><i style=${`--p:${(t.score / max).toFixed(3)}`}></i></div><span class="num bar-val">${t.score}</span></div>`)}</div>
      <p class="faint">החישוב רץ כאן בדפדפן, על שש האסטרטגיות האלה בלבד.</p>
      ${it ? html`<div class="panel panel-quiet stack"><${Paras} text=${it.axelrod} /><p><strong><${T} text=${it.lesson} /></strong></p></div>` : html`<p class="muted">ההסבר ההיסטורי על הטורנירים של אקסלרוד יופיע כאן אחרי בדיקת העובדות.</p>`}
      <a class="btn btn-ghost" href="#/c/prisoners-dilemma">למושג המלא: ${title('prisoners-dilemma')}</a>
    </section>`}
  </div>`;
}

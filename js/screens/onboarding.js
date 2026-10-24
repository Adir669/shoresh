// מסך 1: כניסה ראשונה — ברוכים הבאים, תחומי עניין, ונקודת התחלה.
import { html, useState } from '../vendor/standalone.module.js';
import { store } from '../store.js';
import { data, seeds, node, fullOf, cardOf, interestFields } from '../data.js';
import { Icon, BrandMark } from '../icons.js';
import { FieldChip } from '../ui.js';
import { Strata, Sprout, Compass } from '../atlas.js';

// איור השורשים שנכתבים מעצמם
export function RootsArt() {
  const roots = [
    { d: 'M200 40 C200 120 150 150 120 230 C100 285 70 300 40 360', f: 'biases', w: 3.2 },
    { d: 'M200 40 C200 130 250 160 285 240 C305 290 335 310 360 370', f: 'games', w: 3 },
    { d: 'M200 40 C202 140 196 220 200 300 C203 350 196 380 198 420', f: 'fallacies', w: 3.6 },
    { d: 'M150 150 C120 170 90 175 60 200', f: 'statistics', w: 1.8 },
    { d: 'M252 158 C285 170 312 168 345 185', f: 'economics', w: 1.8 },
    { d: 'M120 230 C150 260 160 300 150 340', f: 'decisions', w: 1.6 },
    { d: 'M285 240 C260 270 255 305 262 345', f: 'philosophy', w: 1.6 },
    { d: 'M200 300 C230 320 250 330 280 330', f: 'history', w: 1.4 },
    { d: 'M200 300 C170 322 150 328 118 326', f: 'models', w: 1.4 },
  ];
  const nodes = [[120, 230, 'biases', 7], [285, 240, 'games', 7], [200, 300, 'fallacies', 8], [60, 200, 'statistics', 5], [345, 185, 'economics', 5], [150, 340, 'decisions', 5], [262, 345, 'philosophy', 5], [280, 330, 'history', 4], [118, 326, 'models', 4], [40, 360, 'biases', 4], [360, 370, 'games', 4], [198, 420, 'fallacies', 5]];
  return html`<div class="roots-frame corners">
    <svg class="roots-art" viewBox="0 0 400 440" aria-hidden="true">
      <defs><clipPath id="ra-clip"><rect x="0" y="0" width="400" height="440" rx="4" /></clipPath></defs>
      <g clip-path="url(#ra-clip)">
        <${Strata} x0=${0} x1=${400} amp=${5} seed=${0.55} layers=${[{ y0: 40, y1: 175, n: 1 }, { y0: 175, y1: 305, n: 2 }, { y0: 305, y1: 440, n: 3 }]} />
        ${roots.map((r, i) => html`<path d=${r.d} data-field=${r.f} class="roots-path" style=${`--i:${i};stroke-width:${r.w + 0.6}`} pathLength="1" />`)}
        ${nodes.map(([x, y, f, r], i) => html`<circle cx=${x} cy=${y} r=${r} data-field=${f} class="roots-node" style=${`--i:${i}`} />`)}
        <${Sprout} x=${200} y=${40} s=${1.25} />
      </g>
    </svg>
    <span class="roots-compass"><${Compass} size=${42} /></span>
  </div>`;
}

export function Onboarding({ ctx }) {
  const D = data();
  const { state } = ctx;
  const [step, setStep] = useState(state.onboarded ? 1 : 0);
  const [picked, setPicked] = useState(state.interests || []);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (step === 0) {
    return html`<section class="welcome">
      <div class="welcome-copy reveal">
        <a class="brand brand-lg" href="#/welcome" style="--i:0"><${BrandMark} /><span class="brand-name">שורש</span></a>
        <h1 style="--i:1">כל מושג שתלמד יצמיח שורש.</h1>
        <p class="lead" style="--i:2">הטיות חשיבה, כשלים לוגיים, תורת המשחקים, פילוסופיה, היסטוריה. לומדים מושג אחד לעומק, עד שמזהים אותו ביום־יום, ומשם השורש מתפצל למושגים שקשורים אליו.</p>
        <ul class="welcome-points" style="--i:3">
          <li><${Icon} name="drop" /><span><strong>השקיה קצרה</strong> כשיש חמש דקות: חוזרים בדיוק על מה שמתחיל להישכח.</span></li>
          <li><${Icon} name="sprout" /><span><strong>צמיחה ארוכה</strong> כשיש זמן: מושג חדש בעומק מלא, עם מקרים אמיתיים ותרגול.</span></li>
          <li><${Icon} name="shield" /><span><strong>הכול נבדק</strong>: כל טענה עברה בודק עובדות שלא כתב אותה.</span></li>
        </ul>
        <div class="row" style="--i:4"><button class="btn" onClick=${() => setStep(1)}>בוא נתחיל<${Icon} name="next" /></button></div>
      </div>
      <div class="welcome-art"><${RootsArt} /></div>
    </section>`;
  }

  if (step === 1) {
    return html`<section class="onb">
      <div class="onb-head">
        <span class="kicker">שלב 1 מתוך 2</span>
        <h1>מה מסקרן אותך?</h1>
        <p class="lead">בחר כמה תחומים. הם יקבלו עדיפות בהצעות, אבל לא בלעדיות: בערך אחת מכל שלוש הצעות תהיה גילוי מחוץ להם. התחום הראשון שתבחר קובע מאיזה עולם תגיע הדוגמה הראשונה בכל מושג.</p>
      </div>
      <div class="interest-grid reveal">
        ${D.interests.interests.map((it, i) => {
          const n = picked.indexOf(it.id);
          return html`<button class="interest" style=${`--i:${i}`} aria-pressed=${String(n >= 0)} onClick=${() => toggle(it.id)}>
            <span class="interest-icon"><${Icon} name=${it.icon} /></span>
            <span class="interest-text"><strong>${it.he}</strong><span>${it.desc}</span></span>
            <span class="interest-order" aria-hidden="true">${n >= 0 ? n + 1 : ''}</span>
          </button>`;
        })}
      </div>
      <div class="onb-foot">
        <span class="muted">${picked.length ? `נבחרו ${picked.length}` : 'בחר לפחות תחום אחד'}</span>
        <button class="btn" disabled=${!picked.length} onClick=${() => { store.update((s) => { s.interests = picked; }); setStep(2); }}>המשך<${Icon} name="next" /></button>
      </div>
    </section>`;
  }

  const seedIds = seeds(picked);
  const wanted = interestFields(picked);
  const finish = (go) => { store.update((s) => { s.interests = picked; s.onboarded = true; }); location.hash = go; };
  return html`<section class="onb">
    <div class="onb-head">
      <span class="kicker">שלב 2 מתוך 2</span>
      <h1>מאיפה לצמוח?</h1>
      <p class="lead">שלוש נקודות התחלה לפי מה שבחרת. כל אחת מהן היא מושג מלא, עם סיפור פתיחה, מקרים אמיתיים ותרגול, ומכל אחת השורש יתפצל הלאה.</p>
    </div>
    <div class="seed-list reveal">
      ${seedIds.map((id, i) => {
        const n = node(id); const c = fullOf(id) || cardOf(id);
        return html`<button class="tile tile-field seed" data-field=${n.field} style=${`--i:${i}`} onClick=${() => finish(`#/c/${id}`)}>
          <div class="row-between"><${FieldChip} id=${n.field} long=${true} />${i === 0 && html`<span class="badge badge-gold"><${Icon} name="star" />מומלץ</span>`}</div>
          <h2>${n.he}</h2>
          <p class="muted">${c ? c.oneLiner : 'בכתיבה ובבדיקה'}</p>
          <span class="seed-go">להתחיל כאן<${Icon} name="next" /></span>
          ${wanted.has(n.field) ? null : html`<span class="faint seed-note">גילוי: מחוץ לתחומים שבחרת</span>`}
        </button>`;
      })}
    </div>
    <div class="onb-foot"><button class="btn btn-quiet" onClick=${() => setStep(1)}><${Icon} name="back" />חזרה</button><button class="btn btn-ghost" onClick=${() => finish('#/home')}>לבית<${Icon} name="next" /></button></div>
  </section>`;
}

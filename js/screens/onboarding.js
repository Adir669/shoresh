// מסך 1: כניסה ראשונה — ברוכים הבאים, תחומי עניין, והמסלול (D-21).
import { html, useState } from '../vendor/standalone.module.js';
import { store } from '../store.js';
import { data, node, fullOf, title } from '../data.js';
import { stages } from '../course.js';
import { Icon, BrandMark } from '../icons.js';
import { FieldChip, Ill, Emblem } from '../ui.js';
import { Compass } from '../atlas.js';

// ציור הפתיחה (D-20) ווידאו שקט של 5 שניות שנוצר ממנו וחוזר על עצמו בלי קפיצה.
// מי שביקש פחות תנועה רואה את הציור בלבד, וכך גם כשהווידאו לא נטען (התמונה היא ה־poster).
const reducedMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
export function WelcomePlate() {
  const still = reducedMotion();
  const start = (v) => { if (!v) return; v.muted = true; const p = v.play && v.play(); if (p && p.catch) p.catch(() => {}); };
  return html`<div class="roots-frame welcome-plate corners">
    ${still
      ? html`<img class="plate-media" src="img/atlas/welcome-plate.webp" srcset="img/atlas/welcome-plate-560.webp 560w, img/atlas/welcome-plate.webp 960w" sizes="(min-width: 960px) 440px, 92vw" alt="" width="960" height="960" />`
      : html`<video class="plate-media" ref=${start} autoplay muted loop playsinline preload="auto" poster="img/atlas/welcome-plate.webp" aria-hidden="true" width="960" height="960">
          <source src="img/atlas/welcome-loop.webm" type="video/webm" />
          <source src="img/atlas/welcome-loop.mp4" type="video/mp4" />
        </video>`}
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
          <li><${Icon} name="path" /><span><strong>מסלול קבוע</strong> של תחנות קצרות: כל פעם צעד אחד, ותמיד ברור מה הבא.</span></li>
          <li><${Icon} name="drop" /><span><strong>השקיה קצרה</strong> כשמגיע הזמן: חוזרים בדיוק על מה שמתחיל להישכח.</span></li>
          <li><${Icon} name="shield" /><span><strong>הכול נבדק</strong>: כל טענה עברה בודק עובדות שלא כתב אותה.</span></li>
        </ul>
        <div class="row" style="--i:4"><button class="btn" onClick=${() => setStep(1)}>בוא נתחיל<${Icon} name="next" /></button></div>
      </div>
      <div class="welcome-art"><${WelcomePlate} /></div>
    </section>`;
  }

  if (step === 1) {
    return html`<section class="onb">
      <div class="onb-head">
        <span class="kicker">שלב 1 מתוך 2</span>
        <h1>מה מסקרן אותך?</h1>
        <p class="lead">בחר כמה תחומים. התחום הראשון שתבחר קובע מאיזה עולם תגיע הדוגמה הראשונה בכל מושג, והמפה תסמן לך נקודות התחלה לפי מה שבחרת.</p>
      </div>
      <div class="interest-grid reveal">
        ${D.interests.interests.map((it, i) => {
          const n = picked.indexOf(it.id);
          return html`<button class="interest" style=${`--i:${i}`} aria-pressed=${String(n >= 0)} onClick=${() => toggle(it.id)}>
            <${Ill} name=${`int-${it.id}`} size="sm" />
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

  // שלב 2: המסלול (D-21). שמונה שלבים קבועים, והתחנה הראשונה מחכה. הסמלים מוצגים כצלליות:
  // הם נכנסים לאוסף רק כשעוברים את מבחן השלב. מי שכבר בדרך (שינה תחומי עניין) ממשיך מאיפה שעצר.
  const st = stages();
  const first = st[0];
  const finish = (go) => { store.update((s) => { s.interests = picked; s.onboarded = true; }); location.hash = go; };
  return html`<section class="onb">
    <div class="onb-head">
      <span class="kicker">שלב 2 מתוך 2</span>
      <h1>המסלול שלך</h1>
      <p class="lead">${st.length} שלבים, שלב לכל מושג מלא. כל שלב בנוי מתחנות קצרות של כמה דקות: פתיחה, תרגול, בדיקת זיהוי, כרטיסים, דו־קרב ומבחן. כל תחנה מקנה נקודות, ובסוף כל שלב הסמל של המושג נכנס לאוסף שלך.</p>
    </div>
    <ol class="onb-path reveal">
      ${st.map((s, i) => {
        const n = node(s.concept); const c = fullOf(s.concept);
        return html`<li class=${`onb-stage${i === 0 ? ' is-first' : ''}`} data-field=${n.field} style=${`--i:${i}`}>
          <span class="onb-n num">${i + 1}</span>
          <${Emblem} id=${s.concept} size="sm" locked=${true} />
          <span class="onb-stage-text"><strong>${n.he}</strong>${i === 0 && c && html`<span class="muted">${c.oneLiner}</span>`}</span>
          <${FieldChip} id=${n.field} />
        </li>`;
      })}
    </ol>
    <div class="onb-foot">
      <button class="btn btn-quiet" onClick=${() => setStep(1)}><${Icon} name="back" />חזרה</button>
      <span class="row">
        ${!state.onboarded && html`<button class="btn btn-ghost onb-look" onClick=${() => finish('#/home')}>להסתכל על המסלול</button>`}
        ${state.onboarded ? html`<button class="btn onb-start" onClick=${() => finish('#/home')}>להמשיך במסלול<${Icon} name="next" /></button>`
          : first && html`<button class="btn onb-start" onClick=${() => finish(`#/go/${first.concept}/lesson`)}>להתחיל: ${title(first.concept)}<${Icon} name="next" /></button>`}
      </span>
    </div>
  </section>`;
}

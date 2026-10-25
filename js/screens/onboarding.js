// מסך 1: כניסה ראשונה — ברוכים הבאים, תחומי עניין, ונקודת התחלה.
import { html, useState } from '../vendor/standalone.module.js';
import { store } from '../store.js';
import { data, seeds, node, fullOf, cardOf, interestFields } from '../data.js';
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
          <li><${Icon} name="drop" /><span><strong>השקיה קצרה</strong> כשיש חמש דקות: חוזרים בדיוק על מה שמתחיל להישכח.</span></li>
          <li><${Icon} name="sprout" /><span><strong>צמיחה ארוכה</strong> כשיש זמן: מושג חדש בעומק מלא, עם מקרים אמיתיים ותרגול.</span></li>
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
        <p class="lead">בחר כמה תחומים. הם יקבלו עדיפות בהצעות, אבל לא בלעדיות: בערך אחת מכל שלוש הצעות תהיה גילוי מחוץ להם. התחום הראשון שתבחר קובע מאיזה עולם תגיע הדוגמה הראשונה בכל מושג.</p>
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
          <div class="seed-main"><div class="seed-copy"><h2>${n.he}</h2><p class="muted">${c ? c.oneLiner : 'בכתיבה ובבדיקה'}</p></div><${Emblem} id=${id} size="md" /></div>
          <span class="seed-go">להתחיל כאן<${Icon} name="next" /></span>
          ${wanted.has(n.field) ? null : html`<span class="faint seed-note">גילוי: מחוץ לתחומים שבחרת</span>`}
        </button>`;
      })}
    </div>
    <div class="onb-foot"><button class="btn btn-quiet" onClick=${() => setStep(1)}><${Icon} name="back" />חזרה</button><button class="btn btn-ghost" onClick=${() => finish('#/home')}>לבית<${Icon} name="next" /></button></div>
  </section>`;
}

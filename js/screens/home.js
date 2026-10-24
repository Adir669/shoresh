// מסך 2: בית — "לאן עכשיו", השקיה קצרה מול צמיחה ארוכה, "ראיתי את זה היום".
import { html } from '../vendor/standalone.module.js';
import { data, node, title, fullOf, cardOf, suggestions, dueList, levelOf, CTYPES } from '../data.js';
import { Icon } from '../icons.js';
import { FieldChip, fmtToday, fmtDate, fmtRel } from '../ui.js';

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

function whyLine(s) {
  if (s.kind === 'continue') return 'המשך מאיפה שעצרת';
  if (s.kind === 'seed') return 'נקודת התחלה לפי תחומי העניין שלך';
  const t = CTYPES[s.type];
  return (t ? t.he : 'קשר') + ' מתוך ' + title(s.via);
}

function Suggestion({ s, i }) {
  const n = node(s.id);
  const c = fullOf(s.id) || cardOf(s.id);
  const href = s.kind === 'branch' ? '#/bridge/' + s.via + '/' + s.id : '#/c/' + s.id;
  const cls = s.recommended ? 'tile tile-field sugg sugg-rec' : 'tile tile-field sugg';
  return html`<a class=${cls} data-field=${n.field} href=${href} style=${'--i:' + i}>
    <div class="row-between">
      <${FieldChip} id=${n.field} />
      <span class="row sugg-badges">
        ${s.discovery && html`<span class="badge">גילוי</span>`}
        ${s.recommended && html`<span class="badge badge-gold"><${Icon} name="star" />מומלץ</span>`}
      </span>
    </div>
    <h3>${n.he}</h3>
    ${c && html`<p class="muted sugg-line">${c.oneLiner}</p>`}
    <span class="sugg-why">${whyLine(s)}<${Icon} name="next" /></span>
  </a>`;
}

export function Home({ ctx }) {
  const { state, p, openSheet } = ctx;
  const D = data();
  const sug = suggestions(p, state.interests);
  const due = dueList(p);
  const rec = sug[0];
  const ids = Object.keys(p.concepts).filter((id) => D.byId[id]);
  const learned = ids.filter((id) => levelOf(p, id) > 0).length;
  const deep = ids.filter((id) => levelOf(p, id) >= 3).length;
  const upcoming = ids.map((id) => [id, p.concepts[id]]).filter(([, c]) => c.due && c.due > Date.now()).sort((a, b) => a[1].due - b[1].due)[0];
  const last = p.journal[0];

  const waterTitle = due.length ? due.length + ' מושגים מחכים להשקיה' : 'הכול מושקה';
  let waterSub = 'עוד לא למדת מושג. השקיה מתחילה אחרי המושג הראשון.';
  if (due.length) waterSub = due.slice(0, 3).map(title).join(' · ');
  else if (upcoming) waterSub = 'הבא בתור: ' + title(upcoming[0]) + ', ' + fmtRel(upcoming[1].due);
  const growTitle = rec ? rec.kind === 'continue' ? 'להמשיך את ' + title(rec.id) : 'לצמוח אל ' + title(rec.id) : 'לבחור נקודת התחלה';
  const growHref = rec ? '#/c/' + rec.id : '#/map';

  return html`<div class="home">
    <header class="home-head">
      <span class="faint">${fmtToday()}</span>
      <h1>${greeting()}. לאן עכשיו?</h1>
    </header>
    <div class="home-grid">
      <div class="home-main stack-lg">
        <section class="sessions" aria-label="סוגי מפגש">
          <a class="session session-water" href=${due.length ? '#/water' : '#/map'}>
            <span class="session-icon"><${Icon} name="drop" /></span>
            <span class="session-kind">השקיה קצרה · כ־5 דקות</span>
            <strong class="session-title">${waterTitle}</strong>
            <span class="muted">${waterSub}</span>
          </a>
          <a class="session session-grow" href=${growHref}>
            <span class="session-icon"><${Icon} name="sprout" /></span>
            <span class="session-kind">צמיחה ארוכה · כ־25 דקות</span>
            <strong class="session-title">${growTitle}</strong>
            <span class="muted">מושג מלא: סיפור פתיחה, מנגנון, מחקר, מקרים אמיתיים ובדיקת זיהוי.</span>
          </a>
        </section>
        <section>
          <div class="section-head"><h2>לאן עכשיו</h2><a class="btn btn-quiet btn-sm" href="#/map">לכל המפה<${Icon} name="next" /></a></div>
          <div class="sugg-list reveal">${sug.map((s, i) => html`<${Suggestion} s=${s} i=${i} />`)}</div>
        </section>
      </div>
      <aside class="home-side stack">
        <button class="seen-cta" onClick=${() => openSheet('seen')}>
          <span class="seen-icon"><${Icon} name="eye" /></span>
          <span><strong>ראיתי את זה היום</strong><span class="muted">פגשת מושג בחיים? רשום אותו. זה מה שמקבע אותו.</span></span>
        </button>
        ${last && html`<figure class="journal-quote">
          <blockquote>${last.note || 'נרשם בלי הערה'}</blockquote>
          <figcaption><span class="faint">${fmtDate(last.at)}</span> · <a href=${'#/c/' + last.concept}>${title(last.concept)}</a></figcaption>
        </figure>`}
        <div class="stats">
          <div><strong class="num">${learned}</strong><span>מושגים בשורשים</span></div>
          <div><strong class="num">${deep}</strong><span>ברמת זיהוי ומעלה</span></div>
          <div><strong class="num">${p.journal.length}</strong><span>רישומים ביומן</span></div>
        </div>
      </aside>
    </div>
  </div>`;
}

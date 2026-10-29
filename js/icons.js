// אייקונים בקו אחיד (24×24, עובי 1.6). בלי אימוג׳י. חצים כיווניים מקבלים flip בעברית.
import { html } from './vendor/standalone.module.js';

const P = {
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  roots: '<path d="M12 3v6"/><path d="M12 9c0 4-4 4-5.5 7.5"/><path d="M12 9c0 4 4 4 5.5 7.5"/><path d="M12 9v12"/><path d="M8.6 13.2C6 13.5 4.5 15 4 17"/><path d="M15.4 13.2c2.6.3 4.1 1.8 4.6 3.8"/><circle cx="12" cy="3" r="1.2" fill="currentColor"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  chart: '<path d="M5 20V10"/><path d="M10 20V5"/><path d="M15 20v-7"/><path d="M20 20v-11"/><path d="M3 20h18"/>',
  sliders: '<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
  back: '<path d="M14.5 6 20 12l-5.5 6"/><path d="M20 12H4"/>',
  next: '<path d="M9.5 6 4 12l5.5 6"/><path d="M4 12h16"/>',
  chevron: '<path d="m14 6-6 6 6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  unlock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.6-1.7"/>',
  drop: '<path d="M12 3.5c3.4 4.1 6 7.3 6 10.4a6 6 0 0 1-12 0c0-3.1 2.6-6.3 6-10.4Z"/><path d="M9.2 14.6a2.9 2.9 0 0 0 2.4 2.6"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-3.6-2.6-6-6.5-6 0 3.7 2.6 6 6.5 6Z"/><path d="M12 14.5c0-3.2 2.4-5.5 6.5-5.5 0 3.4-2.5 5.5-6.5 5.5Z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  flask: '<path d="M9.5 3h5"/><path d="M10.5 3v6L5 18.5A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.5L13.5 9V3"/><path d="M7.4 15h9.2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  crosshair: '<circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  quote: '<path d="M9.5 8C7 8.5 5.5 10.3 5.5 13v4h4.5v-4.5H7.6"/><path d="M18.5 8c-2.5.5-4 2.3-4 5v4H19v-4.5h-2.4"/>',
  shield: '<path d="M12 3 19 6v5.5c0 4.4-2.9 7.8-7 9.5-4.1-1.7-7-5.1-7-9.5V6l7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".9" fill="currentColor"/>',
  alert: '<path d="M12 4 21 19.5H3L12 4Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5V9H15"/>',
  star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8L12 3.8Z"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18V6.5Z"/><path d="M8 13h8M8 16h5"/>',
  scale: '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M4.5 7.5h15"/><path d="M6.5 7.5 3.5 14a3 3 0 0 0 6 0L6.5 7.5Z"/><path d="M17.5 7.5 14.5 14a3 3 0 0 0 6 0l-3-6.5Z"/>',
  pit: '<path d="M3 9h5l2 8h4l2-8h5"/><circle cx="12" cy="5.5" r="1.6"/><path d="M12 7.5v3"/>',
  magnifier: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/><path d="M8 10.5h5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/>',
  chat: '<path d="M4.5 5.5h15v10h-8l-4.5 3.5v-3.5H4.5v-10Z"/><path d="M8 9.5h8M8 12.5h5"/>',
  pencil: '<path d="m15.5 4.5 4 4L9 19l-5 1 1-5L15.5 4.5Z"/><path d="m13.5 6.5 4 4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  flame: '<path d="M12 21c3.8 0 6-2.6 6-5.9 0-3.6-2.8-5.4-3.6-9.1-1.8 1.3-2.6 3.1-2.6 4.6-1.2-.7-2-2-2.2-3.4C7.6 9.1 6 11.6 6 15.1 6 18.4 8.2 21 12 21Z"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7"/><path d="M10 15.6c.9.6 2.3.9 3.9.9 2.8 0 5-1.1 5-2.5v-4"/><path d="M14 9.4c2.6.2 4.9 1.2 4.9 2.5"/>',
  landmark: '<path d="M3.5 9 12 4l8.5 5"/><path d="M5 9h14"/><path d="M6.5 9v8M10 9v8M14 9v8M17.5 9v8"/><path d="M4 20h16"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1h-4"/><path d="M16 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10"/><path d="M7 4a2 2 0 0 0-2 2v11"/><path d="M8.5 9h4.5M8.5 12h4.5"/>',
  atom: '<circle cx="12" cy="12" r="1.4" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3.5 12.5h17"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 6.8a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10Z"/>',
  lamp: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3Z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  timeline: '<path d="M12 3v18"/><circle cx="12" cy="7" r="2"/><circle cx="12" cy="17" r="2"/><path d="M14 7h5M5 17h5"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4" height="6.5" rx="1.6"/>',
  external: '<path d="M14 4h6v6"/><path d="m20 4-8.5 8.5"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  // המסלול (D-21): שלוש תחנות על שביל, מדליה למבחן השלב, וכרטיסים
  path: '<path d="M7 21.2c0-3.6 10.5-3.2 10.5-7.4 0-4-9.5-3.4-9.5-7.3"/><path d="M8 6.5V2.4l5.2 1.9L8 6.1"/><circle cx="7" cy="21.2" r="1.3" fill="currentColor"/>',
  medal: '<circle cx="12" cy="9" r="5.6"/><circle cx="12" cy="9" r="2.3"/><path d="M8.7 13.5 7.2 20.6l4.8-2.4 4.8 2.4-1.5-7.1"/>',
  cards: '<rect x="3.5" y="7" width="11" height="13.5" rx="1.6"/><path d="M8.5 7V5.1A1.6 1.6 0 0 1 10.1 3.5h8.3A1.6 1.6 0 0 1 20 5.1v11.3a1.6 1.6 0 0 1-1.6 1.6h-3.9"/><path d="M6.5 11.5h5M6.5 14.5h5"/>',
};

export function Icon({ name, cls = '', title }) {
  const inner = (title ? `<title>${title}</title>` : '') + (P[name] || P.info);
  return html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden=${title ? 'false' : 'true'} role=${title ? 'img' : undefined} dangerouslySetInnerHTML=${{ __html: inner }}></svg>`;
}

// סמל לכל אחד מ־18 התחומים, במקום נקודת צבע (D-20). מצויר בקוד: חד בכל גודל, ועובד בבהיר ובכהה.
const FIELD_GLYPH = {
  biases: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="14.6" cy="12" r="2.6"/>',
  fallacies: '<path d="m10 14.5-1.4 1.4a3.2 3.2 0 0 1-4.5-4.5l2.8-2.8a3.2 3.2 0 0 1 4.5 0"/><path d="m14 9.5 1.4-1.4a3.2 3.2 0 0 1 4.5 4.5l-2.8 2.8a3.2 3.2 0 0 1-4.5 0"/><path d="M8.5 4v2.2M4 8.5h2.2M15.5 20v-2.2M20 15.5h-2.2"/>',
  statistics: '<path d="M3 19h18"/><path d="M3.5 18.5C7 18.5 8 6 12 6s5 12.5 8.5 12.5"/><path d="M12 6v13" stroke-dasharray="1.6 2.2"/>',
  decisions: '<path d="M12 21v-7"/><path d="M12 14 6.5 8.5"/><path d="m12 14 5.5-5.5"/><path d="M4.5 10V6.5H8"/><path d="M19.5 10V6.5H16"/>',
  games: '<circle cx="12" cy="6.2" r="2.6"/><path d="M10 9.4h4l-.9 5.1h-2.2L10 9.4Z"/><path d="M7.5 20.5h9l-1.3-4H8.8l-1.3 4Z"/>',
  models: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/>',
  rhetoric: '<path d="M4 10v4h3l8.5 4.5v-13L7 10H4Z"/><path d="m7 14 1.2 5h2.4l-1.1-4.4"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5"/>',
  philosophy: '<path d="M4 15.5c0 1.9 3.6 3 8 3s8-1.1 8-3"/><path d="M4 15.5C5.6 13 8.5 12 12 12c2.4 0 4.4.5 5.9 1.4L20.5 11"/><path d="M12 12v-1.6"/><path d="M12 8.6c-1.3-1.3-1.3-2.9 0-4.6 1.3 1.7 1.3 3.3 0 4.6Z"/>',
  science: '<path d="M9.5 3h5"/><path d="M10.5 3v6L5 18.5A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.5L13.5 9V3"/><path d="M7.4 15h9.2"/>',
  economics: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7"/><path d="M10 15.6c.9.6 2.3.9 3.9.9 2.8 0 5-1.1 5-2.5v-4"/><path d="M14 9.4c2.6.2 4.9 1.2 4.9 2.5"/>',
  history: '<path d="M6.5 3h11M6.5 21h11"/><path d="M8 3v2.5c0 2.5 4 4 4 6.5s-4 4-4 6.5V21"/><path d="M16 3v2.5c0 2.5-4 4-4 6.5s4 4 4 6.5V21"/><path d="M10 18.5h4" opacity=".7"/>',
  politics: '<path d="M3.5 9 12 4l8.5 5"/><path d="M5 9h14"/><path d="M6.5 9v8M10 9v8M14 9v8M17.5 9v8"/><path d="M4 20h16"/>',
  psychology: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5"/><circle cx="16.5" cy="9" r="2.4"/><path d="M15.6 14.2c2.9.1 4.9 2.3 4.9 5.3"/>',
  cultures: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.5 2.4 3.6 5.2 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.2-3.6-8.5S9.5 5.9 12 3.5Z"/>',
  effects: '<circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 2.4"/>',
  laws: '<path d="m13.6 4.4 6 6"/><path d="m11 7 6 6"/><path d="m12.3 5.7 5 5-3.3 3.3-5-5 3.3-3.3Z"/><path d="M11.6 11.6 4 19.2"/><path d="M13 20.5h8"/>',
  expressions: '<path d="M9.5 8C7 8.5 5.5 10.3 5.5 13v4h4.5v-4.5H7.6"/><path d="M18.5 8c-2.5.5-4 2.3-4 5v4H19v-4.5h-2.4"/>',
  paradoxes: '<path d="M12 12c-2-2.6-3.6-4-5.6-4a4 4 0 0 0 0 8c2 0 3.6-1.4 5.6-4s3.6-4 5.6-4a4 4 0 0 1 0 8c-2 0-3.6-1.4-5.6-4Z"/>',
};
export function FieldGlyph({ id, cls = 'field-glyph' }) {
  return html`<svg class=${cls} data-field=${id} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: FIELD_GLYPH[id] || '<circle cx="12" cy="12" r="4" fill="currentColor"/>' }}></svg>`;
}

// סמל המותג (אטלס): טבעת מצפן, קו קרקע, נבט, ושורש שיורד ומתפצל
export function BrandMark({ cls = 'brand-mark' }) {
  return html`<svg class=${cls} viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <circle cx="16" cy="16" r="13.2" opacity=".42"/>
    <path d="M16 1.4v3.1M16 27.5v3.1M1.4 16h3.1M27.5 16h3.1" opacity=".55"/>
    <path d="M7.2 12.6h17.6" opacity=".5"/>
    <path d="M16 12.4c0-2.6-1.9-4.5-4.7-4.7.2 2.8 2.1 4.5 4.7 4.7Z" fill="currentColor" stroke="none"/>
    <path d="M16 11.5c0-2.7 2-4.6 4.8-4.8-.2 2.9-2.1 4.6-4.8 4.8Z" fill="currentColor" stroke="none"/>
    <path d="M16 12.6v12.2"/>
    <path d="M16 16.4c-1 2.3-3.7 3.1-5.8 5.5"/>
    <path d="M16 16.4c1 2.3 3.7 3.1 5.8 5.5"/>
    <path d="M16 20.6c-.8 1.5-2.1 2.3-2.7 4.1" opacity=".7"/>
  </svg>`;
}

// סימון קו לכל סוג קשר — אותו סימון במפה ובתגיות
export function ConnGlyph({ type }) {
  const d = {
    depth: '<path d="M1 5h20" stroke-width="2.2"/>',
    twin: '<path d="M1 3h20M1 7h20" stroke-width="1.4"/>',
    bridge: '<path d="M1 7.5C6 1 16 1 21 7.5" stroke-width="1.8" stroke-dasharray="3.2 2.6"/>',
    foundation: '<path d="M1 5h20" stroke-width="2" stroke-dasharray="0.1 3.6"/>',
  }[type] || '';
  return html`<svg viewBox="0 0 22 10" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: d }}></svg>`;
}

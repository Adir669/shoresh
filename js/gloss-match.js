// התאמת מונחי המילון בטקסט (D-22). טהור ובלי DOM: גם האפליקציה וגם tools/terms.mjs משתמשים בו,
// כדי שהכותב והבודק יראו בדיוק את המופעים שהלומד יראה מסומנים.
//
// אותיות שימוש: עברית מצמידה למילה ו, ה, ב, כ, ל, מ, ש. לכן לפני כל צורה מותרות עד 3 אותיות כאלה,
// למשל "במטא־אנליזה" או "שהמטא־אנליזה". קו התחתון יורד מתחת למילה כולה.
// גבול מילה: לפני ההתאמה ואחריה אסור שתבוא אות עברית. כך מונח לא נתפס בתוך מילה ארוכה יותר.
// מונח של כמה מילים: לפני כל מילה אחרי הראשונה מותרת ה׳ הידיעה, כמו "קבוצת הביקורת" או "המובהקות הסטטיסטית".
// מקף עברי (־) ומקף רגיל (-) נחשבים אותו דבר, וכך גם כל סוג של רווח.
// חוסמים: שמות המושגים של האתר נבדקים באותה התאמה, ומה שתואם להם נשאר טקסט רגיל.
// כך "רגרסיה" לא תסומן בתוך "רגרסיה לממוצע", שיש לו דף משלו.

const LETTER = 'א-ת';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const norm = (s) => String(s || '').replace(/[־-]/g, '־').replace(/\s+/g, ' ').trim();

function pattern(form) {
  return norm(form).split(' ').map((w, i) => {
    const p = esc(w).replace(/־/g, '[־-]');
    return i === 0 ? p : `ה?${p}`;
  }).join('\\s+');
}

// שמות המושגים (title.he ו־aka) כרשימת חוסמים, בלי כפילויות
export function conceptNames(list) {
  const set = new Set();
  for (const n of list || []) {
    if (n && n.he) set.add(norm(n.he));
    for (const a of (n && n.aka) || []) set.add(norm(a));
  }
  return [...set].filter(Boolean);
}

// terms: [{ id, forms: [...] }], blockers: [שם, ...]
// מחזיר split(text, { once }) → חלקים: { s } טקסט רגיל, או { s, id, at } מונח (at: המיקום בטקסט)
// once (ברירת המחדל): כל מונח מסומן רק במופע הראשון שלו בטקסט, כדי שהקריאה לא תתמלא בקווים
export function compile(terms, blockers = []) {
  const alts = [];
  const seen = new Set();
  for (const t of terms || []) for (const f of t.forms || []) {
    const k = norm(f);
    if (k && !seen.has(k)) { seen.add(k); alts.push({ k, id: t.id }); }
  }
  for (const b of blockers || []) {
    const k = norm(b);
    if (k && !seen.has(k)) { seen.add(k); alts.push({ k, id: null }); }
  }
  // הארוך קודם: בחלופות של ביטוי רגולרי הראשונה שמתאימה מנצחת, לא הארוכה
  alts.sort((a, b) => b.k.length - a.k.length);
  if (!alts.some((a) => a.id)) return { split: (text) => [{ s: String(text || '') }], size: 0 };
  // {0,3}? ולא {0,3}: קודם מנסים בלי אותיות שימוש, כדי שחלופה ארוכה שמתחילה באחת מהן (החוסם "מדגה") תנצח
  // את "מ" כאות שימוש ועוד "דגה". על כל הקורפוס זה לא משנה אף סימון אחר (נבדק בסקירה, 30.10)
  const re = new RegExp(`(?<![${LETTER}])([והבכלמש]{0,3}?)(?:${alts.map((a) => `(${pattern(a.k)})`).join('|')})(?![${LETTER}])`, 'g');
  const ids = alts.map((a) => a.id);
  function split(text, { once = true } = {}) {
    const s = String(text || '');
    const out = [];
    const done = new Set();
    let last = 0;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s))) {
      let g = 2;
      while (g < m.length && m[g] === undefined) g++;
      const id = ids[g - 2];
      if (!id || (once && done.has(id))) continue;
      done.add(id);
      if (m.index > last) out.push({ s: s.slice(last, m.index) });
      out.push({ s: m[0], id, at: m.index });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ s: s.slice(last) });
    return out;
  }
  return { split, size: alts.filter((a) => a.id).length };
}

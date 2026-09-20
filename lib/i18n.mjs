// Interface translation. English text is the key: t('Home') returns the translation from the
// language's dictionary (public/i18n/xx.json) or the English text when there is none.
// T('text') marks a string for translation in module-level constants (it returns the text unchanged).

export const T = (text) => text;

export function interpolate(text, vars) {
  if (!vars) return text;
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

export function makeT(dict) {
  return function t(text, vars) {
    const found = dict && typeof dict === 'object' ? dict[text] : null;
    return interpolate(typeof found === 'string' && found.trim() ? found : text, vars);
  };
}

// Pull every string marked with t('...') or T('...') out of source text.
export function extractStrings(source) {
  const out = new Set();
  const re = /\b[tT]\(\s*(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
  let m;
  while ((m = re.exec(source))) {
    const raw = m[1] !== undefined ? m[1] : m[2];
    out.add(raw.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n'));
  }
  return [...out];
}

// The placeholders in a string, like {n}, so a translation can be checked to keep them.
export function placeholders(text) {
  return [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

export function sameShape(source, translated) {
  if (typeof translated !== 'string' || !translated.trim()) return false;
  return JSON.stringify(placeholders(source)) === JSON.stringify(placeholders(translated));
}

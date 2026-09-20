// Undo the tricks scammers use to slip past keyword filters, so the same rules and models see plain text:
// lookalike letters (Cyrillic "а" for Latin "a"), hidden zero-width characters, spaced-out words ("p a y"),
// number-for-letter swaps ("r3fund"), defanged links ("hxxp", "[.]"), and decorative emoji.

const CONFUSABLES = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'і': 'i', 'ј': 'j', 'һ': 'h', 'ѕ': 's',
  'ο': 'o', 'α': 'a', 'ε': 'e', 'ι': 'i', 'ν': 'v', 'ρ': 'p',
  'ı': 'i', 'ℓ': 'l', 'ａ': 'a',
};

export function deobfuscate(input) {
  let t = String(input == null ? '' : input);
  t = t.normalize('NFKC');
  t = t.replace(/[​-‏⁠﻿­]/g, '');                 // zero-width and soft hyphen
  t = t.replace(/[аеорсхуіјһѕοαεινρıℓａ]/g, (c) => CONFUSABLES[c] || c);
  t = t.replace(/\p{Extended_Pictographic}|️/gu, ' ');                 // decorative emoji
  t = t.replace(/hxxp/gi, 'http').replace(/\[\.\]|\(\.\)|\[dot\]|\(dot\)/gi, '.');
  // single letters separated by spaces, dots or dashes: "p a y" -> "pay" (needs 3 or more letters in a row)
  t = t.replace(/\b(?:[A-Za-z][ .\-]){2,}[A-Za-z]\b/g, (m) => m.replace(/[ .\-]/g, ''));
  // digits standing in for letters inside a word: "r3fund", "0nline"
  t = t.replace(/\b[\w']*[A-Za-z][\w']*\b/g, (w) => (/\d/.test(w) && /[A-Za-z]{2}/.test(w.replace(/\d/g, '')) ? w.replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't') : w));
  return t.replace(/\s+/g, ' ').trim();
}

// Pure game logic (no DOM) — also loaded by test.mjs.
// e: emoji, u: measure word, n: Chinese name, en: [singular, plural] — used for the spoken question.
export const ITEMS = [
  { e: '🍎', u: '个', n: '苹果', en: ['apple', 'apples'] }, { e: '🍌', u: '根', n: '香蕉', en: ['banana', 'bananas'] },
  { e: '🍓', u: '颗', n: '草莓', en: ['strawberry', 'strawberries'] }, { e: '🍊', u: '个', n: '橘子', en: ['orange', 'oranges'] },
  { e: '🍇', u: '串', n: '葡萄', en: ['bunch of grapes', 'bunches of grapes'] }, { e: '🚗', u: '辆', n: '小汽车', en: ['car', 'cars'] },
  { e: '🚌', u: '辆', n: '公交车', en: ['bus', 'buses'] }, { e: '🚲', u: '辆', n: '自行车', en: ['bike', 'bikes'] },
  { e: '🐟', u: '条', n: '小鱼', en: ['fish', 'fish'] }, { e: '🎈', u: '个', n: '气球', en: ['balloon', 'balloons'] },
  { e: '⭐', u: '颗', n: '星星', en: ['star', 'stars'] }, { e: '🐥', u: '只', n: '小鸡', en: ['chick', 'chicks'] },
];

// Spoken phrases per language; lang is a BCP-47 tag used by speechSynthesis.
export const SPEECH = {
  zh: { lang: 'zh-CN', right: '太棒了', wrong: '再想想哦' },
  en: { lang: 'en-US', right: 'Great job!', wrong: 'Try again!' },
};

// Best device voice for a language: premium/enhanced/neural voices beat the basic default.
export function pickVoice(voices, lang) {
  const norm = (v) => v.lang.replace('_', '-');
  const score = (v) => (/premium|高级/i.test(v.name) ? 8 : 0) + (/enhanced|增强|natural|neural/i.test(v.name) ? 4 : 0)
    + (/google|online/i.test(v.name) ? 2 : 0) + (norm(v) === lang ? 1 : 0)
    // Apple's novelty voices sound worse than the standard ones (e.g. Tingting, Samantha).
    - (/^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b/i.test(v.name) ? 16 : 0);
  return voices.filter((v) => norm(v).startsWith(lang.slice(0, 2)))
    .reduce((best, v) => (!best || score(v) > score(best) ? v : best), null);
}

export function questionText({ a, b, op, item: { u, n, en } }, lang = 'zh') {
  if (lang === 'en') {
    const name = (k) => en[k === 1 ? 0 : 1];
    return op === '+'
      ? `${a} ${name(a)} plus ${b} ${name(b)}. How many ${en[1]} in all?`
      : `${a} ${name(a)}, take away ${b}. How many are left?`;
  }
  return op === '+'
    ? `${a}${u}${n}，再加${b}${u}${n}，一共有几${u}${n}？`
    : `${a}${u}${n}，拿走${b}${u}，还剩几${u}？`;
}

// Each level: max number, allowed ops.
export const LEVELS = [
  { name: '5以内加法', max: 5, ops: ['+'] },
  { name: '10以内加法', max: 10, ops: ['+'] },
  { name: '10以内减法', max: 10, ops: ['-'] },
  { name: '10以内加减法', max: 10, ops: ['+', '-'] },
  { name: '20以内加减法', max: 20, ops: ['+', '-'] },
];

const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function makeQuestion(level) {
  const { max, ops } = LEVELS[level];
  const op = ops[rand(0, ops.length - 1)];
  const item = ITEMS[rand(0, ITEMS.length - 1)];
  if (op === '+') {
    const answer = rand(2, max);
    const a = rand(1, answer - 1);
    return { a, b: answer - a, op, answer, item };
  }
  const a = rand(2, max);
  const b = rand(1, a - 1);
  return { a, b, op, answer: a - b, item };
}

// 4 distinct options near the answer, within 0..max.
export function makeChoices(answer, max) {
  const set = new Set([answer]);
  while (set.size < 4) {
    const c = answer + rand(-3, 3);
    if (c >= 0 && c <= max) set.add(c);
  }
  return [...set].sort((x, y) => x - y);
}

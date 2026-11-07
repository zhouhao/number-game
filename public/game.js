// Pure game logic (no DOM) — also loaded by test.mjs.
export const ITEMS = ['🍎', '🍌', '🍓', '🍊', '🍇', '🚗', '🚌', '🚲', '🐟', '🎈', '⭐', '🐥'];

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

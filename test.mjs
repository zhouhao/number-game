import assert from 'node:assert';
import { LEVELS, makeQuestion, makeChoices, questionText, pickVoice } from './public/game.js';

const voices = [
  { name: 'Tingting', lang: 'zh-CN' }, { name: 'Meijia', lang: 'zh-TW' },
  { name: 'Tingting (Enhanced)', lang: 'zh-CN' }, { name: 'Lilian (Premium)', lang: 'zh_CN' }, { name: 'Samantha', lang: 'en-US' },
];
assert.equal(pickVoice(voices, 'zh-CN').name, 'Lilian (Premium)');
assert.equal(pickVoice(voices.slice(0, 2), 'zh-CN').name, 'Tingting');
assert.equal(pickVoice(voices, 'en-US').name, 'Samantha');
assert.equal(pickVoice([], 'zh-CN'), null);
const mac = [{ name: 'Eddy (Chinese (China mainland))', lang: 'zh-CN' }, { name: 'Meijia', lang: 'zh-TW' }, { name: 'Tingting', lang: 'zh-CN' }];
assert.equal(pickVoice(mac, 'zh-CN').name, 'Tingting');

assert.equal(questionText({ a: 3, b: 2, op: '+', item: { u: '个', n: '苹果' } }), '3个苹果，再加2个苹果，一共有几个苹果？');
assert.equal(questionText({ a: 5, b: 2, op: '-', item: { u: '辆', n: '小汽车' } }), '5辆小汽车，拿走2辆，还剩几辆？');
const apple = { en: ['apple', 'apples'] };
assert.equal(questionText({ a: 1, b: 2, op: '+', item: apple }, 'en'), '1 apple plus 2 apples. How many apples in all?');
assert.equal(questionText({ a: 5, b: 1, op: '-', item: apple }, 'en'), '5 apples, take away 1. How many are left?');

for (let level = 0; level < LEVELS.length; level++) {
  const { max, ops } = LEVELS[level];
  for (let i = 0; i < 2000; i++) {
    const q = makeQuestion(level);
    assert(ops.includes(q.op));
    assert(q.a >= 1 && q.b >= 1 && q.a <= max, JSON.stringify(q));
    assert.equal(q.answer, q.op === '+' ? q.a + q.b : q.a - q.b);
    assert(q.answer >= 0 && q.answer <= max);
    const c = makeChoices(q.answer, max);
    assert.equal(new Set(c).size, 4);
    assert(c.includes(q.answer) && c.every((x) => x >= 0 && x <= max));
  }
}
console.log('ok');

// Pipe puzzle
import { N, E, S, W, rotate, flow, makeLevel } from './public/pipes.js';
assert.equal(rotate(N | E), E | S);
assert.equal(rotate(N | S, 3), E | W);
const straightUp = [0, N | S, 0, 0, N | S, 0, 0, N | S, 0];
assert.equal(flow(straightUp, 1, 1).won, true);
assert.equal(flow(straightUp, 0, 1).won, false);
assert.equal(flow([0, E | W, 0, 0, N | S, 0, 0, N | S, 0], 1, 1).won, false);
for (let i = 0; i < 500; i++) {
  const lv = makeLevel();
  assert.equal(lv.pieces.length, 6);
  const grid = Array(9).fill(0);
  lv.pieces.filter(p => p.sol !== null).forEach(p => { grid[p.sol] = p.mask; });
  assert.equal(flow(grid, lv.entry, lv.exit).won, true);
}
console.log('pipes ok');

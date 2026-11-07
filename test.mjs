import assert from 'node:assert';
import { LEVELS, makeQuestion, makeChoices } from './public/game.js';

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

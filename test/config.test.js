import test from 'node:test';
import assert from 'node:assert/strict';

import { FRUITS, SCORING, fruitTier, roundSpec } from '../js/config.js';

test('opening round matches the arcade population and rock count', () => {
  assert.deepEqual(roundSpec(1), {
    pookas: 3,
    fygars: 1,
    rocks: 3,
    speedScale: 1,
    fireEagerness: 0,
  });
});

test('round difficulty rises without exceeding eight enemies', () => {
  let previousSpeed = 0;
  for (let round = 1; round <= 255; round++) {
    const spec = roundSpec(round);
    assert.ok(spec.pookas + spec.fygars <= 8);
    assert.ok(spec.speedScale >= previousSpeed);
    previousSpeed = spec.speedScale;
  }
});

test('bonus item schedule covers the complete arcade progression', () => {
  const checkpoints = [
    [1, 'CARROT', 400], [2, 'TURNIP', 600], [3, 'MUSHROOM', 800],
    [4, 'CUCUMBER', 1000], [5, 'CUCUMBER', 1000],
    [6, 'EGGPLANT', 2000], [8, 'PEPPER', 3000],
    [10, 'TOMATO', 4000], [12, 'GARLIC', 5000],
    [14, 'WATERMELON', 6000], [16, 'GALAXIAN', 7000],
    [18, 'PINEAPPLE', 8000], [255, 'PINEAPPLE', 8000],
  ];
  for (const [round, name, value] of checkpoints) {
    const fruit = FRUITS[fruitTier(round)];
    assert.equal(fruit.name, name);
    assert.equal(fruit.value, value);
  }
});

test('depth and rock scoring tables retain arcade values', () => {
  assert.deepEqual(SCORING.POOKA, [200, 300, 400, 500]);
  assert.deepEqual(SCORING.FYGAR_H, [400, 600, 800, 1000]);
  assert.deepEqual(SCORING.ROCK_CRUSH, [1000, 2500, 4000, 6000, 8000, 10000, 12000, 15000]);
});

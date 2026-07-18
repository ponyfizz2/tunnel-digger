import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.document = {
  createElement() {
    return {
      width: 0, height: 0,
      getContext: () => ({ fillStyle: '', fillRect() {} }),
    };
  },
};

const { Pump } = await import('../js/entities/pump.js');

function fixture() {
  const controls = { down: false, pressed: false };
  const enemy = {
    x: 60, y: 152, state: 'walk', stage: 0, deflateT: 0,
    beingPumped: false,
    get pumpable() { return this.state === 'walk' || this.state === 'inflated'; },
    inflate() {
      this.stage++;
      if (this.stage >= 4) this.state = 'pop';
    },
  };
  const game = {
    player: { x: 24, y: 152, facing: 'right', dead: false },
    enemies: [enemy],
    input: {
      down: () => controls.down,
      pressed: () => controls.pressed,
    },
    world: { isOpen: () => true },
    rockAt: () => false,
    audio: { sfxShot() {}, sfxPump() {} },
  };
  return { pump: new Pump(game), enemy, controls };
}

test('hose catches across its full segment and repeated taps inflate', () => {
  const { pump, enemy, controls } = fixture();
  pump.fire();
  for (let i = 0; i < 12 && pump.state !== 'attached'; i++) pump.update(1 / 60);
  assert.equal(pump.state, 'attached');
  assert.equal(enemy.stage, 1);

  for (let stage = 2; stage <= 4; stage++) {
    controls.pressed = true;
    pump.update(1 / 60);
    controls.pressed = false;
    assert.equal(enemy.stage, stage);
  }
  assert.equal(enemy.state, 'pop');
});

test('an idle attached hose retracts after its tap window', () => {
  const { pump } = fixture();
  pump.fire();
  for (let i = 0; i < 12 && pump.state !== 'attached'; i++) pump.update(1 / 60);
  for (let i = 0; i < 50; i++) pump.update(1 / 60);
  assert.notEqual(pump.state, 'attached');
});

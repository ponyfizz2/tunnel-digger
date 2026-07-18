// ---------------------------------------------------------------------------
// The harpoon/pump. Extends in the player's facing direction; stops on dirt,
// rocks or max range. On hitting an enemy it attaches: holding fire inflates
// one stage per interval until the enemy pops; releasing detaches and the
// enemy slowly deflates. Any movement input cancels the pump (arcade rule).
// ---------------------------------------------------------------------------

import { PUMP, cellOf } from '../config.js';
import { DIRV } from '../world.js';

export class Pump {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.state = 'idle';
    this.len = 0;
    this.dir = 'right';
    this.enemy = null;
    this.holdT = 0;
    this.autoNext = PUMP.HOLD_DELAY;
    this.latchT = 0;
  }

  get busy() { return this.state !== 'idle'; }

  cancel() {
    if (this.enemy) this.enemy = null;
    if (this.state !== 'idle') this.state = 'retract';
  }

  fire() {
    if (this.state === 'idle' && !this.game.player.dead) {
      this.state = 'extend';
      this.len = 4;
      this.dir = this.game.player.facing;
      this.game.audio.sfxShot();
    }
  }

  update(dt) {
    if (this.state === 'idle') return;
    const p = this.game.player;
    const [dx, dy] = DIRV[this.dir];

    if (this.state === 'extend') {
      this.len += PUMP.SPEED;
      const tx = p.x + dx * this.len, ty = p.y + dy * this.len;
      // Enemy hit: test the full new hose segment, not only its tip. This
      // prevents fast extension from skipping across a sprite.
      for (const e of this.game.enemies) {
        const along = (e.x - p.x) * dx + (e.y - p.y) * dy;
        const across = Math.abs((e.x - p.x) * dy - (e.y - p.y) * dx);
        if (e.pumpable && along >= 4 && along <= this.len + 7 && across < 8) {
          this.enemy = e;
          this.state = 'attached';
          this.holdT = 0;
          this.autoNext = PUMP.HOLD_DELAY;
          this.latchT = 0;
          this.len = Math.max(4, along);
          if (e.stage === 0) {
            e.state = 'inflated';
            e.stage = 1;
            e.deflateT = 0;
            this.game.audio.sfxPump(1);
          }
          e.beingPumped = true;
          return;
        }
      }
      // dirt / rock / range stops the harpoon
      const [c, r] = cellOf(tx, ty);
      if (!this.game.world.isOpen(c, r) || this.game.rockAt(c, r) || this.len >= PUMP.RANGE) {
        this.state = 'retract';
      }

    } else if (this.state === 'attached') {
      const e = this.enemy;
      if (!e || e.state === 'pop' || e.state === 'crushed' || !this.game.enemies.includes(e)) {
        this.enemy = null;
        this.state = 'retract';
        return;
      }
      e.beingPumped = true;
      e.deflateT = 0;
      const down = this.game.input.down('fire');
      const tapped = this.game.input.pressed('fire');
      let addStage = false;
      if (tapped) {
        addStage = true;
        this.holdT = 0;
        this.autoNext = PUMP.HOLD_DELAY;
      } else if (down) {
        this.holdT += dt;
        if (this.holdT >= this.autoNext) {
          addStage = true;
          this.autoNext += PUMP.HOLD_INTERVAL;
        }
      } else {
        this.holdT = 0;
        this.autoNext = PUMP.HOLD_DELAY;
      }

      if (addStage) {
        this.latchT = 0;
        e.inflate(); // may pop (game.popEnemy) which changes e.state
        if (e.state === 'inflated') this.game.audio.sfxPump(e.stage);
      } else if (down) {
        this.latchT = 0;
      } else {
        this.latchT += dt;
      }

      if (this.enemy) this.len = Math.hypot(e.x - p.x, e.y - p.y);
      if (this.latchT > PUMP.LATCH_TIME || this.len > PUMP.RANGE + 8) {
        this.enemy = null;
        this.state = 'retract';
      }

    } else if (this.state === 'retract') {
      this.len -= PUMP.RETRACT;
      if (this.len <= 0) this.reset();
    }
  }

  render(ctx) {
    if (!this.busy) return;
    const p = this.game.player;
    const [dx, dy] = DIRV[this.dir];
    const x1 = p.x + dx * 5, y1 = p.y + dy * 5;
    const x2 = p.x + dx * this.len, y2 = p.y + dy * this.len;
    // segmented hose
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const segs = Math.floor(this.len / 6);
    ctx.fillStyle = '#ffd800';
    for (let i = 1; i <= segs; i++) {
      ctx.fillRect(p.x + dx * i * 6 - 1, p.y + dy * i * 6 - 1, 2, 2);
    }
    // harpoon tip
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
  }
}

// ---------------------------------------------------------------------------
// Pooka and Fygar.
// walk      – greedy chase through the open-tunnel graph (no reversing unless
//             dead-ended, occasional wander for arcade unpredictability)
// ghost     – "eyes" mode: drifts straight through dirt toward the player,
//             rematerializing when it crosses an open cell. The ghost timer
//             runs faster in dead ends, so cornered enemies escape.
// inflated  – frozen while pumped; deflates stage by stage when released
// pop/crushed – short death animations
// The last survivor flees to the surface and runs off the top-left edge.
// ---------------------------------------------------------------------------

import {
  CELL, COLS, ROWS, ENEMY, FYGAR, PUMP, colX, rowY, cellOf, clamp,
} from '../config.js';
import { SPR, drawSprite } from '../sprites.js';
import { gridStep, DIRV, OPP, DIRS } from '../world.js';

const rand = (a, b) => a + Math.random() * (b - a);

export class Enemy {
  constructor(game, c, r, dir = 'left') {
    this.game = game;
    this.type = 'pooka';
    this.spawnC = c; this.spawnR = r; this.spawnDir = dir;
    this.resetToSpawn();
  }

  resetToSpawn() {
    this.x = colX(this.spawnC);
    this.y = rowY(this.spawnR);
    this.dir = this.spawnDir;
    this.facing = this.spawnDir === 'right' ? 'right' : 'left';
    this.state = 'walk';
    this.stage = 0;
    this.deflateT = 0;
    this.beingPumped = false;
    this.ghostTimer = rand(ENEMY.GHOST_MIN, ENEMY.GHOST_MAX);
    this.ghostTime = 0;
    this.fleeing = false;
    this.animT = Math.random();
    this.popT = 0;
    this.crushT = 0;
    this.lastCellKey = '';
    if (this.flame !== undefined) this.flame = null;
  }

  get deadly() { return this.state === 'walk' || this.state === 'ghost'; }
  get pumpable() { return this.state === 'walk' || this.state === 'inflated'; }

  speed() {
    let s = ENEMY.SPEED * this.game.spec.speedScale *
      (1 + this.game.enemiesKilled * ENEMY.AGGRO_PER_KILL);
    if (this.fleeing) s *= 1.25;
    return s;
  }

  canEnter = (c, r) =>
    this.game.world.isOpen(c, r) && !this.game.rockAt(c, r);

  target() {
    if (this.fleeing) return { x: colX(0), y: rowY(this.state === 'ghost' ? 1 : 0) };
    return { x: this.game.player.x, y: this.game.player.y };
  }

  options(c, r) {
    return DIRS.filter(d => this.canEnter(c + DIRV[d][0], r + DIRV[d][1]));
  }

  choose(c, r) {
    const opts = this.options(c, r);
    if (!opts.length) return;
    const nonRev = opts.filter(d => d !== OPP[this.dir]);
    const pool = nonRev.length ? nonRev : opts;
    if (!this.fleeing && Math.random() < 0.22) { // wander
      this.dir = pool[Math.floor(Math.random() * pool.length)];
      return;
    }
    const t = this.target();
    let best = pool[0], bestD = Infinity;
    for (const d of pool) {
      const [dx, dy] = DIRV[d];
      const dd = Math.hypot(colX(c + dx) - t.x, rowY(r + dy) - t.y);
      if (dd < bestD) { bestD = dd; best = d; }
    }
    this.dir = best;
  }

  update(dt) {
    this.animT += dt;
    switch (this.state) {
      case 'walk': this.walk(dt); break;
      case 'ghost': this.ghost(dt); break;
      case 'inflated':
        if (!this.beingPumped) {
          this.deflateT += dt;
          if (this.deflateT > PUMP.DEFLATE) {
            this.deflateT = 0;
            this.stage--;
            if (this.stage <= 0) { this.stage = 0; this.state = 'walk'; this.lastCellKey = ''; }
          }
        }
        break;
      case 'pop':
        this.popT += dt;
        if (this.popT > 0.4) this.game.removeEnemy(this);
        break;
      case 'crushed':
        this.crushT += dt;
        if (this.crushT > 0.6) this.game.removeEnemy(this);
        break;
    }
    this.beingPumped = false; // pump re-asserts this every tick while attached
  }

  walk(dt) {
    const [c, r] = cellOf(this.x, this.y);
    const cx = colX(c), cy = rowY(r);
    const atCenter = Math.abs(this.x - cx) < 0.6 && Math.abs(this.y - cy) < 0.6;
    const key = c + ',' + r;
    if (atCenter && key !== this.lastCellKey) {
      this.lastCellKey = key;
      this.choose(c, r);
    }
    let moved = gridStep(this, this.dir, this.speed(), this.canEnter);
    if (!moved) { this.choose(c, r); moved = gridStep(this, this.dir, this.speed(), this.canEnter); }
    if (this.dir === 'left' || this.dir === 'right') this.facing = this.dir;

    // fleeing along the surface: sprint left and escape off-screen
    if (this.fleeing && r === 0) {
      this.dir = 'left';
      if (this.x <= colX(0) + 0.5) { this.game.removeEnemy(this, true); return; }
    }

    // ghost countdown (faster when boxed in)
    const deadEnd = this.options(c, r).length <= 1;
    this.ghostTimer -= dt * (deadEnd ? ENEMY.STUCK_FACTOR : 1) * (this.fleeing ? 1.5 : 1);
    if (this.ghostTimer <= 0 && !(this.fleeing && r === 0)) {
      this.state = 'ghost';
      this.ghostTime = 0;
    }
  }

  ghost(dt) {
    this.ghostTime += dt;
    const t = this.target();
    const dx = t.x - this.x, dy = t.y - this.y;
    const m = Math.hypot(dx, dy) || 1;
    const sp = ENEMY.GHOST_SPEED * this.game.spec.speedScale;
    this.x = clamp(this.x + (dx / m) * sp, colX(0), colX(COLS - 1));
    this.y = clamp(this.y + (dy / m) * sp, rowY(1), rowY(ROWS - 1));
    if (this.ghostTime > ENEMY.GHOST_MIN_TIME) {
      const [c, r] = cellOf(this.x, this.y);
      const near = Math.abs(this.x - colX(c)) < 5 && Math.abs(this.y - rowY(r)) < 5;
      if (near && this.canEnter(c, r)) {
        this.materialize(c, r);
      } else if (this.ghostTime > 10) {
        // failsafe: snap into the nearest open cell
        let best = null, bestD = Infinity;
        for (let rr = 1; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            if (!this.canEnter(cc, rr)) continue;
            const dd = Math.hypot(colX(cc) - this.x, rowY(rr) - this.y);
            if (dd < bestD) { bestD = dd; best = [cc, rr]; }
          }
        }
        if (best) this.materialize(best[0], best[1]);
      }
    }
  }

  materialize(c, r) {
    this.x = colX(c); this.y = rowY(r);
    this.state = 'walk';
    this.lastCellKey = '';
    this.ghostTimer = rand(ENEMY.GHOST_MIN, ENEMY.GHOST_MAX);
  }

  inflate() {
    this.stage++;
    this.deflateT = 0;
    if (this.stage >= PUMP.STAGES) this.game.popEnemy(this);
  }

  crush() {
    if (this.state === 'crushed') return;
    this.state = 'crushed';
    this.crushT = 0;
  }

  baseSprite() {
    return SPR[this.type][Math.floor(this.animT * 7) % 2];
  }

  render(ctx) {
    switch (this.state) {
      case 'walk':
        drawSprite(ctx, this.baseSprite(), this.x, this.y, { flipH: this.facing === 'left' });
        break;
      case 'ghost':
        drawSprite(ctx, SPR.eyes, this.x, this.y, { alpha: 0.55 + 0.25 * Math.sin(this.animT * 10) });
        break;
      case 'inflated': {
        const s = 1 + this.stage * 0.3 + Math.sin(this.animT * 12) * 0.03;
        drawSprite(ctx, this.baseSprite(), this.x, this.y, { scale: s, flipH: this.facing === 'left' });
        break;
      }
      case 'pop': {
        const rad = this.popT * 45;
        ctx.fillStyle = this.type === 'fygar' ? '#28c040' : '#f83800';
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.fillRect(this.x + Math.cos(a) * rad - 1.5, this.y + Math.sin(a) * rad - 1.5, 3, 3);
        }
        break;
      }
      case 'crushed':
        drawSprite(ctx, this.baseSprite(), this.x, this.y + 4, {
          scaleY: 0.35, alpha: 1 - this.crushT,
        });
        break;
    }
  }
}

export class Pooka extends Enemy {}

export class Fygar extends Enemy {
  constructor(game, c, r, dir) {
    super(game, c, r, dir);
    this.type = 'fygar';
    this.fireCd = rand(FYGAR.FIRE_COOLDOWN_MIN, FYGAR.FIRE_COOLDOWN_MAX);
    this.flame = null;
  }

  update(dt) {
    if (this.state === 'walk' && this.flame) {
      this.animT += dt;
      this.updateFlame(dt);
      this.beingPumped = false;
      return;
    }
    if (this.state === 'walk') this.maybeFire(dt);
    super.update(dt);
  }

  maybeFire(dt) {
    this.fireCd -= dt * (1 + this.game.spec.fireEagerness);
    if (this.fireCd > 0 || this.fleeing) return;
    const p = this.game.player;
    const [, r] = cellOf(this.x, this.y);
    if (Math.abs(this.y - rowY(r)) > 1) return; // must be row-aligned
    const sameRow = Math.abs(p.y - this.y) < 8;
    const dx = p.x - this.x;
    if ((sameRow && Math.abs(dx) < FYGAR.RANGE_CELLS * CELL) || Math.random() < 0.3) {
      if (sameRow) this.facing = dx < 0 ? 'left' : 'right';
      this.flame = { state: 'windup', t: 0, len: 0, maxLen: 0, dir: this.facing === 'left' ? -1 : 1 };
      this.game.audio.sfxFire();
    } else {
      this.fireCd = 1.2;
    }
  }

  updateFlame(dt) {
    const f = this.flame;
    f.t += dt;
    if (f.state === 'windup') {
      if (f.t > FYGAR.WINDUP) {
        f.state = 'burn';
        f.t = 0;
        // flame reaches through open cells only, up to FLAME_CELLS
        const [c, r] = cellOf(this.x, this.y);
        let n = 0;
        for (let i = 1; i <= FYGAR.FLAME_CELLS; i++) {
          if (!this.game.world.isOpen(c + f.dir * i, r) || this.game.rockAt(c + f.dir * i, r)) break;
          n++;
        }
        f.maxLen = Math.max(8, n * CELL - 2);
      }
    } else { // burn
      const grow = FYGAR.FLAME_GROW, hold = FYGAR.FLAME_HOLD;
      if (f.t < grow) f.len = f.maxLen * (f.t / grow);
      else if (f.t < grow + hold) f.len = f.maxLen;
      else f.len = Math.max(0, f.maxLen * (1 - (f.t - grow - hold) / 0.2));
      if (f.t > grow + hold + 0.2) {
        this.flame = null;
        this.fireCd = rand(FYGAR.FIRE_COOLDOWN_MIN, FYGAR.FIRE_COOLDOWN_MAX);
        return;
      }
      // burn the player
      const p = this.game.player;
      if (!p.dead && f.len > 4) {
        const x0 = this.x + f.dir * 7;
        const x1 = this.x + f.dir * (7 + f.len);
        const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
        if (p.x + 6 > lo && p.x - 6 < hi && Math.abs(p.y - this.y) < 10) {
          this.game.killPlayer();
        }
      }
    }
  }

  render(ctx) {
    if (this.state === 'walk' && this.flame) {
      const f = this.flame;
      if (f.state === 'windup') {
        // telegraphed flash
        const on = Math.floor(f.t * 12) % 2 === 0;
        drawSprite(ctx, this.baseSprite(), this.x, this.y, {
          flipH: this.facing === 'left', alpha: on ? 1 : 0.35,
        });
      } else {
        drawSprite(ctx, this.baseSprite(), this.x, this.y, { flipH: this.facing === 'left' });
        this.renderFlame(ctx, f);
      }
      return;
    }
    super.render(ctx);
  }

  renderFlame(ctx, f) {
    if (f.len < 3) return;
    const t = this.animT * 30;
    const x0 = this.x + f.dir * 7;
    const layers = [
      ['#f83800', 5], ['#ff9800', 3.5], ['#ffe860', 2],
    ];
    for (const [col, h] of layers) {
      ctx.fillStyle = col;
      for (let i = 0; i < f.len; i += 3) {
        const hh = h + Math.sin(t + i) * 1.2;
        ctx.fillRect(x0 + f.dir * i - 1.5, this.y - hh, 4, hh * 2);
      }
    }
  }
}

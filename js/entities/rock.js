// ---------------------------------------------------------------------------
// Rocks sit in dirt cells and block movement. When the cell beneath is dug
// out they wobble briefly, then drop, crushing anything in their column.
// Multi-crushes score escalating bonuses (handled in game.onRockLanded).
// When a rock starts falling, its own cell becomes an open tunnel cell.
// ---------------------------------------------------------------------------

import { CELL, ROWS, FIELD_Y, ROCK, colX, rowY } from '../config.js';
import { SPR, drawSprite } from '../sprites.js';

export class Rock {
  constructor(game, c, r) {
    this.game = game;
    this.c = c; this.r = r;
    this.x = colX(c); this.y = rowY(r);
    this.state = 'idle';
    this.t = 0;
    this.crushCount = 0;
    this.dead = false;
  }

  // idle/wobbling rocks block movement and the harpoon
  get blocking() { return this.state === 'idle' || this.state === 'wobble'; }

  update(dt) {
    const w = this.game.world;
    if (this.state === 'idle') {
      if (this.r + 1 < ROWS && w.isOpen(this.c, this.r + 1)) {
        this.state = 'wobble';
        this.t = 0;
        this.game.audio.sfxWobble();
      }
    } else if (this.state === 'wobble') {
      this.t += dt;
      if (this.t > ROCK.WOBBLE) {
        this.state = 'fall';
        w.openCell(this.c, this.r, true); // vacated cell becomes tunnel
      }
    } else if (this.state === 'fall') {
      this.y += ROCK.FALL_SPEED;
      this.r = Math.floor((this.y - FIELD_Y) / CELL);
      // crush anything in the way
      const hit = (e) => Math.abs(e.x - this.x) < 10 && e.y > this.y - 4 && e.y < this.y + 14;
      const p = this.game.player;
      if (!p.dead && hit(p)) this.game.killPlayer();
      for (const e of this.game.enemies) {
        if ((e.state === 'walk' || e.state === 'inflated') && hit(e)) {
          e.crush();
          this.crushCount++;
        }
      }
      // land when the next cell down is dirt, another rock, or the floor
      const below = this.r + 1;
      const blocked = below >= ROWS || !w.isOpen(this.c, below) ||
        this.game.rocks.some(o => o !== this && o.blocking && o.c === this.c && o.r === below);
      if (blocked && this.y >= rowY(this.r)) {
        this.y = rowY(this.r);
        this.state = 'shatter';
        this.t = 0;
        this.game.onRockLanded(this);
      }
    } else { // shatter
      this.t += dt;
      if (this.t > ROCK.SHATTER) this.dead = true;
    }
  }

  render(ctx) {
    if (this.state === 'shatter') {
      const d = this.t * 22;
      const a = 1 - this.t / ROCK.SHATTER;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.drawImage(SPR.rock, 0, 0, 8, 14, this.x - 8 - d, this.y - 7 + d * 0.4, 8, 14);
      ctx.drawImage(SPR.rock, 8, 0, 8, 14, this.x + d, this.y - 7 + d * 0.4, 8, 14);
      ctx.restore();
      return;
    }
    const wob = this.state === 'wobble' ? Math.sin(this.t * 40) * 1.5 : 0;
    drawSprite(ctx, SPR.rock, this.x + wob, this.y);
  }
}

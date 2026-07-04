// ---------------------------------------------------------------------------
// The digger. Moves along the 16px lane grid, carves the dirt mask as it
// goes, and marks grid cells "open" when it passes their center (which is
// what awards dig points and lets enemies path through).
// ---------------------------------------------------------------------------

import { PLAYER, CELL, FIELD_Y, colX, rowY, cellOf } from '../config.js';
import { SPR, drawSprite } from '../sprites.js';
import { gridStep, DIRV } from '../world.js';

const ROT = { right: 0, left: 0, up: -Math.PI / 2, down: Math.PI / 2 };

export class Player {
  constructor(game) {
    this.game = game;
    this.respawn();
  }

  respawn() {
    this.x = colX(PLAYER.SPAWN_C);
    this.y = rowY(PLAYER.SPAWN_R);
    this.facing = 'right';
    this.dead = false;
    this.deadT = 0;
    this.walkDist = 0;
    this.moving = false;
  }

  die() { this.dead = true; this.deadT = 0; this.moving = false; }
  get deathDone() { return this.dead && this.deadT > PLAYER.DEATH_TIME; }

  // the player can dig anywhere in bounds; only rocks block
  canEnter = (c, r) =>
    this.game.world.inBounds(c, r) && !this.game.rockAt(c, r);

  update(dt) {
    if (this.dead) { this.deadT += dt; return; }
    const { input, pump, world, audio } = this.game;
    const want = input.currentDir();
    let moving = false;

    if (want && pump.busy) pump.cancel(); // movement cancels the pump

    if (want && !pump.busy) {
      this.facing = want;
      // slower while carving fresh dirt
      const [ac, ar] = cellOf(this.x + DIRV[want][0] * 7, this.y + DIRV[want][1] * 7);
      const digging = !world.isOpen(ac, ar);
      const sp = PLAYER.SPEED * (digging ? PLAYER.DIG_FACTOR : 1);
      moving = gridStep(this, want, sp, this.canEnter);
      if (moving) {
        this.walkDist += sp;
        if (this.y > FIELD_Y + CELL - 4) world.carveAt(this.x, this.y, 6.5);
        const [c, r] = cellOf(this.x, this.y);
        if (Math.abs(this.x - colX(c)) < 3 && Math.abs(this.y - rowY(r)) < 3) {
          world.openCell(c, r, false); // scores + dig sfx via world.onOpen
        }
      }
    }
    this.moving = moving;
    audio.setWalking(moving);
  }

  render(ctx) {
    if (this.dead) {
      const a = Math.max(0, 1 - this.deadT / PLAYER.DEATH_TIME);
      drawSprite(ctx, SPR.playerDead, this.x, this.y, {
        alpha: 0.3 + 0.7 * a,
        rot: Math.sin(this.deadT * 10) * 0.3,
      });
      return;
    }
    const pumping = this.game.pump.busy;
    const img = pumping ? SPR.playerPump : SPR.player[Math.floor(this.walkDist / 6) % 2];
    drawSprite(ctx, img, this.x, this.y, {
      flipH: this.facing === 'left',
      rot: ROT[this.facing],
    });
  }
}

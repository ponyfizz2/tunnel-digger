// Bonus vegetable that appears at the spawn tunnel after enough rocks drop.

import { FRUITS, FRUIT_TIME } from '../config.js';
import { SPR, drawSprite } from '../sprites.js';

export class Fruit {
  constructor(game, x, y, tier) {
    this.game = game;
    this.x = x; this.y = y;
    this.tier = tier;
    this.value = FRUITS[tier].value;
    this.t = 0;
    this.dead = false;
  }

  update(dt) {
    this.t += dt;
    if (this.t > FRUIT_TIME) { this.dead = true; return; }
    const p = this.game.player;
    if (!p.dead && Math.hypot(p.x - this.x, p.y - this.y) < 10) {
      this.dead = true;
      this.game.addScore(this.value);
      this.game.popup(this.x, this.y, this.value);
      this.game.audio.sfxFruit();
    }
  }

  render(ctx) {
    // blink during the last 3 seconds
    if (FRUIT_TIME - this.t < 3 && Math.floor(this.t * 8) % 2) return;
    drawSprite(ctx, SPR.fruits[this.tier], this.x, this.y);
  }
}

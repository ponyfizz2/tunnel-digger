// Score strip (top), lives / round / bonus-item indicators (bottom).

import { LOGICAL_W, LOGICAL_H, FRUITS } from './config.js';
import { SPR, drawText, drawTextC } from './sprites.js';

export function drawHUD(ctx, game) {
  // top: 1UP + score, HI-SCORE + value
  const blink = Math.floor(game.time * 2) % 2 === 0;
  if (blink || game.state !== 'PLAY') drawText(ctx, '1UP', 16, 3, '#f83800');
  const s = String(game.score);
  drawText(ctx, s, 64 - s.length * 4, 10, '#fff');
  drawTextC(ctx, 'HI-SCORE', LOGICAL_W / 2 + 20, 3, '#f83800');
  drawTextC(ctx, String(game.hiScore), LOGICAL_W / 2 + 20, 10, '#fff');

  // bottom: reserve lives, current bonus item, round number
  const lives = Math.max(0, game.lives - 1);
  for (let i = 0; i < Math.min(lives, 6); i++) {
    ctx.drawImage(SPR.player[0], 2 + i * 10, LOGICAL_H - 8, 8, 8);
  }
  const tier = Math.min(game.round - 1, FRUITS.length - 1);
  const fr = SPR.fruits[tier];
  ctx.drawImage(fr, LOGICAL_W / 2 - 4, LOGICAL_H - 9, 8, 8);
  const rs = 'ROUND ' + game.round;
  drawText(ctx, rs, LOGICAL_W - rs.length * 4 - 2, LOGICAL_H - 7, '#fff');
}

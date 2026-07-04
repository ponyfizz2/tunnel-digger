// ---------------------------------------------------------------------------
// The dirt world. Two representations kept in sync:
//  * a COLS x ROWS boolean grid ("open") used by all game logic / AI
//  * a full-resolution "dirt" canvas that gets holes carved out of it
//    (destination-out circle stamps) so tunnels get the rounded, scalloped
//    look of the arcade original.
// Row 0 is the surface lane (sky): always open, never carved.
// ---------------------------------------------------------------------------

import {
  LOGICAL_W, LOGICAL_H, CELL, COLS, ROWS, FIELD_Y,
  colX, rowY, clamp, stratum,
} from './config.js';
import { SPR } from './sprites.js';

export const DIRV = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
export const OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
export const DIRS = ['left', 'right', 'up', 'down'];

// dirt strata, light to deep (arcade-style layered earth tones)
const STRATA = ['#f0b060', '#e07828', '#c84818', '#963010'];

// ---------------------------------------------------------------------------
// Shared lane movement. Entities live on 16px lanes; moving along one axis
// requires alignment on the other, and this helper auto-steers toward the
// lane center, which produces smooth arcade-style cornering.
// Returns true if the entity actually moved.
// ---------------------------------------------------------------------------
export function gridStep(ent, dir, speed, canEnter) {
  const v = DIRV[dir];
  if (!v) return false;
  const [dx, dy] = v;
  const c = clamp(Math.floor(ent.x / CELL), 0, COLS - 1);
  const r = clamp(Math.floor((ent.y - FIELD_Y) / CELL), 0, ROWS - 1);
  const cx = colX(c), cy = rowY(r);
  if (dx !== 0) {
    if (Math.abs(ent.y - cy) > 0.01) { ent.y += clamp(cy - ent.y, -speed, speed); return true; }
    let nx = ent.x + dx * speed;
    if (!canEnter(c + dx, r)) nx = dx > 0 ? Math.min(nx, cx) : Math.max(nx, cx);
    nx = clamp(nx, colX(0), colX(COLS - 1));
    const moved = Math.abs(nx - ent.x) > 0.0001;
    ent.x = nx;
    return moved;
  } else {
    if (Math.abs(ent.x - cx) > 0.01) { ent.x += clamp(cx - ent.x, -speed, speed); return true; }
    let ny = ent.y + dy * speed;
    if (!canEnter(c, r + dy)) ny = dy > 0 ? Math.min(ny, cy) : Math.max(ny, cy);
    ny = clamp(ny, rowY(0), rowY(ROWS - 1));
    const moved = Math.abs(ny - ent.y) > 0.0001;
    ent.y = ny;
    return moved;
  }
}

export class World {
  constructor() {
    this.open = new Uint8Array(COLS * ROWS);
    this.dirt = document.createElement('canvas');
    this.dirt.width = LOGICAL_W;
    this.dirt.height = LOGICAL_H;
    this.g = this.dirt.getContext('2d');
    this.onOpen = null; // set by the game: scoring + dig SFX
  }

  reset() {
    this.open.fill(0);
    for (let c = 0; c < COLS; c++) this.open[c] = 1; // surface lane
    const g = this.g;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    // paint the four strata
    for (let r = 1; r < ROWS; r++) {
      g.fillStyle = STRATA[stratum(r)];
      g.fillRect(0, FIELD_Y + r * CELL, LOGICAL_W, CELL);
    }
    // subtle texture dots
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = FIELD_Y + CELL; y < FIELD_Y + ROWS * CELL; y += 4) {
      for (let x = ((y / 4) % 2) * 2; x < LOGICAL_W; x += 4) g.fillRect(x, y, 1, 1);
    }
  }

  inBounds(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }
  isOpen(c, r) { return this.inBounds(c, r) && !!this.open[r * COLS + c]; }

  carveAt(x, y, rad = 6.5) {
    const g = this.g;
    g.fillStyle = '#000'; // opaque source so destination-out erases fully
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }

  carveLine(x1, y1, x2, y2, rad = 6.5) {
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
    for (let i = 0; i <= n; i++) this.carveAt(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, rad);
  }

  openCell(c, r, silent = true) {
    if (!this.inBounds(c, r) || this.open[r * COLS + c]) return false;
    this.open[r * COLS + c] = 1;
    if (r > 0) this.carveAt(colX(c), rowY(r), 7.5);
    if (!silent && this.onOpen) this.onOpen(c, r);
    return true;
  }

  // carve a connected run of cells (used for the pre-dug starting tunnels)
  carveCellPath(cells) {
    let prev = null;
    for (const [c, r] of cells) {
      this.openCell(c, r, true);
      if (prev) this.carveLine(colX(prev[0]), rowY(prev[1]), colX(c), rowY(r));
      prev = [c, r];
    }
  }

  render(ctx, round) {
    // sky band + tunnels-behind-dirt
    ctx.fillStyle = '#001048';
    ctx.fillRect(0, FIELD_Y, LOGICAL_W, CELL);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, FIELD_Y + CELL, LOGICAL_W, (ROWS - 1) * CELL);
    ctx.drawImage(this.dirt, 0, 0);
    // grass edge + round-count flowers on the surface
    ctx.fillStyle = '#18a018';
    ctx.fillRect(0, FIELD_Y + CELL - 2, LOGICAL_W, 2);
    const n = Math.min(round, 9);
    for (let i = 0; i < n; i++) {
      ctx.drawImage(SPR.flower, LOGICAL_W - 12 - i * 10, FIELD_Y + CELL - 10);
    }
  }
}

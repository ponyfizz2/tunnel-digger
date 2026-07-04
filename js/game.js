// ---------------------------------------------------------------------------
// Game conductor: TITLE / INTRO / PLAY / DYING / CLEAR / GAMEOVER state
// machine, round generation (deterministic per round number), scoring,
// popups, particles and screen shake.
// ---------------------------------------------------------------------------

import {
  LOGICAL_W, LOGICAL_H, CELL, COLS, ROWS, FIELD_Y,
  PLAYER, ENEMY, SCORING, FRUITS, ROCKS_FOR_BONUS,
  roundSpec, colX, rowY, cellOf, stratum, mulberry32,
} from './config.js';
import { SPR, drawText, drawTextC, drawSprite } from './sprites.js';
import { World } from './world.js';
import { Player } from './entities/player.js';
import { Pooka, Fygar } from './entities/enemy.js';
import { Rock } from './entities/rock.js';
import { Fruit } from './entities/fruit.js';
import { Pump } from './entities/pump.js';
import { drawHUD } from './hud.js';

const HS_KEY = 'tunnel-digger-hi';

export class Game {
  constructor(ctx, audio, input, onToggleScan) {
    this.ctx = ctx;
    this.audio = audio;
    this.input = input;
    this.onToggleScan = onToggleScan;

    this.world = new World();
    this.world.onOpen = () => { this.addScore(SCORING.DIG); this.audio.sfxDig(); };

    this.player = new Player(this);
    this.pump = new Pump(this);
    this.enemies = [];
    this.rocks = [];
    this.fruit = null;
    this.popups = [];
    this.particles = [];

    this.state = 'TITLE';
    this.stateT = 0;
    this.time = 0;
    this.shake = 0;
    this.score = 0;
    this.lives = 0;
    this.round = 1;
    this.spec = roundSpec(1);
    this.enemiesKilled = 0;
    this.hiScore = SCORING.DEFAULT_HI;
    try {
      const v = parseInt(localStorage.getItem(HS_KEY), 10);
      if (v > 0) this.hiScore = v;
    } catch (e) { /* storage unavailable */ }
  }

  rockAt(c, r) {
    return this.rocks.some(k => k.blocking && k.c === c && k.r === r);
  }

  // --- round setup ----------------------------------------------------------
  startGame() {
    this.score = 0;
    this.lives = PLAYER.LIVES;
    this.round = 1;
    this.nextExtend = SCORING.EXTEND_FIRST;
    this.startRound(1);
  }

  startRound(round) {
    this.round = round;
    this.spec = roundSpec(round);
    this.enemiesKilled = 0;
    this.rocksFallen = 0;
    this.fruitSpawned = false;
    this.fruit = null;
    this.popups = [];
    this.particles = [];
    this.enemies = [];
    this.rocks = [];
    this.pump.reset();
    this.lastEnemyTimer = ENEMY.FLEE_DELAY;

    const rng = mulberry32(round * 1013904223 + 77);
    this.world.reset();

    // pre-dug spawn tunnel: surface straight down to the player start
    const spawn = [];
    for (let r = 0; r <= PLAYER.SPAWN_R; r++) spawn.push([PLAYER.SPAWN_C, r]);
    this.world.carveCellPath(spawn);
    this.player.respawn();

    // enemy pockets: short pre-dug tunnels away from the spawn shaft
    const total = this.spec.pookas + this.spec.fygars;
    for (let i = 0; i < total; i++) {
      const cells = this.makePocket(rng);
      this.world.carveCellPath(cells);
      const [c, r] = cells[1];
      const dir = cells[0][0] !== cells[1][0] ? (rng() < 0.5 ? 'left' : 'right')
                                              : (rng() < 0.5 ? 'up' : 'down');
      const E = i < this.spec.fygars ? Fygar : Pooka;
      this.enemies.push(new E(this, c, r, dir));
    }

    // rocks: buried in solid dirt with solid dirt beneath
    let placed = 0, guard = 0;
    while (placed < this.spec.rocks && guard++ < 300) {
      const c = Math.floor(rng() * COLS);
      const r = 2 + Math.floor(rng() * (ROWS - 4));
      if (this.world.isOpen(c, r) || this.world.isOpen(c, r + 1)) continue;
      if (this.rocks.some(k => k.c === c && Math.abs(k.r - r) <= 1)) continue;
      if (c === PLAYER.SPAWN_C && r <= PLAYER.SPAWN_R + 1) continue;
      this.rocks.push(new Rock(this, c, r));
      placed++;
    }

    this.setState('INTRO');
    this.audio.sfxStart();
  }

  makePocket(rng) {
    for (let a = 0; a < 80; a++) {
      const horiz = rng() < 0.55;
      const len = 3;
      const r = horiz ? 2 + Math.floor(rng() * (ROWS - 3))
                      : 2 + Math.floor(rng() * (ROWS - 3 - len));
      const c = horiz ? 1 + Math.floor(rng() * (COLS - 2 - len))
                      : 1 + Math.floor(rng() * (COLS - 2));
      const cells = [];
      for (let i = 0; i < len; i++) cells.push(horiz ? [c + i, r] : [c, r + i]);
      const [mc, mr] = cells[1];
      // keep pockets a respectful distance from the player start
      if (Math.abs(mc - PLAYER.SPAWN_C) < 3 && Math.abs(mr - PLAYER.SPAWN_R) < 4) continue;
      if (cells.some(([cc, rr]) => cc === PLAYER.SPAWN_C && rr <= PLAYER.SPAWN_R + 1)) continue;
      return cells;
    }
    return [[1, 12], [2, 12], [3, 12]]; // deterministic fallback
  }

  // --- scoring ---------------------------------------------------------------
  addScore(n) {
    this.score += n;
    if (this.score > this.hiScore) this.hiScore = this.score;
    while (this.score >= this.nextExtend) {
      this.lives++;
      this.audio.sfxExtend();
      this.popup(this.player.x, this.player.y - 10, '1UP!');
      this.nextExtend += SCORING.EXTEND_EVERY;
    }
  }

  popup(x, y, text) {
    this.popups.push({ x, y, text: String(text), t: 0 });
  }

  burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 40;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, color });
    }
  }

  popEnemy(e) {
    const [, r] = cellOf(e.x, e.y);
    const s = stratum(r);
    let pts;
    if (e.type === 'fygar') {
      pts = Math.abs(e.y - this.player.y) < 8 ? SCORING.FYGAR_H[s] : SCORING.FYGAR_V[s];
    } else {
      pts = SCORING.POOKA[s];
    }
    e.state = 'pop';
    e.popT = 0;
    this.enemiesKilled++;
    this.addScore(pts);
    this.popup(e.x, e.y, pts);
    this.audio.sfxPop();
    this.burst(e.x, e.y, e.type === 'fygar' ? '#28c040' : '#f83800');
  }

  removeEnemy(e, escaped = false) {
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    if (!escaped && e.state === 'crushed') this.enemiesKilled++;
  }

  onRockLanded(rock) {
    this.rocksFallen++;
    this.shake = 0.25;
    this.audio.sfxCrush();
    if (rock.crushCount > 0) {
      const bonus = SCORING.ROCK_CRUSH[Math.min(rock.crushCount - 1, SCORING.ROCK_CRUSH.length - 1)];
      this.addScore(bonus);
      this.popup(rock.x, rock.y - 8, bonus);
    }
  }

  killPlayer() {
    if (this.state !== 'PLAY' || this.player.dead) return;
    this.player.die();
    this.pump.reset();
    this.audio.setWalking(false);
    this.audio.sfxDeath();
    this.setState('DYING');
  }

  setState(s) { this.state = s; this.stateT = 0; }

  // --- update ----------------------------------------------------------------
  update(dt) {
    this.time += dt;
    this.stateT += dt;
    this.input.preUpdate();

    if (this.input.pressed('mute')) this.audio.toggleMute();
    if (this.input.pressed('scan')) this.onToggleScan();

    switch (this.state) {
      case 'TITLE':
        if (this.input.pressed('start')) this.startGame();
        break;

      case 'INTRO':
        if (this.stateT > 1.8) this.setState('PLAY');
        break;

      case 'PLAY':
        if (this.input.pressed('pause')) { this.audio.setWalking(false); this.setState('PAUSE'); break; }
        this.updatePlay(dt);
        break;

      case 'PAUSE':
        if (this.input.pressed('pause')) this.setState('PLAY');
        break;

      case 'DYING':
        this.player.update(dt);
        this.rocks.forEach(k => { if (k.state === 'fall' || k.state === 'shatter') k.update(dt); });
        this.rocks = this.rocks.filter(k => !k.dead);
        if (this.player.deathDone) {
          this.lives--;
          if (this.lives > 0) {
            this.player.respawn();
            this.enemies.forEach(e => e.resetToSpawn());
            this.pump.reset();
            this.lastEnemyTimer = ENEMY.FLEE_DELAY;
            this.setState('INTRO');
          } else {
            try { localStorage.setItem(HS_KEY, String(this.hiScore)); } catch (e) {}
            this.setState('GAMEOVER');
          }
        }
        break;

      case 'CLEAR':
        if (this.stateT > 2.2) this.startRound(this.round + 1);
        break;

      case 'GAMEOVER':
        if (this.stateT > 4 || this.input.pressed('start')) this.setState('TITLE');
        break;
    }

    // popups / particles / shake run in all states
    this.popups.forEach(p => { p.t += dt; p.y -= 12 * dt; });
    this.popups = this.popups.filter(p => p.t < 1);
    this.particles.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; });
    this.particles = this.particles.filter(p => p.t < 0.4);
    this.shake = Math.max(0, this.shake - dt);

    this.audio.update();
    this.input.postUpdate();
  }

  updatePlay(dt) {
    if (this.input.pressed('fire') && !this.pump.busy) this.pump.fire();

    this.player.update(dt);
    this.pump.update(dt);
    this.enemies.forEach(e => e.update(dt));
    this.rocks.forEach(k => k.update(dt));
    this.rocks = this.rocks.filter(k => !k.dead);
    if (this.fruit) {
      this.fruit.update(dt);
      if (this.fruit.dead) this.fruit = null;
    }

    // contact kills
    for (const e of this.enemies) {
      if (e.deadly && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 10) {
        this.killPlayer();
        return;
      }
    }

    // the last survivor gives up and flees to the surface
    const alive = this.enemies.filter(e => e.state !== 'pop' && e.state !== 'crushed');
    if (alive.length === 1 && !alive[0].fleeing) {
      this.lastEnemyTimer -= dt;
      if (this.lastEnemyTimer <= 0) alive[0].fleeing = true;
    } else if (alive.length > 1) {
      this.lastEnemyTimer = ENEMY.FLEE_DELAY;
    }

    // bonus item
    if (!this.fruitSpawned && this.rocksFallen >= ROCKS_FOR_BONUS) {
      this.fruitSpawned = true;
      const tier = Math.min(this.round - 1, FRUITS.length - 1);
      this.fruit = new Fruit(this, colX(PLAYER.SPAWN_C), rowY(PLAYER.SPAWN_R), tier);
      this.audio.sfxFruit();
    }

    // round clear
    if (this.enemies.length === 0) {
      this.audio.setWalking(false);
      this.audio.sfxClear();
      this.setState('CLEAR');
    }
  }

  // --- render ----------------------------------------------------------------
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    if (this.state === 'TITLE') { this.renderTitle(ctx); return; }

    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    }
    this.world.render(ctx, this.round);
    if (this.fruit) this.fruit.render(ctx);
    this.rocks.forEach(k => k.render(ctx));
    this.pump.render(ctx);
    this.enemies.forEach(e => e.render(ctx));
    this.player.render(ctx);
    for (const p of this.particles) {
      ctx.globalAlpha = 1 - p.t / 0.4;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
    for (const p of this.popups) {
      drawTextC(ctx, p.text, p.x, p.y - 8, '#fff');
    }
    ctx.restore();

    drawHUD(ctx, this);

    if (this.state === 'INTRO') {
      this.centerBanner(ctx, 'ROUND ' + this.round, '#ffd800');
    } else if (this.state === 'PAUSE') {
      this.centerBanner(ctx, 'PAUSED', '#fff');
    } else if (this.state === 'GAMEOVER') {
      this.centerBanner(ctx, 'GAME OVER', '#f83800');
    } else if (this.state === 'CLEAR' && this.stateT > 0.5) {
      this.centerBanner(ctx, 'ROUND CLEAR!', '#28c040');
    }
  }

  centerBanner(ctx, text, color) {
    const w = text.length * 4 * 2 + 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(LOGICAL_W / 2 - w / 2, 130, w, 18);
    drawTextC(ctx, text, LOGICAL_W / 2, 134, color, 2);
  }

  renderTitle(ctx) {
    drawTextC(ctx, 'TUNNEL', LOGICAL_W / 2, 34, '#ffd800', 3);
    drawTextC(ctx, 'DIGGER', LOGICAL_W / 2, 54, '#ffd800', 3);
    drawTextC(ctx, 'AN ORIGINAL ARCADE HOMAGE', LOGICAL_W / 2, 78, '#787890');

    drawTextC(ctx, 'HI-SCORE  ' + this.hiScore, LOGICAL_W / 2, 94, '#f83800');

    // character roster
    const rows = [
      [SPR.pooka[0], 'POOKA', '200-500 PTS'],
      [SPR.fygar[0], 'FYGAR', '200-1000 PTS'],
      [SPR.rock,     'ROCK',  'CRUSH BONUS'],
    ];
    rows.forEach(([img, name, pts], i) => {
      const y = 112 + i * 22;
      drawSprite(ctx, img, 52, y + 7);
      drawText(ctx, name, 68, y + 2, '#fff');
      drawText(ctx, pts, 116, y + 2, '#787890');
    });

    // marching demo
    const mx = LOGICAL_W / 2 + Math.sin(this.time * 0.9) * 70;
    const flip = Math.cos(this.time * 0.9) < 0;
    drawSprite(ctx, SPR.pooka[Math.floor(this.time * 7) % 2], mx, 192, { flipH: flip });
    drawSprite(ctx, SPR.fygar[Math.floor(this.time * 7) % 2], mx - 24, 192, { flipH: flip });

    if (Math.floor(this.time * 1.6) % 2 === 0) {
      drawTextC(ctx, 'PUSH ENTER KEY', LOGICAL_W / 2, 216, '#fff', 1);
    }
    drawTextC(ctx, 'ARROWS: MOVE   SPACE: PUMP', LOGICAL_W / 2, 244, '#787890');
    drawTextC(ctx, 'ORIGINAL ASSETS - A FAN HOMAGE', LOGICAL_W / 2, 262, '#444');
    drawTextC(ctx, 'NOT AFFILIATED WITH NAMCO', LOGICAL_W / 2, 270, '#444');
  }
}

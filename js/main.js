// Boot: fixed-timestep 60Hz update loop with decoupled render, plus
// integer-scaled letterboxed presentation.

import { LOGICAL_W, LOGICAL_H } from './config.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const scanDiv = document.getElementById('scan');
const audio = new AudioSys();
const input = new Input(audio);
const game = new Game(ctx, audio, input, () => scanDiv.classList.toggle('on'));
window.game = game; // console access for debugging

function resize() {
  const touchUI = matchMedia('(pointer: coarse), (max-width: 700px)').matches;
  const reserved = touchUI ? 142 : 30;
  const scale = Math.max(1, Math.floor(Math.min(
    window.innerWidth / LOGICAL_W,
    (window.innerHeight - reserved) / LOGICAL_H,
  )));
  canvas.style.width = LOGICAL_W * scale + 'px';
  canvas.style.height = LOGICAL_H * scale + 'px';
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'PLAY') {
    audio.setWalking(false);
    game.setState('PAUSE');
  }
});
resize();

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  let n = 0;
  while (acc >= STEP && n++ < 5) {
    game.update(STEP);
    acc -= STEP;
  }
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

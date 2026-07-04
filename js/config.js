// ---------------------------------------------------------------------------
// All gameplay tuning lives here. Change numbers, not code, to rebalance.
// ---------------------------------------------------------------------------

export const LOGICAL_W = 224;
export const LOGICAL_H = 288;
export const CELL = 16;
export const COLS = 14;
export const ROWS = 16;      // row 0 = surface lane (sky). rows 1..15 = dirt.
export const FIELD_Y = 24;   // playfield starts below the score HUD

export const PLAYER = {
  SPEED: 0.72,          // px per 1/60s tick
  DIG_FACTOR: 0.6,      // speed multiplier while carving fresh dirt
  SPAWN_C: 6,
  SPAWN_R: 7,
  DEATH_TIME: 1.5,      // seconds of death animation
  LIVES: 3,
};

export const PUMP = {
  SPEED: 3.4,           // harpoon extension px/tick
  RETRACT: 7,
  RANGE: 42,            // max harpoon length (~2.6 cells)
  INTERVAL: 0.28,       // seconds per inflation stage while fire is held
  DEFLATE: 0.6,         // seconds per stage lost after release
  STAGES: 4,            // pumps needed to pop
};

export const ENEMY = {
  SPEED: 0.5,
  GHOST_SPEED: 0.36,
  GHOST_MIN: 5,         // seconds until an enemy may go ghost
  GHOST_MAX: 11,
  GHOST_MIN_TIME: 1.0,  // minimum seconds spent as eyes
  STUCK_FACTOR: 3,      // ghost timer runs this much faster in a dead end
  FLEE_DELAY: 4,        // last survivor flees after this many seconds
  AGGRO_PER_KILL: 0.07, // speed bonus per enemy killed this round
};

export const FYGAR = {
  FIRE_COOLDOWN_MIN: 3.0,
  FIRE_COOLDOWN_MAX: 6.5,
  WINDUP: 0.7,          // telegraphed flash before breathing
  FLAME_GROW: 0.35,
  FLAME_HOLD: 0.55,
  FLAME_CELLS: 3,
  RANGE_CELLS: 4,       // considers firing when player this close on same row
};

export const ROCK = {
  WOBBLE: 0.9,          // seconds of wobble before dropping
  FALL_SPEED: 2.6,      // px/tick
  SHATTER: 0.5,
};

export const SCORING = {
  DIG: 10,                                      // per freshly dug cell
  POOKA:   [200, 300, 400, 500],                // by depth stratum 0..3
  FYGAR_V: [200, 300, 400, 500],
  FYGAR_H: [400, 600, 800, 1000],               // popped on the player's row
  ROCK_CRUSH: [1000, 2500, 4000, 6000, 8000, 10000, 12000, 15000],
  EXTEND_FIRST: 10000,
  EXTEND_EVERY: 40000,
  DEFAULT_HI: 10000,
};

export const FRUITS = [
  { name: 'CARROT',    value: 400  },
  { name: 'TURNIP',    value: 600  },
  { name: 'MUSHROOM',  value: 800  },
  { name: 'CUCUMBER',  value: 1000 },
  { name: 'EGGPLANT',  value: 1500 },
  { name: 'PEPPER',    value: 2000 },
  { name: 'TOMATO',    value: 4000 },
  { name: 'PINEAPPLE', value: 8000 },
];
export const ROCKS_FOR_BONUS = 2;  // dropped rocks before the bonus item appears
export const FRUIT_TIME = 10;      // seconds the bonus item stays

// Difficulty curve per round.
export function roundSpec(round) {
  const r = round - 1;
  return {
    pookas: Math.min(5, 2 + Math.ceil(r / 2)),
    fygars: Math.min(3, 1 + Math.floor(r / 3)),
    rocks:  Math.min(6, 4 + Math.floor(r / 2)),
    speedScale: 1 + Math.min(0.55, r * 0.06),
    fireEagerness: Math.min(0.6, r * 0.06),
  };
}

// --- small shared helpers ---------------------------------------------------
export function rowY(r) { return FIELD_Y + r * CELL + CELL / 2; }
export function colX(c) { return c * CELL + CELL / 2; }
export function cellOf(x, y) {
  return [
    Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL))),
    Math.max(0, Math.min(ROWS - 1, Math.floor((y - FIELD_Y) / CELL))),
  ];
}
// depth stratum 0..3 used for scoring and dirt colors (rows 1-4, 5-8, 9-12, 13-15)
export function stratum(r) { return Math.max(0, Math.min(3, Math.floor((r - 1) / 4))); }
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
// deterministic per-round RNG so every round N always has the same layout
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

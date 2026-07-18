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
  SPEED: 0.82,          // px per 1/60s tick
  DIG_FACTOR: 0.72,     // speed multiplier while carving fresh dirt
  TURN_GRACE: 5,        // px from a lane centre where a queued turn may snap
  SPAWN_C: 6,
  SPAWN_R: 7,
  DEATH_TIME: 1.5,      // seconds of death animation
  LIVES: 3,
};

export const PUMP = {
  SPEED: 4.2,           // harpoon extension px/tick
  RETRACT: 8,
  RANGE: 48,            // three cells, close to the arcade reach
  LATCH_TIME: 0.72,     // time to tap the next pump before the hose retracts
  HOLD_DELAY: 0.38,     // accessibility: holding starts a slower auto-pump
  HOLD_INTERVAL: 0.34,
  DEFLATE: 0.8,         // seconds per stage lost after the hose disconnects
  STAGES: 4,            // pumps needed to pop
};

export const ENEMY = {
  SPEED: 0.48,
  GHOST_SPEED: 0.39,
  GHOST_MIN: 5,         // seconds until an enemy may go ghost
  GHOST_MAX: 11,
  GHOST_MIN_TIME: 1.0,  // minimum seconds spent as eyes
  STUCK_FACTOR: 3,      // ghost timer runs this much faster in a dead end
  FLEE_DELAY: 0.9,      // brief warning before the last survivor flees
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
  { name: 'CARROT',     value: 400,  firstRound: 1  },
  { name: 'TURNIP',     value: 600,  firstRound: 2  },
  { name: 'MUSHROOM',   value: 800,  firstRound: 3  },
  { name: 'CUCUMBER',   value: 1000, firstRound: 4  },
  { name: 'EGGPLANT',   value: 2000, firstRound: 6  },
  { name: 'PEPPER',     value: 3000, firstRound: 8  },
  { name: 'TOMATO',     value: 4000, firstRound: 10 },
  { name: 'GARLIC',     value: 5000, firstRound: 12 },
  { name: 'WATERMELON', value: 6000, firstRound: 14 },
  { name: 'GALAXIAN',   value: 7000, firstRound: 16 },
  { name: 'PINEAPPLE',  value: 8000, firstRound: 18 },
];
export const ROCKS_FOR_BONUS = 2;  // dropped rocks before the bonus item appears
export const FRUIT_TIME = 10;      // seconds the bonus item stays

export function fruitTier(round) {
  let tier = 0;
  for (let i = 1; i < FRUITS.length; i++) {
    if (round < FRUITS[i].firstRound) break;
    tier = i;
  }
  return tier;
}

// Difficulty curve per round.
export function roundSpec(round) {
  const r = round - 1;
  const early = [
    [3, 1, 3], // the arcade opening round
    [3, 2, 3],
    [4, 2, 3],
    [4, 3, 4],
    [5, 3, 4],
  ][Math.min(r, 4)];
  return {
    pookas: early[0],
    fygars: early[1],
    rocks: early[2],
    speedScale: 1 + Math.min(0.62, r * 0.055),
    fireEagerness: Math.min(0.7, r * 0.055),
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

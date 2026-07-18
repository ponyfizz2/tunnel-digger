# Tunnel Digger

A mechanically faithful, from-scratch homage to the 1982 arcade classic
*Dig Dug* — tuned around the same risk/reward rhythm and built entirely with
**original assets**. Pure HTML5 Canvas + vanilla ES modules, no frameworks,
no build step.

> **Legal note:** This is a fan homage. All pixel art, sound effects and
> music are original creations generated in code — nothing is copied from
> Namco's ROMs, sprite sheets or compositions. Not affiliated with or
> endorsed by Bandai Namco. "Dig Dug" is their trademark and is not used
> in the game itself.

## Play

Open `index.html` via any static server:

```bash
npx serve .        # or: python3 -m http.server 8000
```

Then visit the printed URL. (ES modules require http://, not file://.)

## Controls

| Action | Keys |
|---|---|
| Move / dig | Arrow keys or WASD |
| Fire / pump repeatedly | Space or Z |
| Start | Enter |
| Pause | P |
| Mute | M |
| CRT scanlines toggle | C |
| Gamepad | d-pad/stick, A = pump, Start = start |
| Touch | on-screen d-pad, Pump, Start and Pause |

## Gameplay

- Carve tunnels through four strata of dirt; enemies chase you through them.
- **Pooka** (red, goggles) and **Fygar** (green dragon) periodically turn into
  ghostly eyes and drift straight through dirt toward you.
- Fygar telegraphs, then breathes horizontal fire — deadly along your row.
- Harpoon an enemy and tap pump repeatedly to inflate it through 4 stages.
  Holding also auto-pumps after a delay for accessibility. Move or wait too
  long between pumps and the hose retracts; the enemy then deflates.
- Dig under a rock: it wobbles, can be braced while you remain beneath it,
  then drops when you turn away and crushes anything in its path.
- After 2 dropped rocks a bonus vegetable appears at the spawn tunnel.
- The last enemy gives up and flees to the surface, escaping top-left.

## Scoring

| Event | Points |
|---|---|
| Dug cell | 10 |
| Pooka popped (by depth stratum) | 200 / 300 / 400 / 500 |
| Fygar popped vertically | 200 / 300 / 400 / 500 |
| Fygar popped on your row | 400 / 600 / 800 / 1000 |
| Rock crush ×1..8 enemies | 1000 / 2500 / 4000 / 6000 / 8000 / 10000 / 12000 / 15000 |
| Bonus items (rounds 1→18+) | 400 / 600 / 800 / 1000 / 2000 / 3000 / 4000 / 5000 / 6000 / 7000 / 8000 |
| Extra life | 10,000, then every 40,000 |

High score persists in `localStorage`.

## Difficulty curve

Round 1 opens with the arcade-style 3 Pookas, 1 Fygar and 3 rocks. Later
rounds build to eight monsters, increase movement speed (capped at +62%),
and make Fygar breathe fire more eagerly. Enemies also accelerate as their
pack thins. The last survivor gets a short warning, then sprints for the
surface while the movement music speeds up. Layouts are deterministic and
the earth palette changes every four rounds.

## Playability upgrades

- Buffered four-way turns make intersections responsive on keyboard,
  controller and touch.
- Enemies route through the real tunnel graph instead of getting fooled by
  walls, while retaining small arcade-style feints.
- Pump collision checks the full hose segment and repeated taps stay latched.
- The opening descent, last-monster panic, braced rocks and all eleven bonus
  tiers restore important parts of the original game's cadence.
- Losing browser focus pauses the game automatically.

## Code map

```
js/config.js      every tunable constant + scoring tables
js/sprites.js     original pixel art generated from string grids + 3x5 font
js/audio.js       Web Audio SFX + movement-gated walking melody
js/input.js       keyboard + gamepad
js/world.js       open-cell grid + carved dirt mask + lane movement helper
js/entities/      player, pump, enemy (Pooka/Fygar), rock, fruit
js/game.js        state machine, round generation, scoring
js/main.js        fixed 60Hz timestep, integer-scaled letterboxing
```

## Verification

Run `npm test` for the round, score and bonus-progression checks. The high
score table intentionally stores one local score, and the title screen uses
an animated character parade rather than replaying original attract-mode data.

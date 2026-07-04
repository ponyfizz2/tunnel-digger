# Tunnel Digger

A faithful, from-scratch homage to the 1982 arcade classic *Dig Dug* —
same mechanics, pacing and audiovisual rhythm, built entirely with
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
| Pump (hold to inflate) | Space or Z |
| Start | Enter |
| Pause | P |
| Mute | M |
| CRT scanlines toggle | C |
| Gamepad | d-pad/stick, A = pump, Start = start |

## Gameplay

- Carve tunnels through four strata of dirt; enemies chase you through them.
- **Pooka** (red, goggles) and **Fygar** (green dragon) periodically turn into
  ghostly eyes and drift straight through dirt toward you.
- Fygar telegraphs, then breathes horizontal fire — deadly along your row.
- Harpoon an enemy and hold fire to inflate it in 4 stages until it pops.
  Release and it deflates and resumes the chase.
- Dig under a rock: it wobbles, drops, and crushes anything beneath.
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
| Bonus items (rounds 1→8+) | 400 / 600 / 800 / 1000 / 1500 / 2000 / 4000 / 8000 |
| Extra life | 10,000, then every 40,000 |

High score persists in `localStorage`.

## Difficulty curve

Per round: more Pookas (2→5) and Fygars (1→3), more rocks (4→6),
+6% speed per round (capped +55%), and Fygar breathes fire more eagerly.
Enemies also speed up as their pack thins within a round. Round layouts are
deterministic per round number.

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

## Known issues / TODO

- No touch controls yet (keyboard/gamepad only).
- High-score table stores a single score, no initials entry.
- No attract-mode AI demo (title shows an animated character parade instead).

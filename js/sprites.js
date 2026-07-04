// ---------------------------------------------------------------------------
// All art is original pixel art generated at load time from string grids.
// Palette (per sprite, ~4 colors each, saturated arcade tones):
//   W white  K black  B blue  F flesh  R red  Y yellow  G green  D dark green
//   O orange P purple S stone T stone-dark N brown E off-white L light green
// ---------------------------------------------------------------------------

const PAL = {
  '.': null,
  'W': '#f0f0f0', 'K': '#101010', 'B': '#2858f8', 'F': '#ffc890',
  'R': '#f83800', 'Y': '#ffd800', 'G': '#28c040', 'D': '#0f7a1f',
  'O': '#ff8800', 'P': '#a828d8', 'S': '#d0a060', 'T': '#8a5a24',
  'N': '#a05018', 'E': '#f8f8f8', 'L': '#90f0a0', 'C': '#f87858',
};

function sprite(rows, extra) {
  const pal = extra ? Object.assign({}, PAL, extra) : PAL;
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
  });
  return c;
}

// --- the digger (right-facing; other directions are flips/rotations, like the arcade)
const playerR1 = sprite([
  '................',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....WWWWWWWW....',
  '....WBBBBBBW....',
  '....WFFFFFFW....',
  '....WFFKFFKW....',
  '....WFFFFFFW....',
  '.....FFRRFF.....',
  '....WWWWWWWW....',
  '...BWWWWWWWWB...',
  '...BBWWWWWWBB...',
  '....WWWWWWWW....',
  '....BBB..BBB....',
  '....BB....BB....',
  '...KKK....KKK...',
]);
const playerR2 = sprite([
  '................',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....WWWWWWWW....',
  '....WBBBBBBW....',
  '....WFFFFFFW....',
  '....WFFKFFKW....',
  '....WFFFFFFW....',
  '.....FFRRFF.....',
  '....WWWWWWWW....',
  '...BWWWWWWWWB...',
  '...BBWWWWWWBB...',
  '....WWWWWWWW....',
  '.....BBBBBB.....',
  '......BBBB......',
  '.....KKKKKK.....',
]);
const playerPump = sprite([
  '................',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....WWWWWWWW....',
  '....WBBBBBBW....',
  '....WFFFFFFW....',
  '....WFFKFFKW....',
  '....WFFFFFFW....',
  '.....FFRRFF.....',
  '....WWWWWWWW....',
  '...BWWWWWWWWBB..',
  '...BBWWWWWWWBBB.',
  '....WWWWWWWW....',
  '....BBB..BBB....',
  '....BB....BB....',
  '...KKK....KKK...',
]);
const playerDead = sprite([
  '................',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....WWWWWWWW....',
  '....WBBBBBBW....',
  '....WKFFFFKW....',
  '....WFKFFKFW....',
  '....WFFFFFFW....',
  '.....FKRRKF.....',
  '....WWWWWWWW....',
  '..BBWWWWWWWWBB..',
  '..B.WWWWWWWW.B..',
  '....WWWWWWWW....',
  '....BBB..BBB....',
  '...BB......BB...',
  '..KKK......KKK..',
]);

// --- Pooka: round red critter with yellow goggles
const pooka1 = sprite([
  '................',
  '.....RRRRRR.....',
  '...RRRRRRRRRR...',
  '..RRRRRRRRRRRR..',
  '.RRYYYYRRYYYYRR.',
  'RRYWWWWYYWWWWYRR',
  'RRYWWKWYYWKWWYRR',
  '.RRYYYYRRYYYYRR.',
  '.RRRRRRRRRRRRRR.',
  '.RRRRRRRRRRRRRR.',
  '..RRRRRRRRRRRR..',
  '..RRRRRRRRRRRR..',
  '...RRRRRRRRRR...',
  '..WW..WWWW..WW..',
  '..WW........WW..',
  '................',
]);
const pooka2 = sprite([
  '................',
  '.....RRRRRR.....',
  '...RRRRRRRRRR...',
  '..RRRRRRRRRRRR..',
  '.RRYYYYRRYYYYRR.',
  'RRYWWWWYYWWWWYRR',
  'RRYWKWWYYWWKWYRR',
  '.RRYYYYRRYYYYRR.',
  '.RRRRRRRRRRRRRR.',
  '.RRRRRRRRRRRRRR.',
  '..RRRRRRRRRRRR..',
  '..RRRRRRRRRRRR..',
  '...RRRRRRRRRR...',
  '....WWW..WWW....',
  '....WW....WW....',
  '................',
]);
// ghost / eyes-only mode (shared by both enemies)
const eyes = sprite([
  '................',
  '................',
  '................',
  '................',
  '.YYYYY...YYYYY..',
  '.YWWWY...YWWWY..',
  '.YWKWY...YWKWY..',
  '.YWWWY...YWWWY..',
  '.YYYYY...YYYYY..',
  '................',
]);

// --- Fygar: green dragon with a red crest (right-facing)
const fygar1 = sprite([
  '................',
  '.......RR.......',
  '......RRGGGG....',
  '.....GGGGGGG....',
  '....GGGYKGGGG...',
  '....GGGGGGGGGG..',
  '..D.GGWWWWGGKK..',
  '.DDDGWWWWWWGG...',
  '.DDGGWWWWWWGG...',
  '..DGGWWWWWWGG...',
  '...GGGWWWWGGG...',
  '....GGGGGGGG....',
  '.....GG..GG.....',
  '....DDD..DDD....',
  '................',
  '................',
]);
const fygar2 = sprite([
  '................',
  '.......RR.......',
  '......RRGGGG....',
  '.....GGGGGGG....',
  '....GGGYKGGGG...',
  '....GGGGGGGGGG..',
  '....GGWWWWGGKK..',
  '.D.GGWWWWWWGG...',
  '.DDGGWWWWWWGG...',
  '.DDDGWWWWWWGG...',
  '..DGGGWWWWGGG...',
  '....GGGGGGGG....',
  '....GG....GG....',
  '...DDD....DDD...',
  '................',
  '................',
]);

// --- rock
const rock = sprite([
  '................',
  '....TTTTTTTT....',
  '..TTSSSSSSSSTT..',
  '.TSSEESSSSSSST..',
  '.TSSESSSSSTSST..',
  '.TSSSSSSTTSSST..',
  '.TSSSSSSSSSSST..',
  '.TSSTSSSSSSEST..',
  '.TSSSSSSEESSST..',
  '.TSSSSSSSSSSST..',
  '..TSSSSSSSSST...',
  '..TTSSSSSSSTT...',
  '....TTTTTTTT....',
  '................',
], { E: '#f0d8a8' });

// --- bonus vegetables / fruits (8 tiers)
const fruits = [
  sprite([ // carrot
    '....GG....',
    '..G.GG.G..',
    '...GGG....',
    '..OOOO....',
    '..OOOOO...',
    '...OOOO...',
    '...OOO....',
    '....OO....',
    '....O.....',
  ]),
  sprite([ // turnip
    '....GG....',
    '...GGG....',
    '..PPPPPP..',
    '.PPEEEEPP.',
    '.PEEEEEEP.',
    '.PEEEEEEP.',
    '..EEEEEE..',
    '...EEEE...',
    '....EE....',
  ]),
  sprite([ // mushroom
    '...RRRRRR...',
    '..RRERRERR..',
    '.RRRRRRRRRR.',
    '.RERRRRRRER.',
    '....EEEE....',
    '....EEEE....',
    '....EEEE....',
    '...EEEEEE...',
  ]),
  sprite([ // cucumber
    '..........',
    '.DGGGGGGD.',
    'DGGLGGGGGD',
    'DGGGGGLGGD',
    '.DGGGGGGD.',
    '..........',
  ]),
  sprite([ // eggplant
    '....GG....',
    '...GGG....',
    '..PPPP....',
    '.PPPPPP...',
    '.PPPPPPP..',
    '.PPPPPPP..',
    '..PPPPP...',
    '...PPP....',
  ]),
  sprite([ // green pepper
    '....G.....',
    '...GG.....',
    '..DGGD....',
    '.GGGGGG...',
    '.GGGGGG...',
    '.GGGGGG...',
    '.GGDGGG...',
    '..GGGG....',
  ]),
  sprite([ // tomato
    '....GG....',
    '..G.GG.G..',
    '..RRRRRR..',
    '.RRRRRRRR.',
    '.RRRRRRRR.',
    '.RERRRRRR.',
    '..RRRRRR..',
    '...RRRR...',
  ]),
  sprite([ // pineapple
    '..G.G.G...',
    '...GGG....',
    '..YYYYY...',
    '.YNYYYNY..',
    '.YYYNYYY..',
    '.YNYYYNY..',
    '.YYYNYYY..',
    '..YYYYY...',
  ]),
];

// --- surface flower (round indicator, like the arcade's surface flowers)
const flower = sprite([
  '..RR..',
  '.RWWR.',
  '.RWWR.',
  '..RR..',
  '..G...',
  '.GG...',
  '..G...',
  '..G...',
]);

export const SPR = {
  player: [playerR1, playerR2],
  playerPump, playerDead,
  pooka: [pooka1, pooka2],
  fygar: [fygar1, fygar2],
  eyes, rock, fruits, flower,
};

// ---------------------------------------------------------------------------
// tiny 3x5 bitmap font
// ---------------------------------------------------------------------------
const F = {
  'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
  'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
  'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
  'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'], 'J': ['001', '001', '001', '101', '010'],
  'K': ['101', '110', '100', '110', '101'], 'L': ['100', '100', '100', '100', '111'],
  'M': ['101', '111', '101', '101', '101'], 'N': ['110', '101', '101', '101', '101'],
  'O': ['010', '101', '101', '101', '010'], 'P': ['110', '101', '110', '100', '100'],
  'Q': ['010', '101', '101', '110', '011'], 'R': ['110', '101', '110', '110', '101'],
  'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'],
  'W': ['101', '101', '101', '111', '101'], 'X': ['101', '101', '010', '101', '101'],
  'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '011', '001', '111'],
  '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '001', '010', '010'],
  '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
  '-': ['000', '000', '111', '000', '000'], '.': ['000', '000', '000', '000', '010'],
  '!': ['010', '010', '010', '000', '010'], ':': ['000', '010', '000', '010', '000'],
  '/': ['001', '001', '010', '100', '100'], "'": ['010', '010', '000', '000', '000'],
  ' ': ['000', '000', '000', '000', '000'],
};

export function drawText(ctx, str, x, y, color = '#fff', scale = 1) {
  ctx.fillStyle = color;
  str = String(str).toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const gl = F[str[i]] || F[' '];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (gl[r][c] === '1') ctx.fillRect(x + (i * 4 + c) * scale, y + r * scale, scale, scale);
      }
    }
  }
}
export function textW(str, scale = 1) { return String(str).length * 4 * scale; }
export function drawTextC(ctx, str, cx, y, color = '#fff', scale = 1) {
  drawText(ctx, str, Math.round(cx - textW(str, scale) / 2), y, color, scale);
}

// draw a sprite centered at (x,y) with optional flip / rotation / scaling
export function drawSprite(ctx, img, x, y, o = {}) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.flipH ? -1 : 1) * (o.scaleX ?? o.scale ?? 1), o.scaleY ?? o.scale ?? 1);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.restore();
}

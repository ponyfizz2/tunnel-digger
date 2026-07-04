// ---------------------------------------------------------------------------
// Keyboard + (optional) gamepad. Direction = most recently pressed held key.
// ---------------------------------------------------------------------------

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'fire', KeyZ: 'fire',
  Enter: 'start',
  KeyP: 'pause', KeyM: 'mute', KeyC: 'scan',
};
const DIR_NAMES = ['up', 'down', 'left', 'right'];

export class Input {
  constructor(audio) {
    this.held = new Set();
    this.pressedSet = new Set();
    this.heldDirs = [];         // ordered, most recent last
    this.padHeld = new Set();

    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      audio.ensure();
      if (!this.held.has(a)) this.pressedSet.add(a);
      this.held.add(a);
      if (DIR_NAMES.includes(a)) {
        this.heldDirs = this.heldDirs.filter(d => d !== a);
        this.heldDirs.push(a);
      }
    });
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      this.held.delete(a);
      this.heldDirs = this.heldDirs.filter(d => d !== a);
    });
    window.addEventListener('blur', () => { this.held.clear(); this.heldDirs = []; });
  }

  // poll gamepad once per tick, translating to the same virtual actions
  preUpdate() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return;
    const want = new Set();
    if (p.axes[0] < -0.5 || (p.buttons[14] && p.buttons[14].pressed)) want.add('left');
    if (p.axes[0] > 0.5 || (p.buttons[15] && p.buttons[15].pressed)) want.add('right');
    if (p.axes[1] < -0.5 || (p.buttons[12] && p.buttons[12].pressed)) want.add('up');
    if (p.axes[1] > 0.5 || (p.buttons[13] && p.buttons[13].pressed)) want.add('down');
    if ((p.buttons[0] && p.buttons[0].pressed) || (p.buttons[1] && p.buttons[1].pressed)) want.add('fire');
    if (p.buttons[9] && p.buttons[9].pressed) want.add('start');
    for (const a of want) {
      if (!this.padHeld.has(a)) this.pressedSet.add(a);
      if (DIR_NAMES.includes(a) && !this.heldDirs.includes(a)) this.heldDirs.push(a);
    }
    for (const a of this.padHeld) {
      if (!want.has(a) && !this.held.has(a)) this.heldDirs = this.heldDirs.filter(d => d !== a);
    }
    this.padHeld = want;
  }

  postUpdate() { this.pressedSet.clear(); }

  down(a) { return this.held.has(a) || this.padHeld.has(a); }
  pressed(a) { return this.pressedSet.has(a); }
  currentDir() { return this.heldDirs.length ? this.heldDirs[this.heldDirs.length - 1] : null; }
}

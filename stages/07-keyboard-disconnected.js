/* =============================================================================
 *  STAGE 7 — Keyboard disconnected                               STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The real keyboard is blocked everywhere (a "Keyboard disconnected" item
 *    appears in the tray) and the subject is wiped. An on-screen keyboard
 *    window has A-Z in a shuffled order, plus Space and Backspace. Every 5 key
 *    presses, two random letter keys swap places. Click keys to type a new
 *    subject.  Pass: subject has at least 3 characters.
 *    Cleanup: the physical keyboard works again (all listeners are tracked).
 *
 *  ASSETS: keyboard-frame.png, key.png, key-pressed.png, tray-keyboard-off.png
 * ========================================================================== */

(function () {
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  Game.registerStage({
    id: 7,
    name: 'Keyboard disconnected',
    vibe: 'annoyed',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "7"
    assets: ['keyboard-frame.png', 'key.png', 'key-pressed.png', 'tray-keyboard-off.png'],

    setup(G) {
      G.mail.subject = '';

      // --- block the physical keyboard (and paste / IME / drag-text) everywhere ---
      const block = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      G.on(window, 'keydown', block, true);
      G.on(window, 'keypress', block, true);
      G.on(document, 'beforeinput', block, true);
      G.on(document, 'paste', block, true);
      G.on(document, 'drop', block, true);
      G.tray.add('keyboard', 'Keyboard disconnected', null, { icon: 'tray-keyboard-off.png', text: 'Keyboard disconnected' });

      // --- on-screen keyboard ---
      const win = G.openWindow({ title: 'On-Screen Keyboard (Recovered)', x: 250, y: 300, w: 720, h: 250, closable: false });
      const panel = G.make('div', 'kbd-panel');
      G.setSkin(panel, 'keyboard-frame.png');
      const keys = G.make('div', 'kbd-keys');
      panel.appendChild(keys);
      win.body.appendChild(panel);

      let presses = 0;
      const letterKeys = [];
      const type = (fn) => {
        G.mail.subject = fn(G.mail.subject);
        presses++;
        if (presses % 5 === 0) {
          // swap two random letter keys (by flex order)
          const a = letterKeys[Math.floor(Math.random() * letterKeys.length)];
          let b = a;
          while (b === a) b = letterKeys[Math.floor(Math.random() * letterKeys.length)];
          [a.style.order, b.style.order] = [b.style.order, a.style.order];
          G.shake();
        }
      };

      shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).forEach((letter, i) => {
        const key = G.ui.key(letter, () => type((s) => s + letter.toLowerCase()));
        key.style.order = i;
        letterKeys.push(key);
        keys.appendChild(key);
      });
      const space = G.ui.key('Space', () => type((s) => s + ' '));
      space.classList.add('kbd-wide');
      space.style.order = 100;
      const back = G.ui.key('Backspace', () => type((s) => s.slice(0, -1)));
      back.classList.add('kbd-wide');
      back.style.order = 101;
      keys.append(space, back);
    },

    check(G) {
      const n = G.mail.subject.trim().length;
      return n >= 3 || `The subject needs at least 3 characters (it has ${n}). Use the on-screen keyboard.`;
    },
  });
})();

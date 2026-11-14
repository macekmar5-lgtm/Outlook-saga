/* =============================================================================
 *  STAGE 2 — Subject line is in ALL CAPS                         STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    Caps Lock is "stuck": the subject they typed in stage 1 is now SHOUTING
 *    and anything they type comes out uppercase. They must find the CAPS item
 *    in the taskbar tray (bottom right, next to the clock), click it to turn
 *    Caps Lock off, then retype the subject so it has lowercase letters.
 *
 *  ASSETS
 *    tray-caps.png (off), tray-caps-on.png (ON) — 20x20 tray icons,
 *    listed with the OS art at the top of style.css.
 * ========================================================================== */

Game.registerStage({
  id: 2,
  name: 'Caps Lock stuck',
  vibe: 'happy',
  error: 'Subject line is in ALL CAPS. Recipient feels yelled at.',
  clippy: "Whoa, easy there! Your boss thinks you're yelling. Is your Caps Lock stuck? It happens to the best of us!",
  hint: 'Click "CAPS" in the taskbar tray next to the clock to turn Caps Lock off. Then retype the subject.',
  retry: [
    'STILL SHOUTING. Sorry. I mean: still shouting.',
    'Caps Lock lives in the tray. Bottom right. Next to the clock. :)',
  ],
  assets: ['tray-caps.png', 'tray-caps-on.png'],

  setup(G) {
    const subject = G.mail.el.subject;
    G.state.capsLock = true;

    // While Caps Lock is on, everything in the subject is forced to uppercase.
    const forceCaps = () => {
      if (!G.state.capsLock) return;
      const cursor = subject.selectionStart;
      subject.value = subject.value.toUpperCase();
      subject.setSelectionRange(cursor, cursor);
    };
    forceCaps(); // the subject from stage 1 is now SHOUTING
    G.on(subject, 'input', forceCaps);

    // The tray toggle (removed automatically when the stage ends).
    // Shows tray-caps-on.png while ON and tray-caps.png while off.
    const showState = () => {
      G.tray.setIcon('caps', G.state.capsLock ? 'tray-caps-on.png' : 'tray-caps.png');
      G.tray.get('caps').title = 'Caps Lock: ' + (G.state.capsLock ? 'ON' : 'off');
    };
    G.tray.add('caps', 'Caps Lock', () => {
      G.state.capsLock = !G.state.capsLock;
      showState();
      if (!G.state.capsLock) G.clippy.say('Caps Lock is off! Now retype the subject in normal letters.', 'happy');
    });
    showState();
  },

  check(G) {
    if (G.state.capsLock) return 'Caps Lock is still on. YOUR BOSS CAN HEAR YOU.';
    const subject = G.mail.subject.trim();
    if (!subject) return 'The subject is empty now. You need one, remember?';
    if (!/[a-z]/.test(subject)) return 'The subject is still in ALL CAPS. Retype it with normal letters.';
    return true;
  },

  cleanup(G) {
    G.state.capsLock = false;
  },
});

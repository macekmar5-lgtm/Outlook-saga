/* =============================================================================
 *  STAGE 7 — Keyboard disconnected                               STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The real keyboard stops working (every key press is blocked) and the
 *    subject is wiped. An on-screen keyboard window opens, but its keys are in
 *    a weird order (alphabetical? random? reshuffled after every press?). The
 *    player clicks letters to retype a subject. Pass when the subject has at
 *    least 3 letters.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.mail.subject = ''
 *      - Block the real keyboard:
 *          G.on(window, 'keydown', e => { e.preventDefault(); e.stopPropagation(); }, true)
 *          (capture phase, so it beats everything else). Also block 'beforeinput'/'paste'
 *          on the subject so nothing sneaks in.
 *      - const kb = G.openWindow({ title: 'On-Screen Keyboard (Recovered)', x: 260, y: 400, w: 700, h: 220 })
 *        Build the keys with G.ui.key('Q', onClick) (art: key.png / key-pressed.png)
 *        for A-Z, Space and Backspace, in a shuffled order. On click: G.mail.subject += letter.
 *        Layout the keys with CSS flex-wrap/grid in your own stage CSS (layout only!).
 *      - Tray: G.tray.get('...') could show "No keyboard" — optional.
 *    check:   (G.mail.subject.match(/[a-z]/gi) || []).length >= 3 ||
 *             'Subject is empty. Use the on-screen keyboard.'
 *    cleanup: listeners + window auto-removed (keyboard works again).
 *
 *  JUICE IDEAS
 *    - Reshuffle keys after every click. Space bar is tiny; the Q key is huge.
 *    - Typing on the real keyboard makes Clippy say "I can hear you typing. It's not working."
 *
 *  ASSETS: key.png, key-pressed.png (shared UI kit art, listed in style.css)
 * ========================================================================== */

Game.registerStage({
  id: 7,
  name: 'Keyboard disconnected',
  vibe: 'annoyed',
  error: 'Keyboard disconnected. Subject line lost.',
  clippy: 'Your keyboard has left the building. Good news: I made you a new one! I sorted the keys myself.',
  hint: 'Your real keyboard is dead. Click the letters on the on-screen keyboard to type a new subject.',
  assets: ['key.png', 'key-pressed.png'],

  setup(G) {
    G.mail.subject = '';
    let kb;
    const block = e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (kb) G.bringToFront(kb.el);
    };
    G.on(window, 'keydown', block, true);
    G.on(G.mail.el.subject, 'beforeinput', block);
    G.on(G.mail.el.subject, 'paste', block);
    G.on(G.mail.el.subject, 'drop', block);
    const wasReadOnly = G.mail.el.subject.readOnly;
    G.mail.el.subject.readOnly = true;
    G.track(() => { G.mail.el.subject.readOnly = wasReadOnly; });
    kb = G.openWindow({ title: 'On-Screen Keyboard (Recovered)',
      x: 260, y: 400, w: 700, h: 250, closable: false });
    G.addIcon({ id: 'keyboard', label: 'On-screen keyboard', asset: 'key.png',
      x: 1060, y: 40, onClick: () => G.bringToFront(kb.el) });
    const preview = G.make('div', '', 'Subject: (type at least 3 letters)');
    preview.style.marginBottom = '8px';
    const keys = G.make('div');
    Object.assign(keys.style, { display: 'flex', flexWrap: 'wrap', gap: '4px' });
    const update = () => { preview.textContent = 'Subject: ' + (G.mail.subject || '(empty)'); };
    // Alphabetical, backwards. Clippy considers this an ergonomic breakthrough.
    'ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('').forEach(letter => {
      keys.append(G.ui.key(letter, () => { G.mail.subject += letter.toLowerCase(); update(); }));
    });
    keys.append(G.ui.key('Space', () => { G.mail.subject += ' '; update(); }),
      G.ui.key('Backspace', () => { G.mail.subject = G.mail.subject.slice(0, -1); update(); }));
    kb.body.append(preview, keys);
  },

  check(G) {
    return (G.mail.subject.match(/[a-z]/gi) || []).length >= 3 || 'Use the on-screen keyboard to enter at least three letters.';
  },
});

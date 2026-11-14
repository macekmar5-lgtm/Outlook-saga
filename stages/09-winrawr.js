/* =============================================================================
 *  STAGE 9 — WinRAWR license exceeded                            STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A WinRAWR nag window pops up over the Send button: "Your 40-day trial
 *    expired 3,652 days ago. Please buy WinRAWR." It has two buttons:
 *      - "Buy now (€49.99)" — runs away from the mouse cursor, can't be clicked
 *      - "Continue trial"   — small and grey, the real way out
 *    The window can't be closed with X. Pass after clicking "Continue trial".
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.winrawrDismissed = false
 *      - const win = G.openWindow({ title: 'WinRAWR - Trial Expired', closable: false,
 *                                   x: 230, y: 40, w: 440, h: 300 })   // covers the Send button
 *        content: G.asset('winrawr-logo.png', { w: 120, h: 120 }), nag text, and two
 *        G.ui.button()s (optionally custom art: { skin: 'winrawr-buy.png' })
 *      - Runaway Buy button: position: absolute inside win.body;
 *        G.on(win.body, 'pointermove', e => { const p = G.toGame(e); if close to the
 *        button (use G.rectOf(btn)) -> move it to a random spot inside win.body })
 *      - "Continue trial": G.state.winrawrDismissed = true; win.close()
 *        maybe Clippy: "Continuing trial. Like every human who ever lived."
 *    check:   G.state.winrawrDismissed || 'WinRAWR is still nagging you.'
 *    cleanup: delete G.state.winrawrDismissed
 *
 *  JUICE IDEAS
 *    - Every 10 s the nag window re-opens until dismissed ("Did you mean: Buy?").
 *    - If the player somehow clicks Buy: "Payment declined. Your card is also late."
 *
 *  ASSETS: winrawr-logo.png
 * ========================================================================== */

Game.registerStage({
  id: 9,
  name: 'WinRAWR',
  vibe: 'annoyed',
  error: 'WinRAWR license exceeded. Zipped attachments cannot be sent.',
  clippy: 'Ah, WinRAWR. Everyone has a free trial. Nobody has ever bought it. Nobody. Ever.',
  hint: 'Don\'t chase the Buy button. Click the small "Continue trial" button in the WinRAWR window.',
  assets: ['winrawr-logo.png'],

  setup(G) {
    G.state.winrawrDismissed = false;
    const win = G.openWindow({ title: 'WinRAWR - Trial Expired', closable: false,
      x: 230, y: 40, w: 440, h: 340 });
    const logo = G.asset('winrawr-logo.png', { w: 110, h: 90 });
    const text = G.make('p', '', 'Your 40-day trial expired 3,652 days ago. Please buy WinRAWR.');
    const buy = G.ui.button('Buy now (EUR 49.99)', () => {
      G.clippy.say('Payment declined. Your card is also late.', 'annoyed');
    });
    Object.assign(buy.style, { position: 'absolute', left: '20px', top: '170px', width: '180px' });
    const trial = G.ui.button('Continue trial', () => {
      G.state.winrawrDismissed = true;
      win.close();
      G.clippy.say('Continuing trial. Like every human who ever lived. Send it again.', 'annoyed');
    });
    Object.assign(trial.style, { position: 'absolute', left: '20px', bottom: '12px', fontSize: '11px' });
    win.body.append(logo, text, buy, trial);
    let right = false;
    G.on(win.body, 'pointermove', e => {
      const p = G.toGame(e);
      const r = G.rectOf(buy);
      if (p.x < r.x - 18 || p.x > r.x + r.w + 18 || p.y < r.y - 18 || p.y > r.y + r.h + 18) return;
      right = !right;
      buy.style.left = right ? '220px' : '20px';
      buy.style.top = right ? '210px' : '170px';
    });
  },

  check(G) {
    return G.state.winrawrDismissed || 'WinRAWR is still nagging you. Continue the trial.';
  },

  cleanup(G) {
    delete G.state.winrawrDismissed;
  },
});

/* =============================================================================
 *  STAGE 9 — WinRAWR license exceeded                            STATUS: TODO
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
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'annoyed',
  error: 'WinRAWR license exceeded. Zipped attachments cannot be sent.',
  clippy: 'Ah, WinRAWR. Everyone has a free trial. Nobody has ever bought it. Nobody. Ever.',
  hint: 'Don\'t chase the Buy button. Click the small "Continue trial" button in the WinRAWR window.',
  assets: ['winrawr-logo.png'],

  setup(G) {
    // TODO: see IMPLEMENTATION PLAN above
  },

  check(G) {
    // TODO
    return true;
  },

  cleanup(G) {
    // TODO
  },
});

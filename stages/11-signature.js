/* =============================================================================
 *  STAGE 11 — Signature required                                 STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A "Digital Signature Pad" window opens with a white drawing canvas. The
 *    player draws a signature with the mouse (anything works) and presses
 *    "Sign". The server then comments on it in a popup, e.g. "Signature looks
 *    nervous." / "Is that a horse?" / "Accepted. Barely." Pass once signed.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.signed = false
 *      - const win = G.openWindow({ title: 'Digital Signature Pad', w: 520, h: 330 })
 *        add a <canvas width="480" height="200"> on top of G.asset('signature-pad.png', { w: 480, h: 200 })
 *        (the pad art is the background — no CSS colours), plus G.ui.button('Clear') + G.ui.button('Sign')
 *      - Drawing: pointerdown/move/up on the canvas. The canvas is scaled with the
 *        game, so convert: const p = G.toGame(e); const r = G.rectOf(canvas);
 *        x = p.x - r.x, y = p.y - r.y. Draw lines with ctx.lineTo (the PLAYER is
 *        drawing here — that's fine, it's not generated art).
 *      - Count points drawn. "Sign" with < 20 points: "That's a dot. Sign properly."
 *      - Otherwise: G.state.signed = true; G.popup({ title: 'Signature Server',
 *        icon: 'info', text: random comment }); win.close()
 *      - Optional: G.attachments.add('signature.png', '2 KB', 'file-photo.png')
 *    check:   G.state.signed || 'The email is not signed.'
 *    cleanup: delete G.state.signed
 *
 *  JUICE IDEAS
 *    - Comment depends on the drawing: very long = "Signature is a novel",
 *      very fast = "Signature looks nervous".
 *
 *  ASSETS: signature-pad.png (480x200). The strokes on the canvas are the
 *          PLAYER's drawing, which is allowed.
 * ========================================================================== */

Game.registerStage({
  id: 11,
  name: 'Signature',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'angry',
  error: 'Signature required. Unsigned emails could be from anyone. Even you.',
  clippy: "The server wants a signature. Draw something. Anything. I'm not judging. (I am judging.)",
  hint: 'Draw anything on the Signature Pad with the mouse, then press "Sign".',
  assets: ['signature-pad.png'],

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

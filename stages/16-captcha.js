/* =============================================================================
 *  STAGE 16 — Confirm you are human (captcha)                    STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A captcha window: "Select all images with your BOSS in them." 3x3 grid of
 *    images. Every single image is the boss (boss-1.png ... boss-9.png). The
 *    player must select all 9 and press Verify. Selecting fewer fails with
 *    "Look closer." Pass when all 9 were selected and verified.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.captchaPassed = false
 *      - const win = G.openWindow({ title: 'Are you human?', w: 420, h: 500, closable: false })
 *        Grid background: a <div> with G.setSkin(grid, 'captcha-grid.png') laid out as a
 *        3x3 CSS grid. Tiles: G.asset(`boss-${i}.png`, { w: 120, h: 120 }) in a clickable
 *        wrapper. Selected = a G.asset('captcha-selected.png', { w: 120, h: 120 }) overlay
 *        on top of the tile (absolute, inset 0). No CSS borders/ticks — art only.
 *        Verify = G.ui.button('Verify', ...)
 *      - "Verify" button: if all 9 selected -> G.state.captchaPassed = true; win.close();
 *        else G.shake() + text "Look closer. Some of these are definitely your boss."
 *    check:   G.state.captchaPassed || 'Captcha not solved. Are you even human?'
 *    cleanup: delete G.state.captchaPassed
 *
 *  JUICE IDEAS
 *    - After 8 selected, one tile swaps to another boss photo and deselects itself.
 *    - Clippy: "I failed this captcha 400 times. I'm fine."
 *
 *  ASSETS: boss-1.png, boss-2.png, boss-3.png, boss-4.png, boss-5.png,
 *          boss-6.png, boss-7.png, boss-8.png, boss-9.png,
 *          captcha-grid.png (grid background, ~390x390), captcha-selected.png (120x120 overlay)
 * ========================================================================== */

Game.registerStage({
  id: 16,
  name: 'Captcha',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'panic',
  error: 'Server needs to confirm you are human.',
  clippy: "Prove you're human. I already know you're not a very GOOD one. Hahaha. HAHA. ha.",
  hint: 'Every single picture is your boss. Select all 9, then press Verify.',
  assets: ['boss-1.png', 'boss-2.png', 'boss-3.png', 'boss-4.png', 'boss-5.png',
           'boss-6.png', 'boss-7.png', 'boss-8.png', 'boss-9.png',
           'captcha-grid.png', 'captcha-selected.png'],

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

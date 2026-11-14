/* =============================================================================
 *  STAGE 4 — Attachment exceeds the file size limit              STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The cat photo attachment is now 4 GB. A window "Attachment Manager" shows
 *    the cat picture and a "Compress" button. Pressing Compress visibly squishes
 *    the cat (cat.png -> cat-squished.png) and the attachment becomes tiny.
 *    Pass once the cat is compressed.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - Make sure the cat is attached (don't rely on stage 3):
 *          G.attachments.add('cat.jpg', '4 GB', 'file-photo.png')
 *      - G.state.catCompressed = false
 *      - const win = G.openWindow({ title: 'Attachment Manager - cat.jpg', w: 420, h: 380 })
 *        put G.asset('cat.png', { w: 300, h: 220 }) and G.ui.button('Compress', onCompress)
 *        in win.body (optional: a G.ui.progress() bar that fills while compressing)
 *      - on Compress click: G.setAsset(catBox, 'cat-squished.png'),
 *        G.attachments.setSize('cat.jpg', '12 KB'), G.state.catCompressed = true,
 *        a little squash CSS animation / G.shake(), Clippy: "He's fine. Probably."
 *    check:   G.state.catCompressed || 'cat.jpg is still 4 GB.'
 *    cleanup: delete G.state.catCompressed (window auto-closes).
 *    Leave 'cat.jpg' attached — stage 6 converts it to PNG.
 *
 *  JUICE IDEAS
 *    - A fake progress bar while compressing ("Removing unnecessary fluff...").
 *    - Pressing Compress twice: "Any more and it's a pancake."
 *
 *  ASSETS: cat.png, cat-squished.png, file-photo.png
 * ========================================================================== */

Game.registerStage({
  id: 4,
  name: 'File too big',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'happy',
  error: 'Attachments exceed the file size limit (25 MB). cat.jpg is 4 GB.',
  clippy: "Hmm, 4 GB is a LOT of cat. Have you tried compressing it? Gently. He's very soft.",
  hint: 'Open the Attachment Manager window and press "Compress".',
  assets: ['cat.png', 'cat-squished.png', 'file-photo.png'],

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

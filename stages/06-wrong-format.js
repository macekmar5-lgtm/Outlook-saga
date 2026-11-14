/* =============================================================================
 *  STAGE 6 — Photo attachments in the wrong format               STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The cat photo is a JPG, the server only accepts PNG. A "Converter 3000"
 *    icon appears on the desktop. The player opens it, picks cat.jpg and
 *    presses Convert; the attachment becomes cat.png. Pass when no attachment
 *    ends in .jpg.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - Make sure there's a JPG attached: if (!G.attachments.get('cat.jpg'))
 *          G.attachments.add('cat.jpg', '12 KB', 'file-photo.png')
 *      - G.addIcon({ id: 'converter', label: 'Converter 3000', asset: 'icon-converter.png',
 *                    x: 1060, y: 40, onClick: openConverter })
 *      - openConverter(): G.openApp({ id: 'converter', title: 'Converter 3000 (Trial)',
 *                                     icon: 'icon-converter.png', w: 380, h: 260 })
 *        (openApp = draggable app window, only one at a time)
 *        with one G.ui.button per attachment to pick it (NO native <select> — the
 *        browser draws those), format buttons, and G.ui.button('Convert', ...).
 *        Convert: G.ui.progress() fake progress, then G.attachments.remove('cat.jpg');
 *                 G.attachments.add('cat.png', '12 KB', 'file-photo.png')
 *    check:   !G.attachments.list().some(a => /\.jpe?g$/i.test(a.name)) ||
 *             'cat.jpg is still a JPG.'
 *    cleanup: icon + window auto-removed.
 *
 *  JUICE IDEAS
 *    - First Convert attempt outputs "cat.jpg.png.jpg" and needs a second go.
 *    - The converter offers useless formats: .BMP, .GIF, .DOCX, .MP3, .CAT
 *
 *  ASSETS: icon-converter.png, file-photo.png
 * ========================================================================== */

Game.registerStage({
  id: 6,
  name: 'Wrong format',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'annoyed',
  error: 'Photo attachments are in the wrong format. Please use PNG.',
  clippy: "JPG? In this economy? The server only takes PNG. There's a converter on the desktop. You're welcome.",
  hint: 'Click "Converter 3000" on the desktop, choose cat.jpg and convert it to PNG.',
  assets: ['icon-converter.png', 'file-photo.png'],

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

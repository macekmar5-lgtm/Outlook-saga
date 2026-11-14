/* =============================================================================
 *  STAGE 6 — Photo attachments in the wrong format               STATUS: DONE
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
  vibe: 'annoyed',
  error: 'Photo attachments are in the wrong format. Please use PNG.',
  clippy: "JPG? In this economy? The server only takes PNG. There's a converter on the desktop. You're welcome.",
  hint: 'Click "Converter 3000" on the desktop, choose cat.jpg and convert it to PNG.',
  assets: ['icon-converter.png', 'file-photo.png'],

  setup(G) {
    if (!G.attachments.get('cat.jpg')) G.attachments.add('cat.jpg', '12 KB', 'file-photo.png');
    let converter;
    const openConverter = () => {
      if (converter && converter.el.isConnected) {
        G.bringToFront(converter.el);
        return;
      }
      converter = G.openApp({ id: 'converter', title: 'Converter 3000 (Trial)',
        icon: 'icon-converter.png', x: 720, y: 120, w: 420, h: 360 });
      const body = converter.body;
      Object.assign(body.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
      const status = G.make('p', '', 'Choose a JPG attachment, then convert it to PNG.');
      const files = G.make('div');
      Object.assign(files.style, { display: 'flex', flexWrap: 'wrap', gap: '6px' });
      let selected = null;
      let busy = false;
      const renderFiles = () => {
        files.replaceChildren();
        G.attachments.list().filter(a => /\.jpe?g$/i.test(a.name)).forEach(a => {
          files.append(G.ui.button(a.name, () => {
            if (busy) return;
            selected = a.name;
            status.textContent = 'Selected: ' + selected + ' / Output: PNG';
          }));
        });
      };
      renderFiles();
      const progress = G.ui.progress(0);
      const convert = G.ui.button('Convert to PNG', () => {
        if (busy) return;
        const attachment = selected && G.attachments.get(selected);
        if (!attachment) {
          status.textContent = 'Choose a JPG file first.';
          return;
        }
        busy = true;
        convert.disabled = true;
        status.textContent = 'Converting ' + selected + '...';
        progress.set(0.35);
        G.timeout(() => {
          const output = attachment.name.replace(/\.jpe?g$/i, '.png');
          G.attachments.remove(attachment.name);
          G.attachments.add(output, attachment.size, 'file-photo.png');
          selected = null;
          busy = false;
          convert.disabled = false;
          progress.set(1);
          status.textContent = output + ' attached. Convert any remaining JPG files, then Send.';
          renderFiles();
        }, 650);
      });
      body.append(status, files, G.make('div', '', 'Output format: PNG (printer approved)'), progress, convert);
    };
    G.addIcon({ id: 'converter', label: 'Converter 3000', asset: 'icon-converter.png',
      x: 1060, y: 40, onClick: openConverter });
  },

  check(G) {
    return !G.attachments.list().some(a => /\.jpe?g$/i.test(a.name)) || 'There is still a JPG attachment. Convert it to PNG.';
  },
});

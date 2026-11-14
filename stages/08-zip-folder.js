/* =============================================================================
 *  STAGE 8 — Attachments must be one zipped folder               STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A "New Folder.zip" icon appears on the desktop (bottom left). Drag every
 *    attachment chip onto it: chips disappear into it and the icon counts them.
 *    When all are inside, drag the zip icon INTO the mail window: it becomes
 *    the single attachment "New Folder.zip".
 *    Pass: exactly one attachment and it ends in .zip.
 *
 *  ASSETS: icon-zip.png
 * ========================================================================== */

(function () {
  const ZIP = 'New Folder.zip';

  Game.registerStage({
    id: 8,
    name: 'Zip folder',
    vibe: 'annoyed',
    error: 'Attachments must be sent as one zipped folder.',
    clippy: 'Loose files? In THIS office? Zip them up like a professional. Like me. I am extremely zipped.',
    hint: 'Drag each attachment onto "New Folder.zip" (bottom left). Then drag the zip icon itself into the email window.',
    retry: ['ONE zip. Not zero. Not five. One.', 'Files go IN the zip. The zip goes IN the email. Riveting stuff.'],
    assets: ['icon-zip.png'],

    setup(G) {
      // Need something to zip (also when jumped to directly).
      if (!G.attachments.list().some((a) => !/\.zip$/i.test(a.name))) {
        G.attachments.add('cat.png', '3 MB', 'file-photo.png');
        G.attachments.add('excuse.docx', '18 KB', 'file-doc.png');
      }
      G.state.zipped = [];

      const zip = G.addIcon({ id: 'zip', label: `${ZIP} (0)`, asset: 'icon-zip.png', x: 16, y: 470 });
      G.timeout(() => G.highlight(zip, 3000), 600);

      // 1) chips -> zip
      G.dragAttachments((att, point) => {
        if (!G.hitTest(zip, point)) return;
        if (/\.zip$/i.test(att.name)) {
          G.clippy.say('A zip inside a zip. Very deep. No.', 'annoyed');
          return;
        }
        G.attachments.remove(att.name);
        G.state.zipped.push(att.name);
        zip.setLabel(`${ZIP} (${G.state.zipped.length})`);
        if (!G.attachments.list().length) {
          G.clippy.say('All zipped. Now drag the zip into the email. Yes, the whole folder. Yes, with the mouse.', 'annoyed');
          G.highlight(zip, 2500);
        }
      });

      // 2) zip -> email
      G.dragGhost(zip, {
        onDrop(point) {
          if (!G.hitTest(G.mail.el.window, point)) return;
          const loose = G.attachments.list().filter((a) => !/\.zip$/i.test(a.name));
          if (loose.length) {
            G.clippy.say(`There are still ${loose.length} loose file(s) in the email. Zip them first.`, 'annoyed');
            return;
          }
          if (!G.state.zipped.length) {
            G.clippy.say('An empty zip. Very efficient. Very pointless.', 'annoyed');
            return;
          }
          G.attachments.add(ZIP, `${G.state.zipped.length} files`, 'icon-zip.png');
          zip.remove();
          G.clippy.say('One zip. Neat. Tidy. Suspiciously competent of you.', 'annoyed');
        },
      });
    },

    check(G) {
      const list = G.attachments.list();
      if (list.length === 1 && /\.zip$/i.test(list[0].name)) return true;
      if (list.length > 1 || (list.length === 1 && !/\.zip$/i.test(list[0].name))) {
        return 'There are still loose attachments. Put them all in the zip, then attach the zip.';
      }
      return 'Nothing is attached. Drag the zip folder into the email.';
    },

    cleanup(G) {
      delete G.state.zipped;
    },
  });
})();

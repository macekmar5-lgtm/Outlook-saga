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
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "8"
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
          G.clippy.say(G.line('zipInZip'), 'annoyed');
          return;
        }
        G.attachments.remove(att.name);
        G.state.zipped.push(att.name);
        zip.setLabel(`${ZIP} (${G.state.zipped.length})`);
        if (!G.attachments.list().length) {
          G.clippy.say(G.line('allZipped'), 'annoyed');
          G.highlight(zip, 2500);
        }
      });

      // 2) zip -> email
      G.dragGhost(zip, {
        onDrop(point) {
          if (!G.hitTest(G.mail.el.window, point)) return;
          const loose = G.attachments.list().filter((a) => !/\.zip$/i.test(a.name));
          if (loose.length) {
            G.clippy.say(G.line('looseFiles', { count: loose.length }), 'annoyed');
            return;
          }
          if (!G.state.zipped.length) {
            G.clippy.say(G.line('emptyZip'), 'annoyed');
            return;
          }
          G.attachments.add(ZIP, `${G.state.zipped.length} files`, 'icon-zip.png');
          zip.remove();
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

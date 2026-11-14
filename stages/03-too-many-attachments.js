/* =============================================================================
 *  STAGE 3 — Too many attachments                                STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email now has 5 attachments; the max is 3. Drag attachment chips out
 *    of the email onto the Recycle Bin (bottom left of the desktop).
 *    - definitely_not_a_virus.exe MUST go.
 *    - cat.jpg can't be trashed: it bounces back ("Not the cat. Never the cat.").
 *    Pass: at most 3 attachments, the .exe is gone, cat.jpg is still attached.
 *
 *  STATE FLOW
 *    cat.jpg stays attached for stage 4 (compress), 6 (convert) and 8 (zip).
 *
 *  ASSETS: file-photo.png, file-doc.png, file-exe.png, trash-empty.png, trash-full.png
 * ========================================================================== */

(function () {
  const EXE = 'definitely_not_a_virus.exe';
  const FILES = [
    ['cat.jpg', '4.2 GB', 'file-photo.png'],
    ['excuse.docx', '18 KB', 'file-doc.png'],
    [EXE, '666 KB', 'file-exe.png'],
    ['meme.png', '2 MB', 'file-photo.png'],
    ['budget_2009.xlsx', '9 KB', 'file-doc.png'],
  ];

  Game.registerStage({
    id: 3,
    name: 'Too many attachments',
    vibe: 'happy',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "3"
    assets: ['file-photo.png', 'file-doc.png', 'file-exe.png', 'trash-empty.png', 'trash-full.png'],

    setup(G) {
      // Always start from the same 5 files (also when jumped to directly).
      G.attachments.clear();
      FILES.forEach((f) => G.attachments.add(f[0], f[1], f[2]));

      const bin = G.addIcon({ id: 'trash', label: 'Recycle Bin', asset: 'trash-empty.png', x: 16, y: 470 });
      const binImg = bin.querySelector('.desktop-icon-img');

      G.dragAttachments((att, point) => {
        if (!G.hitTest(bin, point)) return; // dropped somewhere else: chip stays in the email
        if (att.name === 'cat.jpg') {
          G.shake();
          G.clippy.say(G.line('notTheCat'), 'annoyed');
          return; // the cat bounces back into the email
        }
        G.attachments.remove(att.name);
        G.setAsset(binImg, 'trash-full.png');
        G.sound('bounce.wav', 0.4);
        if (att.name === EXE) G.clippy.say(G.line('exeGone'), 'happy');
      });

      G.timeout(() => G.highlight(bin, 3000), 600);
    },

    check(G) {
      const list = G.attachments.list();
      if (list.some((a) => a.name === EXE)) return `${EXE} is still attached. Suspicious.`;
      if (list.length > 3) return `Still ${list.length} attachments. The maximum is 3.`;
      if (!G.attachments.get('cat.jpg')) return 'Where is cat.jpg? The printer was looking forward to the cat.';
      return true;
    },
  });
})();

/* =============================================================================
 *  STAGE 4 — Attachment exceeds the file size limit              STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    cat.jpg is 4.2 GB. Click the cat.jpg chip in the email: a preview window
 *    opens with the cat (cat.png), its size and a "Compress" button. Press it:
 *    a progress bar runs, the cat gets visibly squished (cat-squished.png) and
 *    the size becomes 3 MB.  Pass: cat is compressed.
 *
 *  ASSETS: cat.png, cat-squished.png, file-photo.png, progress-bar.png, progress-fill.png
 * ========================================================================== */

(function () {
  function openPreview(G) {
    const compressed = G.state.catCompressed;
    const win = G.openApp({
      id: 'cat-preview', title: 'Attachment Preview - cat.jpg', icon: 'file-photo.png',
      x: 560, y: 120, w: 360, h: 400,
    });
    if (!win.created) return;

    const col = G.make('div', 'stage-center');
    const img = G.asset(compressed ? 'cat-squished.png' : 'cat.png', { w: 300, h: 220 });
    const size = G.make('div', 'mood-label', compressed ? 'cat.jpg - 3 MB' : 'cat.jpg - 4.2 GB');
    const label = G.make('div', 'stage-note', compressed ? 'Compressed. He is fine. Probably.' : 'Limit: 25 MB');
    const bar = G.ui.progress(0);
    bar.classList.add('hidden');
    const btn = G.ui.button('Compress', () => {
      if (G.state.catCompressed) {
        G.clippy.say(G.line('alreadyFlat'), 'happy');
        return;
      }
      btn.disabled = true;
      bar.classList.remove('hidden');
      G.runProgress(bar, 2200, ['Compressing...', 'Squeezing the cat...', 'Removing unnecessary fluff...', 'Done!'], label).then(() => {
        G.setAsset(img, 'cat-squished.png');
        size.textContent = 'cat.jpg - 3 MB';
        G.attachments.setSize('cat.jpg', '3 MB');
        G.state.catCompressed = true;
        G.shake();
        G.clippy.say(G.line('compressed'), 'happy');
      });
    });
    col.append(img, size, bar, label, btn);
    win.body.appendChild(col);
  }

  Game.registerStage({
    id: 4,
    name: 'File too big',
    vibe: 'happy',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "4"
    assets: ['cat.png', 'cat-squished.png', 'file-photo.png', 'progress-bar.png', 'progress-fill.png'],

    setup(G) {
      G.state.catCompressed = false;
      if (!G.attachments.get('cat.jpg')) G.attachments.add('cat.jpg', '4.2 GB', 'file-photo.png');
      G.attachments.setSize('cat.jpg', '4.2 GB');

      const chip = G.attachments.get('cat.jpg').el;
      chip.classList.add('clickable');
      G.track(() => chip.classList.remove('clickable'));
      G.on(chip, 'click', () => openPreview(G));
      G.timeout(() => G.highlight(chip, 3000), 600);
    },

    check(G) {
      return G.state.catCompressed || 'cat.jpg is still 4.2 GB. The printer only has 25 MB of memory.';
    },

    cleanup(G) {
      delete G.state.catCompressed;
    },
  });
})();

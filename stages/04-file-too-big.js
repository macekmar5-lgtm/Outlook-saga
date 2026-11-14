/* =============================================================================
 *  STAGE 4 — Attachment exceeds the file size limit              STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The cat photo attachment is now 4 GB. An "Attachment Manager" window shows
 *    the cat and a "Compress" button. Pressing Compress runs a fake progress
 *    bar, then the cat gets visibly squished (cat.png -> cat-squished.png) and
 *    the attachment becomes 12 KB. Pass once the cat is compressed.
 *    Closing the window by accident? Click the cat.jpg chip to reopen it.
 *
 *  NOTES
 *    Leaves 'cat.jpg' attached (12 KB) — stage 6 converts it to PNG.
 *
 *  ASSETS
 *    cat.png, cat-squished.png (300x220 in the window), file-photo.png
 *    sounds/squish.wav (optional: the cat gets compressed)
 * ========================================================================== */

Game.registerStage({
  id: 4,
  name: 'File too big',
  vibe: 'happy',
  error: 'Attachments exceed the file size limit (25 MB). cat.jpg is 4 GB.',
  clippy: "Hmm, 4 GB is a LOT of cat. Have you tried compressing it? Gently. He's very soft.",
  hint: 'Press "Compress" in the Attachment Manager window. Closed it? Click the cat.jpg attachment.',
  retry: [
    'The cat is still 4 GB. That is a chonky boy.',
    'Compress. The. Cat. (Lovingly.)',
  ],
  assets: ['cat.png', 'cat-squished.png', 'file-photo.png'],

  setup(G) {
    G.state.catCompressed = false;
    let busy = false;
    let extraPresses = 0;

    // Don't rely on stage 3: make sure the (huge) cat is attached.
    const chip = G.attachments.add('cat.jpg', '4 GB', 'file-photo.png');

    const steps = [
      'Removing unnecessary fluff...',
      'Folding ears...',
      'Deflating belly...',
      'Asking cat to hold still...',
      'Squishing...',
    ];

    const openManager = () => {
      const body = G.make('div', 'stage4-manager');
      body.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;';

      const catBox = G.asset(G.state.catCompressed ? 'cat-squished.png' : 'cat.png', { w: 300, h: 220 });
      catBox.style.transformOrigin = '50% 100%';
      catBox.style.transition = 'transform 0.25s ease-in';
      const info = G.make('div', 'stage4-info',
        G.state.catCompressed ? 'cat.jpg - 12 KB (compressed)' : 'cat.jpg - 4 GB (limit: 25 MB)');
      const bar = G.ui.progress(G.state.catCompressed ? 1 : 0);
      bar.style.width = '300px';
      bar.style.height = '18px';

      const onCompress = () => {
        if (busy) return;
        if (G.state.catCompressed) {
          extraPresses++;
          G.shake();
          G.clippy.say(extraPresses === 1
            ? "Any more and it's a pancake."
            : 'He is 12 KB. He is basically a sticker now. Press Send!', 'annoyed');
          return;
        }
        busy = true;
        btn.disabled = true;
        let i = 0;
        const tick = G.interval(() => {
          i++;
          bar.set(i / steps.length);
          info.textContent = steps[Math.min(i, steps.length) - 1];
          catBox.style.transform = `scaleY(${1 - i * 0.08})`;
          if (i < steps.length) return;
          clearInterval(tick);
          G.timeout(() => {
            G.setAsset(catBox, 'cat-squished.png');
            catBox.style.transform = '';
            G.attachments.setSize('cat.jpg', '12 KB');
            G.state.catCompressed = true;
            info.textContent = 'cat.jpg - 12 KB (compressed)';
            busy = false;
            btn.disabled = false;
            G.sound('squish.wav');
            G.shake();
            G.clippy.say("He's fine. Probably. Now press Send!", 'happy');
          }, 300);
        }, 450);
      };
      const btn = G.ui.button('Compress', onCompress);

      body.append(catBox, info, bar, btn);
      return G.openApp({
        id: 'stage4-attachment-manager',
        title: 'Attachment Manager - cat.jpg',
        icon: 'file-photo.png',
        html: body,
        x: 560,
        y: 110,
        w: 400,
        h: 420,
        onClose: () => {
          if (busy) G.clippy.say('You closed it mid-squish! Click cat.jpg to open it again.', 'annoyed');
          busy = false;
        },
      });
    };

    // Clicking the cat attachment (re)opens the manager.
    chip.classList.add('clickable');
    G.on(chip, 'click', openManager);
    G.track(() => chip.classList.remove('clickable'));

    openManager();
  },

  check(G) {
    return G.state.catCompressed || 'cat.jpg is still 4 GB. Press "Compress" in the Attachment Manager.';
  },

  cleanup(G) {
    delete G.state.catCompressed;
  },
});

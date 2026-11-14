/* =============================================================================
 *  STAGE 3 — Too many attachments                                STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email suddenly has 6 attachments; the max is 3. The player drags the
 *    extra attachment chips out of the mail window onto the Recycle Bin icon on
 *    the desktop (bottom left). Pass when 3 or fewer attachments remain.
 *
 *  NOTES
 *    - 'cat.jpg' is one of the six. Stages 4 and 6 use the cat photo, but they
 *      re-add it themselves if the player binned it here.
 *    - definitely_not_a_virus.exe jumps back out of the bin the first time it
 *      is thrown away. The second time it stays gone.
 *    - Dropping a chip anywhere else snaps it back into the email.
 *
 *  ASSETS
 *    file-photo.png, file-doc.png, file-exe.png (attachment icons, 20x20)
 *    trash-empty.png, trash-full.png (desktop icon, 48x48)
 *    sounds/trash.wav (optional: a file lands in the bin)
 * ========================================================================== */

Game.registerStage({
  id: 3,
  name: 'Too many attachments',
  vibe: 'happy',
  error: 'Email contains too many attachments (max 3).',
  clippy: 'Three attachments max! Maybe drag a few into the Recycle Bin? Especially that .exe. Just a thought! :)',
  hint: 'Drag attachments from the email onto the Recycle Bin on the desktop (bottom left) until only 3 are left.',
  retry: [
    'Count with me: one, two, three... and then STOP attaching things.',
    'The Recycle Bin is bottom left. It is hungry. Feed it.',
  ],
  assets: ['file-photo.png', 'file-doc.png', 'file-exe.png', 'trash-empty.png', 'trash-full.png'],

  setup(G) {
    const MAX = 3;
    const EXE = 'definitely_not_a_virus.exe';
    const files = [
      ['cat.jpg', '2 MB', 'file-photo.png'],
      ['excuse_v2_FINAL.doc', '48 KB', 'file-doc.png'],
      ['excuse_v3_FINAL_final.doc', '51 KB', 'file-doc.png'],
      ['selfie_with_traffic.jpg', '3 MB', 'file-photo.png'],
      [EXE, '666 KB', 'file-exe.png'],
      ['timesheet.doc', '12 KB', 'file-doc.png'],
    ];

    G.state.exeEscaped = false;

    const bin = G.addIcon({
      id: 'trash',
      label: 'Recycle Bin',
      asset: 'trash-empty.png',
      x: 16,
      y: 560,
      onClick: () => G.clippy.say("That's the Recycle Bin. Drag attachments onto it. It won't bite. Probably.", 'happy'),
    });
    const binImg = bin.querySelector('.asset');

    // Wire up one attachment chip so it can be thrown in the bin.
    const makeBinnable = (chip) => {
      const drag = G.makeDraggable(chip, {
        revert: true,
        onDrop(el) {
          if (!G.overlaps(el, bin)) return false;
          const name = el.dataset.name;
          drag.destroy();
          G.attachments.remove(name);
          G.setAsset(binImg, 'trash-full.png');
          G.sound('trash.wav');
          G.highlight(bin, 600);
          reactTo(name);
          return true;
        },
      });
      G.track(drag.destroy); // chips that stay attached stop being draggable
    };

    // Clippy comments on what got binned.
    const reactTo = (name) => {
      const left = G.attachments.list().length;
      if (name === EXE && !G.state.exeEscaped) {
        G.state.exeEscaped = true;
        // The .exe refuses to die and climbs back into the email.
        G.timeout(() => {
          if (!G.stage || G.stage.id !== 3) return;
          makeBinnable(G.attachments.add(EXE, '666 KB', 'file-exe.png'));
          G.shake();
          G.clippy.say('Wait! The .exe climbed back out. It says: "Are you sure? I\'m very friendly." Try again.', 'panic');
        }, 700);
        return;
      }
      if (name === EXE) {
        G.clippy.say('Bye bye, .exe! I never trusted it. It kept asking for my password.', 'happy');
      } else if (name === 'cat.jpg') {
        G.clippy.say('You threw away the CAT?! ...okay. Bold choice.', 'annoyed');
      } else if (left <= MAX) {
        G.clippy.say(`${left} attachment${left === 1 ? '' : 's'} left. Perfect! Now press Send.`, 'happy');
      } else {
        G.clippy.say(`${left - MAX} more to go!`, 'happy');
      }
    };

    // Replace whatever was attached with the six-file mess.
    G.attachments.clear();
    files.forEach(([name, size, icon]) => makeBinnable(G.attachments.add(name, size, icon)));
    G.highlight(bin, 4000);
  },

  check(G) {
    const n = G.attachments.list().length;
    if (n <= 3) return true;
    return `Still ${n} attachments. Max is 3. Drag ${n - 3} more into the Recycle Bin.`;
  },

  cleanup(G) {
    delete G.state.exeEscaped;
    // Drag listeners are removed via G.track; reset any leftover drag offsets.
    G.attachments.list().forEach((a) => { a.el.style.translate = ''; a.el._dragX = 0; a.el._dragY = 0; });
  },
});

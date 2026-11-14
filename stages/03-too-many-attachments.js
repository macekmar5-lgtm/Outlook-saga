/* =============================================================================
 *  STAGE 3 — Too many attachments                                STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email suddenly has 6 attachments; the max is 3. The player drags the
 *    extra attachment chips out of the mail window onto a Recycle Bin icon on
 *    the desktop. One of the files is definitely_not_a_virus.exe.
 *    Pass when 3 or fewer attachments remain.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.attachments.add() six files, e.g.
 *          'cat.jpg' (2 MB, file-photo.png), 'excuse_v2_FINAL.doc' (file-doc.png),
 *          'excuse_v3_FINAL_final.doc', 'selfie_with_traffic.jpg',
 *          'definitely_not_a_virus.exe' (file-exe.png), 'timesheet.doc'
 *        KEEP 'cat.jpg' as an attachment name — stages 4 and 6 use the cat photo.
 *      - const bin = G.addIcon({ id: 'trash', label: 'Recycle Bin', asset: 'trash-empty.png', x: 16, y: 560 })
 *      - for each chip: G.makeDraggable(chip, { revert: true, onDrop(chip) {
 *            if (!G.overlaps(chip, bin)) return false;
 *            G.attachments.remove(chip.dataset.name);
 *            G.setAsset(bin.querySelector('.asset'), 'trash-full.png');
 *            return true;
 *        }})
 *    check:   G.attachments.list().length <= 3 || 'Still too many attachments.'
 *    cleanup: icons/listeners are auto-removed. Leave the remaining attachments.
 *
 *  JUICE IDEAS
 *    - The .exe jumps out of the trash once ("Are you sure? I'm very friendly.").
 *    - Clippy reacts when the .exe is binned.
 *
 *  ASSETS: file-photo.png, file-doc.png, file-exe.png, trash-empty.png, trash-full.png
 * ========================================================================== */

Game.registerStage({
  id: 3,
  name: 'Too many attachments',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'happy',
  error: 'Email contains too many attachments (max 3).',
  clippy: 'Three attachments max! Maybe drag a few into the Recycle Bin? Especially that .exe. Just a thought! :)',
  hint: 'Drag attachments from the email onto the Recycle Bin on the desktop until only 3 are left.',
  assets: ['file-photo.png', 'file-doc.png', 'file-exe.png', 'trash-empty.png', 'trash-full.png'],

  setup(G) {
    // TODO: see IMPLEMENTATION PLAN above
  },

  check(G) {
    // TODO
    return true;
  },

  cleanup(G) {
    // TODO (windows, icons, tray items and G.on/G.timeout are removed automatically)
  },
});

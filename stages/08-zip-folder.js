/* =============================================================================
 *  STAGE 8 — Attachments must be one zipped folder               STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The server wants all attachments in ONE .zip. A zip folder icon appears
 *    on the desktop. The player drags every attachment chip onto the zip icon,
 *    then clicks the zip icon to attach "attachments.zip". Pass when the only
 *    attachment is attachments.zip.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - Make sure there are 2-3 attachments (add some if the list is short:
 *        'cat.png' 12 KB file-photo.png, 'excuse.doc' file-doc.png).
 *      - const zip = G.addIcon({ id: 'zip', label: 'attachments.zip (0 files)', asset: 'icon-zip.png',
 *                                x: 1060, y: 40, onClick: attachZip })
 *      - each chip: G.makeDraggable(chip, { revert: true, onDrop(chip) {
 *            if (!G.overlaps(chip, zip)) return false;
 *            G.state.zipped.push(chip.dataset.name); G.attachments.remove(chip.dataset.name);
 *            update the zip label count; return true; } })
 *      - attachZip(): if attachments left -> Clippy "There are still loose files!",
 *        else G.attachments.add('attachments.zip', '3 KB', 'icon-zip.png')
 *    check:   list.length === 1 && list[0].name === 'attachments.zip' ||
 *             'Attach ONE zip folder and nothing else.'
 *    cleanup: delete G.state.zipped
 *
 *  JUICE IDEAS
 *    - The zip "eats" files with a little shake. A file bounces off once ("too big for zip").
 *
 *  ASSETS: icon-zip.png, file-photo.png, file-doc.png
 * ========================================================================== */

Game.registerStage({
  id: 8,
  name: 'Zip folder',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'annoyed',
  error: 'Attachments must be sent as one zipped folder.',
  clippy: 'Loose files? Ew. Zip them up like a professional. Like me. I am very zipped.',
  hint: 'Drag every attachment onto the zip folder on the desktop, then click the zip folder to attach it.',
  assets: ['icon-zip.png', 'file-photo.png', 'file-doc.png'],

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

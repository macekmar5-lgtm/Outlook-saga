/* =============================================================================
 *  STAGE 14 — Sending from bed                                   STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email "detected" that the player is in bed. A WebCam 2000 icon
 *    appears on the desktop. The player opens it: the preview shows them in
 *    bed (webcam-bed.png). They switch the virtual background to "Office"
 *    (webcam-office.png). Pass once the office background is on.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.officeBackground = false
 *      - G.addIcon({ id: 'webcam', label: 'WebCam 2000', asset: 'icon-webcam.png',
 *                    x: 1060, y: 40, onClick: openWebcam })
 *      - openWebcam(): G.openApp({ id: 'webcam', title: 'WebCam 2000 - LIVE',
 *                                  icon: 'icon-webcam.png', w: 460, h: 400 })
 *          preview = G.asset('webcam-bed.png', { w: 420, h: 280 })
 *          background picker: G.ui.button() x4: "None", "Beach", "Office", "Space"
 *          "Office" -> G.setAsset(preview, 'webcam-office.png'); G.state.officeBackground = true
 *          others   -> Clippy comments ("A beach? On a Tuesday?") and stays in bed
 *    check:   G.state.officeBackground || 'You are still visibly in bed.'
 *    cleanup: delete G.state.officeBackground
 *
 *  JUICE IDEAS
 *    - The "Office" option is greyed out until you scroll the list.
 *    - The webcam preview slightly wobbles like a real stream.
 *
 *  ASSETS: icon-webcam.png, webcam-bed.png, webcam-office.png
 * ========================================================================== */

Game.registerStage({
  id: 14,
  name: 'Sent from bed',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'angry',
  error: 'Email detected that you are sending it from bed.',
  clippy: 'Are you... in BED?! In THOSE pajamas?! Open the webcam app and turn on the office background before anyone sees!',
  hint: 'Open "WebCam 2000" on the desktop and switch the background to "Office".',
  assets: ['icon-webcam.png', 'webcam-bed.png', 'webcam-office.png'],

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

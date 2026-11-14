/* =============================================================================
 *  STAGE 14 — Sending from bed                                   STATUS: DONE
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
  vibe: 'angry',
  error: 'Email detected that you are sending it from bed.',
  clippy: 'Are you... in BED?! In THOSE pajamas?! Open the webcam app and turn on the office background before anyone sees!',
  hint: 'Open "WebCam 2000" on the desktop and switch the background to "Office".',
  assets: ['icon-webcam.png', 'webcam-bed.png', 'webcam-office.png'],

  setup(G) {
    G.state.officeBackground = false;
    let webcam;
    const openWebcam = () => {
      if (webcam && webcam.el.isConnected) { G.bringToFront(webcam.el); return; }
      webcam = G.openApp({ id: 'webcam', title: 'WebCam 2000 - LIVE',
        icon: 'icon-webcam.png', x: 600, y: 100, w: 460, h: 430 });
      const preview = G.asset(G.state.officeBackground ? 'webcam-office.png' : 'webcam-bed.png',
        { w: 420, h: 280, className: 'stage14-preview' });
      const status = G.make('p', '', 'Background: ' + (G.state.officeBackground ? 'Office / Approved' : 'None / Bed detected'));
      const picker = G.make('div');
      Object.assign(picker.style, { display: 'flex', gap: '6px', flexWrap: 'wrap' });
      const comments = { None: 'Still in bed. The printer can see your pajamas.',
        Beach: 'A beach? On a workday? Your pajamas are still showing.',
        Space: 'Late for work AND on the moon. The printer will love that.' };
      ['None', 'Beach', 'Office', 'Space'].forEach(name => {
        const button = G.ui.button(name, () => {
          G.state.officeBackground = name === 'Office';
          G.setAsset(preview, G.state.officeBackground ? 'webcam-office.png' : 'webcam-bed.png');
          status.textContent = 'Background: ' + name + (G.state.officeBackground ? ' / Approved. Press Send.' : ' / Bed detected');
          picker.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
          G.clippy.say(G.state.officeBackground ? 'An office. Very convincing. Send it before the printer notices.' : comments[name], 'angry');
        });
        button.setAttribute('aria-pressed', String(name === (G.state.officeBackground ? 'Office' : 'None')));
        picker.append(button);
      });
      webcam.body.append(preview, status, picker);
    };
    G.addIcon({ id: 'webcam', label: 'WebCam 2000', asset: 'icon-webcam.png',
      x: 1060, y: 40, onClick: openWebcam });
  },

  check(G) {
    return G.state.officeBackground || 'You are still visibly in bed. Choose the Office background in WebCam 2000.';
  },

  cleanup(G) {
    delete G.state.officeBackground;
  },
});

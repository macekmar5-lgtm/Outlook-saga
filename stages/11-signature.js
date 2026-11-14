/* =============================================================================
 *  STAGE 11 — Signature required                                 STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A "Digital Signature Pad" window opens with a white drawing canvas. The
 *    player draws a signature with the mouse (anything works) and presses
 *    "Sign". The server then comments on it in a popup, e.g. "Signature looks
 *    nervous." / "Is that a horse?" / "Accepted. Barely." Pass once signed.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.signed = false
 *      - const win = G.openWindow({ title: 'Digital Signature Pad', w: 520, h: 330 })
 *        add a <canvas width="480" height="200"> on top of G.asset('signature-pad.png', { w: 480, h: 200 })
 *        (the pad art is the background — no CSS colours), plus G.ui.button('Clear') + G.ui.button('Sign')
 *      - Drawing: pointerdown/move/up on the canvas. The canvas is scaled with the
 *        game, so convert: const p = G.toGame(e); const r = G.rectOf(canvas);
 *        x = p.x - r.x, y = p.y - r.y. Draw lines with ctx.lineTo (the PLAYER is
 *        drawing here — that's fine, it's not generated art).
 *      - Count points drawn. "Sign" with < 20 points: "That's a dot. Sign properly."
 *      - Otherwise: G.state.signed = true; G.popup({ title: 'Signature Server',
 *        icon: 'info', text: random comment }); win.close()
 *      - Optional: G.attachments.add('signature.png', '2 KB', 'file-photo.png')
 *    check:   G.state.signed || 'The email is not signed.'
 *    cleanup: delete G.state.signed
 *
 *  JUICE IDEAS
 *    - Comment depends on the drawing: very long = "Signature is a novel",
 *      very fast = "Signature looks nervous".
 *
 *  ASSETS: signature-pad.png (480x200). The strokes on the canvas are the
 *          PLAYER's drawing, which is allowed.
 * ========================================================================== */

Game.registerStage({
  id: 11,
  name: 'Signature',
  vibe: 'angry',
  error: 'Signature required. Unsigned emails could be from anyone. Even you.',
  clippy: "The server wants a signature. Draw something. Anything. I'm not judging. (I am judging.)",
  hint: 'Draw anything on the Signature Pad with the mouse, then press "Sign".',
  assets: ['signature-pad.png'],

  setup(G) {
    G.state.signed = false;
    const win = G.openWindow({ title: 'Digital Signature Pad', w: 520, h: 350,
      x: 380, y: 180, closable: false });
    const pad = G.make('div');
    Object.assign(pad.style, { position: 'relative', width: '480px', height: '200px' });
    pad.append(G.asset('signature-pad.png', { w: 480, h: 200 }));
    const canvas = G.make('canvas');
    canvas.width = 480;
    canvas.height = 200;
    canvas.setAttribute('aria-label', 'Draw your signature here');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '480px',
      height: '200px', touchAction: 'none' });
    pad.append(canvas);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = getComputedStyle(G.mail.el.body).color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    let pointer = null;
    let points = 0;
    const status = G.make('p', '', 'Draw a signature, then press Sign.');
    const point = e => {
      const p = G.toGame(e);
      const r = G.rectOf(canvas);
      return { x: (p.x - r.x) * canvas.width / r.w, y: (p.y - r.y) * canvas.height / r.h };
    };
    G.on(canvas, 'pointerdown', e => {
      if (e.button !== 0 || pointer !== null) return;
      e.preventDefault();
      pointer = e.pointerId;
      canvas.setPointerCapture(pointer);
      const p = point(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    G.on(canvas, 'pointermove', e => {
      if (pointer !== e.pointerId) return;
      const p = point(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      points++;
      status.textContent = points < 20 ? 'Keep signing...' : 'Signature ready. Press Sign.';
    });
    const stop = e => {
      if (pointer !== e.pointerId) return;
      if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
      pointer = null;
    };
    G.on(canvas, 'pointerup', stop);
    G.on(canvas, 'pointercancel', stop);
    G.on(canvas, 'lostpointercapture', stop);
    const actions = G.make('div');
    Object.assign(actions.style, { display: 'flex', gap: '8px' });
    actions.append(G.ui.button('Clear', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points = 0;
      status.textContent = 'Cleared. Draw your signature again.';
    }), G.ui.button('Sign', () => {
      if (points < 20) { status.textContent = "That's a dot. Sign properly (draw a longer line)."; return; }
      G.state.signed = true;
      win.close();
      const popup = G.popup({ title: 'Signature Server', icon: 'info',
        text: points > 150 ? 'Signature is a novel. Accepted. Barely.' : 'Is that a horse? Accepted. Barely.' });
      G.track(popup.close);
    }));
    win.body.append(pad, status, actions);
  },

  check(G) {
    return G.state.signed || 'The email is not signed. Draw on the pad and press Sign.';
  },

  cleanup(G) {
    delete G.state.signed;
  },
});

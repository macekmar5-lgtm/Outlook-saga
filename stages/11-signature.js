/* =============================================================================
 *  STAGE 11 — Signature required                                 STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A Signature Pad window: signature-pad.png with a drawing canvas on top.
 *    Draw with the mouse (black, 3px, slightly wobbly), then "Submit signature".
 *    Too little ink (total stroke < 150px): "That's a dot. Try harder."
 *    Otherwise a random server comment pops up and "[signature.png]" is added
 *    to the end of the body.  Pass: signature accepted.
 *
 *  ASSETS: signature-pad.png  (the strokes are the PLAYER's drawing — allowed)
 * ========================================================================== */

(function () {
  const MIN_INK = 150; // server comments: clippy-lines.js -> "11" -> lines.serverComments

  Game.registerStage({
    id: 11,
    name: 'Signature',
    vibe: 'angry',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "11"
    assets: ['signature-pad.png'],

    setup(G) {
      G.state.signed = false;
      const win = G.openWindow({ title: 'Digital Signature Pad', x: 360, y: 150, w: 520, h: 350, closable: false });
      const col = G.make('div', 'stage-center');
      const pad = G.make('div', 'sig-pad');
      pad.appendChild(G.asset('signature-pad.png', { w: 480, h: 200 }));
      const canvas = G.make('canvas');
      canvas.width = 480;
      canvas.height = 200;
      pad.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const msg = G.make('div', 'stage-msg', 'Sign here. Nervously.');
      let ink = 0;
      let last = null;
      const at = (e) => {
        const p = G.toGame(e);
        const r = G.rectOf(canvas);
        const wobble = () => (Math.random() - 0.5) * 1.6;
        return { x: p.x - r.x + wobble(), y: p.y - r.y + wobble() };
      };
      G.on(canvas, 'pointerdown', (e) => {
        e.preventDefault();
        last = at(e);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
      });
      G.on(window, 'pointermove', (e) => {
        if (!last) return;
        const p = at(e);
        ink += Math.hypot(p.x - last.x, p.y - last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last = p;
      });
      G.on(window, 'pointerup', () => { last = null; });

      const clear = G.ui.button('Clear', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ink = 0;
        msg.textContent = 'Fresh start. Try to look confident.';
      });
      const submit = G.ui.button('Submit signature', () => {
        if (ink < MIN_INK) {
          msg.textContent = "That's a dot. Try harder.";
          G.shake();
          return;
        }
        G.state.signed = true;
        G.mail.body = G.mail.body.replace(/\s+$/, '') + '\n\n[signature.png]';
        win.close();
        G.popup({ title: 'Signature Server', icon: 'info', text: (() => { const c = G.line('serverComments'); return c[Math.floor(Math.random() * c.length)]; })() });
        G.clippy.say(G.line('signed'), 'angry');
      });
      submit.style.minWidth = '150px';

      const row = G.make('div', 'stage-row');
      row.append(clear, submit);
      col.append(pad, msg, row);
      win.body.appendChild(col);
    },

    check(G) {
      return G.state.signed || 'The email is not signed. Draw a signature and submit it.';
    },

    cleanup(G) {
      delete G.state.signed;
    },
  });
})();

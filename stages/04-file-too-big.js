/* =============================================================================
 *  STAGE 4 — Attachment exceeds the file size limit              STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    cat.jpg is 4.2 GB. Click the cat.jpg chip in the email: a preview window
 *    opens with the cat (cat.png) under a hydraulic press (press.png). Grab the
 *    press and DRAG IT DOWN: the cat squishes live under it and the file size
 *    shrinks as you push. Push it all the way down -> the cat is flat, 3 MB.
 *    Let go too early and the press springs back up (the cat pops back).
 *    Pass: cat is compressed.
 *
 *  ASSETS: cat.png, press.png (the press head/plate, ~240x90), file-photo.png
 *  SOUND:  sounds/compressing.mp3 (plays when the cat is pressed flat)
 * ========================================================================== */

(function () {
  // ---- the press rig (game px; matches .press-rig in style.css) ----
  const RIG_H = 300;                 // height of the whole rig
  const CAT_W = 300;
  const CAT_H = 180;                 // the cat stands on the floor at the bottom of the rig
  const PRESS_W = 240;
  const PRESS_H = 90;                // press.png is drawn this big; its BOTTOM edge squishes the cat
  const FLAT = 0.12;                 // how flat the cat ends up (12% of his height)
  const WIDEN = 0.17;                // ...and how much wider he gets (at FLAT he's 117% wide)
  const PRESS_LOWEST = RIG_H - CAT_H * FLAT - PRESS_H; // the press can't go lower than this

  /** 4.2 GB at full height -> 3 MB when flat (a nice dramatic curve in between). */
  function sizeFor(scale) {
    const k = (scale - FLAT) / (1 - FLAT);
    const mb = 3 * Math.pow(4300 / 3, Math.max(0, k));
    return mb >= 1000 ? (mb / 1024).toFixed(1) + ' GB' : Math.max(3, Math.round(mb)) + ' MB';
  }

  function openPreview(G) {
    const win = G.openApp({
      id: 'cat-preview', title: 'Attachment Preview - cat.jpg', icon: 'file-photo.png',
      x: 560, y: 90, w: 360, h: 470,
    });
    if (!win.created) return;

    const col = G.make('div', 'stage-center');
    const rig = G.make('div', 'press-rig');
    const cat = G.asset('cat.png', { w: CAT_W, h: CAT_H, className: 'press-cat' });
    const press = G.asset('press.png', { w: PRESS_W, h: PRESS_H, className: 'press-head draggable' });
    rig.append(cat, press);
    const size = G.make('div', 'mood-label');
    const note = G.make('div', 'stage-note');
    col.append(rig, size, note);
    win.body.appendChild(col);

    let top = 0; // where the press is (0 = all the way up)
    const squish = (pressTop) => {
      const s = Math.min(1, Math.max(FLAT, (RIG_H - (pressTop + PRESS_H)) / CAT_H));
      cat.style.transform = `scale(${1 + (1 - s) * (WIDEN / (1 - FLAT))}, ${s})`;
      size.textContent = 'cat.jpg - ' + sizeFor(s);
      return s;
    };
    const movePress = (t, ms) => {
      const transition = ms ? `${ms}ms ease-out` : 'none';
      press.style.transition = ms ? `top ${transition}` : 'none';
      cat.style.transition = ms ? `transform ${transition}` : 'none';
      top = t;
      press.style.top = t + 'px';
      squish(t);
    };

    if (G.state.catCompressed) {
      // reopened later: the cat stays flat, the press is parked up top
      cat.style.transform = `scale(${1 + WIDEN}, ${FLAT})`;
      size.textContent = 'cat.jpg - 3 MB';
      note.textContent = 'Compressed. He is fine. Probably.';
      press.classList.add('locked');
    } else {
      movePress(0, 0);
      note.textContent = 'Limit: 25 MB. Drag the press down!';
    }

    // ---- drag the press (up/down only) ----
    let startY = 0;
    let startTop = 0;
    const onMove = (e) => {
      const t = Math.min(PRESS_LOWEST, Math.max(0, startTop + (G.toGame(e).y - startY)));
      movePress(t, 0);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (top >= PRESS_LOWEST - 3) {
        // fully pressed: flat cat, 3 MB, press lifts off
        G.state.catCompressed = true;
        G.attachments.setSize('cat.jpg', '3 MB');
        G.sound('compressing.mp3');
        G.shake();
        G.clippy.say(G.line('compressed'), 'happy');
        press.classList.add('locked');
        press.style.transition = 'top 600ms ease-in-out';
        press.style.top = '0px';
        size.textContent = 'cat.jpg - 3 MB';
        note.textContent = 'Compressed. He is fine. Probably.';
      } else if (top > 0) {
        // let go too early: the hydraulics push it back up, the cat pops back
        movePress(0, 350);
        G.clippy.say(G.line('pressHarder'), 'happy');
      }
    };
    press.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (G.state.catCompressed) {
        G.clippy.say(G.line('alreadyFlat'), 'happy');
        return;
      }
      e.preventDefault();
      startY = G.toGame(e).y;
      startTop = top;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  Game.registerStage({
    id: 4,
    name: 'File too big (hydraulic press)',
    vibe: 'happy',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "4"
    assets: ['cat.png', 'press.png', 'file-photo.png'],

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

/* =============================================================================
 *  STAGE 16 — Confirm you are human (bus captcha)                STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    Classic captcha: "Select all squares with buses. If there are none, click
 *    skip." One street photo (captcha-bus.png) is cut into a 4x4 grid.
 *    - Every square in BUS_SQUARES must be selected.
 *    - Squares in EDGE_SQUARES (bits of the bus roof/sign) may be selected or not.
 *    - Any other square selected = wrong ("Please select all matching images.").
 *    - Skip = wrong ("There is literally a bus.").
 *    - The FIRST correct Verify still answers "Please try again." (it's a captcha).
 *      The second correct Verify passes.
 *    Pass: verified.
 *
 *  ART / TUNING
 *    captcha-bus.png is shown at 400x400 and cut into 16 squares of 100x100:
 *          0  1  2  3
 *          4  5  6  7
 *          8  9 10 11
 *         12 13 14 15
 *    When the real picture exists, set BUS_SQUARES / EDGE_SQUARES below to match
 *    where the bus actually is. The gaps between squares show captcha-frame.png
 *    behind them (that's the white grid lines — nothing is drawn in CSS).
 *
 *  ASSETS: captcha-bus.png (800x800 file shown at 400x400; public-domain stock photo,
 *          see CREDITS.md), captcha-header.png (the blue header, ~400x90),
 *          captcha-frame.png (panel behind the grid), checkbox-checked.png (tick on
 *          selected squares)
 * ========================================================================== */

(function () {
  const GRID = 4;               // 4x4 squares
  const SIZE = 100;             // one square in game px (picture = GRID * SIZE)
  // Matches captcha-bus.png (London, Oxford Street — see CREDITS.md):
  // three double-deckers across the middle; the black cabs below are decoys.
  const BUS_SQUARES = [5, 6, 7, 9, 10, 11]; // must be selected
  const EDGE_SQUARES = [];                  // may be selected or not (none for this photo)
  const FAKE_FAILS = 1;                // how many correct answers are rejected first

  Game.registerStage({
    id: 16,
    name: 'Captcha',
    vibe: 'panic',
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "16"
    assets: ['captcha-bus.png', 'captcha-header.png', 'captcha-frame.png', 'checkbox-checked.png'],

    setup(G) {
      G.state.captcha = false;
      let fakeFailsLeft = FAKE_FAILS;

      const win = G.openWindow({ title: 'Are you human?', x: 400, y: 30, w: 470, h: 630, closable: false });
      const col = G.make('div', 'stage-center');

      const header = G.make('div', 'captcha-header');
      G.setSkin(header, 'captcha-header.png');
      header.append(
        G.make('div', 'captcha-header-small', 'Select all squares with'),
        G.make('div', 'captcha-header-big', 'buses'),
        G.make('div', 'captcha-header-small', 'If there are none, click skip')
      );

      const grid = G.make('div', 'captcha-grid');
      G.setSkin(grid, 'captcha-frame.png');
      const cells = [];
      for (let i = 0; i < GRID * GRID; i++) {
        const cell = G.make('div', 'captcha-cell clickable');
        cell.dataset.n = i; // shown on the placeholder squares until captcha-bus.png exists
        const crop = G.make('div', 'captcha-crop');
        // The whole picture, shifted so only this square's part is visible.
        const pic = G.asset('captcha-bus.png', { w: GRID * SIZE, h: GRID * SIZE, className: 'captcha-pic' });
        pic.style.left = -(i % GRID) * SIZE + 'px';
        pic.style.top = -Math.floor(i / GRID) * SIZE + 'px';
        crop.appendChild(pic);
        const tick = G.make('span', 'captcha-tick hidden');
        G.setSkin(tick, 'checkbox-checked.png');
        cell.append(crop, tick);
        cell.selected = false;
        cell.setSelected = (v) => {
          cell.selected = v;
          cell.classList.toggle('selected', v);
          tick.classList.toggle('hidden', !v);
        };
        cell.addEventListener('click', () => cell.setSelected(!cell.selected));
        cells.push(cell);
        grid.appendChild(cell);
      }

      const msg = G.make('div', 'stage-msg');
      const fail = (text) => {
        msg.textContent = text;
        cells.forEach((c) => c.setSelected(false));
        G.shake();
      };

      const skip = G.ui.button('Skip', () => fail('There is literally a bus. It is yellow. It is HUGE.'));
      const verify = G.ui.button('Verify', () => {
        const picked = cells.map((c, i) => (c.selected ? i : -1)).filter((i) => i >= 0);
        const allBus = BUS_SQUARES.every((i) => picked.includes(i));
        const noWrong = picked.every((i) => BUS_SQUARES.includes(i) || EDGE_SQUARES.includes(i));
        if (!allBus || !noWrong) {
          fail('Please select all matching images.');
          return;
        }
        if (fakeFailsLeft > 0) {
          fakeFailsLeft--;
          fail('Please try again.');
          G.clippy.say(G.line('fakeFail'), 'panic');
          return;
        }
        G.state.captcha = true;
        win.close();
        G.clippy.say(G.line('verified'), 'panic');
      });

      const buttons = G.make('div', 'stage-row');
      buttons.append(skip, verify);
      col.append(header, grid, buttons, msg);
      win.body.appendChild(col);
    },

    check(G) {
      return G.state.captcha || 'Captcha not solved. Are you even human?';
    },

    cleanup(G) {
      delete G.state.captcha;
    },
  });
})();

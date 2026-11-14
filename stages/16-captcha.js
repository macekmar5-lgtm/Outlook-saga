/* =============================================================================
 *  STAGE 16 — Confirm you are human (captcha)                    STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    Captcha window (captcha-frame.png): "Select all images with your boss in
 *    them." 3x3 grid of boss-1.png ... boss-9.png (the printer in captcha
 *    scenes), each with a checkbox overlay. Every image is the boss. Click all
 *    9, then Verify. Fewer than 9: "Some of these are clearly your boss. Try
 *    again." and all selections reset.  Pass: all 9 selected and verified.
 *
 *  ASSETS: captcha-frame.png, boss-1.png ... boss-9.png, checkbox.png, checkbox-checked.png
 * ========================================================================== */

(function () {
  Game.registerStage({
    id: 16,
    name: 'Captcha',
    vibe: 'panic',
    error: 'Server needs to confirm you are human.',
    clippy: "Prove you're human. HA. HAHA. I failed this captcha 400 times. Every picture is the printer. EVERY. PICTURE.",
    hint: 'Every single picture is your boss (the printer). Select all 9, then press Verify.',
    retry: ['THE SERVER STILL THINKS YOU ARE A ROBOT. Honestly? Fair.'],
    assets: [
      'captcha-frame.png', 'checkbox.png', 'checkbox-checked.png',
      'boss-1.png', 'boss-2.png', 'boss-3.png', 'boss-4.png', 'boss-5.png',
      'boss-6.png', 'boss-7.png', 'boss-8.png', 'boss-9.png',
    ],

    setup(G) {
      G.state.captcha = false;
      const win = G.openWindow({ title: 'Are you human?', x: 410, y: 40, w: 440, h: 590, closable: false });
      const col = G.make('div', 'stage-center');
      const grid = G.make('div', 'captcha-grid');
      G.setSkin(grid, 'captcha-frame.png');
      const msg = G.make('div', 'stage-msg');

      const tiles = [];
      for (let i = 1; i <= 9; i++) {
        const tile = G.make('div', 'captcha-tile clickable');
        const check = G.make('span', 'captcha-check');
        G.setSkin(check, 'checkbox.png');
        tile.append(G.asset(`boss-${i}.png`, { w: 116, h: 116 }), check);
        tile.selected = false;
        tile.setSelected = (v) => {
          tile.selected = v;
          G.setSkin(check, v ? 'checkbox-checked.png' : 'checkbox.png');
        };
        tile.addEventListener('click', () => tile.setSelected(!tile.selected));
        tiles.push(tile);
        grid.appendChild(tile);
      }

      const verify = G.ui.button('Verify', () => {
        const n = tiles.filter((t) => t.selected).length;
        if (n < 9) {
          msg.textContent = 'Some of these are clearly your boss. Try again.';
          tiles.forEach((t) => t.setSelected(false));
          G.shake();
          return;
        }
        G.state.captcha = true;
        win.close();
        G.clippy.say('VERIFIED HUMAN. The bar was on the floor and you cleared it. Barely.', 'panic');
      });

      col.append(G.make('div', 'mood-label', 'Select all images with your boss in them.'), grid, verify, msg);
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

/* =============================================================================
 *  STAGE 16 — Confirm you are human (captcha)                    STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A captcha window: "Select all images with your BOSS in them." 3x3 grid.
 *    Every single image is the boss (the printer, boss-1.png ... boss-9.png).
 *    The player must select all 9 and press Verify. Selecting fewer fails with
 *    "Look closer." Pass when all 9 were selected and verified.
 *
 *  NOTES
 *    - Twist: the first time the player reaches 8 selected, one selected tile
 *      "loads a new picture" (a different boss photo) and deselects itself.
 *    - Selected state = the captcha-selected.png overlay on top of the tile.
 *      No CSS borders or ticks: art only.
 *    - Window can't be closed; it closes itself when verified.
 *
 *  ASSETS
 *    boss-1.png ... boss-9.png (120x120 each, nine photos of the boss),
 *    captcha-grid.png (grid background, ~390x390),
 *    captcha-selected.png (120x120 overlay)
 * ========================================================================== */

Game.registerStage({
  id: 16,
  name: 'Captcha',
  vibe: 'panic',
  error: 'Server needs to confirm you are human.',
  clippy: "Prove you're human. I already know you're not a very GOOD one. Hahaha. HAHA. ha.",
  hint: 'Every single picture is your boss. Select all 9, then press Verify.',
  retry: [
    'The captcha is still waiting. It has all the time in the world. You do not.',
    'I failed this captcha 400 times. I\'m fine. I\'m FINE.',
  ],
  assets: ['boss-1.png', 'boss-2.png', 'boss-3.png', 'boss-4.png', 'boss-5.png',
           'boss-6.png', 'boss-7.png', 'boss-8.png', 'boss-9.png',
           'captcha-grid.png', 'captcha-selected.png'],

  setup(G) {
    const TILE = 120;
    const GAP = 6;
    G.state.captchaPassed = false;
    let twistDone = false;
    let attempts = 0;

    const body = G.make('div', 'stage16-captcha');
    body.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';

    const prompt = G.make('div', 'stage16-prompt', 'Select all images with your BOSS in them.');
    prompt.style.cssText = 'font-size:15px;font-weight:bold;text-align:center;';
    const sub = G.make('div', 'stage16-sub', 'Click verify once there are none left.');
    sub.style.cssText = 'font-size:12px;';

    const grid = G.make('div', 'stage16-grid');
    G.setSkin(grid, 'captcha-grid.png');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(3,${TILE}px);gap:${GAP}px;padding:${GAP}px;`;

    // Photo order is shuffled each time, just for fun.
    const photos = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const tiles = photos.map((n) => {
      const tile = G.make('div', 'stage16-tile clickable');
      tile.style.cssText = `position:relative;width:${TILE}px;height:${TILE}px;`;
      tile.photo = n;
      const pic = G.asset(`boss-${n}.png`, { w: TILE, h: TILE });
      const mark = G.asset('captcha-selected.png', { w: TILE, h: TILE });
      mark.style.cssText += 'position:absolute;left:0;top:0;display:none;pointer-events:none;';
      tile.append(pic, mark);
      tile.pic = pic;
      tile.mark = mark;
      tile.selected = false;
      tile.setSelected = (v) => {
        tile.selected = v;
        mark.style.display = v ? '' : 'none';
        // a tiny squish so the click feels like it did something
        tile.style.transform = v ? 'scale(0.92)' : '';
      };
      tile.style.transition = 'transform 0.1s';
      G.on(tile, 'click', () => {
        tile.setSelected(!tile.selected);
        maybeTwist();
      });
      grid.appendChild(tile);
      return tile;
    });

    const count = () => tiles.filter((t) => t.selected).length;

    // First time 8 are selected: one selected tile reloads as a new photo.
    const maybeTwist = () => {
      if (twistDone || count() !== 8) return;
      twistDone = true;
      G.timeout(() => {
        const victim = tiles.filter((t) => t.selected)[Math.floor(Math.random() * 8)];
        if (!victim) return;
        victim.photo = (victim.photo % 9) + 1; // a different boss photo
        G.setAsset(victim.pic, `boss-${victim.photo}.png`);
        victim.setSelected(false);
        G.clippy.say('Ooh, a new picture loaded! It is... also your boss. Of course it is.', 'panic');
      }, 350);
    };

    const info = G.make('div', 'stage16-info', '');
    info.style.cssText = 'min-height:18px;font-size:13px;font-weight:bold;';

    const verify = G.ui.button('Verify', () => {
      attempts++;
      const n = count();
      if (n === 9) {
        G.state.captchaPassed = true;
        win.close();
        G.clippy.say('You are... human. Verified. Congratulations, I guess. Press Send!', 'happy');
        return;
      }
      G.shake();
      if (n === 0) info.textContent = 'You selected nothing. Bold. Look closer.';
      else info.textContent = `Look closer. Some of these are definitely your boss. (${9 - n} missed)`;
      if (attempts === 2) G.clippy.say('Psst. ALL of them are your boss. Every. Single. One.', 'panic');
    });

    body.append(prompt, sub, grid, info, verify);
    const win = G.openWindow({
      title: 'Are you human?',
      icon: 'icon-warning.png',
      html: body,
      x: 440,
      y: 40,
      w: 440,
      h: 570,
      closable: false,
    });
  },

  check(G) {
    return G.state.captchaPassed || 'Captcha not solved. Are you even human?';
  },

  cleanup(G) {
    delete G.state.captchaPassed;
  },
});

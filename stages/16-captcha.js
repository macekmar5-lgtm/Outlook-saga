(function () {
  const GRID = 4;
  const SIZE = 100;
  const BUS_SQUARES = [5, 6, 7, 9, 10, 11];
  const EDGE_SQUARES = [];

  Game.registerStage({
    id: 16,
    name: 'Captcha',
    vibe: 'panic',
    assets: ['captcha-bus.png', 'captcha-header.png', 'captcha-frame.png', 'checkbox-checked.png'],

    setup(G) {
      G.state.captcha = false;

      const win = G.openWindow({ title: 'Are you human?', x: 400, y: 30, w: 470, h: 630, closable: false, alwaysOnTop: true });
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
        cell.dataset.n = i;
        const crop = G.make('div', 'captcha-crop');
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

      const skip = G.ui.button('Skip', () => fail('There are literally three buses. They are red. They are HUGE.'));
      const verify = G.ui.button('Verify', () => {
        const picked = cells.map((c, i) => (c.selected ? i : -1)).filter((i) => i >= 0);
        const allBus = BUS_SQUARES.every((i) => picked.includes(i));
        const noWrong = picked.every((i) => BUS_SQUARES.includes(i) || EDGE_SQUARES.includes(i));
        if (!allBus || !noWrong) {
          fail('Please select all matching images.');
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

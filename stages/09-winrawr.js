(function () {
  const FLEE_DISTANCE = 80;
  const W = 460;
  const H = 300;

  function openNag(G, sad) {
    const win = G.openWindow({ title: 'WinRAWR - Trial Expired', closable: false, w: W, h: H });
    G.state.winrawrWin = win;

    const body = G.make('div', 'winrawr-body');
    const logo = G.asset('winrawr-logo.png', { w: 100, h: 100, className: 'winrawr-logo' });
    const text = G.make('div', 'winrawr-text');
    if (sad) {
      text.append('Are you sure?\nWinRAWR is sad.\n', G.make('div', 'winrawr-face', ':('));
    } else {
      text.textContent = 'Your 40-day free trial ended 2,847 days ago.\n\nPlease buy a license.';
    }

    const buy = G.ui.button('Buy license', () =>
      G.popup({ title: 'WinRAWR', icon: 'error', text: 'Payment declined.\n\nYour card is also late.' })
    );
    buy.style.left = '60px';
    buy.style.top = '160px';
    buy.style.minWidth = '120px';

    const cont = G.ui.button('Continue trial', () => {
      win.close();
      G.state.winrawrWin = null;
      if (!sad) {
        G.timeout(() => openNag(G, true), 700);
      } else {
        G.state.winrawrDone = true;
        G.clippy.say(G.line('dismissed'), 'annoyed');
      }
    });
    cont.style.left = '290px';
    cont.style.top = '200px';

    body.append(logo, text, buy, cont);
    win.body.appendChild(body);

    G.on(window, 'pointermove', (e) => {
      if (!buy.isConnected) return;
      const p = G.toGame(e);
      const r = G.rectOf(buy);
      if (Math.hypot(p.x - (r.x + r.w / 2), p.y - (r.y + r.h / 2)) >= FLEE_DISTANCE) return;
      const box = G.rectOf(body);
      for (let tries = 0; tries < 20; tries++) {
        const left = Math.random() * Math.max(0, box.w - r.w);
        const top = Math.random() * Math.max(0, box.h - r.h);
        const cx = box.x + left + r.w / 2;
        const cy = box.y + top + r.h / 2;
        if (Math.hypot(p.x - cx, p.y - cy) > FLEE_DISTANCE + 40) {
          buy.style.left = left + 'px';
          buy.style.top = top + 'px';
          break;
        }
      }
    });
  }

  Game.registerStage({
    id: 9,
    name: 'WinRAWR',
    vibe: 'annoyed',
    assets: ['winrawr-logo.png'],

    setup(G) {
      G.state.winrawrDone = false;
      openNag(G, false);
    },

    check(G) {
      if (G.state.winrawrDone) return true;
      return 'WinRAWR is still nagging you. Sending is blocked until you continue the trial.';
    },

    cleanup(G) {
      delete G.state.winrawrDone;
      delete G.state.winrawrWin;
    },
  });
})();

(function () {
  const SECONDS = 20;
  const START_PERCENT = 3;
  const DEATH_COST_MINUTES = 2;
  const ZOOM_MS = 1400;
  const ZOOM_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)';
  const PORT_HIT_PAD = 40;

  const K = 640 / 762;
  const LAPTOP = { x: 300, y: 120, w: 640, h: Math.round(568 * K) };
  const HOLE = { x: 300 + 91 * K, y: 120 + 56 * K, w: 580 * K, h: (580 * K * 720) / 1280 };
  const PORT = { x: 890, y: 505, w: 40, h: 40 };
  const CHARGER = { x: 90, y: 470, w: 140, h: 220 };
  const CHARGER_IMG = { w: 400, h: 629 };
  const CHARGER_FACE = { x: 140, y: 145 };
  const PLUG_DEPTH = 6;

  function pluggedPosition() {
    const s = Math.min(CHARGER.w / CHARGER_IMG.w, CHARGER.h / CHARGER_IMG.h);
    const face = {
      x: (CHARGER.w - CHARGER_IMG.w * s) / 2 + CHARGER_FACE.x * s,
      y: (CHARGER.h - CHARGER_IMG.h * s) / 2 + CHARGER_FACE.y * s,
    };
    const dx = face.x - CHARGER.w / 2;
    const dy = face.y - CHARGER.h / 2;
    const rotated = { x: dy, y: -dx };
    const target = { x: PORT.x + PORT.w - PLUG_DEPTH, y: PORT.y + PORT.h / 2 };
    return { x: target.x - rotated.x - CHARGER.w / 2, y: target.y - rotated.y - CHARGER.h / 2 };
  }

  const place = (el, r) => {
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    if (r.w) el.style.width = r.w + 'px';
    if (r.h) el.style.height = r.h + 'px';
  };

  Game.registerStage({
    id: 13,
    name: 'Battery 3% (zoom out)',
    vibe: 'panic',
    assets: ['desk-background.png', 'laptop.png', 'laptop-port.png', 'charger.png', 'tray-battery.png'],

    setup(G) {
      const stage = this;
      const s = (G.state.battery = { remaining: SECONDS, plugged: false, dead: false, zoomed: false });
      const root = document.getElementById('game');
      const screen = document.getElementById('screen');

      const back = G.make('div', 'world world-back');
      back.appendChild(G.asset('desk-background.png', { w: 1280, h: 720, className: 'world-bg' }));
      const front = G.make('div', 'world world-front');
      const laptop = G.asset('laptop.png', { w: LAPTOP.w, h: LAPTOP.h, className: 'world-laptop' });
      place(laptop, LAPTOP);
      const port = G.asset('laptop-port.png', { w: PORT.w, h: PORT.h, className: 'world-port' });
      place(port, PORT);
      const charger = G.asset('charger.png', { w: CHARGER.w, h: CHARGER.h, className: 'world-plug' });
      place(charger, CHARGER);
      front.append(laptop, port, charger);
      const hud = G.make('div', 'world world-hud');
      const readout = G.make('div', 'world-text');
      hud.appendChild(readout);
      root.insertBefore(back, screen);
      root.appendChild(front);
      root.appendChild(hud);

      const CLOSE = 1280 / HOLE.w;
      const CAM_CLOSE = `translate(${-HOLE.x * CLOSE}px, ${-HOLE.y * CLOSE}px) scale(${CLOSE})`;
      const CAM_FAR = 'translate(0px, 0px) scale(1)';
      const IN_HOLE = `translate(${HOLE.x}px, ${HOLE.y}px) scale(${HOLE.w / 1280})`;
      const setCamera = (cam, ms) => {
        const transition = ms ? `transform ${ms}ms ${ZOOM_EASE}` : 'none';
        for (const el of [back, front]) {
          el.style.transition = transition;
          el.style.transform = cam;
        }
        screen.style.transition = transition;
        screen.style.transform = `${cam} ${IN_HOLE}`;
      };

      const zoomOut = () => {
        s.zoomed = true;
        screen.style.transformOrigin = '0 0';
        screen.style.pointerEvents = 'none';
        setCamera(CAM_CLOSE, 0);
        root.classList.add('zoomed-out');
        void screen.offsetWidth;
        requestAnimationFrame(() => setCamera(CAM_FAR, ZOOM_MS));
      };
      const zoomIn = (ms) => {
        s.zoomed = false;
        setCamera(CAM_CLOSE, ms);
        return new Promise((resolve) => setTimeout(() => {
          root.classList.remove('zoomed-out');
          screen.style.transition = '';
          screen.style.transform = '';
          screen.style.pointerEvents = '';
          resolve();
        }, ms));
      };
      G.track(() => {
        back.remove();
        front.remove();
        hud.remove();
        root.classList.remove('zoomed-out');
        screen.style.transform = '';
        screen.style.transition = '';
        screen.style.pointerEvents = '';
      });

      const show = () => {
        const pct = Math.max(0, (s.remaining / SECONDS) * START_PERCENT).toFixed(1);
        const secs = Math.max(0, Math.ceil(s.remaining));
        G.tray.setText('battery', s.plugged ? 'Charging' : `${pct}%`);
        readout.textContent = s.plugged ? 'Charging' : `Battery ${pct}%  (${secs}s)\nPlug in the charger!`;
      };
      show();

      const drag = G.makeDraggable(charger, {
        revert: true,
        onDrop(el, point) {
          if (!s.zoomed || s.plugged || s.dead) return false;
          if (!G.hitTest(port, point, PORT_HIT_PAD)) {
            G.clippy.say(G.line('wrongSpot'), 'panic');
            return false;
          }
          s.plugged = true;
          drag.reset();
          charger.classList.add('plugged-in');
          place(charger, pluggedPosition());
          show();
          G.clippy.say(G.line('charging'), 'panic');
          G.timeout(() => zoomIn(ZOOM_MS), 1200);
          return true;
        },
      });

      G.on(window, 'pointerdown', (e) => {
        if (!s.zoomed || s.plugged || s.dead || charger.contains(e.target)) return;
        s.remaining -= 1;
        show();
      }, true);

      G.interval(() => {
        if (s.plugged || s.dead) return;
        if (document.querySelector('#layer-popups .popup-blocker')) return;
        if (!s.zoomed) {
          zoomOut();
          return;
        }
        s.remaining -= 0.1;
        show();
        if (s.remaining > 0) return;

        s.dead = true;
        zoomIn(300)
          .then(() => G.blackout('Laptop died.', 2000))
          .then(() => {
            if (Game.over || G.stage !== stage) return;
            G.clock.add(DEATH_COST_MINUTES);
            G.restartStage();
            if (!Game.over) G.clippy.say(G.line('revived', { minutes: DEATH_COST_MINUTES }), 'panic');
          });
      }, 100);
    },

    check(G) {
      const s = G.state.battery;
      if (s.plugged) return true;
      const pct = Math.max(0, (s.remaining / SECONDS) * START_PERCENT).toFixed(1);
      return `Battery at ${pct}%. Plug the charger into the laptop first!`;
    },

    cleanup(G) {
      G.tray.setText('battery', '100%');
      delete G.state.battery;
    },
  });
})();

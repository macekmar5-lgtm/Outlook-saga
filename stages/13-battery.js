/* =============================================================================
 *  STAGE 13 — Battery at 3%  (the camera zooms out to the real laptop)   DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    After the "Battery at 3%" popup, the whole game screen shrinks into the
 *    display of a laptop standing on a desk: we zoom out of the monitor into
 *    the "real world". The game keeps running (tiny) inside the laptop. A big
 *    battery readout counts down 20 seconds. Drag the charger lying on the desk
 *    into the laptop's charging port. Every click that isn't on the charger
 *    costs 1 extra second. Plugged in -> "Charging", the camera zooms back into
 *    the screen, then press SUBMIT.
 *    At 0%: zoom back in, the screen goes black ("Laptop died."), costs 2
 *    minutes on the clock, and the stage restarts (the game does NOT end).
 *    Pass: plugged in.
 *
 *  ART (positions below are in game pixels on the 1280x720 scene — change them
 *  to match the drawings):
 *    desk-background.png  1280x720  the desk / room around the laptop
 *    laptop.png           the laptop, with its SCREEN AREA TRANSPARENT
 *                         (the live game shows through that hole: see HOLE)
 *    charger.png          the charger plug + cable lying on the desk
 *    tray-battery.png     (tray icon, already used elsewhere)
 * ========================================================================== */

(function () {
  // ---- tuning ----
  const SECONDS = 20;
  const START_PERCENT = 3;
  const DEATH_COST_MINUTES = 2;
  const ZOOM_MS = 1400;         // how long the camera pull-back (and push-in) takes
  const ZOOM_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)'; // slow start, smooth glide, soft landing
  const PORT_HIT_PAD = 40;      // extra px around the port that still counts

  // ---- layout of the "real world" scene (1280x720) ----
  // laptop.png is 762x568; its transparent screen hole is x91 y56 580x323 (measured).
  // The laptop is drawn at 84% (640 wide); the game screen is fitted into the hole.
  const K = 640 / 762;
  const LAPTOP = { x: 300, y: 120, w: 640, h: Math.round(568 * K) };              // laptop.png position + size
  const HOLE = { x: 300 + 91 * K, y: 120 + 56 * K, w: 580 * K, h: (580 * K * 720) / 1280 }; // keep 16:9
  const PORT = { x: 890, y: 505, w: 40, h: 40 };      // charging port on the right of the keyboard base (laptop-port.png)
  const CHARGER = { x: 90, y: 470, w: 140, h: 220 };  // charger.png on the desk (box matches the 400x629 drawing)
  // When plugged in, the charger turns 90 degrees LEFT, so its top (the prongs) points
  // left, straight into the port. These are measured in charger.png's own pixels:
  const CHARGER_IMG = { w: 400, h: 629 };             // charger.png size
  const CHARGER_FACE = { x: 140, y: 145 };            // middle of the plug face, where the prongs start
  const PLUG_DEPTH = 6;                               // how far the plug face sits over the socket (px)

  /** Where the (rotated) charger box goes so its plug face lands on the port's right edge. */
  function pluggedPosition() {
    const s = Math.min(CHARGER.w / CHARGER_IMG.w, CHARGER.h / CHARGER_IMG.h); // object-fit: contain
    const face = {
      x: (CHARGER.w - CHARGER_IMG.w * s) / 2 + CHARGER_FACE.x * s,
      y: (CHARGER.h - CHARGER_IMG.h * s) / 2 + CHARGER_FACE.y * s,
    };
    // offset of the face from the box centre, after rotate(-90deg): (dx, dy) -> (dy, -dx)
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
    // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "13"
    assets: ['desk-background.png', 'laptop.png', 'laptop-port.png', 'charger.png', 'tray-battery.png'],

    setup(G) {
      const stage = this;
      const s = (G.state.battery = { remaining: SECONDS, plugged: false, dead: false, zoomed: false });
      const root = document.getElementById('game');
      const screen = document.getElementById('screen');

      // --- the real world: desk BEHIND the game screen, laptop + charger IN FRONT ---
      const back = G.make('div', 'world world-back');
      back.appendChild(G.asset('desk-background.png', { w: 1280, h: 720, className: 'world-bg' }));
      const front = G.make('div', 'world world-front');
      const laptop = G.asset('laptop.png', { w: LAPTOP.w, h: LAPTOP.h, className: 'world-laptop' });
      place(laptop, LAPTOP);
      // The charging port: a small picture (placeholder box until laptop-port.png is drawn)
      const port = G.asset('laptop-port.png', { w: PORT.w, h: PORT.h, className: 'world-port' });
      place(port, PORT);
      const charger = G.asset('charger.png', { w: CHARGER.w, h: CHARGER.h, className: 'world-plug' });
      place(charger, CHARGER);
      front.append(laptop, port, charger);
      // The battery readout is NOT part of the camera: it stays put on screen while we zoom.
      const hud = G.make('div', 'world world-hud');
      const readout = G.make('div', 'world-text');
      hud.appendChild(readout);
      root.insertBefore(back, screen);
      root.appendChild(front);
      root.appendChild(hud);

      // --- the CAMERA ---
      // The desk, the laptop and the game screen are one scene. The camera starts zoomed
      // in so far that the laptop's screen hole exactly fills the view (looks identical to
      // normal play), then pulls back to the whole desk. Every layer gets the SAME camera
      // transform, so the game never slips out of the hole while moving.
      const CLOSE = 1280 / HOLE.w; // zoom where the hole fills the view
      const CAM_CLOSE = `translate(${-HOLE.x * CLOSE}px, ${-HOLE.y * CLOSE}px) scale(${CLOSE})`;
      const CAM_FAR = 'translate(0px, 0px) scale(1)';
      const IN_HOLE = `translate(${HOLE.x}px, ${HOLE.y}px) scale(${HOLE.w / 1280})`; // screen -> hole
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
        setCamera(CAM_CLOSE, 0);        // start: right up against the screen (no visible jump)
        root.classList.add('zoomed-out');
        void screen.offsetWidth;        // apply the start position before animating
        requestAnimationFrame(() => setCamera(CAM_FAR, ZOOM_MS)); // ...and pull back
      };
      const zoomIn = (ms) => {
        s.zoomed = false;
        setCamera(CAM_CLOSE, ms);       // push back in until the screen fills the view
        return new Promise((resolve) => setTimeout(() => {
          root.classList.remove('zoomed-out');
          screen.style.transition = '';
          screen.style.transform = '';  // same picture as CAM_CLOSE, so no jump
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

      // --- drag the charger into the port ---
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
          charger.classList.add('plugged-in');          // CSS: turn 90 degrees left (with a quick snap)
          place(charger, pluggedPosition());
          show();
          G.clippy.say(G.line('charging'), 'panic');
          G.timeout(() => zoomIn(ZOOM_MS), 1200); // back into the screen; then press SUBMIT
          return true;
        },
      });

      // --- every click that isn't on the charger costs a second ---
      G.on(window, 'pointerdown', (e) => {
        if (!s.zoomed || s.plugged || s.dead || charger.contains(e.target)) return;
        s.remaining -= 1;
        show();
      }, true);

      // --- countdown (waits for the popup to close, then zooms out) ---
      G.interval(() => {
        if (s.plugged || s.dead) return;
        if (document.querySelector('#layer-popups .popup-blocker')) return; // pause while a popup is open
        if (!s.zoomed) {
          zoomOut();
          return;
        }
        s.remaining -= 0.1;
        show();
        if (s.remaining > 0) return;

        // Laptop died: back into the screen, black, lose time, try again.
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

/* =============================================================================
 *  STAGE 13 — Battery at 3%                                      STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    20-second countdown; the battery % shows in the tray (tray-battery.png).
 *    The charger plug lies on the desktop, partly hidden under the mail window
 *    (left edge). The laptop port is at the right edge of the screen. Drag the
 *    plug onto the port -> tray says "Charging". Every click that isn't on the
 *    plug costs 1 extra second. (The countdown pauses while a popup is open.)
 *    At 0: the screen goes black ("Laptop died.") for 2 seconds, costs 2 minutes
 *    on the clock, and the stage restarts — the game does NOT end.
 *    Pass: plugged in.
 *
 *  ASSETS: charger-plug.png, laptop-port.png, tray-battery.png
 * ========================================================================== */

(function () {
  const SECONDS = 20;
  const START_PERCENT = 3;
  const DEATH_COST_MINUTES = 2;

  Game.registerStage({
    id: 13,
    name: 'Battery 3%',
    vibe: 'panic',
    error: 'Battery at 3%. Plug in your laptop.',
    clippy: 'BATTERY. THREE. PERCENT. The charger is on the desktop, UNDER the email. The port is on the RIGHT. STOP CLICKING THINGS, EVERY CLICK COSTS US A SECOND.',
    hint: 'The charger plug peeks out from under the left edge of the mail window. Drag it onto the laptop port at the right edge of the screen.',
    retry: ['WE ARE STILL ON BATTERY. I CAN SEE THE LIGHT.', 'PLUG. INTO. PORT. I am begging you.'],
    assets: ['charger-plug.png', 'laptop-port.png', 'tray-battery.png'],

    setup(G) {
      const s = (G.state.battery = { remaining: SECONDS, plugged: false, dead: false });

      const plug = G.addProp({ id: 'plug', asset: 'charger-plug.png', x: 66, y: 440, w: 90, h: 60 });
      const port = G.addProp({ id: 'port', asset: 'laptop-port.png', x: 1204, y: 230, w: 70, h: 50 });

      const show = () => {
        if (s.plugged) return;
        const pct = Math.max(0, (s.remaining / SECONDS) * START_PERCENT).toFixed(1);
        G.tray.setText('battery', `${pct}% (${Math.max(0, Math.ceil(s.remaining))}s)`);
      };
      show();
      G.highlight(G.tray.get('battery'), 3000);

      const plugIn = () => {
        s.plugged = true;
        plug.style.left = port.offsetLeft - 80 + 'px';
        plug.style.top = port.offsetTop - 5 + 'px';
        G.tray.setText('battery', 'Charging');
        G.clippy.say("IT'S CHARGING. I CAN FEEL MY PIXELS AGAIN. Send the email. SEND IT.", 'panic');
      };

      G.dragGhost(plug, {
        canDrag: () => !s.plugged && !s.dead,
        onDrop(point) {
          if (G.hitTest(port, point)) plugIn();
          else G.clippy.say('THAT IS NOT THE PORT. THE PORT IS ON THE RIGHT.', 'panic');
        },
      });

      // Every click that isn't on the plug costs a second.
      G.on(window, 'pointerdown', (e) => {
        if (s.plugged || s.dead || plug.contains(e.target)) return;
        s.remaining -= 1;
        show();
      }, true);

      G.interval(() => {
        if (s.plugged || s.dead) return;
        if (document.querySelector('#layer-popups .popup-blocker')) return; // pause while a popup is open
        s.remaining -= 0.1;
        show();
        if (s.remaining > 0) return;

        // Laptop died: black screen, lose time, try again.
        s.dead = true;
        G.blackout('Laptop died.', 2000).then(() => {
          if (Game.over || G.stage !== this) return;
          G.clock.add(DEATH_COST_MINUTES);
          G.restartStage();
          if (!Game.over) G.clippy.say(`WE ARE BACK. That cost ${DEATH_COST_MINUTES} minutes. 20 seconds. AGAIN. Plug. It. In.`, 'panic');
        });
      }, 100);
    },

    check(G) {
      const s = G.state.battery;
      if (s.plugged) return true;
      const pct = Math.max(0, (s.remaining / SECONDS) * START_PERCENT).toFixed(1);
      return `Battery at ${pct}%. Plug the charger into the laptop port first!`;
    },

    cleanup(G) {
      G.tray.setText('battery', '100%');
      delete G.state.battery;
    },
  });
})();

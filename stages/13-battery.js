/* =============================================================================
 *  STAGE 13 — Battery at 3%                                      STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The battery is at 3% and draining (about 30 seconds to 0%). A charger plug
 *    lies on the right of the desktop; the laptop port is bottom left. The
 *    player drags the plug into the port. Every click that ISN'T on the plug
 *    drains the battery faster. Reaching 0%: the screen goes black for a
 *    second, it costs a minute, the battery is back at 3% and the plug jumps
 *    back. Pass when plugged in.
 *
 *  NOTES
 *    - Plug and port live in the windows layer with a high z-index, so the
 *      plug stays visible while it is dragged across the mail window.
 *    - The blackout just fades #desktop out (the page behind it is black).
 *    - Changes the persistent 'battery' tray item; cleanup puts back
 *      tray-battery.png / '100%'.
 *
 *  ASSETS
 *    charger-plug.png (90x60), laptop-port.png (70x50),
 *    tray-battery-low.png (20x20, listed with the OS art)
 * ========================================================================== */

Game.registerStage({
  id: 13,
  name: 'Battery 3%',
  vibe: 'panic',
  error: 'Battery at 3%. Plug in your laptop.',
  clippy: 'Your battery is DYING and so am I, on the inside. FIND THE CHARGER. Stop clicking things!!',
  hint: 'Drag the charger plug (right side of the desktop) into the laptop port (bottom left). Every other click drains the battery.',
  retry: [
    'Sending email uses battery too, you know!! PLUG. IT. IN.',
    'The charger is on the right. The port is bottom left. I believe in you. Barely.',
  ],
  assets: ['charger-plug.png', 'laptop-port.png', 'tray-battery-low.png'],

  setup(G) {
    const START = 3;          // percent
    const DRAIN = 0.01;       // percent per 100 ms tick -> 3% lasts ~30 s
    const CLICK_DRAIN = 0.3;  // percent per click that isn't on the plug
    const PROP_Z = 5000;      // above every window, below popups (separate layer)

    G.state.battery = START;
    G.state.charging = false;
    const desktop = document.getElementById('desktop');

    // ---- power meter window ----
    const meter = G.make('div', 'stage13-meter');
    meter.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:center;padding-top:4px;';
    const pct = G.make('div', 'stage13-pct', START + '%');
    pct.style.cssText = 'font-size:34px;font-weight:bold;';
    const bar = G.ui.progress(START / 100);
    bar.style.cssText = 'width:220px;height:20px;';
    const status = G.make('div', 'stage13-status', 'On battery. Not for long.');
    meter.append(pct, bar, status);
    G.openWindow({ title: 'Power Meter', icon: 'tray-battery-low.png', html: meter, x: 985, y: 30, w: 270, h: 170, closable: false });

    // ---- props: charger plug (right) and laptop port (bottom left) ----
    const prop = (file, w, h, x, y, cls) => {
      const wrap = G.make('div', cls);
      wrap.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${PROP_Z};`;
      wrap.appendChild(G.asset(file, { w, h }));
      G.layers.windows.appendChild(wrap);
      G.track(() => wrap.remove());
      return wrap;
    };
    const port = prop('laptop-port.png', 70, 50, 28, 470, 'stage13-port');
    const plug = prop('charger-plug.png', 90, 60, 1080, 250, 'stage13-plug');
    port.title = 'Laptop port';
    plug.title = 'Charger';

    // ---- battery display ----
    const show = () => {
      const b = G.state.battery;
      pct.textContent = G.state.charging ? Math.floor(b) + '%' : b.toFixed(1) + '%';
      bar.set(b / 100);
      G.tray.setText('battery', G.state.charging ? 'Charging' : Math.ceil(b) + '%');
    };
    G.tray.setIcon('battery', 'tray-battery-low.png');
    show();

    // ---- dying: blackout, lose a minute, start over at 3% ----
    let dead = false;
    let lastPanic = START;
    const die = () => {
      dead = true;
      G.state.battery = 0;
      show();
      drag.reset();
      desktop.style.transition = 'opacity 0.15s';
      desktop.style.opacity = '0';
      G.timeout(() => {
        desktop.style.opacity = '';
        G.state.battery = START;
        lastPanic = START;
        dead = false;
        show();
        G.clock.add(1);
        G.shake();
        G.clippy.say('The laptop DIED. That cost you a minute. It rebooted at 3%. PLUG. IN. THE. CHARGER.', 'panic');
      }, 1200);
    };

    const drain = (amount) => {
      if (G.state.charging || dead) return;
      G.state.battery = Math.max(0, G.state.battery - amount);
      if (G.state.battery <= 0) return die();
      show();
      const whole = Math.ceil(G.state.battery);
      if (whole < lastPanic) {
        lastPanic = whole;
        G.clippy.say(whole === 2 ? '2%!!! Why are you so CALM?!' : '1%!!!!! I can see the light!!! Is that the light?!', 'panic');
      }
    };

    G.interval(() => {
      if (G.state.charging) {
        if (G.state.battery < 100) {
          G.state.battery = Math.min(100, G.state.battery + 1.5);
          show();
        }
        return;
      }
      drain(DRAIN);
    }, 100);

    // Clicking anything except the plug drains extra battery.
    G.on(window, 'pointerdown', (e) => {
      if (plug.contains(e.target)) return;
      drain(CLICK_DRAIN);
    }, true);

    // ---- the plug ----
    const drag = G.makeDraggable(plug, {
      revert: true,
      onDrop(el) {
        if (dead || !G.overlaps(el, port, 10)) return false;
        G.state.charging = true;
        drag.destroy();
        // Snap the plug neatly next to the port.
        const p = G.rectOf(port);
        el.style.translate = '';
        el.style.left = p.x + p.w - 12 + 'px';
        el.style.top = p.y - 5 + 'px';
        G.tray.setIcon('battery', 'tray-battery.png');
        status.textContent = 'Plugged in. Charging.';
        show();
        G.sound('plug.wav');
        G.clippy.say("IT'S CHARGING. Oh thank goodness. I was seeing my whole life flash before my eyes. It was all just paperclips.", 'happy');
        return true;
      },
    });
    G.track(drag.destroy);
    G.highlight(plug, 3000);
  },

  check(G) {
    if (G.state.charging) return true;
    return `Battery at ${Math.ceil(G.state.battery)}%. Plug in the charger!`;
  },

  cleanup(G) {
    G.tray.setText('battery', '100%');
    G.tray.setIcon('battery', 'tray-battery.png');
    const desktop = document.getElementById('desktop');
    desktop.style.opacity = '';
    desktop.style.transition = '';
    delete G.state.battery;
    delete G.state.charging;
  },
});

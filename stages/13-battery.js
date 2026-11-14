/* =============================================================================
 *  STAGE 13 — Battery at 3%                                      STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The battery is at 3% and counting down. A charger lies somewhere on the
 *    desktop and a laptop port sits elsewhere. The player drags the charger
 *    plug into the port before it hits 0%. Every click that ISN'T on the plug
 *    drains the battery faster. Reaching 0%: the screen goes black for a second,
 *    battery resets to 3% and the plug jumps back (cost: a minute, not a reset).
 *    Pass when plugged in.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.battery = 3; G.state.charging = false
 *      - Tray: G.tray.setText('battery', '3%') and G.tray.setIcon('battery', 'tray-battery-low.png').
 *        RESET both in cleanup (it's a persistent tray item!).
 *      - Countdown: a small window with G.ui.progress(0.03) + big "3%" text.
 *      - const plug = G.asset('charger-plug.png', { w: 90, h: 60 }) at e.g. left 1000, top 420
 *        inside an absolutely positioned wrapper in G.layers.icons; G.track(() => wrapper.remove())
 *      - const port = G.asset('laptop-port.png', { w: 70, h: 50 }) placed far away (e.g. left 60, top 600)
 *      - G.makeDraggable(plugWrapper, { revert: true, onDrop(el) {
 *            if (!G.overlaps(el, port, 10)) return false;
 *            G.state.charging = true; G.tray.setText('battery', 'Charging'); return true; } })
 *      - G.interval(() => drain 0.1% per tick, 100) ; G.on(window, 'pointerdown', extra drain, true)
 *    check:   G.state.charging || `Battery at ${Math.ceil(G.state.battery)}%. Plug in the charger!`
 *    cleanup: G.tray.setText('battery', '100%'); G.tray.setIcon('battery', 'tray-battery.png');
 *             delete the state flags.
 *
 *  JUICE IDEAS
 *    - Screen gets darker as battery drops: a full-screen G.asset('battery-dim.png')
 *      overlay whose opacity rises (no CSS colour overlays — art only).
 *    - Clippy panics more the lower it gets.
 *
 *  ASSETS: charger-plug.png, laptop-port.png, tray-battery-low.png
 * ========================================================================== */

Game.registerStage({
  id: 13,
  name: 'Battery 3%',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'panic',
  error: 'Battery at 3%. Plug in your laptop.',
  clippy: 'Your battery is DYING and so am I, on the inside. FIND THE CHARGER. Stop clicking things!!',
  hint: 'Drag the charger plug on the desktop into the laptop port. Every other click drains the battery.',
  assets: ['charger-plug.png', 'laptop-port.png', 'tray-battery-low.png'],

  setup(G) {
    // TODO: see IMPLEMENTATION PLAN above
  },

  check(G) {
    // TODO
    return true;
  },

  cleanup(G) {
    // TODO
  },
});

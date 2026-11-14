/* =============================================================================
 *  STAGE 17 — No internet connection                             STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The internet is gone: the WiFi tray icon is crossed out. A network cable
 *    lies loose on the desktop and a wall socket is on the other side. The
 *    player drags the cable plug into the socket. Pass when plugged in.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.online = false
 *      - G.tray.setIcon('wifi', 'tray-wifi-off.png')  — persistent tray item: put
 *        'tray-wifi.png' back in cleanup!
 *      - const socket = G.asset('wall-socket.png', { w: 80, h: 100 }) placed at e.g. left 1150, top 300
 *        (absolutely positioned in G.layers.icons; G.track(() => socket.remove()))
 *      - const cable = G.asset('network-cable.png', { w: 140, h: 90 }) at left 260, top 600
 *      - G.makeDraggable(cable, { revert: true, onDrop(el) {
 *            if (!G.overlaps(el, socket, 15)) return false;
 *            G.state.online = true; G.tray.setIcon('wifi', 'tray-wifi.png');
 *            return true; } })
 *      - Clippy is at the bottom right — keep the socket away from him.
 *    check:   G.state.online || 'Still no internet. The cable is right there.'
 *    cleanup: G.tray.setIcon('wifi', 'tray-wifi.png'); delete G.state.online
 *
 *  JUICE IDEAS
 *    - The cable is slightly too short: it springs back the first time.
 *    - The socket moves once when the plug gets close (Clippy: "Sorry, that was me.").
 *
 *  ASSETS: network-cable.png, wall-socket.png, tray-wifi-off.png (listed with the OS art)
 * ========================================================================== */

Game.registerStage({
  id: 17,
  name: 'No internet',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'panic',
  error: 'No internet connection.',
  clippy: "THE INTERNET IS GONE. The cable is RIGHT THERE. I can't plug it in, I DON'T HAVE HANDS. I HAVE NEVER HAD HANDS.",
  hint: 'Drag the network cable on the desktop into the wall socket.',
  assets: ['network-cable.png', 'wall-socket.png', 'tray-wifi-off.png'],

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

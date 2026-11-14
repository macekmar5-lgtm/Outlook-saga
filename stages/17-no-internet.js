/* =============================================================================
 *  STAGE 17 — No internet connection                             STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The internet is gone: the WiFi tray icon is crossed out. A network cable
 *    lies loose on the desktop (bottom left) and a wall socket is on the right.
 *    The player drags the cable into the socket. Pass when plugged in.
 *
 *  NOTES
 *    - Twist: the first time the cable gets close, the socket dodges to a new
 *      spot. Clippy: "Sorry, that was me."
 *    - Cable and socket live in the windows layer with a high z-index, so the
 *      cable stays visible while it is dragged across the mail window.
 *    - Changes the persistent 'wifi' tray item; cleanup puts tray-wifi.png back.
 *
 *  ASSETS
 *    network-cable.png (140x90), wall-socket.png (80x100),
 *    tray-wifi-off.png (listed with the OS art)
 * ========================================================================== */

Game.registerStage({
  id: 17,
  name: 'No internet',
  vibe: 'panic',
  error: 'No internet connection.',
  clippy: "THE INTERNET IS GONE. The cable is RIGHT THERE. I can't plug it in, I DON'T HAVE HANDS. I HAVE NEVER HAD HANDS.",
  hint: 'Drag the network cable (bottom left) into the wall socket (right side of the desktop).',
  retry: [
    'Emails do not travel through the AIR. Well. They do. But not THIS one.',
    'Cable. Socket. Together. Like a family.',
  ],
  assets: ['network-cable.png', 'wall-socket.png', 'tray-wifi-off.png'],

  setup(G) {
    const PROP_Z = 5000; // above every window
    const SOCKET_START = { x: 1160, y: 170 };
    const SOCKET_DODGE = { x: 1000, y: 40 };

    G.state.online = false;
    G.tray.setIcon('wifi', 'tray-wifi-off.png');
    const wifi = G.tray.get('wifi');
    if (wifi) wifi.title = 'Not connected';

    const prop = (file, w, h, x, y, cls) => {
      const wrap = G.make('div', cls);
      wrap.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${PROP_Z};`;
      wrap.appendChild(G.asset(file, { w, h }));
      G.layers.windows.appendChild(wrap);
      G.track(() => wrap.remove());
      return wrap;
    };
    const socket = prop('wall-socket.png', 80, 100, SOCKET_START.x, SOCKET_START.y, 'stage17-socket');
    const cable = prop('network-cable.png', 140, 90, 24, 470, 'stage17-cable');
    socket.title = 'Wall socket';
    cable.title = 'Network cable';
    // (No transition on the dodge: the socket must be out of reach instantly,
    // or a quick drop would still land on its old spot mid-animation.)

    // The socket dodges once when the cable gets close.
    let dodged = false;
    const center = (el) => { const r = G.rectOf(el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
    const onMove = (el) => {
      if (dodged) return;
      const a = center(el);
      const b = center(socket);
      if (Math.hypot(a.x - b.x, a.y - b.y) > 130) return;
      dodged = true;
      socket.style.left = SOCKET_DODGE.x + 'px';
      socket.style.top = SOCKET_DODGE.y + 'px';
      G.clippy.say('Sorry, that was me. I moved the socket. Old habits. Try again!', 'annoyed');
    };

    const drag = G.makeDraggable(cable, {
      revert: true,
      onMove,
      onDrop(el) {
        if (!G.overlaps(el, socket, 15)) return false;
        G.state.online = true;
        drag.destroy();
        // Snap the cable plug into the socket.
        const s = G.rectOf(socket);
        el.style.translate = '';
        el.style.left = s.x - 120 + 'px';
        el.style.top = s.y + 20 + 'px';
        G.tray.setIcon('wifi', 'tray-wifi.png');
        if (wifi) wifi.title = 'Connected';
        G.sound('plug.wav');
        G.clippy.say("WE'RE ONLINE!! I can feel the internet again. It feels like... 56k. Press Send!", 'happy');
        return true;
      },
    });
    G.track(drag.destroy);
    G.highlight(cable, 3000);
  },

  check(G) {
    return G.state.online || 'Still no internet. The cable is right there.';
  },

  cleanup(G) {
    G.tray.setIcon('wifi', 'tray-wifi.png');
    const wifi = G.tray.get('wifi');
    if (wifi) wifi.title = 'Connected';
    delete G.state.online;
  },
});

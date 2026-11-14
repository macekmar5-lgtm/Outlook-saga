/* =============================================================================
 *  STAGE 17 — No internet connection                             STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The tray wifi shows disconnected (tray-wifi-off.png) and the mail status
 *    bar says so. A network cable lies on the desktop, partly under the mail
 *    window; the wall socket is at the bottom left. Drag the cable onto the
 *    socket -> the tray shows connected again.  Pass: cable plugged in.
 *
 *  ASSETS: network-cable.png, wall-socket.png, tray-wifi-off.png, tray-wifi.png
 * ========================================================================== */

(function () {
  Game.registerStage({
    id: 17,
    name: 'No internet',
    vibe: 'panic',
    error: 'No internet connection.',
    clippy: "THE INTERNET IS GONE. THE CABLE IS RIGHT THERE. I CAN'T PLUG IT IN. I DON'T HAVE HANDS. I HAVE NEVER HAD HANDS.",
    hint: 'The network cable sticks out from under the left edge of the mail window. Drag it onto the wall socket at the bottom left.',
    retry: ['STILL OFFLINE. The cable. The socket. Make them touch.', 'Have you tried turning the internet on and off again? No. Plug the cable.'],
    assets: ['network-cable.png', 'wall-socket.png', 'tray-wifi-off.png', 'tray-wifi.png'],

    setup(G) {
      G.state.online = false;
      G.tray.setIcon('wifi', 'tray-wifi-off.png');
      G.tray.get('wifi').title = 'Disconnected';
      G.mail.status = 'Disconnected (completely)';

      const socket = G.addProp({ id: 'socket', asset: 'wall-socket.png', x: 16, y: 588, w: 80, h: 80 });
      const cable = G.addProp({ id: 'cable', asset: 'network-cable.png', x: 50, y: 420, w: 140, h: 90 });
      G.timeout(() => G.highlight(socket, 3000), 600);

      G.dragGhost(cable, {
        canDrag: () => !G.state.online,
        onDrop(point) {
          if (!G.hitTest(socket, point)) {
            G.clippy.say('THAT IS NOT A SOCKET. THE SOCKET IS BOTTOM LEFT.', 'panic');
            return;
          }
          G.state.online = true;
          cable.style.left = '10px';
          cable.style.top = '520px';
          G.tray.setIcon('wifi', 'tray-wifi.png');
          G.tray.get('wifi').title = 'Connected';
          G.mail.status = Game.CONFIG.STATUS_TEXT;
          G.clippy.say('WE ARE ONLINE. I can feel the internet. It is mostly cat pictures. SEND. THE. EMAIL.', 'panic');
        },
      });
    },

    check(G) {
      return G.state.online || 'Still no internet. The cable is RIGHT THERE.';
    },

    cleanup(G) {
      G.tray.setIcon('wifi', 'tray-wifi.png');
      G.tray.get('wifi').title = 'Connected';
      G.mail.status = Game.CONFIG.STATUS_TEXT;
      delete G.state.online;
    },
  });
})();

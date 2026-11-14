(function () {
  const SOCKET_HIT_PAD = 70;

  Game.registerStage({
    id: 17,
    name: 'No internet',
    vibe: 'panic',
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
          if (!G.hitTest(socket, point, SOCKET_HIT_PAD)) {
            G.clippy.say(G.line('wrongSpot'), 'panic');
            return;
          }
          G.state.online = true;
          cable.style.left = '10px';
          cable.style.top = '520px';
          G.tray.setIcon('wifi', 'tray-wifi.png');
          G.tray.get('wifi').title = 'Connected';
          G.mail.status = Game.CONFIG.STATUS_TEXT;
          G.clippy.say(G.line('online'), 'panic');
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

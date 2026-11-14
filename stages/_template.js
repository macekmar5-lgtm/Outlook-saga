Game.registerStage({
  id: 99,
  name: 'Example: Do Not Disturb',

  vibe: 'annoyed',
  error: 'Recipient is in Do Not Disturb mode. So are you.',
  clippy: "You turned on Do Not Disturb. It's in the tray. Bottom right. Where it always is.",
  hint: 'Click the "DND" item in the taskbar tray, next to the clock.',
  retry: [
    'Still disturbed. Still not delivering.',
    'The tray. The TRAY.',
  ],
  assets: ['tray-dnd.png', 'tray-dnd-on.png'],

  setup(G) {
    G.state.dnd = true;

    const item = G.tray.add('dnd', 'Do Not Disturb', () => {
      G.state.dnd = !G.state.dnd;
      G.tray.setIcon('dnd', G.state.dnd ? 'tray-dnd-on.png' : 'tray-dnd.png');
      G.sound('bounce.wav', 0.4);
    }, { icon: 'tray-dnd-on.png' });

    G.timeout(() => G.highlight(item, 2000), 8000);

    G.on(G.mail.el.subject, 'focus', () => G.clippy.say('The subject is fine. Look at the tray.'));
  },

  check(G) {
    return !G.state.dnd || 'Do Not Disturb is still on.';
  },

  cleanup(G) {
    delete G.state.dnd;
  },
});


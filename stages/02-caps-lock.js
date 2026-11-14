Game.registerStage({
  id: 2,
  name: 'Caps Lock stuck',
  vibe: 'happy',
  assets: ['tray-caps.png', 'tray-caps-on.png'],

  setup(G) {
    const subject = G.mail.el.subject;
    G.state.capsLock = true;

    const forceCaps = () => {
      if (!G.state.capsLock) return;
      const cursor = subject.selectionStart;
      subject.value = subject.value.toUpperCase();
      subject.setSelectionRange(cursor, cursor);
    };
    forceCaps();
    G.on(subject, 'input', forceCaps);

    const showState = () => {
      G.tray.setIcon('caps', G.state.capsLock ? 'tray-caps-on.png' : 'tray-caps.png');
      G.tray.get('caps').title = 'Caps Lock: ' + (G.state.capsLock ? 'ON' : 'off');
    };
    G.tray.add('caps', 'Caps Lock', () => {
      G.state.capsLock = !G.state.capsLock;
      showState();
      if (!G.state.capsLock) G.clippy.say(G.line('capsOff'), 'happy');
    });
    showState();
  },

  check(G) {
    if (G.state.capsLock) return 'Caps Lock is still on. THE PRINTER CAN HEAR YOU.';
    const subject = G.mail.subject.trim();
    if (!subject) return 'The subject is empty now. You need one, remember?';
    if (!/[a-z]/.test(subject)) return 'The subject is still in ALL CAPS. Retype it with normal letters.';
    return true;
  },

  cleanup(G) {
    G.state.capsLock = false;
  },
});

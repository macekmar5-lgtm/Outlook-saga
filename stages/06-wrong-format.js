(function () {
  const STEPS = ['Removing the J...', 'Adding the N...', 'Polishing pixels...', 'Done!'];
  const isJpg = (name) => /\.jpe?g$/i.test(name);

  function openConverter(G) {
    const win = G.openApp({
      id: 'converter', title: 'Convertinator 3000 (Trial)', icon: 'icon-converter.png',
      x: 690, y: 300, w: 330, h: 290,
      alwaysOnTop: true,
    });
    if (!win.created) return;

    const col = G.make('div', 'stage-col');
    const zone = G.make('div', 'drop-zone');
    G.setSkin(zone, 'drop-zone.png');
    const bar = G.ui.progress(0);
    bar.classList.add('hidden');
    const label = G.make('div', 'stage-msg', 'JPG  ->  PNG');
    col.append(zone, bar, label);
    win.body.appendChild(col);
    G.state.converterZone = zone;
    G.state.converterUi = { bar, label };
  }

  Game.registerStage({
    id: 6,
    name: 'Wrong format',
    vibe: 'happy',
    assets: ['icon-converter.png', 'drop-zone.png', 'progress-bar.png', 'progress-fill.png'],

    setup(G) {
      G.state.converting = false;
      if (!G.attachments.list().some((a) => isJpg(a.name))) G.attachments.add('cat.jpg', '3 MB', 'file-photo.png');

      const icon = G.addIcon({
        id: 'converter', label: 'Convertinator 3000', asset: 'icon-converter.png', x: 1080, y: 40,
        onDoubleClick: () => openConverter(G),
      });
      G.timeout(() => G.highlight(icon, 3000), 600);

      G.dragAttachments((att, point) => {
        const zone = G.state.converterZone;
        if (!zone || !zone.isConnected || !G.hitTest(zone, point)) return;
        if (!isJpg(att.name)) {
          G.clippy.say(G.line('notJpg'), 'happy');
          return;
        }
        if (G.state.converting) return;
        G.state.converting = true;
        const { bar, label } = G.state.converterUi;
        bar.classList.remove('hidden');
        G.runProgress(bar, 3000, STEPS, label).then(() => {
          const newName = att.name.replace(/\.jpe?g$/i, '.png');
          G.attachments.rename(att.name, newName);
          G.state.converting = false;
          label.textContent = `Done: ${newName}`;
        });
      });
    },

    slowNudge(G) {
      const zone = G.state.converterZone;
      return !zone || !zone.isConnected ? G.line('doubleClick') : null;
    },

    check(G) {
      const jpg = G.attachments.list().find((a) => isJpg(a.name));
      if (G.state.converting) return 'Still converting. Patience. Polishing pixels takes time.';
      return !jpg || `${jpg.name} is still a JPG. The printer only reads PNG.`;
    },

    cleanup(G) {
      delete G.state.converting;
      delete G.state.converterZone;
      delete G.state.converterUi;
    },
  });
})();

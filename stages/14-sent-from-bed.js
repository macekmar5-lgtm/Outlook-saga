(function () {
  function openWebcam(G) {
    const win = G.openApp({ id: 'webcam', title: 'Webcam - LIVE', icon: 'icon-webcam.png', x: 560, y: 90, w: 460, h: 440 });
    if (!win.created) return;

    const col = G.make('div', 'stage-center');
    const office = G.state.background === 'office';
    const preview = G.asset(office ? 'webcam-office.png' : 'webcam-bed.png', { w: 420, h: 280, className: 'webcam-preview' });
    preview.classList.toggle('blurry', G.state.background === 'blur');
    const options = G.make('div', 'stage-row hidden');

    const set = (mode) => {
      G.state.background = mode;
      G.setAsset(preview, mode === 'office' ? 'webcam-office.png' : 'webcam-bed.png');
      preview.classList.toggle('blurry', mode === 'blur');
      if (mode === 'blur') G.clippy.say(G.line('blur'), 'panic');
      if (mode === 'none') G.clippy.say(G.line('none'), 'panic');
      if (mode === 'office') G.clippy.say(G.line('office'), 'panic');
    };
    options.append(
      G.ui.button('None', () => set('none')),
      G.ui.button('Blur', () => set('blur')),
      G.ui.button('Office', () => set('office'))
    );
    const effects = G.ui.button('Background effects', () => options.classList.toggle('hidden'));
    effects.style.minWidth = '170px';

    col.append(preview, effects, options);
    win.body.appendChild(col);
  }

  Game.registerStage({
    id: 14,
    name: 'Sent from bed',
    vibe: 'panic',
    assets: ['icon-webcam.png', 'webcam-bed.png', 'webcam-office.png'],

    setup(G) {
      G.state.background = 'none';
      const icon = G.addIcon({ id: 'webcam', label: 'Webcam', asset: 'icon-webcam.png', x: 1080, y: 40, onClick: () => openWebcam(G) });
      G.timeout(() => G.highlight(icon, 3000), 600);
    },

    check(G) {
      if (G.state.background === 'office') return true;
      if (G.state.background === 'blur') return 'You are a blurry person in a blurry bed. Still a bed.';
      return 'You are still visibly in bed.';
    },

    cleanup(G) {
      delete G.state.background;
    },
  });
})();

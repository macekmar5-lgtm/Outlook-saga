(function () {
  const SENDING_MS = 4500;
  const SENDING_STEPS = [
    'Connecting to printer@company.com...',
    'Warming up the toner...',
    'Uploading excuse...',
    'Attaching cat...',
    'Almost there... 99%',
  ];
  const ERROR_STORM_COUNT = 24;
  const ERROR_STORM_GAP_MS = 100;
  const ERROR_STORM_VOLUME = 0.6;
  const PROGRESS_MS = 3500;
  const RESTART_AFTER_MS = 4000;

  function errorStorm(G) {
    for (let i = 0; i < ERROR_STORM_COUNT; i++) {
      setTimeout(() => G.sound('error.wav', ERROR_STORM_VOLUME), i * ERROR_STORM_GAP_MS);
    }
  }

  function showBlueScreen(G) {
    G.clippy.hide();

    const bsod = G.make('div', 'bsod');
    G.setSkin(bsod, 'bluescreen-bg.png');
    bsod.innerHTML = `
      <div class="asset bsod-face" data-asset="bluescreen-face.png"></div>
      <p class="bsod-text">
        Your PC ran into a problem and needs to restart. Clippy was optimizing
        one tiny thing. We're just collecting some error info, and then we'll
        restart for you.
      </p>
      <p class="bsod-progress"><span class="bsod-percent">0</span>% complete</p>
      <div class="bsod-small">
        If you call a support person, give them this info:<br>
        Stop code: BOUNCE_BACK_EXCEPTION<br>
        What failed: clippy_optimizer.sys<br>
        <span class="bsod-time"></span>
      </div>
      <div class="bsod-restart hidden">Press any key to restart</div>
    `;
    G.layers.overlay.appendChild(bsod);
    G.setAsset(bsod.querySelector('.bsod-face'), 'bluescreen-face.png');
    bsod.querySelector('.bsod-time').textContent = G.state.timeLine || `Your time: ${G.timer.text}`;

    const percent = bsod.querySelector('.bsod-percent');
    const started = performance.now();
    (function tick(now) {
      const p = Math.min(100, Math.floor(((now - started) / PROGRESS_MS) * 100));
      percent.textContent = p;
      if (p < 100) requestAnimationFrame(tick);
    })(started);

    setTimeout(() => {
      bsod.querySelector('.bsod-restart').classList.remove('hidden');
      const restart = () => G.restart();
      window.addEventListener('keydown', restart, { once: true });
      bsod.addEventListener('pointerdown', restart, { once: true });
    }, RESTART_AFTER_MS);
  }

  Game.registerStage({
    id: 18,
    name: 'Sending... (blue screen)',
    final: true,
    vibe: 'happy',
    assets: ['bluescreen-bg.png', 'bluescreen-face.png', 'progress-bar.png', 'progress-fill.png'],

    setup(G) {
      const stage = this;
      const isRecord = G.timer.saveBest();
      const best = G.timer.best;
      G.state.timeLine = `Your time: ${G.timer.text}` +
        (isRecord ? '  (NEW BEST!)' : best ? `  (best: ${G.timer.format(best)})` : '');

      const popup = G.popup({
        title: 'Sending...',
        icon: 'info',
        text: `It didn't bounce! Sending your email to ${G.mail.to}...`,
        buttons: [],
        closable: false,
      });
      const bar = G.ui.progress(0);
      bar.classList.add('final-send-bar');
      const label = G.make('div', 'stage-note final-send-step');
      const body = popup.el.querySelector('.popup-text');
      body.append(bar, label);
      G.clippy.say(G.line('sending'), 'happy');

      setTimeout(() => G.clippy.say(stage.clippy, 'happy'), SENDING_MS * 0.7);
      G.runProgress(bar, SENDING_MS, SENDING_STEPS, label).then(() => {
        errorStorm(G);
        showBlueScreen(G);
      });
    },
  });
})();

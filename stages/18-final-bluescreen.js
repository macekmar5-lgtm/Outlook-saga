(function () {
  const DELIVERED_MS = 2200;
  const PROGRESS_MS = 3500;
  const RESTART_AFTER_MS = 4000;
  const REPLY_FLY_MS = 1100;
  const OPTIMIZE_MS = 1800;

  function flyReplyIn(G) {
    return new Promise((resolve) => {
      const inbox = document.querySelector('[data-folder="inbox"]');
      const r = inbox ? G.rectOf(inbox) : { x: 300, y: 150, w: 100, h: 20 };
      const env = G.asset('envelope.png', { w: 64, h: 48, className: 'flying-envelope' });
      const x = r.x + 10;
      const y = r.y + r.h / 2 - 24;
      env.style.left = x + 'px';
      env.style.top = y + 'px';
      G.layers.fx.appendChild(env);
      const from = `translate(${G.CONFIG.WIDTH - x + 80}px, ${-y - 100}px) rotate(-30deg) scale(0.5)`;
      const anim = env.animate([
        { offset: 0, transform: from, easing: 'ease-in' },
        { offset: 0.75, transform: 'translate(0px, 0px) rotate(8deg) scale(1.25, 0.8)', easing: 'ease-out' },
        { offset: 0.88, transform: 'translate(0px, -30px) rotate(0deg) scale(1)', easing: 'ease-in' },
        { offset: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
      ], { duration: REPLY_FLY_MS, fill: 'forwards' });
      anim.onfinish = () => {
        G.sound('bounce.wav');
        setTimeout(() => { env.remove(); resolve(); }, 300);
      };
    });
  }

  function showBlueScreen(G) {
    G.sound('bluescreen.wav');
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
    name: 'Delivered (blue screen)',
    final: true,
    vibe: 'happy',
    assets: ['bluescreen-bg.png', 'bluescreen-face.png'],

    setup(G) {
      const stage = this;
      const isRecord = G.timer.saveBest();
      const best = G.timer.best;
      G.state.timeLine = `Your time: ${G.timer.text}` +
        (isRecord ? '  (NEW BEST!)' : best ? `  (best: ${G.timer.format(best)})` : '');
      const delivered = G.popup({
        title: 'Outlook Saga',
        icon: 'info',
        text: `Email delivered successfully.\n\nTo: ${G.mail.to}\nSubject: ${G.mail.subject || '(no subject)'}\n\n${G.state.timeLine}`,
        buttons: [],
      });
      G.clippy.say(G.line('delivered'), 'happy');

      setTimeout(() => {
        delivered.close();
        flyReplyIn(G).then(() => {
          G.sound('new-mail.mp3');
          const inbox = document.querySelector('[data-folder="inbox"] span:last-child');
          if (inbox) inbox.textContent = 'Inbox (1)';
          const stopGlow = G.highlight('[data-folder="inbox"]', 0);
          const vars = { boss: G.mail.to, subject: G.mail.subject || '(no subject)' };
          G.clippy.say(G.line('replied'), 'happy');
          G.popup({
            title: G.line('replyTitle', vars),
            icon: 'info',
            text: G.line('replyText', vars),
            buttons: [{ label: G.line('replyButton') }],
            onClose: () => {
              stopGlow();
              G.clippy.say(stage.clippy, 'happy');
              setTimeout(() => showBlueScreen(G), OPTIMIZE_MS);
            },
          });
        });
      }, DELIVERED_MS);
    },
  });
})();

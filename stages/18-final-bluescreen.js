/* =============================================================================
 *  STAGE 18 — FINAL: delivered... then blue screen              STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT HAPPENS
 *    After stage 17 passes, the envelope flies away and does NOT bounce back.
 *    "Email delivered successfully." appears, Clippy says he'll "optimize one
 *    tiny thing", and a moment later the whole screen turns into a fake blue
 *    screen (":(" style) with the stop code BOUNCE_BACK_EXCEPTION. After a few
 *    seconds, any key (or click) restarts the game. The end.
 *
 *  NOTES
 *    `final: true` tells the engine: no bounce, no error popup, the clock
 *    stops, and setup() owns the screen. check/cleanup are never called.
 *
 *  ASSETS
 *    bluescreen-bg.png    full-screen blue background (1280x720, stretched)
 *    bluescreen-face.png  the big sad face (200x170)
 *    sounds/bluescreen.wav
 * ========================================================================== */

(function () {
  // Tune the ending here.
  const DELIVERED_MS = 2200;   // how long "delivered" shows before the crash
                               // (brief says ~1 second; a bit longer lets Clippy's line land)
  const PROGRESS_MS = 3500;    // how long the "% complete" counter takes to reach 100
  const RESTART_AFTER_MS = 4000; // "press any key" appears after this long

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
        What failed: clippy_optimizer.sys
      </div>
      <div class="bsod-restart hidden">Press any key to restart</div>
    `;
    G.layers.overlay.appendChild(bsod);
    G.setAsset(bsod.querySelector('.bsod-face'), 'bluescreen-face.png');

    // Fake progress counter
    const percent = bsod.querySelector('.bsod-percent');
    const started = performance.now();
    (function tick(now) {
      const p = Math.min(100, Math.floor(((now - started) / PROGRESS_MS) * 100));
      percent.textContent = p;
      if (p < 100) requestAnimationFrame(tick);
    })(started);

    // After a few seconds, any key or click restarts.
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
    error: '',
    clippy: 'Finally! Let me just optimize one tiny thing...',
    hint: '',
    assets: ['bluescreen-bg.png', 'bluescreen-face.png'],

    setup(G) {
      G.popup({
        title: 'Outlook Saga',
        icon: 'info',
        text: `Email delivered successfully.\n\nTo: ${G.mail.to}\nSubject: ${G.mail.subject || '(no subject)'}`,
        buttons: [], // nothing to click: the crash is coming
      });
      G.clippy.say(this.clippy, 'happy');
      setTimeout(() => showBlueScreen(G), DELIVERED_MS);
    },
  });
})();

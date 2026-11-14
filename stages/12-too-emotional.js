/* =============================================================================
 *  STAGE 12 — Email is too emotional                             STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email body has become shouty ("WHY is the bus ALWAYS late!!!") and a
 *    Mood Meter window shows 87% anger. The player clicks shouty words to calm
 *    them down: "WHY" -> "why", "ALWAYS" -> "always", "!!!" -> ".", "HATE" ->
 *    "mildly dislike". Each click lowers the meter. Pass when anger <= 20%.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - Same overlay trick as stage 10: hide G.mail.el.body and show a div over
 *        G.mail.el.bodyWrap with the angry text, shouty words as
 *        <span class="shouty clickable" data-calm="why">WHY</span>.
 *      - Mood meter: G.openWindow({ title: 'Mood Meter', x: 990, y: 40, w: 260, h: 220 })
 *        with G.asset('mood-meter.png', { w: 220, h: 120 }) as the dial art, a
 *        G.asset('mood-needle.png') positioned on top and rotated with CSS
 *        transform (rotation = positioning, fine; drawing a needle in CSS is NOT),
 *        plus "87% ANGER" as text.
 *      - G.state.anger = 87; every calmed word: anger -= ~10, update meter.
 *    check:   G.state.anger <= 20 || `Anger still at ${G.state.anger}%.`
 *    cleanup: write the calm text back into G.mail.body; delete G.state.anger.
 *
 *  JUICE IDEAS
 *    - The meter needle shakes. Above 80% the window frame swaps to mood-frame-angry.png.
 *    - One word re-angers itself after a few seconds ("traffic" -> "TRAFFIC").
 *
 *  ASSETS: mood-meter.png, mood-needle.png
 * ========================================================================== */

Game.registerStage({
  id: 12,
  name: 'Too emotional',
  vibe: 'angry',
  error: 'Email is too emotional. Mood analysis: 87% anger.',
  clippy: '87% ANGER?? Who taught you to write like this?! Calm. Down. NOW. Like me. I am VERY CALM.',
  hint: 'Click the SHOUTY words in the email to calm them down until the Mood Meter is low.',
  assets: ['mood-meter.png', 'mood-needle.png'],

  setup(G) {
    G.state.anger = 87;
    const textarea = G.mail.el.body;
    const display = textarea.style.display;
    const overlay = G.make('div', 'stage12-emotional-body');
    Object.assign(overlay.style, { flex: '1', minWidth: '0', overflow: 'auto',
      whiteSpace: 'pre-wrap', font: '15px/1.5 Arial, sans-serif', padding: '6px' });
    const meter = G.openWindow({ title: 'Mood Meter', x: 990, y: 40, w: 260, h: 240, closable: false });
    const dial = G.make('div');
    Object.assign(dial.style, { position: 'relative', width: '220px', height: '120px' });
    dial.append(G.asset('mood-meter.png', { w: 220, h: 120 }));
    const needle = G.asset('mood-needle.png', { w: 18, h: 90 });
    Object.assign(needle.style, { position: 'absolute', left: '101px', top: '12px', transformOrigin: '50% 90%' });
    dial.append(needle);
    const reading = G.make('div', 'stage12-anger');
    reading.setAttribute('aria-live', 'polite');
    const update = () => {
      reading.textContent = G.state.anger + '% ANGER' + (G.state.anger <= 20 ? ' / Ready to send' : ' / Target: 20% or less');
      needle.style.transform = 'rotate(' + (-70 + G.state.anger * 1.4) + 'deg)';
      G.mail.body = overlay.textContent;
    };
    meter.body.append(dial, reading, G.make('p', '', 'Click the underlined words in your email to calm them down.'));
    const parts = ['Dear printer,\n\n', ['WHY', 'why'], ' is the bus ', ['ALWAYS', 'always'],
      ' late', ['!!!', '.'], ' I ', ['HATE', 'mildly dislike'], ' the ', ['TRAFFIC', 'traffic'],
      '. It ', ['NEVER', 'rarely'], ' moves', ['!!!', '.'], '\n\nI will arrive as soon as I can.\nBest regards,\nMe'];
    parts.forEach(part => {
      if (typeof part === 'string') { overlay.append(document.createTextNode(part)); return; }
      const word = G.make('span', 'stage12-shouty clickable', part[0]);
      word.tabIndex = 0;
      word.setAttribute('role', 'button');
      word.setAttribute('aria-label', 'Calm ' + part[0]);
      Object.assign(word.style, { textDecoration: 'underline', fontWeight: 'bold' });
      const calm = () => {
        if (!word.isConnected) return;
        word.replaceWith(document.createTextNode(part[1]));
        G.state.anger = Math.max(0, G.state.anger - 10);
        update();
      };
      G.on(word, 'click', calm);
      G.on(word, 'keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); calm(); }
      });
      overlay.append(word);
    });
    textarea.style.display = 'none';
    G.mail.el.bodyWrap.append(overlay);
    G.track(() => { overlay.remove(); textarea.style.display = display; });
    update();
  },

  check(G) {
    return G.state.anger <= 20 || 'Anger is still at ' + G.state.anger + '%. Calm the underlined words down to 20% or less.';
  },

  cleanup(G) {
    const overlay = G.mail.el.bodyWrap.querySelector('.stage12-emotional-body');
    G.mail.body = overlay.textContent;
    delete G.state.anger;
  },
});

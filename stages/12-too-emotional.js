/* =============================================================================
 *  STAGE 12 — Email is too emotional                             STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    A Mood Meter window (mood-meter.png with a rotating mood-needle.png)
 *    starts at 87% anger. The body (clickable word view) now has angry words:
 *    WHY, !!!, UNACCEPTABLE, ALWAYS, SERIOUSLY, HATE. Click each one to calm
 *    it (why / . / unfortunate / sometimes / kindly / slightly dislike); every
 *    click lowers the meter.  Pass: all calmed (meter at 15% or less).
 *    Cleanup: the textarea returns with the calm text.
 *
 *  ASSETS: mood-meter.png, mood-needle.png
 * ========================================================================== */

(function () {
  const START = 87;
  const TARGET = 15;
  const CALM = {
    WHY: 'why',
    '!!!': '.',
    UNACCEPTABLE: 'unfortunate',
    ALWAYS: 'sometimes',
    SERIOUSLY: 'kindly',
    HATE: 'slightly dislike',
  };
  const STEP = Math.ceil((START - TARGET) / Object.keys(CALM).length); // 12 per word

  const A = (text) => ({ text, tag: 'angry' });
  const T = (text) => ({ text });
  const RANT = [
    A('WHY'), T(' is the bus '), A('ALWAYS'), T(' late'), A('!!!'), T(' This is '), A('UNACCEPTABLE'), T('. '),
    A('SERIOUSLY'), T('. I '), A('HATE'), T(' mornings.\n\n'),
  ];

  function setMeter(G) {
    const m = G.state.mood;
    m.needle.style.transform = `rotate(${(m.anger / 100) * 180 - 90}deg)`;
    m.label.textContent = `${m.anger}% ANGER`;
  }

  Game.registerStage({
    id: 12,
    name: 'Too emotional',
    vibe: 'angry',
    error: 'Email is too emotional. Mood analysis: 87% anger.',
    clippy: '87% ANGER?! Who taught you to write to a printer like that? Calm. Down. NOW. Like me. I am VERY calm.',
    hint: 'Click every red SHOUTY word in the email to calm it down, until the Mood Meter is at 15% or less.',
    retry: ['Still furious. The printer is shaking. Well, it always shakes. But more now.'],
    assets: ['mood-meter.png', 'mood-needle.png'],

    setup(G) {
      // Put the rant right after the greeting line.
      const body = G.mail.body.trim() ? G.mail.body : Game.CONFIG.DEFAULT_BODY;
      const cut = body.indexOf('\n\n');
      const head = cut === -1 ? '' : body.slice(0, cut + 2);
      const tail = cut === -1 ? body : body.slice(cut + 2);
      const tokens = [...Game.wordView.split(head), ...RANT.map((t) => ({ ...t })), ...Game.wordView.split(tail)];

      // Mood meter window (top right)
      const win = G.openWindow({ title: 'Mood Meter 2000', x: 1034, y: 12, w: 240, h: 240, closable: false });
      const dial = G.make('div', 'mood-dial');
      dial.appendChild(G.asset('mood-meter.png', { w: 200, h: 110 }));
      const needle = G.asset('mood-needle.png', { w: 10, h: 90, className: 'mood-needle' });
      dial.appendChild(needle);
      const label = G.make('div', 'mood-label');
      win.body.append(dial, label);
      G.state.mood = { anger: START, needle, label };
      setMeter(G);

      G.state.angryView = G.wordView(tokens, (i, token) => {
        if (token.tag !== 'angry') return;
        token.text = CALM[token.text] || token.text.toLowerCase();
        token.tag = null;
        G.state.mood.anger = Math.max(0, G.state.mood.anger - STEP);
        setMeter(G);
        if (G.state.mood.anger <= TARGET) G.clippy.say('Calm. Serene. Passive-aggressive at a professional level. Send it.', 'angry');
      });
    },

    check(G) {
      const left = G.state.angryView.count('angry');
      if (left > 0 || G.state.mood.anger > TARGET) return `Anger at ${G.state.mood.anger}%. Still ${left} shouty word(s) in the email.`;
      return true;
    },

    cleanup(G) {
      G.state.angryView.close();
      delete G.state.angryView;
      delete G.state.mood;
    },
  });
})();

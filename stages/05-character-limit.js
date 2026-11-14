(function () {
  const LIMIT = 500;
  const MIN = 20;
  const TARGET = 1400;
  const CLIPPY_ADDITION =
    '\n\nP.S. (added by Clippy, you are welcome) Some helpful context about me: I was born on a ' +
    'Tuesday, which explains a lot. As a child I wanted to be a stapler. My hobbies include waiting ' +
    'for the bus, missing the bus, and describing the bus to people who did not ask. ' +
    'For your convenience, here is the full bus timetable: 07:02, 07:17, 07:32 (cancelled), ' +
    '07:47 (also cancelled), 08:02 (left early, out of spite), 08:17 (full), 08:32 (that one is ' +
    'me, running), 08:47 (I am still running). ' +
    'Dear Printer, I would also like to formally apologise for the time I printed 400 pages of ' +
    'cat pictures on a Friday. And for calling you "the beige box". And for the paper jam in ' +
    'March, which we both know was not entirely my fault. You have always been the most reliable ' +
    'member of this team, except when you are out of cyan, which is always. ' +
    'In conclusion, I am late, I am sorry, and I am a person of many layers, like a lasagna, or ' +
    'a very old toner cartridge. Thank you for reading this far. Nobody ever reads this far. ' +
    'If you did, please print this paragraph and keep it close to your heart (paper tray 2).';

  Game.registerStage({
    id: 5,
    name: 'Character limit',
    vibe: 'happy',
    textVars: { limit: LIMIT, min: MIN },
    assets: ['char-counter-bg.png'],

    setup(G) {
      let body = G.mail.body.trim() ? G.mail.body : Game.CONFIG.DEFAULT_BODY;
      body += CLIPPY_ADDITION;
      while (body.length < TARGET) body += ' Also, sorry.';
      G.mail.body = body;
      G.mail.charLimit = LIMIT;
      G.timeout(() => G.highlight(G.mail.el.counter, 3000), 600);
    },

    check(G) {
      const n = G.mail.body.length;
      if (n > LIMIT) return `Still ${n - LIMIT} characters too long (${n} / ${LIMIT}).`;
      if (n < MIN) return `The email is basically empty. The printer needs at least ${MIN} characters of excuse.`;
      return true;
    },

    cleanup(G) {
      G.mail.charLimit = null;
    },
  });
})();

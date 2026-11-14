/* =============================================================================
 *  STAGE 10 — Autocorrect improved your email                    STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    "Autocorrect" inserted "sorry" after about every 4th word (at least 8x).
 *    The body becomes a clickable word view (Game.wordView). Click each red
 *    "sorry" to delete it — but every 3rd one comes back as "apologies", which
 *    must also be clicked away.  Pass: no "sorry" or "apologies" left.
 *    Cleanup: the normal textarea returns with the cleaned text.
 *
 *  ASSETS: none (text only; uses the body-paper.png body)
 * ========================================================================== */

(function () {
  const MIN_SORRIES = 8;
  const FILLER =
    '\n\nI really feel terrible about the delay and the bus and the alarm clock and the fridge ' +
    'and basically everything else that happened this morning before I left the house.';

  /** Remove token i and the whitespace token in front of it. */
  function removeToken(view, i) {
    const before = view.tokens[i - 1];
    if (before && !before.tag && /^\s+$/.test(before.text)) view.tokens.splice(i - 1, 2);
    else view.tokens.splice(i, 1);
  }

  Game.registerStage({
    id: 10,
    name: 'Autocorrect',
    vibe: 'angry',
    error: 'Autocorrect improved your email. Too many apologies detected.',
    clippy: 'I made your email more apologetic. Sorry. You are welcome. Sorry. I said sorry. SORRY.',
    hint: 'Click every red "sorry" in the email to delete it. Some come back as "apologies" — click those too.',
    retry: ['Still sorry. So, so sorry.', 'The printer does not accept apologies. Or sorries. Click them all.'],
    assets: [],

    setup(G) {
      let body = G.mail.body.trim() ? G.mail.body : Game.CONFIG.DEFAULT_BODY;
      let tokens = Game.wordView.split(body);
      if (tokens.filter((t) => /\S/.test(t.text)).length < MIN_SORRIES * 4) {
        body += FILLER;
        tokens = Game.wordView.split(body);
      }

      // Insert " sorry" after every 4th word.
      const out = [];
      let words = 0;
      tokens.forEach((t) => {
        out.push(t);
        if (/\S/.test(t.text) && ++words % 4 === 0) out.push({ text: ' ' }, { text: 'sorry', tag: 'sorry' });
      });

      let clicked = 0;
      G.state.sorryView = G.wordView(out, (i, token, view) => {
        if (token.tag === 'sorry') {
          clicked++;
          if (clicked % 3 === 0) {
            token.text = 'apologies';
            token.tag = 'apologies';
            return;
          }
        }
        removeToken(view, i);
        if (!view.count('sorry') && !view.count('apologies')) {
          G.clippy.say('No more apologies. You monster. Fine. Send it.', 'angry');
        }
      });
    },

    check(G) {
      const view = G.state.sorryView;
      const n = view.count('sorry') + view.count('apologies');
      return n === 0 || `There are still ${n} apologies in your email.`;
    },

    cleanup(G) {
      G.state.sorryView.close(); // writes the cleaned text back and restores the textarea
      delete G.state.sorryView;
    },
  });
})();

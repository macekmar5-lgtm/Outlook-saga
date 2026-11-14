(function () {
  const MIN_SORRIES = 8;
  const FILLER =
    '\n\nI really feel terrible about the delay and the bus and the alarm clock and the fridge ' +
    'and basically everything else that happened this morning before I left the house.';

  function removeToken(view, i) {
    const before = view.tokens[i - 1];
    if (before && !before.tag && /^\s+$/.test(before.text)) view.tokens.splice(i - 1, 2);
    else view.tokens.splice(i, 1);
  }

  Game.registerStage({
    id: 10,
    name: 'Autocorrect',
    vibe: 'angry',
    assets: [],

    setup(G) {
      let body = G.mail.body.trim() ? G.mail.body : Game.CONFIG.DEFAULT_BODY;
      let tokens = Game.wordView.split(body);
      if (tokens.filter((t) => /\S/.test(t.text)).length < MIN_SORRIES * 4) {
        body += FILLER;
        tokens = Game.wordView.split(body);
      }

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
          G.clippy.say(G.line('allGone'), 'angry');
        }
      });
    },

    check(G) {
      const view = G.state.sorryView;
      const n = view.count('sorry') + view.count('apologies');
      return n === 0 || `There are still ${n} apologies in your email.`;
    },

    cleanup(G) {
      G.state.sorryView.close();
      delete G.state.sorryView;
    },
  });
})();

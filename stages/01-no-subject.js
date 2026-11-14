Game.registerStage({
  id: 1,
  name: 'No subject',
  vibe: 'happy',
  assets: [],

  setup(G) {
    G.mail.subject = '';

    const stopHighlight = G.highlight(G.mail.el.subject, 0);
    G.on(G.mail.el.subject, 'input', stopHighlight, { once: true });
  },

  check(G) {
    return G.mail.subject.trim().length > 0 || 'The subject is still empty.';
  },
});

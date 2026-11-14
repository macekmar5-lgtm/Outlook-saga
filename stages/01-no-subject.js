/* =============================================================================
 *  STAGE 1 — No subject                                          STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    Type anything into the Subject field, then press Send again.
 *
 *  NOTES
 *    The game starts with an empty subject, and the first Send always starts
 *    this stage. If the player already typed a subject before the first Send,
 *    the server "loses" it so the error still makes sense.
 *
 *  ASSETS: none (uses the global ones)
 * ========================================================================== */

Game.registerStage({
  id: 1,
  name: 'No subject',
  vibe: 'happy',
  // Texts (error, Clippy, hint, retry, lines): clippy-lines.js -> "stages" -> "1"
  assets: [],

  setup(G) {
    G.mail.subject = ''; // "the server ate your subject"

    // Pulse the subject field until the player starts typing in it.
    const stopHighlight = G.highlight(G.mail.el.subject, 0);
    G.on(G.mail.el.subject, 'input', stopHighlight, { once: true });
  },

  check(G) {
    return G.mail.subject.trim().length > 0 || 'The subject is still empty.';
  },
});

/* =============================================================================
 *  STAGE 10 — Autocorrect improved your email                    STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    "Autocorrect" rewrote the body: it's now full of "sorry" (e.g. "Hi sorry
 *    Boss sorry, I'm sorry going to be sorry late..."). The player clicks each
 *    "sorry" to delete it. Some of them come back as "apologies" (which must
 *    also be clicked). Pass when no "sorry"/"apologies" is left.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - The body is a <textarea>, which can't have clickable words. So: hide
 *        G.mail.el.body and put a plain <div> inside G.mail.el.bodyWrap (which
 *        already has the input-box.png art) with flex: 1; overflow: auto;
 *        white-space: pre-wrap; and the same font as the textarea.
 *      - Build it from G.mail.body with " sorry" inserted after ~every 3rd word,
 *        each one a <span class="sorry clickable">sorry</span>.
 *      - Click a span: remove it; 30% chance it's replaced by an "apologies" span
 *        (which, when clicked, is just removed).
 *      - G.track(() => { overlay.remove(); G.mail.el.body.style.display = ''; })
 *    check:   overlay.querySelectorAll('.sorry').length === 0 ||
 *             `There are still ${n} apologies in your email.`
 *    cleanup: write the cleaned text back: G.mail.body = overlay.textContent
 *             (do this in cleanup(), BEFORE the tracked overlay removal runs).
 *
 *  JUICE IDEAS
 *    - Clippy's line itself is full of "sorry".
 *    - The last "sorry" runs away once.
 *
 *  ASSETS: none
 * ========================================================================== */

Game.registerStage({
  id: 10,
  name: 'Autocorrect',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'angry',
  error: 'Autocorrect improved your email. Too many apologies detected (47).',
  clippy: "I fixed your tone! You're welcome. Sorry. Sorry, sorry. SORRY. ...Sorry.",
  hint: 'Click every "sorry" in the email to delete it. Watch out, some come back as "apologies".',
  assets: [],

  setup(G) {
    // TODO: see IMPLEMENTATION PLAN above
  },

  check(G) {
    // TODO
    return true;
  },

  cleanup(G) {
    // TODO
  },
});

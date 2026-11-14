/* =============================================================================
 *  STAGE 10 — Autocorrect improved your email                    STATUS: DONE
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
  vibe: 'angry',
  error: 'Autocorrect improved your email. Too many apologies detected.',
  clippy: "I fixed your tone! You're welcome. Sorry. Sorry, sorry. SORRY. ...Sorry.",
  hint: 'Click every "sorry" in the email to delete it. Watch out, some come back as "apologies".',
  assets: [],

  setup(G) {
    const textarea = G.mail.el.body;
    const display = textarea.style.display;
    const overlay = G.make('div', 'stage10-apologies');
    Object.assign(overlay.style, { flex: '1', minWidth: '0', overflow: 'auto',
      whiteSpace: 'pre-wrap', font: '15px/1.5 Arial, sans-serif', padding: '6px' });
    const makeApology = (word, returns) => {
      const token = G.make('span', 'stage10-apology clickable', word);
      token.setAttribute('role', 'button');
      token.tabIndex = 0;
      token.title = 'Remove ' + word;
      Object.assign(token.style, { textDecoration: 'underline', fontWeight: 'bold' });
      const remove = () => {
        if (returns) token.replaceWith(makeApology('apologies', false));
        else token.remove();
        G.mail.body = overlay.textContent;
      };
      G.on(token, 'click', remove);
      G.on(token, 'keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(); }
      });
      return token;
    };
    const original = G.mail.body || 'Dear printer, I will be late for work today.';
    let words = 0;
    let inserted = 0;
    original.split(/(\s+)/).forEach(part => {
      // Preserve punctuation and make existing apologies clickable too.
      part.split(/\b(sorry|apologies)\b/gi).forEach(text => {
        overlay.append(/^(sorry|apologies)$/i.test(text)
          ? makeApology(text, false) : document.createTextNode(text));
      });
      if (part.trim() && ++words % 3 === 0) {
        overlay.append(document.createTextNode(' '), makeApology('sorry', inserted++ % 3 === 0));
      }
    });
    if (!inserted) overlay.append(document.createTextNode(' '), makeApology('sorry', true));
    textarea.style.display = 'none';
    G.mail.el.bodyWrap.append(overlay);
    G.mail.body = overlay.textContent;
    G.track(() => { overlay.remove(); textarea.style.display = display; });
  },

  check(G) {
    const overlay = G.mail.el.bodyWrap.querySelector('.stage10-apologies');
    const count = overlay.querySelectorAll('.stage10-apology').length;
    return !count || 'There are still ' + count + ' apologies in your email. Click the underlined words.';
  },

  cleanup(G) {
    const overlay = G.mail.el.bodyWrap.querySelector('.stage10-apologies');
    G.mail.body = overlay.textContent;
  },
});

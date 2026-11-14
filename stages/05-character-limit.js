/* =============================================================================
 *  STAGE 5 — Email exceeds the character limit                   STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The server now has a character limit. The email body suddenly contains a
 *    huge auto-added legal disclaimer / signature, so it's way over. The player
 *    deletes text in the body until the live counter (bottom of the mail
 *    window) is under the limit. Pass when body length <= limit.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.mail.charLimit = 280   (the counter now shows "512 / 280" in red)
 *      - G.mail.body += '\n\n' + a long silly disclaimer, e.g.
 *        "CONFIDENTIALITY NOTICE: This email and any cat attached to it..." (~600 chars)
 *      - G.highlight('#char-counter', 4000)
 *    check:   G.mail.body.length <= G.mail.charLimit ||
 *             `Still ${G.mail.body.length - G.mail.charLimit} characters too long.`
 *    cleanup: G.mail.charLimit = null
 *
 *  JUICE IDEAS
 *    - If the player deletes EVERYTHING: check fails with "Email is empty. Bold."
 *    - Clippy counts down with them when they're close.
 *
 *  ASSETS: none
 * ========================================================================== */

Game.registerStage({
  id: 5,
  name: 'Character limit',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'annoyed',
  error: 'Email exceeds the character limit (280 characters).',
  clippy: 'Your email is too long. Nobody reads past the first line anyway. Trust me, I am an assistant.',
  hint: 'Delete text from the email body until the counter at the bottom is under the limit.',
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

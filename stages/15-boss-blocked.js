/* =============================================================================
 *  STAGE 15 — Your boss has blocked you                          STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The boss blocked the player's address. A "Create New Account" window
 *    opens: username + password + "Create". Each attempt adds a new, dumber
 *    password rule that the current password breaks:
 *       1. Password must be at least 8 characters.
 *       2. Password must contain a number.
 *       3. Password must contain the name of a fruit.
 *       4. Password must not contain the letter "e".
 *       5. Password must contain a haiku.  (switch the field to a <textarea>;
 *          accept anything with 3 lines)
 *    After the last rule passes: account created, From: becomes the new address.
 *    Pass when the new account exists.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - G.state.newAccount = false
 *      - G.openWindow({ title: 'Outlook Saga - Create Account', w: 460, h: 380, closable: false })
 *        fields: G.ui.input({ placeholder: 'Username' }), G.ui.input({ type: 'password' })
 *        (read/write wrapper.input.value); button: G.ui.button('Create', ...)
 *      - RULES = [{ text, test(pw) }, ...]; reveal rules one by one; next to each
 *        rule show G.asset('rule-ok.png') or G.asset('rule-fail.png') (text colour
 *        red/green is fine too — it's text)
 *      - success: G.mail.from = username + '@megacorp-new.biz'; G.state.newAccount = true
 *    check:   G.state.newAccount || 'You are still blocked. Create a new account.'
 *    cleanup: keep the new From address (it's funny). delete G.state.newAccount
 *
 *  JUICE IDEAS
 *    - Rule 6: "Password is already used by your boss." (then accept).
 *    - Username suggestions: "definitely_not_me_42".
 *
 *  ASSETS: rule-ok.png, rule-fail.png (16x16); fields/buttons use the shared UI kit art
 * ========================================================================== */

Game.registerStage({
  id: 15,
  name: 'Boss blocked you',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'panic',
  error: 'Your boss has blocked you.',
  clippy: "Your boss BLOCKED you. That's fine. That's FINE. Make a new account. Pick a strong password. Stronger. STRONGER.",
  hint: 'Create a new account in the window. Read every password rule. Yes, even that one.',
  assets: ['rule-ok.png', 'rule-fail.png'],

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

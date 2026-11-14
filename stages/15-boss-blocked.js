/* =============================================================================
 *  STAGE 15 — Your boss has blocked you                          STATUS: DONE
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
  vibe: 'panic',
  error: 'Your boss has blocked you.',
  clippy: "Your boss BLOCKED you. That's fine. That's FINE. Make a new account. Pick a strong password. Stronger. STRONGER.",
  hint: 'Create a new account in the window. Read every password rule. Yes, even that one.',
  assets: ['rule-ok.png', 'rule-fail.png'],

  setup(G) {
    G.state.newAccount = false;
    const win = G.openWindow({ title: 'Outlook Saga - Create Account',
      x: 380, y: 70, w: 570, h: 550, closable: false });
    G.addIcon({ id: 'create-account', label: 'Create account', asset: 'rule-fail.png',
      x: 1060, y: 40, onClick: () => {
        if (G.state.newAccount) G.clippy.say('Your new account is ready. Press Send.', 'panic');
        else G.bringToFront(win.el);
      } });
    Object.assign(win.body.style, { display: 'flex', flexDirection: 'column', gap: '8px' });
    const username = G.ui.input({ placeholder: 'definitely_not_me_42' });
    username.input.id = 'stage15-username';
    username.input.setAttribute('aria-label', 'New username');
    const nameLabel = G.make('label', '', 'New username');
    nameLabel.htmlFor = username.input.id;
    let password = G.ui.input({ type: 'password', placeholder: 'Choose a password' });
    password.input.id = 'stage15-password';
    password.input.setAttribute('aria-label', 'New password');
    const passwordLabel = G.make('label', '', 'New password');
    passwordLabel.htmlFor = password.input.id;
    const rules = [
      { text: 'Password must be at least 8 characters.', test: value => value.length >= 8 },
      { text: 'Password must contain a number.', test: value => /\d/.test(value) },
      { text: 'Password must contain the name of a fruit.', test: value => /banana|apple|pear|orange|kiwi|mango|plum|grape|peach|cherry|melon|fig|lime|lemon|apricot|papaya|guava|coconut/i.test(value) },
      { text: 'Password must not contain the letter "e".', test: value => !/e/i.test(value) },
      { text: 'Password must contain a haiku: three nonempty lines.',
        test: value => { const lines = value.trim().split(/\r?\n/); return lines.length === 3 && lines.every(line => line.trim()); } },
    ];
    let revealed = 1;
    const ruleList = G.make('div', 'stage15-rules');
    Object.assign(ruleList.style, { display: 'flex', flexDirection: 'column', gap: '6px' });
    const status = G.make('p', 'stage15-status', 'Choose a username and satisfy the password rule.');
    status.setAttribute('aria-live', 'polite');
    status.style.minHeight = '32px';
    const renderRules = () => {
      ruleList.replaceChildren();
      rules.slice(0, revealed).forEach((rule, index) => {
        const valid = !!rule.test(password.input.value);
        const row = G.make('div');
        Object.assign(row.style, { display: 'flex', alignItems: 'center', gap: '6px' });
        row.append(G.asset(valid ? 'rule-ok.png' : 'rule-fail.png', { w: 16, h: 16 }),
          G.make('span', '', (index + 1) + '. ' + rule.text + ' (' + (valid ? 'met' : 'not met') + ')'));
        ruleList.append(row);
      });
    };
    const updateFeedback = () => {
      renderRules();
      const failed = rules.slice(0, revealed).find(rule => !rule.test(password.input.value));
      status.textContent = failed ? failed.text : 'Visible requirements met. Press Create account.';
    };
    G.on(password.input, 'input', updateFeedback);
    const create = G.ui.button('Create account', () => {
      const name = username.input.value.trim();
      if (!/^[a-z0-9._-]+$/i.test(name)) {
        status.textContent = 'Enter a username using letters, numbers, dots, underscores or hyphens.';
        username.input.focus();
        return;
      }
      const failed = rules.slice(0, revealed).find(rule => !rule.test(password.input.value));
      if (failed) { status.textContent = failed.text; renderRules(); return; }
      if (revealed < rules.length) {
        revealed++;
        if (revealed === rules.length) {
          // The final rule needs line breaks. Keep the password already composed.
          const multiline = G.ui.input({ multiline: true, value: password.input.value,
            placeholder: 'Three lines. Fruit. A number. No letter e.' });
          multiline.input.id = 'stage15-password';
          multiline.input.setAttribute('aria-label', 'New password');
          multiline.input.rows = 3;
          multiline.style.minHeight = '72px';
          password.replaceWith(multiline);
          password = multiline;
          G.on(password.input, 'input', updateFeedback);
          password.input.focus();
        }
        status.textContent = 'One more security requirement. ' + rules[revealed - 1].text;
        renderRules();
        return;
      }
      G.mail.from = name + '@megacorp-new.biz';
      G.state.newAccount = true;
      win.close();
      G.clippy.say('New account created. The printer will never recognise that suspiciously familiar email. Send it.', 'panic');
    });
    win.body.append(nameLabel, username, passwordLabel, password, ruleList, status, create);
    renderRules();
  },

  check(G) {
    return G.state.newAccount || 'You are still blocked. Create a new account with a password that meets every rule.';
  },

  cleanup(G) {
    delete G.state.newAccount;
  },
});

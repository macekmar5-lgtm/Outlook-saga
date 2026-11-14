/* =============================================================================
 *  STAGE 15 — Your boss has blocked you                          STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The printer blocked you. A "Create a new Outlook Saga account" window has
 *    Username, Password and Create. Password rules appear one at a time: every
 *    failed attempt reveals the next rule. All revealed rules are checked live
 *    (checkbox.png / checkbox-checked.png):
 *      1 at least 8 characters   2 a number   3 an uppercase letter
 *      4 a fruit (apple, banana, kiwi, mango, pear, plum, grape, lemon)
 *      5 the word "bounce"       6 a month name   7 your boss's job: "printer"
 *    When all 7 pass, the account is created and the email's From becomes the
 *    new username.  Pass: account created.
 *    Example password that passes everything:  Bounce8kiwiMayprinter
 *
 *  ASSETS: checkbox.png, checkbox-checked.png (shared UI kit art)
 * ========================================================================== */

(function () {
  const MONTHS = /(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const RULES = [
    { text: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { text: 'Must contain a number', test: (pw) => /\d/.test(pw) },
    { text: 'Must contain an uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { text: 'Must contain a fruit (apple, banana, kiwi, mango, pear, plum, grape, lemon)', test: (pw) => /(apple|banana|kiwi|mango|pear|plum|grape|lemon)/i.test(pw) },
    { text: 'Must contain the word "bounce"', test: (pw) => /bounce/i.test(pw) },
    { text: 'Must contain a month name', test: (pw) => MONTHS.test(pw) },
    { text: "Must contain your boss's job", test: (pw) => /printer/i.test(pw) },
  ];

  Game.registerStage({
    id: 15,
    name: 'Boss blocked you',
    vibe: 'panic',
    error: 'Your boss has blocked you.',
    clippy: "THE PRINTER BLOCKED YOU. That's fine. That's FINE. Make a new account. Strong password. STRONGER. STRONGER THAN THAT.",
    hint: 'Pick a username, then keep pressing Create: each try reveals a new rule. A password like "Bounce8kiwiMayprinter" passes all 7.',
    retry: ['STILL BLOCKED. MAKE. AN. ACCOUNT.', 'The password needs a fruit. I do not make the rules. (I do make the rules.)'],
    assets: ['checkbox.png', 'checkbox-checked.png'],

    setup(G) {
      G.state.account = null;
      let revealed = 1;

      const win = G.openWindow({ title: 'Create a new Outlook Saga account', x: 330, y: 70, w: 540, h: 500, closable: false });
      const col = G.make('div', 'stage-col');
      const user = G.ui.input({ placeholder: 'Username' });
      const pass = G.ui.input({ placeholder: 'Password' });
      const rules = G.make('div', 'rule-list');
      const msg = G.make('div', 'stage-msg');
      const boxes = RULES.map((r, i) => G.ui.checkbox(`${i + 1}. ${r.text}`, false, null, { readOnly: true }));

      const render = () => {
        const pw = pass.input.value;
        rules.replaceChildren(...boxes.slice(0, revealed));
        boxes.slice(0, revealed).forEach((box, i) => box.setChecked(RULES[i].test(pw)));
      };
      G.on(pass.input, 'input', render);

      const create = G.ui.button('Create', () => {
        const name = user.input.value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (!name) {
          msg.textContent = 'Pick a username first.';
          return;
        }
        const pw = pass.input.value;
        const allPass = RULES.slice(0, revealed).every((r) => r.test(pw));
        if (allPass && revealed === RULES.length) {
          G.state.account = name;
          G.mail.from = `${name}@company.com`;
          win.close();
          G.clippy.say(`Welcome, ${name}. The printer has not blocked you. YET.`, 'panic');
          return;
        }
        if (revealed < RULES.length) revealed++;
        msg.textContent = allPass ? 'Password rejected. A new rule has appeared.' : 'Password does not meet the rules.';
        G.shake();
        render();
      });

      col.append(
        G.make('div', '', 'Username'), user,
        G.make('div', '', 'Password'), pass,
        rules, msg, create
      );
      win.body.appendChild(col);
      render();
    },

    check(G) {
      return G.state.account ? true : 'You are still blocked. Create a new account first.';
    },

    cleanup(G) {
      delete G.state.account;
    },
  });
})();

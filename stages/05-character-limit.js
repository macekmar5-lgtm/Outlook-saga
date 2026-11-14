/* =============================================================================
 *  STAGE 5 — Email exceeds the character limit                   STATUS: DONE
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The server now has a 280-character limit, and Outlook Saga "helpfully"
 *    auto-appended a huge legal disclaimer to the body. The player deletes text
 *    in the body until the live counter (bottom left of the mail window) is
 *    under the limit. Pass when 1 <= body length <= 280.
 *
 *  NOTES
 *    - If the body was empty / tiny (testers jumping in with ?stage=5), a short
 *      excuse is written first, so there is something worth keeping.
 *    - Deleting EVERYTHING fails: "Email is empty. Bold."
 *    - Clippy counts down when the player gets close.
 *
 *  ASSETS: none (uses the global ones)
 * ========================================================================== */

Game.registerStage({
  id: 5,
  name: 'Character limit',
  vibe: 'annoyed',
  error: 'Email exceeds the character limit (280 characters).',
  clippy: 'Your email is too long. Nobody reads past the first line anyway. Trust me, I am an assistant.',
  hint: 'Delete text from the email body (the legal disclaimer is a great start) until the counter at the bottom is under 280.',
  retry: [
    'Still too long. Shorter. SHORTER.',
    'Look at the counter, bottom left. Red means bad. You knew that.',
  ],
  assets: [],

  setup(G) {
    const LIMIT = 280;
    const DISCLAIMER =
      '-----\n' +
      'CONFIDENTIALITY NOTICE: This email and any cat attached to it are confidential ' +
      'and intended solely for the printer it is addressed to. If you are not the ' +
      'intended printer, please print this email, then shred it, then apologise to ' +
      'the shredder. Any excuse contained herein does not constitute an excuse. ' +
      'Outlook Saga accepts no responsibility for lateness, traffic, alarm clocks, ' +
      'cats, or Clippy. Please consider the environment before reading this email. ' +
      'This disclaimer was automatically added for your protection and cannot be ' +
      'removed (it can, but please do not tell anyone). Sent with Outlook Saga 2003 ' +
      '(Unlicensed). Unsubscribe: not possible.';

    // Make sure there is a real excuse worth keeping above the disclaimer.
    if (G.mail.body.trim().length < 10) {
      G.mail.body = "Dear Printer,\n\nSorry, I'm running late today. I'll be there as soon as I can.\n\nRegards";
    }
    G.mail.body = G.mail.body.replace(/\s+$/, '') + '\n\n' + DISCLAIMER;
    G.mail.charLimit = LIMIT;

    G.highlight(G.mail.el.counter, 4000);

    // Clippy counts down with the player when they're close.
    let lastBucket = null;
    G.on(G.mail.el.body, 'input', () => {
      const n = G.mail.body.length;
      const over = n - LIMIT;
      let bucket = null;
      let line = null;
      if (n === 0) {
        bucket = 'empty'; line = "You deleted EVERYTHING? That's one way to do it. The printer needs SOME words.";
      } else if (over <= 0) {
        bucket = 'ok'; line = `${n} / ${LIMIT}. Short and sweet! Now press Send.`;
      } else if (over <= 20) {
        bucket = 'close'; line = `${over} more! So close!`;
      } else if (over <= 100) {
        bucket = 'warm'; line = 'Keep going! You are under 100 characters too long!';
      }
      if (bucket && bucket !== lastBucket) {
        G.clippy.say(line, bucket === 'empty' ? 'annoyed' : 'happy');
      }
      lastBucket = bucket;
    });
  },

  check(G) {
    const n = G.mail.body.trim().length;
    if (n === 0) return 'Email is empty. Bold. Write at least SOMETHING.';
    const over = G.mail.body.length - G.mail.charLimit;
    if (over > 0) return `Still ${over} character${over === 1 ? '' : 's'} too long.`;
    return true;
  },

  cleanup(G) {
    G.mail.charLimit = null;
  },
});

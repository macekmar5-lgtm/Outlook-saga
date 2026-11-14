/* =============================================================================
 *  STAGE 12 — Email is too emotional                             STATUS: TODO
 *  -----------------------------------------------------------------------------
 *  WHAT THE PLAYER MUST DO
 *    The email body has become shouty ("WHY is the bus ALWAYS late!!!") and a
 *    Mood Meter window shows 87% anger. The player clicks shouty words to calm
 *    them down: "WHY" -> "why", "ALWAYS" -> "always", "!!!" -> ".", "HATE" ->
 *    "mildly dislike". Each click lowers the meter. Pass when anger <= 20%.
 *
 *  IMPLEMENTATION PLAN
 *    setup:
 *      - Same overlay trick as stage 10: hide G.mail.el.body and show a div over
 *        G.mail.el.bodyWrap with the angry text, shouty words as
 *        <span class="shouty clickable" data-calm="why">WHY</span>.
 *      - Mood meter: G.openWindow({ title: 'Mood Meter', x: 990, y: 40, w: 260, h: 220 })
 *        with G.asset('mood-meter.png', { w: 220, h: 120 }) as the dial art, a
 *        G.asset('mood-needle.png') positioned on top and rotated with CSS
 *        transform (rotation = positioning, fine; drawing a needle in CSS is NOT),
 *        plus "87% ANGER" as text.
 *      - G.state.anger = 87; every calmed word: anger -= ~10, update meter.
 *    check:   G.state.anger <= 20 || `Anger still at ${G.state.anger}%.`
 *    cleanup: write the calm text back into G.mail.body; delete G.state.anger.
 *
 *  JUICE IDEAS
 *    - The meter needle shakes. Above 80% the window frame swaps to mood-frame-angry.png.
 *    - One word re-angers itself after a few seconds ("traffic" -> "TRAFFIC").
 *
 *  ASSETS: mood-meter.png, mood-needle.png
 * ========================================================================== */

Game.registerStage({
  id: 12,
  name: 'Too emotional',
  todo: true, // <- delete this line once setup/check are implemented
  vibe: 'angry',
  error: 'Email is too emotional. Mood analysis: 87% anger.',
  clippy: '87% ANGER?? Who taught you to write like this?! Calm. Down. NOW. Like me. I am VERY CALM.',
  hint: 'Click the SHOUTY words in the email to calm them down until the Mood Meter is low.',
  assets: ['mood-meter.png', 'mood-needle.png'],

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

/* =============================================================================
 *  STAGE TEMPLATE — copy me!
 *  -----------------------------------------------------------------------------
 *  1. Copy this file to stages/NN-short-name.js (or open the existing stub).
 *  2. Change the id and texts, write setup/check/cleanup.
 *  3. Make sure index.html has a <script src="stages/NN-short-name.js"> tag.
 *  4. Test it directly:  index.html?stage=NN       (add &freeze to stop the clock)
 *
 *  This file is NOT loaded by index.html. It's a working example: a "Do Not
 *  Disturb" tray toggle that the player must switch off.
 *
 *  THE RULES (see CLAUDE.md):
 *   - Only touch YOUR stage file. Need an engine change? Ask the team first.
 *   - EVERY visual is a hand-made file in /assets. Never generate images, SVG,
 *     canvas pictures, or CSS-drawn graphics (no gradients, shadows, rounded
 *     corners, coloured boxes, borders as decoration). CSS = layout + text only.
 *       pictures:  G.asset('file.png', { w, h })
 *       surfaces:  G.ui.button / G.ui.input / G.ui.checkbox / G.ui.progress / G.ui.key,
 *                  or any element with G.setSkin(el, 'my-frame.png')
 *     Missing art shows a dashed placeholder with the filename — that's fine.
 *     Never use native <select>, checkbox, range or <progress> (browser-drawn).
 *   - Sounds: Game.sound('file.wav') (assets/sounds/). Missing = silent.
 *   - Coordinates are game pixels (1280x720). Use Game.toGame(event) for mouse.
 *   - Everything you add must go away when the stage ends. Easiest way: use the
 *     tracked helpers (Game.on / Game.timeout / Game.interval / Game.track).
 *     Windows, icons, tray items and highlights created during the stage are
 *     removed automatically (unless you pass persist: true).
 *   - Don't assume earlier stages ran (testers jump with ?stage=NN). setup()
 *     must create everything this stage needs.
 * ========================================================================== */

Game.registerStage({
  // ---- identity ----
  id: 99,                        // order in the game. Decimals OK (7.5 = between 7 and 8)
  name: 'Example: Do Not Disturb', // shows in the console

  // ---- texts ----
  vibe: 'annoyed',               // Clippy's mood: 'happy' | 'annoyed' | 'angry' | 'panic'
                                 // (leave out to pick automatically from game progress)
  error: 'Recipient is in Do Not Disturb mode. So are you.',  // "Mail Delivery Failed" popup
  clippy: "You turned on Do Not Disturb. It's in the tray. Bottom right. Where it always is.",
  hint: 'Click the "DND" item in the taskbar tray, next to the clock.', // Clippy click (costs 1 min)
  retry: [                       // optional: Clippy's lines when Send fails again
    'Still disturbed. Still not delivering.',
    'The tray. The TRAY.',
  ],
  assets: ['tray-dnd.png', 'tray-dnd-on.png'], // documentation: art files this stage uses (for the checklist)

  // ---- status ----
  // todo: true,                 // stub mode: popup says "[stage not built yet]" and Send auto-passes.
                                 // Delete this line when your stage works.

  /**
   * setup(G) — runs when the stage starts, BEFORE the error popup appears.
   * Build the problem here. G is the Game object.
   */
  setup(G) {
    G.state.dnd = true;

    // Tray items are removed automatically when the stage ends.
    // Icon defaults to tray-<id>.png; swap pictures to show state.
    const item = G.tray.add('dnd', 'Do Not Disturb', () => {
      G.state.dnd = !G.state.dnd;
      G.tray.setIcon('dnd', G.state.dnd ? 'tray-dnd-on.png' : 'tray-dnd.png');
      G.sound('clippy.wav'); // any file in assets/sounds/ — silently does nothing if missing
    }, { icon: 'tray-dnd-on.png' });

    // Tracked timer: cancelled automatically when the stage ends.
    G.timeout(() => G.highlight(item, 2000), 8000);

    // Tracked listener: removed automatically when the stage ends.
    G.on(G.mail.el.subject, 'focus', () => G.clippy.say('The subject is fine. Look at the tray.'));
  },

  /**
   * check(G) — runs when the player presses Send.
   *   return true                  -> fixed! cleanup runs, next stage starts
   *   return false                 -> "still failed" popup with the stage's `error`
   *   return 'Some reason text'    -> "still failed" popup showing that reason
   * Tip: `return condition || 'reason'` covers both cases in one line.
   */
  check(G) {
    return !G.state.dnd || 'Do Not Disturb is still on.';
  },

  /**
   * cleanup(G) — runs after check() passes, before the next stage starts.
   * Undo anything that is NOT auto-tracked (e.g. changes to the mail fields,
   * G.state flags other stages might read, CSS classes you added by hand).
   */
  cleanup(G) {
    delete G.state.dnd;
  },
});

/* -----------------------------------------------------------------------------
 *  CHEAT SHEET (full docs: CLAUDE.md)
 *
 *  Mail       G.mail.subject / .body / .to / .from   (get + set)
 *             G.mail.charLimit = 280                  (live counter shows the limit)
 *             G.mail.el.subject / .body / .send / .bodyWrap / .window  (raw elements)
 *  Attach     G.attachments.add(name, '4 GB', 'file-photo.png') -> chip element
 *             G.attachments.remove(name) / .list() / .get(name) / .setSize(name, '12 KB')
 *  Art        G.asset('cat.png', { w: 200, h: 150 }) -> element
 *             G.setAsset(el, 'cat-squished.png')     (swap the picture)
 *             G.setSkin(el, 'frame.png')             (draw an element WITH art: 9-slice/stretched)
 *  UI kit     G.ui.button(label, onClick) / G.ui.input({ value }) -> wrap (.input)
 *             G.ui.checkbox(label, checked, onChange) / G.ui.progress(0.5) (.set(v))
 *             G.ui.key('Q', onClick)                 (on-screen keyboard key)
 *  Sound      G.sound('bounce.wav')
 *  Popup      G.popup({ title, text, icon: 'error'|'warning'|'info'|'file.png', buttons: [{ label, onClick }] })
 *  Window     G.openWindow({ title, html, x, y, w, h, closable }) -> { el, body, close() }
 *             (draggable by the title bar automatically; G.makeMovable(el, handle) for custom ones)
 *  App        G.openApp({ id: 'webcam', title, icon, html, w, h }) — app window for a desktop
 *             icon: one per id, clicking the icon again brings it to the front
 *  Icon       G.addIcon({ id, label, asset, x, y, onClick })
 *  Drag       G.makeDraggable(el, { onDrop(el) { return G.overlaps(el, target); }, revert: true })
 *  Tray       G.tray.add(id, label, onClick, { icon, text }) / G.tray.setIcon(id, file) / G.tray.setText(id, text)
 *             built-in: 'wifi', 'volume', 'battery' (restore them in cleanup if you change them)
 *  Juice      G.highlight(elOrSelector, ms) / G.shake()
 *  Clippy     G.clippy.say(text, 'happy'|'annoyed'|'angry'|'panic')
 *  Time       G.clock.add(minutes) / G.clock.minutesLeft
 *  Cleanup    G.track(fn) / G.on(el, type, fn) / G.timeout(fn, ms) / G.interval(fn, ms)
 *  Shared     G.state.anything = ...
 * -------------------------------------------------------------------------- */

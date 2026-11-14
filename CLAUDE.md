# CLAUDE.md — Outlook Saga

Game jam game (theme: **BOUNCE BACK**). A fake Windows-XP-style desktop runs a terrible
email app. The player has to send ONE email to their boss explaining why they're late.
Every Send bounces back with a new absurd error (18 stages). Clippy delivers each error
and gets more unhinged. Stage 18: "delivered" → fake blue screen → the end.

3–4 people edit **different stage files at the same time**. Keep changes local to the file
you were asked to work on.

## Hard rules

1. **Plain HTML + CSS + vanilla JS.** No frameworks, no npm, no build step, no modules
   (`import`/`export`), no fetch of local files. It must run by double-clicking
   `index.html` (file://) AND on itch.io.
2. **ALL VISUALS ARE HUMAN-MADE FILES IN /assets.** Never generate images, SVG, canvas
   pictures, emoji-as-icons, base64 images, or **CSS-drawn graphics**: no gradients, no
   shadows (box/text), no rounded corners, no coloured boxes/backgrounds, no decorative
   borders/outlines, no shapes, no glyphs standing in for icons (×, ✓, ":(").
   - CSS is ONLY for layout, positioning, text (font, size, colour) and stretching our
     images. Motion (transform/opacity animations) is fine.
   - Pictures (icons, props, characters): `Game.asset('file.png', { w, h })`.
   - Surfaces (frames, bars, buttons, fields, keys, checkboxes, progress bars, panels,
     backgrounds): an element with `data-skin="file.png"` — use `Game.ui.*` or
     `Game.setSkin(el, 'file.png')`. Drawn 9-slice (if style.css has `--slice-<name>`)
     or stretched.
   - Missing files show a dashed placeholder with the filename. That is intended: it's
     the artists' to-do list. Never "fix" a placeholder by drawing something in CSS.
   - Never use browser-drawn widgets: native `<select>`, checkbox, radio, range,
     `<progress>`, visible scrollbars. Use `Game.ui.*`.
   - Exception: a canvas the PLAYER draws on (stage 11 signature strokes).
   - Text is fine — it's rendered with a font.
3. **Relative paths only**: `assets/x.png`, never `/assets/x.png` (breaks file:// and itch).
4. **New art filename?** Add it to the stage's `assets: [...]` array AND to the checklist in
   README.md. Shared OS/UI art also goes in the `--os-assets` list at the top of style.css.
5. Fixed **1280×720** game screen scaled to fit. Use game pixels everywhere; convert mouse
   positions with `Game.toGame(event)`. Target Chrome desktop only.
6. Don't rename/remove public `Game.*` functions — other people's stages depend on them.
   Adding to the engine is OK, but say so in your summary.

## Files

```
index.html          markup for title screen, desktop, mail window, taskbar, layers; loads scripts
style.css           layout + text only. Section 1 = ART LIST + 9-slice settings
engine.js           CONFIG + the global `Game` object (all helpers + game flow)
stages/_template.js documented example stage (NOT loaded by index.html)
stages/NN-name.js   one file per stage, registered with Game.registerStage
assets/             hand-made art (png)          — pushed by the artists
assets/sounds/      hand-made sounds (wav)       — pushed by the audio people
```

Script order in index.html: `engine.js`, then every `stages/*.js`. `init()` runs on
`DOMContentLoaded`, after all stages registered. A missing stage file just 404s and is
skipped; stages are sorted by `id` (decimals like 7.5 are allowed).

## How art is drawn (engine.js section 4 + style.css section 1/3)

- **Pictures** — `Game.asset(file, {w, h})` returns `<div class="asset"><img></div>`
  (object-fit: contain). Missing → `.asset-missing` dashed box with the filename. Swap with
  `Game.setAsset(el, file)`.
- **Surfaces** — any element with `data-skin="file.png"`. style.css section 3 makes every
  `[data-skin]` a dashed placeholder with `::after { content: attr(data-skin) }`. The engine
  loads each data-skin file (a MutationObserver picks up new ones automatically) and, when it
  exists, injects a rule `#game [data-skin="file.png"] { border-image: ... }` into
  `<style id="skin-rules">`, which removes the placeholder.
  - 9-slice when style.css defines `--slice-<name>` / `--frame-<name>` (1 or 4 values);
    otherwise slice 0 = the whole image stretched over the element.
  - `data-skin-pressed="x.png"` swaps the skin while the mouse button is held.
  - Swap skins for state with `Game.setSkin(el, file)` (e.g. checkbox → checkbox-checked).
  - Inputs/textareas can't show `::after`, so they live inside a skinned wrapper
    (`.ui-field[data-skin="input-box.png"]`) — use `Game.ui.input()`.
- **Text colours** — default `--text` (readable on placeholders). When a file loads, `#game`
  gets `.skin-<name>`; style.css section 12 switches text colours on art (e.g. white title
  bar text once titlebar.png exists).
- **Cursors** — `cursor.png`, `cursor-hand.png`, `cursor-loading.png` (32×32); the system
  cursor is used until they exist. Hotspots in style.css section 1.
- The placeholder fill colour is dev-only and vanishes when the art exists.

## Game flow (engine.js section 10)

- Email starts with an EMPTY subject. Title screen → Start → clock starts (8:30).
- **Send**: envelope flies out and bounces back (`bounce.wav`), costs 1 minute.
  - no active stage → start the first stage
  - active stage, `check()` fails → "Mail Delivery Failed (again)" popup + annoyed Clippy
  - `check()` passes → `cleanup()` + tracked cleanups → start next stage
- **Starting a stage**: `setup()`, then the "Mail Delivery Failed" popup (`error.wav`) with
  `error`, and Clippy says `clippy` in mood `vibe`.
- `todo: true` stage = stub: popup adds "[stage not built yet]" and the next Send auto-passes.
- If `setup()` throws, the stage is treated like a stub. If `check()` throws, it passes.
  (The game must always be playable end to end; errors go to the console.)
- `final: true` stage (18): no bounce, envelope flies away, clock stops, `setup()` owns the
  screen. check/cleanup never run.
- Clock hits 9:00 → "You're fired" → `Game.restart()` (page reload).
- Clicking Clippy shows the current stage's `hint` and costs 1 minute.
- All numbers live in `CONFIG` at the top of engine.js.

## Stage API

```js
Game.registerStage({
  id: 7,                       // order (number)
  name: 'Keyboard disconnected',
  vibe: 'annoyed',             // Clippy mood: 'happy' | 'annoyed' | 'angry' | 'panic' (omit = auto)
  error: 'Popup text.',        // "Mail Delivery Failed" reason
  clippy: 'Clippy line when the stage starts.',
  hint: 'Clippy line when clicked (costs a minute).',
  retry: ['optional lines', 'when Send fails again'],
  assets: ['file.png'],        // documentation for the checklist
  todo: true,                  // stub — delete when implemented
  final: false,                // only stage 18
  setup(G) {},                 // build the problem (G === Game)
  check(G) { return true; },   // true = fixed | false | 'reason string' (shown in the popup)
  cleanup(G) {},               // undo what isn't auto-tracked
});
```

**Stage rules**
- `setup()` must create everything the stage needs. Never assume earlier stages ran —
  testers jump straight to a stage with `?stage=NN`. (Stages may read the mail
  fields/attachments, but should add what they need if it's missing.)
- Everything a stage adds must disappear when it ends. Auto-removed at stage end:
  `Game.openWindow`, `Game.addIcon`, `Game.tray.add`, `Game.highlight` (unless
  `persist: true`), plus `Game.on`, `Game.timeout`, `Game.interval`, `Game.track(fn)`.
  Anything else (DOM you appended yourself, classes on shared elements, changes to the
  persistent tray items wifi/volume/battery, `G.state` flags) → undo it in `cleanup()` or
  register it with `G.track()`.
- Use `G.state.<something>` for stage flags; delete them in cleanup.
- Use `G.timeout/G.interval/G.on` instead of raw setTimeout/addEventListener.
- Need stage-specific layout CSS? Inline `style` for layout/positioning only, or a small
  section at the end of style.css named after your stage. Never visual styling.
- Keep the left desktop column (x < 110, y < 380) free — default icons live there.
  Clippy sits bottom-right (≈ x 1130–1260, y 540–670) with his bubble above.
- Comment the top of the file: what the player must do + assets used (see existing stubs).

## Engine API (Game.*)

| Area | API |
|---|---|
| Mail | `mail.to / from / subject / body` (get/set), `mail.charLimit` (null or number), `mail.updateCounter()`, `mail.el.{window,from,to,subject,body,bodyWrap,counter,send,attachBar,attachList}` |
| Attachments | `attachments.add(name, sizeLabel, iconAsset)` → chip el, `.remove(name)`, `.list()`, `.get(name)`, `.setSize(name, label)`, `.clear()` |
| Pictures | `asset(file, {w, h, className})` → el, `setAsset(el, file)` |
| Surfaces | `setSkin(el, file)`, `skin.has('window-frame')`, attribute `data-skin` / `data-skin-pressed` |
| UI kit | `ui.button(label, onClick, {skin, pressed, className})`, `ui.input({value, placeholder, type, multiline, skin})` → wrapper (`.input`), `ui.checkbox(label, checked, onChange)` (`.checked`, `.setChecked(v)`), `ui.progress(v)` (`.set(0..1)`), `ui.key(label, onClick)` |
| Sound | `sound(file, volume)` — from assets/sounds/, silent if missing |
| Popup | `popup({title, text, html, icon, buttons:[{label, onClick(p) → false keeps open}], modal, closable, onClose, skin})` → `{el, close}`. icon: `'error' \| 'warning' \| 'info'` (= icon-*.png) or a filename |
| Windows | `openWindow({title, html, x, y, w, h, closable, icon, skin, className, onClose, persist})` → `{el, body, close, setTitle}`; `bringToFront(el)`; `makeMovable(el, handle)` for a hand-built window. Every window and popup (incl. the mail window) can be dragged by its title bar |
| Apps | `openApp({id, ...openWindow options})` — app window for a desktop icon: non-modal, draggable, closable, one per `id` (re-opening brings it to front). Built-in apps: My Computer, Homework, New Folder (37) |
| Desktop | `addIcon({id, label, asset, x, y, onClick, persist})` → el (`#icon-<id>`), `removeIcon(id)` |
| Tray | `tray.add(id, label, onClick, {icon, text, title, persist})` (icon defaults to `tray-<id>.png`), `tray.setIcon(id, file)`, `tray.setText(id, text)`, `tray.get(id)`, `tray.remove(id)`. Built-in: `wifi`, `volume`, `battery` |
| Drag | `makeDraggable(el, {onDrop(el, point) → true accepts, onMove, onStart, revert, handle})` → `{destroy, reset}`; `overlaps(a, b, minPx)` |
| Coords | `toGame(event)` or `toGame(clientX, clientY)` → game px; `rectOf(el)` → `{x, y, w, h}` in game px |
| Juice | `highlight(selOrEl, ms)` (pulsing highlight-frame.png; 0 = until stage end) → off(); `shake()` |
| Clippy | `clippy.say(text, mood)`, `clippy.hide()`, `clippy.mood` |
| Clock | `clock.add(min)`, `clock.minutes`, `clock.minutesLeft`, `clock.start/stop/freeze()` |
| Cleanup | `track(fn)`, `on(target, type, fn, opts)`, `timeout(fn, ms)`, `interval(fn, ms)` |
| Misc | `state` {}, `stage`, `stages`, `stageIndex`, `over`, `layers.{icons,windows,highlight,popups,fx,overlay}`, `make(tag, cls, text)`, `send()`, `restart()`, `CONFIG` |

## Testing

- Open `index.html` in Chrome. F12 console shows stage starts/passes and which art is missing.
- `index.html?stage=7` — skip the title, start directly at stage 7. Add `&freeze` to stop the clock.
- Console: `Game.debug.list()`, `Game.debug.skip()`, `Game.debug.goto(12)`, `Game.debug.missing()`.
- No test framework. Verify by playing your stage: fail it once, fix it, pass it, and check the
  next stage doesn't inherit leftovers.

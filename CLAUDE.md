# CLAUDE.md — Outlook Saga

Game jam game (theme: **BOUNCE BACK**). A fake Windows-XP-style desktop runs a terrible
email client, **Outlook Saga**. The player has to send ONE email to their boss — a grumpy
**printer** (`printer@company.com`) — explaining why they're late. Every Send bounces back
with a new absurd error (17 playable stages). Clippy delivers each error and gets more
unhinged. Stage 18: "delivered" → fake blue screen → the end.

3–4 people edit **different stage files at the same time**. Keep changes local to the file
you were asked to work on.

## Hard rules

1. **Plain HTML + CSS + vanilla JS.** No frameworks, no npm, no build step, no modules
   (`import`/`export`), no fetch of local files. It must run by double-clicking
   `index.html` (file://) AND on itch.io.
2. **ALL VISUALS ARE FILES IN /assets, made by the team or free-licensed stock photos.**
   Stock is OK only with a license that allows use in a game (public domain / CC0 preferred;
   verify on the source page) and must be logged in CREDITS.md. **Never AI-generated art.**
   Never generate images, SVG, canvas
   pictures, emoji-as-icons, base64 images, or **CSS-drawn graphics**: no gradients, no
   shadows (box/text), no rounded corners, no coloured boxes/backgrounds, no decorative
   borders/outlines, no shapes, no glyphs standing in for icons (×, ✓).
   - CSS is ONLY for layout, positioning, text (font, size, colour) and stretching our
     images (border-image 9-slice for frames/buttons, stretched images for everything
     else). Motion (transform/opacity animations) and effects ON our art (e.g. the webcam
     blur) are fine.
   - Pictures (icons, props, characters): `Game.asset('file.png', { w, h })`.
   - Surfaces (frames, bars, buttons, fields, keys, checkboxes, progress bars, panels,
     backgrounds): an element with `data-skin="file.png"` — use `Game.ui.*` or
     `Game.setSkin(el, 'file.png')`.
   - Missing files show a dashed placeholder with the filename. That is intended: it's
     the artists' to-do list. Never "fix" a placeholder by drawing something in CSS.
   - Never use browser-drawn widgets: native `<select>`, checkbox, radio, range,
     `<progress>`, visible scrollbars. Use `Game.ui.*`.
   - Allowed exceptions: text (fonts), a canvas the PLAYER draws on (stage 11), the black
     page background (letterbox bars and `Game.blackout`).
3. **Files are loaded by filename.** The browser reads the content, so a JPG/WebP/AVIF
   saved as `.png` works. HEIC does not (browsers can't decode it) → `tools/fix-art.ps1`.
   A file that fails to load never crashes anything; it shows the placeholder.
4. **Relative paths only**: `assets/x.png`, never `/assets/x.png` (breaks file:// and itch).
5. **New art filename?** Add it to the stage's `assets: [...]` array AND to the asset list in
   README.md. Shared OS/UI art also goes in the `--os-assets` list at the top of style.css.
6. Fixed **1280×720** game screen scaled to fit. Use game pixels everywhere; convert mouse
   positions with `Game.toGame(event)`. Target Chrome desktop only.
7. Don't rename/remove public `Game.*` functions — other people's stages depend on them.
   Adding to the engine is OK when several stages need it; document it here.
8. The boss is a printer. Recipient: `printer@company.com`. Keep jokes consistent.

## Files

```
index.html          title screen, desktop, the mail client, taskbar, layers; loads scripts
style.css           layout + text only. Section 1 = ART LIST + 9-slice settings,
                    section 13 = layout for stage windows
engine.js           CONFIG + the global `Game` object (all helpers + game flow)
clippy-lines.js     ALL TEXT: Clippy's lines, each stage's error/hint/retry, in-stage reactions.
                    `Game.lines = { ...valid JSON... }` (a .js file because file:// can't load .json)
stages/_template.js documented example stage (NOT loaded by index.html)
stages/NN-name.js   one file per stage, registered with Game.registerStage (all 18 are built)
tools/fix-art.ps1   converts fake PNGs (.heic) to real PNGs, warns about white backgrounds
assets/             hand-made art (png)          — pushed by the artists
assets/sounds/      hand-made sounds (wav)       — pushed by the audio people
```

**Text lives in `clippy-lines.js`, not in stage files.** `"general"` = engine lines (greeting,
hint format, generic retries, toolbar/folder reactions, fired); `"stages": { "<id>": { error, clippy,
hint, retry, lines: { key: text } } }`. At init the engine copies each stage's texts onto the stage
(`applyStageText`); `{name}` placeholders are filled from `textVars` on the stage, or from the vars
passed to `Game.line(key, vars)`. In stage code, say things with `G.clippy.say(G.line('key'), mood)` —
never hard-code a Clippy line. Popup "Reason:" strings returned by `check()` may stay in code.
Keep the file valid JSON (double quotes, no trailing commas). A missing key shows
`[missing text: key]` and warns in the console.

Script order in index.html: `engine.js`, `clippy-lines.js`, then every `stages/*.js`. `init()` runs on
`DOMContentLoaded`, after all stages registered. A missing stage file just 404s and is
skipped; stages are sorted by `id` (decimals like 7.5 are allowed).

## The mail client (index.html `#mail-window`)

| Part | Art | Notes |
|---|---|---|
| Title bar | `titlebar.png`, `app-icon.png`, `btn-close/minimize/maximize.png` | close/min/max only make Clippy talk |
| Toolbar | `saga-logo.png`, `tb-new/reply/attach/delete/settings.png`, `ad-banner.png` | buttons do nothing but sarcastic Clippy lines (`TOOLBAR_LINES` in engine.js) |
| Sidebar | `folder-inbox/outbox/sent/drafts/bounced/trash.png`, `user-avatar.png` | **Bounced (N)** counts every bounce (`Game.bounces`); user name = From |
| Compose | `input-box.png` (From/To/Subject), `format-bar.png`, `attach-chip.png`, `body-paper.png`, `char-counter-bg.png`, `btn-send.png` / `btn-send-pressed.png` | body can be swapped for a clickable word view |
| Status bar | `statusbar.png` | "Connected (barely)" (`CONFIG.STATUS_TEXT`); every send shows a **Sending...** bar (`progress-bar.png` / `progress-fill.png`) |

## How art is drawn (engine.js section 4 + style.css sections 1/3)

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
  gets `.skin-<name>`; style.css section 12 switches text colours on art.
- **Cursors** — `cursor.png`, `cursor-hand.png`, `cursor-loading.png`, `text-cursor.png`
  (32×32, optional); the system cursor is used until they exist.

## Game flow (engine.js section 10)

- Email starts with an EMPTY subject. Title screen → Start → loading screen (`loading-screen.png`,
  progress bar, `CONFIG.LOADING_MS` = 3 s) → `winxp.wav` → desktop "boots" with Outlook CLOSED:
  Clippy explains (`general.bootIntro`), the Outlook icon pulses, everything else answers
  `general.openOutlookFirst` → clicking the Outlook icon calls `Game.openMail()` → mail window
  + taskbar button appear, Clippy says `general.greeting`, the clock starts (8:00; deadline 9:00).
  `Game.mailOpen` tracks this; Send does nothing until it's true. `?stage=N` debug jumps skip the
  loading screen and open Outlook immediately.
- `CONFIG.ERROR_SOUND_LEAD_MS` starts `error.wav` that long before the bounce popup appears.
- **Send**: "Sending..." bar, envelope flies out and bounces back (`bounce.wav`, `CONFIG.BOUNCE_MS`),
  Bounced counter +1, costs 1 minute. Clicks and keys are blocked while it flies (`#game.busy`); the popup only appears
  after it lands.
  - no active stage → start the first stage
  - active stage, `check()` fails → "Mail Delivery Bounced (again) - Bounce #N" popup + annoyed Clippy
  - `check()` passes → `cleanup()` + tracked cleanups → start next stage
- **Starting a stage**: `setup()`, then the "Mail Delivery Bounced - Bounce #N" popup (`error.wav`) with
  `error`, and Clippy says `clippy` in mood `vibe`.
- `todo: true` stage = stub: popup adds "[stage not built yet]" and the next Send auto-passes.
- If `setup()` throws, the stage is treated like a stub. If `check()` throws, it passes.
  (The game must always be playable end to end; errors go to the console.)
- `final: true` stage (18): no bounce, envelope flies away, clock stops, `setup()` owns the
  screen. check/cleanup never run.
- Clock hits 9:00 → "You're fired" → `Game.restart()` (page reload).
- Clicking Clippy shows the current stage's `hint` and costs 1 minute.
- **Extras (engine, numbers in CONFIG):** SUBMIT sometimes asks "Are you sure?" first
  (`CONFIRM_CHANCE`, never on the first send; `Game.send()` from code never asks). Clippy mocks
  you after `SLOW_NUDGE_MS` (10 s) without progress — the timer resets when he talks or you send,
  pauses during modal popups (`general.slow.<mood>`). Typing "hack club" / "game jam" in the subject
  (any caps/spacing) shows an achievement popup once and gives back `EASTER_EGG_BONUS_MINUTES`
  (`general.easterEggs`). Stage 18: after "delivered", the printer's reply flies into the Inbox, then
  the blue screen.
- All numbers live in `CONFIG` at the top of engine.js. Timing budget: 17 bounces minimum +
  the clock ticking every 30 s — that's why the clock starts at 8:00, not 8:30.

## Email state flows between stages

| Stage | Changes that stay |
|---|---|
| 1–2 | subject typed, Caps Lock off |
| 3 | attachments: cat.jpg (+ 2 others), the .exe is gone |
| 4 | cat.jpg is 3 MB |
| 5 | body trimmed by the player (Clippy's paragraph partly remains) |
| 6 | cat.jpg → cat.png |
| 7 | subject = the 3-word recovery phrase (found in My Computer, typed on the on-screen keyboard) |
| 8 | all attachments → one "New Folder.zip" |
| 10 | "sorry"s removed from the body |
| 11 | "[signature.png]" appended to the body |
| 12 | angry sentence (calmed) stays in the body |
| 15 | From = `<username>@company.com` |

Every `setup()` still creates what it needs if it's missing, so `?stage=N` works on its own.

## Stage API

```js
Game.registerStage({
  id: 7,                       // order (number)
  name: 'Keyboard disconnected',
  vibe: 'annoyed',             // Clippy mood: 'happy' | 'annoyed' | 'angry' | 'panic' (omit = auto)
  error: 'Popup text.',        // "Mail Delivery Bounced" reason
  clippy: 'Clippy line when the stage starts.',
  hint: 'Clippy line when clicked (costs a minute).',
  retry: ['optional lines', 'when Send fails again'],
  assets: ['file.png'],        // documentation for the checklist
  todo: true,                  // stub — delete when implemented
  final: false,                // only stage 18
  setup(G) {},                 // build the problem (G === Game)
  check(G) { return true; },   // true = fixed | false | 'reason string' (shown in the popup)
  cleanup(G) {},               // undo what isn't auto-tracked
  slowNudge(G) { return null; }, // optional: Clippy's line after 10 s idle (null = generic)
});
```

Clippy tone: polite in 1–6 (`happy`), passive-aggressive in 7–12 (`annoyed`/`angry`),
unhinged in 13–17 (`panic`). Every stage needs a `hint`.

**Stage rules**
- `setup()` must create everything the stage needs if it's missing (attachments, icons, body
  text). Testers jump straight to a stage with `?stage=NN`.
- Everything a stage adds must disappear when it ends. Auto-removed at stage end:
  `openWindow`, `openApp`, `addIcon`, `addProp`, `tray.add`, `highlight`, `dragGhost`,
  `dragAttachments`, `wordView`, `runProgress` (unless `persist: true`), plus `on`, `timeout`,
  `interval`, `track(fn)`. Anything else (DOM you appended yourself, changes to persistent
  tray items wifi/volume/battery, `mail.status`, `mail.charLimit`, `G.state` flags) → undo it
  in `cleanup()`.
- Use `G.state.<something>` for stage flags; delete them in cleanup.
- Stage-window layout CSS goes in style.css section 13 (layout only).
- Desktop real estate: left column (x < 110, y < 380) = default icons; bottom left
  (x < 110, y 400–680) = stage icons/props; right column (x 1030–1270, y < 400) = stage
  icons/windows; Clippy + bubble bottom right. Mail window: x 116–1030, y 6–674.

## Engine API (Game.*)

| Area | API |
|---|---|
| Mail | `mail.to / from / subject / body / status` (get/set), `mail.charLimit` (null or number), `mail.updateCounter()`, `mail.el.{window,from,to,subject,body,bodyWrap,counter,send,attachBar,attachList,status}` |
| Attachments | `attachments.add(name, sizeLabel, iconAsset)` → chip el, `.remove(name)`, `.rename(old, new, {size, icon})`, `.list()`, `.get(name)` → `{name, size, icon, el}`, `.setSize(name, label)`, `.clear()` |
| Drag chips | `dragAttachments((att, point) => …)` — chips become ghost-draggable for this stage; use `hitTest(target, point)` |
| Word view | `wordView(tokens, (i, token, view) => …)` → view `{tokens, render, text(), count(tag), close()}`; tokens `{text, tag}` (tagged = clickable red word); `wordView.split(text)`; closes itself at stage end and writes the text back |
| Pictures | `asset(file, {w, h, className})` → el, `setAsset(el, file)` |
| Surfaces | `setSkin(el, file)`, `skin.has('window-frame')`, attribute `data-skin` / `data-skin-pressed` |
| UI kit | `ui.button(label, onClick, {skin, pressed, className})`, `ui.input({value, placeholder, type, multiline, skin})` → wrapper (`.input`), `ui.checkbox(label, checked, onChange, {readOnly})` (`.checked`, `.setChecked(v)`), `ui.progress(v)` (`.set(0..1)`), `ui.key(label, onClick)` |
| Progress | `runProgress(bar, ms, steps, labelEl)` → Promise (fills a `ui.progress` bar, shows step texts) |
| Sound | `sound(file, volume, rate)` — from assets/sounds/, silent if missing; rate = playbackRate (higher = higher pitch) |
| Popup | `popup({title, text, html, icon, buttons:[{label, onClick(p) → false keeps open}], modal, closable, onClose, skin})` → `{el, close}`. icon: `'error' \| 'warning' \| 'info'` (= icon-*.png) or a filename. Draggable |
| Windows | `openWindow({title, html, x, y, w, h, closable, icon, skin, className, onClose, persist})` → `{el, body, close, setTitle}`; `bringToFront(el)`; `makeMovable(el, handle)`. All windows/popups drag by their title bar |
| Apps | `openApp({id, ...openWindow options})` — one window per `id`; `.created` is true only the first time |
| Desktop | `addIcon({id, label, asset, x, y, onClick, onDoubleClick, persist})` → el (`#icon-<id>`, `.setLabel(t)`), `removeIcon(id)`, `addProp({id, asset, x, y, w, h, layer})` → el (`#prop-<id>`) |
| Tray | `tray.add(id, label, onClick, {icon, text, title, persist})` (icon defaults to `tray-<id>.png`), `tray.setIcon(id, file)`, `tray.setText(id, text)`, `tray.get(id)`, `tray.remove(id)`. Built-in: `wifi`, `volume`, `battery` |
| Drag | `dragGhost(el, {onDrop(point, el), onStart, canDrag, persist})` — drags a copy on the top layer (visible above windows); `makeDraggable(el, {onDrop, revert, …})` moves the element itself (stays in its layer); `hitTest(el, point, pad)` (pad = extra px of hitbox around the target); `overlaps(a, b, minPx)` |
| Coords | `toGame(event)` or `toGame(clientX, clientY)` → game px; `rectOf(el)` → `{x, y, w, h}` in game px |
| Juice | `highlight(selOrEl, ms)` (pulsing highlight-frame.png; 0 = until stage end) → off(); `shake(strength)` (1 = normal, 0.5 light, 2 strong); `blackout(text, ms)` → Promise (black screen + text) |
| Flow | `restartStage()` (cleanup + setup again, no popup), `send()`, `restart()` |
| Clippy | `clippy.say(text, mood)`, `clippy.hide()`, `clippy.mood` |
| Text | `line('key', vars)` (current stage's `lines`), `line('general.x.y', vars)` (any path); stage fields `textVars`, `lines` (fallbacks if clippy-lines.js has no entry) |
| Clock | `clock.add(min)`, `clock.minutes`, `clock.minutesLeft`, `clock.start/stop/freeze/disableDeadline()` |
| Stats | `Game.stats` = `{ bounces, rewrites, charsTyped, charsDeleted, startTime, endTime, hintsUsed }` for the whole run. rewrites = sends where To/Subject/body/attachments changed since the previous send; chars = real typing in subject/body (+ `ui.key` presses; text set from code doesn't count). The live counter in the mail statusbar (`#bounce-meter`) reads "You bounced back 7 times" |
| Run timer | `timer.ms / text / start() / stop() / format(ms)`, `timer.best`, `timer.saveBest()` (true = new record; only full runs from the title screen count). Real time, shown in the taskbar next to the clock; starts when Outlook opens, stops on delivered/fired |
| Cleanup | `track(fn)`, `on(target, type, fn, opts)`, `timeout(fn, ms)`, `interval(fn, ms)` |
| Misc | `state` {}, `stage`, `stages`, `stageIndex`, `over`, `bounces`, `layers.{icons,windows,highlight,popups,fx,overlay}`, `make(tag, cls, text)`, `CONFIG` |

## Testing

- Open `index.html` in Chrome. F12 console shows stage starts/passes and which art is missing.
- `index.html?stage=7` — skip the title, start directly at stage 7.
  `&nodeadline=1` — 9:00 never fires you. `&freeze` — the clock doesn't move at all.
- Console: `Game.debug.list()`, `Game.debug.skip()`, `Game.debug.goto(12)`, `Game.debug.missing()`.
- No test framework. Verify by playing: fail the stage once, fix it, pass it, and check the
  next stage doesn't inherit leftovers. README.md has a per-stage test checklist.

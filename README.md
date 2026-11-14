# Outlook Saga

*A game jam game. Theme: **BOUNCE BACK**.*

You're late for work. Send ONE email to your boss. Every time you press Send, it bounces
back with a new, increasingly absurd error. Fix it, resend, repeat. Clippy is here to
help. Clippy is not okay.

---

## Run it

- **Locally:** double-click `index.html` (Chrome). No server, no install, no build.
- **itch.io:** zip the *contents* of the repo folder (so `index.html` is at the top of the
  zip, next to `engine.js`, `style.css`, `stages/` and `assets/`). Upload it as an
  **HTML** project, tick "This file will be played in the browser", and set the embed
  size to **1280 × 720** (turn on the fullscreen button).

### Testing shortcuts

| What | How |
|---|---|
| Jump straight to a stage | `index.html?stage=7` |
| Freeze the clock | `index.html?stage=7&freeze` |
| See loaded stages | F12 console → `Game.debug.list()` |
| Pass the current stage | `Game.debug.skip()` |
| Jump to stage N | `Game.debug.goto(12)` |
| List art that failed to load | `Game.debug.missing()` |

When you open `?stage=N` directly, sounds may stay silent until you click once
(Chrome's autoplay rule). That's normal.

---

## How to build a stage

Each stage is one file in `stages/`. Every stage already exists as a stub, so the game is
always playable end to end. Stubs say *[stage not built yet]* and pass automatically.

1. Open your stage file (e.g. `stages/07-keyboard-disconnected.js`). The comment at the
   top says exactly what the player must do, plus an implementation plan.
2. Fill in `setup(G)`, `check(G)` and `cleanup(G)`. `stages/_template.js` is a fully
   working, commented example.
3. Build all UI from `G.ui.button / input / checkbox / progress / key`, pictures from
   `G.asset()`. Never draw anything in CSS (see "Art rules").
4. Delete the `todo: true` line.
5. Test with `index.html?stage=7&freeze`: fail it once, fix it, pass it.
6. Only commit your own stage file (+ new art). If you need an engine change, tell the team.

**New stage?** Copy `stages/_template.js` to `stages/NN-name.js`, give it an `id`
(decimals work, e.g. `7.5`), and add a `<script>` tag for it in `index.html`.

The full API and rules are in [CLAUDE.md](CLAUDE.md). Short version:

```js
Game.registerStage({
  id: 5, name: 'Character limit', vibe: 'annoyed',      // vibe = Clippy's mood
  error: 'Email exceeds the character limit.',           // popup text
  clippy: 'Nobody reads past the first line anyway.',    // Clippy's line
  hint: 'Delete text until the counter is under the limit.',
  setup(G)   { G.mail.charLimit = 280; },
  check(G)   { return G.mail.body.length <= 280 || 'Still too long.'; },
  cleanup(G) { G.mail.charLimit = null; },
});
```

### Tuning

All the numbers are in `CONFIG` at the top of `engine.js`: start time (8:30),
deadline (9:00), minutes per Send / per hint, real seconds per game minute, and so on.

> **Heads-up:** with the default numbers, 18 sends already eat 18 of your 30 minutes.
> That leaves about 6 real minutes of clock-ticking for the whole game. Playtest it and
> probably raise `REAL_SECONDS_PER_MINUTE` or move `START_TIME` earlier.

---

## Art rules

- **Every visual is drawn by our team.** No AI-generated or stock art. No code that draws
  graphics: CSS only does layout, positioning, text and stretching our images. No CSS
  gradients, shadows, rounded corners, coloured boxes, borders or shapes.
- Art goes in `assets/`, sounds in `assets/sounds/`. Use **exactly** these filenames
  (lowercase, `.png` / `.wav`). Transparent PNG is fine everywhere.
- **Missing art = a dashed pink box with the filename** in the game. That box is the to-do
  list. Missing sounds are silent. Missing cursors fall back to the normal system cursor.
- Sizes below are how big things appear on the 1280×720 screen. Drawing at **2×** looks
  crisper on big monitors.
- **9-slice** (frames, bars, buttons, fields): draw one small picture. Its corners stay exactly
  as drawn, and the edges and middle stretch to any size. The middle of the drawing is the
  element's background. Each file's corner size is set at the top of `style.css`
  (`--slice-<name>` in drawing pixels and `--frame-<name>` in screen pixels), so tweak it there
  to fit your drawing. Anything not marked 9-slice is stretched or fit to the size listed.
- Text sits on top of your art, so leave the middle calm. Text colours for art (e.g. white on
  the title bar) are at the top of `style.css`.

### Exporting art (read this before you save!)

1. **Transparency doesn't come from the `.png` name.** A PNG is only see-through where your
   drawing program saved see-through pixels. If you drew on a white background layer, the
   white is saved too, and you get a white box around Clippy.
   - **Krita / Photoshop / GIMP / Paint.NET / Photopea:** hide or delete the background layer
     (you should see a grey checkerboard), then *Export as PNG*.
   - **Procreate:** untick the *Background colour* layer, then *Share → PNG*.
   - **Windows 11 Paint:** turn on *Layers*, hide the background layer, then save as PNG.
     (Old classic Paint can't save transparency at all.)
   - **Aseprite:** use a transparent background colour, then *Export*.
2. **Must be a real PNG.** Don't rename a `.heic`, `.jpg` or `.webp` file to `.png`, because the
   browser can't open it and you'll still see the placeholder. iPhones and iPads often save
   HEIC: export as PNG from the drawing app, or AirDrop/save "as PNG".
3. **Crop the canvas to the drawing.** Don't leave your shape in the corner of a big empty canvas.
   This matters most for 9-slice art: the title bar should be a tight ~120×30 strip, not a
   300×200 page. Then adjust `--slice-<name>` at the top of `style.css` to the corner size you
   drew.
4. **Opaque is correct** for things that fill a whole rectangle: `wallpaper.png`,
   `title-background.png`, `bluescreen.png`, and frames whose middle is the window background.

If a file you added still shows the dashed placeholder, it's either named wrong or not a real
PNG. `Game.debug.missing()` in the F12 console lists those files.

**Quick fix tool:** right-click `tools/fix-art.ps1` → *Run with PowerShell*. It converts
any fake PNGs (e.g. renamed `.heic`) in `assets/` into real PNGs (originals go to
`_art-backup/`), and warns about files with a solid white background. It never changes
your drawing, only the file format. (Converting `.heic` needs Microsoft's free "HEIF Image
Extensions".)

## Asset checklist

### Game art (`assets/`)
- [x] `title-logo.png`: Outlook Saga logo on the title screen (600×200)
- [ ] `title-background.png`: title screen background (1280×720)
- [x] `wallpaper.png`: desktop wallpaper (1280×680, the area above the taskbar)
- [ ] `icon-outlook-saga.png`: app icon (48×48 on the desktop, also shown at 16×16 in the title bar and taskbar)
- [x] `envelope.png`: the envelope that flies out and bounces back (shown 64×48; 100×70 file is fine)
- [x] `clippy-happy.png`: Clippy, stages 1–4 (128×128)
- [x] `clippy-annoyed.png`: Clippy, stages 5–9 + "you didn't fix it" (128×128)
- [x] `clippy-angry.png`: Clippy, stages 10–14 (128×128)
- [x] `clippy-panic.png`: Clippy, stages 13–17 (128×128)
- [x] `ad-banner.png`: ad in the mail toolbar, top right (120×44)
- [x] `user-avatar.png`: the player's picture next to From/To/Subject (64×64)
- [ ] `clippy-bubble.png`: Clippy's speech bubble, with the tail at the bottom right (9-slice; ~300 px wide on screen)

### OS: windows and popups (`assets/`)
- [x] `window-frame.png`: window border + body background (9-slice)
- [x] `titlebar.png`: window title bar, 30 px tall (9-slice). The current file is a line on a 300×200 canvas; a tight ~120×30 drawing will look better
- [x] `popup-frame.png`: dialog border + background (9-slice)
- [x] `btn-close.png`: title bar close button (21×21)
- [x] `btn-minimize.png`: title bar minimize button (21×21)
- [x] `btn-maximize.png`: title bar maximize button (21×21)
- [x] `icon-error.png`: popup icon (42×42)
- [x] `icon-warning.png`: popup icon (42×42)
- [x] `icon-info.png`: popup icon (42×42)

### OS: controls (`assets/`)
- [ ] `button.png`: normal button (9-slice; buttons are 26–50 px tall)
- [ ] `button-pressed.png`: button while held down (9-slice)
- [ ] `input-box.png`: text field and the email body (9-slice)
- [ ] `checkbox.png`: checkbox, unticked (16×16)
- [ ] `checkbox-checked.png`: checkbox, ticked (16×16)
- [ ] `progress-bar.png`: progress bar track (9-slice, 20 px tall)
- [ ] `progress-fill.png`: progress bar fill (stretched)
- [ ] `key.png`: on-screen keyboard key (9-slice, ~40×40)
- [ ] `key-pressed.png`: key while held down (9-slice)
- [ ] `attachment-chip.png`: background of an attachment in the email (9-slice, 26 px tall)
- [ ] `highlight-frame.png`: pulsing "look here!" frame around things (9-slice)

### OS: taskbar and desktop (`assets/`)
- [x] `taskbar.png`: taskbar strip (9-slice, 1280×40)
- [x] `start-button.png`: Start button; draw the word "start" into it (120×40)
- [ ] `taskbar-button.png`: the "New Message" task button (9-slice, ~190×30)
- [ ] `tray.png`: tray area behind the icons and clock, bottom right (9-slice, 40 px tall)
- [ ] `tray-wifi.png`, `tray-wifi-off.png` (stage 17): tray icons (20×20)
- [ ] `tray-volume.png`: tray icon (20×20)
- [ ] `tray-battery.png`: tray icon, shown next to the % text (20×20)
- [ ] `tray-caps.png`, `tray-caps-on.png`: Caps Lock toggle, off / ON (20×20, stage 2)
- [ ] `icon-my-computer.png`: desktop icon (48×48)
- [ ] `icon-folder.png`: desktop icon, "New Folder (37)" (48×48)
- [ ] `icon-homework.png`: desktop icon, "Homework" (48×48)
- [ ] `cursor.png`: mouse arrow (32×32, tip at the top-left pixel)
- [ ] `cursor-hand.png`: pointing hand over clickable things (32×32)
- [ ] `cursor-loading.png`: busy cursor while the email flies (32×32)

### Blue screen (`assets/`)
- [ ] `bluescreen.png`: full-screen blue background (1280×720)
- [ ] `bluescreen-face.png`: the big ":(" (200×170)

### Stage art (`assets/`)
- [x] Stage 3: `file-photo.png`, `file-doc.png`, `file-exe.png` (attachment icons, 20×20); `trash-empty.png`, `trash-full.png` (desktop icon, 48×48)
- [x] Stage 4: `cat.png`, `cat-squished.png` (≈300×220)
- [ ] Stage 6: `icon-converter.png` (48×48)
- [ ] Stage 8: `icon-zip.png` (48×48)
- [ ] Stage 9: `winrawr-logo.png` (≈120×120)
- [ ] Stage 11: `signature-pad.png` (480×200)
- [ ] Stage 12: `mood-meter.png` (≈220×120), `mood-needle.png`
- [ ] Stage 13: `charger-plug.png` (≈90×60), `laptop-port.png` (≈70×50), `tray-battery-low.png` (20×20)
- [ ] Stage 14: `icon-webcam.png` (48×48), `webcam-bed.png`, `webcam-office.png` (≈420×280)
- [ ] Stage 15: `rule-ok.png`, `rule-fail.png` (16×16)
- [ ] Stage 16: `boss-1.png` … `boss-9.png` (120×120 each, nine different photos of the boss), `captcha-grid.png` (≈390×390), `captcha-selected.png` (120×120 overlay)
- [ ] Stage 17: `network-cable.png` (≈140×90), `wall-socket.png` (≈80×100)

### Sounds (`assets/sounds/`)
- [ ] `send.wav`: Send pressed
- [ ] `bounce.wav`: envelope bounces back
- [ ] `error.wav`: Mail Delivery Failed popup
- [ ] `clippy.wav`: Clippy talks
- [ ] `bluescreen.wav`: the final crash
- [ ] `trash.wav`: stage 3, a file lands in the Recycle Bin
- [ ] `squish.wav`: stage 4, the cat gets compressed

---

## Project structure

```
index.html          title screen, desktop, mail window, taskbar, layers; loads all scripts
style.css           layout + text only; ART LIST + 9-slice settings at the top
engine.js           the engine: CONFIG + global `Game` object
stages/_template.js documented example stage (copy me)
stages/01..18-*.js  one file per stage
tools/fix-art.ps1   converts fake PNGs (.heic) to real PNGs, warns about white backgrounds
assets/             hand-made art
assets/sounds/      hand-made sounds
CLAUDE.md           architecture + API + rules (for humans and Claude Code)
```

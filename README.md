# Outlook Saga

*A game jam game. Theme: **BOUNCE BACK**.*

You're late for work. Send ONE email to your boss, a grumpy office **printer**
(`printer@company.com`). Every time you press Send, it bounces back with a new, increasingly
absurd error. Fix it, resend, repeat. Clippy is here to help. Clippy is not okay.

---

## Run it

- **Locally:** double-click `index.html` (Chrome). No server, no install, no build.
- **itch.io:** zip the *contents* of the repo folder (so `index.html` is at the top of the
  zip, next to `engine.js`, `style.css`, `stages/` and `assets/`). Leave out `_art-backup/`
  and `tools/`. Upload it as an **HTML** project, tick "This file will be played in the
  browser", and set the embed size to **1280 × 720** (turn on the fullscreen button).

### Testing shortcuts

| What | How |
|---|---|
| Jump straight to a stage | `index.html?stage=7` |
| Never get fired at 9:00 | add `&nodeadline=1` |
| Stop the clock completely | add `&freeze` |
| See loaded stages | F12 console → `Game.debug.list()` |
| Pass the current stage | `Game.debug.skip()` |
| Jump to stage N | `Game.debug.goto(12)` |
| Art that failed to load | `Game.debug.missing()` |

When you open `?stage=N` directly, sounds may stay silent until you click once
(Chrome's autoplay rule). That's normal.

---

## Test checklist (all 18 stages)

Open each link (from the project folder), fail the stage once by pressing SUBMIT, then beat it:

| # | Link | How to beat it |
|---|---|---|
| 1 | `index.html?stage=1&nodeadline=1` | Type anything in **Subject**, press SUBMIT. |
| 2 | `index.html?stage=2&nodeadline=1` | Subject is forced to CAPS. Click the **Caps Lock icon** in the tray (bottom right), retype the subject with lowercase letters. |
| 3 | `index.html?stage=3&nodeadline=1` | Drag `definitely_not_a_virus.exe` + one more chip onto the **Recycle Bin** (bottom left). Dragging `cat.jpg` there bounces back ("Not the cat"). Max 3 left. |
| 4 | `index.html?stage=4&nodeadline=1` | Click the **cat.jpg** chip → preview → **drag the hydraulic press down** onto the cat (size shrinks live). Let go halfway once: it springs back. Push all the way down → flat cat, 3 MB. |
| 5 | `index.html?stage=5&nodeadline=1` | Body is ~1400 chars, counter red. Delete text until it's 20–500 characters. |
| 6 | `index.html?stage=6&nodeadline=1` | **Double-click** "Convertinator 3000" (top right) → drag the **cat.jpg** chip into the drop zone → wait → it becomes cat.png. |
| 7 | `index.html?stage=7&nodeadline=1` | Real keyboard does nothing. Open **My Computer** (desktop, top left): a big fake file system. `keyboard recovery phrase.txt` is right in the first folder (C:\, next to the folders; ignore the OLD / Copy / .txt.exe decoys deeper inside). Type the **word** in it as the subject on the **on-screen keyboard** (all letters reshuffle after every press). A wrong word fails. |
| 8 | `index.html?stage=8&nodeadline=1` | Drag every chip onto **New Folder.zip** (bottom left), then drag the zip icon into the mail window. |
| 9 | `index.html?stage=9&nodeadline=1` | Ignore the fleeing "Buy license". Click **Continue trial**, wait for the sad nag, click **Continue trial** again. |
| 11 | `index.html?stage=11&nodeadline=1` | Scribble a decent signature on the pad (a dot is rejected) → **Submit signature**. |
| 12 | `index.html?stage=12&nodeadline=1` | Click the 6 red shouty words (WHY, ALWAYS, !!!, UNACCEPTABLE, SERIOUSLY, HATE) until the meter shows 15%. |
| 13 | `index.html?stage=13&nodeadline=1` | Close the popup: the view zooms OUT of the screen to the real laptop on a desk (the game keeps running inside it). Within 20 s drag the **charger** on the desk into the **port** on the right side of the laptop. Stray clicks cost 1 s. It zooms back in, then press SUBMIT. Let it hit 0 once: "Laptop died.", -2 min, restart. |
| 14 | `index.html?stage=14&nodeadline=1` | Click **Webcam** (top right) → **Background effects** → **Office**. (Blur fails: "Still a bed.") |
| 15 | `index.html?stage=15&nodeadline=1` | Type a username and press **Create** repeatedly; each try reveals a rule. `Bounce8kiwiMayprinter` passes all 7. From changes to your username. |
| 16 | `index.html?stage=16&nodeadline=1` | Bus captcha (London street, 4×4 squares). Select the 6 squares with the red buses (the 3 middle-row squares on the right + the 3 below them; NOT the black cabs) → **Verify**. Skip or wrong squares fail. |
| 17 | `index.html?stage=17&nodeadline=1` | Wifi is off. Drag the **network cable** (under the left edge of the mail window) onto the **wall socket** (bottom left). |
| 18 | `index.html?stage=18` | A "Sending..." window with a progress bar fills up, then 24 error sounds stack (0.1 s apart, no blue screen sound) and the blue screen appears. Any key after a few seconds restarts. |

Full run: `index.html` → Start → play 1 to 18 without debug flags. The clock starts at 8:00;
you're fired at 9:00. Each bounce costs 1 minute, a hint costs 1, and the clock ticks every 30 s.

---

## Editing what Clippy says

Every line of text lives in **`clippy-lines.js`**: Clippy's greeting and reactions, each stage's
error popup, Clippy line, hint and "failed again" lines, and his reactions during stages. Open it,
change the text between the quotes, save, refresh. Everything after `Game.lines =` is plain JSON:
keep the "double quotes", put commas between items (but not after the last one), write a line break
as `\n` and a quote as `\"`, and leave `{name}`-style placeholders as they are. If something shows
`[missing text: …]`, a key is misspelled or there's a JSON typo (paste the `{ … }` part into
jsonlint.com).

---

## How to build or change a stage

Each stage is one file in `stages/`. The comment at the top of each file says what the
player must do. `stages/_template.js` is a fully working, commented example and has a cheat
sheet of every helper. The full API and rules are in [CLAUDE.md](CLAUDE.md).

1. Build all UI from `G.ui.button / input / checkbox / progress / key`, pictures from
   `G.asset()`. Never draw anything in CSS (see "Art rules").
2. `setup()` must create everything the stage needs, even when the stage is opened directly.
3. Everything a stage creates must disappear when it ends (use the tracked helpers).
4. Test with `index.html?stage=N&nodeadline=1`: fail it once, fix it, pass it.

**New stage?** Copy `stages/_template.js` to `stages/NN-name.js`, give it an `id`
(decimals work, e.g. `7.5`), and add a `<script>` tag for it in `index.html`.

All tunable numbers (start time, deadline, minutes per send/hint, clock speed) are in
`CONFIG` at the top of `engine.js`.

---

## Art rules

- **Every visual is made by our team, or is a stock photo with a license that allows use in a
  game** (public domain / CC0 is easiest). Log every stock file in [CREDITS.md](CREDITS.md)
  with its source and license. **No AI-generated art.** No code that draws
  graphics: CSS only does layout, positioning, text and stretching our images. No CSS
  gradients, shadows, rounded corners, coloured boxes, borders or shapes.
- Art goes in `assets/`, sounds in `assets/sounds/`. Use **exactly** these filenames.
- **Missing art = a dashed pink box with the filename** in the game. That box is the to-do
  list. Missing sounds are silent. Missing cursors fall back to the normal system cursor.
- Files are loaded by name: a JPG, WebP or AVIF saved as `.png` still works. **HEIC
  (iPhone/iPad) does not**: run `tools/fix-art.ps1` (right-click → Run with PowerShell).
  It converts them and warns about white backgrounds.
- **9-slice** (marked below): draw one small picture. Its corners stay as drawn, and the edges and middle
  stretch. Corner sizes are set at the top of `style.css` (`--slice-<name>` / `--frame-<name>`).
- Sizes are how big things appear on the 1280×720 screen. Drawing at 2× looks crisper.

### Exporting art

1. **Transparency doesn't come from the `.png` name.** Hide/delete the background layer
   (you should see a checkerboard) before exporting. Procreate: untick *Background colour*.
   Windows 11 Paint: Layers → hide the background. Classic Paint can't do transparency.
2. **Must be a real PNG.** Don't rename `.heic` files; export as PNG (or run the fix tool).
3. **Crop the canvas to the drawing** (especially 9-slice art).
4. **Opaque is correct** for things that fill a whole rectangle (wallpaper, backgrounds,
   frames, photos).

---

## Asset list (every file the game uses)

`[x]` = in `assets/` right now · `[ ]` = still needed (shows a placeholder)

### Title, desktop, Clippy
- [x] `title-logo.png`: title screen logo (600×200)
- [ ] `title-background.png`: title screen background (1280×720)
- [ ] `loading-screen.png`: the 3-second loading screen after Start (1280×720; the "Starting dihdows xp" text and the progress bar sit near the bottom)
- [x] `wallpaper.png`: desktop (1280×680)
- [x] `envelope.png`: flies out and bounces back (64×48)
- [x] `clippy-happy.png`, [x] `clippy-annoyed.png`, [x] `clippy-angry.png`, [x] `clippy-panic.png`: 128×128
- [ ] `speech-bubble.png`: Clippy's bubble, tail at the bottom right (9-slice, ~300 wide)
- [ ] `icon-my-computer.png`, [ ] `icon-folder.png`, [ ] `icon-homework.png`: desktop icons (48×48)

### The Outlook Saga client
- [ ] `app-icon.png`: app icon (title bar 16×16, desktop 48×48, taskbar)
- [ ] `saga-logo.png`: toolbar logo (120×40)
- [ ] `tb-new.png`, [ ] `tb-reply.png`, [ ] `tb-attach.png`, [ ] `tb-delete.png`, [ ] `tb-settings.png`: toolbar icons (28×28)
- [x] `ad-banner.png`: toolbar ad (120×44)
- [ ] `folder-inbox.png`, [ ] `folder-outbox.png`, [ ] `folder-sent.png`, [ ] `folder-drafts.png`, [ ] `folder-bounced.png`, [ ] `folder-trash.png`: sidebar (20×20)
- [x] `user-avatar.png`: sidebar (64×64)
- [ ] `input-box.png`: From/To/Subject + stage text fields (9-slice)
- [ ] `format-bar.png`: B / I / U strip above the body (~730×28)
- [ ] `body-paper.png`: the email body background (9-slice)
- [ ] `attach-chip.png`: attachment chip background (9-slice, 26 tall)
- [ ] `char-counter-bg.png`: behind the character counter (9-slice)
- [x] `btn-send.png`, [x] `btn-send-pressed.png`: SUBMIT button (110×40)
- [ ] `statusbar.png`: bottom bar "Connected (barely)" (9-slice, 26 tall)

### Windows, popups, controls
- [x] `window-frame.png`, [x] `titlebar.png`, [x] `popup-frame.png` (9-slice)
- [x] `btn-close.png`, [x] `btn-minimize.png`, [x] `btn-maximize.png` (21×21)
- [x] `icon-error.png`, [x] `icon-warning.png`, [x] `icon-info.png`: popup icons (42×42)
- [ ] `button.png`, [ ] `button-pressed.png`: normal buttons (9-slice)
- [ ] `checkbox.png`, [ ] `checkbox-checked.png` (16×16; stages 15, 16)
- [ ] `progress-bar.png`, [ ] `progress-fill.png`: "Sending..." bar + stages 4, 6 (9-slice / stretched)
- [ ] `key.png`, [ ] `key-pressed.png`, [ ] `keyboard-frame.png`: on-screen keyboard (stage 7)
- [ ] `highlight-frame.png`: pulsing "look here" frame, **transparent middle** (9-slice)

### Taskbar
- [x] `taskbar.png` (9-slice) · [x] `start-button.png` (120×40) · [ ] `taskbar-button.png` (9-slice) · [ ] `tray.png` (9-slice)
- [x] `tray-wifi.png`, [ ] `tray-wifi-off.png`, [x] `tray-volume.png`, [x] `tray-battery.png`, [x] `tray-caps.png`, [x] `tray-caps-on.png`, [ ] `tray-keyboard-off.png` (20×20)
- [ ] `cursor.png`, [ ] `cursor-hand.png`, [ ] `cursor-loading.png`, [ ] `text-cursor.png` (optional, 32×32)

### Stages
- 3: [x] `file-photo.png`, [x] `file-doc.png`, [x] `file-exe.png` (20×20), [x] `trash-empty.png`, [x] `trash-full.png` (48×48)
- 4: [x] `cat.png` (~300×180; squished live by the press), [ ] `press.png` (hydraulic press head/plate, ~240×90; its BOTTOM edge touches the cat)
- 6: [ ] `icon-converter.png` (48×48), [ ] `drop-zone.png` (9-slice, ~300×110)
- 7: `keyboard-frame.png`, `key.png`, `key-pressed.png`, `tray-keyboard-off.png` (above); the My Computer file browser reuses `icon-my-computer.png`, `icon-folder.png`, `file-doc.png`, `file-exe.png`, `file-photo.png`
- 8: [ ] `icon-zip.png` (48×48)
- 9: [ ] `winrawr-logo.png` (100×100)
- 11: [ ] `signature-pad.png` (480×200)
- 12: [ ] `mood-meter.png` (200×110 dial), [ ] `mood-needle.png` (10×90, pointing UP, pivot at the bottom centre)
- 13 (zoom-out to the real world): [x] `desk-background.png` (the desk/room), [x] `laptop.png` (the laptop with its **screen area transparent**; the live game shows through it), [x] `charger.png` (plug + cable, prongs at the TOP; when plugged in it turns 90° left so the prongs go into the port), [x] `laptop-port.png` (the socket). Positions/sizes are constants at the top of `stages/13-battery.js` (HOLE, LAPTOP, PORT, CHARGER, CHARGER_FACE): adjust them to the drawings.
- 14: [ ] `icon-webcam.png` (48×48), [ ] `webcam-bed.png`, [ ] `webcam-office.png` (420×280)
- 16: [x] `captcha-bus.png` (public-domain stock photo, see CREDITS.md; 800×800 shown at 400×400, cut into 4×4 squares. If you replace it, update `BUS_SQUARES` / `EDGE_SQUARES` at the top of `stages/16-captcha.js`), [ ] `captcha-header.png` (the blue "Select all squares with buses" header, ~412×90), [ ] `captcha-frame.png` (panel behind the grid; shows through the gaps as the grid lines), `checkbox-checked.png` (tick on selected squares)
- No longer used: `boss-1.png` … `boss-9.png` (the old printer captcha). The uploaded ones can be deleted or reused.
- 17: [ ] `network-cable.png` (140×90), [ ] `wall-socket.png` (80×80), `tray-wifi-off.png`
- 18: [ ] `bluescreen-bg.png` (1280×720), [ ] `bluescreen-face.png` (200×170)

### Sounds (`assets/sounds/`)
- [ ] `send.wav`, [ ] `bounce.wav` (must be in `assets/sounds/`), [x] `error.wav`, [x] `bluescreen.wav`
- [x] `winxp.wav`: plays when the loading screen ends and the desktop appears
- [x] `button.wav`: plays on every button and desktop-icon press (dialogs, toolbar, keys, title bar, Start, SUBMIT, icons)
- [x] `fan.wav`: PC fan, loops the whole game; loud when you press Start, then fades to a quiet hum (`FAN_*` in CONFIG)
- [x] `compressing.mp3`: stage 4, plays when the hydraulic press squishes the cat all the way flat
- [ ] `easter-egg.wav`: typing "hack club" / "game jam" in the subject (achievement popup)
- [ ] `empty-bin.wav`: stage 3, emptying the Recycle Bin
- Clippy has **no** sound (on purpose), so `clippy.wav` isn't used.

---

## Project structure

```
index.html          title screen, desktop, mail client, taskbar, layers; loads all scripts
style.css           layout + text only; ART LIST + 9-slice settings at the top
engine.js           the engine: CONFIG + global `Game` object
clippy-lines.js     every text in the game (Clippy, errors, hints), edit freely
CREDITS.md          stock photos used and their licenses
stages/_template.js documented example stage (copy me)
stages/01..18-*.js  one file per stage (all built)
tools/fix-art.ps1   converts fake PNGs (.heic) to real PNGs, warns about white backgrounds
assets/             hand-made art
assets/sounds/      hand-made sounds
CLAUDE.md           architecture + API + rules (for humans and Claude Code)
```

/* =============================================================================
 *  OUTLOOK SAGA — engine.js
 *  -----------------------------------------------------------------------------
 *  The game engine. It creates ONE global object, `Game`, which every stage file
 *  talks to. Load order (see index.html):
 *
 *      engine.js  ->  stages/01-*.js ... stages/18-*.js  ->  DOMContentLoaded -> init()
 *
 *  Sections in this file:
 *     1. CONFIG ............ all tunable numbers (clock, costs, paths, timings)
 *     2. Core state + stage registry
 *     3. Screen scaling + coordinates
 *     4. Art (pictures + skins), UI kit & sound
 *     5. Stage-scoped cleanup (Game.track & friends)
 *     6. UI helpers (popups, windows, apps, icons, props, tray, drag, juice)
 *     7. Clippy
 *     8. Mail (fields, attachments, word view, status bar, Bounced counter)
 *     9. Clock
 *    10. Game flow (send -> bounce -> stages -> ending)
 *    11. Debug tools
 *    12. Boot
 *
 *  Several people write stages against this API at the same time:
 *  DON'T rename or remove public Game.* functions. Adding new ones is fine.
 *  Read CLAUDE.md for the rules. The big one: EVERY visual is a hand-made file
 *  in /assets. No generated images, no SVG, no CSS-drawn graphics (gradients,
 *  shadows, rounded corners, coloured boxes). Use Game.asset() for pictures and
 *  data-skin / Game.ui.* for surfaces (frames, buttons, fields...).
 * ========================================================================== */
'use strict';

/* =============================================================================
 *  1. CONFIG — tune the game here
 * ========================================================================== */
const CONFIG = {
  // ---- Screen (the game is always this size, scaled to fit the window) ----
  WIDTH: 1280,
  HEIGHT: 720,

  // ---- Clock (in minutes after midnight) ----
  START_TIME: 8 * 60,            // 8:00 — the clock starts here. (8:30 was unwinnable: 18 stages =
                                 //  18+ bounces = 18+ minutes, plus the clock ticking on its own.)
  DEADLINE: 9 * 60,              // 9:00 — "You're fired"
  SEND_COST_MINUTES: 1,          // every press of Send costs this much
  HINT_COST_MINUTES: 1,          // every click on Clippy (hint) costs this much
  REAL_SECONDS_PER_MINUTE: 30,   // the clock also ticks by itself: 1 game minute per N real seconds
  WARNING_MINUTES_LEFT: 5,       // clock starts blinking when this few minutes are left

  // ---- little extras ----
  SLOW_NUDGE_MS: 10000,          // Clippy mocks you after this long without progress (and Clippy silent)
  CONFIRM_CHANCE: 0.25,          // chance that SUBMIT asks "Are you sure?" first (never on the first send)
  CONFIRM_AGAIN_CHANCE: 0.35,    // ...and after "Yes", the chance it asks AGAIN
  EASTER_EGG_BONUS_MINUTES: 2,   // typing "hack club" / "game jam" in the subject gives this many minutes back

  // ---- Mail ----
  BOSS_ADDRESS: 'printer@company.com', // the boss is a grumpy printer
  PLAYER_ADDRESS: 'you@company.com',
  DEFAULT_BODY:
    'Dear Printer,\n\n' +
    "I'm going to be a few minutes late today. My alarm clock bounced off the wall " +
    'and rolled under the fridge.\n\n' +
    "I'll be at my desk by 9:00. Please don't jam.\n\n" +
    'Best regards,\nMe',
  STATUS_TEXT: 'Connected (barely)',

  // ---- Paths (RELATIVE on purpose: a leading "/" breaks file:// and itch.io) ----
  ASSET_PATH: 'assets/',
  SOUND_PATH: 'assets/sounds/',
  MASTER_VOLUME: 0.8,            // 0..1, multiplies every Game.sound()

  // ---- Animation timings (ms) ----
  BOUNCE_MS: 1600,               // envelope flies out and bounces back
  ERROR_SOUND_LEAD_MS: 900,      // start error.wav this long BEFORE the "Mail Delivery Bounced" popup appears
  DELIVER_MS: 900,               // envelope flies out and never returns (final stage)
  LOADING_MS: 3000,              // loading screen after Start; then sounds/winxp.wav plays

  // ---- Background PC fan (sounds/fan.wav, loops the whole game) ----
  FAN_START_VOLUME: 1.0,         // 0..1 — loud when you press Start (PC spinning up)
  FAN_GAME_VOLUME: 0.08,         // 0..1 — quiet level it settles at for the rest of the game
  FAN_FADE_MS: 8000,             // how long it takes to go from loud to quiet
};

/* =============================================================================
 *  2. CORE STATE + STAGE REGISTRY
 * ========================================================================== */
const Game = {
  CONFIG,
  state: {},        // shared scratch object for stages: Game.state.myThing = ...
  stages: [],       // all registered stages, sorted by id
  stage: null,      // the stage that is currently active (or null)
  stageIndex: -1,   // index of the active stage in Game.stages (-1 = none yet)
  started: false,   // true once the player pressed Start on the title screen
  over: false,      // true after being fired or reaching the final stage
  bounces: 0,       // how many times the email bounced (shown on the Bounced folder)
  // Bounce-back tracker for the whole run (shown in the statusbar and on the end screen):
  stats: {
    bounces: 0,      // failed sends (same as Game.bounces)
    rewrites: 0,     // sends where To/Subject/body/attachments changed since the previous send
    charsTyped: 0,   // characters typed into subject + body (incl. stage 7's on-screen keyboard)
    charsDeleted: 0, // characters deleted from subject + body
    startTime: null, // Date.now() when Outlook opened (the run timer started)
    endTime: null,   // Date.now() when delivered / fired
    hintsUsed: 0,    // Clippy hint clicks
  },
  mailOpen: false,  // the Outlook Saga window is closed at boot; the player opens it from the desktop
  scale: 1,         // current screen scale factor (set by fit())
  layers: {},       // DOM layers: icons, windows, highlight, popups, fx, overlay (filled by init)
  lines: {},        // ALL texts (Clippy, errors, hints) — filled by clippy-lines.js
};
window.Game = Game;

(function () {
  // ---------------------------------------------------------------------------
  //  Tiny DOM helpers (private to the engine — stages can use Game.make)
  // ---------------------------------------------------------------------------
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const resolveEl = (target) => (typeof target === 'string' ? document.querySelector(target) : target);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /** make('div', 'my-class', 'text') -> new element. Handy for stages too. */
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  Game.make = make;

  // Engine-wide DOM references, filled in by init()
  let root, screen, clockEl, trayIcons;
  let clippyEl, clippyImg, bubble, bubbleText;

  const STAGE_DEFAULTS = {
    name: '',          // human-readable name (console / debugging)
    vibe: null,        // Clippy's mood for this stage: happy | annoyed | angry | panic (null = auto)
    // Texts normally come from clippy-lines.js ("stages": { "<id>": {...} }).
    // These fields are only a fallback for stages that aren't in that file yet.
    error: '',         // text in the "Mail Delivery Bounced" popup
    clippy: '',        // what Clippy says when the stage starts
    hint: '',          // what Clippy says when clicked (costs time)
    retry: null,       // optional array of lines Clippy says when Send fails again
    lines: null,       // { key: 'text' } — read with Game.line('key')
    textVars: null,    // { limit: 500 } fills {limit} in error/clippy/hint/retry
    assets: [],        // documentation only: art files this stage uses
    todo: false,       // true = stub: shows "[stage not built yet]" and auto-passes
    final: false,      // true = the ending: no bounce, setup() owns the screen
    setup: null,       // setup(G)   — build the problem
    check: null,       // check(G)   — true = fixed; false or 'reason' = still broken
    cleanup: null,     // cleanup(G) — undo anything not registered with Game.track
  };

  /* ---- TEXT: every Clippy line / error / hint lives in clippy-lines.js ---- */
  const fill = (text, vars) =>
    vars ? String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : text;
  const warnedKeys = new Set();

  /**
   * Game.line('notTheCat')            -> the current stage's lines.notTheCat
   * Game.line('general.adBanner')     -> any path inside Game.lines (dots)
   * Game.line('converted', { name })  -> fills {name} placeholders
   * Arrays come back as arrays (pick one yourself). A missing key returns
   * "[missing text: key]" and warns in the console, so typos are easy to spot.
   */
  Game.line = function (key, vars) {
    let value;
    if (key.includes('.')) {
      value = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), Game.lines);
    } else {
      value = Game.stage && Game.stage.lines ? Game.stage.lines[key] : undefined;
    }
    if (value == null) {
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        console.warn(`[Game] Missing text "${key}" (stage ${Game.stage ? Game.stage.id : '-'}). Add it to clippy-lines.js.`);
      }
      return `[missing text: ${key}]`;
    }
    return Array.isArray(value) ? value.map((v) => fill(v, vars)) : fill(value, vars);
  };

  /** Copy a stage's texts from clippy-lines.js into the stage (file wins over the stage's own fields). */
  function applyStageText(stage) {
    const t = (Game.lines.stages || {})[String(stage.id)];
    const vars = stage.textVars; // e.g. { limit: 500 } fills {limit}
    if (t) {
      ['error', 'clippy', 'hint'].forEach((k) => { if (t[k] != null) stage[k] = t[k]; });
      if (t.retry) stage.retry = t.retry;
      stage.lines = Object.assign({}, stage.lines, t.lines);
    }
    ['error', 'clippy', 'hint'].forEach((k) => { stage[k] = fill(stage[k] || '', vars); });
    if (stage.retry) stage.retry = stage.retry.map((r) => fill(r, vars));
  }

  /**
   * Register a stage. Called once at the top level of each stages/NN-*.js file.
   * Stages are kept sorted by id; ids can be decimals (7.5 slots between 7 and 8).
   */
  Game.registerStage = function (def) {
    if (!def || typeof def.id !== 'number') {
      console.error('[Game] registerStage() needs a numeric id:', def);
      return;
    }
    const existing = Game.stages.findIndex((s) => s.id === def.id);
    if (existing !== -1) {
      console.warn(`[Game] Two stages use id ${def.id}; the one loaded last wins.`);
      Game.stages.splice(existing, 1);
    }
    Game.stages.push(Object.assign({}, STAGE_DEFAULTS, { name: 'Stage ' + def.id }, def));
    Game.stages.sort((a, b) => a.id - b.id);
  };

  /* ===========================================================================
   *  3. SCREEN SCALING + COORDINATES
   *  The game is a fixed 1280x720 box, scaled to fit the browser (black bars).
   *  Everything inside uses game pixels; Game.toGame() converts mouse positions.
   * ======================================================================== */
  function fit() {
    const s = Math.min(window.innerWidth / CONFIG.WIDTH, window.innerHeight / CONFIG.HEIGHT);
    const x = (window.innerWidth - CONFIG.WIDTH * s) / 2;
    const y = (window.innerHeight - CONFIG.HEIGHT * s) / 2;
    root.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    Game.scale = s;
  }

  /**
   * Browser (client) coordinates -> game coordinates (0..1280, 0..720).
   * Accepts a mouse/pointer event, or (clientX, clientY).
   */
  Game.toGame = function (a, b) {
    const cx = typeof a === 'object' ? a.clientX : a;
    const cy = typeof a === 'object' ? a.clientY : b;
    const r = root.getBoundingClientRect();
    return { x: (cx - r.left) / Game.scale, y: (cy - r.top) / Game.scale };
  };

  /** An element's box in game coordinates: { x, y, w, h }. */
  Game.rectOf = function (target) {
    const r = resolveEl(target).getBoundingClientRect();
    const p = Game.toGame(r.left, r.top);
    return { x: p.x, y: p.y, w: r.width / Game.scale, h: r.height / Game.scale };
  };

  /** True if a game-coordinate point ({x, y}, e.g. from a drop) is inside the element. */
  Game.hitTest = function (target, point, pad) {
    // pad (optional, game px): make the target's hitbox bigger on every side
    const el = resolveEl(target);
    if (!el || !el.isConnected || !point) return false;
    const r = Game.rectOf(el);
    const p = pad || 0;
    return point.x >= r.x - p && point.x <= r.x + r.w + p && point.y >= r.y - p && point.y <= r.y + r.h + p;
  };

  /* ===========================================================================
   *  4. ART, UI KIT & SOUND
   *  RULE: all art is hand-made by the team. Never generate images, SVG or
   *  CSS-drawn graphics. Missing art shows a dashed placeholder with the filename.
   *
   *  Two kinds of art:
   *   PICTURES  Game.asset('cat.png', {w, h}) — an <img>, scaled to fit.
   *   SURFACES  any element with data-skin="button.png" — the image is drawn as
   *             the element's frame/background (9-slice if style.css has a
   *             --slice-button entry, otherwise stretched). Swap it with
   *             Game.setSkin(el, 'other.png'). data-skin-pressed="x.png" swaps
   *             automatically while the mouse button is held on the element.
   *
   *  Files are loaded by FILENAME. The browser looks at the file's content, so a
   *  JPG, WebP or AVIF saved with a .png name still works. HEIC (iPhone) does
   *  NOT work in browsers — run tools/fix-art.ps1. A file that fails to load
   *  never crashes the game: it just shows the placeholder.
   * ======================================================================== */
  const missingAssets = new Set();
  const baseName = (file) => String(file).replace(/\.[a-z0-9]+$/i, '');

  /** Marks "<name>.png exists" on #game: class .skin-<name> + var --img-<name>. */
  function markFound(file) {
    const name = baseName(file);
    if (Game.skin.found.has(name)) return;
    Game.skin.found.add(name);
    root.classList.add('skin-' + name);
    root.style.setProperty('--img-' + name, `url("${CONFIG.ASSET_PATH}${file}")`);
  }

  /**
   * Game.asset('cat.png', { w: 200, h: 150, className: 'my-class' })
   * Returns a <div class="asset"> holding the image. If the file is missing the
   * box turns into a dashed placeholder with the filename written in it.
   * Always pass w/h so the placeholder has the right size.
   */
  Game.asset = function (file, opts) {
    opts = opts || {};
    const box = make('div', 'asset' + (opts.className ? ' ' + opts.className : ''));
    if (opts.w) box.style.width = opts.w + 'px';
    if (opts.h) box.style.height = opts.h + 'px';
    Game.setAsset(box, file);
    return box;
  };

  /** Swap the picture inside an existing asset box (e.g. trash-empty -> trash-full). */
  Game.setAsset = function (box, file) {
    box = resolveEl(box);
    box.dataset.asset = file;
    box.classList.remove('asset-missing');
    box.replaceChildren();
    const img = new Image();
    img.alt = '';
    img.draggable = false;
    img.onload = () => markFound(file);
    img.onerror = () => {
      if (box.dataset.asset !== file) return; // swapped to another file meanwhile
      missingAssets.add(file);
      box.replaceChildren(make('span', 'asset-label', file));
      box.classList.add('asset-missing');
    };
    img.src = CONFIG.ASSET_PATH + file;
    box.appendChild(img);
    return box;
  };

  /**
   * SKINS (surfaces). Until a data-skin file has loaded, style.css shows the
   * element as a dashed placeholder with the filename. Once the file loads we
   * add a CSS rule for exactly that file which draws it with border-image and
   * removes the placeholder. Every data-skin in the page is picked up
   * automatically (also ones added later by stages).
   */
  const skinState = new Map(); // file -> 'loading' | 'found' | 'missing'
  let skinStyle = null;        // <style> that receives one rule per found file

  Game.skin = {
    found: new Set(),
    /** Game.skin.has('window-frame') -> true if assets/window-frame.png exists */
    has(name) { return this.found.has(baseName(name)); },
  };

  function ensureSkin(file) {
    if (!file || skinState.has(file)) return;
    skinState.set(file, 'loading');
    const img = new Image();
    img.onload = () => {
      skinState.set(file, 'found');
      markFound(file);
      const name = baseName(file);
      const url = `url("${CONFIG.ASSET_PATH}${file}")`;
      const sel = `#game [data-skin=${JSON.stringify(file)}]`;
      // 9-slice when style.css defines --slice-<name>; otherwise slice 0 = stretch the whole image.
      skinStyle.appendChild(document.createTextNode(
        `${sel} { outline: none; background-color: transparent; ` +
          `border-style: solid; border-color: transparent; border-width: var(--frame-${name}, 0px); ` +
          `border-image: ${url} var(--slice-${name}, 0) fill / var(--frame-${name}, 0px) var(--repeat-mode, stretch); }\n` +
          `${sel}::after { content: none; }\n`
      ));
    };
    img.onerror = () => {
      skinState.set(file, 'missing');
      missingAssets.add(file);
    };
    img.src = CONFIG.ASSET_PATH + file;
  }

  /** Check every data-skin / data-skin-pressed inside `scope`. */
  function scanSkins(scope) {
    if (!scope || scope.nodeType !== 1) return;
    if (scope.dataset.skin) ensureSkin(scope.dataset.skin);
    if (scope.dataset.skinPressed) ensureSkin(scope.dataset.skinPressed);
    scope.querySelectorAll('[data-skin], [data-skin-pressed]').forEach((el) => {
      ensureSkin(el.dataset.skin);
      ensureSkin(el.dataset.skinPressed);
    });
  }

  /** Give an element a surface skin (or swap it): Game.setSkin(el, 'key-pressed.png') */
  Game.setSkin = function (el, file) {
    el = resolveEl(el);
    el.dataset.skin = file;
    ensureSkin(file);
    return el;
  };

  function initSkins() {
    skinStyle = document.createElement('style');
    skinStyle.id = 'skin-rules';
    document.head.appendChild(skinStyle);

    // 1. Pre-check the full list from the top of style.css (only "quoted" names count).
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--os-assets');
    const listed = Array.from(raw.matchAll(/["']([^"']+)["']/g), (match) => match[1].trim());
    listed.forEach((file) => {
      if (/cursor/.test(file)) {
        // Cursors aren't surfaces: just mark them found so style.css can use them.
        const img = new Image();
        img.onload = () => markFound(file);
        img.onerror = () => missingAssets.add(file);
        img.src = CONFIG.ASSET_PATH + file;
      } else {
        ensureSkin(file);
      }
    });

    // 2. Everything already in the page, and everything added later.
    scanSkins(root);
    new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') ensureSkin(m.target.getAttribute(m.attributeName));
        else m.addedNodes.forEach(scanSkins);
      });
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-skin', 'data-skin-pressed'] });

    // 3. data-skin-pressed: swap skins while the mouse button is held down.
    let pressed = null;
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest && e.target.closest('[data-skin-pressed]');
      if (!el || el.disabled) return;
      pressed = el;
      el.dataset.skinNormal = el.dataset.skin;
      el.dataset.skin = el.dataset.skinPressed;
    }, true);
    const release = () => {
      if (!pressed) return;
      pressed.dataset.skin = pressed.dataset.skinNormal;
      pressed = null;
    };
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', release, true);

    setTimeout(() => {
      const missing = listed.filter((f) => skinState.get(f) === 'missing' || missingAssets.has(f));
      console.info(`[Game] OS art: ${listed.length - missing.length}/${listed.length} files found.` +
        (missing.length ? ' Placeholders (file missing OR unreadable, e.g. a renamed .heic) for: ' + missing.join(', ') : ''));
    }, 1500);
  }

  /* ---- UI KIT: the ONLY way stages should build buttons/fields/etc. ----
   * Everything here is skinned with our art (see the list in style.css).
   * Don't use native <select>, <input type=checkbox/range>, <progress>: the
   * browser draws those itself.
   */
  Game.ui = {
    /** Game.ui.button('OK', onClick, { skin, pressed, className }) -> <button> */
    button(label, onClick, opts) {
      opts = opts || {};
      const btn = make('button', 'ui-btn' + (opts.className ? ' ' + opts.className : ''), label);
      btn.type = 'button';
      Game.setSkin(btn, opts.skin || 'button.png');
      if (opts.pressed !== null) {
        btn.dataset.skinPressed = opts.pressed || 'button-pressed.png';
        ensureSkin(btn.dataset.skinPressed);
      }
      if (onClick) btn.addEventListener('click', (e) => onClick(e, btn));
      return btn;
    },

    /** Game.ui.input({ value, placeholder, type, multiline, skin }) -> wrapper; wrapper.input is the field */
    input(opts) {
      opts = opts || {};
      const wrap = make('div', 'ui-field' + (opts.multiline ? ' multiline' : ''));
      Game.setSkin(wrap, opts.skin || 'input-box.png');
      const input = make(opts.multiline ? 'textarea' : 'input');
      if (!opts.multiline) input.type = opts.type || 'text';
      input.value = opts.value || '';
      if (opts.placeholder) input.placeholder = opts.placeholder;
      input.spellcheck = false;
      input.autocomplete = 'off';
      wrap.appendChild(input);
      wrap.input = input;
      return wrap;
    },

    /**
     * Game.ui.checkbox('Remember me', false, (checked) => ..., { readOnly }) -> <label>
     * .checked / .setChecked(v). Art: checkbox.png / checkbox-checked.png.
     */
    checkbox(label, checked, onChange, opts) {
      opts = opts || {};
      const row = make('label', 'ui-checkbox' + (opts.readOnly ? ' read-only' : ' clickable'));
      const box = make('span', 'ui-checkbox-box');
      row.append(box, make('span', 'ui-checkbox-label', label));
      row.setChecked = (v) => {
        row.checked = !!v;
        row.classList.toggle('is-checked', row.checked); // text shows the state too (CSS)
        Game.setSkin(box, row.checked ? 'checkbox-checked.png' : 'checkbox.png');
      };
      row.addEventListener('click', (e) => {
        e.preventDefault();
        if (opts.readOnly) return;
        row.setChecked(!row.checked);
        if (onChange) onChange(row.checked, row);
      });
      row.setChecked(checked);
      return row;
    },

    /** Game.ui.progress(0.3) -> bar; bar.set(0..1), bar.value. Art: progress-bar.png / progress-fill.png */
    progress(value) {
      const bar = make('div', 'ui-progress');
      const fill = make('div', 'ui-progress-fill');
      Game.setSkin(bar, 'progress-bar.png');
      Game.setSkin(fill, 'progress-fill.png');
      bar.appendChild(fill);
      bar.set = (v) => {
        bar.value = clamp(v, 0, 1);
        fill.style.width = bar.value * 100 + '%';
      };
      bar.set(value || 0);
      return bar;
    },

    /** Game.ui.key('Q', onClick) — an on-screen keyboard key (key.png / key-pressed.png) */
    key(label, onClick) {
      const press = () => {
        keyTyping = true; // mail.subject/body changes made by this click count as typing (Game.stats)
        try { if (onClick) onClick(); } finally { keyTyping = false; }
      };
      return Game.ui.button(label, press, { skin: 'key.png', pressed: 'key-pressed.png', className: 'ui-key' });
    },
  };

  /**
   * Game.runProgress(bar, ms, steps, labelEl) -> Promise
   * Fills a Game.ui.progress() bar from 0 to 100% over `ms`. Optional `steps`
   * (array of strings) are shown one after another in `labelEl`.
   * Cancelled automatically if the stage ends first (the promise then never resolves).
   */
  Game.runProgress = function (bar, ms, steps, labelEl) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      let last = -1;
      let raf = 0;
      const tick = (now) => {
        const v = clamp((now - t0) / ms, 0, 1);
        bar.set(v);
        if (steps && steps.length && labelEl) {
          const i = Math.min(steps.length - 1, Math.floor(v * steps.length));
          if (i !== last) {
            last = i;
            labelEl.textContent = steps[i];
          }
        }
        if (v < 1) raf = requestAnimationFrame(tick);
        else resolve();
      };
      raf = requestAnimationFrame(tick);
      autoTrack(() => cancelAnimationFrame(raf));
    });
  };

  /**
   * Game.sound('bounce.wav', volume = 1, rate = 1)
   * Plays assets/sounds/<file>. Missing files silently do nothing.
   * rate = playbackRate: 1.2 plays it faster AND higher (pitch is not preserved).
   */
  const sounds = {}; // file -> Audio element, or false if known to be missing
  Game.sound = function (file, volume, rate) {
    if (sounds[file] === false) return;
    let base = sounds[file];
    if (!base) {
      base = new Audio(CONFIG.SOUND_PATH + file);
      base.addEventListener('error', () => { sounds[file] = false; });
      sounds[file] = base;
    }
    // If the sound is already playing, play an overlapping copy.
    const audio = base.paused ? base : base.cloneNode();
    audio.volume = clamp((volume == null ? 1 : volume) * CONFIG.MASTER_VOLUME, 0, 1);
    audio.preservesPitch = false;
    audio.playbackRate = rate || 1;
    try { audio.currentTime = 0; } catch (e) { /* not loaded yet — fine */ }
    const p = audio.play();
    if (p && p.catch) p.catch(() => {}); // missing file / autoplay block: stay silent
  };

  /* ===========================================================================
   *  5. STAGE-SCOPED CLEANUP
   *  Everything registered here is undone automatically when the current stage
   *  is passed — so stages can't leak listeners, timers or UI into each other.
   * ======================================================================== */
  let cleanups = [];

  /** Register a function to run when the current stage ends. Returns fn. */
  Game.track = function (fn) {
    cleanups.push(fn);
    return fn;
  };

  /** Used by helpers below: auto-remove UI created during a stage (unless persist). */
  function autoTrack(fn, persist) {
    if (!persist && Game.stage) cleanups.push(fn);
  }

  /** addEventListener that is removed automatically when the stage ends. */
  Game.on = function (target, type, fn, options) {
    target = resolveEl(target);
    target.addEventListener(type, fn, options);
    Game.track(() => target.removeEventListener(type, fn, options));
    return fn;
  };

  /** setTimeout that is cancelled automatically when the stage ends. */
  Game.timeout = function (fn, ms) {
    const id = setTimeout(fn, ms);
    Game.track(() => clearTimeout(id));
    return id;
  };

  /** setInterval that is cancelled automatically when the stage ends. */
  Game.interval = function (fn, ms) {
    const id = setInterval(fn, ms);
    Game.track(() => clearInterval(id));
    return id;
  };

  function runCleanups() {
    const list = cleanups;
    cleanups = [];
    for (let i = list.length - 1; i >= 0; i--) {
      try { list[i](); } catch (err) { console.error('[Game] A cleanup function crashed:', err); }
    }
  }

  /* ===========================================================================
   *  6. UI HELPERS
   * ======================================================================== */

  // ---- shared title bar (used by windows and popups) ----
  function makeTitlebar(title, opts) {
    const bar = make('div', 'xp-titlebar');
    Game.setSkin(bar, 'titlebar.png');
    if (opts.icon) bar.appendChild(Game.asset(opts.icon, { w: 16, h: 16, className: 'xp-title-icon' }));
    bar.appendChild(make('span', 'xp-title', title));
    const buttons = make('div', 'xp-title-buttons');
    if (opts.closable) {
      const close = make('button', 'xp-tb-btn xp-tb-close');
      Game.setSkin(close, 'btn-close.png');
      close.title = 'Close';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onClose();
      });
      buttons.appendChild(close);
    }
    bar.appendChild(buttons);
    return bar;
  }

  // ---- popups ----
  const BUILTIN_ICONS = ['error', 'warning', 'info']; // -> icon-error.png etc.

  /**
   * Game.popup({ title, text, html, icon, buttons, modal, closable, onClose, skin })
   *   icon:    'error' | 'warning' | 'info' (= icon-<name>.png) or any asset filename
   *   buttons: [{ label: 'OK', onClick(popup) { return false to keep it open } }]
   *            default: one OK button. Pass [] for no buttons.
   *   modal:   true (default) blocks clicks on everything behind it
   *   skin:    frame art, default 'popup-frame.png'
   * Returns { el, close() }. Popups can be dragged by their title bar.
   */
  Game.popup = function (opts) {
    opts = opts || {};
    const buttons = opts.buttons || [{ label: 'OK' }];
    const blocker = make('div', 'popup-blocker' + (opts.modal === false ? ' passthrough' : ''));
    const win = make('div', 'xp-window popup');
    Game.setSkin(win, opts.skin || 'popup-frame.png');
    let closed = false;
    const api = {
      el: win,
      close() {
        if (closed) return;
        closed = true;
        blocker.remove();
        if (opts.onClose) opts.onClose(api);
      },
    };

    const closable = opts.closable != null ? opts.closable : buttons.length > 0;
    const bar = makeTitlebar(opts.title || 'Outlook Saga', { closable, onClose: api.close });
    win.appendChild(bar);
    makeWindowDraggable(win, bar);

    const body = make('div', 'popup-body');
    if (opts.icon) {
      const file = BUILTIN_ICONS.includes(opts.icon) ? `icon-${opts.icon}.png` : opts.icon;
      body.appendChild(Game.asset(file, { w: 42, h: 42, className: 'popup-icon' }));
    }
    const text = make('div', 'popup-text');
    if (opts.html) text.innerHTML = opts.html;
    else text.textContent = opts.text || '';
    body.appendChild(text);
    win.appendChild(body);

    if (buttons.length) {
      const row = make('div', 'popup-buttons');
      buttons.forEach((b) => {
        row.appendChild(Game.ui.button(b.label, () => {
          const result = b.onClick ? b.onClick(api) : undefined;
          if (result !== false) api.close();
        }));
      });
      win.appendChild(row);
      setTimeout(() => row.firstChild && row.firstChild.focus(), 0); // Enter = first button
    }

    blocker.appendChild(win);
    Game.layers.popups.appendChild(blocker);
    return api;
  };

  // ---- windows ----
  let zTop = 10;

  /** Bring a window element above the other windows. */
  Game.bringToFront = function (win) {
    win = resolveEl(win);
    // "Always on top" windows live in a higher band, so normal windows can't cover them.
    win.style.zIndex = (win.dataset.onTop ? 100000 : 0) + ++zTop;
  };

  /**
   * Drag `win` around by `handle` (its title bar). Works for absolutely
   * positioned windows and for centered ones (popups): those switch to
   * absolute positioning on the first drag.
   */
  function makeWindowDraggable(win, handle) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      if (getComputedStyle(win).position !== 'absolute') {
        const r = Game.rectOf(win);
        const parent = Game.rectOf(win.offsetParent || win.parentElement);
        win.style.position = 'absolute';
        win.style.margin = '0';
        win.style.left = r.x - parent.x + 'px';
        win.style.top = r.y - parent.y + 'px';
      }
      const p0 = Game.toGame(e);
      const x0 = win.offsetLeft;
      const y0 = win.offsetTop;
      const move = (ev) => {
        const p = Game.toGame(ev);
        // keep at least part of the window on screen
        win.style.left = clamp(x0 + p.x - p0.x, 60 - win.offsetWidth, CONFIG.WIDTH - 60) + 'px';
        win.style.top = clamp(y0 + p.y - p0.y, 0, CONFIG.HEIGHT - 70) + 'px';
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  /** Game.makeMovable(win, handle) — for a custom window built without Game.openWindow. */
  Game.makeMovable = function (win, handle) {
    win = resolveEl(win);
    makeWindowDraggable(win, handle ? resolveEl(handle) : win.querySelector('.xp-titlebar') || win);
    return win;
  };

  /**
   * Game.openWindow({ title, html, x, y, w, h, closable, icon, skin, className, onClose, persist })
   *   html:  string of HTML or a DOM node, placed in the window body
   *   x, y:  top-left in game pixels (default: centered); w, h: outer size
   *   skin:  frame art, default 'window-frame.png'
   *   onClose(win): runs whenever the window closes (also at stage end!)
   *   persist: true = don't auto-close when the stage ends
   *   alwaysOnTop: true = stays above every normal window (e.g. clicking the mail window won't hide it)
   * Returns { el, body, close(), setTitle(text) }.
   */
  Game.openWindow = function (opts) {
    opts = opts || {};
    const w = opts.w || 400;
    const h = opts.h || 300;
    const win = make('div', 'xp-window' + (opts.className ? ' ' + opts.className : ''));
    Game.setSkin(win, opts.skin || 'window-frame.png');
    if (opts.alwaysOnTop) win.dataset.onTop = '1';
    win.style.width = w + 'px';
    win.style.height = h + 'px';
    win.style.left = (opts.x != null ? opts.x : Math.round((CONFIG.WIDTH - w) / 2)) + 'px';
    win.style.top = (opts.y != null ? opts.y : Math.round((CONFIG.HEIGHT - 40 - h) / 2)) + 'px';

    let closed = false;
    const api = {
      el: win,
      body: null,
      close() {
        if (closed) return;
        closed = true;
        win.remove();
        if (opts.onClose) opts.onClose(api);
      },
      setTitle(t) { win.querySelector('.xp-title').textContent = t; },
    };

    const bar = makeTitlebar(opts.title || '', {
      icon: opts.icon,
      closable: opts.closable !== false,
      onClose: api.close,
    });
    const body = make('div', 'xp-body');
    if (typeof opts.html === 'string') body.innerHTML = opts.html;
    else if (opts.html instanceof Node) body.appendChild(opts.html);
    api.body = body;

    win.append(bar, body);
    win.addEventListener('pointerdown', () => Game.bringToFront(win));
    makeWindowDraggable(win, bar);
    Game.layers.windows.appendChild(win);
    Game.bringToFront(win);
    autoTrack(api.close, opts.persist);
    return api;
  };

  // ---- app windows ----
  const openApps = {}; // app id -> window api

  /**
   * Game.openApp({ id, title, html, icon, x, y, w, h, skin, onClose, persist })
   * Like Game.openWindow, but for desktop "apps": non-modal, draggable,
   * closable, and only ONE window per id — opening it again just brings the
   * existing window to the front. Returns the same api as openWindow, plus
   * `created: true` the first time.
   */
  Game.openApp = function (opts) {
    const existing = openApps[opts.id];
    if (existing && existing.el.isConnected) {
      Game.bringToFront(existing.el);
      existing.created = false;
      return existing;
    }
    const userOnClose = opts.onClose;
    const win = Game.openWindow(Object.assign({}, opts, {
      closable: opts.closable !== false,
      onClose(w) {
        delete openApps[opts.id];
        if (userOnClose) userOnClose(w);
      },
    }));
    win.el.dataset.app = opts.id;
    win.created = true;
    openApps[opts.id] = win;
    return win;
  };

  // ---- desktop icons ----
  /**
   * Game.addIcon({ id, label, asset, x, y, onClick, onDoubleClick, persist })
   * Puts an icon on the desktop. Returns the icon element (id "icon-<id>").
   * Change its label later with icon.setLabel('text').
   */
  Game.addIcon = function (opts) {
    const icon = make('div', 'desktop-icon');
    if (opts.id) icon.id = 'icon-' + opts.id;
    icon.style.left = (opts.x || 0) + 'px';
    icon.style.top = (opts.y || 0) + 'px';
    const label = make('div', 'desktop-icon-label', opts.label || '');
    icon.append(Game.asset(opts.asset, { w: 48, h: 48, className: 'desktop-icon-img' }), label);
    icon.setLabel = (text) => { label.textContent = text; };
    icon.addEventListener('click', (e) => {
      document.querySelectorAll('.desktop-icon.selected').forEach((n) => n.classList.remove('selected'));
      icon.classList.add('selected');
      if (opts.onClick) opts.onClick(e, icon);
    });
    if (opts.onDoubleClick) icon.addEventListener('dblclick', (e) => opts.onDoubleClick(e, icon));
    Game.layers.icons.appendChild(icon);
    autoTrack(() => icon.remove(), opts.persist);
    return icon;
  };

  /** Remove a desktop icon by the id you gave addIcon. */
  Game.removeIcon = function (id) {
    const icon = document.getElementById('icon-' + id);
    if (icon) icon.remove();
  };

  /**
   * Game.addProp({ id, asset, x, y, w, h, layer, persist }) — a loose picture on
   * the desktop (charger plug, cable, socket...). layer: 'icons' (default, under
   * windows) or any key of Game.layers. Removed when the stage ends.
   */
  Game.addProp = function (opts) {
    const el = Game.asset(opts.asset, { w: opts.w, h: opts.h, className: 'prop' });
    if (opts.id) el.id = 'prop-' + opts.id;
    el.style.left = (opts.x || 0) + 'px';
    el.style.top = (opts.y || 0) + 'px';
    Game.layers[opts.layer || 'icons'].appendChild(el);
    autoTrack(() => el.remove(), opts.persist);
    return el;
  };

  // ---- system tray (bottom right of the taskbar) ----
  /**
   * Game.tray.add(id, label, onClick, { icon, iconW, iconH, text, title, persist })
   *   label: name shown as the tooltip
   *   icon:  picture, default 'tray-<id>.png'   (swap with Game.tray.setIcon)
   *   iconW / iconH: icon size in px (default 20 x 20)
   *   text:  optional text next to the icon     (change with Game.tray.setText)
   * Built-in items: 'volume', 'wifi', 'battery' (persistent — if your stage
   * changes them, put them back in cleanup).
   */
  Game.tray = {
    add(id, label, onClick, opts) {
      opts = opts || {};
      Game.tray.remove(id);
      const item = make('div', 'tray-item tray-' + id);
      item.dataset.id = id;
      item.title = opts.title || label || id;
      item.append(
        Game.asset(opts.icon || `tray-${id}.png`, { w: opts.iconW || 20, h: opts.iconH || 20, className: 'tray-icon' }),
        make('span', 'tray-text', opts.text || '')
      );
      if (onClick) {
        item.classList.add('clickable');
        item.addEventListener('click', (e) => onClick(e, item));
      }
      trayIcons.prepend(item); // newest on the left, like the real thing
      autoTrack(() => item.remove(), opts.persist);
      return item;
    },
    remove(id) {
      const item = Game.tray.get(id);
      if (item) item.remove();
    },
    get(id) {
      return trayIcons.querySelector(`[data-id="${CSS.escape(id)}"]`);
    },
    /** Swap the tray icon picture, e.g. setIcon('caps', 'tray-caps-on.png') */
    setIcon(id, file) {
      const item = Game.tray.get(id);
      if (item) Game.setAsset(item.querySelector('.tray-icon'), file);
    },
    /** Change the text next to the icon, e.g. setText('battery', '3%') */
    setText(id, text) {
      const item = Game.tray.get(id);
      if (item) item.querySelector('.tray-text').textContent = text;
    },
  };

  // ---- drag & drop ----
  /**
   * Game.makeDraggable(el, { onDrop, onMove, onStart, revert, handle })
   * Moves the element itself (CSS translate). onDrop(el, point) -> return true
   * to accept; with revert: true it snaps back unless accepted.
   * NOTE: the element stays in its own layer, so it can slide UNDER windows.
   * For dragging things across windows, use Game.dragGhost instead.
   */
  Game.makeDraggable = function (target, opts) {
    target = resolveEl(target);
    opts = opts || {};
    const handle = opts.handle ? resolveEl(opts.handle) : target;
    let start = null;
    let moved = false;
    let justDragged = false;

    const setPos = (x, y) => {
      target._dragX = x;
      target._dragY = y;
      target.style.translate = `${x}px ${y}px`;
    };

    function onDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      const p = Game.toGame(e);
      start = { px: p.x, py: p.y, x: target._dragX || 0, y: target._dragY || 0 };
      moved = false;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    function onMove(e) {
      const p = Game.toGame(e);
      const dx = p.x - start.px;
      const dy = p.y - start.py;
      if (!moved) {
        if (Math.hypot(dx, dy) < 4) return; // tiny wobble = still a click
        moved = true;
        target.classList.add('dragging');
        if (opts.onStart) opts.onStart(target, p);
      }
      setPos(start.x + dx, start.y + dy);
      if (opts.onMove) opts.onMove(target, p);
    }
    function onUp(e) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!moved) return;
      target.classList.remove('dragging');
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      const accepted = opts.onDrop ? opts.onDrop(target, Game.toGame(e)) : undefined;
      if (opts.revert && accepted !== true && target.isConnected) setPos(start.x, start.y);
    }
    function swallowClick(e) {
      if (justDragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    }

    handle.addEventListener('pointerdown', onDown);
    target.addEventListener('click', swallowClick, true);
    handle.classList.add('draggable');
    return {
      destroy() {
        handle.removeEventListener('pointerdown', onDown);
        target.removeEventListener('click', swallowClick, true);
        handle.classList.remove('draggable');
      },
      reset() { setPos(0, 0); },
    };
  };

  /**
   * Game.dragGhost(el, { onDrop(point, el), onStart(el), canDrag(), persist })
   * Drag a COPY ("ghost") of `el` on the top layer, so it's visible above every
   * window. The original stays where it is (dimmed while dragging). On release
   * the ghost disappears and onDrop gets the mouse position in game coords:
   * use Game.hitTest(target, point) to see where it was dropped, then move or
   * remove the original yourself. A click right after a drag is swallowed.
   * Returns { destroy() }; auto-removed at stage end unless persist: true.
   */
  Game.dragGhost = function (target, opts) {
    target = resolveEl(target);
    opts = opts || {};
    let start = null;
    let base = null;
    let ghost = null;
    let justDragged = false;

    function onDown(e) {
      if (e.button !== 0 || (opts.canDrag && !opts.canDrag())) return;
      e.preventDefault();
      start = Game.toGame(e);
      base = Game.rectOf(target);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    function onMove(e) {
      const p = Game.toGame(e);
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      if (!ghost) {
        if (Math.hypot(dx, dy) < 4) return;
        ghost = target.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.classList.add('drag-ghost');
        Object.assign(ghost.style, {
          position: 'absolute', margin: '0', translate: '',
          left: base.x + 'px', top: base.y + 'px', width: base.w + 'px', height: base.h + 'px',
        });
        Game.layers.fx.appendChild(ghost);
        target.classList.add('drag-source');
        if (opts.onStart) opts.onStart(target);
      }
      ghost.style.translate = `${dx}px ${dy}px`;
    }
    function onUp(e) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!ghost) return;
      ghost.remove();
      ghost = null;
      target.classList.remove('drag-source');
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      if (opts.onDrop) opts.onDrop(Game.toGame(e), target);
    }
    function swallowClick(e) {
      if (justDragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
    target.addEventListener('pointerdown', onDown);
    target.addEventListener('click', swallowClick, true);
    target.classList.add('draggable');
    const api = {
      destroy() {
        target.removeEventListener('pointerdown', onDown);
        target.removeEventListener('click', swallowClick, true);
        target.classList.remove('draggable', 'drag-source');
        if (ghost) ghost.remove();
      },
    };
    autoTrack(api.destroy, opts.persist);
    return api;
  };

  /** True if two elements' boxes overlap by more than `minPx` game pixels. */
  Game.overlaps = function (a, b, minPx) {
    const ra = resolveEl(a).getBoundingClientRect();
    const rb = resolveEl(b).getBoundingClientRect();
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    const min = (minPx || 0) * Game.scale;
    return ox > min && oy > min;
  };

  // ---- juice ----
  /**
   * Game.highlight(selectorOrElement, ms = 3000) — a pulsing highlight-frame.png
   * around the element (follows it if it moves). ms = 0 keeps it until the
   * stage ends. Returns a function that removes it.
   */
  Game.highlight = function (target, ms) {
    const els = (typeof target === 'string' ? Array.from(document.querySelectorAll(target)) : [target]).filter(Boolean);
    const frames = els.map((el) => {
      const frame = make('div', 'highlight-frame');
      Game.setSkin(frame, 'highlight-frame.png');
      Game.layers.highlight.appendChild(frame);
      return { el, frame };
    });
    const PAD = 6;
    let active = true;
    let raf = 0;
    let timer = null;
    const place = () => {
      frames.forEach(({ el, frame }) => {
        const visible = el.isConnected && el.getClientRects().length > 0;
        frame.style.display = visible ? '' : 'none';
        if (!visible) return;
        const r = Game.rectOf(el);
        frame.style.left = r.x - PAD + 'px';
        frame.style.top = r.y - PAD + 'px';
        frame.style.width = r.w + PAD * 2 + 'px';
        frame.style.height = r.h + PAD * 2 + 'px';
      });
      if (active) raf = requestAnimationFrame(place);
    };
    place();
    const off = () => {
      active = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      frames.forEach(({ frame }) => frame.remove());
    };
    if (ms !== 0) timer = setTimeout(off, ms || 3000);
    autoTrack(off);
    return off;
  };

  /** Shake the whole screen. Game.shake(strength = 1): 0.5 = light, 2 = strong. */
  Game.shake = function (strength) {
    screen.style.setProperty('--shake', strength || 1);
    screen.classList.remove('shake');
    void screen.offsetWidth; // restart the CSS animation
    screen.classList.add('shake');
  };

  /**
   * Game.blackout('Laptop died.', 2000) -> Promise
   * Hides the whole screen (you see the black page behind the game) with a line
   * of text in the middle, for `ms` milliseconds. Nothing is drawn: the black
   * comes from the page background.
   */
  Game.blackout = function (text, ms) {
    return new Promise((resolve) => {
      screen.classList.add('blackout');
      const msg = make('div', 'blackout-text', text || '');
      Game.layers.overlay.appendChild(msg);
      setTimeout(() => {
        msg.remove();
        screen.classList.remove('blackout');
        resolve();
      }, ms || 2000);
    });
  };

  /* ===========================================================================
   *  7. CLIPPY
   *  Moods load assets/clippy-<mood>.png. Clicking Clippy shows the stage hint
   *  but costs CONFIG.HINT_COST_MINUTES. His bubble is speech-bubble.png.
   * ======================================================================== */
  const MOODS = ['happy', 'annoyed', 'angry', 'panic'];
  let slowIdleMs = 0; // time since the player last made progress / Clippy last spoke (see slowNudgeTick)

  Game.clippy = {
    mood: 'happy',
    /** Game.clippy.say(text, mood) — mood: happy | annoyed | angry | panic */
    say(text, mood) {
      if (mood && !MOODS.includes(mood)) {
        console.warn(`[Game] Unknown Clippy mood "${mood}". Use: ${MOODS.join(', ')}`);
        mood = null;
      }
      mood = mood || this.mood;
      if (mood !== this.mood || !clippyImg.dataset.asset) {
        this.mood = mood;
        Game.setAsset(clippyImg, `clippy-${mood}.png`);
      }
      clippyEl.dataset.mood = mood;
      slowIdleMs = 0; // he just talked: restart the "you're slow" timer
      bubbleText.textContent = text;
      bubble.classList.remove('hidden', 'pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop'); // (Clippy is silent on purpose: no sound when he talks)
    },
    hide() {
      bubble.classList.add('hidden');
    },
  };

  function onClippyClick() {
    if (!Game.started || Game.over) return;
    if (!Game.mailOpen) {
      Game.clippy.say(Game.line('general.openOutlookFirst')); // free: no time cost before Outlook is open
      return;
    }
    const stage = Game.stage;
    if (!stage || !stage.hint) {
      Game.clippy.say(Game.line('general.noStageHint'));
      return;
    }
    const cost = CONFIG.HINT_COST_MINUTES;
    Game.clippy.say(Game.line('general.hint', { hint: stage.hint, minutes: cost }));
    Game.stats.hintsUsed++;
    Game.clock.add(cost);
  }

  /* ===========================================================================
   *  8. MAIL
   * ======================================================================== */
  let charLimit = null;

  /* ---- Bounce-back tracker: typed / deleted characters (Game.stats) ----
   * Real typing in the subject/body is measured per input event (old text vs new
   * text, so select-and-replace counts both). Text set from code (mail.subject = ...)
   * does NOT count, except while an on-screen key (Game.ui.key) is being pressed. */
  let keyTyping = false;
  function countEdit(before, after) {
    if (before === after) return;
    const max = Math.min(before.length, after.length);
    let p = 0;
    while (p < max && before[p] === after[p]) p++;
    let s = 0;
    while (s < max - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
    Game.stats.charsDeleted += before.length - p - s;
    Game.stats.charsTyped += after.length - p - s;
  }
  function trackTyping(field) {
    let base = field.value;
    field.addEventListener('beforeinput', () => { base = field.value; });
    field.addEventListener('input', () => {
      // read the text after every other input listener ran (e.g. stage 2 forces CAPS)
      setTimeout(() => { countEdit(base, field.value); base = field.value; }, 0);
    });
  }

  Game.mail = {
    /** Raw elements: window, from, to, subject, body, bodyWrap, counter, send, attachBar, attachList, status */
    el: {},

    get from() { return this.el.from.value; },
    set from(v) {
      this.el.from.value = v;
      const name = $('#sidebar-user-name');
      if (name) name.textContent = v;
    },
    get to() { return this.el.to.value; },
    set to(v) { this.el.to.value = v; },
    get subject() { return this.el.subject.value; },
    set subject(v) {
      if (keyTyping) countEdit(this.el.subject.value, v);
      this.el.subject.value = v;
      checkEasterEggs(); // e.g. typed on stage 7's on-screen keyboard
    },
    get body() { return this.el.body.value; },
    set body(v) {
      if (keyTyping) countEdit(this.el.body.value, v);
      this.el.body.value = v;
      Game.mail.updateCounter();
    },
    /** Status bar text (bottom of the mail window). Default: CONFIG.STATUS_TEXT */
    get status() { return this.el.status.textContent; },
    set status(v) { this.el.status.textContent = v; },

    /** null = no limit. A number shows "123 / 500" and turns red when over. */
    get charLimit() { return charLimit; },
    set charLimit(v) {
      charLimit = v;
      Game.mail.updateCounter();
    },

    /** Refresh the live character counter (called automatically on typing). */
    updateCounter() {
      const counter = Game.mail.el.counter;
      if (!counter) return;
      const n = Game.mail.el.body.value.length;
      counter.textContent = charLimit == null ? `${n} characters` : `${n} / ${charLimit} characters`;
      counter.classList.toggle('over', charLimit != null && n > charLimit);
    },
  };

  // ---- attachments ----
  const attached = [];   // [{ name, size, icon, el }]
  let attachDrop = null; // drop handler set by Game.dragAttachments (stage-scoped)

  function renderAttachBar() {
    Game.mail.el.attachBar.classList.toggle('empty', attached.length === 0);
  }

  Game.attachments = {
    /**
     * Game.attachments.add('cat.jpg', '4.2 GB', 'file-photo.png') -> chip element
     * Adding a name that already exists replaces it. Chip art: attach-chip.png.
     */
    add(name, sizeLabel, iconAsset) {
      Game.attachments.remove(name);
      const icon = iconAsset || 'file-doc.png';
      const chip = make('div', 'attachment');
      Game.setSkin(chip, 'attach-chip.png');
      chip.dataset.name = name;
      chip.append(
        Game.asset(icon, { w: 20, h: 20, className: 'attachment-icon' }),
        make('span', 'attachment-name', name),
        make('span', 'attachment-size', sizeLabel ? `(${sizeLabel})` : '')
      );
      // Chips can be dragged out of the email while a stage has called Game.dragAttachments().
      Game.dragGhost(chip, {
        persist: true,
        canDrag: () => !!attachDrop,
        onDrop: (point) => {
          const entry = Game.attachments.get(chip.dataset.name);
          if (entry && attachDrop) attachDrop(entry, point);
        },
      });
      Game.mail.el.attachList.appendChild(chip);
      attached.push({ name, size: sizeLabel || '', icon, el: chip });
      renderAttachBar();
      return chip;
    },
    remove(name) {
      const i = attached.findIndex((a) => a.name === name);
      if (i === -1) return false;
      attached[i].el.remove();
      attached.splice(i, 1);
      renderAttachBar();
      return true;
    },
    /** Copy of the list: [{ name, size, icon, el }] */
    list() { return attached.slice(); },
    get(name) { return attached.find((a) => a.name === name) || null; },
    setSize(name, sizeLabel) {
      const a = Game.attachments.get(name);
      if (!a) return;
      a.size = sizeLabel;
      a.el.querySelector('.attachment-size').textContent = `(${sizeLabel})`;
    },
    /** Rename in place: rename('cat.jpg', 'cat.png', { size, icon }) */
    rename(oldName, newName, opts) {
      const a = Game.attachments.get(oldName);
      if (!a) return null;
      a.name = newName;
      a.el.dataset.name = newName;
      a.el.querySelector('.attachment-name').textContent = newName;
      if (opts && opts.size) Game.attachments.setSize(newName, opts.size);
      if (opts && opts.icon) {
        a.icon = opts.icon;
        Game.setAsset(a.el.querySelector('.attachment-icon'), opts.icon);
      }
      return a;
    },
    clear() {
      attached.slice().forEach((a) => Game.attachments.remove(a.name));
    },
  };

  /**
   * Game.dragAttachments((attachment, point) => { ... })
   * For the rest of the current stage, attachment chips can be dragged out of
   * the email (as a ghost on the top layer). On release your function gets the
   * attachment entry and the drop point; use Game.hitTest(target, point).
   * If you don't remove the attachment, the chip simply stays in the email.
   */
  Game.dragAttachments = function (onDrop) {
    attachDrop = onDrop;
    Game.track(() => { if (attachDrop === onDrop) attachDrop = null; });
  };

  /**
   * Game.wordView(tokens, onClick) -> view
   * Temporarily replaces the email body with a read-only view made of clickable
   * words. tokens: [{ text, tag }] — tokens WITH a tag are clickable spans with
   * class "word word-<tag>"; tokens without a tag are plain text (keep the
   * spaces/newlines as their own tokens). onClick(index, token, view) may
   * change view.tokens; the view re-renders after each click.
   *   view.text()        current text
   *   view.count(tag)    how many tokens have this tag
   *   view.close()       write the text back into the body and show the textarea
   * Closed automatically when the stage ends (so the body keeps the result).
   * Game.wordView.split(text) turns plain text into untagged tokens.
   */
  Game.wordView = function (tokens, onClick) {
    const m = Game.mail.el;
    const el = make('div', 'word-view');
    let closed = false;
    const view = {
      el,
      tokens,
      render() {
        el.replaceChildren();
        view.tokens.forEach((t, i) => {
          if (!t.tag) {
            el.appendChild(document.createTextNode(t.text));
            return;
          }
          const span = make('span', `word word-${t.tag} clickable`, t.text);
          span.dataset.i = i;
          el.appendChild(span);
        });
        Game.mail.el.counter.textContent = `${view.text().length} characters`;
      },
      text() { return view.tokens.map((t) => t.text).join(''); },
      count(tag) { return view.tokens.filter((t) => t.tag === tag).length; },
      close() {
        if (closed) return;
        closed = true;
        Game.mail.body = view.text();
        el.remove();
        m.body.classList.remove('hidden');
      },
    };
    el.addEventListener('click', (e) => {
      const span = e.target.closest('.word');
      if (!span || !onClick) return;
      const i = Number(span.dataset.i);
      onClick(i, view.tokens[i], view);
      view.render();
    });
    m.body.classList.add('hidden');
    m.bodyWrap.appendChild(el);
    view.render();
    Game.track(view.close);
    return view;
  };
  Game.wordView.split = (text) => String(text).split(/(\s+)/).filter((s) => s !== '').map((s) => ({ text: s }));

  // ---- Bounced folder counter + "Sending..." bar ----
  function renderBounces() {
    const el = $('#bounce-count');
    if (el) el.textContent = Game.bounces;
    // Bounce-back meter in the statusbar (text only, on statusbar.png)
    const meter = $('#bounce-meter');
    if (meter) meter.textContent = `Bounces: ${Game.stats.bounces} · Rewrites: ${Game.stats.rewrites}`;
  }

  let sendBar = null;
  function showSending(ms) {
    const box = $('#send-progress');
    box.classList.remove('hidden');
    sendBar.set(0);
    const t0 = performance.now();
    const tick = (now) => {
      const v = clamp((now - t0) / ms, 0, 1);
      sendBar.set(v);
      if (v < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function hideSending() {
    $('#send-progress').classList.add('hidden');
  }

  /* ===========================================================================
   *  9. CLOCK
   *  Starts at CONFIG.START_TIME; at CONFIG.DEADLINE you're fired
   *  (unless ?nodeadline=1 is in the URL).
   * ======================================================================== */
  let minutes = CONFIG.START_TIME;
  let tickTimer = null;
  let frozen = false;
  let noDeadline = false;

  function renderClock() {
    clockEl.textContent = Game.clock.format(minutes);
    clockEl.classList.toggle('late', !noDeadline && CONFIG.DEADLINE - minutes <= CONFIG.WARNING_MINUTES_LEFT);
  }

  Game.clock = {
    get minutes() { return minutes; },
    get minutesLeft() { return CONFIG.DEADLINE - minutes; },
    start() {
      if (tickTimer || frozen) return;
      tickTimer = setInterval(() => Game.clock.add(1), CONFIG.REAL_SECONDS_PER_MINUTE * 1000);
    },
    stop() {
      clearInterval(tickTimer);
      tickTimer = null;
    },
    /** Debug: stop time completely (?freeze in the URL). */
    freeze() {
      frozen = true;
      Game.clock.stop();
    },
    /** Debug: the clock keeps running but 9:00 never fires you (?nodeadline=1). */
    disableDeadline() {
      noDeadline = true;
      renderClock();
    },
    /** Add (or with a negative number, give back) minutes. */
    add(n) {
      if (Game.over || frozen) return;
      minutes += n;
      renderClock();
      if (!noDeadline && minutes >= CONFIG.DEADLINE) youreFired();
    },
    format(m) {
      const h = Math.floor(m / 60) % 24;
      const mm = String(m % 60).padStart(2, '0');
      return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
    },
  };

  /* ---- Run timer: REAL time (speedrun style), shown in the taskbar next to the clock ----
   * Starts when Outlook opens, stops when the email is delivered (or you're fired).
   * Game.timer.ms, .text, .start(), .stop(), .format(ms), .best (fastest win, saved in
   * this browser), .saveBest() -> true if this run is a new record. */
  const BEST_KEY = 'outlook-saga-best-ms';
  let runStart = 0;
  let runEnd = 0;
  let runTimerTick = null;
  let fullRun = false; // only runs played from the title screen (no ?stage= / debug jumps) set a best time
  function renderRunTimer() {
    const el = $('#run-timer');
    if (el) el.textContent = Game.timer.text;
  }
  Game.timer = {
    get ms() { return runStart ? (runEnd || performance.now()) - runStart : 0; },
    get text() { return Game.timer.format(Game.timer.ms); },
    start() {
      if (runStart) return;
      runStart = performance.now();
      Game.stats.startTime = Date.now();
      runTimerTick = setInterval(renderRunTimer, 100);
    },
    stop() {
      if (!runStart || runEnd) return;
      runEnd = performance.now();
      Game.stats.endTime = Date.now();
      clearInterval(runTimerTick);
      renderRunTimer();
    },
    format(ms) {
      const tenths = Math.floor(ms / 100);
      const m = Math.floor(tenths / 600);
      const s = String(Math.floor(tenths / 10) % 60).padStart(2, '0');
      return `${m}:${s}.${tenths % 10}`;
    },
    get best() {
      try { const v = Number(localStorage.getItem(BEST_KEY)); return v > 0 ? v : null; } catch (e) { return null; }
    },
    /** true when this run started from the title screen with no debug jumps */
    get fullRun() { return fullRun; },
    saveBest() {
      if (!fullRun) return false;
      const best = Game.timer.best;
      if (best && best <= Game.timer.ms) return false;
      try { localStorage.setItem(BEST_KEY, String(Math.round(Game.timer.ms))); } catch (e) { /* private mode */ }
      return true;
    },
  };

  function youreFired() {
    Game.over = true;
    Game.clock.stop();
    Game.timer.stop();
    Game.sound('error.wav');
    Game.shake();
    Game.clippy.say(Game.line('general.fired'), 'angry');
    Game.popup({
      title: 'New message from printer@company.com',
      icon: 'warning',
      text: "It's 9:00 and you're not at your desk.\n\nYou're fired.\n\n(PC LOAD LETTER)",
      closable: false,
      buttons: [{ label: 'Try again', onClick: () => Game.restart() }],
    });
  }

  /* ===========================================================================
   *  10. GAME FLOW
   *  Send -> envelope flies out and bounces back -> either the same stage fails
   *  again, or the stage is cleaned up and the next one starts.
   * ======================================================================== */
  let sending = false;

  /** Run a stage's check(). Returns { pass, reason }. Stubs always pass. */
  function runCheck(stage) {
    if (stage.todo || stage._broken) return { pass: true };
    if (typeof stage.check !== 'function') {
      console.warn(`[Game] Stage ${stage.id} has no check(); auto-passing.`);
      return { pass: true };
    }
    try {
      const result = stage.check(Game);
      if (typeof result === 'string') return { pass: false, reason: result };
      return { pass: !!result };
    } catch (err) {
      // A crashing check must never soft-lock the game: log it and let the player through.
      console.error(`[Game] Stage ${stage.id} check() crashed — auto-passing:`, err);
      return { pass: true };
    }
  }

  /** Call stage[fnName](Game) safely. Returns false if it crashed. */
  function safeCall(stage, fnName) {
    if (typeof stage[fnName] !== 'function') return true;
    try {
      stage[fnName](Game);
      return true;
    } catch (err) {
      console.error(`[Game] Stage ${stage.id} ${fnName}() crashed:`, err);
      return false;
    }
  }

  /** Clippy's default mood by progress, used when a stage has no `vibe`. */
  function autoMood(stage) {
    const playable = Game.stages.filter((s) => !s.final);
    const t = playable.indexOf(stage) / Math.max(1, playable.length);
    return MOODS[clamp(Math.floor(t * MOODS.length), 0, MOODS.length - 1)];
  }

  /**
   * The envelope flies out of the Send button; bounces back unless delivered.
   * onLand() runs at the SPLAT moment (the bounce is counted there).
   */
  function flyEnvelope(bounceBack, onLand) {
    return new Promise((resolve) => {
      const r = Game.rectOf(Game.mail.el.send);
      const sx = r.x + r.w / 2 - 32;
      const sy = r.y + r.h / 2 - 24;
      const env = Game.asset('envelope.png', { w: 64, h: 48, className: 'flying-envelope' });
      env.style.left = sx + 'px';
      env.style.top = sy + 'px';
      Game.layers.fx.appendChild(env);

      const home = 'translate(0px, 0px) rotate(0deg) scale(1)';
      const away = `translate(${CONFIG.WIDTH - sx + 100}px, ${-sy - 120}px) rotate(35deg) scale(0.5)`;
      const duration = bounceBack ? CONFIG.BOUNCE_MS : CONFIG.DELIVER_MS;
      const frames = bounceBack
        ? [
            { offset: 0, transform: home, easing: 'ease-in' },
            { offset: 0.35, transform: away },
            { offset: 0.45, transform: away, easing: 'ease-in' }, // hang off-screen for a beat
            { offset: 0.72, transform: 'translate(0px, 0px) rotate(-12deg) scale(1.3, 0.75)', easing: 'ease-out' }, // SPLAT
            { offset: 0.84, transform: 'translate(0px, -80px) rotate(6deg) scale(1)', easing: 'ease-in' },
            { offset: 0.93, transform: 'translate(0px, 0px) rotate(0deg) scale(1.1, 0.9)', easing: 'ease-out' },
            { offset: 0.97, transform: 'translate(0px, -16px) rotate(0deg) scale(1)', easing: 'ease-in' },
            { offset: 1, transform: home },
          ]
        : [
            { transform: home, easing: 'ease-in' },
            { transform: away },
          ];

      showSending(duration * (bounceBack ? 0.45 : 1));
      const anim = env.animate(frames, { duration, fill: 'forwards' });
      if (bounceBack) {
        setTimeout(() => {
          Game.sound('bounce.wav');
          Game.shake();
          Game.mail.status = 'Bounced. Obviously.';
          if (onLand) onLand();
        }, duration * 0.72);
      }
      anim.onfinish = () => {
        env.remove();
        hideSending();
        resolve();
      };
    });
  }

  let errorSoundQueued = false; // send() started error.wav early; the popup shouldn't play it again

  /** The Send button. Also available as Game.send() for stages. */
  async function send() {
    if (!Game.started || !Game.mailOpen || Game.over || sending || screen.classList.contains('blackout')) return;
    sending = true;
    slowIdleMs = 0;
    root.classList.add('busy'); // CSS: busy cursor + no clicks on the screen while the envelope flies
    window.addEventListener('keydown', blockKeysWhileFlying, true);
    Game.sound('send.wav');
    const statusBefore = Game.mail.status === 'Bounced. Obviously.' ? CONFIG.STATUS_TEXT : Game.mail.status;
    Game.mail.status = 'Sending...';

    // Bounce-back tracker: did the player change the email since the last send?
    if (lastSentSnapshot !== null && emailSnapshot() !== lastSentSnapshot) Game.stats.rewrites++;
    renderBounces();

    // Decide the outcome BEFORE animating, so we know if the envelope bounces.
    const outcome = Game.stage ? runCheck(Game.stage) : { pass: true }; // no stage yet -> start stage 1
    const nextIndex = outcome.pass ? Game.stageIndex + 1 : Game.stageIndex;
    const next = Game.stages[nextIndex];
    const delivered = outcome.pass && (!next || next.final);

    if (!delivered) Game.clock.add(CONFIG.SEND_COST_MINUTES);
    if (!delivered && !Game.over) {
      // The popup comes when the envelope lands; start error.wav a bit earlier so it lines up.
      errorSoundQueued = true;
      setTimeout(() => Game.sound('error.wav'), Math.max(0, CONFIG.BOUNCE_MS - CONFIG.ERROR_SOUND_LEAD_MS));
    }
    if (!Game.over) {
      await flyEnvelope(!delivered, () => {
        Game.bounces++;
        Game.stats.bounces = Game.bounces;
        renderBounces();
      });
    }

    sending = false;
    root.classList.remove('busy');
    window.removeEventListener('keydown', blockKeysWhileFlying, true);
    if (Game.mail.status === 'Sending...' || Game.mail.status === 'Bounced. Obviously.') Game.mail.status = statusBefore;
    if (Game.over) return; // fired while the envelope was in the air

    if (!outcome.pass) stillFailed(outcome.reason);
    else {
      finishStage();
      startStage(nextIndex);
    }
    lastSentSnapshot = emailSnapshot(); // the next stage may have changed the email: that's not a rewrite
  }
  Game.send = send;

  function blockKeysWhileFlying(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /* ---- Bounce-back tracker: rewrites ----
   * One rewrite per send when To / Subject / body / attachments differ from how the
   * email looked right after the previous send (or when Outlook was opened). */
  let lastSentSnapshot = null;
  function emailSnapshot() {
    const m = Game.mail;
    return JSON.stringify([m.to, m.subject, m.body, Game.attachments.list().map((a) => a.name + '|' + a.size)]);
  }
  /** " - Bounce #7" for the error popup titles (nothing before the first bounce, e.g. ?stage=N). */
  const bounceTag = () => (Game.bounces ? ` - Bounce #${Game.bounces}` : '');

  /* ---- SUBMIT button: sometimes asks "Are you sure?" first (CONFIG.CONFIRM_CHANCE) ----
   * Only the button does this; Game.send() from stage code always sends straight away.
   * The Yes/No buttons swap places at random. Texts: clippy-lines.js -> general.confirm */
  let confirming = false;
  function onSendClick() {
    if (!Game.started || !Game.mailOpen || Game.over || sending || confirming) return;
    if (!Game.stage || Math.random() >= CONFIG.CONFIRM_CHANCE) {
      send();
      return;
    }
    askSure(0);
  }
  function askSure(level) {
    confirming = true;
    let answered = false;
    const questions = Game.line('general.confirm.questions');
    const yes = () => {
      answered = true;
      if (level + 1 < questions.length && Math.random() < CONFIG.CONFIRM_AGAIN_CHANCE) {
        askSure(level + 1);
        return;
      }
      confirming = false;
      send();
    };
    const no = () => {
      answered = true;
      confirming = false;
      Game.clippy.say(pick(Game.line('general.confirm.clippyNo')), 'annoyed');
    };
    const buttons = [
      { label: Game.line('general.confirm.yes'), onClick: yes },
      { label: Game.line('general.confirm.no'), onClick: no },
    ];
    if (Math.random() < 0.5) buttons.reverse();
    Game.popup({
      title: Game.line('general.confirm.title'),
      icon: 'warning',
      text: questions[Math.min(level, questions.length - 1)],
      buttons,
      onClose: () => { if (!answered) no(); }, // the X counts as "No"
    });
  }

  /* ---- Clippy gets impatient: after CONFIG.SLOW_NUDGE_MS of no progress ----
   * The timer restarts whenever Clippy talks or you press Send, and pauses while
   * a (modal) popup is open. Texts: clippy-lines.js -> general.slow.<mood> */
  function slowNudgeTick(dt) {
    if (!Game.started || Game.over || sending || confirming || document.hidden) return;
    if (screen.classList.contains('blackout')) return;
    if (document.querySelector('#layer-popups .popup-blocker:not(.passthrough)')) return;
    slowIdleMs += dt;
    if (slowIdleMs < CONFIG.SLOW_NUDGE_MS) return;
    const stage = Game.stage;
    const mood = !Game.mailOpen || !stage ? 'happy' : stage.vibe || autoMood(stage);
    // A stage can say its own thing instead: slowNudge(G) returns a line, or nothing for the generic one.
    if (Game.mailOpen && stage && typeof stage.slowNudge === 'function') {
      let own = null;
      try { own = stage.slowNudge(Game); } catch (err) { console.error(`[Game] Stage ${stage.id} slowNudge() crashed:`, err); }
      if (own) {
        Game.clippy.say(own, mood);
        return;
      }
    }
    const lines = Game.line(!Game.mailOpen ? 'general.slow.outlook' : 'general.slow.' + mood);
    Game.clippy.say(Array.isArray(lines) ? pick(lines) : lines, mood); // resets slowIdleMs
  }

  /* ---- Easter eggs: "hack club" / "game jam" in the subject ----
   * Each one fires once per game: a happy popup, Clippy cheers, and the clock
   * gives back CONFIG.EASTER_EGG_BONUS_MINUTES. Spaces/caps/dashes don't matter.
   * Texts: clippy-lines.js -> general.easterEggs.<key>  Sound: sounds/easter-egg.wav */
  const EASTER_EGGS = ['hackclub', 'gamejam'];
  const easterEggsFound = new Set();
  function checkEasterEggs() {
    if (!Game.started || Game.over || !Game.mail.el.subject) return;
    const typed = Game.mail.el.subject.value.toLowerCase().replace(/[^a-z]/g, '');
    EASTER_EGGS.forEach((key) => {
      if (!typed.includes(key) || easterEggsFound.has(key)) return;
      easterEggsFound.add(key);
      const minutes = CONFIG.EASTER_EGG_BONUS_MINUTES;
      Game.sound('easter-egg.wav');
      Game.popup({
        title: Game.line(`general.easterEggs.${key}.title`),
        icon: 'info',
        text: Game.line(`general.easterEggs.${key}.text`, { minutes }),
        modal: false,
        buttons: [{ label: Game.line(`general.easterEggs.${key}.button`) }],
      });
      setTimeout(() => Game.mail.el.subject.focus(), 20); // keep typing (the popup grabs focus)
      Game.clock.add(-minutes);
      Game.clippy.say(Game.line(`general.easterEggs.${key}.clippy`, { minutes }), 'happy');
    });
  }

  function startStage(index) {
    const stage = Game.stages[index];
    if (!stage) {
      deliveredFallback();
      return;
    }
    Game.stageIndex = index;
    Game.stage = stage;
    cleanups = [];
    root.dataset.stage = stage.id; // CSS hook: #game[data-stage="7"] ...
    console.info(`[Game] ▶ Stage ${stage.id}: ${stage.name}${stage.todo ? '  (todo stub)' : ''}`);

    if (stage.final) {
      Game.over = true; // the final stage owns the screen from here on
      Game.clock.stop();
      Game.timer.stop();
      if (!safeCall(stage, 'setup')) deliveredFallback();
      return;
    }

    if (!stage.todo && !safeCall(stage, 'setup')) {
      stage._broken = true; // treat like a stub so the game stays playable
    }

    const stub = stage.todo || stage._broken;
    playErrorSound();
    Game.popup({
      title: 'Mail Delivery Bounced' + bounceTag(),
      icon: 'error',
      text:
        `Your message to ${Game.mail.to} could not be delivered.\n\n` +
        `Reason: ${stage.error}` +
        (stub ? '\n\n[stage not built yet]' : ''),
    });
    Game.clippy.say(stage.clippy || '...', stage.vibe || autoMood(stage));
  }

  /** error.wav for the popup — unless send() already started it early (ERROR_SOUND_LEAD_MS). */
  function playErrorSound() {
    if (errorSoundQueued) errorSoundQueued = false;
    else Game.sound('error.wav'); // e.g. ?stage=N / debug jumps, where there was no send
  }

  function stillFailed(reason) {
    const stage = Game.stage;
    playErrorSound();
    Game.popup({
      title: 'Mail Delivery Bounced (again)' + bounceTag(),
      icon: 'warning',
      text: `Your message bounced. Again.\n\nReason: ${reason || stage.error}`,
    });
    const lines = stage.retry && stage.retry.length ? stage.retry : Game.line('general.retry');
    const mood = stage.vibe === 'angry' || stage.vibe === 'panic' ? stage.vibe : 'annoyed';
    Game.clippy.say(pick(lines), mood);
  }

  function finishStage() {
    const stage = Game.stage;
    if (!stage) return;
    if (!stage.todo) safeCall(stage, 'cleanup');
    runCleanups();
    Game.stage = null;
    console.info(`[Game] ✔ Stage ${stage.id} passed`);
  }

  /**
   * Game.restartStage() — undo the current stage (cleanup + tracked cleanups)
   * and run its setup() again, without the error popup. For "try again"
   * moments like the battery dying in stage 13.
   */
  Game.restartStage = function () {
    const stage = Game.stage;
    if (!stage || Game.over) return;
    if (!stage.todo) safeCall(stage, 'cleanup');
    runCleanups();
    if (!stage.todo && !safeCall(stage, 'setup')) stage._broken = true;
  };

  /** Only used if there is no `final: true` stage (e.g. its file is missing). */
  function deliveredFallback() {
    Game.over = true;
    Game.clock.stop();
    Game.timer.stop();
    Game.stage = null;
    Game.popup({
      title: 'Outlook Saga',
      icon: 'info',
      text: 'Email delivered successfully.\n\n(No final stage is loaded, so this is the end.)',
      closable: false,
      buttons: [{ label: 'Play again', onClick: () => Game.restart() }],
    });
  }

  /* ---- END SCREEN: the bounce-back stats (shown by stage 18 after the blue screen) ----
   * Game.showStats() puts a full-screen page on bluescreen-bg.png (white text, blue screen
   * style) with Game.stats, the best run (fewest bounces, then fastest; saved in this
   * browser, only full runs from the title screen count) and "Press any key to try again." */
  const BEST_RUN_KEY = 'outlook-saga-best-run';
  function loadBestRun() {
    try {
      const v = JSON.parse(localStorage.getItem(BEST_RUN_KEY));
      return v && v.bounces >= 0 && v.ms > 0 ? v : null;
    } catch (e) { return null; }
  }
  function saveBestRun(run) {
    try { localStorage.setItem(BEST_RUN_KEY, JSON.stringify(run)); } catch (e) { /* private mode: no record */ }
  }
  const mmss = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  Game.showStats = function () {
    const st = Game.stats;
    const ms = st.startTime && st.endTime ? st.endTime - st.startTime : Game.timer.ms;
    const run = { bounces: st.bounces, ms: Math.round(ms) };
    const best = loadBestRun();
    const isRecord = Game.timer.fullRun &&
      (!best || run.bounces < best.bounces || (run.bounces === best.bounces && run.ms < best.ms));
    if (isRecord) saveBestRun(run);
    const shown = isRecord ? run : best;
    const times = (n) => `${n} TIME${n === 1 ? '' : 'S'}`;

    const page = make('div', 'bsod stats-screen');
    Game.setSkin(page, 'bluescreen-bg.png');
    const add = (cls, text) => { const el = make('div', cls, text); page.appendChild(el); return el; };
    add('stats-headline', `YOUR EMAIL BOUNCED BACK ${times(st.bounces)}.\nYOU BOUNCED BACK ${times(st.bounces)}.`);
    add('stats-list', [
      `Rewrites: ${st.rewrites}`,
      `Characters typed: ${st.charsTyped}`,
      `Characters deleted: ${st.charsDeleted}`,
      `Time: ${mmss(ms)} (real time)`,
      `Clippy hints used: ${st.hintsUsed}`,
      `Final clock: ${Game.clock.format(Game.clock.minutes)}`,
    ].join('\n'));
    const bestLine = add('stats-best',
      shown ? `Best: ${shown.bounces} bounces, ${mmss(shown.ms)}` : 'Best: -');
    if (isRecord) bestLine.appendChild(make('span', 'stats-record', 'NEW RECORD'));
    if (!Game.timer.fullRun) add('stats-note', '(test run: started with ?stage= or a debug jump, so it does not count)');
    add('stats-restart', 'Press any key to try again.');
    Game.layers.overlay.appendChild(page);

    // any key / click -> fresh game (after a short pause so a held key doesn't skip it)
    setTimeout(() => {
      const restart = () => Game.restart();
      window.addEventListener('keydown', restart, { once: true });
      page.addEventListener('pointerdown', restart, { once: true });
    }, 900);
    return page;
  };

  /** Back to the title screen with a completely fresh state. */
  Game.restart = function () {
    location.reload();
  };

  /* ===========================================================================
   *  11. DEBUG TOOLS — use from the browser console (F12)
   *    Game.debug.list()        table of all loaded stages
   *    Game.debug.skip()        pass the current stage instantly
   *    Game.debug.goto(7)       jump to stage 7
   *    Game.debug.missing()     art files that failed to load so far (missing, misnamed,
   *                             or unreadable — e.g. a .heic renamed to .png)
   *  URL options:  index.html?stage=7         start directly at stage 7 (skips title)
   *                index.html?nodeadline=1    9:00 never fires you
   *                index.html?freeze          the clock never moves
   * ======================================================================== */
  Game.debug = {
    list() {
      console.table(Game.stages.map((s) => ({ id: s.id, name: s.name, todo: s.todo, final: s.final })));
    },
    skip() {
      fullRun = false;
      if (!Game.started) startGame(true);
      const i = Game.stageIndex;
      finishStage();
      startStage(i + 1);
    },
    goto(id) {
      fullRun = false;
      const i = Game.stages.findIndex((s) => s.id === id);
      if (i === -1) {
        console.warn(`[Game] No stage with id ${id}. Loaded:`, Game.stages.map((s) => s.id).join(', '));
        return;
      }
      if (!Game.started) startGame(true);
      finishStage();
      startStage(i);
    },
    missing() {
      return Array.from(missingAssets).sort();
    },
    /** Show the end-of-run stats screen right now. */
    stats() {
      if (!Game.started) startGame(true);
      Game.timer.stop();
      Game.showStats();
    },
  };

  /* ===========================================================================
   *  12. BOOT
   * ======================================================================== */
  let loading = false;

  /**
   * Background PC fan: sounds/fan.wav loops for the whole game. Starts loud
   * (CONFIG.FAN_START_VOLUME) and fades down to CONFIG.FAN_GAME_VOLUME over
   * CONFIG.FAN_FADE_MS. Missing file = silent, as always.
   */
  let fan = null;
  function startFan(quiet) {
    if (fan) return;
    fan = new Audio(CONFIG.SOUND_PATH + 'fan.wav');
    fan.loop = true;
    const vol = (v) => clamp(v * CONFIG.MASTER_VOLUME, 0, 1);
    const from = quiet ? CONFIG.FAN_GAME_VOLUME : CONFIG.FAN_START_VOLUME;
    fan.volume = vol(from);
    const p = fan.play();
    if (p && p.catch) p.catch(() => {});
    const t0 = performance.now();
    const fade = (now) => {
      const k = clamp((now - t0) / CONFIG.FAN_FADE_MS, 0, 1);
      fan.volume = vol(from + (CONFIG.FAN_GAME_VOLUME - from) * k);
      if (k < 1) requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }
  Game.fan = { get audio() { return fan; } };

  /**
   * Start button: title -> loading screen (CONFIG.LOADING_MS, a filling bar) ->
   * desktop + winxp.wav + Clippy's greeting. The clock only starts after loading.
   * quiet = true (debug jumps like ?stage=N) skips the loading screen and the sound.
   */
  function startGame(quiet) {
    if (Game.started) return;
    $('#title-screen').classList.add('hidden');
    startFan(quiet); // loud on Start, then settles to a quiet hum
    if (quiet) {
      beginPlay(true);
      return;
    }
    if (loading) return;
    loading = true;
    const screenEl = $('#loading-screen');
    const bar = Game.ui.progress(0);
    $('#loading-bar-slot').replaceChildren(bar);
    screenEl.classList.remove('hidden');
    Game.runProgress(bar, CONFIG.LOADING_MS).then(() => {
      screenEl.classList.add('hidden');
      loading = false;
      if (Game.started) return; // a debug jump happened meanwhile
      Game.sound('winxp.wav');
      beginPlay(false);
    });
  }

  let stopOutlookHighlight = null;

  /**
   * After loading: the desktop "boots" with Outlook closed. Clippy explains why
   * you're here and only the Outlook Saga icon works. quiet (debug jumps) opens
   * Outlook straight away.
   */
  function beginPlay(quiet) {
    if (Game.started) return;
    Game.started = true;
    $('#loading-screen').classList.add('hidden');
    if (quiet) {
      openMail(true);
      return;
    }
    Game.clippy.say(Game.line('general.bootIntro'), 'happy');
    stopOutlookHighlight = Game.highlight('#icon-outlook', 0);
  }

  /** Open the Outlook Saga window (desktop icon / taskbar). Starts the 9:00 clock the first time. */
  function openMail(quiet) {
    const win = Game.mail.el.window;
    if (Game.mailOpen) {
      Game.bringToFront(win);
      return;
    }
    Game.mailOpen = true;
    if (stopOutlookHighlight) stopOutlookHighlight();
    win.classList.remove('hidden');
    win.classList.add('opening');
    $('#task-mail').classList.remove('hidden');
    Game.bringToFront(win);
    Game.clock.start();
    fullRun = !quiet;
    Game.timer.start();
    lastSentSnapshot = emailSnapshot(); // rewrites are counted from here
    if (!quiet) Game.clippy.say(Game.line('general.greeting'), 'happy');
  }
  Game.openMail = openMail;

  function init() {
    // Texts: clippy-lines.js must have loaded (and be valid JSON) before this point.
    if (!Game.lines || !Game.lines.general) {
      console.error('[Game] clippy-lines.js did not load or has a typo (check commas/quotes). All texts will show as [missing text].');
      Game.lines = Game.lines || {};
    }
    Game.stages.forEach(applyStageText);

    root = $('#game');
    screen = $('#screen');
    Game.layers = {
      icons: $('#layer-icons'),
      windows: $('#layer-windows'),
      highlight: $('#layer-highlight'),
      popups: $('#layer-popups'),
      fx: $('#layer-fx'),
      overlay: $('#layer-overlay'),
    };
    fit();
    window.addEventListener('resize', fit);
    initSkins();

    // Static art declared in index.html with data-asset="file.png"
    document.querySelectorAll('[data-asset]').forEach((box) => Game.setAsset(box, box.dataset.asset));

    // ---- every button / desktop icon press plays button.wav (disabled buttons stay silent) ----
    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const btn = e.target.closest && e.target.closest('button, .desktop-icon');
      if (btn && !btn.disabled && root.contains(btn)) Game.sound('button.wav');
    }, true);

    // ---- mail window ----
    const m = Game.mail.el;
    m.window = $('#mail-window');
    m.from = $('#mail-from');
    m.to = $('#mail-to');
    m.subject = $('#mail-subject');
    m.body = $('#mail-body');
    m.bodyWrap = $('#mail-body-wrap');
    m.counter = $('#char-counter');
    m.send = $('#send-btn');
    m.attachBar = $('#mail-attachments');
    m.attachList = $('#attach-list');
    m.status = $('#status-text');

    Game.mail.from = CONFIG.PLAYER_ADDRESS;
    m.to.value = CONFIG.BOSS_ADDRESS;
    m.subject.value = ''; // the email starts with an EMPTY subject (stage 1)
    m.body.value = CONFIG.DEFAULT_BODY;
    m.status.textContent = CONFIG.STATUS_TEXT;
    m.body.addEventListener('input', Game.mail.updateCounter);
    m.subject.addEventListener('input', checkEasterEggs);
    trackTyping(m.subject); // Game.stats.charsTyped / charsDeleted
    trackTyping(m.body);
    m.send.addEventListener('click', onSendClick);
    let lastNudgeTick = performance.now();
    setInterval(() => {
      const now = performance.now();
      slowNudgeTick(now - lastNudgeTick);
      lastNudgeTick = now;
    }, 250);
    Game.mail.updateCounter();
    renderAttachBar();
    renderBounces();
    sendBar = Game.ui.progress(0);
    $('#send-progress').appendChild(sendBar);

    makeWindowDraggable(m.window, $('.xp-titlebar', m.window));
    m.window.addEventListener('pointerdown', () => Game.bringToFront(m.window));
    Game.bringToFront(m.window);
    const talk = (text, mood) => { if (Game.started && !Game.over) Game.clippy.say(text, mood || 'annoyed'); };
    $('.xp-tb-close', m.window).addEventListener('click', () => talk(Game.line('general.mailClose')));
    $('.xp-tb-min', m.window).addEventListener('click', () => talk(Game.line('general.mailMinimize')));
    $('.xp-tb-max', m.window).addEventListener('click', () => talk(Game.line('general.mailMaximize')));
    // Sarcastic reactions for the decorative parts of the mail client
    document.querySelectorAll('[data-tb]').forEach((btn) =>
      btn.addEventListener('click', () => talk(Game.line('general.toolbar.' + btn.dataset.tb)))
    );
    document.querySelectorAll('[data-folder]').forEach((row) =>
      row.addEventListener('click', () => talk(Game.line('general.folders.' + row.dataset.folder, { count: Game.bounces }), 'happy'))
    );
    $('#ad-banner').addEventListener('click', () => talk(Game.line('general.adBanner')));
    $('#user-avatar').addEventListener('click', () => talk(Game.line('general.avatar'), 'happy'));
    $('#saga-logo').addEventListener('click', () => talk(Game.line('general.sagaLogo'), 'happy'));

    // ---- taskbar ----
    clockEl = $('#clock');
    trayIcons = $('#tray-icons');
    renderClock();
    // Until Outlook is open, everything except the Outlook icon just gets "open Outlook first".
    const needsOutlook = (fn) => (...args) => {
      if (Game.started && !Game.mailOpen) {
        talk(Game.line('general.openOutlookFirst'), 'happy');
        return;
      }
      fn(...args);
    };
    $('#start-button').addEventListener('click', needsOutlook(() => talk(Game.line('general.startButton'))));
    $('#task-mail').addEventListener('click', () => Game.bringToFront(m.window));
    // Built-in tray icons (added right-to-left). Stages change them with
    // Game.tray.setIcon / setText — and put them back in cleanup.
    Game.tray.add('battery', 'Battery', null, { persist: true, text: '100%' });
    Game.tray.add('wifi', 'Connected', null, { persist: true });
    Game.tray.add('volume', 'Volume', null, { persist: true });

    // ---- default desktop icons (persist for the whole game) ----
    Game.addIcon({
      id: 'outlook', label: 'Outlook Saga', asset: 'app-icon.png', x: 16, y: 16, persist: true,
      onClick: () => { if (Game.started && !Game.over) openMail(); },
    });
    // Desktop "apps": plain (empty) app windows — non-modal, draggable, one per app.
    const desktopApp = (id, title, icon, x, y) => needsOutlook(() =>
      Game.openApp({ id, title, icon, x, y, w: 360, h: 200, persist: true }));
    Game.addIcon({
      id: 'my-computer', label: 'My Computer', asset: 'icon-my-computer.png', x: 16, y: 106, persist: true,
      onClick: desktopApp('my-computer', 'My Computer', 'icon-my-computer.png', 150, 90),
    });
    Game.addIcon({
      id: 'homework', label: 'Homework', asset: 'icon-homework.png', x: 16, y: 196, persist: true,
      onClick: desktopApp('homework', 'Homework', 'icon-homework.png', 180, 180),
    });
    Game.addIcon({
      id: 'folder', label: 'New Folder (37)', asset: 'icon-folder.png', x: 16, y: 286, persist: true,
      onClick: desktopApp('folder', 'New Folder (37)', 'icon-folder.png', 210, 270),
    });

    // ---- Clippy ----
    clippyEl = $('#clippy');
    clippyImg = $('#clippy-img');
    bubble = $('#clippy-bubble');
    bubbleText = $('#clippy-text');
    clippyImg.addEventListener('click', onClippyClick);
    bubble.addEventListener('click', () => Game.clippy.hide());

    // ---- title screen + URL debug options ----
    $('#start-game').addEventListener('click', () => startGame());
    const params = new URLSearchParams(location.search);
    if (params.has('freeze')) Game.clock.freeze();
    if (params.has('nodeadline') && params.get('nodeadline') !== '0') Game.clock.disableDeadline();
    if (params.has('stage')) Game.debug.goto(parseFloat(params.get('stage')));

    console.info(
      `[Game] Ready. ${Game.stages.length} stages loaded: ` +
        Game.stages.map((s) => s.id + (s.todo ? '*' : '')).join(', ') +
        (Game.stages.some((s) => s.todo) ? '  (* = todo stub)' : '')
    );
  }

  document.addEventListener('DOMContentLoaded', init);
})();

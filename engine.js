'use strict';

const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,

  START_TIME: 8 * 60,
  DEADLINE: 9 * 60,
  SEND_COST_MINUTES: 1,
  HINT_COST_MINUTES: 1,
  REAL_SECONDS_PER_MINUTE: 30,
  WARNING_MINUTES_LEFT: 5,

  SLOW_NUDGE_MS: 10000,
  CONFIRM_CHANCE: 0.1,
  CONFIRM_AGAIN_CHANCE: 0.15,
  EASTER_EGG_BONUS_MINUTES: 2,

  BOSS_ADDRESS: 'printer@company.com',
  PLAYER_ADDRESS: 'you@company.com',
  DEFAULT_BODY:
    'Dear Printer,\n\n' +
    "I'm going to be a few minutes late today. My alarm clock bounced off the wall " +
    'and rolled under the fridge.\n\n' +
    "I'll be at my desk by 9:00. Please don't jam.\n\n" +
    'Best regards,\nMe',
  STATUS_TEXT: 'Connected (barely)',

  ASSET_PATH: 'assets/',
  SOUND_PATH: 'assets/sounds/',
  MASTER_VOLUME: 0.8,

  BOUNCE_MS: 1600,
  ERROR_SOUND_LEAD_MS: 900,
  DELIVER_MS: 900,
  LOADING_MS: 3000,

  FAN_START_VOLUME: 1.0,
  FAN_GAME_VOLUME: 0.08,
  FAN_FADE_MS: 8000,
};

const Game = {
  CONFIG,
  state: {},
  stages: [],
  stage: null,
  stageIndex: -1,
  started: false,
  over: false,
  bounces: 0,
  stats: {
    bounces: 0,
    rewrites: 0,
    charsTyped: 0,
    charsDeleted: 0,
    startTime: null,
    endTime: null,
    hintsUsed: 0,
  },
  mailOpen: false,
  scale: 1,
  layers: {},
  lines: {},
};
window.Game = Game;

(function () {
  const $ = (sel, scope) => (scope || document).querySelector(sel);
  const resolveEl = (target) => (typeof target === 'string' ? document.querySelector(target) : target);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  Game.make = make;

  let root, screen, clockEl, trayIcons;
  let clippyEl, clippyImg, bubble, bubbleText;

  const STAGE_DEFAULTS = {
    name: '',
    vibe: null,
    error: '',
    clippy: '',
    hint: '',
    retry: null,
    lines: null,
    textVars: null,
    assets: [],
    todo: false,
    final: false,
    setup: null,
    check: null,
    cleanup: null,
  };

  const fill = (text, vars) =>
    vars ? String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : text;
  const warnedKeys = new Set();

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

  function applyStageText(stage) {
    const t = (Game.lines.stages || {})[String(stage.id)];
    const vars = stage.textVars;
    if (t) {
      ['error', 'clippy', 'hint'].forEach((k) => { if (t[k] != null) stage[k] = t[k]; });
      if (t.retry) stage.retry = t.retry;
      stage.lines = Object.assign({}, stage.lines, t.lines);
    }
    ['error', 'clippy', 'hint'].forEach((k) => { stage[k] = fill(stage[k] || '', vars); });
    if (stage.retry) stage.retry = stage.retry.map((r) => fill(r, vars));
  }

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

  function fit() {
    const s = Math.min(window.innerWidth / CONFIG.WIDTH, window.innerHeight / CONFIG.HEIGHT);
    const x = (window.innerWidth - CONFIG.WIDTH * s) / 2;
    const y = (window.innerHeight - CONFIG.HEIGHT * s) / 2;
    root.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    Game.scale = s;
  }

  Game.toGame = function (a, b) {
    const cx = typeof a === 'object' ? a.clientX : a;
    const cy = typeof a === 'object' ? a.clientY : b;
    const r = root.getBoundingClientRect();
    return { x: (cx - r.left) / Game.scale, y: (cy - r.top) / Game.scale };
  };

  Game.rectOf = function (target) {
    const r = resolveEl(target).getBoundingClientRect();
    const p = Game.toGame(r.left, r.top);
    return { x: p.x, y: p.y, w: r.width / Game.scale, h: r.height / Game.scale };
  };

  Game.hitTest = function (target, point, pad) {
    const el = resolveEl(target);
    if (!el || !el.isConnected || !point) return false;
    const r = Game.rectOf(el);
    const p = pad || 0;
    return point.x >= r.x - p && point.x <= r.x + r.w + p && point.y >= r.y - p && point.y <= r.y + r.h + p;
  };

  const missingAssets = new Set();
  const baseName = (file) => String(file).replace(/\.[a-z0-9]+$/i, '');

  function markFound(file) {
    const name = baseName(file);
    if (Game.skin.found.has(name)) return;
    Game.skin.found.add(name);
    root.classList.add('skin-' + name);
    root.style.setProperty('--img-' + name, `url("${CONFIG.ASSET_PATH}${file}")`);
  }

  Game.asset = function (file, opts) {
    opts = opts || {};
    const box = make('div', 'asset' + (opts.className ? ' ' + opts.className : ''));
    if (opts.w) box.style.width = opts.w + 'px';
    if (opts.h) box.style.height = opts.h + 'px';
    Game.setAsset(box, file);
    return box;
  };

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
      if (box.dataset.asset !== file) return;
      missingAssets.add(file);
      box.replaceChildren(make('span', 'asset-label', file));
      box.classList.add('asset-missing');
    };
    img.src = CONFIG.ASSET_PATH + file;
    box.appendChild(img);
    return box;
  };

  const skinState = new Map();
  let skinStyle = null;

  Game.skin = {
    found: new Set(),
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

  function scanSkins(scope) {
    if (!scope || scope.nodeType !== 1) return;
    if (scope.dataset.skin) ensureSkin(scope.dataset.skin);
    if (scope.dataset.skinPressed) ensureSkin(scope.dataset.skinPressed);
    scope.querySelectorAll('[data-skin], [data-skin-pressed]').forEach((el) => {
      ensureSkin(el.dataset.skin);
      ensureSkin(el.dataset.skinPressed);
    });
  }

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

    const raw = getComputedStyle(document.documentElement).getPropertyValue('--os-assets');
    const listed = Array.from(raw.matchAll(/["']([^"']+)["']/g), (match) => match[1].trim());
    listed.forEach((file) => {
      if (/cursor/.test(file)) {
        const img = new Image();
        img.onload = () => markFound(file);
        img.onerror = () => missingAssets.add(file);
        img.src = CONFIG.ASSET_PATH + file;
      } else {
        ensureSkin(file);
      }
    });

    scanSkins(root);
    new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === 'attributes') ensureSkin(m.target.getAttribute(m.attributeName));
        else m.addedNodes.forEach(scanSkins);
      });
    }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-skin', 'data-skin-pressed'] });

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

  Game.ui = {
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

    checkbox(label, checked, onChange, opts) {
      opts = opts || {};
      const row = make('label', 'ui-checkbox' + (opts.readOnly ? ' read-only' : ' clickable'));
      const box = make('span', 'ui-checkbox-box');
      row.append(box, make('span', 'ui-checkbox-label', label));
      row.setChecked = (v) => {
        row.checked = !!v;
        row.classList.toggle('is-checked', row.checked);
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

    key(label, onClick) {
      const press = () => {
        keyTyping = true;
        try { if (onClick) onClick(); } finally { keyTyping = false; }
      };
      return Game.ui.button(label, press, { skin: 'key.png', pressed: 'key-pressed.png', className: 'ui-key' });
    },
  };

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

  const sounds = {};
  Game.sound = function (file, volume, rate) {
    if (sounds[file] === false) return;
    let base = sounds[file];
    if (!base) {
      base = new Audio(CONFIG.SOUND_PATH + file);
      base.addEventListener('error', () => { sounds[file] = false; });
      sounds[file] = base;
    }
    const audio = base.paused ? base : base.cloneNode();
    audio.volume = clamp((volume == null ? 1 : volume) * CONFIG.MASTER_VOLUME, 0, 1);
    audio.preservesPitch = false;
    audio.playbackRate = rate || 1;
    try { audio.currentTime = 0; } catch (e) {  }
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  };

  let cleanups = [];

  Game.track = function (fn) {
    cleanups.push(fn);
    return fn;
  };

  function autoTrack(fn, persist) {
    if (!persist && Game.stage) cleanups.push(fn);
  }

  Game.on = function (target, type, fn, options) {
    target = resolveEl(target);
    target.addEventListener(type, fn, options);
    Game.track(() => target.removeEventListener(type, fn, options));
    return fn;
  };

  Game.timeout = function (fn, ms) {
    const id = setTimeout(fn, ms);
    Game.track(() => clearTimeout(id));
    return id;
  };

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

  const BUILTIN_ICONS = ['error', 'warning', 'info'];

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
      setTimeout(() => row.firstChild && row.firstChild.focus(), 0);
    }

    blocker.appendChild(win);
    Game.layers.popups.appendChild(blocker);
    return api;
  };

  let zTop = 10;

  Game.bringToFront = function (win) {
    win = resolveEl(win);
    win.style.zIndex = (win.dataset.onTop ? 100000 : 0) + ++zTop;
  };

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

  Game.makeMovable = function (win, handle) {
    win = resolveEl(win);
    makeWindowDraggable(win, handle ? resolveEl(handle) : win.querySelector('.xp-titlebar') || win);
    return win;
  };

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

  const openApps = {};

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

  Game.removeIcon = function (id) {
    const icon = document.getElementById('icon-' + id);
    if (icon) icon.remove();
  };

  Game.addProp = function (opts) {
    const el = Game.asset(opts.asset, { w: opts.w, h: opts.h, className: 'prop' });
    if (opts.id) el.id = 'prop-' + opts.id;
    el.style.left = (opts.x || 0) + 'px';
    el.style.top = (opts.y || 0) + 'px';
    Game.layers[opts.layer || 'icons'].appendChild(el);
    autoTrack(() => el.remove(), opts.persist);
    return el;
  };

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
      trayIcons.prepend(item);
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
    setIcon(id, file) {
      const item = Game.tray.get(id);
      if (item) Game.setAsset(item.querySelector('.tray-icon'), file);
    },
    setText(id, text) {
      const item = Game.tray.get(id);
      if (item) item.querySelector('.tray-text').textContent = text;
    },
  };

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
        if (Math.hypot(dx, dy) < 4) return;
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

  Game.overlaps = function (a, b, minPx) {
    const ra = resolveEl(a).getBoundingClientRect();
    const rb = resolveEl(b).getBoundingClientRect();
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    const min = (minPx || 0) * Game.scale;
    return ox > min && oy > min;
  };

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

  Game.shake = function (strength) {
    screen.style.setProperty('--shake', strength || 1);
    screen.classList.remove('shake');
    void screen.offsetWidth;
    screen.classList.add('shake');
  };

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

  const MOODS = ['happy', 'annoyed', 'angry', 'panic'];
  let slowIdleMs = 0;

  Game.clippy = {
    mood: 'happy',
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
      slowIdleMs = 0;
      bubbleText.textContent = text;
      bubble.classList.remove('hidden', 'pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    },
    hide() {
      bubble.classList.add('hidden');
    },
  };

  function onClippyClick() {
    if (!Game.started || Game.over) return;
    if (!Game.mailOpen) {
      Game.clippy.say(Game.line('general.openOutlookFirst'));
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

  let charLimit = null;

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
      setTimeout(() => { countEdit(base, field.value); base = field.value; }, 0);
    });
  }

  Game.mail = {
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
      checkEasterEggs();
    },
    get body() { return this.el.body.value; },
    set body(v) {
      if (keyTyping) countEdit(this.el.body.value, v);
      this.el.body.value = v;
      Game.mail.updateCounter();
    },
    get status() { return this.el.status.textContent; },
    set status(v) { this.el.status.textContent = v; },

    get charLimit() { return charLimit; },
    set charLimit(v) {
      charLimit = v;
      Game.mail.updateCounter();
    },

    updateCounter() {
      const counter = Game.mail.el.counter;
      if (!counter) return;
      const n = Game.mail.el.body.value.length;
      counter.textContent = charLimit == null ? `${n} characters` : `${n} / ${charLimit} characters`;
      counter.classList.toggle('over', charLimit != null && n > charLimit);
    },
  };

  const attached = [];
  let attachDrop = null;

  function renderAttachBar() {
    Game.mail.el.attachBar.classList.toggle('empty', attached.length === 0);
  }

  Game.attachments = {
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
    list() { return attached.slice(); },
    get(name) { return attached.find((a) => a.name === name) || null; },
    setSize(name, sizeLabel) {
      const a = Game.attachments.get(name);
      if (!a) return;
      a.size = sizeLabel;
      a.el.querySelector('.attachment-size').textContent = `(${sizeLabel})`;
    },
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

  Game.dragAttachments = function (onDrop) {
    attachDrop = onDrop;
    Game.track(() => { if (attachDrop === onDrop) attachDrop = null; });
  };

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

  function renderBounces() {
    const el = $('#bounce-count');
    if (el) el.textContent = Game.bounces;
    const meter = $('#bounce-meter');
    if (meter) meter.textContent = `You bounced back ${Game.bounces} time${Game.bounces === 1 ? '' : 's'}`;
  }

  Game.countBounce = function () {
    Game.bounces++;
    Game.stats.bounces = Game.bounces;
    renderBounces();
  };

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
    freeze() {
      frozen = true;
      Game.clock.stop();
    },
    disableDeadline() {
      noDeadline = true;
      renderClock();
    },
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

  const BEST_KEY = 'outlook-saga-best-ms';
  let runStart = 0;
  let runEnd = 0;
  let runTimerTick = null;
  let fullRun = false;
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
    get fullRun() { return fullRun; },
    saveBest() {
      if (!fullRun) return false;
      const best = Game.timer.best;
      if (best && best <= Game.timer.ms) return false;
      try { localStorage.setItem(BEST_KEY, String(Math.round(Game.timer.ms))); } catch (e) {  }
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

  let sending = false;

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
      console.error(`[Game] Stage ${stage.id} check() crashed — auto-passing:`, err);
      return { pass: true };
    }
  }

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

  function autoMood(stage) {
    const playable = Game.stages.filter((s) => !s.final);
    const t = playable.indexOf(stage) / Math.max(1, playable.length);
    return MOODS[clamp(Math.floor(t * MOODS.length), 0, MOODS.length - 1)];
  }

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
            { offset: 0.45, transform: away, easing: 'ease-in' },
            { offset: 0.72, transform: 'translate(0px, 0px) rotate(-12deg) scale(1.3, 0.75)', easing: 'ease-out' },
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

  let errorSoundQueued = false;

  async function send() {
    if (!Game.started || !Game.mailOpen || Game.over || sending || screen.classList.contains('blackout')) return;
    sending = true;
    slowIdleMs = 0;
    root.classList.add('busy');
    window.addEventListener('keydown', blockKeysWhileFlying, true);
    Game.sound('send.wav');
    const statusBefore = Game.mail.status === 'Bounced. Obviously.' ? CONFIG.STATUS_TEXT : Game.mail.status;
    Game.mail.status = 'Sending...';

    if (lastSentSnapshot !== null && emailSnapshot() !== lastSentSnapshot) Game.stats.rewrites++;
    renderBounces();

    const outcome = Game.stage ? runCheck(Game.stage) : { pass: true };
    const nextIndex = outcome.pass ? Game.stageIndex + 1 : Game.stageIndex;
    const next = Game.stages[nextIndex];
    const delivered = outcome.pass && (!next || next.final);

    if (!delivered) Game.clock.add(CONFIG.SEND_COST_MINUTES);
    if (!delivered && !Game.over) {
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
    if (Game.over) return;

    if (!outcome.pass) stillFailed(outcome.reason);
    else {
      finishStage();
      startStage(nextIndex);
    }
    lastSentSnapshot = emailSnapshot();
  }
  Game.send = send;

  function blockKeysWhileFlying(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  let lastSentSnapshot = null;
  function emailSnapshot() {
    const m = Game.mail;
    return JSON.stringify([m.to, m.subject, m.body, Game.attachments.list().map((a) => a.name + '|' + a.size)]);
  }
  const bounceTag = () => (Game.bounces ? ` - Bounce #${Game.bounces}` : '');

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
      onClose: () => { if (!answered) no(); },
    });
  }

  function slowNudgeTick(dt) {
    if (!Game.started || Game.over || sending || confirming || document.hidden) return;
    if (screen.classList.contains('blackout')) return;
    if (document.querySelector('#layer-popups .popup-blocker:not(.passthrough)')) return;
    slowIdleMs += dt;
    if (slowIdleMs < CONFIG.SLOW_NUDGE_MS) return;
    const stage = Game.stage;
    const mood = !Game.mailOpen || !stage ? 'happy' : stage.vibe || autoMood(stage);
    if (Game.mailOpen && stage && typeof stage.slowNudge === 'function') {
      let own = null;
      try { own = stage.slowNudge(Game); } catch (err) { console.error(`[Game] Stage ${stage.id} slowNudge() crashed:`, err); }
      if (own) {
        Game.clippy.say(own, mood);
        return;
      }
    }
    const lines = Game.line(!Game.mailOpen ? 'general.slow.outlook' : 'general.slow.' + mood);
    Game.clippy.say(Array.isArray(lines) ? pick(lines) : lines, mood);
  }

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
      setTimeout(() => Game.mail.el.subject.focus(), 20);
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
    root.dataset.stage = stage.id;
    console.info(`[Game] ▶ Stage ${stage.id}: ${stage.name}${stage.todo ? '  (todo stub)' : ''}`);

    if (stage.final) {
      Game.over = true;
      Game.clock.stop();
      Game.timer.stop();
      if (!safeCall(stage, 'setup')) deliveredFallback();
      return;
    }

    if (!stage.todo && !safeCall(stage, 'setup')) {
      stage._broken = true;
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

  function playErrorSound() {
    if (errorSoundQueued) errorSoundQueued = false;
    else Game.sound('error.wav');
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

  Game.restartStage = function () {
    const stage = Game.stage;
    if (!stage || Game.over) return;
    if (!stage.todo) safeCall(stage, 'cleanup');
    runCleanups();
    if (!stage.todo && !safeCall(stage, 'setup')) stage._broken = true;
  };

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

  Game.restart = function () {
    location.reload();
  };

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
  };

  let loading = false;

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

  function startGame(quiet) {
    if (Game.started) return;
    $('#title-screen').classList.add('hidden');
    startFan(quiet);
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
      if (Game.started) return;
      Game.sound('winxp.wav');
      beginPlay(false);
    });
  }

  let stopOutlookHighlight = null;

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
    lastSentSnapshot = emailSnapshot();
    if (!quiet) Game.clippy.say(Game.line('general.greeting'), 'happy');
  }
  Game.openMail = openMail;

  function init() {
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

    document.querySelectorAll('[data-asset]').forEach((box) => Game.setAsset(box, box.dataset.asset));

    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const btn = e.target.closest && e.target.closest('button, .desktop-icon');
      if (btn && !btn.disabled && root.contains(btn)) Game.sound('button.wav');
    }, true);

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
    m.subject.value = '';
    m.body.value = CONFIG.DEFAULT_BODY;
    m.status.textContent = CONFIG.STATUS_TEXT;
    m.body.addEventListener('input', Game.mail.updateCounter);
    m.subject.addEventListener('input', checkEasterEggs);
    trackTyping(m.subject);
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
    document.querySelectorAll('[data-tb]').forEach((btn) =>
      btn.addEventListener('click', () => talk(Game.line('general.toolbar.' + btn.dataset.tb)))
    );
    document.querySelectorAll('[data-folder]').forEach((row) =>
      row.addEventListener('click', () => talk(Game.line('general.folders.' + row.dataset.folder, { count: Game.bounces }), 'happy'))
    );
    $('#ad-banner').addEventListener('click', () => talk(Game.line('general.adBanner')));
    $('#user-avatar').addEventListener('click', () => talk(Game.line('general.avatar'), 'happy'));
    $('#saga-logo').addEventListener('click', () => talk(Game.line('general.sagaLogo'), 'happy'));

    clockEl = $('#clock');
    trayIcons = $('#tray-icons');
    renderClock();
    const needsOutlook = (fn) => (...args) => {
      if (Game.started && !Game.mailOpen) {
        talk(Game.line('general.openOutlookFirst'), 'happy');
        return;
      }
      fn(...args);
    };
    $('#start-button').addEventListener('click', needsOutlook(() => talk(Game.line('general.startButton'))));
    $('#task-mail').addEventListener('click', () => Game.bringToFront(m.window));
    Game.tray.add('battery', 'Battery', null, { persist: true, text: '100%' });
    Game.tray.add('wifi', 'Connected', null, { persist: true });
    Game.tray.add('volume', 'Volume', null, { persist: true });

    Game.addIcon({
      id: 'outlook', label: 'Outlook Saga', asset: 'app-icon.png', x: 16, y: 16, persist: true,
      onClick: () => { if (Game.started && !Game.over) openMail(); },
    });
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

    clippyEl = $('#clippy');
    clippyImg = $('#clippy-img');
    bubble = $('#clippy-bubble');
    bubbleText = $('#clippy-text');
    clippyImg.addEventListener('click', onClippyClick);
    bubble.addEventListener('click', () => Game.clippy.hide());

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

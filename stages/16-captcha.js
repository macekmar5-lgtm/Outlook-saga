(function () {
  const CAPTCHA_CONFIG = {
    rounds: 10,
    // "Shortened Captcha" mode (title screen, Game.mode === 'short'): only these rounds, in this order.
    shortRounds: [2, 4, 6], // 2 = picture grid, 4 = pattern (Simon), 6 = rotate
    useRealRecaptcha: true,
    // Google's public TEST key (always passes, shows a "testing only" note). Replace it with our own
    // reCAPTCHA v2 key, registered for the domains itch.zone, localhost and 127.0.0.1.
    recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
    recaptchaTimeoutMs: 6000,
    fakeSpinnerMs: 1500,
    nextRoundMs: 1100,
    finalMessageMs: 2000,

    gridSize: 4,
    busCount: 2,
    smallBusScale: 0.3,
    tiles: [
      'tile-bus.png', 'tile-car.png', 'tile-traffic-light.png', 'tile-tree.png', 'tile-crosswalk.png', 'tile-hydrant.png',
      'tile-bicycle.png', 'tile-cloud.png', 'tile-house.png', 'tile-dog.png', 'tile-boat.png', 'tile-bench.png',
    ],

    words: [
      { file: 'captcha-words-1.png', answer: 'begining apparant', correct: 'beginning apparent' },
      { file: 'captcha-words-2.png', answer: 'recieve wierd', correct: 'receive weird' },
      { file: 'captcha-words-3.png', answer: 'definately seperate', correct: 'definitely separate' },
    ],

    patternLength: 5,
    patternFlashMs: 450,
    patternGapMs: 200,
    patternStartDelayMs: 700,
    patternEdgePad: 0.06,
    patternRegions: {
      1: { cx: 0.295, cy: 0.295, box: [0.130, 0.120, 0.450, 0.430] },
      2: { cx: 0.715, cy: 0.275, box: [0.575, 0.105, 0.890, 0.425] },
      3: { cx: 0.294, cy: 0.711, box: [0.110, 0.580, 0.460, 0.870] },
      4: { cx: 0.725, cy: 0.702, box: [0.585, 0.570, 0.880, 0.875] },
    },

    findVariants: ['findme-a.png', 'findme-b.png', 'findme-c.png', 'findme-d.png'],
    findRotations: [-8, 0, 8],
    findCount: 12,

    rotateStep: 3,
    rotateStartMin: 90,
    rotateStartMax: 150,

    // How many cubes are drawn in cubes.png. Our artist sets this to match the drawing.
    cubeCount: 14,
    cubeChoices: 10,

    reactionWindowMs: 600,
    reactionWaitMinMs: 1500,
    reactionWaitMaxMs: 5000,

    clickMin: 50,
    clickMax: 90,

    sliderTarget: 73,
    sliderTolerance: 1,
    sliderStartMax: 45,
  };

  const CFG = CAPTCHA_CONFIG;
  const ROUND_MOODS = ['happy', 'happy', 'happy', 'annoyed', 'annoyed', 'annoyed', 'angry', 'angry', 'panic', 'panic'];

  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const iconButton = (G, file, onClick, className) => {
    const btn = G.make('button', 'cap-icon-btn' + (className ? ' ' + className : ''));
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.appendChild(G.asset(file, { className: 'cap-icon' }));
    btn.addEventListener('click', (e) => { if (e.detail !== 0) onClick(e); });
    return btn;
  };

  let measuredRegions = null;
  let measurePromise = null;

  function measurePatternArt(G) {
    if (measurePromise) return measurePromise;
    const S = 150;
    const load = (file) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = G.CONFIG.ASSET_PATH + file;
    });
    const read = (img) => {
      const canvas = document.createElement('canvas');
      canvas.width = S;
      canvas.height = S;
      const c2d = canvas.getContext('2d');
      c2d.drawImage(img, 0, 0, S, S);
      return c2d.getImageData(0, 0, S, S).data;
    };
    const files = ['pattern-ring.png', 'pattern-lit-1.png', 'pattern-lit-2.png', 'pattern-lit-3.png', 'pattern-lit-4.png'];
    measurePromise = Promise.all(files.map(load)).then((imgs) => {
      const base = read(imgs[0]);
      const regions = {};
      imgs.slice(1).forEach((img, k) => {
        const px = read(img);
        let sx = 0, sy = 0, count = 0, x0 = S, y0 = S, x1 = 0, y1 = 0;
        for (let i = 0; i < S * S; i++) {
          const o = i * 4;
          const diff = Math.abs(px[o] - base[o]) + Math.abs(px[o + 1] - base[o + 1]) +
            Math.abs(px[o + 2] - base[o + 2]) + Math.abs(px[o + 3] - base[o + 3]);
          if (diff <= 60) continue;
          const x = i % S, y = Math.floor(i / S);
          sx += x; sy += y; count++;
          x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
        if (count > 20) regions[k + 1] = { cx: sx / count / S, cy: sy / count / S, box: [x0 / S, y0 / S, (x1 + 1) / S, (y1 + 1) / S] };
      });
      if (Object.keys(regions).length === 4) measuredRegions = regions;
    }).catch(() => {});
    return measurePromise;
  }

  function quadrantAt(G, ring, point) {
    const r = G.rectOf(ring);
    const img = ring.querySelector('.cap-ring-art img');
    const nw = (img && img.naturalWidth) || 1;
    const nh = (img && img.naturalHeight) || 1;
    const scale = Math.min(r.w / nw, r.h / nh);
    const w = nw * scale, h = nh * scale;
    const u = (point.x - (r.x + (r.w - w) / 2)) / w;
    const v = (point.y - (r.y + (r.h - h) / 2)) / h;
    const regions = measuredRegions || CFG.patternRegions;
    const pad = CFG.patternEdgePad;
    const all = Object.values(regions);
    const minU = Math.min(...all.map((g) => g.box[0])) - pad, maxU = Math.max(...all.map((g) => g.box[2])) + pad;
    const minV = Math.min(...all.map((g) => g.box[1])) - pad, maxV = Math.max(...all.map((g) => g.box[3])) + pad;
    if (u < minU || u > maxU || v < minV || v > maxV) return 0;
    let best = 0, bestScore = Infinity;
    Object.entries(regions).forEach(([n, g]) => {
      const dx = Math.max(g.box[0] - u, 0, u - g.box[2]);
      const dy = Math.max(g.box[1] - v, 0, v - g.box[3]);
      const score = Math.hypot(dx, dy) * 1000 + Math.hypot(u - g.cx, v - g.cy);
      if (score < bestScore) { bestScore = score; best = Number(n); }
    });
    return best;
  }

  let recaptchaPromise = null;

  function loadRecaptcha() {
    if (recaptchaPromise) return recaptchaPromise;
    recaptchaPromise = new Promise((resolve) => {
      let timer = null;
      const done = (ok) => { clearTimeout(timer); resolve(ok); };
      timer = setTimeout(() => done(false), CFG.recaptchaTimeoutMs);
      try {
        if (window.grecaptcha && window.grecaptcha.render) { done(true); return; }
        window.__sagaRecaptchaReady = () => done(true);
        if (!document.getElementById('saga-recaptcha')) {
          const s = document.createElement('script');
          s.id = 'saga-recaptcha';
          s.src = 'https://www.google.com/recaptcha/api.js?onload=__sagaRecaptchaReady&render=explicit';
          s.async = true;
          s.defer = true;
          s.onerror = () => done(false);
          document.head.appendChild(s);
        }
      } catch (e) {
        done(false);
      }
    }).then((ok) => {
      if (!ok) recaptchaPromise = null;
      return ok;
    });
    return recaptchaPromise;
  }

  function removeRecaptchaPopups() {
    try {
      document.querySelectorAll('iframe[src*="recaptcha/api2/bframe"], iframe[src*="recaptcha/enterprise/bframe"]').forEach((f) => {
        let el = f;
        while (el.parentElement && el.parentElement !== document.body) el = el.parentElement;
        if (el.parentElement === document.body) el.remove();
      });
    } catch (e) {  }
  }

  function mountFakeCheckbox(G, slot, st, ctx) {
    const row = G.make('div', 'cap-robot-row clickable');
    const box = G.make('span', 'cap-robot-box');
    G.setSkin(box, 'checkbox.png');
    row.append(box, G.make('span', 'cap-robot-label', "I'm not a robot"));
    row.addEventListener('click', () => {
      if (st.checked || st.spinning) return;
      st.spinning = true;
      const spinner = G.asset('captcha-spinner.png', { className: 'cap-spinner' });
      box.replaceWith(spinner);
      ctx.later(() => {
        st.spinning = false;
        st.checked = true;
        G.setSkin(box, 'checkbox-checked.png');
        spinner.replaceWith(box);
      }, CFG.fakeSpinnerMs);
    });
    slot.appendChild(row);
  }

  function mountGoogle(G, slot, st, ctx) {
    slot.appendChild(G.make('div', 'stage-note', 'Loading...'));
    loadRecaptcha().then((ok) => {
      if (!slot.isConnected) return;
      slot.innerHTML = '';
      if (!ok) { mountFakeCheckbox(G, slot, st, ctx); return; }
      try {
        const box = G.make('div', 'cap-recaptcha');
        slot.appendChild(box);
        st.widget = window.grecaptcha.render(box, {
          sitekey: CFG.recaptchaSiteKey,
          callback: () => { st.checked = true; },
          'expired-callback': () => { st.checked = false; },
          'error-callback': () => { st.checked = false; },
        });
      } catch (e) {
        console.warn('[captcha] reCAPTCHA failed, using our own checkbox.', e);
        slot.innerHTML = '';
        mountFakeCheckbox(G, slot, st, ctx);
      }
    }).catch(() => {
      if (!slot.isConnected) return;
      slot.innerHTML = '';
      mountFakeCheckbox(G, slot, st, ctx);
    });
  }

  const ROUNDS = [
    {
      init(st) { st.checked = false; st.spinning = false; st.widget = null; },
      render(G, el, st, ctx) {
        ctx.setHeader('Confirm that you are not a robot');
        const slot = G.make('div', 'cap-robot');
        el.appendChild(slot);
        if (ctx.useGoogle) mountGoogle(G, slot, st, ctx);
        else mountFakeCheckbox(G, slot, st, ctx);
      },
      check(G, st) { return st.checked || 'Please tick the box first.'; },
      dispose(G, st) {
        try { if (st.widget != null && window.grecaptcha) window.grecaptcha.reset(st.widget); } catch (e) {  }
        removeRecaptchaPopups();
      },
    },

    {
      init(st) {
        const count = CFG.gridSize * CFG.gridSize;
        const others = CFG.tiles.filter((t) => t !== 'tile-bus.png');
        st.cells = Array.from({ length: count }, () => ({ file: pick(others) }));
        const buses = shuffle([...Array(count).keys()]).slice(0, CFG.busCount);
        buses.forEach((i, k) => {
          st.cells[i] = { file: 'tile-bus.png', small: k === 0, corner: pick(['tl', 'tr', 'bl', 'br']) };
        });
        st.buses = new Set(buses);
        st.picked = new Set();
      },
      render(G, el, st, ctx) {
        ctx.setHeader([G.make('div', 'cap-header-small', 'Select all squares with'), G.make('div', 'cap-header-big', 'buses')]);
        const grid = G.make('div', 'cap-grid');
        grid.style.gridTemplateColumns = `repeat(${CFG.gridSize}, 92px)`;
        st.cells.forEach((c, i) => {
          const cell = G.make('div', 'cap-tile clickable');
          const pic = G.asset(c.file, { className: 'cap-tile-pic' + (c.small ? ' small ' + c.corner : '') });
          if (c.small) {
            pic.style.width = CFG.smallBusScale * 100 + '%';
            pic.style.height = CFG.smallBusScale * 100 + '%';
          }
          const tick = G.make('span', 'cap-tick hidden');
          G.setSkin(tick, 'checkbox-checked.png');
          cell.append(pic, tick);
          cell.addEventListener('click', () => {
            const on = !st.picked.has(i);
            if (on) st.picked.add(i); else st.picked.delete(i);
            cell.classList.toggle('selected', on);
            tick.classList.toggle('hidden', !on);
          });
          grid.appendChild(cell);
        });
        el.appendChild(grid);
      },
      check(G, st) {
        return st.picked.size === st.buses.size && [...st.buses].every((i) => st.picked.has(i));
      },
    },

    {
      init(st) { st.words = pick(CFG.words); },
      render(G, el, st, ctx) {
        ctx.setHeader('Type the words');
        el.appendChild(G.asset(st.words.file, { className: 'cap-words' }));
        const field = G.ui.input({ placeholder: 'Type here...' });
        field.classList.add('cap-words-input');
        field.input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); ctx.submit(); }
        });
        st.input = field.input;
        el.appendChild(field);
        ctx.later(() => field.input.focus(), 50);
      },
      check(G, st) {
        const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
        const typed = norm(st.input.value);
        if (typed === norm(st.words.answer)) return true;
        if (typed === norm(st.words.correct)) return 'Incorrect. Please type exactly what you see.';
        return false;
      },
    },

    {
      init(st) {
        st.sequence = Array.from({ length: CFG.patternLength }, () => randInt(1, 4));
        st.pos = 0;
        st.playing = false;
      },
      render(G, el, st, ctx) {
        ctx.setHeader('Repeat the pattern');
        measurePatternArt(G);
        const ring = G.make('div', 'cap-ring clickable');
        ring.appendChild(G.asset('pattern-ring.png', { className: 'cap-ring-art' }));
        const lit = [1, 2, 3, 4].map((n) => {
          const a = G.asset(`pattern-lit-${n}.png`, { className: 'cap-ring-art cap-lit' });
          ring.appendChild(a);
          return a;
        });
        el.appendChild(ring);

        const flash = (q) => {
          const a = lit[q - 1];
          a.classList.add('on');
          G.sound(`tone-${q}.wav`, 0.8);
          ctx.later(() => a.classList.remove('on'), CFG.patternFlashMs);
        };
        const play = (delay) => {
          st.pos = 0;
          st.playing = true;
          ring.classList.add('cap-locked');
          ctx.setSubmit({ enabled: false });
          const step = CFG.patternFlashMs + CFG.patternGapMs;
          st.sequence.forEach((q, i) => ctx.later(() => flash(q), delay + i * step));
          ctx.later(() => {
            st.playing = false;
            ring.classList.remove('cap-locked');
          }, delay + st.sequence.length * step);
        };

        ring.addEventListener('pointerdown', (e) => {
          if (st.playing || st.pos >= st.sequence.length) return;
          const q = quadrantAt(G, ring, G.toGame(e));
          if (!q) return;
          flash(q);
          if (q !== st.sequence[st.pos]) { ctx.fail(); return; }
          st.pos++;
          if (st.pos >= st.sequence.length) ctx.setSubmit({ enabled: true });
        });

        ctx.footer.appendChild(iconButton(G, 'icon-speaker.png', () => { if (!st.playing) play(200); }));
        play(CFG.patternStartDelayMs);
      },
      check(G, st) { return st.pos >= st.sequence.length || 'Repeat the whole pattern first.'; },
    },

    {
      init(st) {
        const combos = [];
        CFG.findVariants.forEach((file) => [false, true].forEach((mirror) => CFG.findRotations.forEach((rot) => {
          combos.push({ file, mirror, rot });
        })));
        st.items = shuffle(combos).slice(0, CFG.findCount);
        st.target = randInt(0, st.items.length - 1);
        st.picked = -1;
      },
      render(G, el, st, ctx) {
        const figure = (c, cls) => {
          const a = G.asset(c.file, { className: cls });
          a.style.transform = `scaleX(${c.mirror ? -1 : 1}) rotate(${c.rot}deg)`;
          return a;
        };
        ctx.setHeader('Find this image', figure(st.items[st.target], 'cap-ref-pic'));
        const grid = G.make('div', 'cap-find-grid');
        const ticks = [];
        st.items.forEach((c, i) => {
          const cell = G.make('div', 'cap-find-cell clickable');
          const tick = G.make('span', 'cap-tick hidden');
          G.setSkin(tick, 'checkbox-checked.png');
          ticks.push({ cell, tick });
          cell.append(figure(c, 'cap-find-pic'), tick);
          cell.addEventListener('click', () => {
            st.picked = st.picked === i ? -1 : i;
            ticks.forEach((t, k) => {
              t.cell.classList.toggle('selected', k === st.picked);
              t.tick.classList.toggle('hidden', k !== st.picked);
            });
          });
          grid.appendChild(cell);
        });
        el.appendChild(grid);
      },
      check(G, st) {
        if (st.picked < 0) return 'Select the matching image.';
        return st.picked === st.target;
      },
    },

    {
      init(st) {
        const lo = Math.ceil(CFG.rotateStartMin / CFG.rotateStep);
        const hi = Math.floor(CFG.rotateStartMax / CFG.rotateStep);
        st.angle = randInt(lo, hi) * CFG.rotateStep * (Math.random() < 0.5 ? -1 : 1);
      },
      render(G, el, st, ctx) {
        ctx.setHeader('Rotate the object the correct way up');
        const row = G.make('div', 'cap-rotate-row');
        const holder = G.make('div', 'cap-rotate-holder');
        const object = G.asset('rotate-object.png', { className: 'cap-rotate-object' });
        holder.append(G.asset('rotate-circle.png', { className: 'cap-rotate-circle' }), object);
        const apply = () => { object.style.transform = `rotate(${st.angle}deg)`; };
        const turn = (dir) => { st.angle += dir * CFG.rotateStep; apply(); };
        row.append(
          iconButton(G, 'rotate-left.png', () => turn(-1), 'cap-rotate-btn'),
          holder,
          iconButton(G, 'rotate-right.png', () => turn(1), 'cap-rotate-btn')
        );
        el.appendChild(row);
        apply();
      },
      check(G, st) { return ((st.angle % 360) + 360) % 360 === 0; },
    },

    {
      init(st) {
        let first = CFG.cubeCount - randInt(0, CFG.cubeChoices - 1);
        if (first < 1) first = 1;
        st.choices = Array.from({ length: CFG.cubeChoices }, (_, i) => first + i);
        st.choice = null;
      },
      render(G, el, st, ctx) {
        ctx.setHeader('How many cubes are there?');
        ctx.setSubmit({ hidden: true });
        el.appendChild(G.asset('cubes.png', { className: 'cap-cubes' }));
        const row = G.make('div', 'cap-numbers');
        st.choices.forEach((n) => {
          row.appendChild(G.ui.button(String(n), () => { st.choice = n; ctx.submit(); }, { className: 'cap-number' }));
        });
        el.appendChild(row);
      },
      check(G, st) { return st.choice === CFG.cubeCount; },
    },

    {
      init(st) { st.phase = 'idle'; st.greenAt = 0; st.ms = null; },
      render(G, el, st, ctx) {
        ctx.setHeader(`Tap "Submit" within ${CFG.reactionWindowMs} ms of the dot turning green`);
        const dot = G.asset('dot-red.png', { className: 'cap-dot' });
        const label = G.make('div', 'cap-reaction', '');
        const start = G.ui.button('Start', () => {
          if (st.phase !== 'idle') return;
          st.phase = 'waiting';
          start.classList.add('hidden');
          label.textContent = 'Wait for green...';
          ctx.later(() => {
            st.phase = 'green';
            G.setAsset(dot, 'dot-green.png');
            st.greenAt = performance.now();
            label.textContent = 'NOW!';
          }, randInt(CFG.reactionWaitMinMs, CFG.reactionWaitMaxMs));
        }, { className: 'cap-start' });
        el.append(dot, start, label);
        st.label = label;
      },
      check(G, st) {
        if (st.phase !== 'green') return 'Too early.';
        st.ms = Math.round(performance.now() - st.greenAt);
        st.label.textContent = `Reaction time: ${st.ms} ms`;
        return st.ms <= CFG.reactionWindowMs || `Too slow. ${st.ms} ms.`;
      },
      passText(st) { return `Reaction time: ${st.ms} ms.`; },
    },

    {
      init(st) { st.target = randInt(CFG.clickMin, CFG.clickMax); st.count = 0; },
      render(G, el, st, ctx) {
        ctx.setHeader(['Click the button exactly', G.make('span', 'cap-odd-number', String(st.target)), 'times']);
        const big = G.ui.button('', (e) => { if (e.detail !== 0) st.count++; }, {
          skin: 'big-button.png', pressed: 'big-button-pressed.png', className: 'cap-big-button',
        });
        big.tabIndex = -1;
        el.appendChild(big);
        ctx.footer.appendChild(iconButton(G, 'icon-refresh.png', () => { st.count = 0; }));
      },
      check(G, st) {
        return st.count === st.target || `You clicked ${st.count} time${st.count === 1 ? '' : 's'}.`;
      },
    },

    {
      init(st) { st.value = randInt(0, CFG.sliderStartMax); },
      render(G, el, st, ctx) {
        ctx.setHeader(`Drag the slider to exactly ${CFG.sliderTarget}%`);
        const hit = G.make('div', 'cap-slider-hit draggable clickable');
        const track = G.make('div', 'cap-slider-track');
        G.setSkin(track, 'slider-track.png');
        const knob = G.asset('slider-knob.png', { className: 'cap-slider-knob' });
        track.appendChild(knob);
        hit.appendChild(track);
        const apply = () => { knob.style.left = st.value + '%'; };
        const update = (e) => {
          const r = G.rectOf(track);
          const p = G.toGame(e);
          st.value = Math.max(0, Math.min(100, ((p.x - r.x) / r.w) * 100));
          apply();
        };
        hit.addEventListener('pointerdown', (e) => {
          try { hit.setPointerCapture(e.pointerId); } catch (err) {  }
          update(e);
        });
        hit.addEventListener('pointermove', (e) => {
          if (hit.hasPointerCapture && hit.hasPointerCapture(e.pointerId)) update(e);
        });
        el.appendChild(hit);
        apply();
      },
      check(G, st) {
        const pct = Math.round(st.value);
        return Math.abs(pct - CFG.sliderTarget) <= CFG.sliderTolerance || `You chose ${pct}%.`;
      },
      passText() { return `${CFG.sliderTarget}%. Suspiciously precise.`; },
    },
  ];

  // Round numbers (1-based, into ROUNDS) played in the current mode.
  function roundOrder() {
    if (Game.mode === 'short') return CFG.shortRounds.filter((n) => ROUNDS[n - 1]);
    return ROUNDS.slice(0, CFG.rounds).map((_, i) => i + 1);
  }

  function startGauntlet(G) {
    const params = new URLSearchParams(location.search);
    const order = roundOrder();
    const total = order.length;
    const firstRound = Math.min(total, Math.max(1, parseInt(params.get('captcharound'), 10) || 1));
    const useGoogle = CFG.useRealRecaptcha && /^https?:$/.test(location.protocol) && params.get('norecaptcha') !== '1';
    if (useGoogle) loadRecaptcha();

    const win = G.openWindow({
      title: 'Are you human?', className: 'cap-win',
      x: 395, y: 12, w: 480, h: 656, closable: false, alwaysOnTop: true,
    });
    const panel = G.make('div', 'cap-panel');
    G.setSkin(panel, 'captcha-frame.png');
    const header = G.make('div', 'cap-header');
    G.setSkin(header, 'captcha-header.png');
    const headerText = G.make('div', 'cap-header-text');
    const ref = G.make('div', 'cap-ref');
    header.append(headerText, ref);
    const content = G.make('div', 'cap-content');
    const footer = G.make('div', 'cap-footer');
    const footerLeft = G.make('div', 'cap-footer-left');
    const roundLabel = G.make('div', 'cap-round');
    const submit = G.ui.button('Submit', () => runner.submit(), { className: 'cap-submit' });
    footer.append(footerLeft, roundLabel, submit);
    const msg = G.make('div', 'cap-msg');
    panel.append(header, content, footer);
    win.body.append(panel, msg);

    const timers = new Set();
    const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
    G.track(clearTimers);

    const ctx = {
      useGoogle,
      footer: footerLeft,
      later(fn, ms) {
        const id = setTimeout(() => {
          timers.delete(id);
          try { fn(); } catch (e) { console.error('[captcha]', e); }
        }, ms);
        timers.add(id);
        return id;
      },
      setHeader(text, refEl) {
        headerText.innerHTML = '';
        (Array.isArray(text) ? text : [text]).forEach((part, i) => {
          if (i) headerText.append(' ');
          headerText.append(part);
        });
        ref.innerHTML = '';
        ref.classList.toggle('hidden', !refEl);
        if (refEl) ref.appendChild(refEl);
      },
      setSubmit(opts) {
        if ('enabled' in opts) submit.disabled = !opts.enabled;
        if ('hidden' in opts) submit.classList.toggle('hidden', opts.hidden);
      },
      submit: () => runner.submit(),
      fail: (text) => runner.fail(text),
    };

    function makeRound(def) {
      let st = {};
      let el = null;
      return {
        render(container) {
          el = container;
          st = {};
          footerLeft.innerHTML = '';
          ctx.setHeader('');
          ctx.setSubmit({ enabled: true, hidden: false });
          def.init(st);
          def.render(G, el, st, ctx);
        },
        check() { return def.check(G, st); },
        reset() {
          clearTimers();
          this.dispose();
          el.innerHTML = '';
          this.render(el);
        },
        dispose() { if (def.dispose) def.dispose(G, st); },
        passText() { return def.passText ? def.passText(st) : ''; },
      };
    }

    let index = firstRound - 1;
    let round = null;
    let busy = false;

    const shake = () => {
      win.el.classList.remove('cap-shake');
      void win.el.offsetWidth;
      win.el.classList.add('cap-shake');
    };

    function showRound() {
      clearTimers();
      if (round) round.dispose();
      content.innerHTML = '';
      content.classList.remove('cap-locked');
      busy = false;
      G.state.captchaRound = index + 1;
      roundLabel.textContent = `Round ${index + 1}/${total}`;
      round = makeRound(ROUNDS[order[index] - 1]);
      try {
        round.render(content);
      } catch (e) {
        console.error('[captcha] Round', index + 1, 'failed to build; it passes on Submit.', e);
        round.check = () => true;
        ctx.setSubmit({ enabled: true, hidden: false });
      }
    }

    function finish() {
      clearTimers();
      if (round) round.dispose();
      round = null;
      content.innerHTML = '';
      footerLeft.innerHTML = '';
      ctx.setHeader('Verification failed');
      submit.classList.add('hidden');
      msg.textContent = '';
      content.appendChild(G.make('div', 'cap-final', 'Verification failed. You are too human.'));
      G.timeout(() => {
        G.state.captcha = true;
        win.close();
        G.clippy.say(G.line('verified'), 'panic');
      }, CFG.finalMessageMs);
    }

    const runner = {
      submit() {
        if (busy || !round) return;
        let result;
        try { result = round.check(); } catch (e) { console.error('[captcha]', e); result = true; }
        if (result === true) this.pass();
        else this.fail(typeof result === 'string' ? result : null);
      },
      fail(text) {
        if (busy || !round) return;
        msg.textContent = text || 'Please try again.';
        shake();
        G.countBounce();
        try { round.reset(); } catch (e) { console.error('[captcha]', e); }
      },
      pass() {
        busy = true;
        content.classList.add('cap-locked');
        submit.disabled = true;
        msg.textContent = round.passText() || 'Verified.';
        G.clippy.say(G.line('round' + order[index]), ROUND_MOODS[order[index] - 1] || 'panic');
        if (index + 1 >= total) {
          G.timeout(finish, CFG.nextRoundMs);
          return;
        }
        G.timeout(() => {
          index++;
          msg.textContent = '';
          showRound();
        }, CFG.nextRoundMs);
      },
    };

    G.track(() => {
      if (round) round.dispose();
      removeRecaptchaPopups();
    });
    showRound();
  }

  Game.registerStage({
    id: 4.25,
    name: 'Captcha gauntlet',
    vibe: 'happy',
    assets: [
      'captcha-frame.png', 'captcha-header.png', 'button.png', 'checkbox.png', 'checkbox-checked.png', 'captcha-spinner.png',
      ...CAPTCHA_CONFIG.tiles,
      'captcha-words-1.png', 'captcha-words-2.png', 'captcha-words-3.png',
      'pattern-ring.png', 'pattern-lit-1.png', 'pattern-lit-2.png', 'pattern-lit-3.png', 'pattern-lit-4.png', 'icon-speaker.png',
      'findme-a.png', 'findme-b.png', 'findme-c.png', 'findme-d.png',
      'rotate-object.png', 'rotate-circle.png', 'rotate-left.png', 'rotate-right.png',
      'cubes.png',
      'dot-red.png', 'dot-green.png',
      'big-button.png', 'big-button-pressed.png', 'icon-refresh.png',
      'slider-track.png', 'slider-knob.png',
    ],

    setup(G) {
      G.state.captcha = false;
      G.state.captchaRound = 1;
      if (G.mode === 'short') {
        // The engine reads these right after setup() / on Clippy clicks.
        G.stage.clippy = G.line('clippyShort');
        G.stage.hint = G.line('hintShort');
      }
      startGauntlet(G);
    },

    check(G) {
      return G.state.captcha || `Captcha not finished (round ${G.state.captchaRound || 1}/${roundOrder().length}). Are you even human?`;
    },

    cleanup(G) {
      delete G.state.captcha;
      delete G.state.captchaRound;
    },
  });
})();

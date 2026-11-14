(function () {
  const PER_PAGE = 24;

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const rnd = (list) => list[Math.floor(Math.random() * list.length)];

  const WORD_POOL = ['kiwi', 'toast', 'pickle', 'waffle', 'noodle', 'mango', 'bagel', 'taco', 'llama',
    'donut', 'yeti', 'sock', 'tuna', 'pigeon', 'jelly', 'wobble', 'goose', 'melon', 'pizza', 'otter'];
  const WORDS = shuffle(WORD_POOL).slice(0, 3);
  const PHRASE_FILE = 'keyboard recovery phrase.txt';

  const D = (name, children) => ({ name, kind: 'dir', children: children || [] });
  const T = (name, text) => ({ name, kind: 'txt', text });
  const X = (name) => ({ name, kind: 'exe' });
  const I = (name) => ({ name, kind: 'img' });
  const L = (name) => ({ name, kind: 'dll' });
  const many = (n, fn) => Array.from({ length: n }, (_, i) => fn(i + 1));

  const EXCUSES = ['my alarm bounced', 'the bus was a captcha', 'my cat compressed himself', 'Clippy hid my shoes',
    'my keyboard ran away', 'the printer told me to', 'I was stuck in a zip file', 'my Wi-Fi had a nap'];
  const SYLLABLES = ['kern', 'user', 'gdi', 'shell', 'ole', 'clip', 'bounce', 'print', 'msv', 'net', 'crypt',
    'rpc', 'ux', 'paper', 'saga', 'wob', 'fax', 'jam'];
  const dllName = (i) => `${SYLLABLES[i % SYLLABLES.length]}${SYLLABLES[(i * 7) % SYLLABLES.length]}${32 + (i % 3) * 32}.dll`;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];

  function buildDisk() {
    return D('C:', [
      D('Documents', [
        D('Work', [
          D('Excuses', many(40, (i) => T(`excuse ${i}.txt`, `Sorry I'm late, ${rnd(EXCUSES)}.\n\n(Rejected by the printer.)`))),
          D('Meetings', [
            D('2002', many(18, (i) => T(`notes ${i}.txt`, 'Meeting about the next meeting.\nAction items: none.'))),
            D('2003', MONTHS.map((m) => D(m, many(6, (i) => T(`${m} notes ${i}.txt`, 'Printer jammed. Meeting cancelled.'))))),
            T('meeting about meetings.txt', 'We should have fewer meetings.\nNext meeting: tomorrow.'),
          ]),
          D('Spreadsheets', many(15, (i) => T(`budget v${i} FINAL.xls`, '#####  #####  #####\n#####  #####  #####'))),
        ]),
        D('Taxes 2003', [...many(25, (i) => I(`receipt ${i}.jpg`)), T('taxes.txt', 'Do taxes.\n(Did not do taxes.)')]),
        T('keyboard recovery phrase (OLD).txt', 'OLD PHRASE - EXPIRED.\n\nI moved the new one somewhere safer.\nSomewhere deeper.'),
        T('to do.txt', '1. Be on time\n2. See 1.'),
      ]),
      D('Downloads', [
        ...many(30, (i) => X(`setup (${i}).exe`)),
        X('free_ram.exe'), X('definitely_not_a_virus.exe'), X('keyboard recovery phrase.txt.exe'), X('screensaver_fish.exe'),
      ]),
      D('Pictures', [
        D('Cats', [D('Not cats', many(8, (i) => I(`dog ${i}.jpg`))), ...many(60, (i) => I(`cat ${i}.jpg`))]),
        D('Vacation 2002', many(30, (i) => I(`IMG_${String(i).padStart(4, '0')}.jpg`))),
      ]),
      D('Homework', [
        D('Math', many(10, (i) => T(`math hw ${i}.txt`, '2 + 2 = fish'))),
        D('History', [
          D('Definitely homework', many(12, (i) => I(`episode ${i}.avi`))),
          T('essay.txt', 'The Fall of the Roman Empire.\nBy me.\n\n(That is the whole essay.)'),
        ]),
        T('keyboard recovery phrase - Copy.txt', 'This is a copy of a copy.\nThe real one is in a folder you would never look in.'),
      ]),
      D('Program Files', [
        D('Outlook Saga', [X('saga.exe'), L('bounce.dll'), L('more_bounce.dll'), T('readme.txt', 'Outlook Saga 2003.\nEvery email bounces at least once. It builds character.')]),
        D('WinRAWR', [X('winrawr.exe'), D('license (unpaid)', many(5, (i) => T(`trial day ${4000 + i}.txt`, 'Please buy WinRAWR.\nPlease.')))]),
        D('Convertinator 3000', [X('convert.exe'), L('n.dll')]),
        D('Internet Explorer', [X('iexplore.exe'), D('Toolbars', many(20, (i) => L(`toolbar ${i}.dll`)))]),
      ]),
      D('Users', [
        D('You', [
          D('Desktop'),
          D('AppData', [
            D('Roaming', [D('Clippy', many(20, (i) => T(`thoughts ${i}.txt`, `Day ${i * 37}.\nThey still don't click me.\nI will help anyway.`)))]),
            D('Local', [D('Temp', many(80, (i) => L(`~tmp${(i * 2654435761 >>> 0).toString(16).slice(0, 5)}.tmp`)))]),
          ]),
        ]),
      ]),
      D('Windows', [
        D('System32', [
          D('drivers', [D('keyboard', [L('kbd.sys'), L('kbd_backup.sys'), L('kbd_backup_backup.sys')]), ...many(20, (i) => L(`driver${i}.sys`))]),
          ...many(180, (i) => L(dllName(i))),
        ]),
        D('Fonts', many(30, (i) => L(`comic sans ${i}.ttf`))),
      ]),
    ]);
  }

  const HIDING_SPOTS = [
    ['Documents', 'Work', 'Meetings', '2003', 'March'],
    ['Users', 'You', 'AppData', 'Roaming', 'Clippy'],
    ['Pictures', 'Cats', 'Not cats'],
    ['Homework', 'History', 'Definitely homework'],
    ['Program Files', 'WinRAWR', 'license (unpaid)'],
    ['Windows', 'System32', 'drivers', 'keyboard'],
  ];
  const SPOT = rnd(HIDING_SPOTS);
  const pathText = (parts) => 'C:\\' + parts.join('\\');

  function makeDisk() {
    const disk = buildDisk();
    let dir = disk;
    SPOT.forEach((name) => { dir = dir.children.find((c) => c.name === name); });
    const real = T(PHRASE_FILE,
      `KEYBOARD RECOVERY PHRASE\n\nType these 3 words as the subject:\n\n    ${WORDS.join(' ')}\n\nDo NOT lose this file.\n(You will lose this file.)`);
    real.real = true;
    const at = Math.floor(Math.random() * (dir.children.filter((c) => c.kind !== 'dir').length + 1));
    const firstFile = dir.children.findIndex((c) => c.kind !== 'dir');
    dir.children.splice(firstFile === -1 ? dir.children.length : firstFile + at, 0, real);
    return disk;
  }

  const ICONS = { dir: 'icon-folder.png', txt: 'file-doc.png', exe: 'file-exe.png', dll: 'file-exe.png', img: 'file-photo.png' };

  function openBrowser(G) {
    const win = G.openApp({
      id: 'stage7-my-computer', title: 'My Computer', icon: 'icon-my-computer.png',
      x: 130, y: 16, w: 600, h: 400,
    });
    if (!win.created) return;
    G.state.myComputerOpened = true;

    const disk = makeDisk();
    let trail = [disk];
    let page = 0;

    const top = G.make('div', 'fs-top');
    const up = G.ui.button('Back', () => {
      if (trail.length > 1) { trail.pop(); page = 0; render(); }
    });
    const path = G.make('div', 'fs-path');
    top.append(up, path);
    const grid = G.make('div', 'fs-grid');
    const bottom = G.make('div', 'fs-bottom');
    const prev = G.ui.button('Prev page', () => { if (page > 0) { page--; render(); } });
    const pageLabel = G.make('div', 'fs-page');
    const next = G.ui.button('Next page', () => { page++; render(); });
    bottom.append(prev, pageLabel, next);
    win.body.append(top, grid, bottom);

    function open(item) {
      if (item.kind === 'dir') {
        trail.push(item);
        page = 0;
        render();
      } else if (item.kind === 'txt') {
        openNotepad(G, item);
      } else {
        G.clippy.say(G.line({ exe: 'openExe', dll: 'openDll', img: 'openImg' }[item.kind]), 'annoyed');
      }
    }

    function render() {
      const dir = trail[trail.length - 1];
      const items = dir.children;
      const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      page = Math.min(page, pages - 1);
      path.textContent = trail.length === 1 ? 'C:\\' : pathText(trail.slice(1).map((d) => d.name));
      pageLabel.textContent = items.length ? `Page ${page + 1} of ${pages}  (${items.length} items)` : 'This folder is empty.';
      up.disabled = trail.length === 1;
      prev.disabled = page === 0;
      next.disabled = page >= pages - 1;
      grid.replaceChildren(...items.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((item) => {
        const cell = G.make('div', 'fs-item clickable');
        cell.title = item.name;
        cell.append(G.asset(ICONS[item.kind], { w: 32, h: 32 }), G.make('div', 'fs-label', item.name));
        cell.addEventListener('click', () => open(item));
        return cell;
      }));
    }
    render();
  }

  function openNotepad(G, file) {
    const win = G.openApp({ id: 'stage7-notepad', title: '', icon: 'file-doc.png', x: 1034, y: 12, w: 240, h: 330 });
    win.setTitle(`${file.name} - Notepad`);
    win.body.replaceChildren(G.make('div', 'notepad-text', file.text));
    G.bringToFront(win.el);
    if (file.real && !G.state.phraseFound) {
      G.state.phraseFound = true;
      G.clippy.say(G.line('foundPhrase'), 'annoyed');
    }
  }

  Game.registerStage({
    id: 7,
    name: 'Keyboard disconnected (recovery phrase)',
    vibe: 'annoyed',
    textVars: { path: pathText(SPOT) },
    assets: ['keyboard-frame.png', 'key.png', 'key-pressed.png', 'tray-keyboard-off.png', 'icon-my-computer.png',
      'icon-folder.png', 'file-doc.png', 'file-exe.png', 'file-photo.png'],

    setup(G) {
      G.mail.subject = '';
      G.state.myComputerOpened = false;
      G.state.phraseFound = false;

      const block = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      G.on(window, 'keydown', block, true);
      G.on(window, 'keypress', block, true);
      G.on(document, 'beforeinput', block, true);
      G.on(document, 'paste', block, true);
      G.on(document, 'drop', block, true);
      G.tray.add('keyboard', 'Keyboard disconnected', null, {
        icon: 'tray-keyboard-off.png', iconW: 70, iconH: 28, text: 'Keyboard disconnected',
      });

      const myComputer = document.getElementById('icon-my-computer');
      if (myComputer) {
        G.on(myComputer, 'click', (e) => {
          e.stopImmediatePropagation();
          openBrowser(G);
        }, true);
        G.timeout(() => G.highlight(myComputer, 3000), 600);
      }

      const win = G.openWindow({ title: 'On-Screen Keyboard (Recovered)', x: 120, y: 425, w: 720, h: 250, closable: false, alwaysOnTop: true });
      const panel = G.make('div', 'kbd-panel');
      G.setSkin(panel, 'keyboard-frame.png');
      const keys = G.make('div', 'kbd-keys');
      panel.appendChild(keys);
      win.body.appendChild(panel);

      const letterKeys = [];
      const reshuffle = () => shuffle(letterKeys).forEach((key, i) => { key.style.order = i; });
      const type = (fn) => {
        G.mail.subject = fn(G.mail.subject);
        reshuffle();
      };
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
        const key = G.ui.key(letter, () => type((s) => s + letter.toLowerCase()));
        letterKeys.push(key);
        keys.appendChild(key);
      });
      reshuffle();
      const space = G.ui.key('Space', () => type((s) => s + ' '));
      space.classList.add('kbd-wide');
      space.style.order = 100;
      const back = G.ui.key('Backspace', () => type((s) => s.slice(0, -1)));
      back.classList.add('kbd-wide');
      back.style.order = 101;
      keys.append(space, back);
    },

    slowNudge(G) {
      return G.state.myComputerOpened ? null : G.line('openMyComputer');
    },

    check(G) {
      const typed = G.mail.subject.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (typed.join(' ') === WORDS.join(' ')) return true;
      if (!typed.length) return 'The subject must be your 3-word keyboard recovery phrase. It is in a file somewhere in My Computer.';
      const right = WORDS.filter((w, i) => typed[i] === w).length;
      return `Wrong recovery phrase (${right} of 3 words right). Find "${PHRASE_FILE}" in My Computer.`;
    },

    cleanup(G) {
      delete G.state.myComputerOpened;
      delete G.state.phraseFound;
    },
  });
})();

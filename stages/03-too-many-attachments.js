(function () {
  const EXE = 'definitely_not_a_virus.exe';
  const FILES = [
    ['cat.jpg', '4.2 GB', 'file-photo.png'],
    ['excuse.docx', '18 KB', 'file-doc.png'],
    [EXE, '666 KB', 'file-exe.png'],
    ['meme.png', '2 MB', 'file-photo.png'],
    ['budget_2009.xlsx', '9 KB', 'file-doc.png'],
  ];

  Game.registerStage({
    id: 3,
    name: 'Too many attachments',
    vibe: 'happy',
    assets: ['file-photo.png', 'file-doc.png', 'file-exe.png', 'trash-empty.png', 'trash-full.png'],

    setup(G) {
      G.attachments.clear();
      FILES.forEach((f) => G.attachments.add(f[0], f[1], f[2]));

      const trashed = [];
      let binWin = null;
      const bin = G.addIcon({
        id: 'trash', label: 'Recycle Bin', asset: 'trash-empty.png', x: 16, y: 470,
        onClick: () => openBin(),
      });
      const binImg = bin.querySelector('.desktop-icon-img');

      function emptyBin() {
        trashed.length = 0;
        G.setAsset(binImg, 'trash-empty.png');
        G.sound('empty-bin.wav');
        G.clippy.say(G.line('binEmptied'), 'happy');
        renderBin();
      }
      function renderBin() {
        if (!binWin || !binWin.el.isConnected) return;
        binWin.body.replaceChildren();
        const list = G.make('div', 'bin-list');
        if (!trashed.length) list.appendChild(G.make('div', 'stage-note', 'The Recycle Bin is empty.'));
        trashed.forEach((f) => {
          const row = G.make('div', 'bin-item');
          row.append(G.asset(f.icon, { w: 24, h: 24 }), G.make('span', 'bin-name', f.name), G.make('span', 'bin-size', f.size));
          list.appendChild(row);
        });
        const empty = G.ui.button('Empty Recycle Bin', () => {
          G.popup({
            title: 'Confirm Multiple File Delete',
            icon: 'warning',
            text: trashed.length === 1
              ? `Are you sure you want to permanently delete '${trashed[0].name}'?`
              : `Are you sure you want to permanently delete these ${trashed.length} items?`,
            buttons: [{ label: 'Yes', onClick: emptyBin }, { label: 'No' }],
          });
        });
        empty.disabled = !trashed.length;
        binWin.body.append(list, empty);
      }
      function openBin() {
        binWin = G.openApp({ id: 'recycle-bin', title: 'Recycle Bin', icon: 'trash-full.png', x: 130, y: 330, w: 380, h: 290 });
        G.setAsset(binWin.el.querySelector('.xp-title-icon'), trashed.length ? 'trash-full.png' : 'trash-empty.png');
        renderBin();
      }

      G.dragAttachments((att, point) => {
        if (!G.hitTest(bin, point)) return;
        if (att.name === 'cat.jpg') {
          G.shake();
          G.clippy.say(G.line('notTheCat'), 'annoyed');
          return;
        }
        trashed.push({ name: att.name, size: att.size, icon: att.icon });
        G.attachments.remove(att.name);
        G.setAsset(binImg, 'trash-full.png');
        G.sound('trash-crumple.wav');
        if (att.name === EXE) G.clippy.say(G.line('exeGone'), 'happy');
        renderBin();
      });

      G.timeout(() => G.highlight(bin, 3000), 600);
    },

    check(G) {
      const list = G.attachments.list();
      if (list.some((a) => a.name === EXE)) return `${EXE} is still attached. Suspicious.`;
      if (list.length > 3) return `Still ${list.length} attachments. The maximum is 3.`;
      if (!G.attachments.get('cat.jpg')) return 'Where is cat.jpg? The printer was looking forward to the cat.';
      return true;
    },
  });
})();

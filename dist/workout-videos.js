// 动作视频：每个动作可以录 / 选一段视频看姿势。
// 视频文件存在本机 IndexedDB（只在这台设备的这个 App 里，不上传、不进导出备份），
// 训练记录里只存视频的 id 和时间：exercise.videos = [{ id, createdAt, size, type }]。
(() => {
  'use strict';
  const app = () => window.workoutApp;
  const DB_NAME = 'workout-media';
  const STORE = 'videos';
  const urlCache = new Map();   // id → object URL，重绘动作卡片时复用，不重复读文件
  const pendingIds = new Set(); // 正在写入、还没记进训练记录的视频，清理时跳过

  // ---------- IndexedDB ----------
  let dbPromise = null;
  function openDb() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }
  async function withStore(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  const putVideo = record => withStore('readwrite', store => store.put(record));
  const getVideo = id => withStore('readonly', store => store.get(id));
  const deleteVideo = id => withStore('readwrite', store => store.delete(id));
  const allVideoIds = () => withStore('readonly', store => store.getAllKeys());

  async function videoUrl(id) {
    if (urlCache.has(id)) return urlCache.get(id);
    const record = await getVideo(id).catch(() => null);
    if (!record || !record.blob) return '';
    const url = URL.createObjectURL(record.blob);
    urlCache.set(id, url);
    return url;
  }
  function forgetUrl(id) {
    const url = urlCache.get(id);
    if (url) URL.revokeObjectURL(url);
    urlCache.delete(id);
  }

  // ---------- 训练记录里的视频引用 ----------
  function allExercises() {
    const state = app().getState();
    const list = [];
    (state.current.exercises || []).forEach(ex => list.push({ ex, date: state.current.date || '' }));
    (state.sessions || []).forEach(session => (session.exercises || []).forEach(ex => list.push({ ex, date: session.date || '' })));
    return list;
  }
  function referencedIds() {
    const ids = new Set();
    allExercises().forEach(({ ex }) => (ex.videos || []).forEach(video => ids.add(video.id)));
    Object.values(app().loadVault()).forEach(entry => {
      if (!entry) return;
      if (entry.demoVideoId) ids.add(entry.demoVideoId);
      (entry.videos || []).forEach(video => ids.add(video.id)); // 直接加在宝典里的视频
    });
    return ids;
  }
  // 动作示范视频记在动作宝典里：vault[key].demoVideoId。动作库里没有的自定义动作，就靠它当示范。
  function vaultKeyFor(ex) { return app().findVaultKey(app().loadVault(), ex.name, ex.catalogId); }
  // start：示范从视频第几秒开始循环（取 3 秒）
  function setDemoVideo(ex, id, start = 0) {
    const vault = app().loadVault();
    const key = app().findVaultKey(vault, ex.name, ex.catalogId);
    if (!vault[key]) vault[key] = { name: String(ex.name || '').trim(), tips: ex.tips || '', catalogId: ex.catalogId || '', muscleGroup: ex.muscleGroup || '', updatedAt: '' };
    if (id) { vault[key].demoVideoId = id; vault[key].demoStart = start; } else { delete vault[key].demoVideoId; delete vault[key].demoStart; }
    app().saveVault(vault);
  }
  // ---------- 示范像动图：静音自动循环播放 3 秒 ----------
  const DEMO_SECONDS = 3;
  const demoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) video.play().catch(() => {}); else video.pause(); // 只播放屏幕上看得到的，省电
  }), { threshold: 0.2 }) : null;
  async function startDemoLoop(video, id, start) {
    const url = await videoUrl(id);
    if (!url) { video.closest('.video-thumb')?.classList.add('missing'); return; }
    video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'auto';
    let from = Math.max(0, Number(start) || 0);
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration)) from = Math.max(0, Math.min(from, video.duration - DEMO_SECONDS));
      video.currentTime = from;
    });
    video.addEventListener('timeupdate', () => { if (video.currentTime >= from + DEMO_SECONDS || video.currentTime < from - 0.3) video.currentTime = from; });
    video.addEventListener('ended', () => { video.currentTime = from; video.play().catch(() => {}); });
    video.src = url;
    if (demoObserver) demoObserver.observe(video); else video.play().catch(() => {});
  }
  // 删掉动作、清空草稿、删除训练后，没人引用的视频文件一并清掉，免得占手机空间
  let pruneTimer = 0;
  function schedulePrune() {
    clearTimeout(pruneTimer);
    pruneTimer = setTimeout(async () => {
      try {
        const keep = referencedIds();
        const ids = await allVideoIds();
        for (const id of ids) if (!keep.has(id) && !pendingIds.has(id)) { await deleteVideo(id); forgetUrl(id); }
      } catch (error) {}
    }, 1500);
  }

  // ---------- 小工具 ----------
  const formatSize = bytes => bytes >= 1048576 ? (bytes / 1048576).toFixed(bytes >= 104857600 ? 0 : 1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  const localDay = time => { const d = new Date(time); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const clock = time => { const d = new Date(time); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
  function thumbsHtml(videos, withDate) {
    return videos.map(({ video, date }) => '<button type="button" class="video-thumb" data-video-id="' + escapeHtml(video.id) + '" aria-label="' + L('播放动作视频', 'Play video') + '"><video muted playsinline preload="metadata"></video><span class="video-thumb-time">' + escapeHtml((withDate && date ? date.slice(5) + ' ' : '') + clock(video.createdAt)) + '</span><span class="video-thumb-play" aria-hidden="true">▶</span></button>').join('');
  }
  // 缩略图：读出视频后跳到 0.1 秒，iOS 才会显示第一帧
  function hydrateThumbs(root) {
    root.querySelectorAll('.video-thumb').forEach(async thumb => {
      const url = await videoUrl(thumb.dataset.videoId);
      const video = thumb.querySelector('video');
      if (!url) { thumb.classList.add('missing'); thumb.title = L('这段视频不在这台设备上', 'This video is not on this device'); return; }
      if (video && !video.src) video.src = url + '#t=0.1';
    });
    root.querySelectorAll('.video-thumb').forEach(thumb => { thumb.onclick = () => openPlayer(thumb.dataset.videoId); });
  }

  // ---------- 动作卡片：录 / 选视频 ----------
  function addVideoRows() {
    const state = app().getState();
    document.querySelectorAll('#exerciseList [data-exercise]').forEach(card => {
      const ex = state.current.exercises.find(item => item.id === card.dataset.exercise);
      if (!ex) return;
      const videos = (ex.videos || []).map(video => ({ video, date: state.current.date }));
      const row = document.createElement('div');
      row.className = 'video-row';
      // 不加 capture：iPhone 会弹出「拍摄视频 / 照片图库 / 选取文件」，既能现场拍，也能选朋友帮忙拍的
      row.innerHTML = '<label class="video-add">' + icon('video') + '<span>' + L('录动作视频', 'Record form video') + '</span><input type="file" accept="video/*" hidden></label>' + (videos.length ? '<div class="video-clips">' + thumbsHtml(videos, false) + '</div>' : '');
      row.querySelector('input').addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (file) saveClip(ex, file);
      });
      card.appendChild(row);
      hydrateThumbs(row);
    });
    schedulePrune();
  }
  async function saveClip(ex, file) {
    if (file.size > 500 * 1048576 && !window.confirm(L('这段视频有 ' + formatSize(file.size) + '，会占用较多手机空间。仍然保存吗？', 'This video is ' + formatSize(file.size) + ' and takes a lot of space. Save anyway?'))) return;
    const id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    pendingIds.add(id);
    showToast(L('正在保存视频…', 'Saving video…'));
    try {
      await putVideo({ id, blob: file, createdAt: Date.now(), type: file.type || 'video/mp4' });
      ex.videos = [...(ex.videos || []), { id, createdAt: Date.now(), size: file.size, type: file.type || 'video/mp4' }];
      saveState();
      // 动作库里没有的自定义动作：第一段视频自动设为动作示范
      const autoDemo = !ex.catalogId && String(ex.name || '').trim() && !app().loadVault()[vaultKeyFor(ex)]?.demoVideoId;
      if (autoDemo) setDemoVideo(ex, id);
      render();
      showToast(autoDemo ? L('视频已保存，并设为「' + ex.name + '」的动作示范', 'Saved and set as the demo for “' + ex.name + '”') : L('视频已保存在本机（' + formatSize(file.size) + '）', 'Video saved on this device (' + formatSize(file.size) + ')'));
    } catch (error) {
      showToast(L('保存失败：手机空间可能不够了，删掉一些旧视频再试', 'Could not save — storage may be full. Delete old videos and try again.'));
    } finally {
      pendingIds.delete(id);
    }
  }

  // ---------- 播放器 ----------
  document.body.insertAdjacentHTML('beforeend', '<dialog class="extra-dialog video-dialog" id="videoDialog"><header class="extra-header"><h2 id="videoDialogTitle">' + L('动作视频', 'Form video') + '</h2><button class="extra-close" id="closeVideo" aria-label="' + L('关闭', 'Close') + '">×</button></header><div class="video-player-wrap"><video id="videoPlayer" controls playsinline></video></div><div class="video-speed" role="group" aria-label="' + L('播放速度', 'Playback speed') + '"><button type="button" data-speed="0.25">0.25×</button><button type="button" data-speed="0.5">0.5×</button><button type="button" data-speed="1" class="active">1×</button></div><div class="video-actions"><button type="button" class="extra-secondary" id="shareVideo">' + icon('share') + ' ' + L('保存 / 分享', 'Save / share') + '</button><button type="button" class="extra-secondary" id="demoVideo"></button><button type="button" class="extra-secondary video-delete" id="deleteVideo">' + L('删除视频', 'Delete video') + '</button></div><p class="video-note">' + L('视频只存在这台手机的 App 里，不包含在「导出备份」中；想长期保留请点「保存 / 分享」存到相册。', 'Videos stay in this app on this phone and are not in “Export backup”. Use “Save / share” to keep a copy in Photos.') + '</p></dialog>');
  const dialog = $('videoDialog'), player = $('videoPlayer');
  let playingId = '', playingExercise = null;
  player.addEventListener('timeupdate', () => { if (dialog.open) paintDemoButton(); });
  player.addEventListener('seeked', () => { if (dialog.open) paintDemoButton(); });
  function paintDemoButton() {
    const button = $('demoVideo');
    button.hidden = !playingExercise;
    if (!playingExercise) return;
    const entry = app().loadVault()[vaultKeyFor(playingExercise)];
    const isDemo = entry?.demoVideoId === playingId;
    const sameStart = isDemo && Math.abs((Number(entry.demoStart) || 0) - demoStartFromPlayer()) < 0.5;
    button.innerHTML = sameStart ? '✓ ' + L('已是示范 · 点击取消', 'Demo · tap to remove') : isDemo ? L('从这里开始取 3 秒', 'Start demo here') : L('设为动作示范', 'Set as demo');
    button.classList.toggle('is-demo', sameStart);
  }
  // 示范从播放器当前画面开始取 3 秒；离结尾不到 3 秒就往前挪
  function demoStartFromPlayer() {
    const time = player.currentTime || 0, duration = Number.isFinite(player.duration) ? player.duration : 0;
    return Math.round(Math.max(0, duration ? Math.min(time, duration - DEMO_SECONDS) : time) * 10) / 10;
  }
  $('closeVideo').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { player.pause(); player.removeAttribute('src'); player.load(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  dialog.querySelectorAll('[data-speed]').forEach(button => button.onclick = () => {
    player.playbackRate = Number(button.dataset.speed);
    dialog.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', b === button));
  });
  function findVideo(id) {
    for (const { ex, date } of allExercises()) {
      const video = (ex.videos || []).find(v => v.id === id);
      if (video) return { ex, video, date };
    }
    const entry = Object.values(app().loadVault()).find(item => item.demoVideoId === id || (item.videos || []).some(v => v.id === id));
    if (!entry) return null;
    const video = (entry.videos || []).find(v => v.id === id) || { id, createdAt: Date.now() };
    return { ex: { name: entry.name, catalogId: entry.catalogId }, video, date: localDay(video.createdAt) };
  }
  async function openPlayer(id) {
    const url = await videoUrl(id);
    if (!url) { showToast(L('这段视频不在这台设备上', 'This video is not on this device')); return; }
    const found = findVideo(id);
    playingId = id;
    $('videoDialogTitle').textContent = found ? found.ex.name + ' · ' + (found.date ? found.date.slice(5) + ' ' : '') + clock(found.video.createdAt) : L('动作视频', 'Form video');
    playingExercise = found ? found.ex : null;
    paintDemoButton();
    player.src = url;
    player.playbackRate = 1;
    dialog.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', b.dataset.speed === '1'));
    if (!dialog.open) dialog.showModal();
    player.play().catch(() => {});
  }
  // iPhone 的分享面板里有「存储视频」，可以存进相册，也能直接发给教练
  $('shareVideo').onclick = async () => {
    const record = await getVideo(playingId).catch(() => null);
    if (!record) return;
    const ext = (record.type || '').includes('quicktime') ? 'mov' : 'mp4';
    const file = new File([record.blob], 'workout-video.' + ext, { type: record.type || 'video/mp4' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); } catch (error) { if (error.name !== 'AbortError') showToast(L('分享失败，请稍后再试', 'Could not share — try again')); }
      return;
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('demoVideo').onclick = () => {
    if (!playingExercise) return;
    const entry = app().loadVault()[vaultKeyFor(playingExercise)];
    const start = demoStartFromPlayer();
    const remove = entry?.demoVideoId === playingId && Math.abs((Number(entry.demoStart) || 0) - start) < 0.5;
    setDemoVideo(playingExercise, remove ? '' : playingId, start);
    paintDemoButton();
    if ($('vaultModal')?.open && window.renderVaultList) window.renderVaultList();
    showToast(remove ? L('已取消动作示范', 'Demo removed') : L('已设为动作示范：从 ' + start.toFixed(1) + ' 秒起循环 3 秒', 'Demo set: loops 3 s from ' + start.toFixed(1) + ' s'));
  };
  $('deleteVideo').onclick = async () => {
    if (!playingId || !window.confirm(L('删除这段动作视频？删除后无法恢复。', 'Delete this video? This can’t be undone.'))) return;
    const id = playingId;
    allExercises().forEach(({ ex }) => { if (ex.videos) ex.videos = ex.videos.filter(v => v.id !== id); });
    saveState();
    const vault = app().loadVault();
    if (Object.values(vault).some(entry => entry.demoVideoId === id || (entry.videos || []).some(v => v.id === id))) {
      Object.values(vault).forEach(entry => {
        if (entry.demoVideoId === id) delete entry.demoVideoId;
        if (entry.videos) entry.videos = entry.videos.filter(v => v.id !== id);
      });
      app().saveVault(vault);
    }
    await deleteVideo(id).catch(() => {});
    forgetUrl(id);
    dialog.close();
    render();
    if ($('vaultModal')?.open && window.renderVaultList) window.renderVaultList();
    showToast(L('视频已删除', 'Video deleted'));
  };

  // ---------- 动作宝典：按动作看历次视频 ----------
  // 宝典「编辑」里直接添加视频：不用先在训练里录，从相册选或现场拍都行
  function addVaultUpload(card, key) {
    const area = card.querySelector('.vault-tip-edit-area');
    if (!area || area.querySelector('.vault-video-add')) return;
    const label = document.createElement('label');
    label.className = 'video-add vault-video-add';
    label.innerHTML = icon('video') + '<span>' + L('添加动作视频', 'Add a video') + '</span><input type="file" accept="video/*" hidden>';
    area.querySelector('.vault-edit-actions').before(label);
    label.querySelector('input').addEventListener('change', async event => {
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) return;
      if (file.size > 500 * 1048576 && !window.confirm(L('这段视频有 ' + formatSize(file.size) + '，会占用较多手机空间。仍然保存吗？', 'This video is ' + formatSize(file.size) + ' and takes a lot of space. Save anyway?'))) return;
      // 记下正在编辑的名字和要领：保存视频后列表会重绘，再把它们填回去
      const draftName = card.querySelector('.vault-edit-name')?.value, draftTips = card.querySelector('.vault-edit-textarea')?.value;
      const id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      pendingIds.add(id);
      showToast(L('正在保存视频…', 'Saving video…'));
      try {
        await putVideo({ id, blob: file, createdAt: Date.now(), type: file.type || 'video/mp4' });
        const vault = app().loadVault();
        if (!vault[key]) return;
        vault[key].videos = [...(vault[key].videos || []), { id, createdAt: Date.now(), size: file.size, type: file.type || 'video/mp4' }];
        const firstDemo = !vault[key].demoVideoId;
        if (firstDemo) { vault[key].demoVideoId = id; vault[key].demoStart = 0; }
        app().saveVault(vault);
        if (window.renderVaultList) window.renderVaultList();
        const fresh = document.querySelector('#vaultList .vault-card[data-vault-key="' + CSS.escape(key) + '"]');
        if (fresh) {
          fresh.querySelector('[data-action="edit-tip"]')?.click();
          if (draftName !== undefined) fresh.querySelector('.vault-edit-name').value = draftName;
          if (draftTips !== undefined) fresh.querySelector('.vault-edit-textarea').value = draftTips;
          fresh.scrollIntoView({ block: 'nearest' });
        }
        showToast(firstDemo ? L('视频已添加，并设为动作示范', 'Video added and set as the demo') : L('视频已添加（' + formatSize(file.size) + '）', 'Video added (' + formatSize(file.size) + ')'));
      } catch (error) {
        showToast(L('保存失败：手机空间可能不够了，删掉一些旧视频再试', 'Could not save — storage may be full. Delete old videos and try again.'));
      } finally {
        pendingIds.delete(id);
      }
    });
  }
  window.onVaultListRendered = list => {
    const vault = app().loadVault();
    const clean = app().cleanName;
    const exercises = allExercises();
    list.querySelectorAll('.vault-card').forEach(card => {
      const entry = vault[card.dataset.vaultKey];
      if (!entry) return;
      if (entry.demoVideoId) {
        const media = card.querySelector('.vault-media-wrap');
        if (media) {
          const demo = document.createElement('button');
          demo.type = 'button';
          demo.className = 'video-thumb vault-demo';
          demo.dataset.videoId = entry.demoVideoId;
          demo.setAttribute('aria-label', L('播放动作示范', 'Play demo video'));
          demo.innerHTML = '<video muted playsinline></video><span class="video-thumb-time">' + L('示范', 'Demo') + '</span>';
          media.replaceWith(demo);
          demo.onclick = () => openPlayer(entry.demoVideoId);
          startDemoLoop(demo.querySelector('video'), entry.demoVideoId, entry.demoStart);
        }
      }
      addVaultUpload(card, card.dataset.vaultKey);
      const clips = (entry.videos || []).map(video => ({ video, date: localDay(video.createdAt) }));
      exercises.forEach(({ ex, date }) => {
        if (!(ex.videos || []).length) return;
        if (clean(ex.name) === card.dataset.vaultKey || (entry.catalogId && ex.catalogId === entry.catalogId)) ex.videos.forEach(video => clips.push({ video, date }));
      });
      if (!clips.length) return;
      clips.sort((a, b) => b.video.createdAt - a.video.createdAt);
      const box = document.createElement('div');
      box.className = 'vault-videos';
      box.innerHTML = '<div class="vault-videos-head">' + icon('video') + ' ' + L('动作视频', 'Form videos') + ' · ' + clips.length + '</div><div class="video-clips">' + thumbsHtml(clips.slice(0, 8), true) + '</div>';
      card.querySelector('.vault-tip-box')?.after(box);
      hydrateThumbs(box);
    });
  };

  const previousRenderExercises = renderExercises;
  renderExercises = function () { previousRenderExercises(); addVideoRows(); };
  render();
})();

// 训练历史复用：
//  1. 以前练过的动作，加进来时按上一次的重量次数填好（不打勾），只改重量就行
//  2. 练同样部位时，在「动作记录」上方提示上次那次训练，一键带入整套动作
//  3. 每个动作练过几次：动作卡片和动作宝典里都显示
(() => {
  'use strict';
  const app = () => window.workoutApp;
  const muscles = () => window.workoutMuscles;
  const clean = text => app().cleanName(text);
  const named = ex => String(ex.name || '').trim();
  // 同一个动作：动作库 id 相同，或名字相同
  const same = (a, b) => Boolean((a.catalogId && b.catalogId && a.catalogId === b.catalogId) || (named(a) && clean(a.name) === clean(b.name)));
  const shortDate = date => date ? String(date).slice(5).replace('-', '/') : '';
  const filledSets = sets => (sets || []).filter(set => String(set.weight || '').trim() || String(set.reps || '').trim());
  const setsText = sets => filledSets(sets).map(set => (set.weight || '—') + '×' + (set.reps || '—')).join('、');
  const copySets = sets => { const list = filledSets(sets).map(set => ({ weight: String(set.weight || ''), reps: String(set.reps || ''), done: false })); return list.length ? list : [{ weight: '', reps: '', done: false }]; };
  const isBlank = ex => (ex.sets || []).every(set => !String(set.weight || '').trim() && !String(set.reps || '').trim() && !set.done);

  // 这个动作在已保存训练里出现过的记录，从新到旧（训练本来就按日期从新到旧排）
  function history(ex) {
    if (!named(ex)) return [];
    const out = [];
    app().getState().sessions.forEach(session => {
      const hit = (session.exercises || []).find(item => same(item, ex));
      if (hit) out.push({ session, ex: hit });
    });
    return out;
  }
  function groupsOf(list) {
    const found = new Set();
    list.forEach(ex => muscles().exerciseGroups(ex).forEach(group => found.add(group)));
    return [...found];
  }
  const groupsText = groups => groups.map(muscles().groupLabel).join(' · ') || L('训练', 'Session');

  // 刚加进来、组数还空着的动作：按上一次的重量次数填好（不打勾）。每个动作只自动填一次，之后你清空了也不会再填。
  function prefill() {
    let changed = false;
    app().getState().current.exercises.forEach(ex => {
      if (ex.prefillDone || !isBlank(ex)) return;
      const last = history(ex)[0];
      if (!last || !filledSets(last.ex.sets).length) return;
      ex.sets = copySets(last.ex.sets);
      ex.prefillDone = true;
      ex.prefilledFrom = last.session.date || '';
      changed = true;
    });
    return changed;
  }

  // 把以前训练里的动作带进本次草稿（已经有的跳过）
  function addFromHistory(list, date) {
    const state = app().getState();
    const vault = app().loadVault();
    let added = 0;
    list.forEach(item => {
      if (!named(item) || state.current.exercises.some(ex => same(ex, item))) return;
      const key = app().findVaultKey(vault, item.name, item.catalogId);
      const ex = { ...app().blankExercise(), name: item.name, tips: vault[key]?.tips || item.tips || '', muscles: item.muscles || '', muscleGroup: item.muscleGroup || '', sets: copySets(item.sets), prefillDone: true, prefilledFrom: date || '' };
      if (item.catalogId) ex.catalogId = item.catalogId;
      state.current.exercises.push(ex);
      added++;
    });
    if (!added) return;
    saveState();
    render();
    showToast(L('已带入 ' + added + ' 个动作，重量次数照上次填好，改一下就能开练', 'Added ' + added + ' exercise(s) with last time’s weights and reps'));
  }

  // ---------- 动作记录上方的提示条 ----------
  function paintRepeat() {
    let box = $('repeatSuggest');
    if (!box) {
      box = document.createElement('div');
      box.id = 'repeatSuggest';
      box.className = 'repeat-box';
      $('exerciseList').before(box);
    }
    const state = app().getState();
    const current = state.current.exercises.filter(named);
    const sessions = state.sessions || [];
    const hide = () => { box.hidden = true; box.innerHTML = ''; };
    if (!sessions.length || state.current.repeatDismissed) return hide();
    const head = text => '<div class="repeat-head"><span>' + text + '</span><button type="button" class="repeat-close" aria-label="' + L('不用了', 'Dismiss') + '">×</button></div>';
    if (!current.length) {
      // 草稿是空的：列出最近几次「不同部位组合」的训练，点一下整套带入
      const seen = new Set(), picks = [];
      for (const session of sessions) {
        const groups = groupsOf(session.exercises || []);
        const id = groups.slice().sort().join(',');
        if (!groups.length || seen.has(id)) continue;
        seen.add(id); picks.push({ session, groups });
        if (picks.length === 3) break;
      }
      if (!picks.length) return hide();
      box.innerHTML = head(L('照上次练，一键带入：', 'Repeat a past session:')) + '<div class="repeat-list">' + picks.map((pick, index) => '<button type="button" class="repeat-item" data-pick="' + index + '"><strong>' + escapeHtml(groupsText(pick.groups)) + '</strong><span>' + escapeHtml(shortDate(pick.session.date) + ' · ' + (pick.session.exercises || []).filter(named).map(ex => ex.name).join('、')) + '</span></button>').join('') + '</div>';
      box.querySelectorAll('[data-pick]').forEach(button => button.onclick = () => { const pick = picks[Number(button.dataset.pick)]; addFromHistory(pick.session.exercises || [], pick.session.date); });
    } else {
      // 已经开始练了：找上次练同样部位的那次训练，提示还做过哪些动作
      const groups = groupsOf(current);
      const session = sessions.find(item => (item.exercises || []).some(ex => muscles().exerciseGroups(ex).some(group => groups.includes(group))));
      const missing = session ? (session.exercises || []).filter(ex => named(ex) && !current.some(cur => same(cur, ex))) : [];
      if (!missing.length) return hide();
      box.innerHTML = head(L('上次练 ' + groupsText(groupsOf(session.exercises || [])) + '（' + shortDate(session.date) + '）还做了：', 'Last ' + groupsText(groupsOf(session.exercises || [])) + ' session (' + shortDate(session.date) + ') also had:')) +
        '<div class="repeat-chips">' + missing.map((ex, index) => '<button type="button" class="repeat-chip" data-miss="' + index + '">＋ ' + escapeHtml(ex.name) + '</button>').join('') + (missing.length > 1 ? '<button type="button" class="repeat-chip repeat-all" data-all>' + L('全部加上', 'Add all') + '</button>' : '') + '</div>';
      box.querySelectorAll('[data-miss]').forEach(button => button.onclick = () => addFromHistory([missing[Number(button.dataset.miss)]], session.date));
      box.querySelector('[data-all]')?.addEventListener('click', () => addFromHistory(missing, session.date));
    }
    box.hidden = false;
    box.querySelector('.repeat-close').onclick = () => { state.current.repeatDismissed = true; saveState(); hide(); };
  }

  // ---------- 动作卡片：练过几次 + 上次的重量次数 ----------
  function paintCards() {
    const state = app().getState();
    document.querySelectorAll('#exerciseList [data-exercise]').forEach(card => {
      const ex = state.current.exercises.find(item => item.id === card.dataset.exercise);
      if (!ex) return;
      const past = history(ex);
      if (!past.length) return;
      const last = past[0];
      const line = document.createElement('div');
      line.className = 'exercise-last';
      line.innerHTML = '<span class="exercise-count">' + L('已练 ' + past.length + ' 次', past.length + (past.length === 1 ? ' time' : ' times')) + '</span><span>' + escapeHtml(L('上次 ' + shortDate(last.session.date), 'Last ' + shortDate(last.session.date)) + (setsText(last.ex.sets) ? '：' + setsText(last.ex.sets) : '')) + '</span>' + (ex.prefilledFrom ? '<span class="exercise-prefilled">' + L('已按上次填好', 'Prefilled') + '</span>' : '');
      card.querySelector('.exercise-head').after(line);
    });
  }

  // ---------- 动作宝典：练过几次 ----------
  const previousVaultHook = window.onVaultListRendered;
  window.onVaultListRendered = list => {
    if (previousVaultHook) previousVaultHook(list);
    const vault = app().loadVault();
    list.querySelectorAll('.vault-card').forEach(card => {
      const entry = vault[card.dataset.vaultKey];
      const footer = card.querySelector('.vault-card-footer span');
      if (!entry || !footer) return;
      const count = history({ name: entry.name, catalogId: entry.catalogId }).length;
      if (count) footer.insertAdjacentHTML('afterbegin', '<span class="vault-count">' + L('练过 ' + count + ' 次', count + (count === 1 ? ' time' : ' times')) + '</span> · ');
    });
  };

  const previousRenderExercises = renderExercises;
  renderExercises = function () {
    if (prefill()) saveState();
    previousRenderExercises();
    paintCards();
    paintRepeat();
  };
  render();
})();

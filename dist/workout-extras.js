(() => {
  'use strict';
  const app = () => window.workoutApp;
  const catalog = window.WORKOUT_CATALOG || [];
  const body = window.WORKOUT_BODY || {};
  const groupsZh = {chest:'胸',back:'背',legs:'腿',glutes:'臀',shoulders:'肩',biceps:'二头',triceps:'三头',core:'腹部',calves:'小腿',forearms:'前臂'};
  const groupsEn = {chest:'Chest',back:'Back',legs:'Legs',glutes:'Glutes',shoulders:'Shoulders',biceps:'Biceps',triceps:'Triceps',core:'Core',calves:'Calves',forearms:'Forearms'};
  // 肌群名称按当前语言模式显示（对照模式「胸 Chest」）
  const groups = Object.fromEntries(Object.keys(groupsZh).map(key => [key, I18N.term(groupsZh[key], groupsEn[key])]));
  const muscleGroups = {
    'chest':'chest','pectorals':'chest','serratus anterior':'chest',
    'back':'back','lats':'back','upper back':'back','middle back':'back','lower back':'back','traps':'back','spine':'back',
    'legs':'legs','quadriceps':'legs','quads':'legs','hamstrings':'legs','adductors':'legs',
    'glutes':'glutes','abductors':'glutes',
    'shoulders':'shoulders','delts':'shoulders','levator scapulae':'shoulders',
    'biceps':'biceps','triceps':'triceps','arms':'biceps',
    'core':'core','abdominals':'core','abs':'core','waist':'core',
    'calves':'calves',
    'forearms':'forearms'
  };
  const equipmentZh = {'barbell':'杠铃','dumbbell':'哑铃','cable':'绳索','leverage machine':'器械','smith machine':'史密斯机','body weight':'自重','kettlebell':'壶铃','band':'弹力带','ez barbell':'曲杆','wheel roller':'健腹轮','trap bar':'六角杠铃','rope':'战绳/绳索','assisted':'辅助器械','medicine ball':'药球/健身球'};
  const equipmentEn = {'barbell':'Barbell','dumbbell':'Dumbbell','cable':'Cable','leverage machine':'Machine','smith machine':'Smith machine','body weight':'Body weight','kettlebell':'Kettlebell','band':'Band','ez barbell':'EZ bar','wheel roller':'Ab wheel','trap bar':'Trap bar','rope':'Rope','assisted':'Assisted','medicine ball':'Medicine ball'};
  const equipment = Object.fromEntries(Object.keys(equipmentZh).map(key => [key, I18N.term(equipmentZh[key], equipmentEn[key])]));
  const aliases = {'高位下拉':'0150','宽握高位下拉':'0200','坐姿划船':'0861','坐姿绳索划船':'0861','杠铃卧推':'0025','杠铃深蹲':'0043','杠铃硬拉':'0032','引体向上':'0652','俯卧撑':'0662','罗马尼亚硬拉':'0085'};
  const clean = text => String(text || '').trim().toLowerCase().replace(/\s+/g,'');
  const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/';
  function matchExercise(ex) {
    return catalog.find(item => item.id === ex.catalogId) || catalog.find(item => clean(item.zh) === clean(ex.name) || clean(item.name) === clean(ex.name) || item.id === aliases[ex.name]);
  }
  // ---------- 细分肌肉 ----------
  // 每块肌肉：中英文名、所属大肌群（宝典分类、动作库筛选用）、选择器里的分区、在人体图上对应的部位。
  // parts: [视图, 部位 slug, 路径下标（省略 = 整块）, 裁切（'upper' / 'lower' 只点亮上半或下半）]
  // 人体图里肩、臀本来就分成前后 / 上下几块路径；胸只有一整块，按高度切成上胸和中下胸。
  const MUSCLES = {
    upper_chest: { zh:'上胸', en:'Upper chest', group:'chest', area:'chest', parts:[['front','chest',null,'upper']] },
    mid_chest:   { zh:'中下胸', en:'Mid/lower chest', group:'chest', area:'chest', parts:[['front','chest',null,'lower']] },
    front_delt:  { zh:'前束', en:'Front delt', group:'shoulders', area:'shoulders', parts:[['front','deltoids',[1,3]]] },
    side_delt:   { zh:'中束', en:'Side delt', group:'shoulders', area:'shoulders', parts:[['front','deltoids',[0,2]]] },
    rear_delt:   { zh:'后束', en:'Rear delt', group:'shoulders', area:'shoulders', parts:[['back','deltoids']] },
    lats:        { zh:'背阔肌', en:'Lats', group:'back', area:'back', parts:[['back','upper-back']] },
    traps:       { zh:'斜方肌', en:'Traps', group:'back', area:'back', parts:[['front','trapezius'],['back','trapezius']] },
    lower_back:  { zh:'下背', en:'Lower back', group:'back', area:'back', parts:[['back','lower-back']] },
    biceps:      { zh:'二头', en:'Biceps', group:'biceps', area:'arms', parts:[['front','biceps']] },
    triceps:     { zh:'三头', en:'Triceps', group:'triceps', area:'arms', parts:[['front','triceps'],['back','triceps']] },
    forearms:    { zh:'前臂', en:'Forearms', group:'forearms', area:'arms', parts:[['front','forearm'],['back','forearm']] },
    abs:         { zh:'腹肌', en:'Abs', group:'core', area:'core', parts:[['front','abs']] },
    obliques:    { zh:'腹斜肌', en:'Obliques', group:'core', area:'core', parts:[['front','obliques']] },
    glute_med:   { zh:'臀中肌', en:'Glute med', group:'glutes', area:'glutes', parts:[['back','gluteal',[0,3]]] },
    glute_max:   { zh:'臀大肌', en:'Glute max', group:'glutes', area:'glutes', parts:[['back','gluteal',[1,2]]] },
    quads:       { zh:'股四头', en:'Quads', group:'legs', area:'legs', parts:[['front','quadriceps']] },
    hamstrings:  { zh:'腘绳肌', en:'Hamstrings', group:'legs', area:'legs', parts:[['back','hamstring']] },
    adductors:   { zh:'内收肌', en:'Adductors', group:'legs', area:'legs', parts:[['front','adductors'],['back','adductors']] },
    calves:      { zh:'小腿', en:'Calves', group:'calves', area:'legs', parts:[['front','calves'],['front','tibialis'],['back','calves']] }
  };
  const AREAS = [['chest','胸','Chest'],['shoulders','肩','Shoulders'],['back','背','Back'],['arms','手臂','Arms'],['core','核心','Core'],['glutes','臀','Glutes'],['legs','腿','Legs']];
  const CHEST_SPLIT_Y = 362; // 人体图里胸肌路径的 y 范围约 319–433，上面约 40% 算上胸
  const GROUP_DEFAULT = { chest:['mid_chest'], back:['lats'], legs:['quads','hamstrings'], glutes:['glute_max'], shoulders:['side_delt'], biceps:['biceps'], triceps:['triceps'], core:['abs'], calves:['calves'], forearms:['forearms'] };
  const muscleName = key => I18N.term(MUSCLES[key].zh, MUSCLES[key].en);
  const parseMuscles = value => String(value || '').split(',').map(key => key.trim()).filter(key => MUSCLES[key]);
  const parseGroups = value => String(value || '').split(',').map(key => key.trim()).filter(key => groupsZh[key]);
  const uniqueGroups = keys => keys.map(key => MUSCLES[key].group).filter((group, index, list) => list.indexOf(group) === index);
  // 按动作库的目标肌和动作名推断具体练到哪几块肌肉
  function autoMuscles(m) {
    if (!m) return [];
    const name = m.name.toLowerCase(), out = [];
    const add = (...keys) => keys.forEach(key => { if (MUSCLES[key] && !out.includes(key)) out.push(key); });
    const has = re => re.test(name);
    switch (m.target) {
      case 'pectorals': add(has(/incline/) ? 'upper_chest' : 'mid_chest'); break;
      case 'serratus anterior': add('mid_chest'); break;
      case 'delts':
        if (has(/rear|reverse fly|face pull|y raise/)) add('rear_delt');
        else if (has(/lateral|side raise|upright row/)) add('side_delt');
        else if (has(/front raise|front plate/)) add('front_delt');
        else if (has(/press|arnold|military|push/)) add('front_delt', 'side_delt');
        else add('side_delt');
        break;
      case 'lats': add('lats'); break;
      case 'upper back': add('lats'); if (has(/shrug|face pull|high row|upright/)) add('traps'); break;
      case 'traps': case 'levator scapulae': add('traps'); break;
      case 'spine': add('lower_back'); break;
      case 'biceps': add('biceps'); if (has(/hammer|reverse|zottman/)) add('forearms'); break;
      case 'triceps': add('triceps'); break;
      case 'forearms': add('forearms'); break;
      case 'abs': add(has(/twist|oblique|side|russian|wood ?chop|windshield|rotation/) ? 'obliques' : 'abs'); break;
      case 'abductors': add('glute_med'); break;
      case 'adductors': add('adductors'); break;
      case 'quads': add('quads'); break;
      case 'hamstrings': add('hamstrings'); break;
      case 'calves': add('calves'); break;
      case 'glutes': add(has(/abduct|clam|side lying|lateral walk|fire hydrant|side kick|side step/) ? 'glute_med' : 'glute_max'); break;
    }
    // 下肢复合动作：除了目标肌，同时发力的主要肌肉也算上
    if (has(/squat|lunge|leg press|split|step-up|step up|hack|pistol/)) add('quads', 'glute_max');
    if (has(/deadlift|good morning|romanian|stiff.leg/)) add('hamstrings', 'glute_max');
    if (has(/sumo/)) add('adductors');
    if (has(/^barbell deadlift$/)) add('lower_back');
    if (!out.length && GROUP_DEFAULT[m.group]) add(...GROUP_DEFAULT[m.group]);
    return out;
  }
  const catalogGroups = m => uniqueGroups(autoMuscles(m));
  // 动作练到的肌肉：自己选过的优先；旧数据只记了大肌群（如「腿,臀」），就在该肌群里取自动识别的那几块
  function exerciseMuscleKeys(ex) {
    const own = parseMuscles(ex.muscles);
    if (own.length) return own;
    const auto = autoMuscles(matchExercise(ex));
    const legacy = parseGroups(ex.muscleGroup);
    if (!legacy.length) return auto;
    const out = [];
    legacy.forEach(group => {
      const inGroup = auto.filter(key => MUSCLES[key].group === group);
      (inGroup.length ? inGroup : GROUP_DEFAULT[group] || []).forEach(key => { if (!out.includes(key)) out.push(key); });
    });
    return out;
  }
  const exerciseGroups = ex => uniqueGroups(exerciseMuscleKeys(ex));
  // 选了具体肌肉，同时更新大肌群字段，宝典分类和旧逻辑照常能用；全部取消就回到自动识别
  function setExerciseMuscles(ex, keys) {
    ex.muscles = keys.join(',');
    ex.muscleGroup = uniqueGroups(keys).join(',');
  }
  function muscleSummary(exercises) {
    const muscles = new Set(); let unknown = 0;
    exercises.forEach(ex => { const keys = exerciseMuscleKeys(ex); if (!keys.length) unknown++; keys.forEach(key => muscles.add(key)); });
    return { muscles, keys: Object.keys(MUSCLES).filter(key => muscles.has(key)), unknown };
  }
  // 肌肉选择器：按身体分区一行一行排，点一下选中，再点取消，可以多选
  function musclePicker(selected) {
    return AREAS.map(([area, zh, en]) => '<div class="muscle-area"><span class="muscle-area-name">' + escapeHtml(L(zh, en)) + '</span><div class="muscle-chips">' + Object.keys(MUSCLES).filter(key => MUSCLES[key].area === area).map(key => '<button type="button" class="muscle-chip' + (selected.includes(key) ? ' active' : '') + '" data-muscle="' + key + '" aria-pressed="' + selected.includes(key) + '">' + escapeHtml(muscleName(key)) + '</button>').join('') + '</div></div>').join('');
  }
  function bindMuscleChips(root, current, onChange) {
    root.querySelectorAll('.muscle-chip').forEach(chip => {
      chip.onclick = () => { const now = current(); const key = chip.dataset.muscle; onChange(now.includes(key) ? now.filter(k => k !== key) : [...now, key]); };
    });
  }
  const optionList = (values, label) => '<option value="">'+label+'</option>'+Object.entries(values).map(([key,value])=>'<option value="'+key+'">'+value+'</option>').join('');
  document.body.insertAdjacentHTML('beforeend', '<dialog class="extra-dialog" id="exerciseLibrary"><header class="extra-header"><h2>'+L('3D动作库','3D Exercise Library')+'</h2><button class="extra-close" id="closeLibrary" aria-label="'+L('关闭动作库','Close library')+'">×</button></header><div class="library-controls"><input id="librarySearch" type="search" placeholder="'+L('搜索动作，例如：卧推、深蹲、bench press','Search, e.g. bench press, squat, 卧推')+'" aria-label="'+L('搜索动作','Search exercises')+'"><div class="library-filters"><select id="libraryMuscle" aria-label="'+L('按肌群筛选','Filter by muscle')+'">'+optionList(groups,L('全部肌群','All muscles'))+'</select><select id="libraryEquipment" aria-label="'+L('按器械筛选','Filter by equipment')+'">'+optionList(equipment,L('全部器械','All equipment'))+'</select></div><p class="library-status" id="libraryStatus"></p><button class="extra-secondary" id="libraryCustom">'+L('＋ 自己填写动作','＋ Enter my own exercise')+'</button></div><div id="libraryList" class="library-list"></div><footer class="library-footer">'+L('动作库由 ','Exercise data from ')+'<a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">ExerciseDB (exercises-dataset)</a>'+L(' 提供，3D 白模动图版权归 ',' · 3D animations © ')+'<a href="https://gymvisual.com/" target="_blank" rel="noopener">Gym Visual</a>'+L(' 所有。','. ')+'<a href="OPEN-SOURCE-LICENSES.txt" target="_blank">'+L('开源许可','Open-source licenses')+'</a></footer></dialog><dialog class="extra-dialog" id="posterDialog"><header class="extra-header"><h2>'+L('训练打卡长图','Workout Poster')+'</h2><button class="extra-close" id="closePoster" aria-label="'+L('关闭打卡图','Close poster')+'">×</button></header><div class="poster-controls"><label>'+L('显示名称','Display name')+'<input id="posterName" maxlength="24" placeholder="'+L('我的训练','My Workout')+'"></label></div><img id="posterPreview" class="poster-preview" alt="'+L('训练打卡长图，包含肌群分布和动作明细','Workout poster with muscle map and exercise details')+'" title="'+L('点击可全屏放大','Tap to view full screen')+'"><p class="poster-hint">'+L('点一下图片可全屏放大查看','Tap the image to view full screen')+'</p><div class="poster-actions"><a class="extra-primary" id="downloadPoster" download="workout.png">'+L('保存图片','Save image')+'</a><button class="extra-secondary" id="sharePoster">'+L('分享图片','Share image')+'</button></div><p class="poster-note" id="posterNote"></p><div class="poster-zoom" id="posterZoom"><button class="poster-zoom-close" id="posterZoomClose" aria-label="'+L('关闭放大预览','Close preview')+'">×</button><img id="posterZoomImg" alt="'+L('训练打卡长图放大预览','Workout poster, full screen')+'"></div></dialog>');
  const library = $('exerciseLibrary'), poster = $('posterDialog');
  let libraryLimit = 20;
  function openLibrary() { libraryLimit = 20; $('librarySearch').value=''; $('libraryMuscle').value=''; $('libraryEquipment').value=''; renderLibrary(); library.showModal(); }
  window.openExerciseLibrary = openLibrary;
  $('closeLibrary').onclick=()=>library.close();
  $('closePoster').onclick=()=>poster.close();
  [library,poster].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}));
  const posterZoom = $('posterZoom');
  const openPosterZoom = () => { const source = $('posterPreview').src; if(!source) return; $('posterZoomImg').src = source; posterZoom.classList.add('show'); };
  $('posterPreview').addEventListener('click', openPosterZoom);
  $('posterZoomClose').addEventListener('click', () => posterZoom.classList.remove('show'));
  posterZoom.addEventListener('click', event => { if(event.target === posterZoom) posterZoom.classList.remove('show'); });
  poster.addEventListener('close', () => posterZoom.classList.remove('show'));
  $('libraryCustom').onclick=()=>{library.close();addCustomExercise();};
  for(const id of ['librarySearch','libraryMuscle','libraryEquipment'])$(id).addEventListener('input',()=>{ libraryLimit = 20; renderLibrary(); });
  // 用户在动作宝典里改过的中文名（按动作库 id），动作库里显示和加入训练时都用它
  function customZhNames() {
    const names = {};
    Object.values(app().loadVault ? app().loadVault() : {}).forEach(item => { if (item && item.catalogId && item.name) names[item.catalogId] = item.name; });
    return names;
  }
  const zhNameOf = (ex, names) => names[ex.id] || ex.zh;
  function renderLibrary() {
    const query=clean($('librarySearch').value), muscle=$('libraryMuscle').value, gear=$('libraryEquipment').value;
    const names = customZhNames();
    const list=catalog.filter(ex=>{
      const textMatch = !query || clean(ex.zh + ' ' + ex.name + ' ' + zhNameOf(ex, names)).includes(query);
      const muscleMatch = !muscle || ex.group === muscle || muscleGroups[ex.target] === muscle || (ex.primaryMuscles && ex.primaryMuscles.some(m => muscleGroups[m] === muscle));
      const equipMatch = !gear || ex.equipment === gear;
      return textMatch && muscleMatch && equipMatch;
    });
    $('libraryStatus').textContent = L(list.length + ' 个动作 · 默认轻量封面，点图片播放动图', list.length + ' exercises · tap an image to play the animation');
    const displayed = list.slice(0, libraryLimit);
    $('libraryList').innerHTML = displayed.length ? displayed.map(ex=>{
      const thumb = ex.img ? CDN_BASE + ex.img : (ex.gif ? CDN_BASE + ex.gif : '');
      const gif = ex.gif ? CDN_BASE + ex.gif : '';
      const label = groups[ex.group] || groups[muscleGroups[ex.target]] || I18N.term('主要部位','Main muscles');
      const eqText = equipment[ex.equipment] || ex.equipment || I18N.term('其他','Other');
      // 纯英文模式下英文名做标题、中文名做小字；其余模式反过来
      const zh = zhNameOf(ex, names);
      const [title, subtitle] = I18N.mode === 'en' ? [ex.name, zh] : [zh, ex.name];
      return '<article class="library-item">' +
        '<div class="library-media-wrap" data-gif="' + gif + '" data-thumb="' + thumb + '" title="' + L('点我播放/暂停动图','Tap to play/pause') + '">' +
          '<img src="' + thumb + '" alt="' + escapeHtml(title) + ' 3D" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
          (gif ? '<span class="gif-tag">' + L('▶ 动图','▶ GIF') + '</span>' : '') +
        '</div>' +
        '<strong>' + escapeHtml(title) + '</strong>' +
        '<span class="library-en">' + escapeHtml(subtitle) + '</span>' +
        '<span class="library-meta">' + escapeHtml(label) + ' · ' + escapeHtml(eqText) + '</span>' +
        '<button type="button" class="extra-primary" data-library-add="' + ex.id + '">' + L('加入训练','Add') + '</button>' +
      '</article>';
    }).join('') + (list.length > libraryLimit ? '<button type="button" class="library-load-more" id="loadMoreExercises">' + L('查看更多动作（还有 ' + (list.length - libraryLimit) + ' 个）', 'Show more (' + (list.length - libraryLimit) + ' left)') + '</button>' : '') : '<p class="library-status" style="grid-column:1/-1;text-align:center;padding:24px 0;">' + L('没有匹配动作，可以点击“自己填写动作”。','No match — tap “Enter my own exercise”.') + '</p>';
    $('libraryList').querySelectorAll('.library-media-wrap').forEach(wrap => {
      wrap.onclick = () => {
        const gif = wrap.dataset.gif;
        const img = wrap.querySelector('img');
        const tag = wrap.querySelector('.gif-tag');
        if (!gif || !img) return;
        if (img.src === gif) {
          img.src = wrap.dataset.thumb;
          if (tag) { tag.textContent = L('▶ 动图','▶ GIF'); tag.classList.remove('playing'); }
        } else {
          img.src = gif;
          if (tag) { tag.textContent = L('■ 动图中','■ Playing'); tag.classList.add('playing'); }
        }
      };
    });
    $('libraryList').querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.style.opacity='0.25';};});
    $('libraryList').querySelectorAll('[data-library-add]').forEach(button=>button.onclick=()=>{
      const ex=catalog.find(item=>item.id===button.dataset.libraryAdd);if(!ex)return;
      const vault = app().loadVault ? app().loadVault() : {};
      const zh = zhNameOf(ex, customZhNames());
      const key = app().findVaultKey(vault, zh, ex.id);
      const prevTips = vault[key]?.tips || '';
      const item={...app().blankExercise(),name:zh,catalogId:ex.id,muscleGroup:'',tips:prevTips};
      app().getState().current.exercises.push(item);saveState();library.close();render();
      showToast(prevTips ? L('已添加 ' + zh + '，已自动带出教学要领', 'Added ' + ex.name + ' with your saved cues') : L('已添加 ' + zh, 'Added ' + ex.name));
      const cards=document.querySelectorAll('[data-exercise]');cards[cards.length-1]?.scrollIntoView({block:'center',behavior:'smooth'});
    });
    const loadBtn = $('loadMoreExercises');
    if (loadBtn) loadBtn.onclick = () => { libraryLimit += 20; renderLibrary(); };
  }
  const openPickers = new Set(); // 展开着选择器的动作，卡片重绘后保持展开
  function addMuscleControls() {
    document.querySelectorAll('#exerciseList [data-exercise]').forEach(card=>{
      const ex=app().getState().current.exercises.find(item=>item.id===card.dataset.exercise);if(!ex)return;
      const row=document.createElement('div');row.className='muscle-edit';
      const paint=()=>{
        const keys=exerciseMuscleKeys(ex), open=openPickers.has(ex.id);
        const picked=parseMuscles(ex.muscles).length>0||parseGroups(ex.muscleGroup).length>0;
        row.innerHTML='<div class="muscle-edit-head"><span>'+L('训练部位','Muscles')+'</span><button type="button" class="muscle-toggle">'+(open?L('完成','Done'):L('修改','Edit'))+'</button></div>'+
          '<div class="muscle-summary'+(keys.length?'':' empty')+'">'+(keys.length?escapeHtml(keys.map(muscleName).join(' · '))+(picked?'':'<span class="muscle-auto">'+L('自动识别','auto')+'</span>'):escapeHtml(L('未识别，点「修改」选择练到的肌肉','Not recognized — tap Edit to pick muscles')))+'</div>'+
          (open?'<div class="muscle-picker">'+musclePicker(keys)+'</div>':'');
        row.querySelector('.muscle-toggle').onclick=()=>{if(open)openPickers.delete(ex.id);else openPickers.add(ex.id);paint();};
        bindMuscleChips(row,()=>exerciseMuscleKeys(ex),next=>{setExerciseMuscles(ex,next);saveState();paint();});
      };
      paint();card.appendChild(row);
      card.querySelector('[data-field="name"]').addEventListener('input',()=>{delete ex.catalogId;paint();});
    });
  }
  const originalExercises=renderExercises;
  renderExercises=function(){originalExercises();addMuscleControls();};
  const originalHistory=renderHistory;
  renderHistory=function(){originalHistory();document.querySelectorAll('#historyList [data-share-index]').forEach(button=>{
    const trigger=document.createElement('button');trigger.type='button';trigger.className='poster-trigger';trigger.textContent=L('生成打卡图','Poster');
    trigger.onclick=()=>openPoster(app().getState().sessions[Number(button.dataset.shareIndex)],false);
    button.parentElement.prepend(trigger);
  });};
  const posterButton=document.createElement('button');posterButton.type='button';posterButton.className='poster-trigger';posterButton.innerHTML=L('生成训练打卡图','Create workout poster');
  posterButton.style.cssText='width:100%;margin-bottom:24px';
  posterButton.onclick=()=>{syncMeta();const current=app().getState().current.exercises.length>0;openPoster(current?{...app().getState().current,volume:totalVolume()}:app().getState().sessions[0],current);};
  document.querySelector('.notes').after(posterButton);
  const shareImageButton=document.createElement('button');shareImageButton.type='button';shareImageButton.className='poster-trigger';shareImageButton.style.cssText='width:100%;margin-top:12px';shareImageButton.innerHTML=L('生成图片打卡','Create image check-in');
  $('previewCoachViewBtn').after(shareImageButton);
  shareImageButton.onclick=()=>{const session=app().getState().current.exercises.length?app().getState().current:app().getState().sessions[0];closeShareModal();openPoster(session,session===app().getState().current);};
  const muscleAdjust=document.createElement('details');muscleAdjust.className='poster-muscles';muscleAdjust.innerHTML='<summary>'+L('调整训练部位','Adjust muscles')+'</summary><div id="posterMuscleFields"></div>';$('posterName').parentElement.after(muscleAdjust);
  let posterSession=null, posterDraft=false, posterBlob=null, posterUrl=null, renderId=0;
  function openPoster(session,draft) {
    if(!session?.exercises?.length){showToast(L('先填写或保存一次训练','Fill in or save a session first'));return;}
    posterSession=JSON.parse(JSON.stringify(session));posterDraft=Boolean(draft);
    $('posterName').value=localStorage.getItem('workout-poster-name')||L('我的训练','My Workout');
    $('posterMuscleFields').innerHTML=posterSession.exercises.map((ex,index)=>'<div class="poster-muscle-field" data-poster-muscle="'+index+'"></div>').join('');
    $('posterMuscleFields').querySelectorAll('[data-poster-muscle]').forEach(field=>{
      const index=Number(field.dataset.posterMuscle), ex=posterSession.exercises[index];
      const paint=()=>{
        field.innerHTML='<span class="poster-muscle-name">'+escapeHtml(ex.name)+'</span><div class="muscle-picker">'+musclePicker(exerciseMuscleKeys(ex))+'</div>';
        bindMuscleChips(field,()=>exerciseMuscleKeys(ex),next=>{setExerciseMuscles(ex,next);setExerciseMuscles(session.exercises[index],next);saveState();paint();buildPoster();});
      };
      paint();
    });
    poster.showModal();buildPoster();
  }
  $('posterName').addEventListener('input',()=>{localStorage.setItem('workout-poster-name',$('posterName').value);buildPoster();});
  function drawFemaleBody(ctx,active,x,y,width,height,side) {
    const model = window.WORKOUT_FEMALE_BODY[side];
    // 这一面要点亮的部位：[slug, 路径下标或 null, 裁切或 null]
    const lit = [];
    active.forEach(key => (MUSCLES[key]?.parts || []).forEach(([view, slug, indices, clip]) => { if (view === side) lit.push([slug, indices || null, clip || null]); }));
    const [vx,vy,vw,vh] = model.viewBox;
    const scale = Math.min(width/vw,height/vh);
    ctx.save();
    ctx.translate(x+(width-vw*scale)/2,y+(height-vh*scale)/2);
    ctx.scale(scale,scale);ctx.translate(-vx,-vy);
    ctx.strokeStyle='#687079';ctx.lineWidth=2.4;
    ctx.fillStyle='#25282d';
    const outline = new Path2D(model.outline);
    ctx.fill(outline);ctx.stroke(outline);
    model.parts.forEach(part=>{
      if(part.slug==='hair'){
        // Restyle the source hair into a compact top bun; crop the ponytail.
        const cx=side==='front'?320:1142;
        ctx.save();ctx.beginPath();ctx.ellipse(cx,130,78,98,0,0,Math.PI*2);ctx.clip();
        ctx.fillStyle='#737b84';part.paths.forEach(path=>ctx.fill(new Path2D(path)));ctx.restore();
        ctx.fillStyle='#737b84';ctx.beginPath();ctx.ellipse(cx,30,31,35,-0.12,0,Math.PI*2);ctx.fill();
        return;
      }
      ctx.fillStyle=part.slug==='head'?'#343940':'#59616b';
      part.paths.forEach(path=>ctx.fill(new Path2D(path)));
      part.paths.forEach((path,index)=>{
        const hits=lit.filter(([slug,indices])=>slug===part.slug&&(!indices||indices.includes(index)));
        if(!hits.length)return;
        const clips=hits.map(hit=>hit[2]);
        ctx.fillStyle='#62d47c';
        if(clips.includes(null)||(clips.includes('upper')&&clips.includes('lower'))){ctx.fill(new Path2D(path));return;}
        ctx.save();ctx.beginPath();
        if(clips.includes('upper'))ctx.rect(vx,vy,vw,CHEST_SPLIT_Y-vy);else ctx.rect(vx,CHEST_SPLIT_Y,vw,vy+vh-CHEST_SPLIT_Y);
        ctx.clip();ctx.fill(new Path2D(path));ctx.restore();
      });
    });
    ctx.restore();
  }
  function drawLabeledBody(ctx,active,x,y,side) {
    const bx=x+65, by=y, bw=200, bh=430;
    drawFemaleBody(ctx,active,bx,by,bw,bh,side);
    const model=window.WORKOUT_FEMALE_BODY[side];
    const [vx,vy,vw,vh]=model.viewBox, scale=Math.min(bw/vw,bh/vh);
    const labels=side==='front'?[
      ['上胸','Upper chest',['upper_chest'],270,340,'left',87],
      ['中下胸','Mid/lower chest',['mid_chest'],265,395,'left',121],
      ['二头','Biceps',['biceps'],185,430,'left',174],
      ['腹肌','Abs',['abs','obliques'],290,540,'left',237],
      ['股四头','Quads',['quads'],245,810,'left',321],
      ['前束','Front delt',['front_delt'],425,325,'right',73],
      ['中束','Side delt',['side_delt'],453,355,'right',108],
      ['前臂','Forearm',['forearms'],500,540,'right',193],
      ['内收肌','Adductors',['adductors'],352,805,'right',278],
      ['小腿','Calves',['calves'],380,1160,'right',370]
    ]:[
      ['后束','Rear delt',['rear_delt'],1008,333,'left',93],
      ['三头','Triceps',['triceps'],995,440,'left',154],
      ['下背','Low back',['lower_back'],1100,550,'left',227],
      ['斜方肌','Traps',['traps'],1180,345,'right',73],
      ['背阔肌','Lats',['lats'],1190,455,'right',141],
      ['臀中肌','Glute med',['glute_med'],1180,640,'right',211],
      ['臀大肌','Glute max',['glute_max'],1190,715,'right',252],
      ['腘绳肌','Hamstrings',['hamstrings'],1200,850,'right',322],
      ['小腿','Calves',['calves'],1200,1120,'right',383]
    ];
    const labelFont='-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    const mode=I18N.mode;
    ctx.save();
    ctx.textBaseline='middle';
    labels.forEach(([zh,en,keys,px,py,edge,ly])=>{
      const lit=keys.some(key=>active.has(key));
      const tx=x+(edge==='left'?0:330), ty=y+ly;
      // 英文标签比中文长：按实际文字宽度决定引线终点，避免线压到字上
      // 英文界面：英文标签下面再写一行小号中文，方便对照肌肉名称
      const lines=mode==='zh'?[[zh,18]]:[[en,15],[zh,12]];
      const width=Math.max(...lines.map(([value,size])=>{ctx.font=size+'px '+labelFont;return ctx.measureText(value).width;}));
      const endX=edge==='left'?Math.max(x+60,tx+width+6):Math.min(x+270,tx-width-6);
      const pointX=bx+(bw-vw*scale)/2+(px-vx)*scale;
      const pointY=by+(bh-vh*scale)/2+(py-vy)*scale;
      ctx.strokeStyle=lit?'#5ea973':'#3e454b';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(pointX,pointY);
      ctx.lineTo(endX+(edge==='left'?12:-12),ty);ctx.lineTo(endX,ty);ctx.stroke();
      ctx.textAlign=edge==='left'?'left':'right';ctx.fillStyle=lit?'#75df8d':'#7d858c';
      if(lines.length===1){ctx.font=lines[0][1]+'px '+labelFont;ctx.fillText(lines[0][0],tx,ty);}
      else{ctx.font=lines[0][1]+'px '+labelFont;ctx.fillText(lines[0][0],tx,ty-7);ctx.font=lines[1][1]+'px '+labelFont;ctx.fillText(lines[1][0],tx,ty+10);}
    });
    ctx.restore();
  }
  function buildPoster() {
    if(!posterSession)return;const ticket=++renderId;
    const session=posterSession, exercises=session.exercises, summary=muscleSummary(exercises);
    const canvas=document.createElement('canvas');canvas.width=960;
    const ctx=canvas.getContext('2d');const font='-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    const textLines=(text,max,size)=>{ctx.font=size+'px '+font;const result=[];let line='';for(const char of String(text||'')){if(char==='\n'){result.push(line);line='';continue;}if(ctx.measureText(line+char).width>max&&line){result.push(line);line=char;}else line+=char;}result.push(line);return result;};
    const mode=I18N.mode;
    const rows=exercises.map(ex=>({ex,title:textLines(ex.name||L('未命名动作','Unnamed exercise'),804,32),english:mode==='zh'?'':(matchExercise(ex)?.name||''),setRows:Math.max(1,Math.ceil((ex.sets||[]).length/3))}));
    const rowHeight=row=>row.title.length*42+(row.english?30:0)+row.setRows*55+58;
    const notes=session.notes?textLines(session.notes,804,24):[];
    canvas.height=830+rows.reduce((height,row)=>height+rowHeight(row),0)+(notes.length?notes.length*34+85:0)+100;
    const gradient=ctx.createLinearGradient(0,0,960,canvas.height);gradient.addColorStop(0,'#17191c');gradient.addColorStop(1,'#202a23');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,canvas.height);
    function text(value,x,y,size=26,color='#e7ebe7',bold=false){ctx.fillStyle=color;ctx.font=(bold?'600 ':'')+size+'px '+font;ctx.fillText(String(value),x,y);}
    function card(x,y,w,h){ctx.fillStyle='#202328';ctx.beginPath();ctx.roundRect(x,y,w,h,30);ctx.fill();}
    const posterDate=new Date(session.date+'T12:00:00');
    const weekday=Number.isNaN(posterDate.getTime())?'':L(new Intl.DateTimeFormat('zh-CN',{weekday:'long'}).format(posterDate),new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(posterDate));
    text(session.date?session.date+' '+weekday:L('日期未填写','No date'),42,69,25,'#d5dad6');
    card(36,110,888,620);text($('posterName').value.trim()||L('我的训练','My Workout'),76,169,32,'#f2f5f1',true);
    text(posterDraft?L('本次训练草稿','Draft'):L('已保存的训练','Saved session'),76,205,20,'#8f9993');
    drawLabeledBody(ctx,summary.muscles,50,235,'front');drawLabeledBody(ctx,summary.muscles,390,235,'back');
    text(L('正面','Front'),192,692,20,'#8f9993');text(L('背面','Back'),532,692,20,'#8f9993');
    // 右侧数据栏的说明文字：对照模式中文下面再写一行小号英文
    const statLabel=(zh,en,y)=>text(L(zh,en),755,y,mode==='zh'?20:18,'#8f9993');
    const notRecorded=L('未记录','N/A');
    const volume=exercises.reduce((sum,ex)=>sum+exerciseVolume(ex),0);
    text(volume.toLocaleString(),755,280,32,'#6fe38a',true);statLabel('总容量（kg）','Volume (kg)',316);
    text(session.duration?session.duration+L(' 分',' min'):notRecorded,755,400,30,'#6fe38a',true);statLabel('训练时长','Duration',437);
    text(session.calories?session.calories+' kcal':notRecorded,755,518,26,'#6fe38a',true);statLabel('热量（估算）','Calories (est.)',555);
    text(exercises.length+L(' 个动作',exercises.length===1?' exercise':' exercises'),755,629,24,'#6fe38a',true);
    const muscleText=summary.keys.length?(mode==='zh'?'训练部位：'+summary.keys.map(key=>MUSCLES[key].zh).join('、'):'Muscles: '+summary.keys.map(muscleName).join(', ')):L('训练部位未标注','No muscles tagged');
    const muscleLines=textLines(muscleText,864,23).slice(0,2);muscleLines.forEach((line,index)=>text(line,48,(muscleLines.length>1?765:779)+index*30,23,'#75df8d'));
    let y=820;
    const detailHeight=rows.reduce((height,row)=>height+rowHeight(row),0)+(notes.length?notes.length*34+85:0);
    card(36,y,888,detailHeight+30);y+=45;
    rows.forEach(({ex,title,english,setRows})=>{
      title.forEach(line=>{text(line,76,y,32,'#f2f5f1',true);y+=42;});
      if(english){text(english,76,y-8,22,'#8f9993');y+=30;}
      (ex.sets||[]).forEach((set,index)=>{
        const x=76+(index%3)*274,sy=y+Math.floor(index/3)*55;
        text(index+1,x,sy,18,'#8f9993');
        const weight=set.weight!==''&&set.weight!==undefined&&set.weight!==null?set.weight+'kg × ':'';
        const value=weight+(set.reps!==''&&set.reps!==undefined?set.reps+L('次',' reps'):L('次数未填','no reps'));
        text(value,x+28,sy,23);
        if(set.done)text('✓',x+238,sy,20,'#548362');
      });
      if(!ex.sets?.length)text(L('组数未记录','No sets'),76,y,23,'#8f9993');
      y+=setRows*55+16;ctx.strokeStyle='#363d3b';ctx.beginPath();ctx.moveTo(76,y);ctx.lineTo(884,y);ctx.stroke();y+=42;
    });
    if(notes.length){text(L('训练备注','Notes'),76,y,28,'#f2f5f1',true);y+=38;notes.forEach(line=>{text(line,76,y,24,'#a1aaa3');y+=34;});}
    text(summary.unknown?L(summary.unknown+' 个动作未标注肌群 · 可在动作记录中选择部位',summary.unknown+' exercise(s) untagged — pick muscles in the log'):L('着色表示动作涉及的主要肌群，不代表刺激强度','Highlighted = main muscles involved, not intensity'),48,canvas.height-63,19,'#7e8982');
    text(L('训练日志 · 我的真实打卡','Workout Log · real check-ins'),48,canvas.height-28,18,'#7e8982');
    $('posterPreview').src=canvas.toDataURL('image/png');
    $('posterNote').textContent=L('iPhone 点「保存图片」后选「存储图像」即可存进相册，也可以长按图片保存。训练部位可在上方「调整训练部位」里多选。','On iPhone, tap “Save image” then “Save Image” to put it in Photos, or long-press the image. Pick multiple muscles under “Adjust muscles” above.');
    posterBlob=null;$('sharePoster').disabled=true;$('downloadPoster').removeAttribute('href');
    canvas.toBlob(blob=>{if(ticket!==renderId||!blob)return;posterBlob=blob;if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);$('downloadPoster').href=posterUrl;$('downloadPoster').download=L('训练打卡-','workout-')+(session.date||L('未填写日期','no-date'))+'.png';$('sharePoster').disabled=false;},'image/png');
  }
  // iOS 上 <a download> 只会打开一个 PNG 文件页面，存不进相册；手机上改用系统分享面板，里面有「存储图像」
  $('downloadPoster').addEventListener('click',async event=>{
    if(!posterBlob||!/iphone|ipad|android/i.test(navigator.userAgent))return;
    const file=new File([posterBlob],$('downloadPoster').download||'workout.png',{type:'image/png'});
    if(!navigator.canShare?.({files:[file]}))return;
    event.preventDefault();
    try{await navigator.share({files:[file]});}catch(error){if(error.name!=='AbortError')showToast(L('请长按上方图片，选择「存储到照片」','Long-press the image above and choose “Save to Photos”'));}
  });
  $('sharePoster').onclick=async()=>{
    if(!posterBlob)return;const file=new File([posterBlob],L('训练打卡.png','workout.png'),{type:'image/png'});
    if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:L('我的训练打卡','My workout check-in')});}catch(error){if(error.name!=='AbortError')showToast(L('请点击保存图片，或长按图片保存','Tap “Save image”, or long-press the image'));}}
    else{$('downloadPoster').click();showToast(L('图片已准备下载，可保存后发给教练','Image ready — save it and send it to your coach'));}
  };

  // ================= 动作宝典 (教学知识库) 弹窗控制器 =================
  const vaultModal = $('vaultModal');
  const openVaultBtn = $('openVaultBtn');
  const closeVaultBtn = $('closeVault');
  const vaultSearch = $('vaultSearch');
  const vaultPills = $('vaultPills');
  const vaultList = $('vaultList');

  let currentVaultGroup = '';

  function openVault() {
    if (vaultSearch) vaultSearch.value = '';
    currentVaultGroup = '';
    if (vaultPills) {
      vaultPills.querySelectorAll('.vault-pill').forEach(b => b.classList.toggle('active', b.dataset.vaultGroup === ''));
    }
    renderVaultList();
    if (vaultModal) vaultModal.showModal();
  }

  if (openVaultBtn) openVaultBtn.onclick = openVault;
  if (closeVaultBtn) closeVaultBtn.onclick = () => vaultModal && vaultModal.close();
  if (vaultModal) {
    vaultModal.addEventListener('click', event => {
      if (event.target === vaultModal) {
        const box = vaultModal.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
          vaultModal.close();
        }
      }
    });
  }

  if (vaultSearch) {
    vaultSearch.addEventListener('input', () => renderVaultList());
  }

  if (vaultPills) {
    vaultPills.querySelectorAll('.vault-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        vaultPills.querySelectorAll('.vault-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentVaultGroup = btn.dataset.vaultGroup || '';
        renderVaultList();
      });
    });
  }

  function renderVaultList() {
    if (!vaultList) return;
    const vault = app().loadVault ? app().loadVault() : {};
    const query = clean(vaultSearch?.value || '');
    const sessions = app().getState()?.sessions || [];

    // 计算各动作 PR
    const prMap = {}, prKeyByCatalog = {};
    sessions.forEach(s => {
      (s.exercises || []).forEach(ex => {
        const rawName = (ex.name || '').trim();
        if (!rawName) return;
        const key = clean(rawName);
        if (ex.catalogId && !prKeyByCatalog[ex.catalogId]) prKeyByCatalog[ex.catalogId] = key;
        if (!prMap[key]) prMap[key] = { maxW: 0, reps: 0, sets: 0, lastDate: s.date || '' };
        (ex.sets || []).forEach(set => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps, 10) || 0;
          if (w > 0 || r > 0) {
            prMap[key].sets += 1;
            if (w > prMap[key].maxW) {
              prMap[key].maxW = w;
              prMap[key].reps = r;
            } else if (w === prMap[key].maxW && r > prMap[key].reps) {
              prMap[key].reps = r;
            }
          }
        });
      });
    });

    let items = Object.entries(vault).map(([key, item]) => {
      const match = matchExercise({ name: item.name, catalogId: item.catalogId });
      const groupKeys = parseGroups(item.muscleGroup).length ? parseGroups(item.muscleGroup) : catalogGroups(match);
      const groupKey = groupKeys[0] || '';
      const equipKey = match ? (match.equipment || '') : '';
      const pr = prMap[key] || (item.catalogId && prMap[prKeyByCatalog[item.catalogId]]) || null;
      return {
        key,
        name: item.name,
        enName: match?.name || '',
        tips: item.tips || '',
        updatedAt: item.updatedAt || (pr?.lastDate || ''),
        match,
        groupKey,
        // 预设动作：还没练过、口诀也没改过
        preset: Boolean(item.preset) && !pr,
        groupKeys,
        groupLabel: groupKeys.map(key => groups[key]).join(' · ') || I18N.term('力量动作','Strength'),
        equipLabel: equipment[equipKey] || equipKey || I18N.term('自由重量','Free weight'),
        pr: pr && pr.maxW > 0 ? pr : null
      };
    });

    const totalCount = items.length;
    const hasTipsCount = items.filter(i => i.tips && i.tips.trim()).length;
    const practicedCount = items.filter(i => !i.preset).length;
    if ($('vaultCountSub')) {
      $('vaultCountSub').textContent = L('共 ' + totalCount + ' 个动作 · ' + hasTipsCount + ' 个有要领 · 练过 ' + practicedCount + ' 个', totalCount + ' exercises · ' + hasTipsCount + ' with cues · ' + practicedCount + ' practiced');
    }

    // 过滤
    items = items.filter(item => {
      if (currentVaultGroup) {
        if (currentVaultGroup === 'arms') {
          if (!item.groupKeys.some(key => key === 'biceps' || key === 'triceps' || key === 'forearms')) return false;
        } else if (!item.groupKeys.includes(currentVaultGroup)) {
          return false;
        }
      }
      if (query) {
        const text = clean(item.name + ' ' + item.enName + ' ' + item.tips + ' ' + item.groupLabel + ' ' + item.equipLabel);
        if (!text.includes(query)) return false;
      }
      return true;
    });

    // 排序：自己练过的排在预设前面；再按有没有要领、更新时间
    items.sort((a, b) => {
      if (a.preset !== b.preset) return a.preset ? 1 : -1;
      const hasTipA = Boolean(a.tips && a.tips.trim());
      const hasTipB = Boolean(b.tips && b.tips.trim());
      if (hasTipA !== hasTipB) return hasTipB ? 1 : -1;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });

    if (!items.length) {
      if (totalCount === 0) {
        vaultList.innerHTML = '<div class="vault-empty"><div class="vault-empty-icon">' + icon('book') + '</div><strong>' + L('还没有沉淀动作教学要领', 'No form cues yet') + '</strong><p style="margin:8px 0 0;">' + L('在训练中添加动作并在下方写下教练口诀，<br>保存训练后就会自动在这里生成你的专属动作宝典！', 'Add exercises and jot down your coach’s cues below each one — they’ll collect here once you save the session.') + '</p></div>';
      } else {
        vaultList.innerHTML = '<div class="vault-empty"><p>' + L('没有找到符合条件的动作教学要领。', 'Nothing matches.') + '</p></div>';
      }
      return;
    }

    vaultList.innerHTML = items.map(item => {
      const match = item.match;
      const thumb = match?.img ? CDN_BASE + match.img : (match?.gif ? CDN_BASE + match.gif : '');
      const gif = match?.gif ? CDN_BASE + match.gif : '';
      const hasTips = Boolean(item.tips && item.tips.trim());

      const mediaHtml = thumb ? (
        '<div class="vault-media-wrap" data-gif="' + gif + '" data-thumb="' + thumb + '" title="' + L('点击播放/暂停示范', 'Tap to play/pause') + '">' +
          '<img src="' + thumb + '" alt="' + escapeHtml(item.name) + ' 3D" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
          (gif ? '<span class="vault-gif-tag">' + L('▶ 动图', '▶ GIF') + '</span>' : '') +
        '</div>'
      ) : (
        '<div class="vault-media-wrap" style="background:#22252a; display:grid; place-items:center; color:var(--green); font-size:24px;">' + icon('dumbbell') + '</div>'
      );

      return '<article class="vault-card" data-vault-key="' + escapeHtml(item.key) + '">' +
        '<div class="vault-card-top">' +
          mediaHtml +
          '<div class="vault-card-info">' +
            '<div class="vault-card-meta">' +
              '<span class="vault-group-badge">' + escapeHtml(item.groupLabel) + '</span>' +
              '<span class="vault-equip-badge">' + escapeHtml(item.equipLabel) + '</span>' +
            '</div>' +
            '<strong class="vault-card-title">' + escapeHtml(item.name) + '</strong>' +
            (item.enName ? '<span class="vault-card-en">' + escapeHtml(item.enName) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="vault-tip-box">' +
          '<div class="vault-tip-head">' +
            '<span>' + L('教学要领 &amp; 口诀', 'Form cues') + '</span>' +
            '<button type="button" class="vault-edit-btn" data-action="edit-tip">' + icon('edit') + ' ' + L('编辑', 'Edit') + '</button>' +
          '</div>' +
          '<div class="vault-tip-content ' + (hasTips ? '' : 'empty') + '">' +
            (hasTips ? escapeHtml(item.tips) : L('尚未记录口诀，在下次训练时填写会自动沉淀在此', 'No cues yet — add them in your next session and they’ll appear here')) +
          '</div>' +
          '<div class="vault-tip-edit-area" hidden>' +
            '<label class="vault-edit-label">' + L('动作名称', 'Exercise name') + '<input class="vault-edit-name" maxlength="40" value="' + escapeHtml(item.name) + '"></label>' +
            '<label class="vault-edit-label">' + L('教学要领 & 口诀', 'Form cues') + '</label>' +
            '<textarea class="vault-edit-textarea" rows="3" maxlength="300" placeholder="' + L('如：座椅高度齐胸；下拉先沉肩，手肘往裤兜带；避免耸肩借力...', 'e.g. seat at chest height; shoulders down first, elbows to pockets; no shrugging...') + '">' + escapeHtml(item.tips || '') + '</textarea>' +
            '<div class="vault-edit-actions">' +
              '<button type="button" class="vault-delete-btn">' + L('删除动作', 'Delete') + '</button>' +
              '<button type="button" class="vault-cancel-btn">' + L('取消', 'Cancel') + '</button>' +
              '<button type="button" class="vault-save-btn">' + L('保存修改', 'Save') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vault-card-footer">' +
          '<span>' + (item.pr ? L('最佳', 'Best') + ' <strong>' + item.pr.maxW + 'kg</strong> × ' + item.pr.reps + L('次', '') : L('记录已同步', 'Synced')) + '</span>' +
          '<span>' + (item.updatedAt ? L('更新于 ', 'Updated ') + escapeHtml(item.updatedAt) : '') + '</span>' +
        '</div>' +
      '</article>';
    }).join('');

    // 事件绑定：动图切换
    vaultList.querySelectorAll('.vault-media-wrap[data-gif]').forEach(wrap => {
      wrap.onclick = () => {
        const gif = wrap.dataset.gif;
        const thumb = wrap.dataset.thumb;
        const img = wrap.querySelector('img');
        const tag = wrap.querySelector('.vault-gif-tag');
        if (!gif || !img) return;
        if (img.src === gif) {
          img.src = thumb;
          if (tag) { tag.textContent = L('▶ 动图', '▶ GIF'); tag.style.background = 'rgba(0,0,0,.7)'; tag.style.color = ''; }
        } else {
          img.src = gif;
          if (tag) { tag.textContent = L('■ 播放中', '■ Playing'); tag.style.background = 'var(--green)'; tag.style.color = '#102015'; }
        }
      };
    });

    // 事件绑定：编辑与保存口诀
    vaultList.querySelectorAll('.vault-card').forEach(card => {
      let key = card.dataset.vaultKey;
      const editBtn = card.querySelector('[data-action="edit-tip"]');
      const contentEl = card.querySelector('.vault-tip-content');
      const editArea = card.querySelector('.vault-tip-edit-area');
      const textarea = card.querySelector('.vault-edit-textarea');
      const cancelBtn = card.querySelector('.vault-cancel-btn');
      const saveBtn = card.querySelector('.vault-save-btn');
      const deleteBtn = card.querySelector('.vault-delete-btn');
      const nameInput = card.querySelector('.vault-edit-name');

      if (!editBtn || !editArea) return;

      editBtn.onclick = () => {
        contentEl.hidden = true;
        editArea.hidden = false;
        editBtn.hidden = true;
        textarea.focus();
      };

      cancelBtn.onclick = () => {
        contentEl.hidden = false;
        editArea.hidden = true;
        editBtn.hidden = false;
        textarea.value = vault[key]?.tips || '';
        nameInput.value = vault[key]?.name || '';
      };

      deleteBtn.onclick = () => {
        const name = vault[key]?.name || key;
        if (!window.confirm(L('从动作宝典删除「' + name + '」？已保存的训练记录不受影响。', 'Remove "' + name + '" from your playbook? Saved sessions are not affected.'))) return;
        delete vault[key];
        app().saveVault(vault);
        showToast(L('已删除「' + name + '」', 'Removed "' + name + '"'));
        renderVaultList();
      };

      saveBtn.onclick = () => {
        const newTips = textarea.value.trim();
        const d = new Date();
        const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        // 改名：宝典按名字索引，名字变了就换一个 key；动作库 id 不变，所以以前的记录和动作库都还能对上
        const newName = nameInput.value.trim();
        if (vault[key] && newName && newName !== vault[key].name) {
          const newKey = clean(newName);
          if (newKey !== key && vault[newKey]) { showToast(L('宝典里已经有「' + vault[newKey].name + '」了', '"' + vault[newKey].name + '" is already in your playbook')); return; }
          const entry = { ...vault[key], name: newName };
          delete vault[key];
          vault[newKey] = entry;
          key = newKey;
        }
        if (!vault[key]) {
          vault[key] = { name: card.querySelector('.vault-card-title')?.textContent || key, tips: newTips, updatedAt: todayStr };
        } else {
          vault[key].tips = newTips;
          vault[key].updatedAt = todayStr;
          delete vault[key].preset; // 改过的预设就是自己的口诀了
        }
        app().saveVault(vault);
        showToast(L('已保存「' + vault[key].name + '」', 'Saved "' + vault[key].name + '"'));
        renderVaultList();
      };
    });
    window.onVaultListRendered?.(vaultList);
  }

  window.renderVaultList = renderVaultList;

  render();
})();

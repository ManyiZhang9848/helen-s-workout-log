(() => {
  'use strict';
  const app = () => window.workoutApp;
  const catalog = window.WORKOUT_CATALOG || [];
  const body = window.WORKOUT_BODY || {};
  const groups = {chest:'胸',back:'背',legs:'腿',glutes:'臀',shoulders:'肩',biceps:'二头',triceps:'三头',core:'腹部',calves:'小腿',forearms:'前臂'};
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
  const muscleShapes = {
    'chest':['CHEST'],'pectorals':['CHEST'],'serratus anterior':['CHEST'],
    'back':['UPPER_BACK'],'lats':['UPPER_BACK'],'upper back':['UPPER_BACK'],'middle back':['UPPER_BACK'],
    'lower back':['LOWER_BACK'],'spine':['LOWER_BACK'],'traps':['TRAPEZIUS'],
    'legs':['QUADRICEPS','HAMSTRING'],'quadriceps':['QUADRICEPS'],'quads':['QUADRICEPS'],'hamstrings':['HAMSTRING'],'adductors':['ADDUCTOR'],
    'glutes':['GLUTEAL'],'abductors':['ABDUCTORS'],
    'shoulders':['FRONT_DELTOIDS','BACK_DELTOIDS'],'delts':['FRONT_DELTOIDS','BACK_DELTOIDS'],'levator scapulae':['TRAPEZIUS'],
    'biceps':['BICEPS'],'triceps':['TRICEPS'],
    'core':['ABS','OBLIQUES'],'abs':['ABS','OBLIQUES'],'abdominals':['ABS','OBLIQUES'],'waist':['ABS','OBLIQUES'],
    'calves':['CALVES','LEFT_SOLEUS','RIGHT_SOLEUS'],'forearms':['FOREARM']
  };
  const equipment = {'barbell':'杠铃','dumbbell':'哑铃','cable':'绳索','leverage machine':'器械','smith machine':'史密斯机','body weight':'自重','kettlebell':'壶铃','band':'弹力带','ez barbell':'曲杆','wheel roller':'健腹轮','trap bar':'六角杠铃','rope':'战绳/绳索','assisted':'辅助器械','medicine ball':'药球/健身球'};
  const aliases = {'高位下拉':'0150','宽握高位下拉':'0200','坐姿划船':'0198','坐姿绳索划船':'0198','杠铃卧推':'0025','杠铃深蹲':'0043','杠铃硬拉':'0032','引体向上':'0652','俯卧撑':'0651','罗马尼亚硬拉':'0085'};
  const clean = text => String(text || '').trim().toLowerCase().replace(/\s+/g,'');
  const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/';
  function matchExercise(ex) {
    return catalog.find(item => item.id === ex.catalogId) || catalog.find(item => clean(item.zh) === clean(ex.name) || clean(item.name) === clean(ex.name) || item.id === aliases[ex.name]);
  }
  function exerciseMuscles(ex) {
    if (ex.muscleGroup) return Object.keys(muscleGroups).filter(key => muscleGroups[key] === ex.muscleGroup);
    const m = matchExercise(ex);
    if (!m) return [];
    const list = [];
    if (m.group) list.push(m.group);
    if (m.target && !list.includes(m.target)) list.push(m.target);
    if (m.primaryMuscles) list.push(...m.primaryMuscles);
    return list;
  }
  function muscleSummary(exercises) {
    const shapes = new Set(), labels = new Set(); let unknown = 0;
    exercises.forEach(ex => { const muscles = exerciseMuscles(ex); if(!muscles.length) unknown++;
      muscles.forEach(m => { (muscleShapes[m] || []).forEach(shape=>shapes.add(shape)); if(groups[muscleGroups[m]])labels.add(groups[muscleGroups[m]]); });
    });
    return {shapes,labels:[...labels],unknown};
  }
  const optionList = (values, label) => '<option value="">'+label+'</option>'+Object.entries(values).map(([key,value])=>'<option value="'+key+'">'+value+'</option>').join('');
  document.body.insertAdjacentHTML('beforeend', '<dialog class="extra-dialog" id="exerciseLibrary"><header class="extra-header"><h2>3D动作库</h2><button class="extra-close" id="closeLibrary" aria-label="关闭动作库">×</button></header><div class="library-controls"><input id="librarySearch" type="search" placeholder="搜索动作，例如：卧推、深蹲、硬拉、bench press" aria-label="搜索动作"><div class="library-filters"><select id="libraryMuscle" aria-label="按肌群筛选">'+optionList(groups,'全部肌群')+'</select><select id="libraryEquipment" aria-label="按器械筛选">'+optionList(equipment,'全部器械')+'</select></div><p class="library-status" id="libraryStatus"></p><button class="extra-secondary" id="libraryCustom">＋ 自己填写动作</button></div><div id="libraryList" class="library-list"></div><footer class="library-footer">动作库由 <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">ExerciseDB (exercises-dataset)</a> 提供，3D 白模动图版权归 <a href="https://gymvisual.com/" target="_blank" rel="noopener">Gym Visual</a> 所有。<a href="OPEN-SOURCE-LICENSES.txt" target="_blank">开源许可</a></footer></dialog><dialog class="extra-dialog" id="posterDialog"><header class="extra-header"><h2>训练打卡长图</h2><button class="extra-close" id="closePoster" aria-label="关闭打卡图">×</button></header><div class="poster-controls"><label>显示名称<input id="posterName" maxlength="24" placeholder="我的训练"></label></div><img id="posterPreview" class="poster-preview" alt="训练打卡长图，包含肌群分布和动作明细"><div class="poster-actions"><a class="extra-primary" id="downloadPoster" download="训练打卡.png">保存图片</a><button class="extra-secondary" id="sharePoster">分享图片</button></div><p class="poster-note" id="posterNote"></p></dialog>');
  const library = $('exerciseLibrary'), poster = $('posterDialog');
  let libraryLimit = 20;
  function openLibrary() { libraryLimit = 20; $('librarySearch').value=''; $('libraryMuscle').value=''; $('libraryEquipment').value=''; renderLibrary(); library.showModal(); }
  window.openExerciseLibrary = openLibrary;
  $('closeLibrary').onclick=()=>library.close();
  $('closePoster').onclick=()=>poster.close();
  [library,poster].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}));
  $('libraryCustom').onclick=()=>{library.close();addCustomExercise();};
  for(const id of ['librarySearch','libraryMuscle','libraryEquipment'])$(id).addEventListener('input',()=>{ libraryLimit = 20; renderLibrary(); });
  function renderLibrary() {
    const query=clean($('librarySearch').value), muscle=$('libraryMuscle').value, gear=$('libraryEquipment').value;
    const list=catalog.filter(ex=>{
      const textMatch = !query || clean(ex.zh + ' ' + ex.name).includes(query);
      const muscleMatch = !muscle || ex.group === muscle || muscleGroups[ex.target] === muscle || (ex.primaryMuscles && ex.primaryMuscles.some(m => muscleGroups[m] === muscle));
      const equipMatch = !gear || ex.equipment === gear;
      return textMatch && muscleMatch && equipMatch;
    });
    $('libraryStatus').textContent = list.length + ' 个动作 · 默认轻量封面，点图片播放动图';
    const displayed = list.slice(0, libraryLimit);
    $('libraryList').innerHTML = displayed.length ? displayed.map(ex=>{
      const thumb = ex.img ? CDN_BASE + ex.img : (ex.gif ? CDN_BASE + ex.gif : '');
      const gif = ex.gif ? CDN_BASE + ex.gif : '';
      const label = groups[ex.group] || groups[muscleGroups[ex.target]] || '主要部位';
      const eqText = equipment[ex.equipment] || ex.equipment || '其他';
      return '<article class="library-item">' +
        '<div class="library-media-wrap" data-gif="' + gif + '" data-thumb="' + thumb + '" title="点我播放/暂停动图">' +
          '<img src="' + thumb + '" alt="' + escapeHtml(ex.zh) + ' 3D示范" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
          (gif ? '<span class="gif-tag">▶ 动图</span>' : '') +
        '</div>' +
        '<strong>' + escapeHtml(ex.zh) + '</strong>' +
        '<span class="library-en">' + escapeHtml(ex.name) + '</span>' +
        '<span class="library-meta">' + escapeHtml(label) + ' · ' + escapeHtml(eqText) + '</span>' +
        '<button type="button" class="extra-primary" data-library-add="' + ex.id + '">加入训练</button>' +
      '</article>';
    }).join('') + (list.length > libraryLimit ? '<button type="button" class="library-load-more" id="loadMoreExercises">查看更多动作（还有 ' + (list.length - libraryLimit) + ' 个）</button>' : '') : '<p class="library-status" style="grid-column:1/-1;text-align:center;padding:24px 0;">没有匹配动作，可以点击“自己填写动作”。</p>';
    $('libraryList').querySelectorAll('.library-media-wrap').forEach(wrap => {
      wrap.onclick = () => {
        const gif = wrap.dataset.gif;
        const img = wrap.querySelector('img');
        const tag = wrap.querySelector('.gif-tag');
        if (!gif || !img) return;
        if (img.src === gif) {
          img.src = wrap.dataset.thumb;
          if (tag) { tag.textContent = '▶ 动图'; tag.classList.remove('playing'); }
        } else {
          img.src = gif;
          if (tag) { tag.textContent = '■ 动图中'; tag.classList.add('playing'); }
        }
      };
    });
    $('libraryList').querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.style.opacity='0.25';};});
    $('libraryList').querySelectorAll('[data-library-add]').forEach(button=>button.onclick=()=>{
      const ex=catalog.find(item=>item.id===button.dataset.libraryAdd);if(!ex)return;
      const item={...app().blankExercise(),name:ex.zh,catalogId:ex.id,muscleGroup:ex.group||muscleGroups[ex.target]||''};
      app().getState().current.exercises.push(item);saveState();library.close();render();showToast('已添加 '+ex.zh);
      const cards=document.querySelectorAll('[data-exercise]');cards[cards.length-1]?.scrollIntoView({block:'center',behavior:'smooth'});
    });
    const loadBtn = $('loadMoreExercises');
    if (loadBtn) loadBtn.onclick = () => { libraryLimit += 20; renderLibrary(); };
  }
  function addMuscleControls() {
    document.querySelectorAll('#exerciseList [data-exercise]').forEach(card=>{
      const ex=app().getState().current.exercises.find(item=>item.id===card.dataset.exercise);if(!ex)return;
      const row=document.createElement('label');row.className='muscle-edit';row.innerHTML='打卡图部位<select aria-label="打卡图肌群">'+optionList(groups,'按动作名称识别')+'</select>';
      const select=row.querySelector('select');select.value=ex.muscleGroup||'';
      const matched=matchExercise(ex);
      select.options[0].textContent=matched?'自动 · '+exerciseMuscles({...ex,muscleGroup:''}).map(m=>groups[muscleGroups[m]]).filter((m,i,a)=>m&&a.indexOf(m)===i).join('、'):'未识别 · 请选部位';
      select.onchange=()=>{ex.muscleGroup=select.value;saveState();};card.appendChild(row);
      card.querySelector('[data-field="name"]').addEventListener('input',()=>{delete ex.catalogId;select.options[0].textContent=matchExercise(ex)?'自动识别肌群':'未识别 · 请选部位';});
    });
  }
  const originalExercises=renderExercises;
  renderExercises=function(){originalExercises();addMuscleControls();};
  const originalHistory=renderHistory;
  renderHistory=function(){originalHistory();document.querySelectorAll('#historyList [data-share-index]').forEach(button=>{
    const trigger=document.createElement('button');trigger.type='button';trigger.className='poster-trigger';trigger.textContent='生成打卡图';
    trigger.onclick=()=>openPoster(app().getState().sessions[Number(button.dataset.shareIndex)],false);
    button.parentElement.prepend(trigger);
  });};
  const posterButton=document.createElement('button');posterButton.type='button';posterButton.className='poster-trigger';posterButton.textContent='生成训练打卡图';
  posterButton.style.cssText='width:100%;margin-bottom:24px';
  posterButton.onclick=()=>{syncMeta();const current=app().getState().current.exercises.length>0;openPoster(current?{...app().getState().current,volume:totalVolume()}:app().getState().sessions[0],current);};
  document.querySelector('.notes').after(posterButton);
  const shareImageButton=document.createElement('button');shareImageButton.type='button';shareImageButton.className='poster-trigger';shareImageButton.style.cssText='width:100%;margin-top:12px';shareImageButton.textContent='生成图片打卡';
  $('previewCoachViewBtn').after(shareImageButton);
  shareImageButton.onclick=()=>{const session=app().getState().current.exercises.length?app().getState().current:app().getState().sessions[0];closeShareModal();openPoster(session,session===app().getState().current);};
  const muscleAdjust=document.createElement('details');muscleAdjust.className='poster-muscles';muscleAdjust.innerHTML='<summary>调整训练部位</summary><div id="posterMuscleFields"></div>';$('posterName').parentElement.after(muscleAdjust);
  let posterSession=null, posterDraft=false, posterBlob=null, posterUrl=null, renderId=0;
  function openPoster(session,draft) {
    if(!session?.exercises?.length){showToast('先填写或保存一次训练');return;}
    posterSession=JSON.parse(JSON.stringify(session));posterDraft=Boolean(draft);
    $('posterName').value=localStorage.getItem('workout-poster-name')||'我的训练';
    $('posterMuscleFields').innerHTML=posterSession.exercises.map((ex,index)=>'<label>'+escapeHtml(ex.name)+'<select data-poster-muscle="'+index+'">'+optionList(groups,'按动作库识别')+'</select></label>').join('');
    $('posterMuscleFields').querySelectorAll('select').forEach(select=>{const index=Number(select.dataset.posterMuscle);select.value=posterSession.exercises[index].muscleGroup||'';select.onchange=()=>{posterSession.exercises[index].muscleGroup=select.value;session.exercises[index].muscleGroup=select.value;saveState();buildPoster();};});
    poster.showModal();buildPoster();
  }
  $('posterName').addEventListener('input',()=>{localStorage.setItem('workout-poster-name',$('posterName').value);buildPoster();});
  function drawBody(ctx,parts,active,x,y,width,height) {
    ctx.save();ctx.translate(x,y);ctx.scale(width/1000,height/2200);
    parts.forEach(part=>{ctx.fillStyle=active.has(part.muscle)?'#514596':'#cdd0da';part.polygons.forEach(points=>{
      const n=points.split(' ').map(Number);ctx.beginPath();ctx.moveTo(n[0],n[1]);for(let i=2;i<n.length;i+=2)ctx.lineTo(n[i],n[i+1]);ctx.closePath();ctx.fill();
    });});ctx.restore();
  }
  function buildPoster() {
    if(!posterSession)return;const ticket=++renderId;
    const session=posterSession, exercises=session.exercises, summary=muscleSummary(exercises);
    const canvas=document.createElement('canvas');canvas.width=960;
    const ctx=canvas.getContext('2d');const font='-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
    const textLines=(text,max,size)=>{ctx.font=size+'px '+font;const result=[];let line='';for(const char of String(text||'')){if(char==='\n'){result.push(line);line='';continue;}if(ctx.measureText(line+char).width>max&&line){result.push(line);line=char;}else line+=char;}result.push(line);return result;};
    const rows=exercises.map(ex=>({ex,title:textLines(ex.name||'未命名动作',804,32),setRows:Math.max(1,Math.ceil((ex.sets||[]).length/3))}));
    const notes=session.notes?textLines(session.notes,804,24):[];
    canvas.height=830+rows.reduce((height,row)=>height+row.title.length*42+row.setRows*55+58,0)+(notes.length?notes.length*34+85:0)+100;
    const gradient=ctx.createLinearGradient(0,0,960,canvas.height);gradient.addColorStop(0,'#ece8fa');gradient.addColorStop(1,'#fff0e8');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,canvas.height);
    function text(value,x,y,size=26,color='#252051',bold=false){ctx.fillStyle=color;ctx.font=(bold?'600 ':'')+size+'px '+font;ctx.fillText(String(value),x,y);}
    function card(x,y,w,h){ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x,y,w,h,30);ctx.fill();}
    text(session.date?session.date+' '+new Intl.DateTimeFormat('zh-CN',{weekday:'long'}).format(new Date(session.date+'T12:00:00')):'日期未填写',42,69,25);
    card(36,110,888,620);text($('posterName').value.trim()||'我的训练',76,169,32,'#252051',true);
    text(posterDraft?'本次训练草稿':'已保存的训练',76,205,20,'#79768e');
    drawBody(ctx,body.front||[],summary.shapes,76,235,220,430);drawBody(ctx,body.back||[],summary.shapes,325,235,220,430);
    text('正面',160,692,20,'#8b889e');text('背面',414,692,20,'#8b889e');
    const volume=exercises.reduce((sum,ex)=>sum+exerciseVolume(ex),0);
    text(volume.toLocaleString(),610,280,42,'#30276b',true);text('总容量（kg）',610,316,22,'#8b889e');
    text(session.duration?session.duration+' 分':'未记录',610,400,36,'#30276b',true);text('训练时长',610,437,22,'#8b889e');
    text(session.calories?session.calories+' kcal':'未记录',610,518,32,'#30276b',true);text('热量（估算）',610,555,22,'#8b889e');
    text(exercises.length+' 个动作',610,629,26,'#514596',true);
    const muscleText=summary.labels.length?'训练部位：'+summary.labels.join('、'):'训练部位未标注';
    text(muscleText,48,779,23,'#514596');
    let y=820;
    const detailHeight=rows.reduce((height,row)=>height+row.title.length*42+row.setRows*55+58,0)+(notes.length?notes.length*34+85:0);
    card(36,y,888,detailHeight+30);y+=45;
    rows.forEach(({ex,title,setRows})=>{
      title.forEach(line=>{text(line,76,y,32,'#252051',true);y+=42;});
      (ex.sets||[]).forEach((set,index)=>{
        const x=76+(index%3)*274,sy=y+Math.floor(index/3)*55;
        text(index+1,x,sy,18,'#a39fb7');
        const weight=set.weight!==''&&set.weight!==undefined&&set.weight!==null?set.weight+'kg × ':'';
        const value=weight+(set.reps!==''&&set.reps!==undefined?set.reps+'次':'次数未填');
        text(value,x+28,sy,23);
        if(set.done)text('✓',x+238,sy,20,'#548362');
      });
      if(!ex.sets?.length)text('组数未记录',76,y,23,'#8b889e');
      y+=setRows*55+16;ctx.strokeStyle='#efedf5';ctx.beginPath();ctx.moveTo(76,y);ctx.lineTo(884,y);ctx.stroke();y+=42;
    });
    if(notes.length){text('训练总结',76,y,28,'#252051',true);y+=38;notes.forEach(line=>{text(line,76,y,24,'#69657f');y+=34;});}
    text(summary.unknown?summary.unknown+' 个动作未标注肌群 · 可在动作记录中选择部位':'着色表示动作涉及的主要肌群，不代表刺激强度',48,canvas.height-63,19,'#8b889e');
    text('训练日志 · 我的真实打卡',48,canvas.height-28,18,'#8b889e');
    $('posterPreview').src=canvas.toDataURL('image/png');
    $('posterNote').textContent='手机可长按图片保存，也可点击“保存图片”。肌群来自动作库或手动标注；热量沿用日志中的估算值。';
    posterBlob=null;$('sharePoster').disabled=true;$('downloadPoster').removeAttribute('href');
    canvas.toBlob(blob=>{if(ticket!==renderId||!blob)return;posterBlob=blob;if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);$('downloadPoster').href=posterUrl;$('downloadPoster').download='训练打卡-'+(session.date||'未填写日期')+'.png';$('sharePoster').disabled=false;},'image/png');
  }
  $('sharePoster').onclick=async()=>{
    if(!posterBlob)return;const file=new File([posterBlob],'训练打卡.png',{type:'image/png'});
    if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'我的训练打卡'});}catch(error){if(error.name!=='AbortError')showToast('请点击保存图片，或长按图片保存');}}
    else{$('downloadPoster').click();showToast('图片已准备下载，可保存后发给教练');}
  };
  render();
})();

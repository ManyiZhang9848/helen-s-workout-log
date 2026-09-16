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
  document.body.insertAdjacentHTML('beforeend', '<dialog class="extra-dialog" id="exerciseLibrary"><header class="extra-header"><h2>3D动作库</h2><button class="extra-close" id="closeLibrary" aria-label="关闭动作库">×</button></header><div class="library-controls"><input id="librarySearch" type="search" placeholder="搜索动作，例如：卧推、深蹲、硬拉、bench press" aria-label="搜索动作"><div class="library-filters"><select id="libraryMuscle" aria-label="按肌群筛选">'+optionList(groups,'全部肌群')+'</select><select id="libraryEquipment" aria-label="按器械筛选">'+optionList(equipment,'全部器械')+'</select></div><p class="library-status" id="libraryStatus"></p><button class="extra-secondary" id="libraryCustom">＋ 自己填写动作</button></div><div id="libraryList" class="library-list"></div><footer class="library-footer">动作库由 <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">ExerciseDB (exercises-dataset)</a> 提供，3D 白模动图版权归 <a href="https://gymvisual.com/" target="_blank" rel="noopener">Gym Visual</a> 所有。<a href="OPEN-SOURCE-LICENSES.txt" target="_blank">开源许可</a></footer></dialog><dialog class="extra-dialog" id="posterDialog"><header class="extra-header"><h2>训练打卡长图</h2><button class="extra-close" id="closePoster" aria-label="关闭打卡图">×</button></header><div class="poster-controls"><label>显示名称<input id="posterName" maxlength="24" placeholder="我的训练"></label></div><img id="posterPreview" class="poster-preview" alt="训练打卡长图，包含肌群分布和动作明细" title="点击可全屏放大"><p class="poster-hint">点一下图片可全屏放大查看</p><div class="poster-actions"><a class="extra-primary" id="downloadPoster" download="训练打卡.png">保存图片</a><button class="extra-secondary" id="sharePoster">分享图片</button></div><p class="poster-note" id="posterNote"></p><div class="poster-zoom" id="posterZoom"><button class="poster-zoom-close" id="posterZoomClose" aria-label="关闭放大预览">×</button><img id="posterZoomImg" alt="训练打卡长图放大预览"></div></dialog>');
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
      const vault = app().loadVault ? app().loadVault() : {};
      const key = clean(ex.zh);
      const prevTips = vault[key]?.tips || '';
      const item={...app().blankExercise(),name:ex.zh,catalogId:ex.id,muscleGroup:ex.group||muscleGroups[ex.target]||'',tips:prevTips};
      app().getState().current.exercises.push(item);saveState();library.close();render();
      showToast(prevTips ? '已添加 ' + ex.zh + '，已自动带出教学要领' : '已添加 ' + ex.zh);
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
  function drawFemaleBody(ctx,active,x,y,width,height,side) {
    const model = window.WORKOUT_FEMALE_BODY[side];
    const mapping = {
      chest:['CHEST'], neck:['NECK'], trapezius:['TRAPEZIUS'],
      deltoids:[side==='front'?'FRONT_DELTOIDS':'BACK_DELTOIDS'],
      biceps:['BICEPS'], triceps:['TRICEPS'], forearm:['FOREARM'],
      abs:['ABS'], obliques:['OBLIQUES'], 'upper-back':['UPPER_BACK'],
      'lower-back':['LOWER_BACK'], gluteal:['GLUTEAL','ABDUCTORS'],
      adductors:['ADDUCTOR'], quadriceps:['QUADRICEPS'], hamstring:['HAMSTRING'],
      calves:['CALVES','LEFT_SOLEUS','RIGHT_SOLEUS'], tibialis:['CALVES']
    };
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
      ctx.fillStyle=(mapping[part.slug]||[]).some(key=>active.has(key))?'#62d47c':
        part.slug==='head'?'#343940':'#59616b';
      part.paths.forEach(path=>ctx.fill(new Path2D(path)));
    });
    ctx.restore();
  }
  function drawLabeledBody(ctx,active,x,y,side) {
    const bx=x+65, by=y, bw=200, bh=430;
    drawFemaleBody(ctx,active,bx,by,bw,bh,side);
    const model=window.WORKOUT_FEMALE_BODY[side];
    const [vx,vy,vw,vh]=model.viewBox, scale=Math.min(bw/vw,bh/vh);
    const labels=side==='front'?[
      ['上胸',['CHEST'],270,340,'left',87],
      ['中下胸',['CHEST'],265,395,'left',121],
      ['二头',['BICEPS'],185,430,'left',174],
      ['腹部',['ABS','OBLIQUES'],290,540,'left',237],
      ['股四头',['QUADRICEPS'],245,810,'left',321],
      ['前束',['FRONT_DELTOIDS'],425,325,'right',73],
      ['中束',['FRONT_DELTOIDS'],453,355,'right',108],
      ['前臂',['FOREARM'],500,540,'right',193],
      ['内收肌',['ADDUCTOR'],352,805,'right',278],
      ['小腿',['CALVES'],380,1160,'right',370]
    ]:[
      ['后束',['BACK_DELTOIDS'],1008,333,'left',93],
      ['三头',['TRICEPS'],995,440,'left',154],
      ['下背',['LOWER_BACK'],1100,550,'left',227],
      ['斜方肌',['TRAPEZIUS'],1180,345,'right',73],
      ['背部',['UPPER_BACK'],1190,455,'right',141],
      ['臀部上',['GLUTEAL'],1180,640,'right',211],
      ['臀部下',['GLUTEAL'],1190,715,'right',252],
      ['腘绳肌',['HAMSTRING'],1200,850,'right',322],
      ['小腿',['CALVES'],1200,1120,'right',383]
    ];
    ctx.save();ctx.font='18px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
    ctx.textBaseline='middle';
    labels.forEach(([label,keys,px,py,edge,ly])=>{
      const lit=keys.some(key=>active.has(key));
      const tx=x+(edge==='left'?0:330), ty=y+ly;
      const endX=x+(edge==='left'?60:270);
      const pointX=bx+(bw-vw*scale)/2+(px-vx)*scale;
      const pointY=by+(bh-vh*scale)/2+(py-vy)*scale;
      ctx.strokeStyle=lit?'#5ea973':'#3e454b';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(pointX,pointY);
      ctx.lineTo(endX+(edge==='left'?12:-12),ty);ctx.lineTo(endX,ty);ctx.stroke();
      ctx.textAlign=edge==='left'?'left':'right';ctx.fillStyle=lit?'#75df8d':'#7d858c';
      ctx.fillText(label,tx,ty);
    });
    ctx.restore();
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
    const gradient=ctx.createLinearGradient(0,0,960,canvas.height);gradient.addColorStop(0,'#17191c');gradient.addColorStop(1,'#202a23');ctx.fillStyle=gradient;ctx.fillRect(0,0,960,canvas.height);
    function text(value,x,y,size=26,color='#e7ebe7',bold=false){ctx.fillStyle=color;ctx.font=(bold?'600 ':'')+size+'px '+font;ctx.fillText(String(value),x,y);}
    function card(x,y,w,h){ctx.fillStyle='#202328';ctx.beginPath();ctx.roundRect(x,y,w,h,30);ctx.fill();}
    text(session.date?session.date+' '+new Intl.DateTimeFormat('zh-CN',{weekday:'long'}).format(new Date(session.date+'T12:00:00')):'日期未填写',42,69,25,'#d5dad6');
    card(36,110,888,620);text($('posterName').value.trim()||'我的训练',76,169,32,'#f2f5f1',true);
    text(posterDraft?'本次训练草稿':'已保存的训练',76,205,20,'#8f9993');
    drawLabeledBody(ctx,summary.shapes,50,235,'front');drawLabeledBody(ctx,summary.shapes,390,235,'back');
    text('正面',192,692,20,'#8f9993');text('背面',532,692,20,'#8f9993');
    const volume=exercises.reduce((sum,ex)=>sum+exerciseVolume(ex),0);
    text(volume.toLocaleString(),755,280,32,'#6fe38a',true);text('总容量（kg）',755,316,20,'#8f9993');
    text(session.duration?session.duration+' 分':'未记录',755,400,30,'#6fe38a',true);text('训练时长',755,437,20,'#8f9993');
    text(session.calories?session.calories+' kcal':'未记录',755,518,26,'#6fe38a',true);text('热量（估算）',755,555,20,'#8f9993');
    text(exercises.length+' 个动作',755,629,24,'#6fe38a',true);
    const muscleText=summary.labels.length?'训练部位：'+summary.labels.join('、'):'训练部位未标注';
    text(muscleText,48,779,23,'#75df8d');
    let y=820;
    const detailHeight=rows.reduce((height,row)=>height+row.title.length*42+row.setRows*55+58,0)+(notes.length?notes.length*34+85:0);
    card(36,y,888,detailHeight+30);y+=45;
    rows.forEach(({ex,title,setRows})=>{
      title.forEach(line=>{text(line,76,y,32,'#f2f5f1',true);y+=42;});
      (ex.sets||[]).forEach((set,index)=>{
        const x=76+(index%3)*274,sy=y+Math.floor(index/3)*55;
        text(index+1,x,sy,18,'#8f9993');
        const weight=set.weight!==''&&set.weight!==undefined&&set.weight!==null?set.weight+'kg × ':'';
        const value=weight+(set.reps!==''&&set.reps!==undefined?set.reps+'次':'次数未填');
        text(value,x+28,sy,23);
        if(set.done)text('✓',x+238,sy,20,'#548362');
      });
      if(!ex.sets?.length)text('组数未记录',76,y,23,'#8f9993');
      y+=setRows*55+16;ctx.strokeStyle='#363d3b';ctx.beginPath();ctx.moveTo(76,y);ctx.lineTo(884,y);ctx.stroke();y+=42;
    });
    if(notes.length){text('训练总结',76,y,28,'#f2f5f1',true);y+=38;notes.forEach(line=>{text(line,76,y,24,'#a1aaa3');y+=34;});}
    text(summary.unknown?summary.unknown+' 个动作未标注肌群 · 可在动作记录中选择部位':'着色表示动作涉及的主要肌群，不代表刺激强度',48,canvas.height-63,19,'#7e8982');
    text('训练日志 · 我的真实打卡',48,canvas.height-28,18,'#7e8982');
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
    const prMap = {};
    sessions.forEach(s => {
      (s.exercises || []).forEach(ex => {
        const rawName = (ex.name || '').trim();
        if (!rawName) return;
        const key = clean(rawName);
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
      let groupKey = item.muscleGroup || (match ? (match.group || muscleGroups[match.target] || '') : '');
      const equipKey = match ? (match.equipment || '') : '';
      const pr = prMap[key] || null;
      return {
        key,
        name: item.name,
        enName: match?.name || '',
        tips: item.tips || '',
        updatedAt: item.updatedAt || (pr?.lastDate || ''),
        match,
        groupKey,
        groupLabel: groups[groupKey] || '力量动作',
        equipLabel: equipment[equipKey] || equipKey || '自由重量',
        pr: pr && pr.maxW > 0 ? pr : null
      };
    });

    const totalCount = items.length;
    const hasTipsCount = items.filter(i => i.tips && i.tips.trim()).length;
    if ($('vaultCountSub')) {
      $('vaultCountSub').textContent = '已沉淀 ' + hasTipsCount + ' 个动作教学要领 · 练习过 ' + totalCount + ' 个动作';
    }

    // 过滤
    items = items.filter(item => {
      if (currentVaultGroup) {
        if (currentVaultGroup === 'arms') {
          if (item.groupKey !== 'biceps' && item.groupKey !== 'triceps' && item.groupKey !== 'arms') return false;
        } else if (item.groupKey !== currentVaultGroup) {
          return false;
        }
      }
      if (query) {
        const text = clean(item.name + ' ' + item.enName + ' ' + item.tips + ' ' + item.groupLabel + ' ' + item.equipLabel);
        if (!text.includes(query)) return false;
      }
      return true;
    });

    // 排序：有 tips 的排在前面，按 updatedAt 降序
    items.sort((a, b) => {
      const hasTipA = Boolean(a.tips && a.tips.trim());
      const hasTipB = Boolean(b.tips && b.tips.trim());
      if (hasTipA !== hasTipB) return hasTipB ? 1 : -1;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });

    if (!items.length) {
      if (totalCount === 0) {
        vaultList.innerHTML = '<div class="vault-empty"><div class="vault-empty-icon">📖</div><strong>还没有沉淀动作教学要领</strong><p style="margin:8px 0 0;">在训练中添加动作并在下方写下教练口诀，<br>保存训练后就会自动在这里生成你的专属动作宝典！</p></div>';
      } else {
        vaultList.innerHTML = '<div class="vault-empty"><p>没有找到符合条件的动作教学要领。</p></div>';
      }
      return;
    }

    vaultList.innerHTML = items.map(item => {
      const match = item.match;
      const thumb = match?.img ? CDN_BASE + match.img : (match?.gif ? CDN_BASE + match.gif : '');
      const gif = match?.gif ? CDN_BASE + match.gif : '';
      const hasTips = Boolean(item.tips && item.tips.trim());

      const mediaHtml = thumb ? (
        '<div class="vault-media-wrap" data-gif="' + gif + '" data-thumb="' + thumb + '" title="点击播放/暂停示范">' +
          '<img src="' + thumb + '" alt="' + escapeHtml(item.name) + ' 3D示范" loading="lazy" decoding="async" referrerpolicy="no-referrer">' +
          (gif ? '<span class="vault-gif-tag">▶ 动图</span>' : '') +
        '</div>'
      ) : (
        '<div class="vault-media-wrap" style="background:#22252a; display:grid; place-items:center; color:var(--green); font-size:22px; font-weight:900;">🏋️</div>'
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
            '<span>💡 教学要领 &amp; 口诀</span>' +
            '<button type="button" class="vault-edit-btn" data-action="edit-tip">✏️ 编辑</button>' +
          '</div>' +
          '<div class="vault-tip-content ' + (hasTips ? '' : 'empty') + '">' +
            (hasTips ? escapeHtml(item.tips) : '尚未记录口诀，在下次训练时填写会自动沉淀在此') +
          '</div>' +
          '<div class="vault-tip-edit-area" hidden>' +
            '<textarea class="vault-edit-textarea" rows="3" maxlength="300" placeholder="如：座椅高度齐胸；下拉先沉肩，手肘往裤兜带；避免耸肩借力...">' + escapeHtml(item.tips || '') + '</textarea>' +
            '<div class="vault-edit-actions">' +
              '<button type="button" class="vault-cancel-btn">取消</button>' +
              '<button type="button" class="vault-save-btn">保存修改</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vault-card-footer">' +
          '<span>' + (item.pr ? '🏆 最佳 <strong>' + item.pr.maxW + 'kg</strong> × ' + item.pr.reps + '次' : '记录已同步') + '</span>' +
          '<span>' + (item.updatedAt ? '更新于 ' + item.updatedAt : '') + '</span>' +
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
          if (tag) { tag.textContent = '▶ 动图'; tag.style.background = 'rgba(0,0,0,.7)'; }
        } else {
          img.src = gif;
          if (tag) { tag.textContent = '■ 播放中'; tag.style.background = 'var(--green)'; tag.style.color = '#102015'; }
        }
      };
    });

    // 事件绑定：编辑与保存口诀
    vaultList.querySelectorAll('.vault-card').forEach(card => {
      const key = card.dataset.vaultKey;
      const editBtn = card.querySelector('[data-action="edit-tip"]');
      const contentEl = card.querySelector('.vault-tip-content');
      const editArea = card.querySelector('.vault-tip-edit-area');
      const textarea = card.querySelector('.vault-edit-textarea');
      const cancelBtn = card.querySelector('.vault-cancel-btn');
      const saveBtn = card.querySelector('.vault-save-btn');

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
      };

      saveBtn.onclick = () => {
        const newTips = textarea.value.trim();
        const d = new Date();
        const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (!vault[key]) {
          vault[key] = { name: card.querySelector('.vault-card-title')?.textContent || key, tips: newTips, updatedAt: todayStr };
        } else {
          vault[key].tips = newTips;
          vault[key].updatedAt = todayStr;
        }
        app().saveVault(vault);
        showToast('已更新「' + vault[key].name + '」教学要领');
        renderVaultList();
      };
    });
  }

  window.renderVaultList = renderVaultList;

  render();
})();

// 中英对照：三种显示模式 —— bi（中英对照，默认）/ zh（只中文）/ en（只英文）。
// 用法：
//   L(zh, en)      纯文本（toast、placeholder、aria-label、confirm、分享文字）；对照模式拼成「中 / 英」
//   L.s(zh, en)    带数字的短值（如「3 个动作」）；对照模式只显示中文，避免一行里重复两遍
//   LH(zh, en)     HTML；对照模式英文作为下方小字（.en）。参数应当是已转义的 HTML 片段
//   静态 HTML 用 data-en / data-en-ph / data-en-aria / data-en-title / data-en-alt 标注，I18N.apply() 统一替换。
// 切换语言时直接刷新页面：草稿实时存在 localStorage，刷新不会丢内容，各模块也不用各自处理重绘。
(() => {
  'use strict';
  const KEY = 'workout-lang';
  const MODES = ['bi', 'zh', 'en'];
  let mode = 'bi';
  try { const saved = localStorage.getItem(KEY); if (MODES.includes(saved)) mode = saved; } catch (e) {}

  const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  // 对照模式下中文已经带了 📤 ＋ 💡 这类前缀符号，英文就不再重复
  const bare = en => String(en).replace(/^[^\p{L}\p{N}<&(]+/u, '');
  function L(zh, en, sep = ' / ') { return mode === 'zh' ? zh : mode === 'en' ? en : zh + sep + bare(en); }
  L.s = (zh, en) => (mode === 'en' ? en : zh);
  function LH(zh, en) { return mode === 'zh' ? zh : mode === 'en' ? en : zh + '<span class="en">' + bare(en) + '</span>'; }

  const ATTRS = [['Ph', 'placeholder'], ['Aria', 'aria-label'], ['Title', 'title'], ['Alt', 'alt']];
  function apply(root = document) {
    root.querySelectorAll('[data-en]').forEach(el => {
      if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML;
      el.innerHTML = LH(el.dataset.zh, esc(el.dataset.en));
    });
    ATTRS.forEach(([suffix, attr]) => {
      root.querySelectorAll('[data-en-' + suffix.toLowerCase() + ']').forEach(el => {
        if (el.dataset['zh' + suffix] === undefined) el.dataset['zh' + suffix] = el.getAttribute(attr) || '';
        el.setAttribute(attr, L(el.dataset['zh' + suffix], el.dataset['en' + suffix]));
      });
    });
    root.querySelectorAll('[data-lang]').forEach(button => {
      const active = button.dataset.lang === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.onclick = () => setMode(button.dataset.lang);
    });
  }
  function setMode(next) {
    if (!MODES.includes(next) || next === mode) return;
    try { localStorage.setItem(KEY, next); } catch (e) {}
    window.location.reload();
  }

  document.documentElement.lang = mode === 'en' ? 'en' : 'zh-CN';
  document.documentElement.dataset.lang = mode;
  document.title = L('训练日志 · 20 次打卡', 'Workout Log · 20 Sessions');
  window.L = L;
  window.LH = LH;
  window.I18N = { get mode() { return mode; }, L, LH, apply, setMode, esc };
})();

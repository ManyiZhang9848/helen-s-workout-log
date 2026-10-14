// 界面语言：en（默认）/ zh。
//   L(zh, en)     界面文案：按当前语言二选一
//   term(zh, en)  专业词汇（肌群、器械等）：英文界面下写成「Chest 胸」，方便对照；中文界面只写中文
//   静态 HTML 用 data-en / data-en-ph / data-en-aria / data-en-title / data-en-alt 标注，I18N.apply() 统一替换。
// 切换语言时直接刷新页面：草稿实时存在 localStorage，刷新不会丢内容，各模块也不用各自处理重绘。
(() => {
  'use strict';
  const KEY = 'workout-lang';
  const MODES = ['en', 'zh'];
  let mode = 'en';
  try { const saved = localStorage.getItem(KEY); if (MODES.includes(saved)) mode = saved; } catch (e) {}

  const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  function L(zh, en) { return mode === 'zh' ? zh : en; }
  function term(zh, en) { return mode === 'zh' ? zh : en + ' ' + zh; }

  const ATTRS = [['Ph', 'placeholder'], ['Aria', 'aria-label'], ['Title', 'title'], ['Alt', 'alt']];
  function apply(root = document) {
    root.querySelectorAll('[data-en]').forEach(el => {
      if (el.dataset.zh === undefined) el.dataset.zh = el.innerHTML;
      el.innerHTML = L(el.dataset.zh, esc(el.dataset.en));
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
  window.I18N = { get mode() { return mode; }, L, term, apply, setMode, esc };
})();

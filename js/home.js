import { SITE, LEVELS, CATEGORIES, EXPERIMENTS } from './catalog.js';
import { store } from './store.js';

const $ = (s, r = document) => r.querySelector(s);
let lvl = 'all', q = '';

function badge(e) {
  if (e.status === 'free') return '<span class="badge free">مجانية ✓</span>';
  if (e.status === 'free-soon') return '<span class="badge soon">مجانية · قيد البناء</span>';
  return '<span class="badge pro">🔒 مميّزة</span>';
}

function render() {
  const wrap = $('#cats');
  wrap.innerHTML = '';
  for (const c of CATEGORIES) {
    const list = EXPERIMENTS.filter(e => e.cat === c.id)
      .filter(e => lvl === 'all' || (lvl === 'free' ? e.status !== 'pro' : e.levels.includes(lvl)))
      .filter(e => !q || (e.ar + ' ' + e.en).toLowerCase().includes(q));
    if (!list.length) continue;
    const sec = document.createElement('section');
    sec.className = 'cat';
    sec.innerHTML = `<h2>${c.icon} ${c.ar} <span class="en">${c.en}</span></h2><p class="desc">${c.desc}</p><div class="grid"></div>`;
    const grid = $('.grid', sec);
    for (const e of list) {
      const best = store.get('best:' + e.id);
      const card = document.createElement(e.status === 'free' ? 'a' : 'div');
      card.className = 'card ' + (e.status === 'free' ? 'playable' : 'locked');
      if (e.status === 'free') { card.href = 'lab.html?exp=' + e.id; card.style.textDecoration = 'none'; card.style.color = 'inherit'; }
      card.innerHTML = `
        <span class="status">${badge(e)}</span>
        <div class="ic">${c.icon}</div>
        <h3>${e.ar}</h3>
        <div class="en">${e.en}</div>
        ${best != null ? `<div class="best">أفضل نتيجة لك: ${best}٪</div>` : ''}
        <div class="meta">${e.levels.map(l => `<span class="badge lvl">${LEVELS[l]}</span>`).join('')}<span class="badge lvl">⏱ ${e.min} دقيقة</span></div>`;
      if (e.status === 'pro') card.addEventListener('click', openPro);
      if (e.status === 'free-soon') card.addEventListener('click', () => alertSoon(e));
      grid.appendChild(card);
    }
    wrap.appendChild(sec);
  }
  if (!wrap.children.length) wrap.innerHTML = '<p style="color:var(--muted);margin-top:30px">لا توجد تجربة تطابق البحث.</p>';
}

function alertSoon(e) {
  const m = $('#proModal');
  $('#proContent').innerHTML = `<p>تجربة «${e.ar}» من التجارب المجانية الخمس، وهي قيد البناء الآن وتُضاف قريبًا.</p><button class="btn" data-close>حسنًا</button>`;
  m.classList.add('open');
}

function openPro() {
  const m = $('#proModal');
  const wa = SITE.whatsapp;
  $('#proContent').innerHTML = `
    <p>الحساب المميّز يفتح جميع تجارب المختبر، ويصلك بعد الاشتراك رمز تفعيل خاص بك يعمل على جهاز واحد أو جهازين على الأكثر.</p>
    <ol style="color:#dbe9ee">
      <li>راسلنا على واتساب لطلب الاشتراك.</li>
      <li>ادفع رسم الاشتراك بالطريقة المتفق عليها.</li>
      <li>يصلك رمز التفعيل، فتدخله في الموقع وتبدأ.</li>
    </ol>
    <p style="color:var(--muted);font-size:.92rem">خانة إدخال رمز التفعيل تُضاف في المرحلة القادمة من بناء الموقع.</p>
    ${wa ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent('أرغب بالاشتراك في الحساب المميّز لمختبر عماد الافتراضي')}">مراسلة على واتساب</a>` : ''}`;
  m.classList.add('open');
}

document.addEventListener('click', ev => {
  if (ev.target.closest('[data-close]') || ev.target.classList.contains('modal')) $('#proModal').classList.remove('open');
});
document.querySelectorAll('.toolbar .chip').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.toolbar .chip').forEach(x => x.classList.toggle('on', x === b));
  lvl = b.dataset.lvl; render();
}));
$('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
$('#proBtn').addEventListener('click', openPro);

const free = EXPERIMENTS.filter(e => e.status !== 'pro').length;
$('#stats').innerHTML = `
  <div class="stat"><b>${EXPERIMENTS.length}</b><small>تجربة في الخطة</small></div>
  <div class="stat"><b>${free}</b><small>تجارب مجانية</small></div>
  <div class="stat"><b>${CATEGORIES.length}</b><small>أقسام علمية</small></div>`;
render();

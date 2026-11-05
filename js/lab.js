import { EXPERIMENTS } from './catalog.js';

const id = new URLSearchParams(location.search).get('exp') || 'microscope-onion';
const meta = EXPERIMENTS.find(e => e.id === id);
const loaders = {
  'microscope-onion': () => import('./experiments/microscope-onion.js'),
};

(async () => {
  if (!meta || meta.status !== 'free' || !loaders[id]) {
    document.getElementById('expTitle').textContent = 'هذه التجربة غير متاحة الآن';
    setTimeout(() => location.href = 'index.html', 1800);
    return;
  }
  try {
    const mod = await loaders[id]();
    window.__lab = await mod.run(document.getElementById('stage3d'));
  } catch (e) {
    console.error(e);
    document.getElementById('expTitle').textContent = 'تعذّر تشغيل المختبر على هذا الجهاز (يحتاج متصفحًا يدعم WebGL)';
  }
})();

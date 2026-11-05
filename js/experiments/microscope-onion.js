// التجربة 1: المجهر الضوئي المركّب وخلايا بشرة البصل
import { LabScene, THREE, ease } from '../scene.js';
import { buildMicroscope, OBJECTIVES } from '../models/microscope.js';
import { buildBench, makeSlide, TOP } from '../models/bench.js';
import { ScopeView, FOV_UM } from '../scope-view.js';
import { makeOnionTissue, addBubbles, drawTissue, drawBubbles, drawDebris, hitTest } from '../specimen-onion.js';
import { Engine } from '../engine.js';

const MIC_POS = new THREE.Vector3(0.32, TOP, -0.12);
const PREP = new THREE.Vector3(-0.3, TOP, 0.1);
const VIEWS = {
  overview: { pos: [0, 1.42, 1.28], target: [0, 0.96, -0.05] },
  prep: { pos: [-0.36, 1.2, 0.5], target: [-0.36, 0.91, 0.02] },
  slide: { pos: [-0.3, 1.07, 0.3], target: [-0.3, 0.905, 0.09] },
  scope: { pos: [0.44, 1.25, 0.52], target: [0.32, 1.06, -0.1] },
  stage: { pos: [0.45, 1.17, 0.24], target: [0.32, 1.11, -0.1] },
  knobs: { pos: [0.75, 1.13, 0.2], target: [0.32, 1.06, -0.16] },
  clean: { pos: [0.62, 1.32, 0.62], target: [0.55, 0.98, -0.12] },
};

const THEORY = `
<h4 id="th-parts">أجزاء المجهر الضوئي المركّب ووظائفها</h4>
<ul class="parts-list">
<li><b>العدسة العينية</b> <span class="en">Eyepiece (Ocular)</span><br>ينظر منها المشاهد، وقوة تكبيرها في مجهرنا 10×.</li>
<li><b>القرص الدوار</b> <span class="en">Revolving nosepiece</span><br>يحمل العدسات الشيئية، وندوّره لاختيار قوة التكبير.</li>
<li><b>العدسات الشيئية</b> <span class="en">Objective lenses</span><br>قريبة من العيّنة: 4× (حلقة حمراء)، 10× (صفراء)، 40× (زرقاء)، 100× (بيضاء، تحتاج زيت الغمر).</li>
<li><b>المنضدة (المسرح)</b> <span class="en">Stage</span><br>توضع عليها الشريحة فوق فتحة يمر منها الضوء.</li>
<li><b>الماسكان</b> <span class="en">Stage clips</span><br>يثبّتان الشريحة على المنضدة.</li>
<li><b>المكثّف</b> <span class="en">Condenser</span><br>يجمع الضوء ويركّزه على العيّنة.</li>
<li><b>الحجاب القزحي</b> <span class="en">Iris diaphragm</span><br>يتحكم في كمية الضوء الداخل وفي تباين الصورة.</li>
<li><b>مصدر الضوء</b> <span class="en">Illuminator</span><br>مصباح في القاعدة يرسل الضوء إلى الأعلى عبر العيّنة.</li>
<li><b>الضابط الكبير (الخشن)</b> <span class="en">Coarse focus knob</span><br>يحرّك المنضدة مسافات كبيرة، ويُستعمل مع العدسة الصغرى فقط.</li>
<li><b>الضابط الصغير (الدقيق)</b> <span class="en">Fine focus knob</span><br>يحرّك المنضدة حركة دقيقة لتوضيح الصورة، وهو الضابط الوحيد المسموح مع 40×.</li>
<li><b>الذراع والقاعدة</b> <span class="en">Arm & Base</span><br>نحمل المجهر بيدين: يد على الذراع وأخرى تحت القاعدة.</li>
</ul>
<h4 id="th-mag">التكبير الكلي وقوة التمييز</h4>
<p>التكبير الكلي يساوي حاصل ضرب تكبير العدسة العينية في تكبير العدسة الشيئية المستعملة:</p>
<div class="formula">Total magnification = Eyepiece × Objective</div>
<p>فمع عدسة عينية 10× وشيئية 40× يصبح التكبير الكلي 400×. أمّا <b>قوة التمييز</b> <span class="en">Resolution</span> فهي قدرة المجهر على إظهار نقطتين متجاورتين منفصلتين، وتبلغ في المجهر الضوئي نحو 0.2 ميكرومتر.</p>
<p>كلما زادت قوة التكبير صغُر <b>مجال الرؤية</b> وقلّ عمق الوضوح، وقلّت المسافة بين العدسة الشيئية والشريحة؛ لذلك نبدأ دائمًا بالعدسة الصغرى.</p>
<p>تظهر الصورة في المجهر الضوئي المركّب <b>مقلوبة ومعكوسة</b>: إذا حرّكت الشريحة نحو اليمين بدت الصورة تتحرك نحو اليسار.</p>
<h4 id="th-wet">تحضير الشريحة الرطبة</h4>
<ol>
<li>ضع قطرة ماء في منتصف شريحة زجاجية نظيفة.</li>
<li>انزع بالملقط طبقة البشرة الرقيقة الشفافة من السطح الداخلي المقعر لورقة البصل الحرشفية، وابسطها في القطرة دون ثنيها.</li>
<li>أضف قطرة من محلول اليود لصبغ النواة والجدار.</li>
<li>المس القطرة بحافة غطاء الشريحة بزاوية نحو 45°، ثم أنزله ببطء حتى يطرد الهواء أمامه فلا تتكوّن فقاعات.</li>
<li>اسحب الصبغة الزائدة بطرف ورق الترشيح.</li>
</ol>
<p class="note">⚠️ محلول اليود يصبغ الجلد والملابس ويهيّج العين؛ لذلك نرتدي المعطف والقفازات والنظارة الواقية.</p>
<h4 id="th-cell">تركيب خلية بشرة البصل</h4>
<ul>
<li><b>الجدار الخلوي</b> <span class="en">Cell wall</span>: من السليلوز، يحدد شكل الخلية المستطيل ويمنحها الدعم.</li>
<li><b>الغشاء البلازمي</b> <span class="en">Cell membrane</span>: يلاصق الجدار من الداخل، ويصعب تمييزه بالمجهر الضوئي.</li>
<li><b>السيتوبلازم</b> <span class="en">Cytoplasm</span>: طبقة رقيقة محيطية مضغوطة نحو الجدار.</li>
<li><b>الفجوة العصارية</b> <span class="en">Central vacuole</span>: كبيرة شفافة تشغل معظم حجم الخلية، وتدفع النواة والسيتوبلازم نحو الأطراف.</li>
<li><b>النواة</b> <span class="en">Nucleus</span>: جسم بيضوي تصبغه مادة اليود باللون البني المصفر، وتظهر فيها نُوية أو أكثر بالتكبير العالي.</li>
</ul>
<p>لا توجد بلاستيدات خضراء في بشرة البصلة؛ لأن الأوراق الحرشفية تنمو مخزنةً داخل البصلة بعيدًا عن الضوء ولا تقوم بالبناء الضوئي.</p>
<h4 id="th-measure">تقدير حجم الخلية بمجال الرؤية</h4>
<p>قطر مجال الرؤية يساوي رقم المجال للعدسة العينية مقسومًا على تكبير العدسة الشيئية. رقم المجال لعدستنا العينية 18 ملم، فيكون:</p>
<div class="formula">4× → 4.5 mm · 10× → 1.8 mm (1800 µm) · 40× → 0.45 mm (450 µm)</div>
<p>إذا اصطفّت على القطر خمس خلايا ونصف تقريبًا بالعدسة 10× فإن طول الخلية ≈ 1800 ÷ 5.5 ≈ 330 ميكرومتر.</p>
<div class="formula">Cell length ≈ Field diameter ÷ number of cells across</div>
<h4 id="th-errors">أخطاء شائعة</h4>
<ul>
<li>البدء بالعدسة 40× أو استعمال الضابط الكبير معها، فتصطدم العدسة بالشريحة وتتكسر.</li>
<li>إنزال الغطاء دفعة واحدة، فتظهر فقاعات هواء دائرية بحواف سوداء سميكة.</li>
<li>أخذ قطعة سميكة من البصل، فلا يمر الضوء وتتراكب الخلايا.</li>
<li>فتح الحجاب القزحي كاملًا مع العيّنة الشفافة، فتضيع التفاصيل في الضوء الشديد.</li>
</ul>`;

const GLOSSARY = [
  ['المجهر الضوئي المركّب', 'Compound light microscope'], ['العدسة العينية', 'Eyepiece / Ocular'], ['العدسة الشيئية', 'Objective lens'],
  ['القرص الدوار', 'Revolving nosepiece'], ['المنضدة', 'Stage'], ['الحجاب القزحي', 'Iris diaphragm'], ['المكثّف', 'Condenser'],
  ['الضابط الكبير', 'Coarse adjustment knob'], ['الضابط الصغير', 'Fine adjustment knob'], ['مجال الرؤية', 'Field of view'],
  ['التكبير الكلي', 'Total magnification'], ['قوة التمييز', 'Resolution'], ['الشريحة الرطبة', 'Wet mount'], ['غطاء الشريحة', 'Cover slip'],
  ['محلول اليود', "Lugol's iodine"], ['البشرة', 'Epidermis'], ['الجدار الخلوي', 'Cell wall'], ['النواة', 'Nucleus'], ['النُّوية', 'Nucleolus'],
  ['السيتوبلازم', 'Cytoplasm'], ['الفجوة العصارية', 'Central vacuole'], ['ميكرومتر', 'Micrometre (µm)'],
];

export async function run(container) {
  try { await Promise.all(['800 40px Tajawal', '500 30px Tajawal'].map(f => document.fonts.load(f))); } catch { }
  const lab = new LabScene(container);
  const mic = buildMicroscope();
  mic.group.position.copy(MIC_POS); lab.scene.add(mic.group);
  const { root, items } = buildBench(); lab.scene.add(root);

  // حالة المجهر كما تركه الطالب السابق: العدسة 40×، والحجاب مفتوح، والمنضدة منخفضة
  mic.setObjective(2); mic.setIris(1); mic.setFocus(8);

  // ===== الشريحة العاملة وما يوضع عليها =====
  const slide = makeSlide(); slide.visible = false; lab.scene.add(slide);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, transparent: true, opacity: .55, roughness: 0, clearcoat: 1, depthWrite: false }));
  drop.scale.set(0.0001, 0.0001, 0.0001); drop.position.y = 0.0012; slide.add(drop);
  const film = new THREE.Mesh(new THREE.PlaneGeometry(0.013, 0.011, 6, 6), new THREE.MeshStandardMaterial({ color: 0xf6f1dc, transparent: true, opacity: .55, side: THREE.DoubleSide, roughness: .4, depthWrite: false }));
  { const p = film.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.random() - .5) * 0.0004); film.geometry.computeVertexNormals(); }
  film.rotation.x = -Math.PI / 2; film.position.y = 0.0016; film.visible = false; slide.add(film);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0004, 0.022), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .3, roughness: 0, clearcoat: 1, depthWrite: false }));
  const coverPivot = new THREE.Object3D(); coverPivot.position.set(-0.011, 0.0016, 0); cover.position.x = 0.011; coverPivot.add(cover); coverPivot.visible = false; slide.add(coverPivot);
  const bubbleMeshes = new THREE.Group(); slide.add(bubbleMeshes);

  const tissue = makeOnionTissue(Math.floor(Math.random() * 99999));
  tissue.stained = false;
  const prep = { slideOut: false, water: false, tissue: false, iodine: false, cover: null, blot: false, onStage: false };

  // ===== منظر العدسة العينية =====
  let scopeHook = null, tapHook = null;
  const scope = new ScopeView({
    microscope: mic,
    onChange: (ev, sv) => scopeHook && scopeHook(ev, sv),
    onTap: (p, ping) => tapHook && tapHook(p, ping),
    drawSpecimen: (g, view) => { drawDebris(g, tissue); if (prep.tissue) drawTissue(g, tissue, view); drawBubbles(g, tissue, view.s); },
  });
  scope.sceneRef = lab;
  scope.objectiveGuard = i => {
    if (OBJECTIVES[i].oil) { E.toast('العدسة 100× عدسة غمر زيتي، ولا نحتاجها في هذه التجربة.', 'warn'); return false; }
    return true;
  };

  // ===== الالتقاط =====
  const L = [
    [items.slideBox, 'slideBox', 'شرائح زجاجية', 'Slides'], [items.coverslips, 'coverslips', 'أغطية الشرائح', 'Cover slips'],
    [items.water, 'water', 'ماء مقطر', 'Distilled water'], [items.iodine, 'iodine', 'محلول اليود', 'Iodine'],
    [items.onion, 'onion', 'ورقة بصل حرشفية', 'Onion scale leaf'], [items.forceps, 'forceps', 'ملقط', 'Forceps'],
    [items.paper, 'paper', 'ورق ترشيح', 'Filter paper'], [items.bin, 'bin', 'وعاء الزجاج المستعمل', 'Glass waste'],
    [slide, 'slide', 'الشريحة', 'Slide'], [mic.parts.switch, 'lampSwitch', 'مفتاح الضوء', 'Light switch'],
    [mic.parts.eyepiece, 'eyepiece', 'العدسة العينية', 'Eyepiece'], [mic.parts.nosepiece, 'nosepiece', 'القرص الدوار', 'Nosepiece'],
    [mic.parts.knobGroupR, 'knobs', 'الضابطان', 'Focus knobs'], [mic.parts.arm, 'arm', 'الذراع', 'Arm'],
  ];
  for (const [o, n, a, e] of L) lab.addPickable(o, n, a, e);
  let pickHook = null;
  lab.onPick = n => {
    if (pickHook && pickHook(n) !== false) return;
    const item = L.find(x => x[1] === n); if (item) E.toast(`هذا: <b>${item[2]}</b> <span class="en">${item[3]}</span>`, 'info', 2200);
  };
  const want = (names, fn) => { lab.setTargets(names); pickHook = n => { if (!names.includes(n)) return false; fn(n); return true; }; };
  const clearWant = () => { lab.setTargets([]); pickHook = null; };

  // ===== أدوات الحركة =====
  const worldPos = o => o.getWorldPosition(new THREE.Vector3());
  const moveArc = (obj, to, h = 0.08, dur = 0.9, rot) => {
    const from = obj.position.clone(); const r0 = obj.rotation.clone();
    return lab.tween(dur, t => { const k = ease(t); obj.position.lerpVectors(from, to, k); obj.position.y += Math.sin(Math.PI * k) * h; if (rot) { obj.rotation.x = r0.x + (rot.x - r0.x) * k; obj.rotation.y = r0.y + (rot.y - r0.y) * k; obj.rotation.z = r0.z + (rot.z - r0.z) * k; } });
  };
  const slideTop = () => worldPos(slide).add(new THREE.Vector3(0, 0.0012, 0));
  async function dropFrom(bottle, color, onLand) {
    const pip = bottle.userData.pipette; const home = pip.position.clone(); const homeParent = pip.parent;
    lab.scene.attach(pip);
    const above = slideTop().add(new THREE.Vector3(0, 0.07, 0));
    const start = pip.position.clone();
    await moveArc(pip, above, 0.05, 0.8);
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 14, 10), new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: .8, roughness: 0, clearcoat: 1 }));
    d.position.copy(above).add(new THREE.Vector3(0, -0.05, 0)); lab.scene.add(d);
    const y0 = d.position.y, y1 = slideTop().y + 0.002;
    await lab.tween(0.35, t => { d.position.y = y0 + (y1 - y0) * t * t; });
    lab.scene.remove(d); onLand && onLand();
    await lab.wait(0.15);
    await moveArc(pip, start, 0.05, 0.7);
    homeParent.attach(pip); pip.position.copy(home); pip.rotation.set(0, 0, 0);
  }
  const spread = (target, r, h, dur = 0.5) => { const s0 = drop.scale.clone(); return lab.tween(dur, t => { const k = ease(t); drop.scale.set(s0.x + (r - s0.x) * k, s0.y + (h - s0.y) * k, s0.z + (r - s0.z) * k); }); };

  // ===== أداة الغطاء =====
  function coverslipTool() {
    return new Promise(res => {
      const m = document.getElementById('toolModal');
      document.getElementById('toolTitle').textContent = 'إنزال غطاء الشريحة';
      const c = document.getElementById('toolContent');
      c.innerHTML = `<div class="cs-wrap"><p style="margin:0">اختر الزاوية التي تلمس بها حافة الغطاء القطرةَ قبل إنزاله، ثم اضغط «أنزل الغطاء».</p>
        <svg viewBox="0 0 300 150" id="csSvg">
          <rect x="20" y="112" width="260" height="8" rx="2" fill="#a5e6f0" opacity=".7"/>
          <path d="M95 112 Q150 84 205 112 Z" fill="#c98a3a" opacity=".55"/>
          <path d="M110 112 h80" stroke="#f6eccb" stroke-width="3"/>
          <g id="csLine"><line x1="98" y1="111" x2="218" y2="111" stroke="#e6f7ff" stroke-width="3.5" stroke-linecap="round"/><circle cx="98" cy="111" r="4" fill="#f59e0b"/></g>
          <text x="150" y="20" text-anchor="middle" fill="#fff" font-size="16" font-weight="700" id="csTxt"></text>
        </svg>
        <label class="slider" style="width:100%">الزاوية<input type="range" min="0" max="90" value="80" id="csAng"></label>
        <button class="btn" id="csGo">أنزل الغطاء ⤵</button></div>`;
      const upd = () => { const a = +c.querySelector('#csAng').value; c.querySelector('#csLine').setAttribute('transform', `rotate(${-a} 98 111)`); c.querySelector('#csTxt').textContent = a + '°'; };
      c.querySelector('#csAng').oninput = upd; upd();
      c.querySelector('#csGo').onclick = () => { const a = +c.querySelector('#csAng').value; m.classList.remove('open'); res(a); };
      m.classList.add('open');
    });
  }

  // ===== الخطوات =====
  let E;
  const scopeBtn = () => [{ t: '👁️ انظر في العدسة العينية', cls: 'open-scope', fn: () => openScope(), grow: true }];
  function openScope() { scope.open(); E.dockAssistant(scope.el.querySelector('.assistant-slot')); }
  scope.onClose = () => { };
  const origClose = scope.close.bind(scope);
  scope.close = () => { origClose(); E.dockAssistant(document.body); };

  const centerOK = () => { const b = tissue.bubbles.find(b => Math.hypot(scope.st.x - b.x, scope.st.y - b.y) < b.r + 40); return tissue.inBlob(scope.st.x, scope.st.y) && !b; };
  let coarseWarned = false;
  const globalScope = (ev, sv) => {
    if (ev === 'crash') { E.mistake('اصطدمت العدسة الشيئية بالشريحة! ارفع العدسة عن الشريحة واستعمل الضابط الصغير مع التكبير العالي.', 10); mic.setFocus(sv.focus - 3); sv.changed('focus'); }
    if (ev === 'coarse' && sv.obj === 2 && !coarseWarned) { coarseWarned = true; E.mistake('لا نستعمل الضابط الكبير مع العدسة 40×؛ فالمسافة بينها وبين الشريحة صغيرة جدًا.', 5); }
  };
  const setScopeHook = fn => { scopeHook = (ev, sv) => { globalScope(ev, sv); fn && fn(ev, sv); }; };
  setScopeHook(null);

  const steps = [
    {
      type: 'info', btn: 'لنبدأ ←',
      enter: () => lab.setView(VIEWS.overview, 0.01),
      say: `<p>مرحبًا بك في مختبر الأحياء! أنا <b>نور</b>، وسأرافقك في هذه التجربة خطوة بخطوة.</p>
            <p><b>مهمتك:</b> وصلت إلى المختبر بصلة، وطلب منك المدرّس أن تُثبت بالمشاهدة أنها مكوّنة من خلايا، وأن تحدد أجزاء الخلية، وأن تقدّر طول الخلية الواحدة بالميكرومتر.</p>
            <p>يمكنك تدوير المشهد بالسحب، والتقريب بإصبعين أو بعجلة الفأرة. ودفتر المختبر 📓 في الأعلى يحوي النظرية وملاحظاتك.</p>`,
    },
    {
      type: 'multi', q: 'ما الذي ترتديه قبل أن تبدأ العمل؟ اختر كل ما يلزم.',
      say: '<p>سلامتك أولًا. سنستعمل شرائح زجاجية وملقطًا ومحلول اليود.</p>',
      items: [{ icon: '🥼', t: 'معطف المختبر', ok: true }, { icon: '🧤', t: 'قفازات', ok: true }, { icon: '🥽', t: 'نظارة واقية', ok: true }, { icon: '🩴', t: 'صندل مفتوح', ok: false }, { icon: '🎧', t: 'سماعات أذن', ok: false }, { icon: '🥤', t: 'كوب عصير', ok: false }],
      explain: 'المعطف والقفازات يحميان من صبغة اليود التي تصبغ الجلد والملابس، والنظارة تحمي العين من رذاذ الصبغة. ولا طعام ولا شراب في المختبر.',
      onCorrect: e => e.record('معدات الوقاية', 'معطف، قفازات، نظارة واقية'),
    },
    {
      type: 'quiz', theory: 'th-parts', enter: () => { lab.setView(VIEWS.scope); lab.setTargets(['arm']); },
      leave: () => lab.setTargets([]),
      q: 'المجهر الآن على المنضدة. لو احتجت إلى نقله، كيف تحمله بأمان؟',
      options: ['بيد واحدة من الذراع', 'بيدين: يد تمسك الذراع وأخرى تسند القاعدة من الأسفل', 'من المنضدة (المسرح)', 'من أنبوب العدسة العينية'],
      correct: 1,
      why: { 0: 'اليد الواحدة لا تكفي؛ المجهر ثقيل وقد ينزلق أو تسقط العدسة العينية.', 2: 'المنضدة جزء متحرك، وحمل المجهر منها يتلفها.', 3: 'العدسة العينية قد تنفصل من مكانها فتسقط وتنكسر.' },
      explain: 'يد على الذراع وأخرى تحت القاعدة، مع إبقاء المجهر قائمًا قريبًا من الجسم.',
    },
    {
      type: 'task', enter: () => { lab.setView(VIEWS.prep); want(['slideBox'], async () => { clearWant(); slide.visible = true; slide.position.copy(worldPos(items.slideBox)).add(new THREE.Vector3(0, 0.035, 0)); slide.rotation.set(0, 0, 0); await moveArc(slide, PREP, 0.06, 0.9); prep.slideOut = true; E.addScore(3, 3); E.done(); }); },
      say: '<p>نبدأ بتحضير <b>شريحة رطبة</b> <span class="en">Wet mount</span>.</p>',
      task: 'اضغط على صندوق الشرائح لتأخذ شريحة نظيفة وتضعها أمامك.', hint: 'صندوق الشرائح الأزرق في يمين المنضدة (من جهتك).',
    },
    {
      type: 'task', enter: () => { lab.setView(VIEWS.slide); want(['water'], async () => { clearWant(); await dropFrom(items.water, 0xdff6ff, () => { drop.scale.set(0.002, 0.0015, 0.002); spread(drop, 0.006, 0.0018); }); prep.water = true; E.addScore(3, 3); E.done(); }); },
      say: '<p>نحتاج وسطًا مائيًا تُبسط فيه العيّنة فلا تجف ولا تتجعّد.</p>', task: 'اضغط على قطّارة <b>الماء المقطر</b> لتضع قطرة واحدة في منتصف الشريحة.',
      hint: 'القارورة الشفافة المكتوب عليها «ماء مقطر».',
    },
    {
      type: 'quiz', theory: 'th-wet', enter: () => lab.setView(VIEWS.prep),
      q: 'أي جزء من البصلة نأخذه لنشاهد خلاياه بوضوح؟',
      options: ['القشرة البنية الجافة الخارجية', 'طبقة البشرة الرقيقة الشفافة من السطح الداخلي المقعر للورقة الحرشفية', 'قطعة سميكة من لحم الورقة الحرشفية', 'جذور البصلة'],
      correct: 1,
      why: { 0: 'القشرة الخارجية خلايا ميتة جافة متراكبة.', 2: 'القطعة السميكة تحوي طبقات كثيرة من الخلايا فلا يمر الضوء منها وتتراكب الصور.', 3: 'الجذور تُستعمل لدراسة الانقسام الخيطي، وليست موضوع تجربتنا اليوم.' },
      explain: 'البشرة الداخلية سمكها طبقة واحدة من الخلايا، فيمر الضوء منها وتظهر كل خلية بحدودها.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.prep);
        want(['onion', 'forceps'], async () => {
          clearWant();
          const fc = items.forceps; const home = fc.position.clone(), hr = fc.rotation.clone();
          await moveArc(fc, worldPos(items.onion).add(new THREE.Vector3(0.02, 0.03, 0.01)), 0.06, 0.8, new THREE.Euler(0, 0.2, 0.25));
          const strip = film.clone(); strip.visible = true; strip.scale.set(.6, .6, .6); lab.scene.add(strip); strip.position.copy(worldPos(fc)).add(new THREE.Vector3(0.05, -0.005, 0));
          await lab.wait(0.3);
          const tgt = slideTop().add(new THREE.Vector3(0.05, 0.02, 0));
          const ffrom = fc.position.clone(); const sfrom = strip.position.clone(); const off = sfrom.clone().sub(ffrom);
          await lab.tween(0.9, t => { const k = ease(t); fc.position.lerpVectors(ffrom, tgt, k); fc.position.y += Math.sin(Math.PI * k) * 0.06; strip.position.copy(fc.position).add(off.clone().multiplyScalar(1 - k * .2)); });
          lab.scene.remove(strip); film.visible = true; film.scale.set(.4, .4, .4);
          await lab.tween(0.5, t => film.scale.setScalar(.4 + .6 * ease(t)));
          await moveArc(fc, home, 0.06, 0.8, hr);
          prep.tissue = true; E.addScore(5, 5); E.record('العيّنة', 'بشرة داخلية من ورقة بصل حرشفية'); E.done();
        });
      },
      say: '<p>اختيار موفق! الآن ننزع طبقة البشرة.</p>', task: 'اضغط على <b>ورقة البصل</b> لتنزع بالملقط طبقة رقيقة من سطحها الداخلي المقعر، وتبسطها في قطرة الماء.',
      hint: 'قطعة البصل الفاتحة فوق لوح التقطيع الخشبي.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.slide);
        want(['iodine'], async () => {
          clearWant();
          await dropFrom(items.iodine, 0x9a5410, () => { drop.material.color.set(0xd59a45); drop.material.opacity = .6; film.material.color.set(0xe8c27a); spread(drop, 0.0068, 0.0019); });
          prep.iodine = true; tissue.stained = true; E.addScore(3, 3); E.record('الصبغة', 'محلول اليود (لوغول)'); E.done();
        });
      },
      say: '<p>خلايا البصل شبه شفافة، ويصعب تمييز أجزائها دون صبغة.</p>', task: 'اضغط على قطّارة <b>محلول اليود</b> لتضيف قطرة فوق العيّنة.',
    },
    {
      type: 'quiz', theory: 'th-cell',
      q: 'لماذا أضفنا محلول اليود؟',
      options: ['ليقتل الخلايا قبل الفحص', 'ليصبغ النواة والجدار الخلوي فيزيد التباين ويوضّح الأجزاء', 'ليكبّر حجم الخلايا', 'ليمنع تبخّر الماء'],
      correct: 1,
      why: { 0: 'هدف الصبغ في هذه التجربة إظهار الأجزاء، وقتل الخلايا ليس غايتنا.', 2: 'الصبغة لا تغيّر حجم الخلايا؛ التكبير وظيفة العدسات.', 3: 'الغطاء هو ما يقلل التبخر.' },
      explain: 'يصبغ اليود النواة والجدار باللون البني المصفر، فتبرز الأجزاء أمام الخلفية المضيئة.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.slide);
        want(['coverslips'], async () => {
          clearWant();
          const a = await coverslipTool();
          coverPivot.visible = true; coverPivot.rotation.z = THREE.MathUtils.degToRad(a);
          await lab.wait(0.2);
          await lab.tween(a < 15 ? 0.15 : 1.2, t => { coverPivot.rotation.z = THREE.MathUtils.degToRad(a) * (1 - ease(t)); });
          drop.scale.set(0.0105, 0.0004, 0.0105); film.position.y = 0.0013;
          let n = 0;
          if (a < 15 || a > 75) n = 5; else if (a < 30 || a > 60) n = 1;
          if (n) {
            addBubbles(tissue, n);
            for (let i = 0; i < n + 2; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0006 + Math.random() * .0012, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: 0, clearcoat: 1 })); b.scale.y = .35; b.position.set((Math.random() - .5) * .016, 0.0015, (Math.random() - .5) * .016); bubbleMeshes.add(b); }
            E.addScore(n === 1 ? 5 : 1, 10);
            E.mistakes.push(`إنزال الغطاء بزاوية ${a}° فتكوّنت فقاعات هواء`);
            E.toast(`تكوّنت ${n === 1 ? 'فقاعة هواء' : 'فقاعات هواء'} تحت الغطاء. ستظهر في المجهر دوائر بحواف سوداء سميكة، فتجنّبها عند الفحص.`, 'warn', 6500);
            prep.cover = 'bubbles';
          } else { E.addScore(10, 10); E.toast('أحسنت! نزل الغطاء دون فقاعات هواء.', 'good'); prep.cover = 'good'; }
          E.record('زاوية إنزال الغطاء', a + '°' + (n ? ' (فقاعات)' : ' (دون فقاعات)'));
          E.done();
        });
      },
      say: '<p>نغطي العيّنة بغطاء زجاجي رقيق. انتبه: طريقة الإنزال تحدد ظهور فقاعات الهواء.</p>', task: 'اضغط على علبة <b>أغطية الشرائح</b>، ثم اختر الزاوية وأنزل الغطاء.',
      hint: 'الزاوية المناسبة قريبة من 45°.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.slide);
        want(['paper'], async () => {
          clearWant();
          const sheet = items.paper.children[items.paper.children.length - 1]; lab.scene.attach(sheet);
          const tgt = slideTop().add(new THREE.Vector3(0.018, 0.001, 0));
          await moveArc(sheet, tgt, 0.05, 0.8);
          await lab.tween(0.6, t => { sheet.material.color.setRGB(1, 1 - .15 * t, 1 - .45 * t); drop.scale.y = 0.0004 * (1 - .3 * t); });
          await moveArc(sheet, worldPos(items.bin).add(new THREE.Vector3(0, 0.12, 0)), 0.1, 0.9);
          sheet.visible = false; prep.blot = true; E.addScore(3, 3); E.done();
        });
      },
      say: '<p>حول الغطاء صبغة زائدة قد تلوّث المنضدة والعدسة.</p>', task: 'اضغط على <b>ورق الترشيح</b> لتسحب الصبغة الزائدة من حافة الغطاء.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.overview);
        want(['slide'], async () => {
          clearWant();
          lab.setView(VIEWS.stage, 1.2);
          const target = mic.parts.mount.getWorldPosition(new THREE.Vector3());
          await moveArc(slide, target.clone().add(new THREE.Vector3(0, 0.004, 0.05)), 0.15, 1.2);
          await moveArc(slide, target, 0.005, 0.5);
          mic.parts.mount.attach(slide); slide.position.set(0, 0, 0); slide.rotation.set(0, 0, 0);
          await lab.tween(0.4, t => { mic.parts.clips.forEach((c, i) => c.rotation.y = (i ? 1 : -1) * 0.35 * (1 - t) + (i ? -1 : 1) * 0.0 * t); });
          prep.onStage = true; scope.st.slide = true; E.addScore(3, 3); E.done();
        });
      },
      say: '<p>الشريحة جاهزة! ننقلها إلى المجهر ونضعها على المنضدة بحيث تقع العيّنة فوق فتحة الضوء، ثم نثبّتها بالماسكين.</p>', task: 'اضغط على <b>الشريحة</b> لتنقلها إلى منضدة المجهر.',
    },
    {
      type: 'quiz', theory: 'th-parts', enter: () => { lab.setView(VIEWS.knobs); lab.setTargets(['knobs']); }, leave: () => lab.setTargets([]),
      q: 'المقبض الكبير الأسود المضيء على جانب المجهر هو:',
      options: ['الضابط الكبير (الخشن)، ويحرّك المنضدة مسافات كبيرة', 'الحجاب القزحي', 'القرص الدوار', 'المكثّف'],
      correct: 0,
      why: { 1: 'الحجاب القزحي تحت المنضدة، وله ذراع صغيرة تفتحه وتغلقه.', 2: 'القرص الدوار فوق المنضدة ويحمل العدسات الشيئية.', 3: 'المكثّف أسطوانة تحت فتحة المنضدة.' },
      explain: 'الضابط الكبير هو القرص الأكبر، والضابط الصغير هو القرص الأصغر الملاصق له.',
    },
    {
      type: 'task', enter: () => {
        lab.setView(VIEWS.stage);
        want(['lampSwitch'], () => { clearWant(); mic.setLamp(0.85); E.addScore(2, 2); E.done(); });
      },
      say: '<p>نحتاج الآن إلى الضوء.</p>', task: 'اضغط على <b>مفتاح الضوء</b> في قاعدة المجهر.',
    },
    {
      type: 'task',
      say: '<p>لاحظ أن العدسة الموجودة فوق الشريحة الآن هي <b>40×</b> (الحلقة الزرقاء)؛ تركها الطالب الذي قبلك.</p>',
      task: 'اختر العدسة الشيئية المناسبة لبدء الفحص.',
      enter: e => {
        lab.setView(VIEWS.stage);
        const box = document.createElement('div'); box.className = 'objs'; box.style.marginTop = '8px';
        box.innerHTML = OBJECTIVES.map((o, i) => `<button class="obj ${i === mic.state.obj ? 'on' : ''}" style="--c:${o.color}" data-i="${i}">${o.mag}×</button>`).join('');
        e.body.appendChild(box);
        let tried = false;
        box.onclick = async ev => {
          const b = ev.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i;
          box.querySelectorAll('.obj').forEach(x => x.classList.toggle('on', x === b));
          if (i === 0) { await mic.setObjective(0, lab); E.addScore(tried ? 4 : 10, 10); E.record('عدسة البداية', '4× (الصغرى)'); E.done(); }
          else { await mic.setObjective(i, lab); if (!tried) { tried = true; E.mistakes.push('اختيار عدسة كبيرة لبدء الفحص'); } E.toast(OBJECTIVES[i].oil ? 'العدسة 100× للغمر الزيتي، ولا تُستعمل للبدء.' : `البدء بالعدسة ${OBJECTIVES[i].mag}× يجعل مجال الرؤية ضيقًا جدًا ويعرّض العدسة لخطر الاصطدام بالشريحة. نبدأ دائمًا بالعدسة الصغرى.`, 'bad', 5500); }
        };
      },
      after: '<p>صحيح! نبدأ دائمًا بأصغر قوة تكبير: مجال الرؤية فيها واسع، وعمق الوضوح كبير، والمسافة بينها وبين الشريحة آمنة.</p>',
    },
    {
      type: 'quiz', theory: 'th-mag',
      q: 'العدسة العينية في مجهرنا 10×، والشيئية الآن 4×. كم التكبير الكلي؟',
      options: ['14×', '40×', '400×', '4×'], correct: 1,
      why: { 0: 'لا نجمع القيمتين؛ التكبير الكلي حاصل ضربهما.', 2: '400× هو التكبير مع الشيئية 40×.', 3: 'هذا تكبير الشيئية وحدها.' },
      explain: 'التكبير الكلي = 10 × 4 = 40 مرة.',
      onCorrect: e => e.record('التكبير الكلي بالعدسة 4×', '40×'),
    },
    {
      type: 'task', say: '<p>حان وقت النظر في المجهر. المنضدة الآن منخفضة والصورة غير واضحة.</p>',
      task: 'افتح منظر العدسة العينية، ثم ارفع المنضدة بـ<b>الضابط الكبير</b> ▲ حتى تتضح الخلايا.',
      hint: 'اضغط مطولًا على ▲ بجوار الضابط الكبير، أو اسحب المقبض نفسه للأعلى. إذا تجاوزت موضع الوضوح فارجع قليلًا، أو استعمل الضابط الصغير للضبط النهائي.',
      buttons: () => scopeBtn(),
      enter: () => {
        lab.setView(VIEWS.scope); scope.lockFocus = false;
        setScopeHook((ev, sv) => { if (sv.isOpen && sv.obj === 0 && sv.isFocused()) { E.addScore(8, 8); E.record('الضبط بالعدسة 4×', 'تم بالضابط الكبير'); setScopeHook(null); E.done(); } });
      },
      after: '<p>رائع، ظهرت الخلايا! هذه شبكة من خلايا مستطيلة متراصّة مثل قطع الطابوق، ولكل منها جدار يحدّها.</p>',
    },
    {
      type: 'task', say: '<p>الحجاب القزحي مفتوح كاملًا، والضوء الشديد يُضعف تباين العيّنة الشفافة فتبهت التفاصيل.</p>',
      task: 'حرّك منزلقة <b>الحجاب القزحي</b> لتقليل الضوء حتى تبرز الجدران والأنوية بوضوح، دون أن تصبح الصورة مظلمة.',
      hint: 'جرّب قيمة قريبة من منتصف المنزلقة، ويمكنك تعديل شدة الضوء أيضًا.',
      buttons: () => scopeBtn(),
      enter: () => {
        let t = null;
        setScopeHook((ev, sv) => { if (ev === 'change:iris' || ev === 'change:lamp') { clearTimeout(t); if (sv.goodLight()) t = setTimeout(() => { if (sv.goodLight()) { E.addScore(6, 6); E.record('الحجاب القزحي', Math.round(mic.state.iris * 100) + '٪ مفتوح'); setScopeHook(null); E.done(); } }, 700); } });
      },
      after: '<p>ممتاز، صار التباين أفضل. تذكّر: الحجاب القزحي يتحكم في كمية الضوء والتباين.</p>',
    },
    {
      type: 'task', say: '<p>قبل التكبير الأعلى، نختار منطقة واضحة من النسيج في وسط مجال الرؤية.</p>',
      task: 'اسحب الصورة بإصبعك أو بالفأرة حتى يقع وسط المجال على خلايا واضحة، بعيدًا عن حافة النسيج وعن أي فقاعة هواء.',
      hint: 'الفقاعة دائرة ذات حافة سوداء سميكة ومركز لامع. والمنطقة الخالية من الخلايا خارج حدود النسيج.',
      buttons: () => [...(scopeBtn()), { t: 'المنطقة في الوسط جيدة ✓', cls: 'ghost', fn: () => { if (centerOK()) { E.addScore(4, 4); setScopeHook(null); E.done(); } else E.toast(tissue.inBlob(scope.st.x, scope.st.y) ? 'وسط المجال قريب من فقاعة هواء. حرّك الشريحة قليلًا.' : 'وسط المجال خارج النسيج. حرّك الشريحة نحو الخلايا.', 'bad'); } }],
      enter: () => setScopeHook(null),
    },
    {
      type: 'task', say: '<p>ننتقل إلى العدسة <b>10×</b> (الحلقة الصفراء). عدسات المجهر الجيد <b>متوافقة البؤرة</b> <span class="en">Parfocal</span>، فتبقى الصورة قريبة من الوضوح.</p>',
      task: 'اختر العدسة 10× من القرص الدوار، ثم وضّح الصورة بـ<b>الضابط الصغير</b>.',
      buttons: () => scopeBtn(),
      enter: () => {
        const c0 = scope.coarseUsedAt[1];
        setScopeHook((ev, sv) => {
          if (ev === 'change:obj' && sv.obj === 2) E.toast('انتقل إلى 10× أولًا، ثم إلى 40×.', 'warn');
          if (sv.obj === 1 && sv.isFocused()) { const used = scope.coarseUsedAt[1] > c0; E.addScore(used ? 4 : 8, 8); if (used) E.toast('وضحت الصورة. الأفضل مع 10× أن تكتفي بالضابط الصغير.', 'warn'); setScopeHook(null); E.done(); }
        });
      },
      after: '<p>أحسنت! التكبير الكلي الآن 10 × 10 = <b>100×</b>.</p>',
    },
    {
      type: 'task', say: `<p>لنقدّر طول الخلية. قطر مجال الرؤية بالعدسة 10× في مجهرنا = <b>1.8 ملم = 1800 ميكرومتر</b>.</p>`,
      task: 'فعّل <b>مسطرة العدسة العينية</b> 📏، وعدّ الخلايا المصطفة على طول الخط الأفقي من حافة المجال إلى حافته، ثم احسب طول الخلية التقريبي واكتبه.',
      hint: 'طول الخلية ≈ 1800 ÷ عدد الخلايا على القطر. إذا رأيت 6 خلايا تقريبًا فطول الخلية ≈ 300 ميكرومتر.',
      theory: 'th-measure',
      enter: e => {
        const f = document.createElement('div'); f.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap';
        f.innerHTML = `<input id="lenIn" type="number" inputmode="decimal" placeholder="الطول بالميكرومتر" style="flex:1;min-width:140px;font:inherit;padding:.55em .8em;border-radius:12px;border:1px solid var(--line);background:#ffffff10;color:#fff"><button class="btn" id="lenGo">تحقّق</button>`;
        e.body.appendChild(f);
        let tries = 0;
        f.querySelector('#lenGo').onclick = () => {
          const v = parseFloat(f.querySelector('#lenIn').value); if (!v) return;
          tries++;
          const true_ = tissue.meanLen, err = Math.abs(v - true_) / true_;
          if (err <= 0.35) {
            E.addScore(tries === 1 ? 12 : 7, 12); E.record('طول خلية بشرة البصل (تقديرك)', Math.round(v) + ' ميكرومتر');
            E.record('متوسط الطول الفعلي في العيّنة', Math.round(true_) + ' ميكرومتر');
            E.toast(`تقدير جيد! متوسط طول الخلايا في عيّنتك ≈ ${Math.round(true_)} ميكرومتر (${(true_ / 1000).toFixed(2)} ملم).`, 'good', 6000);
            setScopeHook(null); E.done();
          } else {
            if (tries === 1) E.mistakes.push('تقدير طول الخلية');
            E.toast(v > true_ ? 'التقدير أكبر من الواقع. أعد عدّ الخلايا على القطر.' : 'التقدير أصغر من الواقع. تأكّد أنك تعدّ الخلايا على طولها (الاتجاه الأفقي).', 'bad', 5000);
          }
        };
        setScopeHook((ev, sv) => { if (ev === 'change:obj' && sv.obj !== 1) E.toast('القياس هنا مبني على قطر المجال بالعدسة 10×.', 'warn'); });
      },
      buttons: () => scopeBtn(),
    },
    {
      type: 'task', say: '<p>الآن التكبير العالي <b>40×</b> (الحلقة الزرقاء). المسافة بين العدسة والشريحة صارت صغيرة جدًا.</p>',
      task: 'اختر العدسة 40×، ثم وضّح الصورة بـ<b>الضابط الصغير فقط</b>.',
      hint: 'حرّك الضابط الصغير خطوات قليلة إلى الأعلى أو الأسفل، وراقب الحواف حتى تصبح حادّة.',
      buttons: () => scopeBtn(),
      enter: () => {
        setScopeHook((ev, sv) => {
          if (sv.obj === 2 && sv.isFocused()) {
            if (!centerOK()) { E.toast('الصورة واضحة، لكن وسط المجال على فقاعة أو خارج النسيج. حرّك الشريحة قليلًا.', 'warn'); return; }
            E.addScore(coarseWarned ? 4 : 10, 10); E.record('الضبط بالعدسة 40×', coarseWarned ? 'استُعمل الضابط الكبير (خطأ)' : 'بالضابط الصغير فقط'); setScopeHook(null); E.done();
          }
        });
      },
      after: '<p>ممتاز! التكبير الكلي الآن <b>400×</b>. لاحظ الجدران المزدوجة، والأنوية البنية، والنُّويات الداكنة داخلها.</p>',
    },
    {
      type: 'task', say: '<p>لنتعرّف على أجزاء الخلية بأنفسنا.</p>', task: 'اضغط داخل منظر المجهر على <b>نواة</b> إحدى الخلايا.',
      buttons: () => scopeBtn(),
      enter: () => {
        let miss = 0; scope.panEnabled = true;
        tapHook = (p, ping) => {
          const h = hitTest(tissue, p.x, p.y, p.tolUm);
          if (h.type === 'nucleus') { ping(true); E.addScore(miss ? 3 : 6, 6); E.record('النواة', 'بيضوية، بنية مصفرة، قرب جدار الخلية، وفيها نُوية'); tapHook = null; E.done(); }
          else { ping(false); miss++; E.toast(NAMES[h.type] ? `هذه ${NAMES[h.type]}. النواة جسم بيضوي بني داكن.` : 'اضغط على جسم بيضوي بني داكن داخل خلية.', 'bad'); }
        };
      },
      after: '<p>صحيح، هذه النواة. لاحظ أنها تقع غالبًا قرب جدار الخلية؛ لأن الفجوة العصارية الكبيرة تدفعها نحو الأطراف.</p>',
    },
    {
      type: 'task', say: '<p>والآن الجزء الذي يحدد شكل الخلية.</p>', task: 'اضغط على <b>الجدار الخلوي</b> لإحدى الخلايا.',
      buttons: () => scopeBtn(),
      enter: () => {
        let miss = 0;
        tapHook = (p, ping) => {
          const h = hitTest(tissue, p.x, p.y, p.tolUm);
          if (h.type === 'wall') { ping(true); E.addScore(miss ? 3 : 6, 6); E.record('الجدار الخلوي', 'واضح، يحدد شكلًا مستطيلًا للخلية'); tapHook = null; E.done(); }
          else { ping(false); miss++; E.toast(NAMES[h.type] ? `هذه ${NAMES[h.type]}. الجدار هو الخط البني الذي يحيط بكل خلية.` : 'اضغط على الخط البني الذي يحيط بالخلية.', 'bad'); }
        };
      },
    },
    {
      type: 'quiz', theory: 'th-cell', enter: () => { tapHook = null; },
      q: 'المنطقة الشفافة الكبيرة التي تشغل معظم داخل الخلية هي:',
      options: ['النواة', 'الفجوة العصارية', 'البلاستيدة الخضراء', 'الغشاء النووي'], correct: 1,
      why: { 0: 'النواة جسم صغير بيضوي.', 2: 'لا توجد بلاستيدات خضراء في بشرة البصلة.', 3: 'الغشاء النووي يحيط بالنواة فقط.' },
      explain: 'الفجوة العصارية المركزية مملوءة بالعصارة الخلوية، وتحفظ للخلية امتلاءها وصلابتها.',
      onCorrect: e => e.record('الفجوة العصارية', 'كبيرة شفافة تشغل معظم الخلية'),
    },
    {
      type: 'quiz', q: 'لماذا لا نرى بلاستيدات خضراء في خلايا بشرة البصلة؟',
      options: ['لأن صبغة اليود أزالتها', 'لأن الأوراق الحرشفية تنمو داخل البصلة بعيدًا عن الضوء ولا تقوم بالبناء الضوئي', 'لأن المجهر الضوئي لا يُظهر البلاستيدات أبدًا', 'لأن الخلايا ميتة'],
      correct: 1,
      why: { 0: 'اليود لا يزيل البلاستيدات؛ هي غير موجودة أصلًا في هذه الخلايا.', 2: 'البلاستيدات الخضراء تُرى بالمجهر الضوئي بوضوح في ورقة نبات الإيلوديا مثلًا.', 3: 'وجود النواة والسيتوبلازم يدل على أن الخلايا كانت حيّة عند أخذها.' },
      explain: 'الأوراق الحرشفية أعضاء خزن، ولا تتعرض للضوء فلا تحتاج إلى بلاستيدات خضراء.',
    },
    {
      type: 'quiz', theory: 'th-mag',
      q: 'إذا حرّكت الشريحة على المنضدة نحو اليمين، ففي أي اتجاه تتحرك الصورة التي تراها في العدسة العينية؟',
      options: ['نحو اليمين', 'نحو اليسار', 'لا تتحرك', 'نحو الأعلى'], correct: 1,
      why: { 0: 'الصورة في المجهر المركّب مقلوبة ومعكوسة، فتتحرك عكس حركة الشريحة.', 2: 'تتحرك الصورة مع أي حركة للشريحة.', 3: 'حركة الشريحة أفقية نحو اليمين.' },
      explain: 'الصورة مقلوبة ومعكوسة؛ لذلك نحرّك الشريحة عكس الاتجاه الذي نريد أن تتحرك إليه الصورة.',
      onCorrect: e => { e.record('صورة المجهر', 'مقلوبة ومعكوسة'); e.snap = scope.snapshot(); },
    },
    {
      type: 'task', say: '<p>انتهى الفحص. المختبر المنظّم جزء من التجربة!</p>',
      task: 'رتّب المجهر: ① أعد القرص الدوار إلى العدسة 4×، ② ارفع الشريحة وضعها في وعاء الزجاج المستعمل لتُغسل، ③ أطفئ الضوء.',
      enter: e => {
        if (scope.isOpen) scope.close();
        lab.setView(VIEWS.clean);
        const done = { obj: false, slide: false, lamp: false };
        const box = document.createElement('div'); box.className = 'objs'; box.style.marginTop = '8px';
        box.innerHTML = OBJECTIVES.map((o, i) => `<button class="obj ${i === mic.state.obj ? 'on' : ''}" style="--c:${o.color}" data-i="${i}">${o.mag}×</button>`).join('');
        e.body.appendChild(box);
        const check = () => { lab.setTargets([!done.slide && 'slide', done.slide && 'bin', !done.lamp && 'lampSwitch', !done.obj && 'nosepiece'].filter(Boolean)); if (done.obj && done.slide && done.lamp) { clearWant(); E.addScore(6, 6); E.done(); } };
        box.onclick = async ev => { const b = ev.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; box.querySelectorAll('.obj').forEach(x => x.classList.toggle('on', x === b)); await mic.setObjective(i, lab); done.obj = i === 0; check(); };
        let carrying = false;
        pickHook = async n => {
          if (n === 'lampSwitch') { mic.setLamp(mic.state.lamp > 0 ? 0 : 0.85); done.lamp = mic.state.lamp === 0; check(); return true; }
          if (n === 'nosepiece') { await mic.setObjective(0, lab); box.querySelectorAll('.obj').forEach((x, i) => x.classList.toggle('on', i === 0)); done.obj = true; check(); return true; }
          if (n === 'slide' && !done.slide && !carrying) {
            carrying = true; lab.scene.attach(slide);
            await lab.tween(0.6, t => { mic.setFocus(mic.state.focus + (10 - mic.state.focus) * t * .2); });
            await moveArc(slide, worldPos(items.bin).add(new THREE.Vector3(0, 0.12, 0)), 0.12, 1.1, new THREE.Euler(0.4, 0, 1.2));
            await lab.tween(0.4, t => { slide.position.y -= 0.002; slide.scale.setScalar(1 - t); });
            slide.visible = false; done.slide = true; scope.st.slide = false; check(); return true;
          }
          return false;
        };
        check();
      },
    },
    {
      type: 'info', btn: '📄 عرض تقرير التجربة',
      enter: () => lab.setView(VIEWS.overview),
      say: `<p>أحسنت! أنجزت التجربة كاملة. 🎉</p><p>شاهدت أن بشرة البصل مكوّنة من خلايا مستطيلة متراصّة، لكل منها جدار خلوي ونواة وفجوة عصارية كبيرة وسيتوبلازم محيطي، وقدّرت طول الخلية بالميكرومتر.</p><p>في المختبر الحقيقي ستتبع الخطوات نفسها، وأنت الآن تعرف أين تقع الأخطاء الشائعة وكيف تتجنّبها.</p>`,
      leave: e => e.report(e.snap),
    },
    { type: 'info', say: '<p>يمكنك طباعة التقرير أو إعادة التجربة لتحسين نتيجتك.</p>', btn: '📄 التقرير', enter: e => e.report(e.snap), buttons: () => [{ t: '↩ قائمة التجارب', cls: 'ghost', fn: () => location.href = 'index.html' }] },
  ];

  const NAMES = { nucleus: 'النواة', wall: 'الجدار الخلوي', cytoplasm: 'منطقة السيتوبلازم', vacuole: 'الفجوة العصارية', bubble: 'فقاعة هواء', none: 'منطقة خارج النسيج' };

  E = new Engine({
    id: 'microscope-onion', title: 'المجهر الضوئي وخلايا بشرة البصل', subtitle: 'Light Microscope & Onion Epidermis',
    steps, theory: THEORY, glossary: GLOSSARY,
    objectives: ['التعرّف على أجزاء المجهر الضوئي المركّب ووظائفها واستعماله بطريقة صحيحة وآمنة.', 'تحضير شريحة رطبة مصبوغة لبشرة البصل دون فقاعات هواء.', 'ضبط الصورة بالعدسات 4× ثم 10× ثم 40×، والتحكم في الإضاءة والتباين.', 'تمييز الجدار الخلوي والنواة والسيتوبلازم والفجوة العصارية.', 'حساب التكبير الكلي وتقدير طول الخلية من قطر مجال الرؤية.'],
    materials: ['مجهر ضوئي مركّب (عينية 10×)', 'شرائح زجاجية وأغطية', 'بصلة وورقة حرشفية', 'ملقط', 'قطّارة ماء مقطر', 'محلول اليود', 'ورق ترشيح', 'معطف وقفازات ونظارة واقية'],
    conclusion: 'تتكوّن بشرة البصل من خلايا نباتية مستطيلة متراصّة، يحيط بكل منها جدار خلوي من السليلوز، وفيها نواة تصبغها مادة اليود، وفجوة عصارية كبيرة، وسيتوبلازم محيطي، ولا تحوي بلاستيدات خضراء. ويُقاس حجم الخلية تقريبًا بمقارنتها بقطر مجال الرؤية المعروف.',
  });
  window.__hit = p => hitTest(tissue, p.x, p.y, p.tolUm).type;
  E.start();
  // مراقبة تحريك العيّنة للحفاظ على التسجيل
  return { lab, mic, scope, E };
}

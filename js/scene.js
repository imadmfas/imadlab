// المشهد الثلاثي الأبعاد العام للمختبر: الغرفة، المنضدة، الإضاءة، الكاميرا، الالتقاط، التمييز
import * as THREE from '../vendor/three.min.js';

export const isMobile = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
export const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export function labelTexture(text, { bg = '#ffffff', fg = '#1b2a33', w = 512, h = 160, font = 64, sub = '', subColor = '#5b6b75', border = '' } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = /[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
    g.font = `800 ${font}px Tajawal, sans-serif`;
    g.fillText(text, w / 2, sub ? h * .4 : h / 2);
    if (sub) { g.fillStyle = subColor; g.font = `600 ${font * .5}px sans-serif`; g.direction = 'ltr'; g.fillText(sub, w / 2, h * .78); }
  });
}

export class LabScene {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.75 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc9d6dc);
    this.scene.fog = new THREE.Fog(0xc9d6dc, 5, 11);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 40);
    this.view = { pos: new THREE.Vector3(0, 1.5, 1.5), target: new THREE.Vector3(0, 0.95, 0) };
    this.orbit = { yaw: 0, pitch: 0, zoom: 1 };
    this.pickables = [];
    this.targets = new Set();
    this.updaters = [];
    this.tweens = [];
    this.labels = new Map();
    this.onPick = null;
    this.last = performance.now(); this.elapsed = 0;

    this.buildEnv();
    this.buildLights();
    this.buildRoom();
    this.bindInput();
    this.resize();
    addEventListener('resize', () => this.resize());
    this.renderer.setAnimationLoop(() => this.loop());
  }

  buildEnv() {
    // بيئة انعكاس بسيطة حتى تظهر المعادن والزجاج بشكل واقعي
    const env = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: 0x8b98a0, side: THREE.BackSide }));
    env.add(room);
    const panel = (w, h, x, y, z, c, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m); };
    panel(6, 2, 0, 2.9, 0, 0xffffff, 0, Math.PI / 2);
    panel(3, 1.5, -4.9, 1.5, 0, 0xf4f8ff, Math.PI / 2);
    panel(3, 1.5, 4.9, 1.5, 1, 0xfff4e0, -Math.PI / 2);
    panel(10, 3, 0, -2.9, 0, 0x30363b, 0, Math.PI / 2);
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(env, 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pm.dispose();
  }

  buildLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xf4f8ff, 0x6b7780, 0.8));
    const d = new THREE.DirectionalLight(0xfff6e8, 2.1);
    d.position.set(1.6, 3.2, 2.0);
    d.castShadow = true;
    d.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    const c = d.shadow.camera; c.left = -1.6; c.right = 1.6; c.top = 1.4; c.bottom = -1.2; c.near = 0.5; c.far = 7;
    d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02; d.shadow.radius = 4;
    s.add(d);
    const fill = new THREE.DirectionalLight(0xdce8ff, 0.55); fill.position.set(-2, 2, 1.5); s.add(fill);
  }

  buildRoom() {
    const s = this.scene;
    // الأرضية
    const floorTex = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#9aa7ad'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 255 : 40},${Math.random() < .5 ? 255 : 50},255,${Math.random() * .05})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      g.strokeStyle = '#7f8b91'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(4, 4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .85 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);

    // الجدار الخلفي مع بلاط
    const tile = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#eef3f4'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#cdd8db'; g.lineWidth = 4;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    });
    tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(3, 1.2);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), new THREE.MeshStandardMaterial({ color: 0xe3eaec, roughness: .95 }));
    wall.position.set(0, 2, -0.75); wall.receiveShadow = true; s.add(wall);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.75), new THREE.MeshStandardMaterial({ map: tile, roughness: .4 }));
    back.position.set(0, 1.3, -0.745); s.add(back);

    // المنضدة: سطح أسود مقاوم للكيمياويات وخزائن بيضاء
    const topMat = new THREE.MeshStandardMaterial({ color: 0x23292e, roughness: .45, metalness: .05 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.04, 1.2), topMat);
    top.position.set(0, 0.88, -0.12); top.receiveShadow = true; top.castShadow = true; s.add(top);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f2, roughness: .7 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x9aa4aa, metalness: .8, roughness: .3 });
    for (let i = 0; i < 4; i++) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.8, 1.1), cabMat);
      cab.position.set(-1.17 + i * 0.78, 0.44, -0.15); cab.castShadow = cab.receiveShadow = true; s.add(cab);
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.02), handleMat);
      h.position.set(cab.position.x, 0.74, 0.41); s.add(h);
    }
    // رف علوي مع زجاجيات للزينة
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.03, 0.28), new THREE.MeshStandardMaterial({ color: 0xd8dfe2, roughness: .6 }));
    shelf.position.set(0, 1.62, -0.6); shelf.castShadow = true; s.add(shelf);
    const glass = (col) => new THREE.MeshPhysicalMaterial({ color: col, roughness: .05, transmission: 0, transparent: true, opacity: .45, metalness: 0, clearcoat: 1 });
    const cols = [0x7dd3fc, 0xfde68a, 0x86efac, 0xfca5a5, 0xc4b5fd, 0xffffff];
    for (let i = 0; i < 9; i++) {
      const r = 0.03 + Math.random() * .03, hgt = 0.09 + Math.random() * .12;
      const m = new THREE.Mesh(i % 3 ? new THREE.CylinderGeometry(r, r, hgt, 20) : new THREE.CylinderGeometry(0.012, r * 1.3, hgt, 20), glass(cols[i % cols.length]));
      m.position.set(-1.3 + i * 0.32, 1.635 + hgt / 2, -0.6 + (Math.random() - .5) * .1); s.add(m);
    }
    // لوحة إرشادات السلامة على الجدار
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({
      map: canvasTexture(500, 300, (g, w, h) => {
        g.fillStyle = '#0f766e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(10, 10, w - 20, h - 20);
        g.fillStyle = '#0f766e'; g.textAlign = 'center'; g.direction = 'rtl'; g.font = '800 40px Tajawal'; g.fillText('قواعد السلامة', w / 2, 60);
        g.fillStyle = '#1b2a33'; g.font = '500 28px Tajawal';
        ['ارتدِ المعطف والنظارة الواقية', 'لا تأكل ولا تشرب في المختبر', 'أبلغ المدرّس عن أي حادث', 'اغسل يديك بعد التجربة'].forEach((t, i) => g.fillText('• ' + t, w / 2, 115 + i * 42));
      }), roughness: .8
    }));
    sign.position.set(-1.05, 2.05, -0.74); s.add(sign);
  }

  // ===== الكاميرا =====
  setView(v, dur = 1.1) {
    const fromP = this.view.pos.clone(), fromT = this.view.target.clone();
    const toP = new THREE.Vector3(...v.pos), toT = new THREE.Vector3(...v.target);
    const o0 = { ...this.orbit };
    return this.tween(dur, t => {
      const k = ease(t);
      this.view.pos.lerpVectors(fromP, toP, k); this.view.target.lerpVectors(fromT, toT, k);
      this.orbit.yaw = lerp(o0.yaw, 0, k); this.orbit.pitch = lerp(o0.pitch, 0, k); this.orbit.zoom = lerp(o0.zoom, 1, k);
    });
  }
  applyCamera() {
    const off = this.view.pos.clone().sub(this.view.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta += this.orbit.yaw; sph.phi = THREE.MathUtils.clamp(sph.phi + this.orbit.pitch, 0.25, 1.5); sph.radius *= this.orbit.zoom;
    this.camera.position.copy(this.view.target).add(new THREE.Vector3().setFromSpherical(sph));
    this.camera.lookAt(this.view.target);
  }

  // ===== حركة زمنية =====
  tween(dur, fn) {
    return new Promise(res => this.tweens.push({ t: 0, dur: Math.max(dur, 0.001), fn, res }));
  }
  wait(s) { return this.tween(s, () => { }); }

  // ===== الالتقاط =====
  addPickable(obj, name, label, en = '') {
    obj.userData.pick = name;
    obj.traverse(o => { if (o.isMesh) { o.userData.pick = name; o.material = o.material.clone(); o.userData.baseEm = o.material.emissive ? o.material.emissive.clone() : null; } });
    this.pickables.push(obj);
    const el = document.createElement('div');
    el.className = 'label3d'; el.style.opacity = 0;
    el.innerHTML = `${label}${en ? `<span class="en">${en}</span>` : ''}`;
    document.body.appendChild(el);
    this.labels.set(name, { el, obj, anchor: obj.userData.labelAnchor || new THREE.Vector3(0, 0.06, 0), show: false });
  }
  setTargets(names = []) {
    this.targets = new Set(names);
    for (const [n, l] of this.labels) { l.el.classList.toggle('tgt', this.targets.has(n)); }
  }
  showLabel(name, on = true) { const l = this.labels.get(name); if (l) l.show = on; }
  showAllLabels(on) { for (const l of this.labels.values()) l.show = on; }

  bindInput() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster(), p = new THREE.Vector2();
    let down = null, pinch = null; const pts = new Map();
    const pickAt = (x, y) => {
      const r = el.getBoundingClientRect();
      p.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(p, this.camera);
      const hits = ray.intersectObjects(this.pickables, true);
      for (const h of hits) { let o = h.object; while (o && !o.userData.pick) o = o.parent; if (o) return o.userData.pick; }
      return null;
    };
    el.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; el.setPointerCapture(e.pointerId); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.orbit.zoom }; } });
    el.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) {
        if (e.pointerType === 'mouse') { const n = pickAt(e.clientX, e.clientY); el.style.cursor = n ? 'pointer' : 'grab'; this.hover = n; }
        return;
      }
      const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); this.orbit.zoom = THREE.MathUtils.clamp(pinch.z * pinch.d / d, 0.6, 1.6); down && (down.moved = true); return; }
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
      if (down?.moved) { this.orbit.yaw = THREE.MathUtils.clamp(this.orbit.yaw - dx * 0.004, -0.7, 0.7); this.orbit.pitch = THREE.MathUtils.clamp(this.orbit.pitch - dy * 0.003, -0.4, 0.35); }
    });
    const up = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (down && !down.moved && performance.now() - down.t < 600) { const n = pickAt(e.clientX, e.clientY); if (n && this.onPick) this.onPick(n); }
      if (!pts.size) down = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); this.orbit.zoom = THREE.MathUtils.clamp(this.orbit.zoom * (1 + Math.sign(e.deltaY) * 0.08), 0.6, 1.6); }, { passive: false });
  }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // في الشاشات العمودية نوسّع زاوية الرؤية حتى تظهر المنضدة
    const portrait = w / h < 0.8;
    this.camera.fov = portrait ? 60 : 42;
    // في الهاتف تغطي لوحة المساعدة أسفل الشاشة، فنرفع مركز المشهد إلى الجزء العلوي
    if (portrait) this.camera.setViewOffset(w, h, 0, h * 0.2, w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  loop() {
    const tn = performance.now(); const dt = Math.min((tn - this.last) / 1000, 0.1); this.last = tn; this.elapsed += dt;
    const now = this.elapsed;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i]; tw.t += dt; const k = Math.min(tw.t / tw.dur, 1); tw.fn(k);
      if (k >= 1) { this.tweens.splice(i, 1); tw.res(); }
    }
    for (const u of this.updaters) u(dt, now);
    // نبض العناصر المطلوبة
    const pulse = (Math.sin(now * 5) + 1) / 2;
    for (const o of this.pickables) {
      const on = this.targets.has(o.userData.pick);
      const hv = this.hover === o.userData.pick;
      o.traverse(m => { if (m.isMesh && m.userData.baseEm && !m.userData.noGlow) { m.material.emissive.copy(m.userData.baseEm); if (on) m.material.emissive.lerp(new THREE.Color(0x14b8a6), 0.25 + 0.35 * pulse); else if (hv) m.material.emissive.lerp(new THREE.Color(0x38bdf8), 0.25); } });
    }
    this.applyCamera();
    this.renderer.render(this.scene, this.camera);
    // مواضع البطاقات
    const w = this.renderer.domElement.clientWidth, h = this.renderer.domElement.clientHeight;
    const v = new THREE.Vector3();
    for (const [n, l] of this.labels) {
      const vis = l.show || this.targets.has(n) || this.hover === n;
      if (!vis || !l.obj.visible) { l.el.style.opacity = 0; continue; }
      l.obj.localToWorld(v.copy(l.anchor)); v.project(this.camera);
      if (v.z > 1) { l.el.style.opacity = 0; continue; }
      l.el.style.opacity = 1;
      l.el.style.left = ((v.x + 1) / 2 * w) + 'px'; l.el.style.top = ((1 - v.y) / 2 * h) + 'px';
      l.el.style.transform = 'translate(-50%,-100%)';
    }
  }
}
export { THREE };

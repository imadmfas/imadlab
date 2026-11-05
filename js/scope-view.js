// منظر العدسة العينية: يرسم العيّنة كما تُرى في المجهر، مع الضوابط والإضاءة والحجاب القزحي
import { OBJECTIVES } from './models/microscope.js';

export const FIELD_NUMBER = 18; // ملم، رقم المجال للعدسة العينية WF10×
export const FOV_UM = OBJECTIVES.map(o => FIELD_NUMBER / o.mag * 1000);
const PARFOCAL = [50, 50.4, 50.7, 50.9];
const BLUR_K = [2.0, 4.6, 13, 28];

export class ScopeView {
  constructor({ microscope, onChange, onTap, drawSpecimen, hitTest }) {
    this.m = microscope; this.onChange = onChange; this.onTap = onTap;
    this.drawSpecimen = drawSpecimen; this.hitTestFn = hitTest;
    this.st = { x: -900, y: 600, slide: false, crashed: false };
    this.coarseUsedAt = [0, 0, 0, 0];
    this.build();
  }

  build() {
    const el = document.createElement('div'); el.className = 'scope'; el.id = 'scope';
    el.innerHTML = `
      <div class="scope-top">
        <button class="btn ghost small" data-act="close">✕ ابتعد عن العدسة العينية</button>
        <span style="flex:1"></span>
        <span>العدسة الشيئية: <b data-k="obj">4×</b></span>
      </div>
      <div class="scope-main">
        <div class="ocular" data-k="ocular">
          <canvas></canvas>
          <svg class="reticle" viewBox="0 0 100 100"><line x1="2" y1="50" x2="98" y2="50" stroke="#111" stroke-width=".35"/>${Array.from({ length: 21 }, (_, i) => `<line x1="${5 + i * 4.5}" x2="${5 + i * 4.5}" y1="${i % 5 ? 48.6 : 47.4}" y2="${i % 5 ? 51.4 : 52.6}" stroke="#111" stroke-width=".35"/>`).join('')}</svg>
          <div class="vig"></div>
          <div class="scope-msg" data-k="msg"></div>
        </div>
        <div class="controls">
          <div class="assistant-slot"></div>
          <div class="ctl-group"><h5>القرص الدوار — العدسات الشيئية</h5><div class="objs" data-k="objs">${OBJECTIVES.map((o, i) => `<button class="obj" style="--c:${o.color}" data-obj="${i}">${o.mag}×</button>`).join('')}</div></div>
          <div class="ctl-group"><h5>الضبط (ارفع المنضدة ▲ أو اخفضها ▼)</h5>
            <div class="knobs">
              <div class="knob-w"><div class="row"><button class="hold" data-hold="c-">▼</button><div class="knob" data-knob="coarse"></div><button class="hold" data-hold="c+">▲</button></div>الضابط الكبير (الخشن)</div>
              <div class="knob-w"><div class="row"><button class="hold" data-hold="f-">▼</button><div class="knob fine" data-knob="fine"></div><button class="hold" data-hold="f+">▲</button></div>الضابط الصغير (الدقيق)</div>
            </div>
          </div>
          <div class="ctl-group"><h5>الإضاءة</h5>
            <label class="slider">💡 الشدة<input type="range" min="0" max="100" data-k="lamp"></label>
            <label class="slider">◐ الحجاب القزحي<input type="range" min="0" max="100" data-k="iris"></label>
            <label class="slider" style="justify-content:space-between"><span>📏 مسطرة العدسة العينية</span><input type="checkbox" data-k="ret" style="flex:none;width:22px;height:22px"></label>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    this.el = el;
    this.q = k => el.querySelector(`[data-k="${k}"]`);
    this.canvas = el.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
    this.ocular = this.q('ocular');

    el.querySelector('[data-act="close"]').onclick = () => this.close();
    this.q('objs').addEventListener('click', e => { const b = e.target.closest('[data-obj]'); if (b) this.requestObjective(+b.dataset.obj); });
    this.q('lamp').addEventListener('input', e => { this.m.setLamp(e.target.value / 100); this.changed('lamp'); });
    this.q('iris').addEventListener('input', e => { this.m.setIris(e.target.value / 100); this.changed('iris'); });
    this.q('ret').addEventListener('change', e => { this.ocular.classList.toggle('ret', e.target.checked); this.changed('ret'); });

    // أزرار الضغط المستمر
    el.querySelectorAll('[data-hold]').forEach(b => {
      let iv = null; const kind = b.dataset.hold;
      const step = () => this.nudge(kind[0] === 'c' ? 'coarse' : 'fine', kind[1] === '+' ? 1 : -1);
      const start = e => { e.preventDefault(); step(); clearInterval(iv); iv = setInterval(step, 70); };
      const stop = () => { clearInterval(iv); iv = null; };
      b.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(x => b.addEventListener(x, stop));
    });
    // سحب المقابض
    el.querySelectorAll('[data-knob]').forEach(k => {
      let last = null, ang = 0; const kind = k.dataset.knob;
      k.addEventListener('pointerdown', e => { last = e.clientY; k.setPointerCapture(e.pointerId); });
      k.addEventListener('pointermove', e => { if (last == null) return; const d = last - e.clientY; last = e.clientY; if (!d) return; ang += d * 2; k.style.transform = `rotate(${ang}deg)`; this.nudge(kind, d * (kind === 'coarse' ? 0.12 : 0.1), true); });
      const up = () => { last = null; }; k.addEventListener('pointerup', up); k.addEventListener('pointercancel', up);
    });
    // تحريك الشريحة والنقر
    let drag = null;
    this.canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', e => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
      if (drag.moved && this.panEnabled !== false) { const k = this.canvas.width / this.canvas.clientWidth / this.scale(); this.st.x += dx * k; this.st.y += dy * k; this.changed('pan'); }
    });
    this.canvas.addEventListener('pointerup', e => {
      if (drag && !drag.moved && this.onTap) {
        const r = this.ocular.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
        const p = this.toSpecimen(e.clientX, e.clientY);
        this.onTap(p, (ok) => this.ping(ox, oy, ok));
      }
      drag = null;
    });
    addEventListener('resize', () => this.layout());
  }

  // ===== الحالة =====
  get obj() { return this.m.state.obj; }
  get focus() { return this.m.state.focus; }
  scale() { const vis = this.canvas.width / 1.12; return vis / FOV_UM[this.obj]; }
  blurPx() { return Math.min(40, BLUR_K[this.obj] * Math.abs(this.focus - PARFOCAL[this.obj])); }
  isFocused(tol = [1.6, 1.4, 1.2, 1.2][this.obj]) { return this.st.slide && this.m.state.lamp > 0.05 && this.blurPx() < tol; }
  brightness() { return this.m.state.lamp * (0.55 + 0.7 * this.m.state.iris); }
  contrast() { return 1.45 - 0.75 * this.m.state.iris; }
  goodLight() { const b = this.brightness(); return b > 0.68 && b < 1.2 && this.contrast() >= 0.95; }

  nudge(kind, dir, raw = false) {
    if (this.lockFocus) return;
    const step = raw ? dir : (kind === 'coarse' ? 0.7 : 0.035) * dir;
    let z = this.focus + step;
    if (kind === 'coarse') this.coarseUsedAt[this.obj]++;
    z = Math.max(0, Math.min(100, z));
    const crash = this.m.crashFocus(this.obj);
    if (this.st.slide && z >= crash) { z = crash - 0.05; if (!this.st.crashHit) { this.st.crashHit = true; this.emit('crash'); } }
    else if (z < crash - 2) this.st.crashHit = false;
    this.m.setFocus(z);
    this.emit(kind === 'coarse' ? 'coarse' : 'fine');
    this.changed('focus');
  }
  requestObjective(i) {
    if (this.objectiveGuard && !this.objectiveGuard(i)) return;
    this.m.setObjective(i, this.sceneRef).then(() => this.changed('obj'));
    this.changed('obj');
  }
  emit(ev) { this.onChange && this.onChange(ev, this); }
  changed(what) { this.syncUI(); this.dirty = true; if (what) this.emit('change:' + what); }

  syncUI() {
    this.q('obj').textContent = OBJECTIVES[this.obj].mag + '×';
    this.el.querySelectorAll('[data-obj]').forEach(b => b.classList.toggle('on', +b.dataset.obj === this.obj));
    this.q('lamp').value = Math.round(this.m.state.lamp * 100);
    this.q('iris').value = Math.round(this.m.state.iris * 100);
  }
  toSpecimen(cx, cy) {
    const r = this.canvas.getBoundingClientRect();
    const k = this.canvas.width / r.width;
    const dx = (cx - r.left) * k - this.canvas.width / 2, dy = (cy - r.top) * k - this.canvas.height / 2;
    const s = this.scale();
    return { x: this.st.x + (-dx) / s, y: this.st.y + (-dy) / s, s, tolUm: 14 / s * k };
  }
  ping(x, y, ok) { const p = document.createElement('div'); p.className = 'ping ' + (ok ? 'ok' : 'no'); p.style.left = x + 'px'; p.style.top = y + 'px'; this.ocular.appendChild(p); setTimeout(() => p.remove(), 700); }
  msg(t) { this.q('msg').textContent = t || ''; this.q('msg').style.display = t ? '' : 'none'; }

  open() {
    this.el.classList.add('open'); this.layout(); this.syncUI(); this.dirty = true; this.isOpen = true;
    if (!this.raf) { const tick = () => { this.raf = requestAnimationFrame(tick); if (this.dirty) { this.dirty = false; this.render(); } }; tick(); }
    this.emit('open');
  }
  close() { this.el.classList.remove('open'); this.isOpen = false; cancelAnimationFrame(this.raf); this.raf = null; this.emit('close'); }

  layout() {
    const mobile = innerWidth < 820;
    const avail = mobile ? Math.min(innerWidth - 40, innerHeight * 0.38) : Math.min(innerHeight - 200, innerWidth - 420, 640);
    const d = Math.max(220, Math.floor(avail));
    this.ocular.style.width = this.ocular.style.height = d + 'px';
    const px = Math.round(d * 1.12 * Math.min(devicePixelRatio, 2));
    if (this.canvas.width !== px) { this.canvas.width = this.canvas.height = px; }
    this.dirty = true;
  }

  render() {
    const c = this.canvas, g = this.ctx, W = c.width;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const lamp = this.m.state.lamp;
    if (lamp < 0.02) { g.fillStyle = '#000'; g.fillRect(0, 0, W, W); c.style.filter = 'none'; this.msg('لا ضوء… شغّل مصدر الضوء'); return; }
    g.fillStyle = '#fbf4de'; g.fillRect(0, 0, W, W);
    // إضاءة غير متجانسة قليلًا
    const lg = g.createRadialGradient(W * .46, W * .44, W * .05, W / 2, W / 2, W * .62);
    lg.addColorStop(0, 'rgba(255,255,248,0.6)'); lg.addColorStop(1, 'rgba(220,200,150,0.25)'); g.fillStyle = lg; g.fillRect(0, 0, W, W);
    if (this.st.slide) {
      const s = this.scale();
      g.translate(W / 2, W / 2); g.rotate(Math.PI); g.scale(s, s); g.translate(-this.st.x, -this.st.y);
      const half = W / 2 / s;
      this.drawSpecimen(g, { x0: this.st.x - half, x1: this.st.x + half, y0: this.st.y - half, y1: this.st.y + half, s });
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    const blur = this.blurPx() * (W / 700);
    c.style.filter = `blur(${blur.toFixed(2)}px) brightness(${this.brightness().toFixed(3)}) contrast(${this.contrast().toFixed(3)})`;
    if (!this.st.slide) this.msg('لا توجد شريحة على المنضدة');
    else if (this.blurPx() > 25) this.msg('الصورة غير واضحة… استعمل الضابط');
    else this.msg('');
  }
  snapshot() {
    // صورة واضحة للتقرير
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = 360; const g = tmp.getContext('2d');
    g.save(); g.beginPath(); g.arc(180, 180, 178, 0, 6.283); g.clip(); g.filter = `brightness(${this.brightness()}) contrast(${this.contrast()})`;
    const src = this.canvas; const cut = src.width * 0.06 / 1.12 * 1.12; g.drawImage(src, src.width * 0.0536, src.width * 0.0536, src.width * 0.893, src.width * 0.893, 0, 0, 360, 360); g.restore();
    return tmp.toDataURL('image/jpeg', 0.85);
  }
}

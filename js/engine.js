// محرك التجربة: الخطوات، المساعدة نور، الأسئلة، الدرجات، دفتر المختبر، التقرير
import { store } from './store.js';

export const NOUR_SVG = `<svg class="avatar" viewBox="0 0 64 64" aria-hidden="true">
  <defs><radialGradient id="nb" cx="40%" cy="35%"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#0d9488"/></radialGradient></defs>
  <ellipse cx="32" cy="58" rx="14" ry="3" fill="#000" opacity=".25"/>
  <circle cx="32" cy="29" r="22" fill="url(#nb)"/>
  <rect x="15" y="20" width="34" height="18" rx="9" fill="#06302c"/>
  <circle cx="25" cy="29" r="4" fill="#a7f3d0"><animate attributeName="r" values="4;1;4" dur="4s" begin="2s" repeatCount="indefinite"/></circle>
  <circle cx="39" cy="29" r="4" fill="#a7f3d0"><animate attributeName="r" values="4;1;4" dur="4s" begin="2s" repeatCount="indefinite"/></circle>
  <path d="M27 40q5 4 10 0" stroke="#06302c" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M32 7v-4" stroke="#0d9488" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="3" r="2.6" fill="#f59e0b"/>
</svg>`;

const $ = (s, r = document) => r.querySelector(s);
const esc = s => s;

export class Engine {
  constructor(exp, ui = {}) {
    this.exp = exp; this.ui = ui;
    this.i = -1; this.score = 0; this.max = 0; this.mistakes = []; this.obs = []; this.t0 = Date.now();
    this.attempt = 0;
    this.buildUI();
  }

  buildUI() {
    document.title = this.exp.title + ' — مختبر عماد الافتراضي';
    $('#expTitle').innerHTML = `${this.exp.title}<small>${this.exp.subtitle || ''}</small>`;
    const as = document.createElement('div'); as.className = 'assistant'; as.id = 'assistant';
    as.innerHTML = `<div class="as-head">${NOUR_SVG}<div class="who">نور<small>مساعدتك في المختبر</small></div><span class="step-n" id="stepN"></span><button class="icon-btn" id="asMin" title="تصغير">▾</button></div>
      <div class="as-body" id="asBody"></div><div class="as-actions" id="asAct"></div>`;
    document.body.appendChild(as);
    this.as = as; this.body = $('#asBody'); this.act = $('#asAct');
    $('#asMin').onclick = () => { as.classList.toggle('min'); $('#asMin').textContent = as.classList.contains('min') ? '▴' : '▾'; };
    this.toastsEl = document.createElement('div'); this.toastsEl.className = 'toasts'; document.body.appendChild(this.toastsEl);
    $('#btnPad').onclick = () => this.openPad('theory');
    this.updateScore();
  }

  // ينقل لوحة المساعدة إلى داخل منظر العدسة أو يعيدها
  dockAssistant(slot) { (slot || document.body).appendChild(this.as); }

  toast(msg, kind = 'info', ms = 3800) {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = msg; this.toastsEl.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  addScore(pts, max = pts) { this.score += pts; this.max += max; this.updateScore(); }
  mistake(msg, max = 5) { this.mistakes.push(msg); this.max += max; this.updateScore(); this.toast('⚠️ ' + msg, 'bad', 5200); }
  pct() { return this.max ? Math.max(0, Math.round(this.score / this.max * 100)) : 100; }
  updateScore() { $('#score').textContent = `⭐ ${this.score}`; }
  record(label, value) { const r = this.obs.find(o => o.label === label); if (r) r.value = value; else this.obs.push({ label, value }); }

  start() { this.next(); }
  next() {
    const prev = this.exp.steps[this.i]; prev?.leave?.(this);
    this.i++;
    const st = this.exp.steps[this.i];
    $('#prog').style.width = (this.i / (this.exp.steps.length - 1) * 100) + '%';
    if (!st) return;
    $('#stepN').textContent = `${this.i + 1} / ${this.exp.steps.length}`;
    this.as.classList.remove('min'); $('#asMin').textContent = '▾';
    this.attempt = 0; this.stepDone = false;
    this.show(st);
    st.enter?.(this);
  }
  done() { if (this.stepDone) return; this.stepDone = true; const st = this.exp.steps[this.i]; if (st.after) { this.say(st.after, [{ t: 'التالي ←', fn: () => this.next() }]); } else this.next(); }

  say(html, buttons = []) {
    this.body.innerHTML = html;
    this.act.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.innerHTML = b.t; el.onclick = b.fn; if (b.grow) el.classList.add('grow');
      this.act.appendChild(el);
    }
    this.body.scrollTop = 0;
  }

  show(st) {
    const theoryBtn = st.theory ? [{ t: '📖 النظرية', cls: 'ghost small', fn: () => this.openPad('theory', st.theory) }] : [];
    if (st.type === 'quiz') return this.showQuiz(st, theoryBtn);
    if (st.type === 'multi') return this.showMulti(st);
    const text = (st.say || '') + (st.task ? `<div class="task">${st.task}</div>` : '');
    const btns = [];
    if (st.type === 'info') btns.push({ t: st.btn || 'التالي ←', fn: () => this.next(), grow: true });
    if (st.type === 'task' && st.hint) btns.push({ t: '💡 تلميح', cls: 'ghost small', fn: () => this.toast(st.hint, 'info', 6000) });
    if (st.buttons) btns.push(...st.buttons(this));
    this.say(text, [...btns, ...theoryBtn]);
  }

  showQuiz(st, extra) {
    const order = st.options.map((o, i) => i);
    if (st.shuffle !== false) order.sort(() => Math.random() - .5);
    this.body.innerHTML = `${st.say || ''}<div class="quiz-q">❓ ${st.q}</div><div class="opts"></div><div class="fb"></div>`;
    const box = $('.opts', this.body);
    let tries = 0, solved = false;
    for (const idx of order) {
      const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = st.options[idx];
      b.onclick = () => {
        if (solved) return; tries++;
        const ok = idx === st.correct;
        b.classList.add(ok ? 'right' : 'wrong');
        const fb = $('.fb', this.body);
        const why = st.why?.[idx];
        if (ok) {
          solved = true; const pts = tries === 1 ? 10 : tries === 2 ? 5 : 2; this.addScore(pts, 10);
          fb.innerHTML = `<div class="feedback good">✅ ${tries === 1 ? 'إجابة صحيحة!' : 'صحيح الآن.'} ${st.explain || ''}</div>`;
          this.act.innerHTML = ''; const n = document.createElement('button'); n.className = 'btn grow'; n.textContent = 'التالي ←'; n.onclick = () => this.next(); this.act.appendChild(n);
          st.onCorrect?.(this);
        } else {
          fb.innerHTML = `<div class="feedback badf">${why || 'ليست هذه الإجابة. فكّر مرة أخرى.'}</div>`;
          if (tries === 1) this.mistakes.push('سؤال: ' + st.q.replace(/<[^>]+>/g, ''));
        }
        this.body.scrollTop = this.body.scrollHeight;
      };
      box.appendChild(b);
    }
    this.act.innerHTML = '';
    for (const e of extra) { const b = document.createElement('button'); b.className = 'btn ' + e.cls; b.innerHTML = e.t; b.onclick = e.fn; this.act.appendChild(b); }
  }

  showMulti(st) {
    // اختيار متعدد بالصور (معدات الوقاية مثلًا)
    this.body.innerHTML = `${st.say || ''}<div class="quiz-q">❓ ${st.q}</div><div class="ppe">${st.items.map((it, i) => `<button data-i="${i}"><span class="e">${it.icon}</span>${it.t}</button>`).join('')}</div><div class="fb"></div>`;
    const sel = new Set(); let tries = 0;
    this.body.querySelectorAll('.ppe button').forEach(b => b.onclick = () => { const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); });
    this.say(this.body.innerHTML, []);
    this.body.querySelectorAll('.ppe button').forEach(b => b.onclick = () => { const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel'); });
    const check = document.createElement('button'); check.className = 'btn grow'; check.textContent = 'تحقّق ✓';
    check.onclick = () => {
      tries++;
      const right = st.items.map((it, i) => it.ok ? i : -1).filter(i => i >= 0);
      const ok = right.length === sel.size && right.every(i => sel.has(i));
      const fb = $('.fb', this.body);
      if (ok) { this.addScore(tries === 1 ? 10 : 5, 10); fb.innerHTML = `<div class="feedback good">✅ ${st.explain}</div>`; check.textContent = 'التالي ←'; check.onclick = () => this.next(); st.onCorrect?.(this); }
      else {
        if (tries === 1) this.mistakes.push('اختيار معدات الوقاية');
        const missing = right.filter(i => !sel.has(i)).length, extra = [...sel].filter(i => !st.items[i].ok).length;
        fb.innerHTML = `<div class="feedback badf">${missing ? `نسيت ${missing === 1 ? 'عنصرًا ضروريًا' : missing + ' عناصر ضرورية'}. ` : ''}${extra ? 'اخترت ما لا يناسب العمل في المختبر.' : ''}</div>`;
      }
      this.body.scrollTop = this.body.scrollHeight;
    };
    this.act.appendChild(check);
  }

  // ===== دفتر المختبر =====
  openPad(tab = 'theory', section) {
    const m = $('#padModal'); m.classList.add('open');
    const tabs = $('#padTabs'), content = $('#padContent');
    const render = (t) => {
      tabs.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.tab === t));
      if (t === 'theory') content.innerHTML = `<div class="theory">${this.exp.theory}</div>`;
      if (t === 'goals') content.innerHTML = `<div class="theory"><h4>أهداف التجربة</h4><ul>${this.exp.objectives.map(o => `<li>${o}</li>`).join('')}</ul><h4>الأدوات والمواد</h4><ul class="parts-list">${this.exp.materials.map(o => `<li>${o}</li>`).join('')}</ul></div>`;
      if (t === 'obs') content.innerHTML = this.obs.length ? this.obs.map(o => `<div class="obs-row"><span>${o.label}</span><span>${o.value}</span></div>`).join('') : '<p style="color:var(--muted)">تُسجَّل ملاحظاتك وقياساتك هنا تلقائيًا في أثناء التجربة.</p>';
      if (t === 'terms') content.innerHTML = `<ul class="parts-list">${this.exp.glossary.map(([a, e]) => `<li><b>${a}</b><br><span class="en">${e}</span></li>`).join('')}</ul>`;
      if (t === 'theory' && section) { const h = content.querySelector('#' + section); h && h.scrollIntoView({ block: 'start' }); }
    };
    tabs.innerHTML = [['theory', '📖 النظرية'], ['goals', '🎯 الأهداف والأدوات'], ['obs', '📝 ملاحظاتي'], ['terms', '🔤 المصطلحات']].map(([k, v]) => `<button class="chip" data-tab="${k}">${v}</button>`).join('');
    tabs.onclick = e => { const c = e.target.closest('[data-tab]'); if (c) { section = null; render(c.dataset.tab); } };
    render(tab);
  }

  // ===== التقرير النهائي =====
  report(img) {
    const p = this.pct();
    const mins = Math.max(1, Math.round((Date.now() - this.t0) / 60000));
    const best = store.get('best:' + this.exp.id);
    if (best == null || p > best) store.set('best:' + this.exp.id, p);
    const grade = p >= 90 ? 'ممتاز' : p >= 80 ? 'جيد جدًا' : p >= 70 ? 'جيد' : p >= 60 ? 'متوسط' : p >= 50 ? 'مقبول' : 'يحتاج إلى إعادة';
    const m = $('#reportModal');
    $('#reportContent').innerHTML = `<div class="report">
      <div class="report-score">
        <div class="ring" style="--p:${p}"><span>${p}٪</span></div>
        <div><h3 style="margin:0">${this.exp.title}</h3><div>التقدير: <b>${grade}</b></div><div style="color:var(--muted)">المدة: ${mins} دقيقة · الأخطاء المسجّلة: ${this.mistakes.length}</div><div style="color:var(--muted)">التاريخ: ${new Date().toLocaleDateString('ar-IQ')}</div></div>
        ${img ? `<img src="${img}" alt="منظر الخلايا بالمجهر">` : ''}
      </div>
      <h4>النتائج والقياسات</h4>${this.obs.map(o => `<div class="obs-row"><span>${o.label}</span><span>${o.value}</span></div>`).join('')}
      <h4>ما يحتاج إلى مراجعة</h4>${this.mistakes.length ? `<ul>${this.mistakes.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p>لم تُسجَّل أخطاء. عمل متقن!</p>'}
      <h4>الاستنتاج</h4><p>${this.exp.conclusion}</p>
      <p style="color:var(--muted);font-size:.85rem">مختبر عماد الافتراضي — إعداد البروفيسور عماد محمد فرحان</p>
      <div class="as-actions no-print"><button class="btn" onclick="print()">🖨️ طباعة التقرير أو حفظه PDF</button><button class="btn ghost" onclick="location.reload()">↻ إعادة التجربة</button><a class="btn ghost" href="index.html">↩ قائمة التجارب</a></div>
    </div>`;
    m.classList.add('open');
  }
}

document.addEventListener('click', e => {
  const m = e.target.closest('.modal');
  if (e.target.closest('[data-close]') && m) m.classList.remove('open');
  else if (e.target.classList.contains('modal') && e.target.id !== 'reportModal') e.target.classList.remove('open');
});

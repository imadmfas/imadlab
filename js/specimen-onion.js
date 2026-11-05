// توليد نسيج بشرة البصل بالميكرومتر، ورسمه، واختبار النقر على مكوّناته
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

export function makeOnionTissue(seed = Date.now() % 100000) {
  const r = rng(seed);
  const blob = { a: r() * 6, b: r() * 6, RX: 4300, RY: 3100 };
  const inBlob = (x, y) => { const th = Math.atan2(y / blob.RY, x / blob.RX); const k = 1 + 0.11 * Math.sin(3 * th + blob.a) + 0.06 * Math.sin(5 * th + blob.b); return (x / blob.RX) ** 2 + (y / blob.RY) ** 2 < k * k; };
  const rows = [];
  let y = -3500;
  const bounds = [];
  while (y < 3500) { bounds.push({ y, ph: r() * 6.28, amp: 3 + r() * 5 }); y += 52 + r() * 34; }
  bounds.push({ y, ph: r() * 6.28, amp: 4 });
  const yAt = (b, x) => b.y + b.amp * Math.sin(x / 260 + b.ph);
  let lengths = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    const top = bounds[k], bot = bounds[k + 1];
    const cells = [];
    let x = -4800 + r() * 200, prevS = (r() - .5) * 30;
    while (x < 4800) {
      const L = Math.min(460, Math.max(170, 290 + gauss(r) * 60));
      const s0 = prevS, s1 = (r() - .5) * 30; prevS = s1;
      const c = { x0: x, x1: x + L, s0, s1, top, bot, k };
      c.cx = x + L / 2; c.cy = (top.y + bot.y) / 2;
      if (inBlob(c.cx, c.cy)) {
        const h = bot.y - top.y;
        // تقع النواة غالبًا قرب الجدار لأن الفجوة العصارية تدفعها إلى الأطراف
        const side = r() < .5 ? -1 : 1;
        const nx = x + L * (0.2 + r() * 0.6);
        const ny = c.cy + side * (h / 2 - 13 - r() * 4);
        const rx = 10 + r() * 3, ry = 8 + r() * 2;
        c.nuc = { x: nx, y: ny, rx, ry, rot: (r() - .5) * .5, nl: Array.from({ length: 1 + (r() < .45 ? 1 : 0) }, () => ({ x: nx + (r() - .5) * rx, y: ny + (r() - .5) * ry * .8, r: 2 + r() * 1.3 })) };
        c.gran = Array.from({ length: 10 }, () => { const t = r(); const up = r() < .5; return { x: x + 8 + t * (L - 16), y: up ? top.y + 4 + r() * 6 : bot.y - 4 - r() * 6, r: .6 + r() * .9 }; });
        cells.push(c); lengths.push(L);
      }
      x += L;
    }
    rows.push({ top, bot, cells });
  }
  const meanLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const meanW = (bounds[bounds.length - 1].y - bounds[0].y) / (bounds.length - 1);
  const debris = Array.from({ length: 60 }, () => ({ x: (r() - .5) * 11000, y: (r() - .5) * 8000, r: 2 + r() * 10, a: .15 + r() * .3 }));
  return { seed, rows, bounds, yAt, inBlob, meanLen, meanW, debris, bubbles: [], stained: true, folded: false };
}

export function addBubbles(t, n = 4, seed = 7) {
  const r = rng(seed + t.seed);
  t.bubbles = Array.from({ length: n }, (_, i) => ({ x: (r() - .5) * 2600 + (i === 0 ? 0 : 0), y: (r() - .5) * 1800, r: i === 0 ? 260 : 60 + r() * 180 }));
  // فقاعة كبيرة قريبة من مركز الحقل الأول حتى يلاحظها الطالب
  t.bubbles[0].x = 380; t.bubbles[0].y = -220;
}

function cellPath(ctx, c, yAt) {
  const n = 5;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const x = c.x0 + c.s0 + (c.x1 + c.s1 - c.x0 - c.s0) * i / n; const y = yAt(c.top, x); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  for (let i = n; i >= 0; i--) { const x = c.x0 - c.s0 + (c.x1 - c.s1 - c.x0 + c.s0) * i / n; ctx.lineTo(x, yAt(c.bot, x)); }
  ctx.closePath();
}

export function drawTissue(ctx, t, view) {
  // view: {x0,x1,y0,y1, s(px/µm)}
  const { s } = view;
  const st = t.stained;
  const px = v => v / s; // تحويل بكسل إلى ميكرومتر
  const hi = s > 0.7, mid = s > 0.25;
  for (const row of t.rows) {
    if (row.bot.y + 10 < view.y0 || row.top.y - 10 > view.y1) continue;
    for (const c of row.cells) {
      if (c.x1 + 20 < view.x0 || c.x0 - 20 > view.x1) continue;
      cellPath(ctx, c, t.yAt);
      ctx.fillStyle = st ? 'rgba(232,196,118,0.30)' : 'rgba(190,195,185,0.10)';
      ctx.fill();
      if (mid) {
        ctx.save(); ctx.clip();
        ctx.lineWidth = hi ? 11 : 9; ctx.strokeStyle = st ? 'rgba(196,140,58,0.30)' : 'rgba(150,155,145,0.10)'; ctx.stroke();
        if (hi) { ctx.fillStyle = st ? 'rgba(150,95,35,0.55)' : 'rgba(120,120,110,0.18)'; for (const g of c.gran) { ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 6.283); ctx.fill(); } }
        ctx.restore();
      }
      // النواة
      const n = c.nuc;
      ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.rot);
      const grd = ctx.createRadialGradient(-n.rx * .25, -n.ry * .25, 1, 0, 0, n.rx);
      if (st) { grd.addColorStop(0, 'rgba(176,104,40,0.80)'); grd.addColorStop(.75, 'rgba(140,76,22,0.88)'); grd.addColorStop(1, 'rgba(98,50,12,0.95)'); }
      else { grd.addColorStop(0, 'rgba(170,170,160,0.16)'); grd.addColorStop(1, 'rgba(120,120,110,0.26)'); }
      ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(0, 0, n.rx, n.ry, 0, 0, 6.283); ctx.fill();
      ctx.lineWidth = Math.max(px(1), 1.2); ctx.strokeStyle = st ? 'rgba(80,38,8,0.85)' : 'rgba(110,110,100,0.25)'; ctx.stroke();
      ctx.restore();
      if (hi) { ctx.fillStyle = st ? 'rgba(62,26,4,0.92)' : 'rgba(90,90,80,0.3)'; for (const l of n.nl) { ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, 6.283); ctx.fill(); } }
    }
  }
  // الجدران فوق كل شيء
  for (const row of t.rows) {
    if (row.bot.y + 10 < view.y0 || row.top.y - 10 > view.y1) continue;
    for (const c of row.cells) {
      if (c.x1 + 20 < view.x0 || c.x0 - 20 > view.x1) continue;
      cellPath(ctx, c, t.yAt);
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(px(1.1), hi ? 3.2 : 2.4);
      ctx.strokeStyle = st ? 'rgba(110,62,18,0.80)' : 'rgba(110,115,105,0.30)'; ctx.stroke();
      if (hi) { ctx.lineWidth = 0.9; ctx.strokeStyle = st ? 'rgba(245,214,150,0.65)' : 'rgba(230,230,220,0.25)'; ctx.stroke(); }
    }
  }
}

export function drawBubbles(ctx, t, s) {
  for (const b of t.bubbles) {
    const g = ctx.createRadialGradient(b.x - b.r * .2, b.y - b.r * .2, b.r * .1, b.x, b.y, b.r);
    g.addColorStop(0, 'rgba(255,255,250,0.95)'); g.addColorStop(.72, 'rgba(250,248,240,0.6)'); g.addColorStop(.82, 'rgba(40,30,20,0.85)'); g.addColorStop(.93, 'rgba(15,10,5,0.95)'); g.addColorStop(1, 'rgba(90,80,60,0.4)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
  }
}

export function drawDebris(ctx, t) {
  for (const d of t.debris) { ctx.fillStyle = `rgba(70,55,35,${d.a})`; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * .6, d.x, 0, 6.283); ctx.fill(); }
}

function pointInPoly(x, y, c, yAt) {
  const yt = yAt(c.top, x), yb = yAt(c.bot, x);
  if (y < yt || y > yb) return false;
  const f = (y - yt) / Math.max(yb - yt, 1);
  const xl = c.x0 + c.s0 - 2 * c.s0 * f, xr = c.x1 + c.s1 - 2 * c.s1 * f;
  return x >= xl && x <= xr;
}

export function hitTest(t, x, y, tolUm) {
  for (const b of t.bubbles) if (Math.hypot(x - b.x, y - b.y) < b.r) return { type: 'bubble' };
  for (const row of t.rows) {
    if (y < row.top.y - 20 || y > row.bot.y + 20) continue;
    for (const c of row.cells) {
      if (x < c.x0 - 30 || x > c.x1 + 30) continue;
      const n = c.nuc; const dx = x - n.x, dy = y - n.y;
      const cs = Math.cos(-n.rot), sn = Math.sin(-n.rot); const u = dx * cs - dy * sn, v = dx * sn + dy * cs;
      if ((u / (n.rx + tolUm * .4)) ** 2 + (v / (n.ry + tolUm * .4)) ** 2 <= 1) return { type: 'nucleus', cell: c };
      const yt = t.yAt(c.top, x), yb = t.yAt(c.bot, x);
      const f = (y - yt) / Math.max(yb - yt, 1);
      const xl = c.x0 + c.s0 - 2 * c.s0 * f, xr = c.x1 + c.s1 - 2 * c.s1 * f;
      const inside = pointInPoly(x, y, c, t.yAt);
      const dWall = Math.min(Math.abs(y - yt), Math.abs(y - yb), Math.abs(x - xl), Math.abs(x - xr));
      if ((inside || dWall < tolUm) && dWall < tolUm) return { type: 'wall', cell: c };
      if (inside) {
        if (dWall < 12 || Math.hypot(dx, dy) < n.rx * 1.8) return { type: 'cytoplasm', cell: c };
        return { type: 'vacuole', cell: c };
      }
    }
  }
  return { type: 'none' };
}

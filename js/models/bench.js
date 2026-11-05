// أدوات منضدة التحضير: الشرائح، الأغطية، القطّارات، البصل، الملقط، ورق الترشيح
import { THREE, labelTexture, canvasTexture } from '../scene.js';

export const TOP = 0.90;
const glassMat = (c = 0xdff3ff, o = .38) => new THREE.MeshPhysicalMaterial({ color: c, roughness: .04, metalness: 0, transparent: true, opacity: o, clearcoat: 1, clearcoatRoughness: .05, depthWrite: false });
const std = (c, r = .5, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const shadow = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

export function makeSlide() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.0012, 0.026), glassMat(0xe6fbff, .45));
  plate.position.y = 0.0006; plate.renderOrder = 2; g.add(plate);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.0762, 0.0011, 0.0262), new THREE.MeshBasicMaterial({ color: 0x9fd8d2, transparent: true, opacity: .35, wireframe: true }));
  edge.position.y = 0.0006; g.add(edge);
  const frost = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.0013, 0.0262), std(0xf4f4f0, .9));
  frost.position.set(-0.029, 0.00065, 0); g.add(frost);
  g.userData.labelAnchor = new THREE.Vector3(0, 0.02, 0);
  return g;
}

function dropperBottle(bodyColor, opacity, label, sub) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.018, 0.055, 32), glassMat(bodyColor, opacity)); body.position.y = 0.0275; g.add(body);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0165, 0.038, 32), new THREE.MeshStandardMaterial({ color: bodyColor, roughness: .1, transparent: true, opacity: .55 })); liquid.position.y = 0.02; g.add(liquid);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.013, 0.008, 24), glassMat(bodyColor, opacity)); neck.position.y = 0.059; g.add(neck);
  const pip = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, 0.008, 24), std(0x1d2226, .6)); collar.position.y = 0.004; pip.add(collar);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 20, 14), std(0x262b2f, .55)); bulb.scale.y = 1.5; bulb.position.y = 0.019; pip.add(bulb);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0012, 0.05, 10), glassMat(0xffffff, .5)); stem.position.y = -0.024; pip.add(stem);
  pip.position.y = 0.063; g.add(pip); g.userData.pipette = pip;
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.01805, 0.01805, 0.024, 32, 1, true, -Math.PI * .45, Math.PI * .9),
    new THREE.MeshStandardMaterial({ map: labelTexture(label, { w: 512, h: 200, font: 72, sub }), roughness: .8 }));
  tag.position.y = 0.026; g.add(tag);
  g.userData.labelAnchor = new THREE.Vector3(0, 0.1, 0);
  return shadow(g);
}

function onionBulb() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; const y = t * 0.085; const r = Math.sin(Math.PI * Math.pow(t, 0.85)) * 0.042 * (1 - Math.pow(t, 6) * .75) + (t > .92 ? 0.002 : 0); pts.push(new THREE.Vector2(Math.max(r, 0.001), y)); }
  const skinTex = canvasTexture(256, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d8a46a'); gr.addColorStop(.5, '#b8743d'); gr.addColorStop(1, '#8a4f26');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(80,40,15,${.15 + Math.random() * .25})`; c.lineWidth = 1 + Math.random() * 2; const x = Math.random() * w; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 10, h * .3, x - 10, h * .7, x + 4, h); c.stroke(); }
  });
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ map: skinTex, roughness: .7 }));
  g.add(bulb);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.02, 10), std(0x9a6a38, .8)); tip.position.y = 0.093; g.add(tip);
  return g;
}

function onionScale() {
  // قطعة من ورقة حرشفية مقطوعة: سطح محدب خارجي وسطح داخلي مقعر لامع
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.04, 32, 16, 0, Math.PI * 0.75, Math.PI * 0.18, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0xf4ecd2, roughness: .35, side: THREE.DoubleSide }));
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.036, 32, 16, 0, Math.PI * 0.75, Math.PI * 0.18, Math.PI * 0.5), new THREE.MeshPhysicalMaterial({ color: 0xfbf7e4, roughness: .12, clearcoat: 1, side: THREE.DoubleSide }));
  g.add(outer, inner);
  g.rotation.set(-Math.PI / 2, 0, 0.4); g.position.y = 0.0;
  const wrap = new THREE.Group(); wrap.add(g); g.position.y = 0.004;
  wrap.userData.labelAnchor = new THREE.Vector3(0, 0.05, 0);
  return wrap;
}

function forceps() {
  const g = new THREE.Group(); const m = std(0xd4d9dc, .22, .95);
  for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.0025, 0.005), m); arm.position.set(0, 0.002, s * 0.004); arm.rotation.y = s * 0.05; g.add(arm); }
  const joint = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.01), m); joint.position.set(-0.052, 0.002, 0); g.add(joint);
  g.userData.labelAnchor = new THREE.Vector3(0, 0.02, 0);
  return shadow(g);
}

export function buildBench() {
  const items = {};
  const root = new THREE.Group();

  // صندوق الشرائح
  const box = new THREE.Group();
  const boxBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.05), std(0x2f6f9a, .6)); boxBody.position.y = 0.011; box.add(boxBody);
  for (let i = 0; i < 6; i++) { const s = makeSlide(); s.position.set(0, 0.022 + i * 0.0014, 0); s.children[0].material = glassMat(0xe6fbff, .6); box.add(s); }
  const boxLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.016), new THREE.MeshStandardMaterial({ map: labelTexture('شرائح زجاجية', { sub: 'Microscope slides', font: 64 }) }));
  boxLbl.position.set(0, 0.011, 0.0252); box.add(boxLbl);
  box.position.set(-0.66, TOP, -0.02); box.rotation.y = 0.15; root.add(shadow(box)); items.slideBox = box;
  box.userData.labelAnchor = new THREE.Vector3(0, 0.05, 0);

  // علبة أغطية الشرائح
  const cs = new THREE.Group();
  const csb = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 32), glassMat(0xffffff, .4)); csb.position.y = 0.006; cs.add(csb);
  const csLid = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.004, 32), std(0x1f2937, .5)); csLid.position.y = 0.014; cs.add(csLid);
  const csTag = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.012), new THREE.MeshStandardMaterial({ map: labelTexture('أغطية الشرائح', { sub: 'Cover slips', font: 64 }) }));
  csTag.rotation.x = -Math.PI / 2; csTag.position.y = 0.0162; cs.add(csTag);
  cs.position.set(-0.6, TOP, 0.16); root.add(shadow(cs)); items.coverslips = cs;
  cs.userData.labelAnchor = new THREE.Vector3(0, 0.04, 0);

  // قطّارة الماء والصبغة
  const water = dropperBottle(0xcdeeff, .35, 'ماء مقطر', 'Distilled water'); water.position.set(-0.48, TOP, 0.2); root.add(water); items.water = water;
  const iodine = dropperBottle(0x8a4b0f, .75, 'محلول اليود', "Lugol's iodine"); iodine.position.set(-0.4, TOP, -0.14); root.add(iodine); items.iodine = iodine;

  // البصل
  const bulb = onionBulb(); bulb.position.set(-0.1, TOP, -0.2); root.add(shadow(bulb));
  const scale = onionScale(); scale.position.set(-0.14, TOP, 0.03); root.add(shadow(scale)); items.onion = scale;
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.14), std(0xd9b98a, .8)); board.position.set(-0.13, TOP + 0.006, -0.05); board.receiveShadow = true; root.add(board);
  bulb.position.y = TOP + 0.012; scale.position.set(-0.17, TOP + 0.012, -0.03);
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.001, 0.012), std(0xe5e7eb, .2, .9)); blade.position.x = 0.03; knife.add(blade);
  const hndl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.012), std(0x111827, .6)); hndl.position.x = -0.025; knife.add(hndl);
  knife.position.set(-0.08, TOP + 0.016, 0.0); knife.rotation.y = -0.6; root.add(shadow(knife));

  // الملقط
  const fc = forceps(); fc.position.set(-0.25, TOP, 0.2); fc.rotation.y = 0.5; root.add(fc); items.forceps = fc;

  // ورق الترشيح
  const paper = new THREE.Group();
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.0006, 40), std(0xfbfbf7, .95)); p.position.y = 0.0004 + i * 0.0007; p.rotation.y = i; paper.add(p); }
  paper.position.set(-0.02, TOP, 0.21); root.add(shadow(paper)); items.paper = paper;
  paper.userData.labelAnchor = new THREE.Vector3(0, 0.03, 0);

  // دورق وأدوات للزينة
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 32, 1, true), glassMat(0xffffff, .3)); beaker.position.set(-0.85, TOP + 0.045, -0.2); root.add(beaker);
  const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.04, 32), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: .4 })); bw.position.set(-0.85, TOP + 0.02, -0.2); root.add(bw);
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.21), std(0x0f766e, .7)); book.position.set(0.78, TOP + 0.006, 0.08); book.rotation.y = -0.2; root.add(shadow(book));
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.2), new THREE.MeshStandardMaterial({ map: canvasTexture(300, 400, (g, w, h) => { g.fillStyle = '#fffdf5'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a5c8e4'; for (let y = 50; y < h; y += 22) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); } g.fillStyle = '#0f766e'; g.font = '800 30px Tajawal'; g.textAlign = 'center'; g.fillText('دفتر المختبر', w / 2, 36); }) }));
  pg.rotation.x = -Math.PI / 2; pg.position.set(0.78, TOP + 0.0125, 0.08); pg.rotation.z = -0.2; root.add(pg);
  // حاوية النفايات الزجاجية
  const bin = new THREE.Group();
  const binB = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 28), std(0xf59e0b, .6)); binB.position.y = 0.05; bin.add(binB);
  const binL = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshStandardMaterial({ map: labelTexture('زجاج مستعمل', { bg: '#f59e0b', fg: '#1b1b1b', font: 66, sub: 'Used glass' }) }));
  binL.position.set(0, 0.06, 0.0505); bin.add(binL);
  bin.position.set(0.9, TOP, -0.2); root.add(shadow(bin)); items.bin = bin;
  bin.userData.labelAnchor = new THREE.Vector3(0, 0.13, 0);

  return { root, items };
}

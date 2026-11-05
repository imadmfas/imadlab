// نموذج مجهر ضوئي مركّب أحادي العدسة العينية، مبني من أشكال هندسية
import { THREE, ease, labelTexture } from '../scene.js';

export const OBJECTIVES = [
  { mag: 4, color: '#ef4444', hex: 0xef4444, len: 0.022, na: 0.10 },
  { mag: 10, color: '#facc15', hex: 0xfacc15, len: 0.030, na: 0.25 },
  { mag: 40, color: '#38bdf8', hex: 0x38bdf8, len: 0.040, na: 0.65 },
  { mag: 100, color: '#f8fafc', hex: 0xf8fafc, len: 0.042, na: 1.25, oil: true },
];
const Z0 = 0.02;             // محور الضوء
const NOSE_Y = 0.282;        // مركز القرص الدوار
const FOCUS_TOP = 0.2285;    // ارتفاع سطح الشريحة عند وضوح الصورة
const STAGE_T = 0.01;
export const FOCUS_UNIT = 0.0006; // متر لكل وحدة ضبط

function rbox(w, h, d, r, mat) {
  const s = new THREE.Shape(); const x = -w / 2 + r, y = -d / 2 + r, W = w - 2 * r, D = d - 2 * r;
  s.moveTo(x, y - r); s.lineTo(x + W, y - r); s.quadraticCurveTo(x + W + r, y - r, x + W + r, y);
  s.lineTo(x + W + r, y + D); s.quadraticCurveTo(x + W + r, y + D + r, x + W, y + D + r);
  s.lineTo(x, y + D + r); s.quadraticCurveTo(x - r, y + D + r, x - r, y + D); s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, 0.002, 0);
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}
const cyl = (rt, rb, h, mat, seg = 32) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };

export function buildMicroscope() {
  const M = {
    body: new THREE.MeshStandardMaterial({ color: 0xf1f0ea, roughness: .42, metalness: .05 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a3034, roughness: .5, metalness: .2 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141719, roughness: .65 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: .18, metalness: .95 }),
    lens: new THREE.MeshStandardMaterial({ color: 0x8fb8d0, roughness: .05, metalness: .3, emissive: 0x000000 }),
  };
  const g = new THREE.Group(); g.name = 'microscope';
  const parts = {};

  // القاعدة
  const base = rbox(0.19, 0.035, 0.23, 0.03, M.body); base.position.set(0, 0, 0.01); g.add(base); parts.base = base;
  const baseTrim = rbox(0.194, 0.006, 0.234, 0.031, M.dark); baseTrim.position.set(0, 0, 0.01); g.add(baseTrim);
  // مصدر الضوء
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xdcd6c4, emissive: 0x000000, roughness: .2 });
  const lamp = cyl(0.02, 0.023, 0.008, lampMat); lamp.position.set(0, 0.039, Z0); g.add(lamp); parts.lamp = lamp;
  const lampRing = cyl(0.026, 0.026, 0.005, M.dark); lampRing.position.set(0, 0.037, Z0); g.add(lampRing);
  // مفتاح الإضاءة ومنظم الشدة
  const sw = new THREE.Group();
  const swBody = rbox(0.018, 0.014, 0.026, 0.004, M.black); sw.add(swBody);
  const swRock = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.016), new THREE.MeshStandardMaterial({ color: 0x2f3a40, roughness: .4 }));
  swRock.position.y = 0.015; sw.add(swRock); swRock.rotation.x = -0.25;
  sw.position.set(0.082, 0.035, 0.085); g.add(sw); parts.switch = sw; parts.swRock = swRock;
  sw.userData.labelAnchor = new THREE.Vector3(0, 0.03, 0);
  const dial = cyl(0.014, 0.014, 0.012, M.dark); dial.rotation.z = Math.PI / 2; dial.position.set(-0.098, 0.02, 0.06); g.add(dial); parts.dial = dial;

  // الذراع
  const arm = rbox(0.056, 0.30, 0.062, 0.018, M.body); arm.position.set(0, 0.03, -0.072); g.add(arm); parts.arm = arm;
  arm.userData.labelAnchor = new THREE.Vector3(0, 0.22, 0);
  const armStripe = rbox(0.058, 0.12, 0.02, 0.008, M.dark); armStripe.position.set(0, 0.09, -0.098); g.add(armStripe);
  // الرأس
  const head = rbox(0.072, 0.056, 0.14, 0.022, M.body); head.position.set(0, 0.29, -0.035); g.add(head); parts.head = head;
  // أنبوب العدسة العينية (مائل 45°)
  const ep = new THREE.Group();
  const tube = cyl(0.0135, 0.016, 0.075, M.body); tube.position.y = 0.0375; ep.add(tube);
  const cap = cyl(0.0155, 0.0155, 0.03, M.black); cap.position.y = 0.088; ep.add(cap);
  const ring = cyl(0.016, 0.016, 0.004, M.chrome); ring.position.y = 0.073; ep.add(ring);
  const eyeLens = cyl(0.011, 0.011, 0.002, M.lens); eyeLens.position.y = 0.104; ep.add(eyeLens);
  const epTag = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.008), new THREE.MeshBasicMaterial({ map: labelTexture('WF10×', { bg: '#141719', fg: '#ffffff', w: 256, h: 100, font: 60 }), transparent: true }));
  epTag.position.set(0, 0.088, 0.0157); ep.add(epTag);
  ep.position.set(0, 0.335, 0.005); ep.rotation.x = Math.PI / 4; g.add(ep); parts.eyepiece = ep;
  ep.userData.labelAnchor = new THREE.Vector3(0, 0.11, 0);

  // القرص الدوار والعدسات الشيئية
  const nose = new THREE.Group(); nose.position.set(0, NOSE_Y, Z0 - 0.026); g.add(nose); parts.nosepiece = nose;
  const disk = cyl(0.036, 0.03, 0.016, M.chrome, 40); nose.add(disk);
  const knurl = cyl(0.0365, 0.0365, 0.004, M.dark, 40); knurl.position.y = 0.006; nose.add(knurl);
  parts.objectives = [];
  OBJECTIVES.forEach((o, i) => {
    const a = i * Math.PI / 2;
    const ob = new THREE.Group();
    const bodyM = cyl(0.0095, 0.0068, o.len, M.chrome); bodyM.position.y = -o.len / 2; ob.add(bodyM);
    const band = cyl(0.0097, 0.0095, 0.003, new THREE.MeshStandardMaterial({ color: o.hex, roughness: .4 })); band.position.y = -o.len * 0.3; ob.add(band);
    const tip = cyl(0.0062, 0.0055, 0.004, M.dark); tip.position.y = -o.len - 0.001; ob.add(tip);
    const glassTip = cyl(0.003, 0.003, 0.001, M.lens); glassTip.position.y = -o.len - 0.0035; ob.add(glassTip);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.011, 0.006), new THREE.MeshBasicMaterial({ map: labelTexture(o.mag + '×', { bg: '#dfe3e6', fg: '#111', w: 200, h: 110, font: 80 }), transparent: false }));
    tag.position.set(0, -o.len * 0.55, 0.0086); tag.rotation.x = -0.12; ob.add(tag);
    ob.position.set(Math.sin(a) * 0.026, -0.008, Math.cos(a) * 0.026);
    nose.add(ob); parts.objectives.push(ob);
  });

  // المنضدة (تتحرك عموديًا مع الضبط)
  const stage = new THREE.Group(); g.add(stage); parts.stage = stage;
  const plate = rbox(0.15, STAGE_T, 0.13, 0.012, M.black); plate.position.set(0, -STAGE_T, Z0); stage.add(plate);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x000000, roughness: .3 });
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.011, 32), holeMat); hole.rotation.x = -Math.PI / 2; hole.position.set(0, 0.0003, Z0); stage.add(hole); parts.hole = hole;
  const bracket = rbox(0.05, 0.03, 0.06, 0.008, M.body); bracket.position.set(0, -0.032, -0.052); stage.add(bracket);
  const clips = [];
  for (const sx of [-1, 1]) {
    const c = new THREE.Group();
    const post = cyl(0.004, 0.004, 0.006, M.chrome); post.position.y = 0.003; c.add(post);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.0012, 0.05), M.chrome); strip.position.set(0, 0.0055, 0.022); c.add(strip);
    c.position.set(sx * 0.042, 0, Z0 - 0.03); c.rotation.y = sx * 0.35; stage.add(c); clips.push(c);
  }
  parts.clips = clips;
  // المكثف والحجاب القزحي
  const cond = cyl(0.017, 0.014, 0.03, M.dark); cond.position.set(0, -0.03, Z0); stage.add(cond); parts.condenser = cond;
  const iris = cyl(0.02, 0.02, 0.005, M.chrome); iris.position.set(0, -0.019, Z0); stage.add(iris);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.028, 8), M.chrome); lever.rotation.z = Math.PI / 2; lever.position.set(0.024, -0.019, Z0 + 0.006); stage.add(lever); parts.irisLever = lever;
  const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.003, 12, 8), M.black); leverKnob.position.set(0.038, -0.019, Z0 + 0.006); stage.add(leverKnob); parts.irisKnob = leverKnob;
  parts.iris = iris;
  // نقطة تثبيت الشريحة
  const mount = new THREE.Object3D(); mount.position.set(0, 0.0003, Z0); stage.add(mount); parts.mount = mount;

  // ضوابط الضبط الكبير والصغير على الجانبين
  const knobs = { coarse: [], fine: [] };
  for (const sx of [-1, 1]) {
    const k = new THREE.Group();
    const coarse = cyl(0.026, 0.026, 0.014, M.dark, 36); coarse.rotation.z = Math.PI / 2; coarse.position.x = sx * 0.035; k.add(coarse);
    const cRim = cyl(0.0265, 0.0265, 0.004, M.black, 36); cRim.rotation.z = Math.PI / 2; cRim.position.x = sx * 0.043; k.add(cRim);
    const fine = cyl(0.015, 0.015, 0.012, M.black, 28); fine.rotation.z = Math.PI / 2; fine.position.x = sx * 0.051; k.add(fine);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.012, 0.003), new THREE.MeshStandardMaterial({ color: 0xf59e0b })); mark.position.set(sx * 0.058, 0.007, 0); k.add(mark);
    k.position.set(0, 0.14, -0.07); g.add(k);
    knobs.coarse.push(coarse, cRim); knobs.fine.push(fine);
    if (sx === 1) { parts.coarseKnob = coarse; parts.fineKnob = fine; parts.knobGroupR = k; }
  }
  const coarseRot = [], fineRot = [];
  g.children.filter(c => c.isGroup && c.position.y === 0.14).forEach(k => { coarseRot.push(k); });

  // حزمة الضوء بين المصباح والمنضدة
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 1, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.set(0, 0.1, Z0); g.add(beam); parts.beam = beam;
  const lampLight = new THREE.PointLight(0xffe7b0, 0, 0.35, 2); lampLight.position.set(0, 0.06, Z0); g.add(lampLight);

  const state = { focus: 8, obj: 0, lamp: 0, iris: 0.6 };
  const api = {
    group: g, parts, state, OBJECTIVES,
    stageY(z) { return FOCUS_TOP + (z - 50) * FOCUS_UNIT - 0.0014; },
    setFocus(z) {
      const dz = z - state.focus; state.focus = z;
      stage.position.y = this.stageY(z);
      // ضبط حزمة الضوء بين المصباح والمكثف
      const bottom = 0.043, top = stage.position.y - 0.045; beam.scale.y = Math.max(top - bottom, 0.001); beam.position.y = (top + bottom) / 2;
      for (const k of coarseRot) k.rotation.x += dz * 0.35;
    },
    rotateFine(dz) { parts.fineKnob.rotation.x += dz * 6; },
    setLamp(v) {
      state.lamp = v;
      lampMat.emissive.setRGB(1, .86, .55).multiplyScalar(v * 1.6);
      holeMat.emissive.setRGB(1, .9, .6).multiplyScalar(v * (0.4 + state.iris));
      beam.material.opacity = v * 0.12;
      lampLight.intensity = v * 0.25;
      swRock.rotation.x = v > 0 ? 0.25 : -0.25;
    },
    setIris(v) { state.iris = v; lever.rotation.y = (v - .5) * 0.8; leverKnob.position.x = 0.038 - (v - .5) * 0.01; this.setLamp(state.lamp); },
    objectiveBottomY(i = state.obj) { return NOSE_Y - 0.008 - OBJECTIVES[i].len - 0.0035; },
    // الحد الأعلى قبل اصطدام العدسة الشيئية بالشريحة
    crashFocus(i = state.obj) { return 50 + (this.objectiveBottomY(i) - FOCUS_TOP) / FOCUS_UNIT; },
    setObjective(i, sceneRef, dur = 0.6) {
      const from = nose.rotation.y; let to = -i * Math.PI / 2;
      while (to - from > Math.PI) to -= 2 * Math.PI; while (from - to > Math.PI) to += 2 * Math.PI;
      state.obj = i;
      if (!sceneRef) { nose.rotation.y = to; return Promise.resolve(); }
      return sceneRef.tween(dur, t => { nose.rotation.y = from + (to - from) * ease(t); });
    },
  };
  api.setFocus(state.focus); api.setLamp(0); api.setIris(0.6);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return api;
}

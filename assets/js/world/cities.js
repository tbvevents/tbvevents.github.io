// Stylised, low-poly landmarks of Việt Nam's big cities, each on its own Tết diorama island.
// Every builder returns a Group built facing +z; main.js turns it towards its camera keyframe.
import * as THREE from 'three';
import { toon, glow, mesh, rand, pick, textTexture } from './toon.js';
import { makeGoat, makeKid, makeLion, makeLantern } from './characters.js';
import { cityBase, water, makeBlossomTree, makePot, makeBanhChung, makeFirecrackers } from './decor.js';

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 20);
const pyramid = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4);
const hornGeo = new THREE.ConeGeometry(0.12, 0.6, 6);

/** Vietnamese pavilion roof: hipped pyramid with upturned golden corners (đầu đao). */
function roof(w, d, h, color, y = 0) {
  const g = new THREE.Group();
  g.add(mesh(pyramid, toon(color), { s: [w * 1.15, h, d * 1.15], p: [0, y + h / 2, 0] }));
  const gold = toon('#f2b84b');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(mesh(hornGeo, gold, { p: [sx * w * 0.6, y + 0.15, sz * d * 0.6], r: [sz * 0.9, 0, -sx * 0.9] }));
  }
  g.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), glow('#ffcf4a', 1.5), { p: [0, y + h, 0] }));
  return g;
}

/** Triangular gable roof for Hội An shophouses. */
function gable(w, d, h, color) {
  const s = new THREE.Shape([new THREE.Vector2(-d / 2 - 0.3, 0), new THREE.Vector2(d / 2 + 0.3, 0), new THREE.Vector2(0, h)]);
  const geo = new THREE.ExtrudeGeometry(s, { depth: w + 0.4, bevelEnabled: false });
  geo.translate(0, 0, -(w + 0.4) / 2);
  geo.rotateY(Math.PI / 2);
  return new THREE.Mesh(geo, toon(color));
}

let windowImage;
/** Building with lit windows (emissive canvas texture), repeated to match its size. */
function tower(w, h, d, color = '#3b4a6b') {
  if (!windowImage) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      if (Math.random() < 0.7) {
        g.fillStyle = pick(['#ffd27a', '#ffe9b0', '#9fd8ff', '#ffb36b']);
        g.fillRect(x * 16 + 3, y * 8 + 2, 10, 4);
      }
    }
    windowImage = c;
  }
  const tex = new THREE.CanvasTexture(windowImage);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 3)));
  const m = mesh(box, toon(color, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.1 }), { s: [w, h, d], p: [0, h / 2, 0] });
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function place(parent, obj, x, z, ry = 0, y = 0) {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  parent.add(obj);
  return obj;
}

function lanternString(parent, from, to, count, colors) {
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const p = from.clone().lerp(to, t);
    p.y -= Math.sin(t * Math.PI) * 1.2;
    const l = makeLantern(pick(colors), 0.32);
    l.position.copy(p);
    l.userData.update = (time) => (l.rotation.z = Math.sin(time * 1.5 + i) * 0.08);
    parent.add(l);
  }
}

/* ─────────────────────────── 0. Hero: sân đón Tết ─────────────────────────── */
export function buildHero() {
  const g = new THREE.Group();
  g.add(cityBase(15, '#6d2d4f'));
  place(g, makeGoat(), 0, 1.5).scale.setScalar(1.5);
  place(g, makeKid({ ao: '#e63946', quan: '#ffffff', hat: 'buns', prop: 'lixi' }), -3.2, 2.2, 0.3);
  place(g, makeKid({ ao: '#2b6cb0', quan: '#ffffff', hat: 'khan', prop: 'lantern' }), 3.2, 2.2, -0.3);
  place(g, makeBlossomTree('mai', 1.7), -8.5, -2);
  place(g, makeBlossomTree('dao', 1.7), 8.5, -2);
  place(g, makeBanhChung(), -5, 4.5, 0.3);
  place(g, makeBanhChung(), -5.2, 4.4, 0.6, 0.36).scale.setScalar(0.8);
  place(g, makePot('quat'), 5.2, 4.5);
  place(g, makePot('quat'), -11, 4);
  place(g, makePot('mai'), 11, 4);

  // Cây nêu: the bamboo pole raised at Tết to ward off bad luck
  const neu = new THREE.Group();
  neu.add(mesh(cyl, toon('#c9b26b'), { s: [0.12, 11, 0.12], p: [0, 5.5, 0] }));
  neu.add(mesh(new THREE.TorusGeometry(0.6, 0.06, 6, 20), glow('#ffcf4a', 1.5), { p: [0, 10.4, 0], r: [Math.PI / 2, 0, 0] }));
  const cracker = makeFirecrackers(12);
  cracker.position.set(0.6, 10.2, 0);
  neu.add(cracker);
  place(g, neu, -12, -6);
  return g;
}

/* ─────────────────────────── 1. Hà Nội ─────────────────────────── */
export function buildHaNoi() {
  const g = new THREE.Group();
  g.add(cityBase(17, '#5f2d52'));
  const lake = mesh(new THREE.CircleGeometry(10, 48), new THREE.MeshToonMaterial({ color: '#2a6aa8', emissive: '#123a66', emissiveIntensity: 0.6 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0.05, -2] });
  g.add(lake);

  // Tháp Rùa on its islet
  const islet = mesh(cyl, toon('#3f6b3a'), { s: [2.4, 0.4, 2.4], p: [3, 0.1, -4] });
  g.add(islet);
  const thapRua = new THREE.Group();
  const wall = toon('#efd9a7', { emissive: '#5a3a10', emissiveIntensity: 0.5 });
  const tiers = [[2.4, 1.6, 1.8], [1.7, 1.2, 1.3], [1.15, 1.0, 0.9]];
  let y = 0.3;
  for (const [w, h, d] of tiers) {
    thapRua.add(mesh(box, wall, { s: [w, h, d], p: [0, y + h / 2, 0] }));
    thapRua.add(mesh(box, glow('#ffb347', 1.3), { s: [w * 0.25, h * 0.55, 0.05], p: [0, y + h * 0.42, d / 2 + 0.01] }));
    y += h;
  }
  thapRua.add(roof(1.3, 1.0, 0.9, '#7a2e22', y));
  place(g, thapRua, 3, -4);

  // Cầu Thê Húc (red bridge) leading to Đền Ngọc Sơn
  const bridgeCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-10, 0.3, 5), new THREE.Vector3(-8.5, 3.2, 0), new THREE.Vector3(-6, 0.4, -5));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 32, 0.35, 8, false), glow('#ff2e3a', 1.4)));
  g.add(mesh(cyl, toon('#3f6b3a'), { s: [2.5, 0.4, 2.5], p: [-6, 0.1, -6] }));
  const temple = new THREE.Group();
  temple.add(mesh(box, toon('#9c1f1f'), { s: [2.6, 1.4, 2], p: [0, 0.7, 0] }));
  temple.add(roof(2.6, 2, 1, '#3a2a2a', 1.4));
  place(g, temple, -6, -6.5, 0.4, 0.3);

  // hoa đào everywhere: Tết in the North
  [[10, 7], [12.5, -3], [-12.5, -2], [7, -12], [-1, 10.5], [-13, 8]].forEach(([x, z], i) => place(g, makeBlossomTree('dao', rand(1.1, 1.5)), x, z, i));

  // ông đồ cho chữ + kids
  place(g, makeKid({ ao: '#1f2f5a', quan: '#ffffff', hair: '#e8e2d5', hat: 'khan', prop: 'scroll', beard: true, scale: 1.1 }), 4, 9, -0.2);
  place(g, makeKid({ ao: '#c8102e', quan: '#ffffff', hat: 'non', prop: 'lantern' }), 1.5, 10.5, 0.2);
  place(g, makeKid({ ao: '#2b6cb0', quan: '#ffffff', hat: 'khan', prop: 'lixi' }), 7, 10.5, -0.4);
  return g;
}

/* ─────────────────────────── 2. Huế ─────────────────────────── */
export function buildHue() {
  const g = new THREE.Group();
  g.add(cityBase(18, '#4f2d5c'));
  const river = water(36, 5.5);
  river.position.z = 11;
  g.add(river);

  // Ngọ Môn: stone base with three gates + Lầu Ngũ Phụng pavilions
  const ngoMon = new THREE.Group();
  ngoMon.add(mesh(box, toon('#8f6e52', { emissive: '#3a2410', emissiveIntensity: 0.4 }), { s: [16, 3, 4.5], p: [0, 1.5, 0] }));
  for (const x of [-4.5, 0, 4.5]) ngoMon.add(mesh(box, glow('#ffb347', 1.1), { s: [x ? 1.4 : 1.8, x ? 1.8 : 2.2, 0.1], p: [x, x ? 0.9 : 1.1, 2.26] }));
  const red = toon('#a01d24');
  ngoMon.add(mesh(box, red, { s: [6, 1.6, 3], p: [0, 3.8, 0] }));
  ngoMon.add(roof(6.4, 3.4, 1.3, '#e2b13c', 4.6));
  ngoMon.add(mesh(box, red, { s: [3.4, 1, 2], p: [0, 6.1, 0] }));
  ngoMon.add(roof(3.8, 2.4, 1.1, '#e2b13c', 6.6));
  for (const sx of [-1, 1]) {
    ngoMon.add(mesh(box, red, { s: [3, 1.3, 2.6], p: [sx * 5.6, 3.65, 0] }));
    ngoMon.add(roof(3.2, 2.8, 1, '#e2b13c', 4.3).translateX(sx * 5.6));
  }
  place(g, ngoMon, 0, -4);

  // Kỳ Đài flag tower
  const flag = new THREE.Group();
  [[4, 1], [3, 1], [2, 1]].forEach(([w, h], i) => flag.add(mesh(box, toon('#7d6047'), { s: [w, h, w], p: [0, i + 0.5, 0] })));
  flag.add(mesh(cyl, toon('#e8e2d5'), { s: [0.09, 9, 0.09], p: [0, 7.5, 0] }));
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.16 : 0.4;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const cloth = new THREE.Group();
  cloth.add(mesh(new THREE.PlaneGeometry(2.4, 1.6), toon('#da251d', { side: THREE.DoubleSide })));
  cloth.add(mesh(new THREE.ShapeGeometry(star), glow('#ffff00', 1.2), { p: [0, 0, 0.01] }));
  cloth.position.set(1.25, 11, 0);
  cloth.userData.update = (t) => (cloth.rotation.y = Math.sin(t * 2) * 0.15);
  flag.add(cloth);
  place(g, flag, -12, 4);

  // thuyền rồng on Sông Hương
  const boat = new THREE.Group();
  boat.add(mesh(box, toon('#c8102e'), { s: [6, 0.6, 1.4], p: [0, 0.3, 0] }));
  boat.add(mesh(box, toon('#e2b13c'), { s: [3, 1, 1.2], p: [0, 1.1, 0] }));
  boat.add(roof(3.2, 1.4, 0.6, '#c8102e', 1.6));
  boat.add(mesh(cyl, toon('#e2b13c'), { s: [0.25, 1.6, 0.25], p: [3.1, 1.0, 0], r: [0, 0, -0.5] }));
  boat.add(mesh(new THREE.SphereGeometry(0.45, 12, 10), toon('#e2b13c'), { p: [3.6, 1.8, 0] }));
  for (const x of [-1, 1]) boat.add(makeLantern('#ff2e2e', 0.22).translateX(x).translateY(1.15).translateZ(0.7));
  boat.position.z = 11;
  boat.userData.update = (t) => {
    boat.position.x = Math.sin(t * 0.15) * 10;
    boat.rotation.y = Math.cos(t * 0.15) > 0 ? 0 : Math.PI;
    boat.position.y = Math.sin(t * 1.5) * 0.08;
  };
  g.add(boat);

  place(g, makeKid({ ao: '#7b3fa0', quan: '#ffffff', hat: 'non', prop: 'lantern' }), 3, 6.5, -0.2);
  place(g, makeKid({ ao: '#7b3fa0', quan: '#ffffff', hat: 'non', prop: 'lixi' }), 5.2, 6.3, -0.4);
  place(g, makeKid({ ao: '#c8102e', quan: '#ffffff', hat: 'khan', prop: 'flag' }), -2, 6.6, 0.2);
  [[-14, -6], [14, -6], [12, 5], [-15, 0]].forEach(([x, z], i) => place(g, makeBlossomTree(i % 2 ? 'dao' : 'mai', 1.3), x, z));
  return g;
}

/* ─────────────────────────── 3. Đà Nẵng ─────────────────────────── */
export function buildDaNang(ctx) {
  const g = new THREE.Group();
  g.add(cityBase(18, '#33305f'));
  const river = water(9, 36);
  g.add(river);

  // bridge deck and piers
  g.add(mesh(box, toon('#5d5a7a'), { s: [32, 0.5, 2.6], p: [0, 2.2, 0] }));
  for (const x of [-11, -5, 1, 7]) g.add(mesh(cyl, toon('#5d5a7a'), { s: [0.45, 2.2, 0.45], p: [x, 1.1, 0] }));

  // Cầu Rồng: the dragon's arched golden body, its lights cycle colour like the real bridge at night
  const pts = [[-16, 2.4], [-13, 5.8], [-10, 2.6], [-7, 6.4], [-4, 2.6], [-1, 6.8], [2, 2.6], [5, 6.2], [8, 2.9], [11, 6.4], [13.5, 7.6]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const spine = new THREE.CatmullRomCurve3(pts);
  const dragonMat = new THREE.MeshToonMaterial({ color: '#f2b84b', emissive: '#ff9f1c', emissiveIntensity: 0.7 });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(spine, 160, 0.6, 12, false), dragonMat));
  const spikeMat = glow('#ffcf4a', 1.5);
  for (let i = 1; i < 30; i++) {
    const p = spine.getPointAt(i / 30);
    g.add(mesh(hornGeo, spikeMat, { p: [p.x, p.y + 0.6, p.z], s: [1.2, 1, 1.2] }));
  }
  const head = new THREE.Group();
  head.add(mesh(box, dragonMat, { s: [2, 1.1, 1.3] }));
  head.add(mesh(box, dragonMat, { s: [1.4, 0.35, 1], p: [0.9, -0.6, 0], r: [0, 0, -0.25] }));
  for (const sz of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), glow('#7df9ff', 2), { p: [0.4, 0.3, sz * 0.66] }));
    head.add(mesh(hornGeo, toon('#ffe9b0'), { p: [-0.7, 0.9, sz * 0.4], r: [sz * 0.3, 0, 0.9], s: [1.5, 2, 1.5] }));
  }
  head.position.set(14.4, 8, 0);
  g.add(head);

  const mouth = new THREE.Vector3(15.6, 7.6, 0);
  const fireCol = new THREE.Color();
  let fireTimer = 0;
  g.userData.update = (t, dt) => {
    dragonMat.emissive.setHSL((t * 0.05) % 1, 0.9, 0.5);
    head.rotation.z = Math.sin(t * 1.2) * 0.06;
    // phun lửa: 2 seconds of fire every 7 seconds, like the weekend show
    fireTimer = t % 7;
    if (fireTimer < 2 && ctx?.fireworks) {
      const w = g.localToWorld(mouth.clone());
      const dir = new THREE.Vector3(1, 0.15, 0).transformDirection(g.matrixWorld);
      for (let k = 0; k < 6; k++) {
        fireCol.set(pick(['#ff9f1c', '#ffd23f', '#ff4d1a'])).multiplyScalar(3);
        const s = rand(9, 13);
        ctx.fireworks._emit(w.x, w.y, w.z, dir.x * s + rand(-1, 1), dir.y * s + rand(0, 2), dir.z * s + rand(-1, 1), fireCol, rand(0.45, 0.8), 2.5);
      }
    }
  };

  // riverside skyline
  [[-14, -10, 3, 9], [-9, -12, 2.5, 13], [10, -11, 3, 11], [14, -8, 2.5, 8], [-15, 9, 2.5, 6], [14, 9, 3, 7]].forEach(([x, z, w, h]) => place(g, tower(w, h, w, '#38446a'), x, z));
  place(g, makeKid({ ao: '#0f9d8a', quan: '#ffffff', hat: 'non', prop: 'lantern' }), -7, 6, 0.3);
  place(g, makeKid({ ao: '#e63946', quan: '#ffffff', hat: 'buns', prop: 'lixi' }), -9.2, 6.5, 0.5);
  place(g, makeKid({ ao: '#2b6cb0', quan: '#ffffff', hat: 'khan', prop: 'flag' }), 8, 7, -0.3);
  place(g, makeBlossomTree('mai', 1.3), -12, 2);
  place(g, makeBlossomTree('mai', 1.2), 12, 3);
  return g;
}

/* ─────────────────────────── 4. Hội An ─────────────────────────── */
export function buildHoiAn() {
  const g = new THREE.Group();
  g.add(cityBase(18, '#6a3b38'));
  const river = water(36, 7, '#22507f');
  river.position.z = 9;
  g.add(river);

  // Chùa Cầu (Japanese covered bridge)
  const bridge = new THREE.Group();
  bridge.add(mesh(box, toon('#7a5236'), { s: [9, 1, 2.8], p: [0, 0.5, 0] }));
  bridge.add(mesh(box, toon('#8b3a2a'), { s: [7.5, 1.7, 2.4], p: [0, 1.85, 0] }));
  bridge.add(mesh(box, glow('#ffb347', 1.2), { s: [6, 0.8, 0.05], p: [0, 1.9, 1.22] }));
  bridge.add(gable(7.6, 2.6, 1.3, '#4a2e28').translateY(2.7));
  const mid = new THREE.Group();
  mid.add(mesh(box, toon('#8b3a2a'), { s: [2.2, 0.9, 2.6], p: [0, 4.1, 0] }));
  mid.add(roof(2.4, 2.8, 1, '#4a2e28', 4.55));
  bridge.add(mid);
  place(g, bridge, 0, 3.5);

  // yellow shophouses of the old town with strings of colourful lanterns
  const xs = [-13, -8.5, -4, 4, 8.5, 13];
  xs.forEach((x, i) => {
    const h = 2.6 + (i % 2) * 0.8;
    const house = new THREE.Group();
    house.add(mesh(box, toon(pick(['#f2c14e', '#efb53a', '#f5cd62'])), { s: [4, h, 4], p: [0, h / 2, 0] }));
    house.add(mesh(box, glow('#ffb347', 1.1), { s: [1.2, 1.4, 0.05], p: [0, 0.7, 2.01] }));
    house.add(mesh(box, toon('#2d5a3a'), { s: [0.9, 0.7, 0.05], p: [1.2, h - 0.8, 2.01] }));
    house.add(gable(4, 4, 1.4, '#6b3b2a').translateY(h));
    place(g, house, x, -6);
  });
  const lanternColors = ['#ff2e2e', '#ffcf4a', '#ff6fa3', '#4dd4ff', '#9b5cff', '#ff8a2a'];
  for (let i = 0; i < xs.length - 1; i++) {
    if (xs[i] < 0 && xs[i + 1] > 0) continue;
    lanternString(g, new THREE.Vector3(xs[i], 3.6, -3.9), new THREE.Vector3(xs[i + 1], 3.6, -3.9), 5, lanternColors);
  }
  lanternString(g, new THREE.Vector3(-14, 4, -3.5), new THREE.Vector3(14, 4, -3.5), 26, lanternColors);

  // hoa đăng: candle lanterns floating on the Thu Bồn river
  const lotus = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.25, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), 50);
  const items = Array.from({ length: 50 }, (_, i) => ({ x: rand(-17, 17), z: rand(6.2, 11.8), v: rand(0.3, 0.8), i }));
  const c = new THREE.Color();
  items.forEach((it) => lotus.setColorAt(it.i, c.set(pick(['#ff6fa3', '#ffcf4a', '#ff8a2a', '#ff2e3a'])).multiplyScalar(2.2)));
  const m4 = new THREE.Matrix4();
  lotus.userData.update = (t, dt) => {
    for (const it of items) {
      it.x += it.v * dt;
      if (it.x > 17) it.x = -17;
      lotus.setMatrixAt(it.i, m4.makeTranslation(it.x, 0.15 + Math.sin(t * 2 + it.i) * 0.04, it.z));
    }
    lotus.instanceMatrix.needsUpdate = true;
  };
  g.add(lotus);

  place(g, makeKid({ ao: '#f2b84b', quan: '#ffffff', hat: 'non', prop: 'lantern' }), -5, 6.4, 0.3, 0);
  place(g, makeKid({ ao: '#e63946', quan: '#ffffff', hat: 'buns', prop: 'lantern' }), 6, 0.5, -0.3);
  place(g, makeKid({ ao: '#0f9d8a', quan: '#ffffff', hat: 'khan', prop: 'lixi' }), 8, 1, -0.5);
  return g;
}

/* ─────────────────────────── 5. TP. Hồ Chí Minh ─────────────────────────── */
export function buildHCM() {
  const g = new THREE.Group();
  g.add(cityBase(19, '#33294f'));

  // Landmark 81: a bundle of glass prisms of stepped heights
  const lm = new THREE.Group();
  const heights = [[16, 20, 14], [22, 28, 18], [13, 19, 12]];
  heights.forEach((row, ix) => row.forEach((h, iz) => {
    const t = tower(1.6, h, 1.6, '#5a6f96');
    t.position.set((ix - 1) * 1.6, 0, (iz - 1) * 1.6);
    lm.add(t);
  }));
  lm.add(mesh(cyl, glow('#7df9ff', 2), { s: [0.08, 4, 0.08], p: [0, 30, 0] }));
  place(g, lm, -6, -7);

  // Bitexco: tapered lens-shaped tower with its helipad
  const bx = tower(1, 1, 1, '#4a5d80');
  bx.children[0].geometry = new THREE.CylinderGeometry(0.75, 1.25, 1, 24);
  bx.children[0].scale.set(2.4, 19, 1.4);
  bx.children[0].position.y = 9.5;
  bx.children[0].material.emissiveMap.repeat.set(4, 7);
  bx.add(mesh(cyl, toon('#c9d4e8'), { s: [1.4, 0.25, 1.4], p: [0, 13.5, 1.6] }));
  bx.add(mesh(new THREE.TorusGeometry(1.1, 0.06, 6, 24), glow('#ffcf4a', 2), { p: [0, 13.65, 1.6], r: [Math.PI / 2, 0, 0] }));
  place(g, bx, 4, -6);

  // Chợ Bến Thành clock tower
  const ben = new THREE.Group();
  const cream = toon('#f1e3c2', { emissive: '#4a3010', emissiveIntensity: 0.4 });
  ben.add(mesh(box, cream, { s: [7, 2.6, 3], p: [0, 1.3, 0] }));
  ben.add(mesh(box, cream, { s: [1.8, 5, 1.8], p: [0, 2.5, 0.4] }));
  ben.add(mesh(new THREE.CircleGeometry(0.6, 24), glow('#fff2c9', 1.8), { p: [0, 4.2, 1.31] }));
  ben.add(roof(2, 2, 1.1, '#9c3b2a', 5));
  place(g, ben, 11, 1, -0.4);

  // background towers
  [[-14, -2, 3, 10], [-12, -12, 3, 15], [12, -12, 3, 16], [15, -6, 2.5, 9], [-2, -14, 3, 12], [8, -14, 2.5, 18]].forEach(([x, z, w, h]) => place(g, tower(w, h, w), x, z));

  // Đường hoa Nguyễn Huệ: rows of mai & quất pots, a welcome gate and lion dance
  for (let x = -12; x <= 12; x += 3) {
    place(g, makePot(x % 2 ? 'mai' : 'quat'), x, 6);
    place(g, makePot(x % 2 ? 'quat' : 'mai'), x, 12.5);
  }
  const gate = new THREE.Group();
  for (const sx of [-1, 1]) gate.add(mesh(box, toon('#c8102e'), { s: [0.8, 7, 0.8], p: [sx * 7, 3.5, 0] }));
  const sign = mesh(new THREE.PlaneGeometry(14, 1.8), new THREE.MeshBasicMaterial({
    map: textTexture('CHÚC MỪNG NĂM MỚI 2027', { w: 1400, h: 180, vertical: false, font: 'bold 92px "Playfair Display", serif' }),
    toneMapped: false,
    side: THREE.DoubleSide,
  }), { p: [0, 6.3, 0] });
  sign.material.color.setScalar(1.25);
  gate.add(sign);
  place(g, gate, 0, 2.5);

  const lion = makeLion();
  place(g, lion, -2, 9, 0.6);
  const lion2 = makeLion('#ffcf4a', '#e63946');
  place(g, lion2, 3, 9.5, -0.5);
  place(g, makeKid({ ao: '#ffffff', quan: '#1b0b14', hat: 'non', prop: 'lixi' }), 7.5, 9, -0.4);
  place(g, makeKid({ ao: '#e63946', quan: '#ffffff', hat: 'buns', prop: 'flag' }), -7, 9.5, 0.4);
  return g;
}

/* ─────────────────────────── 6. Sân khấu Year End Party ─────────────────────────── */
export function buildStage() {
  const g = new THREE.Group();
  g.add(cityBase(22, '#5a1f3a'));

  g.add(mesh(box, toon('#2a1030'), { s: [20, 1.2, 8], p: [0, 0.6, -6] }));
  g.add(mesh(box, glow('#ffcf4a', 1.6), { s: [20.2, 0.12, 0.12], p: [0, 1.2, -2] }));
  const backdrop = mesh(new THREE.PlaneGeometry(20, 9), new THREE.MeshBasicMaterial({ map: stageTexture(), toneMapped: false }), { p: [0, 5.7, -9.9] });
  backdrop.material.color.setScalar(1.15);
  g.add(backdrop);
  // LED frame
  for (const [w, h, x, y] of [[20.4, 0.25, 0, 10.2], [20.4, 0.25, 0, 1.2], [0.25, 9.2, -10.1, 5.7], [0.25, 9.2, 10.1, 5.7]]) {
    g.add(mesh(box, glow('#ff2e3a', 2), { s: [w, h, 0.2], p: [x, y, -9.8] }));
  }

  // truss towers with lanterns
  for (const sx of [-1, 1]) {
    g.add(mesh(box, toon('#3a3a4a'), { s: [0.6, 12, 0.6], p: [sx * 11.5, 6, -6] }));
    for (let i = 0; i < 4; i++) g.add(makeLantern('#ff2e2e', 0.45).translateX(sx * 11.5).translateY(10 - i * 2.4).translateZ(-5));
  }

  // moving stage lights (volumetric cones)
  const beams = [];
  const beamGeo = new THREE.ConeGeometry(2.2, 14, 24, 1, true).translate(0, -7, 0);
  ['#ffcf4a', '#ff6fa3', '#7df9ff', '#ffcf4a'].forEach((col, i) => {
    const b = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    b.position.set(-7.5 + i * 5, 13, -4);
    g.add(b);
    beams.push(b);
  });
  g.userData.update = (t) => beams.forEach((b, i) => {
    b.rotation.z = Math.sin(t * 0.9 + i * 1.7) * 0.5;
    b.rotation.x = Math.cos(t * 0.7 + i) * 0.3;
  });

  // mascot and lions perform at the sides so the backdrop stays readable
  const goat = makeGoat();
  goat.scale.setScalar(1.6);
  place(g, goat, -7.2, -4.5, 0.35, 1.2);
  place(g, makeLion(), -3.5, 0.5, 0.4);
  place(g, makeLion('#ffcf4a', '#e63946'), 7, -3.5, -0.5, 1.2);

  // the audience: colleagues in festive áo dài
  const outfits = ['#e63946', '#2b6cb0', '#f2b84b', '#7b3fa0', '#0f9d8a', '#ffffff', '#c8102e'];
  const hats = ['khan', 'non', 'buns', null];
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 7; i++) {
      const kid = makeKid({ ao: pick(outfits), quan: '#ffffff', hat: pick(hats), prop: pick(['lixi', 'lantern', 'flag', null]), scale: 0.9 });
      place(g, kid, -9 + i * 3 + (row % 2) * 1.5, 6 + row * 3, Math.PI + rand(-0.2, 0.2));
    }
  }
  [[-17, -6], [17, -6], [-18, 6], [18, 6]].forEach(([x, z], i) => place(g, makeBlossomTree(i % 2 ? 'dao' : 'mai', 1.6), x, z));
  return g;
}

function stageTexture() {
  const c = document.createElement('canvas');
  c.width = 2000;
  c.height = 900;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 900);
  grd.addColorStop(0, '#7a0f2a');
  grd.addColorStop(1, '#2a0820');
  g.fillStyle = grd;
  g.fillRect(0, 0, 2000, 900);
  // golden sun-burst rays
  g.save();
  g.translate(1000, 520);
  for (let i = 0; i < 36; i++) {
    g.rotate((Math.PI * 2) / 36);
    g.fillStyle = i % 2 ? 'rgba(255,207,74,0.08)' : 'rgba(255,207,74,0.02)';
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(1400, -60);
    g.lineTo(1400, 60);
    g.fill();
  }
  g.restore();
  g.textAlign = 'center';
  g.fillStyle = '#ffd76a';
  g.font = '600 64px "Be Vietnam Pro", sans-serif';
  g.fillText('TERUMO BCT VIỆT NAM', 1000, 170);
  g.font = 'bold 190px "Playfair Display", serif';
  g.fillText('YEAR END PARTY', 1000, 390);
  g.font = 'bold 230px "Playfair Display", serif';
  g.fillStyle = '#ffffff';
  g.fillText('2026', 1000, 620);
  g.font = 'italic 70px "Playfair Display", serif';
  g.fillStyle = '#ffd76a';
  g.fillText('Chào Xuân Đinh Mùi 2027', 1000, 780);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

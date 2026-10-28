// Cartoon characters welcoming Tết Đinh Mùi 2027: goat mascot, kids in áo dài, ông đồ, lion dance.
// Every factory returns a THREE.Group whose userData.update(t) animates it.
import * as THREE from 'three';
import { toon, glow, mesh, addOutline, blobShadow, textTexture } from './toon.js';

const SKIN = '#ffd9b8';
const sphere = new THREE.SphereGeometry(1, 24, 16);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
const cone = new THREE.ConeGeometry(1, 1, 16);
const box = new THREE.BoxGeometry(1, 1, 1);

function face(head, { y = 0, z = 0.46, spread = 0.18, eye = 0.07 } = {}) {
  const black = toon('#1b0b14');
  const white = glow('#ffffff', 1);
  for (const sx of [-1, 1]) {
    const e = mesh(sphere, black, { p: [sx * spread, y + 0.04, z], s: [eye, eye * 1.25, eye * 0.6] });
    e.add(mesh(sphere, white, { p: [0.35, 0.35, 0.6], s: 0.35 }));
    head.add(e);
    head.add(mesh(sphere, toon('#ff8fa3'), { p: [sx * (spread + 0.12), y - 0.1, z - 0.05], s: [0.09, 0.05, 0.03] }));
  }
  const smile = new THREE.TorusGeometry(0.07, 0.018, 6, 12, Math.PI);
  head.add(mesh(smile, black, { p: [0, y - 0.13, z + 0.02], r: [0, 0, Math.PI] }));
}

/** Red lì xì envelope with a gold seal. */
export function makeLiXi(scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(box, toon('#d7192f'), { s: [0.42, 0.6, 0.04] }));
  g.add(mesh(box, glow('#ffcf4a', 1.4), { p: [0, 0.05, 0.025], s: [0.2, 0.2, 0.01], r: [0, 0, Math.PI / 4] }));
  g.scale.setScalar(scale);
  return g;
}

/** Linh vật Dê vàng — mascot of the year Đinh Mùi 2027. */
export function makeGoat() {
  const g = new THREE.Group();
  const fur = toon('#fff4e3');
  const red = toon('#d7263d');
  const horn = toon('#d49a45');
  const hoof = toon('#4a2b2b');

  const body = new THREE.Group();
  body.position.y = 0.7;
  g.add(body);
  body.add(mesh(sphere, red, { p: [0, 0.65, 0], s: [0.85, 0.8, 0.8] }));
  body.add(mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 24), glow('#ffcf4a', 1.3), { p: [0, 1.25, 0], r: [Math.PI / 2, 0, 0] }));
  for (let i = 0; i < 3; i++) body.add(mesh(box, glow('#ffcf4a', 1.2), { p: [0, 0.95 - i * 0.28, 0.78], s: 0.08, r: [0, 0, Math.PI / 4] }));

  // legs
  for (const sx of [-1, 1]) {
    const leg = mesh(cyl, fur, { p: [sx * 0.35, -0.2, 0], s: [0.2, 0.6, 0.2] });
    leg.add(mesh(cyl, hoof, { p: [0, -0.45, 0], s: [1.1, 0.25, 1.1] }));
    body.add(leg);
  }

  // arms (pivot at shoulder)
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.78, 1.0, 0);
    pivot.add(mesh(cyl, fur, { p: [0, -0.35, 0], s: [0.16, 0.6, 0.16] }));
    pivot.add(mesh(sphere, fur, { p: [0, -0.68, 0], s: 0.18 }));
    pivot.rotation.z = sx * 0.35;
    body.add(pivot);
    arms.push(pivot);
  }
  const lixi = makeLiXi(1);
  lixi.position.set(0, -0.9, 0.12);
  arms[1].add(lixi);

  // head
  const head = new THREE.Group();
  head.position.set(0, 1.85, 0);
  body.add(head);
  head.add(mesh(sphere, fur, { s: [0.68, 0.62, 0.62] }));
  head.add(mesh(sphere, toon('#ffe6d2'), { p: [0, -0.2, 0.48], s: [0.36, 0.26, 0.26] }));
  head.add(mesh(sphere, toon('#6b3a3a'), { p: [0, -0.1, 0.72], s: [0.08, 0.05, 0.04] }));
  face(head, { y: 0.12, z: 0.55, spread: 0.24, eye: 0.09 });
  head.add(mesh(cone, fur, { p: [0, -0.62, 0.3], r: [Math.PI, 0, 0], s: [0.12, 0.35, 0.12] })); // beard
  for (const sx of [-1, 1]) {
    head.add(mesh(sphere, fur, { p: [sx * 0.72, 0.05, 0], r: [0, 0, sx * -0.9], s: [0.12, 0.34, 0.1] }));
    const h = mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16, Math.PI * 1.1), horn, {
      p: [sx * 0.3, 0.55, -0.1],
      r: [0, sx * Math.PI / 2, sx > 0 ? 0.4 : Math.PI - 0.4],
    });
    head.add(h);
  }
  body.add(mesh(sphere, fur, { p: [0, 0.6, -0.8], s: 0.18 })); // tail

  addOutline(g, 0.035);
  g.add(blobShadow(2.2));

  const phase = Math.random() * 6;
  g.userData.update = (t) => {
    const tt = t + phase;
    body.position.y = 0.7 + Math.abs(Math.sin(tt * 3)) * 0.18;
    head.rotation.z = Math.sin(tt * 1.5) * 0.12;
    arms[1].rotation.z = 2.4 + Math.sin(tt * 6) * 0.35;
    arms[0].rotation.z = -0.4 - Math.sin(tt * 3) * 0.15;
  };
  return g;
}

/**
 * Kid / adult in Vietnamese traditional dress.
 * hat: 'khan' (khăn xếp) | 'non' (nón lá) | 'buns' | null; prop: 'lixi' | 'lantern' | 'scroll' | 'flag' | null
 */
export function makeKid({ ao = '#e63946', quan = '#ffffff', hair = '#2b1a12', hat = null, prop = null, beard = false, scale = 1 } = {}) {
  const g = new THREE.Group();
  const aoMat = toon(ao);
  const skin = toon(SKIN);
  const body = new THREE.Group();
  g.add(body);

  for (const sx of [-1, 1]) body.add(mesh(cyl, toon(quan), { p: [sx * 0.14, 0.3, 0], s: [0.11, 0.6, 0.11] }));
  body.add(mesh(new THREE.CylinderGeometry(0.3, 0.52, 1.05, 18), aoMat, { p: [0, 0.98, 0] }));
  body.add(mesh(sphere, aoMat, { p: [0, 1.52, 0], s: [0.33, 0.32, 0.28] }));
  body.add(mesh(cyl, glow('#ffcf4a', 1.2), { p: [0, 1.78, 0], s: [0.14, 0.1, 0.14] }));

  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.34, 1.62, 0);
    pivot.add(mesh(cyl, aoMat, { p: [0, -0.3, 0], s: [0.1, 0.55, 0.1] }));
    pivot.add(mesh(sphere, skin, { p: [0, -0.6, 0], s: 0.1 }));
    pivot.rotation.z = sx * 0.25;
    body.add(pivot);
    arms.push(pivot);
  }

  const head = new THREE.Group();
  head.position.y = 2.2;
  body.add(head);
  head.add(mesh(sphere, skin, { s: 0.48 }));
  face(head, { y: 0, z: 0.44 });
  head.add(mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(hair), { p: [0, 0.02, -0.04], r: [-0.25, 0, 0] }));
  if (beard) head.add(mesh(cone, toon('#f4f1ea'), { p: [0, -0.5, 0.3], r: [Math.PI + 0.3, 0, 0], s: [0.16, 0.45, 0.12] }));

  if (hat === 'khan') head.add(mesh(new THREE.TorusGeometry(0.4, 0.13, 10, 24), toon(beard ? '#1d1d3a' : '#c8102e'), { p: [0, 0.28, -0.02], r: [Math.PI / 2 - 0.2, 0, 0] }));
  if (hat === 'non') head.add(mesh(new THREE.ConeGeometry(0.85, 0.5, 24), toon('#ecd391'), { p: [0, 0.6, 0] }));
  if (hat === 'buns') for (const sx of [-1, 1]) head.add(mesh(sphere, toon(hair), { p: [sx * 0.32, 0.38, -0.1], s: 0.16 }));

  const hand = arms[1];
  if (prop === 'lixi') {
    const l = makeLiXi(0.7);
    l.position.set(0, -0.75, 0.1);
    hand.add(l);
  } else if (prop === 'lantern') {
    hand.add(mesh(cyl, toon('#7a4a1a'), { p: [0, -0.62, 0.35], r: [Math.PI / 2, 0, 0], s: [0.025, 0.7, 0.025] }));
    const lan = makeLantern('#ff3b3b', 0.45);
    lan.position.set(0, -0.95, 0.7);
    hand.add(lan);
  } else if (prop === 'scroll') {
    const tex = textTexture('Phúc Lộc');
    hand.add(mesh(new THREE.PlaneGeometry(0.5, 1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }), { p: [0, -0.9, 0.2] }));
  } else if (prop === 'flag') {
    hand.add(mesh(cyl, toon('#7a4a1a'), { p: [0, -0.4, 0.1], s: [0.025, 1.4, 0.025] }));
    hand.add(mesh(new THREE.PlaneGeometry(0.6, 0.4), toon('#d7192f', { side: THREE.DoubleSide }), { p: [0.3, 0.1, 0.1] }));
  }

  addOutline(g, 0.03);
  g.add(blobShadow(1.4));
  g.scale.setScalar(scale);

  const phase = Math.random() * 6;
  g.userData.update = (t) => {
    const tt = t + phase;
    body.position.y = Math.abs(Math.sin(tt * 2.6)) * 0.12;
    head.rotation.z = Math.sin(tt * 1.3) * 0.1;
    hand.rotation.z = prop === 'lantern' || prop === 'scroll' ? 0.5 + Math.sin(tt * 2) * 0.1 : 2.3 + Math.sin(tt * 5) * 0.35;
    arms[0].rotation.z = -0.25 - Math.sin(tt * 2.6) * 0.1;
  };
  return g;
}

/** Múa lân (lion dance): big expressive head + swaying fabric body. */
export function makeLion(main = '#e63946', accent = '#ffcf4a') {
  const g = new THREE.Group();
  const red = toon(main);
  const gold = toon(accent);

  const head = new THREE.Group();
  head.position.set(0, 1.9, 0);
  g.add(head);
  head.add(mesh(sphere, red, { s: [0.95, 0.85, 1] }));
  head.add(mesh(new THREE.CircleGeometry(0.22, 24), glow('#bff7ff', 1.8), { p: [0, 0.42, 0.78], r: [-0.5, 0, 0] }));
  head.add(mesh(cone, gold, { p: [0, 0.95, 0.1], s: [0.14, 0.45, 0.14], r: [-0.3, 0, 0] }));
  for (const sx of [-1, 1]) {
    head.add(mesh(sphere, toon('#ffffff'), { p: [sx * 0.38, 0.18, 0.72], s: 0.27 }));
    head.add(mesh(sphere, toon('#1b0b14'), { p: [sx * 0.38, 0.18, 0.95], s: 0.12 }));
    head.add(mesh(box, gold, { p: [sx * 0.38, 0.5, 0.75], s: [0.42, 0.1, 0.14], r: [0, 0, sx * -0.25] }));
    head.add(mesh(cone, red, { p: [sx * 0.7, 0.6, -0.1], s: [0.18, 0.35, 0.18], r: [0, 0, sx * -0.6] }));
  }
  head.add(mesh(new THREE.TorusGeometry(0.95, 0.12, 8, 32), toon('#ffffff'), { p: [0, -0.05, -0.25] }));
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.45, 0.35);
  jaw.add(mesh(box, gold, { p: [0, -0.05, 0.3], s: [0.9, 0.18, 0.7] }));
  jaw.add(mesh(sphere, toon('#ffffff'), { p: [0, -0.3, 0.45], s: [0.35, 0.22, 0.2] }));
  head.add(jaw);

  const segs = [];
  for (let i = 0; i < 7; i++) {
    const s = mesh(sphere, i % 2 ? gold : red, { p: [0, 1.6 - i * 0.04, -0.9 - i * 0.62], s: [0.85 - i * 0.07, 0.65 - i * 0.04, 0.5] });
    g.add(s);
    segs.push(s);
  }
  const tail = mesh(cone, toon('#ffffff'), { p: [0, 1.4, -5.3], r: [-Math.PI / 2, 0, 0], s: [0.3, 0.7, 0.3] });
  g.add(tail);

  const legs = [];
  for (const z of [0, -3.6]) for (const sx of [-1, 1]) {
    const leg = mesh(cyl, gold, { p: [sx * 0.3, 0.5, z - 0.3], s: [0.13, 1, 0.13] });
    leg.add(mesh(box, toon('#1b0b14'), { p: [0, -0.5, 0.2], s: [1.3, 0.12, 2.2] }));
    g.add(leg);
    legs.push(leg);
  }

  addOutline(g, 0.03);
  const shadow = blobShadow(3);
  shadow.scale.set(3, 7, 1);
  shadow.position.z = -2.5;
  g.add(shadow);

  g.userData.update = (t) => {
    const hop = Math.abs(Math.sin(t * 3.2));
    head.position.y = 1.9 + hop * 0.45;
    head.rotation.y = Math.sin(t * 1.6) * 0.45;
    head.rotation.x = Math.sin(t * 3.2) * 0.12;
    jaw.rotation.x = 0.15 + Math.max(0, Math.sin(t * 6)) * 0.35;
    segs.forEach((s, i) => {
      s.position.x = Math.sin(t * 2.4 - i * 0.6) * 0.35;
      s.position.y = 1.6 - i * 0.04 + Math.sin(t * 3.2 - i * 0.5) * 0.15;
    });
    tail.position.x = Math.sin(t * 2.4 - 4.5) * 0.5;
    legs.forEach((l, i) => (l.position.y = 0.5 + Math.max(0, Math.sin(t * 6.4 + i * 1.6)) * 0.25));
  };
  return g;
}

const lanternGeo = new THREE.SphereGeometry(1, 20, 14);
const capGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 16);
/** Glowing red Tết lantern (đèn lồng). */
export function makeLantern(color = '#ff2e2e', scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(lanternGeo, glow(color, 1.6), { s: [1, 0.82, 1] }));
  const gold = toon('#e8b34a');
  g.add(mesh(capGeo, gold, { p: [0, 0.82, 0] }));
  g.add(mesh(capGeo, gold, { p: [0, -0.82, 0] }));
  g.add(mesh(cyl, glow('#ffcf4a', 1.5), { p: [0, -1.3, 0], s: [0.06, 0.8, 0.06] }));
  g.scale.setScalar(scale);
  return g;
}

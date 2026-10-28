// Environment & Tết decorations: sky, ground, blossom trees, petals, sky lanterns, journey path.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toon, glow, mesh, rand, pick } from './toon.js';

export const FOG_COLOR = '#4a1a44';

export function createSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#120c3a') },
      mid: { value: new THREE.Color('#7a1f52') },
      horizon: { value: new THREE.Color('#ff8a4c') },
      ground: { value: new THREE.Color(FOG_COLOR) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 ground;
      varying vec3 vPos;
      void main() {
        float h = clamp(vPos.y, -0.2, 1.0);
        // fades from the fog colour at the horizon line, so the ground has no visible edge
        vec3 c = mix(ground, horizon, smoothstep(-0.01, 0.05, h));
        c = mix(c, mid, smoothstep(0.04, 0.22, h));
        c = mix(c, top, smoothstep(0.18, 0.6, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);

  const count = 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.9 + 0.12;
    v.normalize().multiplyScalar(850);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff1c4, size: 2.2, sizeAttenuation: false, fog: false }));
  sky.add(stars);

  // moon
  sky.add(mesh(new THREE.CircleGeometry(38, 48), glow('#fff2c9', 1.6), { p: [-380, 420, -620], r: [0, 0.5, 0] }));
  return sky;
}

/**
 * Fog-shaded ring that follows the camera and fades upward, blending the far edge of the ground
 * into the sky. It goes through the same fog path as the ground, so its base matches the ground exactly.
 */
export function createHorizonHaze() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#000');
  grd.addColorStop(0.62, '#000');
  grd.addColorStop(0.9, '#fff');
  grd.addColorStop(1, '#fff');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 128);
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(520, 520, 110, 64, 1, true),
    new THREE.MeshBasicMaterial({ color: FOG_COLOR, alphaMap: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, side: THREE.BackSide }),
  );
  ring.position.y = 50;
  ring.renderOrder = -1;
  return ring;
}

export function createGround() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.PlaneGeometry(1400, 1400), toon('#4a2244'), { r: [-Math.PI / 2, 0, 0], p: [0, -0.02, -120] }));
  return g;
}

/** Diorama island under each city. */
export function cityBase(radius, color) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(radius, radius + 1.2, 0.6, 48), toon(color), { p: [0, -0.28, 0] }));
  g.add(mesh(new THREE.TorusGeometry(radius + 0.2, 0.12, 6, 64), glow('#ffcf4a', 1.4), { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0] }));
  return g;
}

export function water(w, d, color = '#2a6aa8') {
  return mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshToonMaterial({ color, emissive: '#123a66', emissiveIntensity: 0.6 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0.04, 0] });
}

/**
 * Hoa đào (pink, the North) or hoa mai (yellow, the South) tree.
 * Branches are generated recursively; blossoms are one InstancedMesh per tree.
 */
export function makeBlossomTree(kind = 'dao', size = 1) {
  const g = new THREE.Group();
  const tips = [];
  const parts = [];
  const up = new THREE.Vector3(0, 1, 0);
  const q0 = new THREE.Quaternion();
  const m0 = new THREE.Matrix4();

  function branch(start, dir, len, radius, depth) {
    const end = start.clone().addScaledVector(dir, len);
    const geo = new THREE.CylinderGeometry(radius * 0.65, radius, len, 6);
    q0.setFromUnitVectors(up, dir);
    geo.applyMatrix4(m0.compose(start.clone().add(end).multiplyScalar(0.5), q0, new THREE.Vector3(1, 1, 1)));
    parts.push(geo);
    if (depth === 0) return tips.push(end);
    const n = depth > 2 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const d = dir.clone().add(new THREE.Vector3(rand(-0.8, 0.8), rand(0.1, 0.6), rand(-0.8, 0.8))).normalize();
      branch(end, d, len * rand(0.62, 0.78), radius * 0.62, depth - 1);
    }
    tips.push(end);
  }
  branch(new THREE.Vector3(), new THREE.Vector3(rand(-0.1, 0.1), 1, rand(-0.1, 0.1)).normalize(), 1.6, 0.22, 4);
  g.add(new THREE.Mesh(mergeGeometries(parts), toon('#5a3020')));

  const palette = kind === 'dao' ? ['#ff8fb8', '#ffb3cf', '#ff6fa3', '#ffd1e1'] : ['#ffd23f', '#ffe066', '#ffc300', '#fff1a8'];
  const perTip = 7;
  const blossom = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshToonMaterial({ color: '#ffffff', emissive: kind === 'dao' ? '#5a1030' : '#5a3a00' }), tips.length * perTip);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  let i = 0;
  for (const tip of tips) {
    for (let k = 0; k < perTip; k++) {
      const p = tip.clone().add(new THREE.Vector3(rand(-0.4, 0.4), rand(-0.25, 0.35), rand(-0.4, 0.4)));
      q.setFromEuler(new THREE.Euler(rand(0, 6), rand(0, 6), 0));
      m4.compose(p, q, new THREE.Vector3().setScalar(rand(0.7, 1.4)));
      blossom.setMatrixAt(i, m4);
      blossom.setColorAt(i, c.set(pick(palette)));
      i++;
    }
  }
  g.add(blossom);

  // a few hanging red envelopes / mini lanterns, as people decorate cây đào, cây mai
  for (let k = 0; k < 5; k++) {
    const tip = pick(tips);
    g.add(mesh(new THREE.BoxGeometry(0.16, 0.24, 0.02), glow('#ff2e3a', 1.3), { p: [tip.x, tip.y - 0.25, tip.z] }));
  }
  g.scale.setScalar(size);
  return g;
}

/** Potted mai/quất for street-flower rows. */
export function makePot(kind = 'mai') {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.6, 12), toon('#2f6f8f'), { p: [0, 0.3, 0] }));
  if (kind === 'quat') {
    g.add(mesh(new THREE.SphereGeometry(0.7, 12, 10), toon('#2f7a3a'), { p: [0, 1.2, 0] }));
    for (let i = 0; i < 10; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.7);
      g.add(mesh(new THREE.SphereGeometry(0.09, 8, 6), glow('#ffa31a', 1.2), { p: [v.x, 1.2 + v.y, v.z] }));
    }
  } else {
    const t = makeBlossomTree('mai', 0.45);
    t.position.y = 0.55;
    g.add(t);
  }
  return g;
}

/** Falling hoa đào & hoa mai petals that follow the camera. */
export class Petals {
  constructor(count = 450) {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    this.speed = new Float32Array(count);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos.set([rand(-30, 30), rand(0, 30), rand(-30, 30)], i * 3);
      c.set(Math.random() < 0.55 ? '#ff9ec4' : '#ffd84d');
      col.set([c.r, c.g, c.b], i * 3);
      this.speed[i] = rand(0.6, 1.6);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(32, 32, 14, 28, 0.6, 0, Math.PI * 2);
    g.fill();
    const tex = new THREE.CanvasTexture(cv);

    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.38, map: tex, vertexColors: true, transparent: true, alphaTest: 0.3, depthWrite: false }));
    this.points.frustumCulled = false;
    this.count = count;
  }
  update(dt, t, center) {
    const a = this.points.geometry.attributes.position;
    const p = a.array;
    for (let i = 0; i < this.count; i++) {
      const j = i * 3;
      p[j] += Math.sin(t * 0.8 + i) * 0.6 * dt + 0.4 * dt;
      p[j + 1] -= this.speed[i] * dt;
      p[j + 2] += Math.cos(t * 0.6 + i * 1.3) * 0.4 * dt;
      // wrap around the camera so petals are always in view
      if (p[j + 1] < 0) p[j + 1] += 30;
      for (const k of [0, 2]) {
        const d = p[j + k] - center.getComponent(k);
        if (d > 30) p[j + k] -= 60;
        else if (d < -30) p[j + k] += 60;
      }
    }
    a.needsUpdate = true;
  }
}

/** Đèn trời: hundreds of instanced paper lanterns slowly rising over the whole route. */
export class SkyLanterns {
  constructor(count, zMin, zMax) {
    const geo = new THREE.CylinderGeometry(0.28, 0.2, 0.55, 8);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffae42').multiplyScalar(2.4), toneMapped: false }), count);
    this.items = Array.from({ length: count }, () => ({
      p: new THREE.Vector3(rand(-60, 60), rand(4, 70), rand(zMin, zMax)),
      v: rand(0.5, 1.4),
      s: rand(0.7, 1.5),
      w: rand(0, 6),
    }));
    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.sv = new THREE.Vector3();
    this.mesh.frustumCulled = false;
  }
  update(dt, t) {
    this.items.forEach((it, i) => {
      it.p.y += it.v * dt;
      it.p.x += Math.sin(t * 0.3 + it.w) * 0.3 * dt;
      if (it.p.y > 80) it.p.y = 3;
      this.mesh.setMatrixAt(i, this.m4.compose(it.p, this.q, this.sv.setScalar(it.s)));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** Glowing dotted path ("dải lụa") that ties the cities together along the S-shape of Việt Nam. */
export function createJourneyPath(curve) {
  const n = 420;
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), n * 2);
  const m4 = new THREE.Matrix4();
  const c = new THREE.Color();
  const side = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    side.set(-tan.z, 0, tan.x).normalize();
    [-1, 1].forEach((s, k) => {
      m4.makeTranslation(p.x + side.x * s * 1.6, 0.12, p.z + side.z * s * 1.6);
      dots.setMatrixAt(i * 2 + k, m4);
      dots.setColorAt(i * 2 + k, c.set(i % 3 === 0 ? '#ff4d4d' : '#ffcf4a').multiplyScalar(2));
    });
  }
  const g = new THREE.Group();
  g.add(dots);

  const ribbonPts = curve.getSpacedPoints(400).map((p) => new THREE.Vector3(p.x, 0.04, p.z));
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribbonPts), 400, 1.4, 4, false),
    toon('#8a1c2c'),
  );
  ribbon.scale.y = 0.04;
  g.add(ribbon);
  return g;
}

/** Bánh chưng (square sticky-rice cake) wrapped in green leaves with bamboo ties. */
export function makeBanhChung(size = 0.8) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(size, size * 0.45, size), toon('#3f8f3a'), { p: [0, size * 0.225, 0] }));
  for (const r of [0, Math.PI / 2]) {
    g.add(mesh(new THREE.BoxGeometry(size * 1.02, size * 0.47, 0.05), toon('#e9d8a6'), { p: [0, size * 0.225, 0], r: [0, r, 0] }));
  }
  return g;
}

/** Hanging string of red firecrackers (dây pháo). */
export function makeFirecrackers(len = 14) {
  const g = new THREE.Group();
  const red = glow('#ff2e2e', 1.3);
  const geo = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8);
  for (let i = 0; i < len; i++) {
    for (const sx of [-1, 1]) g.add(mesh(geo, red, { p: [sx * 0.1, -i * 0.2, 0], r: [0, 0, sx * 0.9] }));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, len * 0.2, 6), toon('#ffcf4a'), { p: [0, -len * 0.1, 0] }));
  return g;
}

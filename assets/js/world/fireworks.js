// Pháo hoa: GPU-friendly particle fireworks (one Points object, ring-buffer of particles).
import * as THREE from 'three';
import { rand, pick } from './toon.js';

export const PALETTES = [
  ['#ffd23f', '#fff1a8', '#ff9f1c'],
  ['#ff2e3a', '#ffcf4a', '#ffffff'],
  ['#ff6fa3', '#ffd1e1', '#ffcf4a'],
  ['#7df9ff', '#ffffff', '#ffd23f'],
  ['#b388ff', '#ff6fa3', '#fff1a8'],
];

export class Fireworks {
  constructor(capacity = 9000) {
    this.cap = capacity;
    this.pos = new Float32Array(capacity * 3);
    // park unused particles far below the ground so they can never show as a stray dot
    for (let i = 1; i < capacity * 3; i += 3) this.pos[i] = -1000;
    this.col = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.base = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity).fill(1);
    this.drag = new Float32Array(capacity);
    this.cursor = 0;
    this.rockets = [];

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));

    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);

    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.7,
        map: new THREE.CanvasTexture(cv),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.points.frustumCulled = false;
    this._c = new THREE.Color();
  }

  _emit(x, y, z, vx, vy, vz, color, life, drag) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.cap;
    const j = i * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
    this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.base[j] = color.r; this.base[j + 1] = color.g; this.base[j + 2] = color.b;
    this.life[i] = this.maxLife[i] = life;
    this.drag[i] = drag;
  }

  /** Launch a rocket from `from` that explodes at `to`. */
  launch(from, to, palette = pick(PALETTES)) {
    const dur = rand(1.0, 1.5);
    this.rockets.push({
      p: from.clone(),
      v: to.clone().sub(from).divideScalar(dur),
      left: dur,
      palette,
    });
  }

  burst(at, palette = pick(PALETTES), count = 220) {
    const c = this._c;
    const speed = rand(7, 11);
    const ring = Math.random() < 0.25;
    const dir = new THREE.Vector3();
    for (let k = 0; k < count; k++) {
      if (ring) dir.set(Math.cos((k / count) * Math.PI * 2), Math.sin((k / count) * Math.PI * 2), rand(-0.1, 0.1));
      else dir.randomDirection();
      const s = speed * (ring ? 1 : rand(0.75, 1));
      c.set(pick(palette)).multiplyScalar(3);
      this._emit(at.x, at.y, at.z, dir.x * s, dir.y * s, dir.z * s, c, rand(1.4, 2.4), 1.6);
    }
  }

  update(dt) {
    const c = this._c;
    for (let r = this.rockets.length - 1; r >= 0; r--) {
      const k = this.rockets[r];
      k.p.addScaledVector(k.v, dt);
      k.left -= dt;
      c.set('#ffcf8a').multiplyScalar(2.5);
      this._emit(k.p.x, k.p.y, k.p.z, rand(-0.4, 0.4), rand(-1.5, -0.5), rand(-0.4, 0.4), c, 0.5, 2);
      if (k.left <= 0) {
        this.burst(k.p, k.palette);
        this.rockets.splice(r, 1);
      }
    }

    const { pos, vel, col, base, life, maxLife, drag } = this;
    for (let i = 0; i < this.cap; i++) {
      const j = i * 3;
      if (life[i] <= 0) {
        if (pos[j + 1] !== -1000) {
          col[j] = col[j + 1] = col[j + 2] = 0;
          pos[j + 1] = -1000;
        }
        continue;
      }
      life[i] -= dt;
      const f = Math.exp(-drag[i] * dt);
      vel[j] *= f; vel[j + 1] = vel[j + 1] * f - 4.2 * dt; vel[j + 2] *= f;
      pos[j] += vel[j] * dt; pos[j + 1] += vel[j + 1] * dt; pos[j + 2] += vel[j + 2] * dt;
      const k = Math.max(life[i] / maxLife[i], 0);
      const twinkle = k < 0.35 ? 0.5 + 0.5 * Math.sin(life[i] * 60 + i) : 1;
      const a = k * k * twinkle;
      col[j] = base[j] * a; col[j + 1] = base[j + 1] * a; col[j + 2] = base[j + 2] * a;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

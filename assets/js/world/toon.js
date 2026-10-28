// Shared helpers for the cartoon (toon-shaded) look of the whole world.
import * as THREE from 'three';

const tones = new Uint8Array([70, 150, 230, 255]);
export const gradientMap = new THREE.DataTexture(tones, tones.length, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.needsUpdate = true;

const toonCache = new Map();
/** Cached toon material. Pass extra options to get a unique (uncached) one. */
export function toon(color, opts) {
  if (opts) return new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
  if (!toonCache.has(color)) toonCache.set(color, new THREE.MeshToonMaterial({ color, gradientMap }));
  return toonCache.get(color);
}

/** Unlit, HDR-bright material so the bloom pass makes it glow. */
export function glow(color, intensity = 2.2) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    toneMapped: false,
  });
}

/** Create a mesh and apply position / rotation / scale in one call. */
export function mesh(geometry, material, { p, r, s } = {}) {
  const m = new THREE.Mesh(geometry, material);
  if (p) m.position.set(...p);
  if (r) m.rotation.set(...r);
  if (s) typeof s === 'number' ? m.scale.setScalar(s) : m.scale.set(...s);
  return m;
}

const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1b0b14, side: THREE.BackSide });
/** Inverted-hull outline: gives characters a hand-drawn cartoon edge. */
export function addOutline(root, thickness = 0.05) {
  const targets = [];
  root.traverse((o) => {
    if (o.isMesh && !o.userData.noOutline && o.material !== outlineMat) targets.push(o);
  });
  for (const m of targets) {
    m.geometry.computeBoundingSphere();
    const radius = m.geometry.boundingSphere.radius || 1;
    const hull = new THREE.Mesh(m.geometry, outlineMat);
    hull.scale.setScalar(1 + thickness / radius);
    hull.userData.noOutline = true;
    m.add(hull);
  }
  return root;
}

const shadowTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
const shadowGeo = new THREE.PlaneGeometry(1, 1);
/** Soft blob shadow under characters and props (cheaper than real shadows). */
export function blobShadow(size = 1.6) {
  return mesh(shadowGeo, shadowMat, { p: [0, 0.03, 0], r: [-Math.PI / 2, 0, 0], s: [size, size, 1] });
}

/** Canvas texture with text: used for calligraphy scrolls and signs. */
export function textTexture(text, { w = 256, h = 512, bg = '#c8102e', fg = '#ffd76a', font = 'bold 120px "Playfair Display", serif', vertical = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(12, 12, w - 24, h - 24);
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (vertical) {
    const words = text.split(' ');
    words.forEach((word, i) => g.fillText(word, w / 2, (h / (words.length + 1)) * (i + 1)));
  } else {
    g.fillText(text, w / 2, h / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

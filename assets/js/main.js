// Year End Party 2026 · Terumo BCT Việt Nam — scroll-driven 3D journey through Việt Nam at Tết.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { EVENT, AGENDA } from './config.js';
import * as City from './world/cities.js';
import { FOG_COLOR, createSky, createGround, createHorizonHaze, Petals, SkyLanterns, createJourneyPath } from './world/decor.js';
import { Fireworks } from './world/fireworks.js';
import { initSkyTap } from './sky-tap.js';
import { toon, rand } from './world/toon.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 820px)').matches;

/**
 * One stop per <section data-step>. `shift` slides the 3D subject sideways so the text card
 * has room: +1 pushes the subject to the left (card on the right), -1 to the right.
 */
const STOPS = [
  { build: City.buildHero, at: [0, 0, 18], cam: [0, 5, 37], look: [0, 6.2, 14], shift: -0.55 },
  { build: City.buildHaNoi, at: [-16, 0, -34], cam: [-2, 9, -12], look: [-16, 3, -36], shift: 0.5 },
  { build: City.buildHue, at: [14, 0, -84], cam: [1, 9, -61], look: [14, 4, -86], shift: -0.5 },
  { build: City.buildDaNang, at: [12, 0, -132], cam: [5, 8, -107], look: [12, 4.5, -133], shift: 0.5 },
  { build: City.buildHoiAn, at: [-10, 0, -178], cam: [3, 7.5, -157], look: [-10, 3, -180], shift: -0.5 },
  { build: City.buildHCM, at: [-14, 0, -228], cam: [3, 10, -195], look: [-14, 10, -230], shift: 0.5 },
  { build: City.buildStage, at: [0, 0, -282], cam: [0, 7, -252], look: [0, 5, -288], shift: -0.45 },
  // mini game: the stage again, seen from the side and higher up, fireworks in full swing
  { build: null, at: [0, 0, -282], cam: [36, 20, -250], look: [0, 9, -284], shift: 0.5 },
  // finale: bird's-eye view of the whole S-shaped route, north on the left, south on the right
  { build: null, at: [0, 0, -130], cam: [175, 125, -132], look: [0, -10, -132], shift: 0 },
];

fillContent();
setupUI();

try {
  await Promise.race([
    Promise.all(['700 40px "Playfair Display"', 'italic 40px "Playfair Display"', '600 40px "Be Vietnam Pro"'].map((f) => document.fonts.load(f, 'ĐẠÊ'))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  init3D();
} catch (err) {
  console.warn('WebGL unavailable, showing static background.', err);
  document.body.classList.add('no-webgl');
  hideLoader();
  playIntroText();
}

/* ═══════════════════════════════ 3D ═══════════════════════════════ */
function init3D() {
  const canvas = document.getElementById('webgl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0085);
  const camera = new THREE.PerspectiveCamera(isMobile ? 62 : 48, innerWidth / innerHeight, 0.1, 2000);

  scene.add(new THREE.HemisphereLight('#ffd9b0', '#40204a', 1.1));
  const sun = new THREE.DirectionalLight('#ffe2b8', 1.5);
  sun.position.set(30, 60, 25);
  scene.add(sun);
  const haze = createHorizonHaze();
  scene.add(createSky(), createGround(), haze);

  const fireworks = new Fireworks(isMobile ? 5000 : 9000);
  scene.add(fireworks.points);

  // build the cities, each facing its camera keyframe
  const cities = STOPS.map((s) => {
    if (!s.build) return null;
    const g = s.build({ fireworks });
    g.position.set(...s.at);
    g.lookAt(s.cam[0], 0, s.cam[2]);
    scene.add(g);
    const updaters = [];
    g.traverse((o) => o.userData.update && updaters.push(o.userData.update));
    return { g, updaters };
  });

  const pathPts = STOPS.filter((s) => s.build).map((s) => new THREE.Vector3(...s.at).lerp(new THREE.Vector3(s.cam[0], 0, s.cam[2]), 0.62).setY(0));
  pathPts.unshift(new THREE.Vector3(0, 0, 60));
  scene.add(createJourneyPath(new THREE.CatmullRomCurve3(pathPts)));

  const petals = new Petals(reduceMotion ? 120 : isMobile ? 250 : 450);
  scene.add(petals.points);
  const skyLanterns = new SkyLanterns(isMobile ? 90 : 160, -300, 40);
  scene.add(skyLanterns.mesh);

  // giant golden "2027"
  const year = new THREE.Group();
  year.position.set(0, 10.5, 9);
  year.visible = !isMobile; // the narrow hero already shows both years in HTML
  year.scale.setScalar(0.001);
  scene.add(year);
  new FontLoader().load('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    const geo = new TextGeometry('2027', { font, size: 3.6, depth: 0.9, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.1, bevelSegments: 3 });
    geo.center();
    year.add(new THREE.Mesh(geo, toon('#ffcf4a', { emissive: '#a35a00', emissiveIntensity: 0.55 })));
  });

  // camera rails
  const camCurve = new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.cam)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.look)), false, 'centripetal');
  const last = STOPS.length - 1;

  // post-processing: bloom makes lanterns, fireworks and the dragon glow
  const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: isMobile ? 0 : 4 });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.85, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // scroll → camera progress (GSAP ScrollTrigger, scrubbed for smoothness)
  const sections = [...document.querySelectorAll('[data-step]')];
  const state = { p: 0 };
  let stopScroll = [];
  const measure = () => {
    const max = ScrollTrigger.maxScroll(window) || 1;
    stopScroll = sections.map((s) => THREE.MathUtils.clamp((s.offsetTop + s.offsetHeight / 2 - innerHeight / 2) / max, 0, 1));
  };
  ScrollTrigger.addEventListener('refresh', measure);
  gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: reduceMotion ? true : 1.1 } });
  measure();

  // progress (0..1) → stop index (0..last), so each stop is reached when its section is centred
  const toStop = (p) => {
    for (let i = 0; i < last; i++) {
      if (p <= stopScroll[i + 1]) {
        const span = stopScroll[i + 1] - stopScroll[i] || 1;
        return i + THREE.MathUtils.clamp((p - stopScroll[i]) / span, 0, 1);
      }
    }
    return last;
  };

  // intro fly-in
  const intro = { k: reduceMotion ? 0 : 1 };
  const introOffset = new THREE.Vector3(0, 22, 55);

  // pointer parallax + click to launch fireworks
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  addEventListener('pointermove', (e) => pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1));
  const ray = new THREE.Raycaster();
  // Chạm/nhấp vào nửa trên màn hình (bầu trời) mới bắn pháo hoa — xem sky-tap.js
  initSkyTap({
    onSky: (x, y) => {
      if (fireworks.rockets.length >= (isMobile ? 6 : 10)) return; // giữ FPS khi bấm dồn dập
      ray.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
      const to = ray.ray.at(40, new THREE.Vector3());
      to.y = Math.max(to.y, 8);
      fireworks.launch(new THREE.Vector3(to.x + rand(-2, 2), 0, to.z), to, undefined, true); // true = có tiếng pháo
    },
  });

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    bloom.resolution.set(innerWidth / 2, innerHeight / 2);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  if (new URLSearchParams(location.search).has('debug')) window.__yep = { THREE, scene, camera, fireworks, state };

  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const right = new THREE.Vector3();
  const clock = new THREE.Clock();
  let nextShow = 1.5;
  let first = true;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const u = toStop(state.p);
    camCurve.getPoint(u / last, camPos);
    lookCurve.getPoint(u / last, look);
    // portrait phones see a much narrower slice: pull the camera back along its view line
    if (isMobile) camPos.sub(look).multiplyScalar(1.65).add(look);
    camPos.addScaledVector(introOffset, intro.k);

    smoothPointer.lerp(pointer, 0.05);
    right.subVectors(look, camPos).cross(camera.up).normalize();
    camPos.addScaledVector(right, smoothPointer.x * 1.4).add(new THREE.Vector3(0, smoothPointer.y * 0.8, 0));
    camera.position.copy(camPos);
    camera.lookAt(look);
    haze.position.set(camPos.x, 50, camPos.z);

    // horizontal framing so the subject and the text card share the screen
    const i0 = Math.floor(u);
    const i1 = Math.min(i0 + 1, last);
    const shift = isMobile ? 0 : THREE.MathUtils.lerp(STOPS[i0].shift, STOPS[i1].shift, u - i0);
    // on phones the text card sits at the bottom, so lift the scene into the upper half
    const vy = isMobile ? 0.2 * THREE.MathUtils.smoothstep(u, 0, 1) : 0;
    camera.setViewOffset(innerWidth, innerHeight, shift * innerWidth * 0.2, vy * innerHeight, innerWidth, innerHeight);

    // thinner fog for the bird's-eye finale
    scene.fog.density = THREE.MathUtils.lerp(0.0085, 0.0028, THREE.MathUtils.smoothstep(u, last - 1, last));

    // animate only what is near the camera
    cities.forEach((c, i) => {
      if (!c) return;
      const near = camPos.distanceTo(c.g.position) < 120;
      if (near) for (const up of c.updaters) up(t, dt);
    });

    year.rotation.y = Math.sin(t * 0.6) * 0.25;
    year.position.y = 10.5 + Math.sin(t * 1.2) * 0.3;

    // automatic fireworks around the current stop; more of them at the party stage
    nextShow -= dt;
    if (nextShow <= 0) {
      const party = u > last - 2.5;
      nextShow = reduceMotion ? 3.5 : party ? rand(0.35, 0.8) : rand(0.9, 1.9);
      const base = party && u > last - 0.5 ? new THREE.Vector3(rand(-30, 30), 0, rand(-260, -20)) : look.clone();
      const from = new THREE.Vector3(base.x + rand(-22, 22), 0, base.z + rand(-14, 2));
      fireworks.launch(from, from.clone().add(new THREE.Vector3(rand(-3, 3), rand(16, party ? 34 : 26), 0)));
    }

    fireworks.update(dt);
    petals.update(dt, t, camPos);
    skyLanterns.update(dt, t);
    composer.render(dt);

    if (first) {
      first = false;
      hideLoader();
      playIntro(intro, year, fireworks);
    }
  });
}

function playIntro(intro, year, fireworks) {
  playIntroText();
  const tl = gsap.timeline();
  tl.to(intro, { k: 0, duration: reduceMotion ? 0 : 3.2, ease: 'power3.inOut' }, 0);
  tl.to(year.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'elastic.out(1, 0.5)' }, reduceMotion ? 0 : 2.2);
  if (!reduceMotion) {
    tl.call(() => {
      for (let i = 0; i < 5; i++) {
        const x = -24 + i * 12;
        setTimeout(() => fireworks.launch(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, rand(20, 26), rand(-6, 2))), i * 160);
      }
    }, null, 2.4);
  }
}

/* ═══════════════════════════════ UI ═══════════════════════════════ */
function hideLoader() {
  gsap.to('#loader', { autoAlpha: 0, duration: 0.8, delay: 0.2, onComplete: () => document.getElementById('loader')?.remove() });
}

function playIntroText() {
  gsap.from('.hero [data-anim]', { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.3 });
  gsap.from('.hero-title .char', { yPercent: 110, rotate: 8, autoAlpha: 0, duration: 1, stagger: 0.035, ease: 'back.out(1.6)', delay: 0.5 });
}

function fillContent() {
  document.querySelectorAll('[data-bind]').forEach((el) => (el.textContent = EVENT[el.dataset.bind] ?? ''));

  const list = document.getElementById('agenda-list');
  list.innerHTML = AGENDA.map((a) => `
    <li data-anim>
      <time>${a.time}</time>
      <div><h3>${a.title}</h3><p>${a.desc}</p></div>
    </li>`).join('');

  document.querySelectorAll('[data-rsvp]').forEach((a) => {
    if (EVENT.rsvpUrl) {
      a.href = EVENT.rsvpUrl;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.removeAttribute('href');
      a.classList.add('is-disabled');
      a.setAttribute('aria-disabled', 'true');
      a.title = 'Form đăng ký sẽ được mở sớm';
    }
  });

  const ics = document.getElementById('add-calendar');
  if (ics) ics.href = icsLink();

  if (EVENT.splineScene) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://unpkg.com/@splinetool/viewer@2.0.64/build/spline-viewer.js';
    document.head.appendChild(s);
    const slot = document.getElementById('spline-slot');
    slot.innerHTML = `<spline-viewer url="${EVENT.splineScene}" loading-anim-type="spinner-small-light"></spline-viewer>`;
    slot.hidden = false;
  }

  // split the hero title into characters for the GSAP reveal
  document.querySelectorAll('.hero-title .line').forEach((line) => {
    line.innerHTML = line.textContent.normalize('NFC').trim().split(/\s+/)
      .map((word) => `<span class="word">${[...word].map((ch) => `<span class="char">${ch}</span>`).join('')}</span>`)
      .join(' ');
  });

  startCountdown();
}

function icsLink() {
  const start = new Date(EVENT.partyDate);
  const end = new Date(start.getTime() + 5 * 3600 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Terumo BCT Viet Nam//YEP 2026//VI', 'BEGIN:VEVENT',
    `UID:yep2026-${fmt(start)}@tbvevents.github.io`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${EVENT.name} · ${EVENT.company}`, `LOCATION:${EVENT.venue} - ${EVENT.address}`,
    `DESCRIPTION:${EVENT.theme}. Dress code: ${EVENT.dressCode}`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
}

function startCountdown() {
  const party = new Date(EVENT.partyDate).getTime();
  const tet = new Date(EVENT.tetDate).getTime();
  const els = Object.fromEntries(['d', 'h', 'm', 's'].map((k) => [k, document.querySelector(`[data-cd="${k}"]`)]));
  const tetEl = document.getElementById('tet-days');
  const tick = () => {
    const now = Date.now();
    const left = Math.max(0, party - now);
    const pad = (n) => String(n).padStart(2, '0');
    els.d.textContent = pad(Math.floor(left / 864e5));
    els.h.textContent = pad(Math.floor(left / 36e5) % 24);
    els.m.textContent = pad(Math.floor(left / 6e4) % 60);
    els.s.textContent = pad(Math.floor(left / 1e3) % 60);
    if (left === 0) document.querySelector('.countdown')?.classList.add('is-live');
    const tetDays = Math.ceil((tet - now) / 864e5);
    tetEl.textContent = tetDays > 0 ? `Còn ${tetDays} ngày nữa là Tết Đinh Mùi 2027` : 'Chúc Mừng Năm Mới Đinh Mùi 2027!';
  };
  tick();
  setInterval(tick, 1000);
}

function setupUI() {
  const sections = [...document.querySelectorAll('[data-step]')];
  const dots = [...document.querySelectorAll('.journey-nav button')];

  dots.forEach((d) => d.addEventListener('click', () => {
    sections[+d.dataset.go].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }));
  document.querySelectorAll('[data-scroll-to]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector(a.dataset.scrollTo).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }));

  sections.forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => self.isActive && dots.forEach((d, k) => d.classList.toggle('is-active', k === i)),
    });
    if (i === 0) return;
    gsap.from(sec.querySelectorAll('[data-anim]'), {
      y: 50,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: sec, start: 'top 72%', toggleActions: 'play none none reverse' },
    });
    const word = sec.querySelector('.wish');
    if (word) gsap.fromTo(word, { yPercent: 30, rotate: -8 }, { yPercent: -30, rotate: 4, ease: 'none', scrollTrigger: { trigger: sec, scrub: true } });
  });

  gsap.to('.scroll-hint', { autoAlpha: 0, scrollTrigger: { start: 10, end: 200, scrub: true } });
  gsap.to('.progress-bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

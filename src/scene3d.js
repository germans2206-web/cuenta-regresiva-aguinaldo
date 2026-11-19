// Fondo 3D: pared de taller con engranajes metálicos girando, caños de cobre,
// nieve navideña y luces bokeh. Se empaqueta con esbuild -> public/js/scene3d.bundle.js
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const canvas = document.getElementById('bg3d');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
} catch (e) {
  console.warn('WebGL no disponible, se usa fondo plano', e);
}

if (renderer) init();

function init() {
  // Fondo desenfocado por la niebla: se renderiza a menor resolución y el navegador lo escala.
  // Calidad: alta = ~1280 px de ancho a 30 fps; baja = ~800 px a 24 fps (TV y equipos modestos).
  const QUALITY = { high: { w: 1280, fps: 30 }, low: { w: 800, fps: 24 } };
  let q = QUALITY[new URLSearchParams(location.search).has('lite') ? 'low' : 'high'];
  const applySize = () => {
    renderer.setPixelRatio(Math.min(1, q.w / window.innerWidth));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  applySize();
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a1424');
  scene.fog = new THREE.Fog('#0a1424', 30, 80);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 34);

  // ---------- Pared de chapas con remaches ----------
  const wallTex = makeWallTexture();
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(6, 3);
  wallTex.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 80),
    new THREE.MeshStandardMaterial({ map: wallTex, color: '#5d7091', roughness: 0.8, metalness: 0.5 })
  );
  wall.position.z = -26;
  scene.add(wall);

  // ---------- Luces ----------
  scene.add(new THREE.HemisphereLight('#7f97c4', '#0a1424', 0.45));
  const key = new THREE.SpotLight('#ffd7a0', 900, 120, Math.PI / 5, 0.6, 1.4);
  key.position.set(-12, 26, 20); key.target.position.set(0, 0, -20);
  scene.add(key, key.target);
  const key2 = new THREE.SpotLight('#ffe2b8', 700, 120, Math.PI / 5, 0.6, 1.4);
  key2.position.set(16, 24, 18); key2.target.position.set(4, -2, -20);
  scene.add(key2, key2.target);
  const red = new THREE.PointLight('#ff6a3c', 70, 60, 1.6); red.position.set(0, 2, -8); scene.add(red);
  const green = new THREE.PointLight('#7fa6ff', 60, 50, 1.6); green.position.set(-22, 12, -10); scene.add(green);
  const weld = new THREE.PointLight('#7fc8ff', 0, 40, 1.4); weld.position.set(-12, -8, -6); scene.add(weld);

  // ---------- Engranajes 3D ----------
  const mats = {
    steel: new THREE.MeshStandardMaterial({ color: '#7d8ba3', metalness: 0.95, roughness: 0.35 }),
    brass: new THREE.MeshStandardMaterial({ color: '#a8853a', metalness: 0.95, roughness: 0.32 }),
    copper: new THREE.MeshStandardMaterial({ color: '#9a6a58', metalness: 0.95, roughness: 0.38 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2a3548', metalness: 0.9, roughness: 0.45 }),
  };
  const gears = [];
  const module = 0.42;
  function addGear(t, x, y, z, mat, dir, speed, depth = 1.2) {
    const r = t * module;
    const geo = new THREE.ExtrudeGeometry(gearShape(r, t, module * 2.2), {
      depth, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.14, bevelSegments: 2, curveSegments: 6,
    });
    geo.center();
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
    // eje
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.16, depth + 1.4, 20), mats.dark);
    axle.rotation.x = Math.PI / 2; axle.position.set(x, y, z);
    scene.add(axle);
    gears.push({ m, dir, speed: speed / t });
    return { x, y, r };
  }
  function chain(start, list, z, baseSpeed) {
    let prev = addGear(start.t, start.x, start.y, z, start.mat, 1, baseSpeed);
    let dir = 1;
    for (const g of list) {
      const r = g.t * module, a = (g.ang * Math.PI) / 180;
      const x = prev.x + Math.cos(a) * (prev.r + r) * 1.02;
      const y = prev.y + Math.sin(a) * (prev.r + r) * 1.02;
      dir = -dir;
      prev = addGear(g.t, x, y, z, g.mat, dir, baseSpeed);
    }
  }
  chain({ t: 30, x: -30, y: 6, mat: mats.steel }, [
    { t: 16, ang: -40, mat: mats.brass }, { t: 22, ang: -100, mat: mats.copper }, { t: 12, ang: 200, mat: mats.steel },
  ], -20, 9);
  chain({ t: 34, x: 30, y: -4, mat: mats.dark }, [
    { t: 14, ang: 150, mat: mats.brass }, { t: 20, ang: 95, mat: mats.steel }, { t: 26, ang: 30, mat: mats.copper },
  ], -21, 8);
  chain({ t: 26, x: -46, y: -14, mat: mats.brass }, [
    { t: 14, ang: 30, mat: mats.steel }, { t: 18, ang: 80, mat: mats.dark },
  ], -24, 7);
  chain({ t: 22, x: 48, y: 16, mat: mats.steel }, [
    { t: 12, ang: 200, mat: mats.copper }, { t: 30, ang: 250, mat: mats.brass },
  ], -25, 6);
  chain({ t: 18, x: -4, y: 15, mat: mats.copper }, [
    { t: 12, ang: 10, mat: mats.steel }, { t: 24, ang: -10, mat: mats.brass },
  ], -23, 7);

  // ---------- Caños de cobre ----------
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#2a3548', metalness: 0.9, roughness: 0.35 });
  const pipePaths = [
    [[-70, -14, -18], [-20, -14, -18], [-14, -10, -18], [-14, 22, -18], [-8, 26, -18], [70, 26, -18]],
    [[-70, 20, -24], [70, 20, -24]],
    [[40, -40, -16], [40, 6, -16], [46, 12, -16], [70, 12, -16]],
  ];
  for (const pts of pipePaths) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.05);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.9, 16, false), pipeMat);
    scene.add(tube);
  }

  // ---------- Nieve ----------
  const SNOW = 700;
  const snowGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(SNOW * 3), spd = new Float32Array(SNOW), phase = new Float32Array(SNOW);
  for (let i = 0; i < SNOW; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
    pos[i * 3 + 2] = -18 + Math.random() * 40;
    spd[i] = 1.2 + Math.random() * 2.4;
    phase[i] = Math.random() * Math.PI * 2;
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({
    size: 0.32, map: softDot('#ffffff'), transparent: true, depthWrite: false, opacity: 0.55,
    blending: THREE.AdditiveBlending, fog: true,
  }));
  scene.add(snow);

  // ---------- Bokeh navideño ----------
  const bokeh = [];
  const bcols = ['#ffd166', '#fff1d0', '#ffcf70', '#7fa6ff'];
  for (let i = 0; i < 46; i++) {
    const mat = new THREE.SpriteMaterial({ map: softDot(bcols[i % bcols.length], true), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 });
    const s = new THREE.Sprite(mat);
    const sc = 1.5 + Math.random() * 3.5;
    s.scale.set(sc, sc, 1);
    s.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.3) * 50, -24 + Math.random() * 6);
    scene.add(s);
    bokeh.push({ s, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.4 });
  }

  // ---------- Interacción / animación ----------
  let mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('resize', () => {
    applySize();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  let weldUntil = 0, celebrate = false, rate = 1, rateTarget = 1, rateStep = 1, dim = 1, dimTarget = 1;
  window.scene3d = {
    weld(ms = 3000) { weldUntil = performance.now() + ms; },
    celebrate(on = true) { celebrate = on; },
    setRate(to, ms = 1500) { rateTarget = to; rateStep = 1 / Math.max(ms / 1000, 0.05); },
    dim(on) { dimTarget = on ? 0.25 : 1; },
    setQuality(level) { q = QUALITY[level] || q; applySize(); },
    pause(on) { running = !on && !document.hidden; if (running) { clock.getDelta(); loop(); } canvas.style.visibility = on ? 'hidden' : ''; },
  };
  const baseKey = key.intensity, baseKey2 = key2.intensity;

  const clock = new THREE.Clock();
  let running = true, last = 0, looping = false;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });

  function loop() {
    if (looping || !running) return;
    looping = true;
    requestAnimationFrame(frame);
  }
  function frame(ts) {
    if (!running) { looping = false; return; }
    requestAnimationFrame(frame);
    if (ts - last < 1000 / q.fps - 2) return; // tope de cuadros: el fondo no necesita 60 fps
    last = ts;
    const dt = Math.min(clock.getDelta(), 0.08);
    const t = clock.elapsedTime;

    rate += Math.sign(rateTarget - rate) * Math.min(Math.abs(rateTarget - rate), rateStep * dt);
    dim += (dimTarget - dim) * Math.min(1, dt * 3);
    key.intensity = baseKey * dim; key2.intensity = baseKey2 * dim;
    for (const g of gears) g.m.rotation.z += g.dir * g.speed * dt * (celebrate ? 4 : 1) * rate;

    const p = snowGeo.attributes.position.array;
    for (let i = 0; i < SNOW; i++) {
      p[i * 3 + 1] -= spd[i] * dt;
      p[i * 3] += Math.sin(t * 0.8 + phase[i]) * 0.012;
      if (p[i * 3 + 1] < -26) { p[i * 3 + 1] = 26; p[i * 3] = (Math.random() - 0.5) * 90; }
    }
    snowGeo.attributes.position.needsUpdate = true;

    for (const b of bokeh) b.s.material.opacity = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(t * b.sp + b.ph));

    // chispazo de soldadura (cuando el oso suelda)
    const now = performance.now();
    weld.intensity = now < weldUntil ? 60 + Math.random() * 160 : weld.intensity * 0.85;
    red.intensity = 60 + Math.sin(t * 2) * 15 + (celebrate ? Math.random() * 200 : 0);

    camera.position.x += (mx * 2.2 + Math.sin(t * 0.15) * 1.2 - camera.position.x) * 0.03;
    camera.position.y += (-my * 1.4 + Math.cos(t * 0.12) * 0.6 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, -20);

    renderer.render(scene, camera);
  }
  loop();
}

function gearShape(r, teeth, h) {
  const shape = new THREE.Shape();
  const ro = r + h / 2, ri = r - h / 2, step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [[ri, a - step * 0.5], [ri, a - step * 0.28], [ro, a - step * 0.17], [ro, a + step * 0.17], [ri, a + step * 0.28]];
    pts.forEach(([rr, aa], j) => {
      const x = rr * Math.cos(aa), y = rr * Math.sin(aa);
      if (i === 0 && j === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  // ventanas (aligerado) en engranajes grandes
  if (teeth >= 16) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const w = new THREE.Path();
      w.absarc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.16, 0, Math.PI * 2, true);
      shape.holes.push(w);
    }
  }
  return shape;
}

function softDot(color, bokeh = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, color);
  grd.addColorStop(bokeh ? 0.55 : 0.3, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = bokeh ? 0.6 : 1;
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWallTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1a2840'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { // rayado del metal
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 40, 1);
  }
  g.strokeStyle = '#1b1f25'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; g.strokeRect(5, 5, 246, 246);
  for (const [x, y] of [[16, 16], [128, 16], [240, 16], [16, 240], [128, 240], [240, 240], [16, 128], [240, 128]]) {
    const r = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
    r.addColorStop(0, '#d4dae2'); r.addColorStop(1, '#2a2f36');
    g.fillStyle = r; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}

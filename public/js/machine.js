// Maquinaria del taller: engranajes que engranan de verdad, cables con corriente,
// caños con vapor, pistón, luces navideñas y un arbolito hecho de engranajes.
import { gearPath } from './gear.js';

const NS = 'http://www.w3.org/2000/svg';
const OL = '#14110f';

// Curva de las luces navideñas (la usa también el pájaro para pararse)
export const LIGHTS = { x0: 0, y0: 112, cx: 960, cy: 214, x1: 1920, y1: 112 };
export function lightsY(x) {
  const t = x / 1920;
  return (1 - t) ** 2 * LIGHTS.y0 + 2 * t * (1 - t) * LIGHTS.cy + t * t * LIGHTS.y1;
}

// Crea un tren de engranajes que engranan. Cada item: {r, t, ang (dirección desde el anterior), color}
function gearTrain(start, items, baseDur = 14) {
  const out = [];
  let prev = null;
  const module = start.r / start.t; // misma relación r/dientes = engranan
  items.forEach((g, i) => {
    const r = g.t * module;
    let cx, cy, phase = 0, dir = 1, dur = baseDur * (g.t / start.t);
    if (i === 0) { cx = start.x; cy = start.y; }
    else {
      const a = (g.ang * Math.PI) / 180;
      cx = prev.cx + Math.cos(a) * (prev.r + r);
      cy = prev.cy + Math.sin(a) * (prev.r + r);
      const p1 = 360 / prev.t, p2 = 360 / g.t;
      const f1 = ((((g.ang - prev.phase) / p1) % 1) + 1) % 1;
      phase = g.ang + 180 - p2 * (0.5 - f1);
      dir = -prev.dir;
    }
    const gear = { cx, cy, r, t: g.t, phase, dir, dur, color: g.color, h: Math.max(10, r * 0.2 * (g.h || 1)) };
    // misma altura de diente en todo el tren para que encajen
    gear.h = module * 2.2;
    out.push(gear); prev = gear;
  });
  return out;
}

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// ---- Control de la maquinaria (paradas, atascos, arranques) ----
const gearAnims = [];
export const machineCtl = {
  svg: null, master: null, rate: 1, _raf: 0,
  ramp(to, ms = 1500) {
    cancelAnimationFrame(this._raf);
    const from = this.rate, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms), e = k * k * (3 - 2 * k);
      this.rate = from + (to - from) * e;
      gearAnims.forEach((a) => (a.playbackRate = this.rate));
      if (k < 1) this._raf = requestAnimationFrame(step);
    };
    step();
    window.scene3d?.setRate?.(to, ms);
  },
  stop(ms = 1600) { this.svg.classList.add('stopped'); this.ramp(0, ms); },
  jam() { this.svg.classList.add('stopped', 'jam'); this.ramp(0, 250); },
  unjam() { this.svg.classList.remove('jam'); },
  start(ms = 2200) { this.svg.classList.remove('stopped', 'jam'); this.ramp(1, ms); },
  pin(visible) { const p = document.getElementById('masterPin'); if (p) p.style.opacity = visible ? 1 : 0; },
};

function drawGear(g, parent) {
  const grp = el('g', { class: 'gear-rot' }, parent);
  grp.style.transformBox = 'view-box';
  grp.style.transformOrigin = `${g.cx}px ${g.cy}px`;
  gearAnims.push(grp.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${360 * g.dir}deg)` }],
    { duration: g.dur * 1000, iterations: Infinity }));
  el('path', { d: gearPath(g.cx, g.cy, g.r, g.t, g.h, g.phase), fill: g.color, stroke: OL, 'stroke-width': 4, 'fill-rule': 'evenodd' }, grp);
  // anillo interior + rayos para que se note el giro
  el('circle', { cx: g.cx, cy: g.cy, r: g.r * 0.72, fill: 'none', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 6 }, grp);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + (g.phase * Math.PI) / 180;
    el('line', {
      x1: g.cx + Math.cos(a) * g.r * 0.34, y1: g.cy + Math.sin(a) * g.r * 0.34,
      x2: g.cx + Math.cos(a) * g.r * 0.7, y2: g.cy + Math.sin(a) * g.r * 0.7,
      stroke: 'rgba(0,0,0,.35)', 'stroke-width': 8, 'stroke-linecap': 'round',
    }, grp);
  }
  el('circle', { cx: g.cx, cy: g.cy, r: g.r * 0.2, fill: '#2a2f36', stroke: OL, 'stroke-width': 3 }, grp);
  el('circle', { cx: g.cx - g.r * 0.25, cy: g.cy - g.r * 0.45, r: g.r * 0.12, fill: 'rgba(255,255,255,.18)' }, grp);
  return grp;
}

function cable(d, color, parent, flow = '#ffe066', width = 18) {
  el('path', { d, fill: 'none', stroke: OL, 'stroke-width': width + 8, 'stroke-linecap': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.18)', 'stroke-width': width * 0.25, 'stroke-linecap': 'round', transform: 'translate(-3,-4)' }, parent);
  if (flow) {
    const f = el('path', { d, fill: 'none', stroke: flow, 'stroke-width': width * 0.35, 'stroke-linecap': 'round', class: 'cable-flow' }, parent);
    f.style.filter = `drop-shadow(0 0 6px ${flow})`;
    f.style.animationDuration = (0.8 + Math.random() * 0.8).toFixed(2) + 's';
  }
}

function plug(x, y, rot, parent) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, parent);
  el('rect', { x: -26, y: -20, width: 40, height: 40, rx: 6, fill: '#3c434d', stroke: OL, 'stroke-width': 4 }, g);
  el('rect', { x: 14, y: -12, width: 16, height: 24, rx: 3, fill: '#c9a227', stroke: OL, 'stroke-width': 3 }, g);
  el('circle', { cx: -6, cy: 0, r: 5, fill: '#3dff7a' }, g).style.filter = 'drop-shadow(0 0 6px #3dff7a)';
}

function pipe(d, parent, color = '#b8733a', w = 34) {
  el('path', { d, fill: 'none', stroke: OL, 'stroke-width': w + 8, 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': w * 0.18, 'stroke-linejoin': 'round', transform: 'translate(-6,-8)' }, parent);
}
function flange(x, y, vertical, parent) {
  const w = vertical ? 58 : 18, h = vertical ? 18 : 58;
  el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 4, fill: '#8a5326', stroke: OL, 'stroke-width': 4 }, parent);
}

function gauge(x, y, r, parent, label) {
  el('circle', { cx: x, cy: y, r: r + 8, fill: '#59616d', stroke: OL, 'stroke-width': 5 }, parent);
  el('circle', { cx: x, cy: y, r, fill: '#f3f1ea', stroke: OL, 'stroke-width': 3 }, parent);
  el('path', { d: `M${x + Math.cos(Math.PI * 0.15) * r * 0.8} ${y - Math.sin(Math.PI * 0.15) * r * 0.8} A${r * 0.8} ${r * 0.8} 0 0 0 ${x + Math.cos(Math.PI * 0.4) * r * 0.8} ${y - Math.sin(Math.PI * 0.4) * r * 0.8}`, fill: 'none', stroke: '#e2283b', 'stroke-width': 7 }, parent);
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (1.15 - i * 0.1625);
    el('line', { x1: x + Math.cos(a) * r * 0.82, y1: y - Math.sin(a) * r * 0.82, x2: x + Math.cos(a) * r * 0.95, y2: y - Math.sin(a) * r * 0.95, stroke: OL, 'stroke-width': 3 }, parent);
  }
  if (label) { const t = el('text', { x, y: y + r * 0.5, 'text-anchor': 'middle', 'font-family': 'Chakra Petch', 'font-weight': 700, 'font-size': r * 0.26, fill: '#333' }, parent); t.textContent = label; }
  const n = el('g', { class: 'needle' }, parent);
  n.style.transformOrigin = `${x}px ${y}px`;
  n.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
  el('path', { d: `M${x - 4} ${y} L${x} ${y - r * 0.85} L${x + 4} ${y} Z`, fill: '#e2283b', stroke: OL, 'stroke-width': 2 }, n);
  el('circle', { cx: x, cy: y, r: 7, fill: OL }, parent);
}

function steamPuffs(x, y, parent, n = 3) {
  for (let i = 0; i < n; i++) {
    const c = el('circle', { cx: x + (Math.random() * 20 - 10), cy: y, r: 18 + Math.random() * 10, fill: 'rgba(235,240,245,.8)', class: 'steam' }, parent);
    c.style.animationDelay = (i * 1.05).toFixed(2) + 's';
  }
}

export function buildMachine(svg, frontSvg) {
  const defs = el('defs', {}, svg);
  defs.innerHTML = `
    <radialGradient id="lampGlow" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="rgba(255,214,140,.55)"/><stop offset="100%" stop-color="rgba(255,214,140,0)"/>
    </radialGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2e35"/><stop offset="1" stop-color="#121418"/>
    </linearGradient>
    <linearGradient id="tankG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7d1a22"/><stop offset=".35" stop-color="#d83a45"/><stop offset=".55" stop-color="#b52531"/><stop offset="1" stop-color="#5e1219"/>
    </linearGradient>`;

  // Lámparas industriales colgando
  const lamps = el('g', {}, svg);
  [[300, 230], [1620, 230]].forEach(([x, y]) => {
    el('line', { x1: x, y1: 74, x2: x, y2: y - 30, stroke: '#111', 'stroke-width': 5 }, lamps);
    el('path', { d: `M${x - 200} ${y + 520} L${x - 50} ${y} L${x + 50} ${y} L${x + 200} ${y + 520} Z`, fill: 'url(#lampGlow)', class: 'lamp-glow' }, lamps);
    el('path', { d: `M${x - 55} ${y} Q${x} ${y - 60} ${x + 55} ${y} Z`, fill: '#2f6b4f', stroke: OL, 'stroke-width': 4 }, lamps);
    el('ellipse', { cx: x, cy: y + 2, rx: 24, ry: 10, fill: '#fff5d6' }, lamps).style.filter = 'drop-shadow(0 0 14px #ffd98a)';
  });

  // Caños de cobre
  const pipes = el('g', {}, svg);
  pipe('M-40 880 L1940 880', pipes);
  pipe('M1540 880 L1540 470 Q1540 420 1590 420 L1940 420', pipes, '#b8733a', 30);
  pipe('M120 880 L120 520 Q120 470 170 470 L330 470', pipes, '#8d939b', 26);
  [200, 520, 840, 1160, 1480, 1800].forEach((x) => flange(x, 880, false, pipes));
  flange(1540, 640, true, pipes); flange(1720, 420, false, pipes); flange(120, 700, true, pipes);
  gauge(1770, 320, 46, pipes, 'BAR');
  el('line', { x1: 1770, y1: 374, x2: 1770, y2: 420, stroke: OL, 'stroke-width': 10 }, pipes);
  // válvula de vapor
  el('rect', { x: 1856, y: 360, width: 26, height: 44, fill: '#8a5326', stroke: OL, 'stroke-width': 4 }, pipes);
  steamPuffs(1869, 352, pipes, 3);
  steamPuffs(1100, 856, pipes, 2);

  // Pistón (izquierda)
  const pist = el('g', {}, svg);
  el('rect', { x: 290, y: 330, width: 84, height: 140, rx: 8, fill: '#59616d', stroke: OL, 'stroke-width': 5 }, pist);
  el('rect', { x: 300, y: 342, width: 64, height: 16, fill: '#ffc21a', stroke: OL, 'stroke-width': 3 }, pist);
  const rod = el('g', { class: 'piston-rod' }, pist);
  el('rect', { x: 320, y: 230, width: 24, height: 110, fill: '#c7ced6', stroke: OL, 'stroke-width': 4 }, rod);
  el('rect', { x: 298, y: 216, width: 68, height: 22, rx: 5, fill: '#8d939b', stroke: OL, 'stroke-width': 4 }, rod);

  // Engranajes (detrás del panel, asomando)
  machineCtl.svg = svg;
  const gearsG = el('g', { id: 'gearsG' }, svg);
  // Más engranajes: esquinas, piso y bordes del panel
  const extra = [
    gearTrain({ x: 80, y: 190, r: 90, t: 20 }, [{ t: 20, color: '#6d7580' }, { t: 12, ang: 40, color: '#a3542e' }, { t: 8, ang: -20, color: '#c9a227' }], 14),
    gearTrain({ x: 1890, y: 150, r: 80, t: 18 }, [{ t: 18, color: '#7f8893' }, { t: 11, ang: 150, color: '#c9a227' }, { t: 7, ang: 200, color: '#a3542e' }], 12),
    gearTrain({ x: 600, y: 985, r: 70, t: 16 }, [{ t: 16, color: '#6d7580' }, { t: 10, ang: -30, color: '#c9a227' }, { t: 20, ang: 10, color: '#a3542e' }], 12),
    gearTrain({ x: 1180, y: 990, r: 60, t: 14 }, [{ t: 14, color: '#7f8893' }, { t: 9, ang: -40, color: '#c9a227' }, { t: 18, ang: 20, color: '#6d7580' }], 10),
    gearTrain({ x: 520, y: 718, r: 40, t: 10 }, [{ t: 10, color: '#c9a227' }, { t: 8, ang: 25, color: '#8d939b' }], 7),
    gearTrain({ x: 1400, y: 718, r: 40, t: 10 }, [{ t: 10, color: '#c9a227' }, { t: 8, ang: 155, color: '#8d939b' }], 7),
  ];
  extra.flat().forEach((g) => drawGear(g, gearsG));
  const left = gearTrain({ x: 470, y: 600, r: 120, t: 24 }, [
    { t: 24, color: '#7f8893' },
    { t: 14, ang: 205, color: '#c9a227' },
    { t: 18, ang: 120, color: '#a3542e' },
    { t: 10, ang: 160, color: '#8d939b' },
  ], 18);
  const right = gearTrain({ x: 1450, y: 330, r: 110, t: 22 }, [
    { t: 22, color: '#7f8893' },
    { t: 12, ang: 10, color: '#c9a227' },
    { t: 16, ang: 60, color: '#a3542e' },
    { t: 26, ang: 120, color: '#c0392b' },
  ], 16);
  const top = gearTrain({ x: 760, y: 236, r: 64, t: 14 }, [
    { t: 14, color: '#a3542e' },
    { t: 10, ang: -15, color: '#c9a227' },
    { t: 16, ang: 10, color: '#7f8893' },
  ], 10);
  [...left, ...right, ...top].forEach((g) => drawGear(g, gearsG));
  // Engranaje MAESTRO (rojo) con su perno dorado: si falta el perno, se para todo
  const M = right[right.length - 1];
  machineCtl.master = { x: M.cx, y: M.cy, r: M.r };
  const halo = el('circle', { cx: M.cx, cy: M.cy, r: M.r + 16, fill: 'none', stroke: '#ff3b24', 'stroke-width': 4, 'stroke-dasharray': '10 12', class: 'master-halo' }, gearsG);
  const pinG = el('g', { id: 'masterPin' }, gearsG);
  pinG.style.transition = 'opacity .3s';
  const hp = [];
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; hp.push(`${(M.cx + Math.cos(a) * 20).toFixed(1)},${(M.cy + Math.sin(a) * 20).toFixed(1)}`); }
  el('polygon', { points: hp.join(' '), fill: '#ffd23f', stroke: OL, 'stroke-width': 4 }, pinG);
  el('circle', { cx: M.cx, cy: M.cy, r: 7, fill: '#a07f1c', stroke: OL, 'stroke-width': 2 }, pinG);
  const tag = el('g', {}, gearsG);
  el('rect', { x: M.cx - 62, y: M.cy + M.r + 22, width: 124, height: 24, rx: 4, fill: '#c0392b', stroke: OL, 'stroke-width': 3 }, tag);
  const tt = el('text', { x: M.cx, y: M.cy + M.r + 39, 'text-anchor': 'middle', 'font-family': 'Chakra Petch', 'font-weight': 700, 'font-size': 13, fill: '#fff' }, tag);
  tt.textContent = 'ENGRANAJE MAESTRO';

  // Cables hacia el panel
  const cables = el('g', {}, svg);
  cable('M60 300 C 200 300, 260 640, 470 640', '#2b6cb0', cables, '#7cd4ff');
  cable('M0 560 C 180 560, 300 540, 470 540', '#c0392b', cables, '#ffe066', 16);
  cable('M1920 600 C 1700 600, 1640 520, 1450 520', '#27ae60', cables, '#b6ff7c');
  cable('M1920 760 C 1700 760, 1620 640, 1450 640', '#e67e22', cables, '#ffe066', 16);
  cable('M960 1100 C 960 900, 960 820, 960 706', '#222831', cables, '#ff6b5a', 20); // desde la bici/dínamo
  plug(470, 640, 0, cables); plug(470, 540, 0, cables);
  plug(1450, 520, 180, cables); plug(1450, 640, 180, cables);
  plug(960, 706, -90, cables);

  // Luces navideñas (cable superior)
  const lights = el('g', {}, svg);
  const L = LIGHTS;
  el('path', { d: `M${L.x0} ${L.y0} Q${L.cx} ${L.cy} ${L.x1} ${L.y1}`, fill: 'none', stroke: '#0f2a18', 'stroke-width': 7 }, lights);
  const cols = ['#ff3b3b', '#3dff7a', '#ffd23f', '#4fc3ff', '#ff7bd5'];
  for (let i = 0, x = 30; x < 1900; x += 56, i++) {
    const y = lightsY(x);
    const g = el('g', { transform: `translate(${x} ${y})` }, lights);
    el('rect', { x: -6, y: 0, width: 12, height: 10, fill: '#1f3d2a', stroke: OL, 'stroke-width': 2 }, g);
    const b = el('ellipse', { cx: 0, cy: 22, rx: 9, ry: 14, fill: cols[i % cols.length], class: 'xmas-bulb' }, g);
    b.style.filter = `drop-shadow(0 0 8px ${cols[i % cols.length]})`;
    b.style.animationDelay = (-(i % 5) * 0.32 - Math.random() * 0.2).toFixed(2) + 's';
  }

  // Arbolito navideño de engranajes (abajo a la derecha)
  const tree = el('g', {}, svg);
  const tg = [[1830, 985, 72, 16], [1830, 880, 58, 13], [1830, 795, 44, 11], [1830, 728, 32, 9], [1830, 680, 22, 7]];
  tg.forEach(([x, y, r, t], i) => drawGear({ cx: x, cy: y, r, t, h: r * 0.32, phase: 0, dir: i % 2 ? -1 : 1, dur: 6 + i * 1.5, color: i % 2 ? '#1c8a4a' : '#22a457' }, tree));
  const orn = [['#ff3b3b', 1790, 960], ['#ffd23f', 1872, 900], ['#4fc3ff', 1800, 820], ['#ff3b3b', 1862, 760], ['#ffd23f', 1812, 720]];
  orn.forEach(([c, x, y]) => { const o = el('circle', { cx: x, cy: y, r: 10, fill: c, stroke: OL, 'stroke-width': 3, class: 'xmas-bulb' }, tree); o.style.animationDelay = (-Math.random() * 2).toFixed(2) + 's'; });
  const star = el('g', { class: 'star-tip', id: 'treeStar' }, tree);
  star.style.transition = 'opacity .6s';
  const sp = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 13 : 30; sp.push(`${1830 + Math.cos(a) * rr},${636 + Math.sin(a) * rr}`); }
  el('polygon', { points: sp.join(' '), fill: '#ffd23f', stroke: OL, 'stroke-width': 4 }, star).style.filter = 'drop-shadow(0 0 12px #ffd23f)';
  el('rect', { x: 1806, y: 1050, width: 48, height: 22, fill: '#7a4a2a', stroke: OL, 'stroke-width': 3 }, tree);

  // Máquina con el bulón M24 (el pinscher pelea con él)
  const blk = el('g', { id: 'm24block' }, svg);
  blk.style.transformBox = 'view-box'; blk.style.transformOrigin = '1428px 1046px';
  el('rect', { x: 1376, y: 910, width: 104, height: 136, rx: 6, fill: '#59616d', stroke: OL, 'stroke-width': 4 }, blk);
  el('rect', { x: 1376, y: 910, width: 104, height: 14, fill: '#ffc21a', stroke: OL, 'stroke-width': 3 }, blk);
  [[1388, 936], [1468, 936], [1388, 1034], [1468, 1034]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 4, fill: '#9aa3ad' }, blk));
  el('rect', { x: 1426, y: 1004, width: 40, height: 18, rx: 3, fill: '#e2283b', stroke: OL, 'stroke-width': 2 }, blk);
  const mt = el('text', { x: 1446, y: 1017, 'text-anchor': 'middle', 'font-family': 'Chakra Petch', 'font-weight': 700, 'font-size': 10, fill: '#fff' }, blk); mt.textContent = 'M24';
  const bolt = el('g', { id: 'm24bolt' }, blk);
  const bp = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; bp.push(`${(1412 + Math.cos(a) * 22).toFixed(1)},${(970 + Math.sin(a) * 22).toFixed(1)}`); }
  el('polygon', { points: bp.join(' '), fill: '#c7ced6', stroke: OL, 'stroke-width': 3 }, bolt);
  el('circle', { cx: 1412, cy: 970, r: 8.8, fill: '#59616d', stroke: OL, 'stroke-width': 2 }, bolt);

  // ---------- Elementos al frente ----------
  const f = frontSvg;
  el('rect', { x: 0, y: 1046, width: 1920, height: 40, fill: 'url(#floorG)' }, f);
  const hz = el('g', {}, f);
  for (let x = -40; x < 1960; x += 56) el('path', { d: `M${x} 1046 l28 0 l-14 14 l-28 0 Z`, fill: '#ffc21a' }, hz);
  el('rect', { x: 0, y: 1060, width: 1920, height: 20, fill: '#15181c' }, f);
  // Tanque rojo (el pulpo vive acá adentro)
  const tank = el('g', {}, f);
  el('path', { d: 'M48 800 L48 1040 Q170 1070 292 1040 L292 800 Z', fill: 'url(#tankG)', stroke: OL, 'stroke-width': 5 }, tank);
  el('ellipse', { cx: 170, cy: 800, rx: 122, ry: 22, fill: 'none', stroke: OL, 'stroke-width': 5 }, tank);
  el('path', { d: 'M48 800 Q170 836 292 800', fill: 'none', stroke: '#e86a73', 'stroke-width': 8 }, tank);
  el('rect', { x: 48, y: 880, width: 244, height: 18, fill: '#ffc21a', stroke: OL, 'stroke-width': 3 }, tank);
  const tl = el('text', { x: 170, y: 960, 'text-anchor': 'middle', 'font-family': 'Saira Stencil One', 'font-size': 34, fill: '#fff2' }, tank);
  tl.textContent = 'AGUA FRÍA';
  tl.setAttribute('fill', 'rgba(255,255,255,.75)');
  el('ellipse', { cx: 110, cy: 920, rx: 12, ry: 70, fill: 'rgba(255,255,255,.18)' }, tank);
}

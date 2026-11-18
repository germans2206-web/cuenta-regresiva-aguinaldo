// Calibre del reloj del aguinaldo: un movimiento estilo relojería suiza que "hace funcionar" el panel.
// Paleta "Calibre nocturno": platina azul medianoche con perlado, puentes de rodio con Côtes de Genève,
// ruedas de oro y acero esqueletadas, rubíes en los ejes y tornillos de acero azulado.
// Todo con trazo fino y tonos fríos para que los personajes (trazo grueso, colores planos) resalten.

const NS = 'http://www.w3.org/2000/svg';
const LINE = '#0b1220';      // trazo fino de la maquinaria
const PAL = {
  night: '#0a1424', plate: '#12223a', rhodium: '#2a3548', rhodiumHi: '#44526a',
  gold: '#c9a24a', goldHi: '#f2d995', goldLo: '#6e521a', steel: '#a7b2c2', steelLo: '#5c6878',
  ruby: '#c8102e', blued: '#2f5bd3', ivory: '#f4e9cf', emerald: '#1f7a4d',
};

// Curva de las luces navideñas (la usa también el pájaro para pararse)
export const LIGHTS = { x0: 0, y0: 112, cx: 960, cy: 214, x1: 1920, y1: 112 };
export function lightsY(x) {
  const t = x / 1920;
  return (1 - t) ** 2 * LIGHTS.y0 + 2 * t * (1 - t) * LIGHTS.cy + t * t * LIGHTS.y1;
}

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const pt = (cx, cy, r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;

// ---------- Engranajes que engranan de verdad ----------
function gearTrain(start, items, baseDur = 14) {
  const out = [];
  let prev = null;
  const module = start.r / start.t;
  items.forEach((g, i) => {
    const r = g.t * module;
    let cx, cy, phase = 0, dir = 1;
    const dur = baseDur * (g.t / start.t);
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
    const gear = { cx, cy, r, t: g.t, phase, dir, dur, mat: g.mat || 'gold', style: g.style, h: module * 2.3 };
    out.push(gear); prev = gear;
  });
  return out;
}

// Contorno con dientes finos + ventanas de esqueletado (relleno evenodd)
function wheelPath(cx, cy, r, teeth, h, phaseDeg, spokes = 5) {
  const ro = r + h / 2, ri = r - h / 2, step = (Math.PI * 2) / teeth, ph = (phaseDeg * Math.PI) / 180;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step + ph;
    [[ri, a - step * 0.5], [ri, a - step * 0.26], [ro, a - step * 0.14], [ro, a + step * 0.14], [ri, a + step * 0.26]]
      .forEach(([rr, aa], j) => { d += (i === 0 && j === 0 ? 'M' : 'L') + pt(cx, cy, rr, aa); });
  }
  d += 'Z';
  if (spokes && r >= 26) {
    const rin = r * 0.3, rout = r * 0.76, half = Math.min(0.2, 6 / r);
    for (let k = 0; k < spokes; k++) {
      const a0 = ph + (k * 2 * Math.PI) / spokes + half, a1 = ph + ((k + 1) * 2 * Math.PI) / spokes - half;
      d += `M${pt(cx, cy, rout, a0)}A${rout} ${rout} 0 0 1 ${pt(cx, cy, rout, a1)}L${pt(cx, cy, rin, a1)}A${rin} ${rin} 0 0 0 ${pt(cx, cy, rin, a0)}Z`;
    }
  }
  return d;
}

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

function jewel(cx, cy, r, parent) {
  el('circle', { cx, cy, r: r * 1.7, fill: 'url(#gGold)', stroke: LINE, 'stroke-width': 1.2 }, parent);
  el('circle', { cx, cy, r, fill: 'url(#gRuby)', stroke: '#4a0410', 'stroke-width': 1 }, parent);
  el('circle', { cx: cx - r * 0.35, cy: cy - r * 0.35, r: r * 0.32, fill: 'rgba(255,255,255,.75)' }, parent);
}
function screw(cx, cy, r, parent, rot = Math.random() * 180) {
  el('circle', { cx, cy, r, fill: 'url(#gBlued)', stroke: LINE, 'stroke-width': 1.2 }, parent);
  el('line', { x1: cx - r * 0.75, y1: cy, x2: cx + r * 0.75, y2: cy, stroke: '#0c1a3a', 'stroke-width': r * 0.32, transform: `rotate(${rot} ${cx} ${cy})` }, parent);
}

function drawGear(g, parent) {
  const grp = el('g', { class: 'gear-rot' }, parent);
  grp.style.transformBox = 'view-box';
  grp.style.transformOrigin = `${g.cx}px ${g.cy}px`;
  gearAnims.push(grp.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${360 * g.dir}deg)` }], { duration: g.dur * 1000, iterations: Infinity }));
  const fill = { gold: 'url(#gGold)', steel: 'url(#gSteel)', rose: 'url(#gRose)', emerald: 'url(#gEmerald)' }[g.mat];
  const edge = { gold: '#3a2a08', steel: '#1d2633', rose: '#3d1a14', emerald: '#06281a' }[g.mat];
  if (g.style === 'barrel') {
    // Barrilete: disco dentado cerrado con la espiral del muelle real grabada
    el('path', { d: wheelPath(g.cx, g.cy, g.r, g.t, g.h, g.phase, 0), fill, stroke: edge, 'stroke-width': 1.6 }, grp);
    let sp = '';
    for (let a = 0; a < Math.PI * 12; a += 0.18) { const rr = g.r * 0.22 + (g.r * 0.6 * a) / (Math.PI * 12); sp += (a ? 'L' : 'M') + pt(g.cx, g.cy, rr, a); }
    el('path', { d: sp, fill: 'none', stroke: 'rgba(30,20,4,.45)', 'stroke-width': 1.4 }, grp);
    el('circle', { cx: g.cx, cy: g.cy, r: g.r * 0.86, fill: 'none', stroke: 'rgba(255,240,200,.35)', 'stroke-width': 1 }, grp);
  } else {
    el('path', { d: wheelPath(g.cx, g.cy, g.r, g.t, g.h, g.phase, g.r > 60 ? 6 : 5), fill, 'fill-rule': 'evenodd', stroke: edge, 'stroke-width': 1.5 }, grp);
    el('circle', { cx: g.cx, cy: g.cy, r: g.r * 0.8, fill: 'none', stroke: 'rgba(255,245,210,.22)', 'stroke-width': 1 }, grp);
  }
  // reflejo fijo (no gira) para que el metal se lea como metal
  el('circle', { cx: g.cx, cy: g.cy, r: g.r * 0.3, fill: fill, stroke: edge, 'stroke-width': 1.2 }, grp);
  jewel(g.cx, g.cy, Math.max(4, g.r * 0.08), grp);
  return grp;
}

// Puente de rodio con Côtes de Genève, rubíes en los extremos y tornillos azulados
function bridge(points, w, parent) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
  el('path', { d, fill: 'none', stroke: '#060b14', 'stroke-width': w + 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.55 }, parent);
  el('path', { d, fill: 'none', stroke: PAL.rhodium, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'url(#cotes)', 'stroke-width': w - 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.10)', 'stroke-width': 1.5, 'stroke-linecap': 'round', transform: `translate(0 ${-w / 2 + 2})` }, parent);
  points.forEach(([x, y], i) => { if (i === 0 || i === points.length - 1) jewel(x, y, w * 0.12, parent); });
  const [a, b] = [points[0], points[points.length - 1]];
  screw(a[0] + (b[0] - a[0]) * 0.33, a[1] + (b[1] - a[1]) * 0.33, w * 0.16, parent);
  screw(a[0] + (b[0] - a[0]) * 0.66, a[1] + (b[1] - a[1]) * 0.66, w * 0.16, parent);
}

// Volante con espiral: el "corazón" del reloj
function balanceWheel(cx, cy, r, parent) {
  const g = el('g', {}, parent);
  const spiral = el('g', { class: 'hairspring' }, g);
  spiral.style.transformOrigin = `${cx}px ${cy}px`;
  let sp = '';
  for (let a = 0; a < Math.PI * 16; a += 0.15) { const rr = r * 0.12 + (r * 0.55 * a) / (Math.PI * 16); sp += (a ? 'L' : 'M') + pt(cx, cy, rr, a); }
  el('path', { d: sp, fill: 'none', stroke: '#7fa6ff', 'stroke-width': 1.3, opacity: 0.9 }, spiral);
  const wheel = el('g', { class: 'balance' }, g);
  wheel.style.transformOrigin = `${cx}px ${cy}px`;
  el('circle', { cx, cy, r, fill: 'none', stroke: '#3a2a08', 'stroke-width': 13 }, wheel);
  el('circle', { cx, cy, r, fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 10 }, wheel);
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3;
    el('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r, stroke: 'url(#gGold)', 'stroke-width': 6, 'stroke-linecap': 'round' }, wheel);
  }
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6 + 0.26; el('circle', { cx: cx + Math.cos(a) * (r + 8), cy: cy + Math.sin(a) * (r + 8), r: 4, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1 }, wheel); }
  jewel(cx, cy, 6, g);
}

// Rueda de escape: avanza un diente por segundo, como el reloj
function escapeWheel(cx, cy, r, parent) {
  const grp = el('g', { class: 'escape' }, parent);
  grp.style.transformOrigin = `${cx}px ${cy}px`;
  let d = '';
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    d += `${i ? 'L' : 'M'}${pt(cx, cy, r * 0.72, a)}L${pt(cx, cy, r, a + 0.16)}L${pt(cx, cy, r * 0.9, a + 0.3)}`;
  }
  d += 'Z';
  el('path', { d, fill: 'url(#gSteel)', stroke: '#1d2633', 'stroke-width': 1.2 }, grp);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; el('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * r * 0.7, y2: cy + Math.sin(a) * r * 0.7, stroke: 'url(#gSteel)', 'stroke-width': 4 }, grp); }
  jewel(cx, cy, 4, parent);
}
function palletFork(x1, y1, x2, y2, parent) {
  const g = el('g', { class: 'pallet' }, parent);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  g.style.transformOrigin = `${mx}px ${my}px`;
  el('line', { x1, y1, x2, y2, stroke: 'url(#gSteel)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  const nx = -(y2 - y1) * 0.18, ny = (x2 - x1) * 0.18;
  el('path', { d: `M${x2 - nx} ${y2 - ny} L${x2} ${y2} L${x2 + nx} ${y2 + ny}`, fill: 'none', stroke: 'url(#gSteel)', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  el('circle', { cx: x2 - nx, cy: y2 - ny, r: 3.5, fill: PAL.ruby }, g);
  el('circle', { cx: x2 + nx, cy: y2 + ny, r: 3.5, fill: PAL.ruby }, g);
  jewel(mx, my, 3.5, g);
}

function cable(d, parent, flow = '#ffd27a', width = 14) {
  el('path', { d, fill: 'none', stroke: '#05090f', 'stroke-width': width + 4, 'stroke-linecap': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: '#1b2433', 'stroke-width': width, 'stroke-linecap': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.08)', 'stroke-width': width * 0.25, 'stroke-linecap': 'round', transform: 'translate(-2,-3)' }, parent);
  const f = el('path', { d, fill: 'none', stroke: flow, 'stroke-width': width * 0.28, 'stroke-linecap': 'round', class: 'cable-flow' }, parent);
  f.style.filter = `drop-shadow(0 0 4px ${flow})`;
  f.style.animationDuration = (1 + Math.random() * 0.6).toFixed(2) + 's';
}
function plug(x, y, rot, parent) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, parent);
  el('rect', { x: -24, y: -17, width: 36, height: 34, rx: 6, fill: PAL.rhodium, stroke: LINE, 'stroke-width': 2 }, g);
  el('rect', { x: 12, y: -10, width: 14, height: 20, rx: 3, fill: 'url(#gGold)', stroke: LINE, 'stroke-width': 1.5 }, g);
  el('circle', { cx: -6, cy: 0, r: 4, fill: '#5dffa0' }, g).style.filter = 'drop-shadow(0 0 5px #5dffa0)';
}
function pipe(d, parent, w = 28) {
  el('path', { d, fill: 'none', stroke: '#05090f', 'stroke-width': w + 4, 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: '#26303f', 'stroke-width': w, 'stroke-linejoin': 'round' }, parent);
  el('path', { d, fill: 'none', stroke: 'rgba(170,190,215,.22)', 'stroke-width': w * 0.16, 'stroke-linejoin': 'round', transform: 'translate(-4,-6)' }, parent);
}
function flange(x, y, vertical, parent) {
  const w = vertical ? 46 : 14, h = vertical ? 14 : 46;
  el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 3, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1.5 }, parent);
}
function gauge(x, y, r, parent) {
  el('circle', { cx: x, cy: y, r: r + 9, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 2 }, parent);
  el('circle', { cx: x, cy: y, r, fill: PAL.ivory, stroke: '#3a2a08', 'stroke-width': 1.5 }, parent);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1.15 - i * 0.13);
    el('line', { x1: x + Math.cos(a) * r * 0.78, y1: y - Math.sin(a) * r * 0.78, x2: x + Math.cos(a) * r * 0.92, y2: y - Math.sin(a) * r * 0.92, stroke: '#1d2633', 'stroke-width': i % 5 ? 1.2 : 2.5 }, parent);
  }
  el('path', { d: `M${x + Math.cos(Math.PI * 0.12) * r * 0.85} ${y - Math.sin(Math.PI * 0.12) * r * 0.85} A${r * 0.85} ${r * 0.85} 0 0 0 ${x + Math.cos(Math.PI * 0.32) * r * 0.85} ${y - Math.sin(Math.PI * 0.32) * r * 0.85}`, fill: 'none', stroke: PAL.ruby, 'stroke-width': 4 }, parent);
  const t = el('text', { x, y: y + r * 0.48, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': r * 0.24, fill: '#2a3548' }, parent); t.textContent = 'BAR';
  const n = el('g', { class: 'needle' }, parent);
  n.style.transformOrigin = `${x}px ${y}px`;
  n.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
  el('path', { d: `M${x - 3} ${y} L${x} ${y - r * 0.82} L${x + 3} ${y} Z`, fill: PAL.blued }, n);
  el('circle', { cx: x, cy: y, r: 5, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1 }, parent);
}
function steamPuffs(x, y, parent, n = 3) {
  for (let i = 0; i < n; i++) {
    const c = el('circle', { cx: x + (Math.random() * 20 - 10), cy: y, r: 16 + Math.random() * 10, fill: 'rgba(200,215,235,.5)', class: 'steam' }, parent);
    c.style.animationDelay = (i * 1.05).toFixed(2) + 's';
  }
}

export function buildMachine(svg, frontSvg) {
  machineCtl.svg = svg;
  const defs = el('defs', {}, svg);
  defs.innerHTML = `
    <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${PAL.goldHi}"/><stop offset=".45" stop-color="${PAL.gold}"/><stop offset="1" stop-color="${PAL.goldLo}"/></linearGradient>
    <linearGradient id="gRose" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3c4a8"/><stop offset=".5" stop-color="#c98a6b"/><stop offset="1" stop-color="#6b3a28"/></linearGradient>
    <linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e9f1"/><stop offset=".5" stop-color="${PAL.steel}"/><stop offset="1" stop-color="${PAL.steelLo}"/></linearGradient>
    <linearGradient id="gEmerald" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fd18e"/><stop offset=".5" stop-color="${PAL.emerald}"/><stop offset="1" stop-color="#0b3a24"/></linearGradient>
    <radialGradient id="gRuby" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ff6b85"/><stop offset=".5" stop-color="${PAL.ruby}"/><stop offset="1" stop-color="#4a0410"/></radialGradient>
    <radialGradient id="gBlued" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".5" stop-color="${PAL.blued}"/><stop offset="1" stop-color="#0c1a3a"/></radialGradient>
    <pattern id="cotes" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <rect width="22" height="22" fill="${PAL.rhodium}"/><rect width="11" height="22" fill="${PAL.rhodiumHi}" opacity=".55"/></pattern>
    <pattern id="perlage" width="38" height="33" patternUnits="userSpaceOnUse">
      <rect width="38" height="33" fill="${PAL.plate}"/>
      <circle cx="19" cy="16" r="13" fill="none" stroke="rgba(160,190,230,.028)" stroke-width="6"/>
      <circle cx="0" cy="0" r="13" fill="none" stroke="rgba(160,190,230,.02)" stroke-width="6"/><circle cx="38" cy="33" r="13" fill="none" stroke="rgba(160,190,230,.02)" stroke-width="6"/></pattern>
    <radialGradient id="plateShade" cx=".5" cy=".45" r=".6"><stop offset=".6" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,.55)"/></radialGradient>
    <radialGradient id="lampGlow" cx="50%" cy="0%" r="100%"><stop offset="0%" stop-color="rgba(255,226,170,.30)"/><stop offset="100%" stop-color="rgba(255,226,170,0)"/></radialGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16223a"/><stop offset="1" stop-color="#070d18"/></linearGradient>
    <linearGradient id="tankG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#101b2e"/><stop offset=".35" stop-color="#2d4466"/><stop offset=".6" stop-color="#1d2f4b"/><stop offset="1" stop-color="#0b1424"/></linearGradient>`;

  // Platina principal con perlado: el "reloj por dentro" que enmarca el panel
  const plate = el('g', { id: 'mainplate' }, svg);
  el('circle', { cx: 960, cy: 500, r: 660, fill: 'url(#perlage)', stroke: '#05090f', 'stroke-width': 6 }, plate);
  el('circle', { cx: 960, cy: 500, r: 660, fill: 'url(#plateShade)' }, plate);
  el('circle', { cx: 960, cy: 500, r: 648, fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 3, opacity: 0.55 }, plate);
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; screw(960 + Math.cos(a) * 630, 500 + Math.sin(a) * 630, 9, plate, k * 25); }

  // Lámparas de taller (grafito y oro)
  const lamps = el('g', {}, svg);
  [[300, 230], [1620, 230]].forEach(([x, y]) => {
    el('line', { x1: x, y1: 74, x2: x, y2: y - 30, stroke: '#05090f', 'stroke-width': 4 }, lamps);
    el('path', { d: `M${x - 220} ${y + 560} L${x - 46} ${y} L${x + 46} ${y} L${x + 220} ${y + 560} Z`, fill: 'url(#lampGlow)', class: 'lamp-glow' }, lamps);
    el('path', { d: `M${x - 52} ${y} Q${x} ${y - 58} ${x + 52} ${y} Z`, fill: '#1b2433', stroke: LINE, 'stroke-width': 2 }, lamps);
    el('path', { d: `M${x - 52} ${y} L${x + 52} ${y}`, stroke: 'url(#gGold)', 'stroke-width': 4 }, lamps);
    el('ellipse', { cx: x, cy: y + 2, rx: 22, ry: 8, fill: '#fff4d9' }, lamps).style.filter = 'drop-shadow(0 0 12px #ffe2a8)';
  });

  // Conductos de grafito con bridas de oro
  const pipes = el('g', {}, svg);
  pipe('M-40 880 L1940 880', pipes);
  pipe('M1540 880 L1540 470 Q1540 420 1590 420 L1940 420', pipes, 26);
  pipe('M120 880 L120 520 Q120 470 170 470 L330 470', pipes, 24);
  [200, 520, 840, 1160, 1480, 1800].forEach((x) => flange(x, 880, false, pipes));
  flange(1540, 640, true, pipes); flange(1720, 420, false, pipes); flange(120, 700, true, pipes);
  gauge(1770, 320, 46, pipes);
  el('line', { x1: 1770, y1: 375, x2: 1770, y2: 420, stroke: '#26303f', 'stroke-width': 9 }, pipes);
  el('rect', { x: 1856, y: 362, width: 24, height: 40, rx: 3, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1.5 }, pipes);
  steamPuffs(1868, 354, pipes, 3);
  steamPuffs(1100, 856, pipes, 2);

  // ---------- El calibre ----------
  const gearsG = el('g', { id: 'gearsG' }, svg);
  const trains = {
    left: gearTrain({ x: 470, y: 600, r: 120, t: 48 }, [
      { t: 48, mat: 'gold' }, { t: 28, ang: 205, mat: 'steel' }, { t: 36, ang: 120, mat: 'rose' }, { t: 20, ang: 160, mat: 'gold' },
    ], 18),
    right: gearTrain({ x: 1450, y: 330, r: 110, t: 44 }, [
      { t: 44, mat: 'gold', style: 'barrel' }, { t: 24, ang: 10, mat: 'steel' }, { t: 32, ang: 60, mat: 'gold' }, { t: 52, ang: 120, mat: 'rose' },
    ], 16),
    top: gearTrain({ x: 760, y: 236, r: 64, t: 28 }, [{ t: 28, mat: 'steel' }, { t: 20, ang: -15, mat: 'gold' }, { t: 32, ang: 10, mat: 'rose' }], 10),
    tl: gearTrain({ x: 80, y: 190, r: 90, t: 40 }, [{ t: 40, mat: 'steel' }, { t: 24, ang: 80, mat: 'gold' }], 14),
    tr: gearTrain({ x: 1890, y: 150, r: 80, t: 36 }, [{ t: 36, mat: 'gold' }, { t: 22, ang: 150, mat: 'steel' }, { t: 14, ang: 200, mat: 'rose' }], 12),
    bl: gearTrain({ x: 600, y: 985, r: 70, t: 32 }, [{ t: 32, mat: 'steel' }, { t: 20, ang: -30, mat: 'gold' }, { t: 40, ang: 10, mat: 'rose' }], 12),
    br: gearTrain({ x: 1180, y: 990, r: 60, t: 28 }, [{ t: 28, mat: 'gold' }, { t: 18, ang: -40, mat: 'steel' }, { t: 36, ang: 20, mat: 'gold' }], 10),
    pl: gearTrain({ x: 520, y: 718, r: 40, t: 20 }, [{ t: 20, mat: 'gold' }, { t: 16, ang: 25, mat: 'steel' }], 7),
    pr: gearTrain({ x: 1400, y: 718, r: 40, t: 20 }, [{ t: 20, mat: 'gold' }, { t: 16, ang: 155, mat: 'steel' }], 7),
  };
  // los trenes del piso quedan en penumbra para no competir con los personajes
  const lowG = el('g', { class: 'low-gears' }, gearsG);
  Object.entries(trains).forEach(([k, list]) => list.forEach((g) => drawGear(g, ['bl', 'br', 'pl', 'pr'].includes(k) ? lowG : gearsG)));
  // Trinquete sobre el barrilete (rueda de carga)
  const B = trains.right[0];
  drawGear({ cx: B.cx, cy: B.cy, r: 48, t: 30, h: 7, phase: 0, dir: 1, dur: 40, mat: 'steel' }, gearsG);

  // Volante + escape + áncora (izquierda arriba)
  const bal = el('g', {}, svg);
  balanceWheel(300, 360, 88, bal);
  escapeWheel(430, 206, 40, bal);
  palletFork(330, 300, 404, 232, bal);
  bridge([[300, 360], [190, 300], [120, 300]], 30, bal);

  // Puentes de rodio sobre los trenes de ruedas
  const br = el('g', {}, svg);
  const L = trains.left, R = trains.right, T = trains.top;
  bridge([[L[1].cx, L[1].cy], [L[2].cx, L[2].cy]], 34, br);
  bridge([[L[2].cx, L[2].cy], [L[3].cx, L[3].cy]], 26, br);
  bridge([[R[1].cx, R[1].cy], [R[2].cx, R[2].cy]], 30, br);
  bridge([[T[1].cx, T[1].cy], [T[2].cx, T[2].cy]], 22, br);

  // Engranaje MAESTRO con su perno de oro (si falta, se para todo)
  const M = R[R.length - 1];
  machineCtl.master = { x: M.cx, y: M.cy, r: M.r };
  el('circle', { cx: M.cx, cy: M.cy, r: M.r + 16, fill: 'none', stroke: '#ff3b2f', 'stroke-width': 3, 'stroke-dasharray': '10 12', class: 'master-halo' }, gearsG);
  const pinG = el('g', { id: 'masterPin' }, svg);
  pinG.style.transition = 'opacity .3s';
  const hp = [];
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; hp.push(pt(M.cx, M.cy, 20, a).replace(' ', ',')); }
  el('polygon', { points: hp.join(' '), fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 2 }, pinG);
  jewel(M.cx, M.cy, 7, pinG);
  const tag = el('g', {}, svg);
  el('rect', { x: M.cx - 70, y: M.cy + M.r + 20, width: 140, height: 24, rx: 12, fill: '#0e1828', stroke: 'url(#gGold)', 'stroke-width': 2 }, tag);
  const tt = el('text', { x: M.cx, y: M.cy + M.r + 37, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': 12, 'letter-spacing': 1, fill: PAL.goldHi }, tag);
  tt.textContent = 'Engranaje maestro';

  // Cables: grafito con corriente dorada o cian (solo dos tonos)
  const cables = el('g', {}, svg);
  cable('M0 640 C 200 640, 300 640, 470 640', cables, '#7fd8ff');
  cable('M0 560 C 180 560, 300 540, 470 540', cables, '#ffd27a', 12);
  cable('M1920 600 C 1700 600, 1640 520, 1450 520', cables, '#ffd27a');
  cable('M1920 760 C 1700 760, 1620 640, 1450 640', cables, '#7fd8ff', 12);
  cable('M960 1100 C 960 900, 960 820, 960 706', cables, '#ffd27a', 16);
  plug(470, 640, 0, cables); plug(470, 540, 0, cables);
  plug(1450, 520, 180, cables); plug(1450, 640, 180, cables);
  plug(960, 706, -90, cables);

  // Luces navideñas (paleta cálida y armónica)
  const lights = el('g', {}, svg);
  const Lc = LIGHTS;
  el('path', { d: `M${Lc.x0} ${Lc.y0} Q${Lc.cx} ${Lc.cy} ${Lc.x1} ${Lc.y1}`, fill: 'none', stroke: '#0d2418', 'stroke-width': 5 }, lights);
  const cols = ['#ff5a5f', '#ffd166', '#46d38b', '#fff1d0'];
  for (let i = 0, x = 30; x < 1900; x += 56, i++) {
    const y = lightsY(x);
    const g = el('g', { transform: `translate(${x} ${y})` }, lights);
    el('rect', { x: -5, y: 0, width: 10, height: 9, fill: 'url(#gGold)' }, g);
    const b = el('ellipse', { cx: 0, cy: 20, rx: 8, ry: 12, fill: cols[i % cols.length], class: 'xmas-bulb' }, g);
    b.style.filter = `drop-shadow(0 0 7px ${cols[i % cols.length]})`;
    b.style.animationDelay = (-(i % 4) * 0.4 - Math.random() * 0.2).toFixed(2) + 's';
  }

  // Arbolito de engranajes esmeralda con adornos de oro y rubí
  const tree = el('g', {}, svg);
  [[1830, 985, 72, 32], [1830, 880, 58, 26], [1830, 795, 44, 22], [1830, 728, 32, 18], [1830, 680, 22, 14]]
    .forEach(([x, y, r, t], i) => drawGear({ cx: x, cy: y, r, t, h: r * 0.16, phase: 0, dir: i % 2 ? -1 : 1, dur: 6 + i * 1.5, mat: 'emerald' }, tree));
  [['#ffd166', 1790, 960], ['#ff5a5f', 1872, 900], ['#fff1d0', 1800, 820], ['#ffd166', 1862, 760], ['#ff5a5f', 1812, 720]]
    .forEach(([c, x, y]) => { const o = el('circle', { cx: x, cy: y, r: 9, fill: c, stroke: '#3a2a08', 'stroke-width': 1.5, class: 'xmas-bulb' }, tree); o.style.animationDelay = (-Math.random() * 2).toFixed(2) + 's'; o.style.filter = `drop-shadow(0 0 6px ${c})`; });
  const star = el('g', { class: 'star-tip', id: 'treeStar' }, tree);
  star.style.transition = 'opacity .6s';
  const sp = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 13 : 30; sp.push(`${1830 + Math.cos(a) * rr},${636 + Math.sin(a) * rr}`); }
  el('polygon', { points: sp.join(' '), fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 2 }, star).style.filter = 'drop-shadow(0 0 12px #ffd166)';
  el('rect', { x: 1808, y: 1050, width: 44, height: 20, rx: 3, fill: PAL.rhodium, stroke: LINE, 'stroke-width': 2 }, tree);

  // Máquina del bulón M24 (el pinscher pelea con él)
  const blk = el('g', { id: 'm24block' }, svg);
  blk.style.transformBox = 'view-box'; blk.style.transformOrigin = '1428px 1046px';
  el('rect', { x: 1376, y: 910, width: 104, height: 136, rx: 8, fill: 'url(#cotes)', stroke: '#05090f', 'stroke-width': 3 }, blk);
  el('rect', { x: 1376, y: 910, width: 104, height: 10, rx: 4, fill: 'url(#gGold)' }, blk);
  [[1390, 934], [1466, 934], [1390, 1032], [1466, 1032]].forEach(([x, y]) => screw(x, y, 5, blk));
  el('rect', { x: 1422, y: 1004, width: 46, height: 18, rx: 9, fill: '#0e1828', stroke: 'url(#gGold)', 'stroke-width': 1.5 }, blk);
  const mt = el('text', { x: 1445, y: 1017, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': 10, fill: PAL.goldHi }, blk); mt.textContent = 'M24';
  const bolt = el('g', { id: 'm24bolt' }, blk);
  const bp = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; bp.push(pt(1412, 970, 22, a).replace(' ', ',')); }
  el('polygon', { points: bp.join(' '), fill: 'url(#gSteel)', stroke: '#1d2633', 'stroke-width': 2 }, bolt);
  el('circle', { cx: 1412, cy: 970, r: 8.8, fill: PAL.rhodium, stroke: '#1d2633', 'stroke-width': 1.5 }, bolt);

  // ---------- Elementos al frente ----------
  const f = frontSvg;
  el('rect', { x: -400, y: 1046, width: 2720, height: 400, fill: 'url(#floorG)' }, f);
  el('line', { x1: -400, y1: 1046, x2: 2320, y2: 1046, stroke: 'url(#gGold)', 'stroke-width': 2, opacity: 0.7 }, f);
  el('line', { x1: -400, y1: 1062, x2: 2320, y2: 1062, stroke: 'rgba(255,209,102,.25)', 'stroke-width': 3, 'stroke-dasharray': '26 18' }, f);
  // Tanque de agua fría (acero azul noche con aros de oro)
  const tank = el('g', {}, f);
  el('path', { d: 'M48 800 L48 1040 Q170 1066 292 1040 L292 800 Z', fill: 'url(#tankG)', stroke: '#05090f', 'stroke-width': 3 }, tank);
  el('ellipse', { cx: 170, cy: 800, rx: 122, ry: 22, fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 4 }, tank);
  [870, 1000].forEach((y) => el('path', { d: `M48 ${y} Q170 ${y + 22} 292 ${y}`, fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 6 }, tank));
  const tl = el('text', { x: 170, y: 950, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': 28, 'letter-spacing': 2, fill: PAL.ivory }, tank);
  tl.textContent = 'Agua fría';
  el('ellipse', { cx: 104, cy: 920, rx: 9, ry: 66, fill: 'rgba(255,255,255,.08)' }, tank);
}

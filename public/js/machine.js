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
// Capa flotante: un <svg> chico, posicionado en coordenadas del escenario, que el navegador
// compone en la GPU. Rotar/atenuar este elemento no obliga a redibujar el resto de la máquina.
function floatSvg(container, x, y, w, h, cls) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  s.setAttribute('class', 'float' + (cls ? ' ' + cls : ''));
  Object.assign(s.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  container.appendChild(s);
  return s;
}
// Halo de luz sin filtros (un degradé radial es mucho más barato que drop-shadow)
function halo(cx, cy, r, color, parent, op = 0.55) {
  return el('circle', { cx, cy, r, fill: `url(#halo-${color.replace('#', '')})`, opacity: op }, parent);
}
const haloColors = new Set();
// Capa de piezas animadas por encima de la maquinaria estática (se asigna en buildMachine)
let FRONT = null;
const floatBox = (cx, cy, hw, hh, cls) => floatSvg(FRONT, cx - hw, cy - hh, hw * 2, hh * 2, cls);
// Equivale a "filter: saturate(.88) brightness(.9)" pero horneado en los colores (sin costo por cuadro)
const SAT = 0.88, BRI = 0.9;
function toneRGB(r, g, b) {
  const R = (0.213 + 0.787 * SAT) * r + (0.715 - 0.715 * SAT) * g + (0.072 - 0.072 * SAT) * b;
  const G = (0.213 - 0.213 * SAT) * r + (0.715 + 0.285 * SAT) * g + (0.072 - 0.072 * SAT) * b;
  const B = (0.213 - 0.213 * SAT) * r + (0.715 - 0.715 * SAT) * g + (0.072 + 0.928 * SAT) * b;
  return [R, G, B].map((v) => Math.max(0, Math.min(255, Math.round(v * BRI))));
}
function tone(c) {
  if (!c || c.startsWith('url') || c === 'none') return c;
  let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1]; if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const [r, g, b] = toneRGB(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  m = c.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(',').map((x) => x.trim());
    const [r, g, b] = toneRGB(+p[0], +p[1], +p[2]);
    return p.length > 3 ? `rgba(${r},${g},${b},${p[3]})` : `rgb(${r},${g},${b})`;
  }
  return c;
}
function bakeTone(root) {
  root.querySelectorAll('[fill],[stroke],[stop-color]').forEach((e) => {
    for (const a of ['fill', 'stroke', 'stop-color']) { const v = e.getAttribute(a); if (v) e.setAttribute(a, tone(v)); }
  });
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

function drawGear(g, layer, opacity) {
  const R = Math.ceil(g.r + g.h + 4);
  const fs = floatSvg(layer, g.cx - R, g.cy - R, R * 2, R * 2, 'gear-rot');
  if (opacity) fs.style.opacity = opacity;
  gearAnims.push(fs.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${360 * g.dir}deg)` }], { duration: g.dur * 1000, iterations: Infinity }));
  const grp = el('g', {}, fs);
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
function balanceWheel(cx, cy, r) {
  const spiral = floatBox(cx, cy, r, r, 'hairspring');
  let sp = '';
  for (let a = 0; a < Math.PI * 16; a += 0.15) { const rr = r * 0.12 + (r * 0.55 * a) / (Math.PI * 16); sp += (a ? 'L' : 'M') + pt(cx, cy, rr, a); }
  el('path', { d: sp, fill: 'none', stroke: '#7fa6ff', 'stroke-width': 1.3, opacity: 0.9 }, spiral);
  const wheel = floatBox(cx, cy, r + 16, r + 16, 'balance');
  el('circle', { cx, cy, r, fill: 'none', stroke: '#3a2a08', 'stroke-width': 13 }, wheel);
  el('circle', { cx, cy, r, fill: 'none', stroke: 'url(#gGold)', 'stroke-width': 10 }, wheel);
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3;
    el('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r, stroke: 'url(#gGold)', 'stroke-width': 6, 'stroke-linecap': 'round' }, wheel);
  }
  for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6 + 0.26; el('circle', { cx: cx + Math.cos(a) * (r + 8), cy: cy + Math.sin(a) * (r + 8), r: 4, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1 }, wheel); }
}

// Rueda de escape: avanza un diente por segundo, como el reloj
function escapeWheel(cx, cy, r) {
  const grp = floatBox(cx, cy, r + 4, r + 4, 'escape');
  let d = '';
  const n = 15;
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n;
    d += `${i ? 'L' : 'M'}${pt(cx, cy, r * 0.72, a)}L${pt(cx, cy, r, a + 0.16)}L${pt(cx, cy, r * 0.9, a + 0.3)}`;
  }
  d += 'Z';
  el('path', { d, fill: 'url(#gSteel)', stroke: '#1d2633', 'stroke-width': 1.2 }, grp);
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; el('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * r * 0.7, y2: cy + Math.sin(a) * r * 0.7, stroke: 'url(#gSteel)', 'stroke-width': 4 }, grp); }
  jewel(cx, cy, 4, grp);
}
function palletFork(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, half = Math.hypot(x2 - x1, y2 - y1) / 2 + 16;
  const g = floatBox(mx, my, half, half, 'pallet');
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
  el('path', { d, fill: 'none', stroke: flow, 'stroke-width': width * 0.75, 'stroke-linecap': 'round', opacity: 0.12 }, parent);
  const f = el('path', { d, fill: 'none', stroke: flow, 'stroke-width': width * 0.28, 'stroke-linecap': 'round', class: 'cable-flow' }, parent);
  f.style.animationDuration = (1 + Math.random() * 0.6).toFixed(2) + 's';
}
function plug(x, y, rot, parent) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, parent);
  el('rect', { x: -24, y: -17, width: 36, height: 34, rx: 6, fill: PAL.rhodium, stroke: LINE, 'stroke-width': 2 }, g);
  el('rect', { x: 12, y: -10, width: 14, height: 20, rx: 3, fill: 'url(#gGold)', stroke: LINE, 'stroke-width': 1.5 }, g);
  halo(-6, 0, 11, '#5dffa0', g, 0.7);
  el('circle', { cx: -6, cy: 0, r: 4, fill: '#5dffa0' }, g);
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
  const n = floatBox(x, y, r, r, 'needle');
  n.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
  el('path', { d: `M${x - 3} ${y} L${x} ${y - r * 0.82} L${x + 3} ${y} Z`, fill: PAL.blued }, n);
  el('circle', { cx: x, cy: y, r: 5, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1 }, n);
}
function steamPuffs(x, y, parent, n = 3) {
  for (let i = 0; i < n; i++) {
    const cx = x + (Math.random() * 20 - 10), r = 16 + Math.random() * 10;
    const c = floatBox(cx, y, r, r, 'steam');
    el('circle', { cx, cy: y, r, fill: 'rgba(200,215,235,.5)' }, c);
    c.style.animationDelay = (i * 1.05).toFixed(2) + 's';
  }
}


// ---------- Toque industrial (misma paleta: grafito, oro y un amarillo de seguridad muy medido) ----------
const SAFETY = '#d9a62e';
function rivetRow(x1, y1, x2, y2, n, parent, r = 3) {
  for (let i = 0; i <= n; i++) {
    const x = x1 + ((x2 - x1) * i) / n, y = y1 + ((y2 - y1) * i) / n;
    el('circle', { cx: x, cy: y, r, fill: '#56637a', stroke: '#0b1220', 'stroke-width': 1 }, parent);
    el('circle', { cx: x - r * 0.3, cy: y - r * 0.3, r: r * 0.35, fill: 'rgba(255,255,255,.35)' }, parent);
  }
}
function industrial(svg) {
  const g = el('g', { id: 'industrial' }, svg);
  // Cercha superior (detrás del cartel)
  el('rect', { x: -400, y: 4, width: 2720, height: 86, fill: '#151d2b', stroke: '#05090f', 'stroke-width': 2 }, g);
  for (let x = -400; x < 2320; x += 80) {
    el('path', { d: `M${x} 86 L${x + 40} 8 L${x + 80} 86`, fill: 'none', stroke: '#2a3548', 'stroke-width': 6 }, g);
  }
  el('rect', { x: -400, y: 4, width: 2720, height: 8, fill: '#2a3548' }, g);
  el('rect', { x: -400, y: 82, width: 2720, height: 8, fill: '#2a3548' }, g);
  rivetRow(-380, 86, 2300, 86, 68, g, 2.6);
  // Columnas laterales de perfil doble T con remaches y riostras
  [[0, 1], [1920, -1]].forEach(([x0, s]) => {
    const x = s > 0 ? x0 - 400 : x0;
    el('rect', { x, y: 0, width: 436, height: 1046, fill: '#1a2333', stroke: '#05090f', 'stroke-width': 2 }, g);
    const inner = s > 0 ? 30 : 1890;
    el('rect', { x: inner, y: 0, width: 6, height: 1046, fill: '#2f3b50' }, g);
    rivetRow(s > 0 ? 18 : 1902, 110, s > 0 ? 18 : 1902, 1020, 26, g, 3);
    el('path', { d: s > 0 ? 'M36 90 L120 4' : 'M1884 90 L1800 4', stroke: '#2a3548', 'stroke-width': 10, 'stroke-linecap': 'round' }, g);
    // franja de seguridad discreta al pie de la columna
    for (let k = 0; k < 6; k++) el('path', { d: `M${s > 0 ? 0 : 1884} ${960 + k * 16} l36 -16 l0 8 l-36 16 z`, fill: SAFETY, opacity: 0.55 }, g);
  });
  // Pistón hidráulico (izquierda)
  const ps = el('g', {}, g);
  el('rect', { x: 46, y: 392, width: 40, height: 150, rx: 6, fill: '#26303f', stroke: '#05090f', 'stroke-width': 2 }, ps);
  [410, 520].forEach((y) => el('rect', { x: 42, y, width: 48, height: 10, rx: 3, fill: 'url(#gGold)' }, ps));
  const rod = floatSvg(FRONT, 48, 288, 36, 118, 'piston-rod');
  el('rect', { x: 59, y: 300, width: 14, height: 104, fill: 'url(#gSteel)', stroke: '#1d2633', 'stroke-width': 1 }, rod);
  el('rect', { x: 50, y: 290, width: 32, height: 14, rx: 4, fill: 'url(#gGold)' }, rod);
  // Extractor de aire (derecha)
  const fx = 1846, fy = 530;
  el('circle', { cx: fx, cy: fy, r: 50, fill: '#151d2b', stroke: 'url(#gGold)', 'stroke-width': 4 }, g);
  const blades = floatBox(fx, fy, 46, 46, 'fan-blades');
  for (let k = 0; k < 5; k++) {
    const a = (k * 2 * Math.PI) / 5;
    el('path', { d: `M${fx} ${fy} Q${pt(fx, fy, 40, a - 0.5)} ${pt(fx, fy, 44, a)} Q${pt(fx, fy, 30, a + 0.4)} ${fx} ${fy}Z`, fill: 'url(#gSteel)', opacity: 0.85 }, blades);
  }
  // rejilla por delante de las aspas (capa fija)
  const grill = floatBox(fx, fy, 50, 50);
  [16, 28, 40].forEach((r) => el('circle', { cx: fx, cy: fy, r, fill: 'none', stroke: 'rgba(160,180,210,.35)', 'stroke-width': 1.5 }, grill));
  el('line', { x1: fx - 46, y1: fy, x2: fx + 46, y2: fy, stroke: 'rgba(160,180,210,.35)', 'stroke-width': 1.5 }, grill);
  el('line', { x1: fx, y1: fy - 46, x2: fx, y2: fy + 46, stroke: 'rgba(160,180,210,.35)', 'stroke-width': 1.5 }, grill);
  jewel(fx, fy, 5, grill);
  // Carteles de seguridad
  const sign1 = el('g', { transform: 'translate(40 640)' }, g);
  el('path', { d: 'M30 0 L60 52 L0 52 Z', fill: SAFETY, stroke: '#0b1220', 'stroke-width': 3, 'stroke-linejoin': 'round' }, sign1);
  el('path', { d: 'M33 14 L24 32 L31 32 L27 46 L38 28 L31 28 L35 14 Z', fill: '#0b1220' }, sign1);
  const sign2 = el('g', { transform: 'translate(1858 260)' }, g);
  el('circle', { cx: 26, cy: 26, r: 26, fill: PAL.blued, stroke: '#0b1220', 'stroke-width': 3 }, sign2);
  el('path', { d: 'M12 32 Q12 14 26 13 Q40 14 40 32 Z', fill: '#fff' }, sign2);
  el('rect', { x: 8, y: 31, width: 36, height: 5, rx: 2.5, fill: '#fff' }, sign2);
}

// Cinta transportadora con cajas de repuestos (debajo del panel, detrás de los personajes)
function conveyor(svg) {
  const g = el('g', { id: 'conveyor' }, svg);
  const x1 = 600, x2 = 1340, y = 838;
  [x1 + 30, x2 - 30].forEach((x) => el('rect', { x: x - 6, y: y + 22, width: 12, height: 1046 - y - 22, fill: '#26303f', stroke: '#05090f', 'stroke-width': 1.5 }, g));
  el('rect', { x: x1, y: y - 18, width: x2 - x1, height: 36, rx: 18, fill: '#111826', stroke: '#05090f', 'stroke-width': 2 }, g);
  const belt = el('line', { x1: x1 + 18, y1: y - 15, x2: x2 - 18, y2: y - 15, stroke: '#3a4760', 'stroke-width': 6, 'stroke-dasharray': '22 18', class: 'conveyor-belt' }, g);
  belt.style.strokeDashoffset = 0;
  for (let k = 0; k < 24; k++) el('path', { d: `M${x1 + 20 + k * 30} ${y + 18} l12 0 l-8 8 l-12 0 z`, fill: SAFETY, opacity: 0.45 }, g);
  [x1 + 18, x2 - 18].forEach((x) => {
    const d = floatBox(x, y, 18, 18, 'drum');
    el('circle', { cx: x, cy: y, r: 16, fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 1.5 }, d);
    el('line', { x1: x - 12, y1: y, x2: x + 12, y2: y, stroke: '#3a2a08', 'stroke-width': 3 }, d);
  });
  // cajas: salen escalonadas y recorren la cinta
  for (let k = 0; k < 4; k++) {
    const cx = x1 + 10, w = 44 + (k % 2) * 10, h = 30 + (k % 3) * 6;
    const c = floatSvg(FRONT, cx - 2, y - 20 - h, w + 4, h + 4, 'crate');
    c.style.animationDelay = (-k * 3.5).toFixed(1) + 's';
    el('rect', { x: cx, y: y - 18 - h, width: w, height: h, rx: 3, fill: '#8a6a3a', stroke: '#2a1d08', 'stroke-width': 2 }, c);
    el('path', { d: `M${cx} ${y - 18 - h} l${w} ${h} M${cx + w} ${y - 18 - h} l${-w} ${h}`, stroke: 'rgba(42,29,8,.45)', 'stroke-width': 2 }, c);
    el('rect', { x: cx + w / 2 - 9, y: y - 18 - h / 2 - 6, width: 18, height: 12, rx: 2, fill: PAL.ivory }, c);
  }
}

export function buildMachine(svg, frontSvg) {
  // Capas: base estática (platina, caños) · engranajes en GPU · detalles · adornos al frente
  const rig = document.createElement('div');
  rig.id = 'machineRig';
  svg.parentNode.insertBefore(rig, svg);
  const base = document.createElementNS(NS, 'svg');
  base.id = 'machineBase'; base.setAttribute('viewBox', '0 0 1920 1080'); base.setAttribute('aria-hidden', 'true');
  const gearLayer = document.createElement('div'); gearLayer.id = 'gearLayer'; gearLayer.className = 'mlayer';
  const frontLayer = document.createElement('div'); frontLayer.id = 'machineFront'; frontLayer.className = 'mlayer';
  rig.append(base, gearLayer, svg, frontLayer);
  machineCtl.svg = rig;
  FRONT = frontLayer;
  const top = svg;
  svg = base;
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

  const truss = el('g', { id: 'trussBack' }, svg);
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
    const gl = floatSvg(gearLayer, x - 220, y, 440, 560, 'lamp-glow');
    el('path', { d: `M${x - 220} ${y + 560} L${x - 46} ${y} L${x + 46} ${y} L${x + 220} ${y + 560} Z`, fill: 'url(#lampGlow)' }, gl);
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
  svg = top;
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
  Object.entries(trains).forEach(([k, list]) => list.forEach((g) => drawGear(g, gearLayer, ['bl', 'br', 'pl', 'pr'].includes(k) ? 0.45 : 0)));
  // Trinquete sobre el barrilete (rueda de carga)
  const B = trains.right[0];
  drawGear({ cx: B.cx, cy: B.cy, r: 48, t: 30, h: 7, phase: 0, dir: 1, dur: 40, mat: 'steel' }, gearLayer);

  // Volante + escape + áncora (izquierda arriba)
  balanceWheel(300, 360, 88);
  escapeWheel(430, 206, 40);
  palletFork(330, 300, 404, 232);
  bridge([[300, 360], [190, 300], [120, 300]], 30, floatSvg(frontLayer, 90, 270, 240, 120));

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

  industrial(svg);
  conveyor(svg);

  // Luces navideñas (paleta cálida y armónica)
  const lights = el('g', {}, svg);
  const Lc = LIGHTS;
  el('path', { d: `M${Lc.x0} ${Lc.y0} Q${Lc.cx} ${Lc.cy} ${Lc.x1} ${Lc.y1}`, fill: 'none', stroke: '#0d2418', 'stroke-width': 5 }, lights);
  const cols = ['#ff5a5f', '#ffd166', '#46d38b', '#fff1d0'];
  // 4 tiras de focos (una por color/ritmo): 4 capas en vez de 34
  const strips = [0, 1, 2, 3].map((k) => {
    const st = floatSvg(frontLayer, 0, 100, 1920, 140, 'xmas-bulb');
    st.style.animationDelay = (-k * 0.4).toFixed(2) + 's';
    return st;
  });
  for (let i = 0, x = 30; x < 1900; x += 56, i++) {
    const y = lightsY(x);
    const c = cols[i % cols.length];
    el('rect', { x: x - 5, y, width: 10, height: 9, fill: 'url(#gGold)' }, lights);
    haloColors.add(c);
    halo(x, y + 20, 21, c, strips[i % 4], 0.6);
    el('ellipse', { cx: x, cy: y + 20, rx: 8, ry: 12, fill: c }, strips[i % 4]);
  }

  // Arbolito de engranajes esmeralda con adornos de oro y rubí
  const tree = el('g', {}, svg);
  [[1830, 985, 72, 32], [1830, 880, 58, 26], [1830, 795, 44, 22], [1830, 728, 32, 18], [1830, 680, 22, 14]]
    .forEach(([x, y, r, t], i) => drawGear({ cx: x, cy: y, r, t, h: r * 0.16, phase: 0, dir: i % 2 ? -1 : 1, dur: 6 + i * 1.5, mat: 'emerald' }, frontLayer));
  [['#ffd166', 1790, 960], ['#ff5a5f', 1872, 900], ['#fff1d0', 1800, 820], ['#ffd166', 1862, 760], ['#ff5a5f', 1812, 720]]
    .forEach(([c, x, y]) => {
      const o = floatSvg(frontLayer, x - 20, y - 20, 40, 40, 'xmas-bulb');
      haloColors.add(c); halo(x, y, 19, c, o, 0.6);
      el('circle', { cx: x, cy: y, r: 9, fill: c, stroke: '#3a2a08', 'stroke-width': 1.5 }, o);
      o.style.animationDelay = (-Math.random() * 2).toFixed(2) + 's';
    });
  haloColors.add('#ffd166');
  const starGlow = floatSvg(frontLayer, 1830 - 46, 636 - 46, 92, 92);
  halo(1830, 636, 46, '#ffd166', starGlow, 0.5);
  const star = floatSvg(frontLayer, 1830 - 34, 636 - 34, 68, 68, 'star-tip');
  star.id = 'treeStar';
  // el brillo acompaña a la estrella si el ratón se la roba
  new MutationObserver(() => { starGlow.style.opacity = star.style.opacity; }).observe(star, { attributes: true, attributeFilter: ['style'] });
  star.style.transition = starGlow.style.transition = 'opacity .6s';
  const sp = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 13 : 30; sp.push(`${1830 + Math.cos(a) * rr},${636 + Math.sin(a) * rr}`); }
  el('polygon', { points: sp.join(' '), fill: 'url(#gGold)', stroke: '#3a2a08', 'stroke-width': 2 }, star);
  el('rect', { x: 1808, y: 1050, width: 44, height: 20, rx: 3, fill: PAL.rhodium, stroke: LINE, 'stroke-width': 2 }, tree);

  // Máquina del bulón M24 (el pinscher pelea con él)
  const blk = floatSvg(frontLayer, 1370, 904, 116, 142);
  blk.id = 'm24block'; blk.style.transformOrigin = '50% 100%';
  el('rect', { x: 1376, y: 910, width: 104, height: 136, rx: 8, fill: 'url(#cotes)', stroke: '#05090f', 'stroke-width': 3 }, blk);
  el('rect', { x: 1376, y: 910, width: 104, height: 10, rx: 4, fill: 'url(#gGold)' }, blk);
  [[1390, 934], [1466, 934], [1390, 1032], [1466, 1032]].forEach(([x, y]) => screw(x, y, 5, blk));
  el('rect', { x: 1422, y: 1004, width: 46, height: 18, rx: 9, fill: '#0e1828', stroke: 'url(#gGold)', 'stroke-width': 1.5 }, blk);
  const mt = el('text', { x: 1445, y: 1017, 'text-anchor': 'middle', 'font-family': 'Cinzel, serif', 'font-weight': 700, 'font-size': 10, fill: PAL.goldHi }, blk); mt.textContent = 'M24';
  const bolt = el('g', { id: 'm24bolt' }, blk);
  const bp = []; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; bp.push(pt(1412, 970, 22, a).replace(' ', ',')); }
  el('polygon', { points: bp.join(' '), fill: 'url(#gSteel)', stroke: '#1d2633', 'stroke-width': 2 }, bolt);
  el('circle', { cx: 1412, cy: 970, r: 8.8, fill: PAL.rhodium, stroke: '#1d2633', 'stroke-width': 1.5 }, bolt);

  haloColors.add('#5dffa0');
  defs.insertAdjacentHTML('beforeend', [...haloColors].map((c) => `<radialGradient id="halo-${c.replace('#', '')}"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".35" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join(''));
  bakeTone(rig);

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

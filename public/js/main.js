import { buildMachine, lightsY } from './machine.js';
import { CHARACTERS } from './characters.js';

/* ------------------------------------------------------------------
   Configuración
   - Fecha objetivo: 15/12/2026 00:00 hora de Paraguay (UTC-3)
   - ?fecha=2026-12-15T08:00  → cambia la fecha/hora objetivo
   - ?demo=20                 → la cuenta llega a cero en 20 segundos
------------------------------------------------------------------- */
const params = new URLSearchParams(location.search);
const TZ = '-03:00';
let TARGET = new Date(`2026-12-15T00:00:00${TZ}`);
if (params.get('fecha')) {
  const f = params.get('fecha');
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(f) ? f : `${f.length <= 10 ? f + 'T00:00:00' : f}${TZ}`);
  if (!isNaN(d)) TARGET = d;
}
if (params.get('demo')) TARGET = new Date(Date.now() + (parseInt(params.get('demo'), 10) || 20) * 1000);
const YEAR_START = new Date(`${TARGET.getFullYear()}-01-01T00:00:00${TZ}`);

const $ = (s, r = document) => r.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------------- Escalado del escenario 1920x1080 ---------------- */
const stage = $('#stage');
function fit() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.setProperty('--s', s);
}
window.addEventListener('resize', fit);
fit();

/* ---------------- Maquinaria ---------------- */
buildMachine($('#machine'), $('#frontProps'));

/* ---------------- Reloj de 7 segmentos ---------------- */
const SEGS = (() => {
  const W = 74, H = 128, t = 12, g = 2.5;
  const hz = (yc) => { const x1 = t / 2 + g, x2 = W - t / 2 - g; return `${x1},${yc} ${x1 + t / 2},${yc - t / 2} ${x2 - t / 2},${yc - t / 2} ${x2},${yc} ${x2 - t / 2},${yc + t / 2} ${x1 + t / 2},${yc + t / 2}`; };
  const vt = (xc, y1, y2) => `${xc},${y1} ${xc + t / 2},${y1 + t / 2} ${xc + t / 2},${y2 - t / 2} ${xc},${y2} ${xc - t / 2},${y2 - t / 2} ${xc - t / 2},${y1 + t / 2}`;
  return {
    a: hz(t / 2), g: hz(H / 2), d: hz(H - t / 2),
    f: vt(t / 2, t / 2 + g, H / 2 - g), e: vt(t / 2, H / 2 + g, H - t / 2 - g),
    b: vt(W - t / 2, t / 2 + g, H / 2 - g), c: vt(W - t / 2, H / 2 + g, H - t / 2 - g),
  };
})();
const DIGIT_MAP = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];
function makeDigit() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-4 -2 82 132');
  svg.classList.add('digit');
  svg.innerHTML = `<g transform="skewX(-6) translate(7 0)">${Object.entries(SEGS).map(([k, p]) => `<polygon class="seg" data-s="${k}" points="${p}"/>`).join('')}</g>`;
  return svg;
}
function setDigit(svg, n) {
  const on = DIGIT_MAP[n] || '';
  svg.querySelectorAll('.seg').forEach((s) => s.classList.toggle('on', on.includes(s.dataset.s)));
}
const units = {};
document.querySelectorAll('.unit').forEach((u) => { units[u.dataset.unit] = { el: u.querySelector('.digits'), digits: [] }; });
function renderUnit(key, value, minLen = 2) {
  const u = units[key];
  const str = String(value).padStart(minLen, '0');
  while (u.digits.length < str.length) { const d = makeDigit(); u.el.appendChild(d); u.digits.push(d); }
  while (u.digits.length > str.length) u.el.removeChild(u.digits.pop());
  [...str].forEach((ch, i) => setDigit(u.digits[i], +ch));
}

/* ---------------- Cuenta regresiva ---------------- */
const pad = (n) => String(n).padStart(2, '0');
$('#targetLabel').textContent = `${pad(TARGET.getDate())}/${pad(TARGET.getMonth() + 1)}/${TARGET.getFullYear()}`;
export const remain = { d: 0, h: 0, m: 0, s: 0, ms: 0 };
let lastSec = -1, finished = false;
function tick() {
  const ms = Math.max(0, TARGET - Date.now());
  const sec = Math.floor(ms / 1000);
  remain.ms = ms;
  remain.d = Math.floor(sec / 86400); remain.h = Math.floor((sec % 86400) / 3600);
  remain.m = Math.floor((sec % 3600) / 60); remain.s = sec % 60;
  if (sec !== lastSec) {
    lastSec = sec;
    renderUnit('d', remain.d, 2); renderUnit('h', remain.h); renderUnit('m', remain.m); renderUnit('s', remain.s);
    $('#clock').classList.toggle('wide', remain.d > 99);
    const pct = Math.min(100, Math.max(0, ((Date.now() - YEAR_START) / (TARGET - YEAR_START)) * 100));
    $('#batteryFill').style.width = pct.toFixed(2) + '%';
    $('#batteryPct').textContent = pct.toFixed(1) + '%';
    if (sec % 60 === 0 || !$('#srText').textContent) {
      $('#srText').textContent = `Faltan ${remain.d} días, ${remain.h} horas, ${remain.m} minutos y ${remain.s} segundos para el aguinaldo.`;
    }
    if (ms === 0 && !finished) { finished = true; celebrate(); }
  }
  document.querySelectorAll('.sep').forEach((s) => s.classList.toggle('off', (ms % 1000) < 500 && ms > 0));
  requestAnimationFrame(tick);
}
tick();

const fill = (t) => t.replace('{d}', remain.d).replace('{h}', remain.h).replace('{m}', remain.m);

/* ---------------- Cartel LED ---------------- */
const MESSAGES = [
  'OT N.º 1512 — COBRO DE AGUINALDO — PRIORIDAD: MÁXIMA',
  'FALTAN {d} DÍAS PARA EL 15 DE DICIEMBRE',
  'RECORDATORIO: EL AGUINALDO NO SE COBRA SOLO, SIGAN CON EL PREVENTIVO',
  'SE RUEGA NO GASTAR EL AGUINALDO ANTES DE COBRARLO',
  'EL PULPO SOLICITA 8 PARES DE GUANTES AL ALMACÉN',
  'TERERÉ AUTORIZADO EN HORARIO DE PAUSA 🧉',
  'EL PINSCHER SIGUE PELEANDO CON EL BULÓN M24',
  'SEGURIDAD PRIMERO: CASCO, LENTES Y BOTINES',
  '¡FELIZ NAVIDAD, EQUIPO DE MANTENIMIENTO! 🎄',
];
const track = $('#tickerTrack');
function runTicker() {
  track.innerHTML = MESSAGES.map((m) => `<span>${fill(m)}</span>`).join('');
  const win = track.parentElement.clientWidth;
  const w = track.scrollWidth;
  const anim = track.animate(
    [{ transform: `translate(${win}px,-50%)` }, { transform: `translate(${-w}px,-50%)` }],
    { duration: ((win + w) / 150) * 1000, easing: 'linear' }
  );
  anim.onfinish = runTicker;
}
document.fonts.ready.then(runTicker);

/* ---------------- Personajes ---------------- */
// CSS de cada personaje + reglas de mostrar/ocultar por acción
const css = [];
for (const c of CHARACTERS) {
  css.push(c.css || '');
  for (const a of c.actions) {
    css.push(`.c-${c.id}.act-${a.id} .a-${a.id}{display:inline}`);
    if (a.hide?.length) css.push(a.hide.map((h) => `.c-${c.id}.act-${a.id} .${h}`).join(',') + '{display:none}');
  }
}
const styleEl = document.createElement('style');
styleEl.textContent = css.join('\n');
document.head.appendChild(styleEl);

const bubblesLayer = $('#bubbles');
const fxLayer = $('#fx');
let activeBubbles = 0;

class Actor {
  constructor(def) {
    this.def = def;
    const [vw, vh] = def.vb;
    this.w = vw * def.scale; this.h = vh * def.scale;
    const st = { ...def.station };
    if (def.perchOnLights) st.y = lightsY(st.x) + 6;
    this.left = st.x - def.anchor[0] * def.scale;
    this.top = st.y - def.anchor[1] * def.scale;
    this.st = st;
    const el = document.createElement('div');
    el.className = `char c-${def.id}`;
    Object.assign(el.style, { width: this.w + 'px', height: this.h + 'px', left: this.left + 'px', top: this.top + 'px' });
    el.innerHTML = `<div class="flip"><svg viewBox="0 0 ${vw} ${vh}">${def.svg}</svg></div>`;
    $(def.layer === 'back' ? '#charsBack' : '#charsFront').appendChild(el);
    this.el = el;
    this.busy = false; this.lastShown = -1e9; this.bag = [];
    this.action = null;
  }
  nextAction() {
    if (!this.bag.length) {
      this.bag = [...this.def.actions].sort(() => Math.random() - 0.5);
      if (this.bag[0] === this.lastAction && this.bag.length > 1) this.bag.push(this.bag.shift());
    }
    return (this.lastAction = this.bag.shift());
  }
  setAction(a) {
    if (this.action) this.el.classList.remove('act-' + this.action.id);
    this.action = a;
    if (a) this.el.classList.add('act-' + a.id);
  }
  say(text, ms) {
    if (activeBubbles >= 2) return;
    activeBubbles++;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = fill(text);
    bubblesLayer.appendChild(b);
    const bw = b.offsetWidth, bh = b.offsetHeight;
    const cx = this.st.x;
    let x = cx - 40;
    x = Math.max(20, Math.min(1900 - bw, x));
    let y = this.top + 10 - bh - 26;
    if (this.def.id === 'duck') y = this.top + 120 - bh;
    if (y < 90) y = this.top + this.h * 0.2 - bh;
    y = Math.max(84, y);
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.setProperty('--tail', Math.max(26, Math.min(bw - 26, cx - x)) + 'px');
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); activeBubbles--; }, 260); }, ms);
  }
  async move(frames, opts, flags = {}) {
    if (flags.walking) this.el.classList.add('walking');
    if (flags.riding) this.el.classList.add('riding');
    if (flags.flying) this.el.classList.add('flying');
    if (flags.faceLeft) this.el.classList.add('face-left');
    const a = this.el.animate(frames, { fill: 'forwards', ...opts });
    await a.finished;
    this.el.classList.remove('walking', 'riding', 'flying', 'face-left');
    return a;
  }
  async enter() {
    const d = this.def, el = this.el;
    el.getAnimations().forEach((a) => a.cancel());
    el.classList.add('on');
    const T = (x, y = 0) => `translate(${x}px, ${y}px)`;
    switch (d.enter) {
      case 'walkL': { const dx = -this.left - this.w - 60; await this.move([{ transform: T(dx) }, { transform: T(0) }], { duration: Math.abs(dx) / 0.42, easing: 'linear' }, { walking: true }); break; }
      case 'walkR': { const dx = 1920 - this.left + 60; await this.move([{ transform: T(dx) }, { transform: T(0) }], { duration: Math.abs(dx) / 0.42, easing: 'linear' }, { walking: true, faceLeft: true }); break; }
      case 'ride': { const dx = -this.left - this.w - 60; await this.move([{ transform: T(dx) }, { transform: T(0) }], { duration: Math.abs(dx) / 0.8, easing: 'cubic-bezier(.2,.6,.4,1)' }, { riding: true }); break; }
      case 'fly': await this.move([{ transform: T(520, -420) + ' rotate(-10deg)' }, { transform: T(120, -60) + ' rotate(-4deg)', offset: 0.7 }, { transform: T(0) }], { duration: 2200, easing: 'ease-out' }, { flying: true, faceLeft: true }); break;
      case 'rise': await this.move([{ transform: T(0, 300) }, { transform: T(0, -20), offset: 0.75 }, { transform: T(0) }], { duration: 1500, easing: 'ease-out' }); break;
      case 'drop':
        await this.move([{ transform: T(0, -1300) }, { transform: T(0, 0), offset: 0.7, easing: 'ease-out' }, { transform: T(0, -40), offset: 0.82, easing: 'ease-in' }, { transform: T(0) }], { duration: 1300, easing: 'ease-in' });
        this.dust(); break;
      case 'peekup': await this.move([{ transform: T(0, 200) }, { transform: T(0, 0) }], { duration: 1100, easing: 'cubic-bezier(.3,1.4,.5,1)' }); break;
    }
  }
  async exit() {
    const d = this.def;
    const T = (x, y = 0) => `translate(${x}px, ${y}px)`;
    switch (d.enter) {
      case 'walkL': { const dx = -this.left - this.w - 60; await this.move([{ transform: T(0) }, { transform: T(dx) }], { duration: Math.abs(dx) / 0.42, easing: 'linear' }, { walking: true, faceLeft: true }); break; }
      case 'walkR': { const dx = 1920 - this.left + 60; await this.move([{ transform: T(0) }, { transform: T(dx) }], { duration: Math.abs(dx) / 0.42, easing: 'linear' }, { walking: true }); break; }
      case 'ride': { const dx = 1920 - this.left + 60; await this.move([{ transform: T(0) }, { transform: T(dx) }], { duration: Math.abs(dx) / 0.8, easing: 'cubic-bezier(.6,0,.8,.4)' }, { riding: true }); break; }
      case 'fly': await this.move([{ transform: T(0) }, { transform: T(-160, -80) + ' rotate(8deg)', offset: 0.3 }, { transform: T(-900, -500) + ' rotate(12deg)' }], { duration: 2000, easing: 'ease-in' }, { flying: true, faceLeft: true }); break;
      case 'rise': await this.move([{ transform: T(0) }, { transform: T(0, -24), offset: 0.25 }, { transform: T(0, 300) }], { duration: 1200, easing: 'ease-in' }); break;
      case 'drop': this.dust(); await this.move([{ transform: T(0) }, { transform: T(0, 20) + ' scaleY(.85)', offset: 0.12 }, { transform: T(0, -1300) }], { duration: 1100, easing: 'ease-in' }); break;
      case 'peekup': await this.move([{ transform: T(0) }, { transform: T(0, 200) }], { duration: 800, easing: 'ease-in' }); break;
    }
    this.el.classList.remove('on');
  }
  dust() {
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'dust';
      const s = rnd(20, 40);
      Object.assign(p.style, { width: s + 'px', height: s + 'px', left: this.st.x + rnd(-60, 60) + 'px', top: this.st.y - s / 2 + 'px' });
      fxLayer.appendChild(p);
      p.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 0.9 }, { transform: `translate(${rnd(-120, 120)}px, ${rnd(-60, -10)}px) scale(1.6)`, opacity: 0 }], { duration: 900, easing: 'ease-out' }).finished.then(() => p.remove());
    }
  }
  async perform(n) {
    for (let i = 0; i < n && !director.party; i++) {
      const a = this.nextAction();
      this.setAction(a);
      if (a.fx === 'weld') window.scene3d?.weld(a.dur * 1000);
      if (a.say && Math.random() < 0.7) setTimeout(() => this.say(pick(a.say), Math.min(3400, a.dur * 1000 - 400)), 350);
      await sleep(a.dur * 1000);
      this.setAction(null);
      await sleep((this.def.gap || 0.6) * 1000);
    }
  }
  async run() {
    this.busy = true;
    await this.enter();
    await this.perform(3 + Math.floor(Math.random() * 3));
    if (!director.party) {
      await this.exit();
      this.lastShown = performance.now();
      this.busy = false;
    }
  }
}

const actors = CHARACTERS.map((c) => new Actor(c));

/* ---------------- Director de escena ---------------- */
const director = {
  party: false,
  target: 3,
  async loop() {
    // arranque: los personajes van apareciendo de a poco
    const first = [...actors].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) { first[i].run(); await sleep(rnd(1800, 3200)); }
    while (!this.party) {
      if (Math.random() < 0.08) this.target = 2 + Math.floor(Math.random() * 4); // entre 2 y 5 a la vez
      const busy = actors.filter((a) => a.busy).length;
      if (busy < this.target) {
        const now = performance.now();
        const free = actors.filter((a) => !a.busy && now - a.lastShown > 5000).sort((a, b) => a.lastShown - b.lastShown);
        if (free.length) {
          pick(free.slice(0, 3)).run();
          // a veces aparecen dos juntos
          if (Math.random() < 0.25 && busy + 1 < this.target && free.length > 1) {
            const other = free.filter((a) => !a.busy);
            if (other.length) pick(other.slice(0, 3)).run();
          }
        }
      }
      await sleep(rnd(1500, 3500));
    }
  },
};
window.__actors = actors;
if (!params.has('quieto')) director.loop();

/* ---------------- ¡Llegó el aguinaldo! ---------------- */
async function celebrate() {
  director.party = true;
  window.scene3d?.celebrate(true);
  const lbl = $('#faltanLabel');
  lbl.textContent = '¡LLEGÓ EL AGUINALDO!';
  lbl.style.fontSize = '58px';
  lbl.style.letterSpacing = '6px';
  lbl.classList.add('done');
  $('#statusLabel').textContent = '¡A COBRAR! 🎉';
  const cheers = ['¡AGUINALDO! 🎉', '¡A cobrar, gente!', '¡Feliz Navidad, taller! 🎄', '¡Lo logramos!', '¡Tereré y aguinaldo!'];
  for (const a of actors) {
    a.setAction(null);
    a.el.getAnimations().forEach((x) => x.cancel());
    a.el.classList.remove('walking', 'riding', 'flying', 'face-left');
    a.el.classList.add('on', 'party');
  }
  // globos y lluvia de confeti + billetes
  setInterval(() => { activeBubbles = Math.min(activeBubbles, 1); pick(actors).say(pick(cheers), 2400); }, 1600);
  const cols = ['#ff3b3b', '#3dff7a', '#ffd23f', '#4fc3ff', '#ff7bd5', '#fff'];
  setInterval(() => {
    for (let i = 0; i < 6; i++) {
      const isBill = Math.random() < 0.3;
      const p = document.createElement('div');
      p.className = isBill ? 'bill' : 'confetti';
      if (isBill) p.textContent = '₲'; else p.style.background = pick(cols);
      p.style.left = rnd(0, 1900) + 'px'; p.style.top = '-80px';
      fxLayer.appendChild(p);
      p.animate([
        { transform: `translate(0,0) rotate(${rnd(0, 360)}deg)` },
        { transform: `translate(${rnd(-200, 200)}px, 1200px) rotate(${rnd(360, 1080)}deg)` },
      ], { duration: rnd(3000, 6000), easing: 'cubic-bezier(.3,.1,.6,1)' }).finished.then(() => p.remove());
    }
  }, 260);
}

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
const FLOOR = 1046;
const SPEED = { walk: 0.42, run: 0.95, sneak: 0.22, fly: 0.75, jump: 0.85, ride: 0.8 };

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
    this.spots = (def.spots || []).map((p) => (p.lights ? { x: p.lights, y: lightsY(p.lights) + 6, level: 'air' } : { ...p }));
    const el = document.createElement('div');
    el.className = `char c-${def.id}`;
    Object.assign(el.style, { width: this.w + 'px', height: this.h + 'px', left: this.left + 'px', top: this.top + 'px' });
    el.innerHTML = `<div class="flip"><svg viewBox="0 0 ${vw} ${vh}">${def.svg}</svg></div>`;
    this.el = el;
    this.layer = null;
    this.setLayer(def.layer);
    this.busy = false; this.lastShown = -1e9; this.bag = [];
    this.action = null;
    this.pos = { x: 0, y: 0 };
    this.spot = this.spots[0] || null;
  }
  get x() { return this.st.x + this.pos.x; }
  get y() { return this.st.y + this.pos.y; }
  setLayer(l) {
    if (l === this.layer) return;
    this.layer = l;
    $(l === 'back' ? '#charsBack' : '#charsFront').appendChild(this.el);
  }
  place(x, y) {
    this.pos = { x: x - this.st.x, y: y - this.st.y };
    this.el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
  }
  show() { this.el.classList.add('on'); }
  hide() { this.el.classList.remove('on', 'walking', 'riding', 'flying', 'face-left'); }
  resetHome() {
    this.act(null); this.hide(); this.place(this.st.x, this.st.y);
    this.setLayer(this.def.layer); this.spot = this.spots[0] || null;
  }
  nextAction() {
    const pool = this.def.actions.filter((a) => !a.scene && (!a.home || this.atHome()));
    if (!this.bag.length) {
      this.bag = [...this.def.actions.filter((a) => !a.scene)].sort(() => Math.random() - 0.5);
      if (this.bag[0] === this.lastAction && this.bag.length > 1) this.bag.push(this.bag.shift());
    }
    let idx = this.bag.findIndex((a) => pool.includes(a));
    if (idx < 0) return (this.lastAction = pick(pool));
    return (this.lastAction = this.bag.splice(idx, 1)[0]);
  }
  atHome() { return Math.abs(this.pos.x) < 4 && Math.abs(this.pos.y) < 4; }
  act(id) {
    const a = id ? this.def.actions.find((x) => x.id === id) : null;
    if (this.action) this.el.classList.remove('act-' + this.action.id);
    this.action = a;
    if (a) this.el.classList.add('act-' + a.id);
    if (a?.fx === 'weld') window.scene3d?.weld(a.dur * 1000);
    return a;
  }
  say(text, ms = 3000, force = false) {
    if (!force && activeBubbles >= 2) return;
    activeBubbles++;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = fill(text);
    bubblesLayer.appendChild(b);
    const bw = b.offsetWidth, bh = b.offsetHeight;
    const cx = this.x;
    let x = Math.max(20, Math.min(1900 - bw, cx - 40));
    const topNow = this.top + this.pos.y;
    let y = topNow + 10 - bh - 26;
    if (this.def.id === 'duck') y = topNow + 120 - bh;
    if (y < 90) y = topNow + this.h + 30;           // si no entra arriba, va debajo
    y = Math.max(84, Math.min(1000 - bh, y));
    // evita que dos globos se encimen
    for (const o of bubblesLayer.querySelectorAll('.bubble:not(.out)')) {
      if (o === b) continue;
      const ox = parseFloat(o.style.left), oy = parseFloat(o.style.top), ow = o.offsetWidth, oh = o.offsetHeight;
      if (x < ox + ow && x + bw > ox && y < oy + oh && y + bh > oy) y = oy - bh - 34 >= 84 ? oy - bh - 34 : oy + oh + 34;
    }
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.setProperty('--tail', Math.max(26, Math.min(bw - 26, cx - x)) + 'px');
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); activeBubbles--; }, 260); }, ms);
  }
  // Mueve el punto de apoyo del personaje a (x, y) del escenario
  async moveTo(x, y, o = {}) {
    const mode = o.mode || 'walk';
    const nx = x - this.st.x, ny = y - this.st.y;
    const dx = nx - this.pos.x, dy = ny - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    const dur = o.dur || Math.max(350, dist / (o.speed || SPEED[mode] || 0.5));
    const from = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    const to = `translate(${nx}px, ${ny}px)`;
    let frames = [{ transform: from }, { transform: to }];
    if (o.arc) {
      const mx = (this.pos.x + nx) / 2, my = Math.min(this.pos.y, ny) - o.arc;
      frames = [{ transform: from, easing: 'ease-out' }, { transform: `translate(${mx}px, ${my}px)`, easing: 'ease-in' }, { transform: to }];
    }
    const cls = { walk: 'walking', run: 'walking', sneak: 'walking', fly: 'flying', ride: 'riding' }[mode];
    if (cls) this.el.classList.add(cls);
    if (mode === 'sneak') this.el.classList.add('sneaking');
    if (o.face !== false) this.el.classList.toggle('face-left', dx < -2);
    const a = this.el.animate(frames, { duration: dur, easing: o.easing || (o.arc ? 'linear' : mode === 'fly' ? 'ease-in-out' : 'linear'), fill: 'forwards' });
    await a.finished;
    this.pos = { x: nx, y: ny };
    this.el.style.transform = to;
    a.cancel();
    this.el.classList.remove('walking', 'flying', 'riding', 'sneaking');
    if (!o.keepFace) this.el.classList.remove('face-left');
  }
  // Viaje entre puntos (los voladores vuelan; el ratón corre y salta entre el panel y el piso)
  async travelTo(s) {
    if (this.def.travel === 'fly') {
      await this.moveTo(s.x, s.y, { mode: 'fly', arc: 70 + Math.random() * 90 });
    } else {
      const cur = this.spot || this.spots[0];
      if (cur && cur.level !== s.level) {
        this.setLayer('front');
        await this.moveTo(s.x, s.y, { mode: 'jump', arc: s.level === 'top' ? 260 : 120, speed: 0.8 });
        if (s.level === 'floor') this.dust(14);
      } else {
        await this.moveTo(s.x, s.y, { mode: 'run' });
      }
      this.setLayer(s.level === 'top' ? 'back' : 'front');
    }
    this.spot = s;
  }
  async enter() {
    const d = this.def, st = this.st;
    this.el.getAnimations().forEach((a) => a.cancel());
    this.setLayer(d.layer);
    this.show();
    switch (d.enter) {
      case 'walkL': this.place(st.x - (st.x + this.w + 60), st.y); await this.moveTo(st.x, st.y, { mode: 'walk' }); break;
      case 'walkR': this.place(1920 + (st.x - this.left) + 60, st.y); await this.moveTo(st.x, st.y, { mode: 'walk' }); break;
      case 'ride': this.place(st.x - (st.x + this.w + 60), st.y); await this.moveTo(st.x, st.y, { mode: 'ride', easing: 'cubic-bezier(.2,.6,.4,1)' }); break;
      case 'fly': this.place(st.x + (st.x < 960 ? -700 : 700), st.y - 460); await this.moveTo(st.x, st.y, { mode: 'fly', dur: 2000, easing: 'ease-out' }); break;
      case 'rise': this.place(st.x, st.y + 300); await this.moveTo(st.x, st.y, { mode: 'none', dur: 1400, easing: 'cubic-bezier(.3,1.3,.5,1)' }); break;
      case 'drop':
        this.place(st.x, st.y - 1300);
        await this.moveTo(st.x, st.y, { mode: 'none', dur: 850, easing: 'cubic-bezier(.5,0,1,1)' });
        this.dust();
        await this.moveTo(st.x, st.y - 36, { mode: 'none', dur: 160, easing: 'ease-out' });
        await this.moveTo(st.x, st.y, { mode: 'none', dur: 160, easing: 'ease-in' });
        break;
      case 'peekup': this.place(st.x, st.y + 200); await this.moveTo(st.x, st.y, { mode: 'none', dur: 1000, easing: 'cubic-bezier(.3,1.4,.5,1)' }); break;
    }
    this.spot = this.spots[0] || null;
  }
  async exit() {
    const d = this.def, st = this.st;
    if (d.travel === 'fly') {
      const right = this.x > 960;
      await this.moveTo(right ? 2200 : -300, this.y - 520, { mode: 'fly', dur: 1800, easing: 'ease-in' });
    } else if (d.travel === 'ground') {
      if (this.spot?.level === 'top' && this.atHome()) {
        await this.moveTo(st.x, st.y + 200, { mode: 'none', dur: 700, easing: 'ease-in' });
      } else {
        if (this.spot?.level === 'top') await this.travelTo(this.spots.find((p) => p.level === 'floor'));
        await this.moveTo(this.x > 960 ? 2060 : -140, FLOOR, { mode: 'run' });
      }
    } else {
      if (!this.atHome()) await this.moveTo(st.x, st.y, { mode: 'walk' });
      switch (d.enter) {
        case 'walkL': await this.moveTo(-this.w - 60 + (st.x - this.left), st.y, { mode: 'walk' }); break;
        case 'walkR': await this.moveTo(1920 + (st.x - this.left) + 60, st.y, { mode: 'walk' }); break;
        case 'ride': await this.moveTo(1920 + (st.x - this.left) + 60, st.y, { mode: 'ride', easing: 'cubic-bezier(.6,0,.8,.4)' }); break;
        case 'fly': await this.moveTo(st.x - 900, st.y - 500, { mode: 'fly', dur: 1800, easing: 'ease-in' }); break;
        case 'rise': await this.moveTo(st.x, st.y - 24, { mode: 'none', dur: 250, easing: 'ease-out' }); await this.moveTo(st.x, st.y + 300, { mode: 'none', dur: 900, easing: 'ease-in' }); break;
        case 'drop': this.dust(); await this.moveTo(st.x, st.y - 1300, { mode: 'none', dur: 950, easing: 'ease-in' }); break;
        case 'peekup': await this.moveTo(st.x, st.y + 200, { mode: 'none', dur: 700, easing: 'ease-in' }); break;
      }
    }
    this.resetHome();
  }
  dust(n = 8) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'dust';
      const s = rnd(16, 38);
      Object.assign(p.style, { width: s + 'px', height: s + 'px', left: this.x + rnd(-60, 60) + 'px', top: this.y - s / 2 + 'px' });
      fxLayer.appendChild(p);
      p.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 0.9 }, { transform: `translate(${rnd(-120, 120)}px, ${rnd(-60, -10)}px) scale(1.6)`, opacity: 0 }], { duration: 900, easing: 'ease-out' }).finished.then(() => p.remove());
    }
  }
  async perform(n) {
    for (let i = 0; i < n && !director.party; i++) {
      if (this.spots.length > 1 && i > 0 && Math.random() < (this.def.roamChance || 0)) {
        const others = this.spots.filter((p) => p !== this.spot);
        await this.travelTo(pick(others));
      }
      if (this.def.id === 'mouse' && Math.random() < (this.def.tripChance || 0)) { await mouseHeist(this); continue; }
      const a = this.act(this.nextAction().id);
      if (a.say && Math.random() < 0.7) setTimeout(() => this.say(pick(a.say), Math.min(3400, a.dur * 1000 - 400)), 350);
      await sleep(a.dur * 1000);
      this.act(null);
      await sleep((this.def.gap || 0.6) * 1000);
    }
  }
  async run() {
    this.busy = true;
    await this.enter();
    await this.perform(this.def.spots ? 4 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3));
    if (!director.party) {
      await this.exit();
      this.lastShown = performance.now();
      this.busy = false;
    }
  }
}

const actors = CHARACTERS.map((c) => new Actor(c));
const A = Object.fromEntries(actors.map((a) => [a.def.id, a]));
window.__actors = actors;

/* ---------------- El ratón ladrón: roba repuestos de lugares ---------------- */
async function mouseHeist(m) {
  const floors = m.spots.filter((p) => p.level === 'floor');
  const from = pick(floors);
  await m.travelTo(from);
  m.act('grab');
  m.say(pick(['Esto no lo usa nadie… ¿no? 🤫', 'Un repuesto más para mi colección 🐭', 'Préstamo… a largo plazo 😏', 'Si nadie lo vio, no pasó nada']), 2200);
  await sleep(1500);
  m.act(pick(['loot-bolt', 'loot-gear', 'loot-wrench']));
  await sleep(400);
  const to = pick(m.spots.filter((p) => p !== from));
  await m.travelTo(to);
  m.act(null);
  await sleep(500);
}

/* ---------------- Escenas con varios animales ---------------- */
const free = (...ids) => ids.every((id) => !A[id].busy);
const SCENES = [
  {
    // El pinscher se pelea con el anó
    cast: ['pinscher', 'bird'],
    async run() {
      const P = A.pinscher, B = A.bird;
      await P.enter(); P.act('struggle');
      B.setLayer('front'); B.show(); B.place(2150, 520);
      await B.moveTo(P.x + 138, 912, { mode: 'fly', dur: 1800, easing: 'ease-out' });
      B.act('sing'); B.say('¿Todavía con ese bulón? 😏', 2600, true);
      await sleep(2600);
      B.act(null); P.act('bark'); P.say('¡GRRR! ¡Bajate de ahí, pájaro!', 2600, true);
      await sleep(2400);
      P.act('snap'); B.say('¡Anó, anó! ¡No me alcanzás! 😜', 3200, true);
      const cx = P.x + 20, cy = 900;
      for (const [dx, dy] of [[-110, 20], [0, -90], [110, 10], [0, 40], [-110, -20], [10, -100]]) await B.moveTo(cx + dx, cy + dy, { mode: 'fly', speed: 0.55 });
      P.act('dizzy'); P.say('Me mareé… 😵‍💫', 2600, true);
      await B.moveTo(P.x + 138, 912, { mode: 'fly', speed: 0.6 });
      B.act('sing'); B.say('¡Jajajá! Anó anó 🐦', 2600, true);
      await sleep(2800);
      B.act(null); await B.exit();
      P.act('bark'); P.say('¡Y NO VUELVAS! 😤', 2400, true);
      await sleep(2500); P.act(null); await sleep(400); await P.exit();
    },
  },
  {
    // El ratón le roba la chipa al chanchito
    cast: ['pig', 'mouse'],
    async run() {
      const G = A.pig, M = A.mouse, L = !A.parrot.busy ? A.parrot : null;
      if (L) L.busy = true;
      await G.enter(); G.act('chipa'); G.say('Mmm… chipa calentita 😋', 2400, true);
      M.setLayer('front'); M.show(); M.place(-120, FLOOR);
      await M.moveTo(G.x - 80, FLOOR, { mode: 'sneak' });
      M.act('grab'); await sleep(900);
      G.el.classList.add('no-chipa'); M.act('loot-chipa');
      M.say('¡Gracias por la merienda! 🤭', 2200, true);
      await M.moveTo(G.x + 230, FLOOR, { mode: 'run' });
      G.act('angry'); G.say('¡¿Y MI CHIPA?! 😡', 2600, true);
      if (L) { await L.enter(); L.act('snitch'); L.say('¡Ladrón! ¡Ladrón! ¡Fue el ratón! 🦜', 2600, true); }
      await sleep(1200);
      G.act(null);
      await Promise.all([M.moveTo(2080, FLOOR, { mode: 'run' }), sleep(400).then(() => G.moveTo(G.x + 520, FLOOR, { mode: 'run', speed: 0.6 }))]);
      M.resetHome();
      G.say('¡Volvé acá, ratón! 😤', 2200, true);
      await sleep(2200);
      await G.moveTo(G.st.x, G.st.y, { mode: 'walk' });
      G.el.classList.remove('no-chipa'); G.act('dream'); G.say('Bueno… me compro otra con el aguinaldo 😔', 3000, true);
      await sleep(3200); G.act(null);
      if (L) { L.act(null); await L.exit(); L.lastShown = performance.now(); L.busy = false; }
      await G.exit();
    },
  },
  {
    // El ratón le roba la llave al pinscher
    cast: ['pinscher', 'mouse'],
    async run() {
      const P = A.pinscher, M = A.mouse;
      await P.enter(); P.act('struggle'); P.say('Ya casi… ya casi sale… 😬', 2400, true);
      M.setLayer('front'); M.show(); M.place(-120, FLOOR);
      await M.moveTo(P.x + 40, FLOOR, { mode: 'sneak', speed: 0.35 });
      M.act('grab'); await sleep(900);
      P.el.classList.add('no-wrench'); M.act('loot-wrench');
      M.say('¡Esta llave me viene justo! 🔧', 2200, true);
      P.act('bark'); P.say('¡EY! ¡Mi llave! ¡GUAU GUAU!', 2600, true);
      await M.moveTo(-160, FLOOR, { mode: 'run', speed: 1.1, keepFace: true });
      M.resetHome();
      P.act('snap'); await sleep(2400);
      P.act('tremble'); P.say('Ahora sí que no sale este bulón… 😭', 2800, true);
      await sleep(3000); P.act(null); P.el.classList.remove('no-wrench');
      await P.exit();
    },
  },
  {
    // El ratón se roba la estrella del arbolito y cruza toda la pantalla
    cast: ['mouse'],
    async run() {
      const M = A.mouse, L = !A.parrot.busy ? A.parrot : null, starEl = $('#treeStar');
      if (L) L.busy = true;
      M.setLayer('front'); M.show(); M.place(2060, FLOOR);
      await M.moveTo(1740, FLOOR, { mode: 'run' });
      M.say('Mmm… esa estrella brilla lindo ✨', 2200, true);
      await sleep(1200);
      await M.moveTo(1830, 664, { mode: 'jump', arc: 120, speed: 0.7 });
      M.act('grab'); await sleep(700);
      starEl.style.opacity = 0; M.act('loot-star');
      M.say('¡Para decorar mi cueva! ⭐', 2200, true);
      await sleep(1200);
      await M.moveTo(1690, FLOOR, { mode: 'jump', arc: 90, speed: 0.7 }); M.dust(10);
      if (L) { L.enter().then(() => { L.act('snitch'); L.say('¡Se robó la estrella del arbolito! 🦜', 2800, true); }); }
      await M.moveTo(-160, FLOOR, { mode: 'run', speed: 0.9 });
      M.resetHome();
      await sleep(1500);
      starEl.style.opacity = 1;
      if (L) { await sleep(1500); L.act('talk'); L.say('…ah, no. Era de plástico. Ya pusieron otra 😅', 2800, true); await sleep(3000); L.act(null); await L.exit(); L.lastShown = performance.now(); L.busy = false; }
    },
  },
  {
    // El loro imita al pinscher
    cast: ['pinscher', 'parrot'],
    async run() {
      const P = A.pinscher, L = A.parrot;
      await P.enter(); P.act('bark'); P.say('¡GUAU! ¡GUAU! ¡Este bulón me odia!', 2600, true);
      L.setLayer('front'); L.show(); L.place(2150, 500);
      await L.moveTo(P.x + 138, 912, { mode: 'fly', dur: 1800, easing: 'ease-out' });
      await sleep(400);
      P.act(null); L.act('mimic'); L.say('¡GUAU! ¡GUAU! 🦜', 2200, true);
      await sleep(2200);
      L.act(null); P.act('tremble'); P.say('¿Eh? ¿Quién ladró? 😳', 2400, true);
      await sleep(2400);
      L.act('talk'); L.say('¡Lorito ladra mejor que vos! ¡GUAU!', 2600, true);
      await sleep(2600);
      L.act(null); P.act('snap'); P.say('¡Loro copión! ¡GRRR!', 2400, true);
      await sleep(1800);
      L.act('dance'); L.say('Copión no… ¡bilingüe! 😎', 2400, true);
      await sleep(2400);
      L.act(null); await L.exit();
      P.act(null); await sleep(400); await P.exit();
    },
  },
  {
    // El oso le convida tereré al conejo cansado
    cast: ['bear', 'rabbit'],
    async run() {
      const O = A.bear, R = A.rabbit;
      await Promise.all([O.enter(), R.enter()]);
      R.act('tired'); R.say('Faltan {d} días… y no doy más 😮‍💨', 2800, true);
      await sleep(2600);
      R.act(null);
      O.act('terere');
      await O.moveTo(R.x - 230, O.st.y, { mode: 'walk' });
      O.say('Tomá un tereré bien frío, compañero 🧉', 2800, true);
      await sleep(2800);
      R.act('wheelie'); R.say('¡Ahora sí! ¡Energía para llegar al 15! ⚡', 2800, true);
      await sleep(2800);
      O.act('dance'); R.act(null);
      await R.exit();
      O.act(null);
      await O.exit();
    },
  },
];

/* ---------------- Director de escena ---------------- */
const director = {
  party: false,
  target: 3,
  nextScene: performance.now() + 25000,
  async scene() {
    const options = SCENES.filter((s) => free(...s.cast));
    if (!options.length) return false;
    const sc = pick(options);
    sc.cast.forEach((id) => (A[id].busy = true));
    sc.run().catch((e) => console.warn('escena', e)).finally(() => {
      sc.cast.forEach((id) => { const a = A[id]; if (!director.party) { a.resetHome(); a.busy = false; a.lastShown = performance.now(); } });
    });
    return true;
  },
  async loop() {
    const first = [...actors].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3; i++) { first[i].run(); await sleep(rnd(1800, 3200)); }
    while (!this.party) {
      const now = performance.now();
      if (now > this.nextScene) {
        if (await this.scene()) this.nextScene = now + rnd(28000, 45000);
        else this.nextScene = now + 4000;
      }
      if (Math.random() < 0.08) this.target = 2 + Math.floor(Math.random() * 4); // entre 2 y 5 a la vez
      const busy = actors.filter((a) => a.busy).length;
      if (busy < this.target) {
        const free = actors.filter((a) => !a.busy && now - a.lastShown > 5000).sort((a, b) => a.lastShown - b.lastShown);
        if (free.length) {
          pick(free.slice(0, 3)).run();
          if (Math.random() < 0.25 && busy + 1 < this.target) {
            const other = free.filter((a) => !a.busy);
            if (other.length) pick(other.slice(0, 3)).run();
          }
        }
      }
      await sleep(rnd(1500, 3500));
    }
  },
};
window.__scenes = SCENES; window.__director = director;
if (params.has('escena')) {
  // ?escena=N  → prueba una escena puntual
  const n = parseInt(params.get('escena'), 10) || 0;
  setTimeout(() => { const s = SCENES[n % SCENES.length]; s.cast.forEach((id) => (A[id].busy = true)); s.run(); }, 1200);
} else if (!params.has('quieto')) director.loop();

/* ---------------- ¡Llegó el aguinaldo! ---------------- */
async function celebrate() {
  director.party = true;
  window.scene3d?.celebrate(true);
  const lbl = $('#faltanLabel');
  lbl.textContent = '¡LLEGÓ EL AGUINALDO!';
  lbl.classList.add('done');
  $('#statusLabel').textContent = '¡A COBRAR! 🎉';
  $('#treeStar') && ($('#treeStar').style.opacity = 1);
  const cheers = ['¡AGUINALDO! 🎉', '¡A cobrar, gente!', '¡Feliz Navidad, taller! 🎄', '¡Lo logramos!', '¡Tereré y aguinaldo!'];
  for (const a of actors) {
    a.el.getAnimations().forEach((x) => x.cancel());
    a.resetHome();
    a.el.classList.remove('no-chipa', 'no-wrench');
    a.show();
    a.el.classList.add('party');
  }
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

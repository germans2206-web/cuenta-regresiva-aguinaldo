import { buildMachine, lightsY, machineCtl } from './machine.js';
import { CHARACTERS, SAGE, SAGE_FOR, AGUI_ASK, AGUI_PLANS } from './characters.js';

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
// tiempo de lectura de los consejos de Don Anó (frases largas, español + guaraní)
const readMs = (t) => Math.min(13000, 2200 + t.length * 85);
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
const clockState = { stopped: false, frozen: 0, calibrating: false };
const panelEl = $('#panel');
function renderMs(ms) {
  const sec = Math.floor(Math.max(0, ms) / 1000);
  renderUnit('d', Math.floor(sec / 86400), 2); renderUnit('h', Math.floor((sec % 86400) / 3600));
  renderUnit('m', Math.floor((sec % 3600) / 60)); renderUnit('s', sec % 60);
}
function setStatus(text, cls = '') {
  if (window.__party && !/COBRAR/.test(text)) return;
  $('#statusLabel').textContent = text;
  const st = $('.status'); st.classList.remove('alert', 'ok'); if (cls) st.classList.add(cls);
}
function tick() {
  const ms = Math.max(0, TARGET - Date.now());
  const sec = Math.floor(ms / 1000);
  remain.ms = ms;
  remain.d = Math.floor(sec / 86400); remain.h = Math.floor((sec % 86400) / 3600);
  remain.m = Math.floor((sec % 3600) / 60); remain.s = sec % 60;
  if (sec !== lastSec) {
    lastSec = sec;
    if (!clockState.stopped && !clockState.calibrating) renderMs(ms);
    $('#clock').classList.toggle('wide', remain.d > 99);
    const pct = Math.min(100, Math.max(0, ((Date.now() - YEAR_START) / (TARGET - YEAR_START)) * 100));
    $('#batteryFill').style.width = pct.toFixed(2) + '%';
    $('#batteryPct').textContent = pct.toFixed(1) + '%';
    if (sec % 60 === 0 || !$('#srText').textContent) {
      $('#srText').textContent = `Faltan ${remain.d} días, ${remain.h} horas, ${remain.m} minutos y ${remain.s} segundos para el aguinaldo.`;
    }
  }
  // la fiesta se dispara apenas el tiempo llega a cero (aunque queden milisegundos del último segundo)
  if (ms === 0 && !finished) { finished = true; setTimeout(celebrate, 50); }
  const off = clockState.stopped || ((ms % 1000) < 500 && ms > 0);
  if (off !== sepOff) { sepOff = off; seps.forEach((s) => s.classList.toggle('off', off)); }
  // el reloj sólo necesita despertarse en cada medio segundo (no en cada cuadro)
  setTimeout(tick, ms > 0 ? (ms % 500) + 4 : 250);
}
let sepOff = null;
const seps = document.querySelectorAll('.sep');
tick();

const fill = (t) => t.replace('{d}', remain.d).replace('{h}', remain.h).replace('{m}', remain.m);

/* ---------------- Cartel LED ---------------- */
const MESSAGES = [
  'OT N.º 1512 — COBRO DE AGUINALDO — PRIORIDAD: MÁXIMA',
  'FALTAN {d} DÍAS PARA EL 15 DE DICIEMBRE',
  'RECORDATORIO: EL AGUINALDO NO SE COBRA SOLO, SIGAN CON EL PREVENTIVO',
  'SE RUEGA NO GASTAR EL AGUINALDO ANTES DE COBRARLO',
  'ENCUESTA DEL TALLER: ¿EN QUÉ VAS A GASTAR EL AGUINALDO? — 9 DE CADA 10 RESPONDIERON «HENDAPAITÉMA»',
  'EL PULPO CONFIRMA QUE EL AGUINALDO LLEGA EL 15: «¡SEEEEEE!»',
  'EL PULPO SOLICITA 8 PARES DE GUANTES AL ALMACÉN',
  'EL PINSCHER SIGUE PELEANDO CON EL BULÓN M24',
  'SEGURIDAD PRIMERO: CASCO, LENTES Y BOTINES',
  'CONSEJO DEL TALLER: EL AGUINALDO, BIEN GUARDADITO EN EL COLCHÓN 🛏️',
  'EL CHANCHITO SIGUE EN ESPERA CON EL BANCO: VA POR LA SEMANA 3 📞',
  'SE BUSCA: BANCO QUE ABRA, ATIENDA Y DEVUELVA 😅',
  '¿QUIÉN NO COBRA AGUINALDO ESTE AÑO? PISTA: HASTA HACE POCO ERA PRESIDENTE 😅',
  'ÚLTIMO MOMENTO: EL COLCHÓN SUPERA A UENO EN SOLIDEZ BANCARIA 🛏️',
  'CONSEJO DEL TALLER: AGUINALDO EN MANO, NADA DE UENO 😅',
  'EL ÚNICO AUTO DE LUJO DEL TALLER ES LA BICI DEL CONEJO 🚲',
  'SANTIAGO PEÑA NO COBRA AGUINALDO ESTE AÑO… NOSOTROS SÍ 💪',
  'EL BULÓN M24 Y LA PLATA DE UENO: NADIE LOS PUEDE SACAR 🔩',
];
const ALARM = ['⚠ PARADA DE EMERGENCIA — RELOJ DETENIDO ⚠', 'TODO EL EQUIPO DE MANTENIMIENTO AL TALLER', '⚠ NO SE PREOCUPEN: EL AGUINALDO SIGUE EN PIE ⚠'];
let tickerAlarm = false, tickerAnim = null;
const track = $('#tickerTrack');
function setTickerAlarm(on) { if (on === tickerAlarm) return; tickerAlarm = on; tickerAnim?.cancel(); runTicker(); }
function runTicker() {
  track.innerHTML = (tickerAlarm ? ALARM : MESSAGES).map((m) => `<span>${fill(m)}</span>`).join('');
  track.style.color = tickerAlarm ? '#ff5a3c' : '';
  const win = track.parentElement.clientWidth;
  const w = track.scrollWidth;
  const anim = track.animate(
    [{ transform: `translate(${win}px,-50%)` }, { transform: `translate(${-w}px,-50%)` }],
    { duration: ((win + w) / 150) * 1000, easing: 'linear' }
  );
  tickerAnim = anim;
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
const SPEED = { walk: 0.42, run: 0.95, sneak: 0.22, fly: 0.75, jump: 0.85, ride: 0.6, leap: 0.95 };

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
  place(x, y, force = false) {
    if (director.party && !force) return;
    this.pos = { x: x - this.st.x, y: y - this.st.y };
    this.el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;
  }
  show() { this.el.classList.add('on'); }
  hide(force = false) { if (director.party && !force) return; this.el.classList.remove('on', 'walking', 'riding', 'flying', 'face-left'); }
  resetHome(force = false) {
    if (director.party && !force) return;
    this.act(null); this.hide(force); this.place(this.st.x, this.st.y, force);
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
    if (this.def.id === 'pinscher') document.body.dataset.pin = a ? a.id : '';
    if (a?.fx === 'weld') window.scene3d?.weld(a.dur * 1000);
    return a;
  }
  say(text, ms = 3000, force = false, party = false) {
    if (director.party && !party) return;   // en la fiesta solo se escuchan festejos
    if (!force && activeBubbles >= 2) return;
    activeBubbles++;
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = fill(text);
    // un globo por personaje: el anterior se retira para que no se apilen
    const prev = this.bubble;
    if (prev && prev.isConnected && !prev.classList.contains('out')) { prev.classList.add('out'); clearTimeout(prev._t); setTimeout(() => { if (prev.isConnected) { prev.remove(); activeBubbles--; } }, 260); }
    this.bubble = b;
    if (this.def.id === 'bird') ms = Math.max(ms, readMs(b.textContent));   // Don Anó habla largo: más tiempo para leer
    bubblesLayer.appendChild(b);
    const bw = b.offsetWidth, bh = b.offsetHeight;
    const cx = this.x;
    let x = Math.max(20, Math.min(1900 - bw, cx - 40));
    const topNow = this.top + this.pos.y;
    let y = topNow + 10 - bh - 26;
    if (this.def.id === 'duck') y = topNow + 120 - bh;
    if (y < 90) y = this.y < 300 ? 84 : topNow + this.h + 30;   // sobre el panel: arriba, sin tapar la cuenta
    y = Math.max(84, Math.min(1000 - bh, y));
    // evita que dos globos se encimen
    for (const o of bubblesLayer.querySelectorAll('.bubble:not(.out)')) {
      if (o === b) continue;
      const ox = parseFloat(o.style.left), oy = parseFloat(o.style.top), ow = o.offsetWidth, oh = o.offsetHeight;
      if (x < ox + ow && x + bw > ox && y < oy + oh && y + bh > oy) y = oy - bh - 34 >= 84 ? oy - bh - 34 : oy + oh + 34;
    }
    b.style.left = x + 'px'; b.style.top = y + 'px';
    b.style.setProperty('--tail', Math.max(26, Math.min(bw - 26, cx - x)) + 'px');
    b._t = setTimeout(() => { b.classList.add('out'); setTimeout(() => { if (b.isConnected) { b.remove(); activeBubbles--; } }, 260); }, ms);
  }
  // Mueve el punto de apoyo del personaje a (x, y) del escenario
  async moveTo(x, y, o = {}) {
    if (director.party) return;          // en la fiesta nadie se va del escenario
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
    const cls = { walk: 'walking', run: 'walking', sneak: 'walking', fly: 'flying', ride: 'riding', leap: 'leaping' }[mode];
    if (cls) this.el.classList.add(cls);
    if (mode === 'sneak') this.el.classList.add('sneaking');
    if (o.face !== false) this.el.classList.toggle('face-left', dx < -2);
    const a = this.el.animate(frames, { duration: dur, easing: o.easing || (o.arc ? 'linear' : mode === 'fly' ? 'ease-in-out' : 'linear'), fill: 'forwards' });
    await a.finished.catch(() => {});
    if (director.party) return;          // la fiesta canceló el movimiento
    this.pos = { x: nx, y: ny };
    this.el.style.transform = to;
    a.cancel();
    this.el.classList.remove('walking', 'flying', 'riding', 'sneaking', 'leaping');
    if (mode === 'leap' && y > 1000) this.dust(8);
    if (!o.keepFace) this.el.classList.remove('face-left');
  }
  // Viaje entre puntos (los voladores vuelan; el ratón corre y salta entre el panel y el piso)
  async travelTo(s) {
    const t = this.def.travel;
    if (t === 'fly') {
      await this.moveTo(s.x, s.y, { mode: 'fly', arc: 70 + Math.random() * 90 });
    } else if (t === 'leap') {
      this.setLayer('front');
      await this.moveTo(s.x, s.y, { mode: 'leap', arc: 160 + Math.random() * 140 });
    } else if (t === 'walk' || t === 'ride') {
      await this.moveTo(s.x, s.y, { mode: t, speed: this.def.walkSpeed });
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
      case 'walkL': this.place(st.x - (st.x + this.w + 60), st.y); await this.moveTo(st.x, st.y, { mode: d.enterMode || 'walk' }); break;
      case 'walkR': this.place(1920 + (st.x - this.left) + 60, st.y); await this.moveTo(st.x, st.y, { mode: d.enterMode || 'walk' }); break;
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
      case 'leap': this.place(st.x < 960 ? -200 : 2120, FLOOR); await this.moveTo(st.x, st.y, { mode: 'leap', arc: 320 }); break;
    }
    this.spot = this.spots[0] || null;
  }
  async exit() {
    if (director.party) return;
    const d = this.def, st = this.st;
    if (d.travel === 'leap') {
      await this.moveTo(this.x > 960 ? 2150 : -230, Math.min(this.y, 700), { mode: 'leap', arc: 200 });
    } else if (d.travel === 'fly') {
      const right = this.x > 960;
      await this.moveTo(right ? 2200 : -300, this.y - 520, { mode: 'fly', dur: 1800, easing: 'ease-in' });
    } else if (d.travel === 'ground') {
      if (this.spot?.level === 'air') await this.moveTo(this.x, FLOOR, { mode: 'jump', arc: 60 });
      if (this.spot?.level === 'top' && this.atHome()) {
        await this.moveTo(st.x, st.y + 200, { mode: 'none', dur: 700, easing: 'ease-in' });
      } else {
        if (this.spot?.level === 'top') await this.travelTo(this.spots.find((p) => p.level === 'floor'));
        await this.moveTo(this.x > 960 ? 2060 : -140, FLOOR, { mode: 'run' });
      }
    } else {
      if (!this.atHome()) await this.moveTo(st.x, st.y, { mode: 'walk' });
      switch (d.enter) {
        case 'walkL': await this.moveTo(-this.w - 60 + (st.x - this.left), st.y, { mode: d.enterMode || 'walk' }); break;
        case 'walkR': await this.moveTo(1920 + (st.x - this.left) + 60, st.y, { mode: d.enterMode || 'walk' }); break;
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
      if (this.def.id === 'bird' && Math.random() < 0.55 && (await sageVisit(this))) continue;
      if (this.def.id === 'pinscher' && Math.random() < (this.def.tripChance || 0)) { await zoomies(this); continue; }
      if (this.def.id !== 'bird' && Math.random() < 0.14 && (await aguiChat(this))) continue;
      const a = this.act(this.nextAction().id);
      let wait = a.dur * 1000;
      if (a.say && Math.random() < 0.7) {
        const line = pick(a.say);
        // el pájaro se queda quieto hasta que se pueda leer su frase completa
        if (this.def.id === 'bird') wait = Math.max(wait, readMs(fill(line)) + 500);
        setTimeout(() => this.say(line, Math.min(3400, a.dur * 1000 - 400)), 350);
      }
      await sleep(wait);
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
window.__aguiChat = (...a) => aguiChat(...a);

/* Los textos dentro de los personajes se pasan a imágenes nítidas (4×) al cargar.
   Un <text> SVG se vuelve a medir en cada cuadro cuando el personaje se anima; una imagen no. */
async function rasterizeCharTexts() {
  try {
    await Promise.all(['700 10px "Chakra Petch"', '800 10px "Baloo 2"', '700 10px Cinzel'].map((f) => document.fonts.load(f)));
  } catch (e) { /* si falla, se usa la fuente que haya */ }
  const K = 4, NSv = 'http://www.w3.org/2000/svg';
  const cvs = document.createElement('canvas'), ctx = cvs.getContext('2d');
  for (const t of document.querySelectorAll('.char svg text')) {
    const txt = t.textContent; if (!txt.trim()) continue;
    const size = parseFloat(t.getAttribute('font-size')) || 16;
    const fam = t.getAttribute('font-family') || 'sans-serif', w8 = t.getAttribute('font-weight') || '400';
    const fill = t.getAttribute('fill') || '#000', stroke = t.getAttribute('stroke'), sw = parseFloat(t.getAttribute('stroke-width')) || 0;
    const font = `${w8} ${size * K}px ${/[,"']/.test(fam) ? fam : `"${fam}"`}`;
    ctx.font = font;
    const m = ctx.measureText(txt);
    const asc = Math.max(m.actualBoundingBoxAscent || size * K * 0.8, size * K * 0.75), desc = Math.max(m.actualBoundingBoxDescent || 0, size * K * 0.25);
    const pad = Math.ceil(sw * K) + 2 * K;
    const W = Math.ceil(m.width + pad * 2), H = Math.ceil(asc + desc + pad * 2);
    cvs.width = W; cvs.height = H;
    ctx.font = font; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    if (stroke && sw) { ctx.lineJoin = 'round'; ctx.lineWidth = sw * K; ctx.strokeStyle = stroke; ctx.strokeText(txt, pad, pad + asc); }
    ctx.fillStyle = fill; ctx.fillText(txt, pad, pad + asc);
    const x = parseFloat(t.getAttribute('x')) || 0, y = parseFloat(t.getAttribute('y')) || 0;
    const anchor = t.getAttribute('text-anchor');
    const left = x - (anchor === 'middle' ? m.width / 2 / K : anchor === 'end' ? m.width / K : 0) - pad / K;
    const img = document.createElementNS(NSv, 'image');
    img.setAttribute('x', left.toFixed(2)); img.setAttribute('y', (y - (asc + pad) / K).toFixed(2));
    img.setAttribute('width', (W / K).toFixed(2)); img.setAttribute('height', (H / K).toFixed(2));
    img.setAttribute('preserveAspectRatio', 'none');
    img.setAttribute('href', cvs.toDataURL('image/png'));
    for (const at of ['class', 'style', 'opacity', 'transform']) if (t.hasAttribute(at)) img.setAttribute(at, t.getAttribute(at));
    t.replaceWith(img);
  }
}
rasterizeCharTexts();

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

/* ---------------- Don Anó, el sabio: vuela hasta un compañero y le da un consejo ---------------- */
async function sageVisit(b) {
  const others = actors.filter((a) => a !== b && a.busy && a.el.classList.contains('on') && !(a.def.id === 'mouse' && a.layer === 'back'));
  if (!others.length) return false;
  const t = pick(others);
  const side = t.x > 1500 ? -1 : t.x < 400 ? 1 : (Math.random() < 0.5 ? -1 : 1);
  const headY = t.top + t.pos.y + t.h * 0.25;
  const x = Math.max(120, Math.min(1800, t.x + side * (t.w * 0.45 + 70)));
  const y = Math.max(200, Math.min(980, headY));
  await b.moveTo(x, y, { mode: 'fly', arc: 80 });
  b.spot = { x, y, level: 'air' };
  b.el.classList.toggle('face-left', t.x < b.x);
  b.act('advise');
  const line = SAGE_FOR[t.def.id] || pick(SAGE);
  b.say(line, 4600, true);
  await sleep(readMs(line) + 300);
  b.act(null);
  b.el.classList.remove('face-left');
  await sleep(300);
  await b.travelTo(pick(b.spots));
  return true;
}

/* ---------------- ¿Qué vas a hacer con tu aguinaldo? (charla rápida entre dos que están en pantalla) ---------------- */
async function aguiChat(a) {
  const others = actors.filter((o) => o !== a && o.busy && o.el.classList.contains('on') && !(o.def.id === 'mouse' && o.layer === 'back') && AGUI_PLANS[o.def.id]);
  if (!others.length) return false;
  const t = pick(others);
  a.el.classList.toggle('face-left', t.x < a.x);
  a.say(pick(AGUI_ASK), 2600, true);
  await sleep(2600);
  const ans = pick(AGUI_PLANS[t.def.id]);
  const wait = t.def.id === 'bird' ? readMs(ans) : 3400;
  t.say(ans, wait, true);
  await sleep(wait);
  if (/hendapait/i.test(ans) && Math.random() < 0.6) {
    a.say(pick(['¡Hendapaitéma también el mío! 😂', 'Igual que todos, che 😂', 'Ya sabía… ¡hendapaitéma! 💸']), 2400, true);
    await sleep(2400);
  }
  a.el.classList.remove('face-left');
  return true;
}

/* ---------------- El pinscher con "zoomies": corre como loco por todo el piso ---------------- */
async function zoomies(p) {
  p.act('bark');
  p.say(pick(['¡ZOOMIES! 🐕💨', '¡No puedo parar! ¡Mucha energía!', '¡Nervios de fin de año! 😵']), 2400);
  for (const x of [300, 1650, 520, 1400]) await p.moveTo(x, FLOOR, { mode: 'run', speed: 1.3 });
  p.act('chase'); await sleep(1600);
  p.act(null);
  await p.moveTo(p.st.x, FLOOR, { mode: 'walk', speed: 0.7 });
  p.spot = p.spots[0];
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
      B.act('advise'); B.say('¿Todavía con ese bulón? «Mbeguekatu», che ra’a: despacito sale 🐦', 3000, true);
      await sleep(2600);
      B.act(null); P.act('bark'); P.say('¡GRRR! ¡Bajate de ahí, pájaro!', 2600, true);
      await sleep(2400);
      P.act('snap'); B.say('«Ijargélva opyta ha’eño»: el que se enoja por todo se queda solo 🐦', 3600, true);
      const cx = P.x + 20, cy = 900;
      for (const [dx, dy] of [[-110, 20], [0, -90], [110, 10], [0, 40], [-110, -20], [10, -100]]) await B.moveTo(cx + dx, cy + dy, { mode: 'fly', speed: 0.55 });
      P.act('dizzy'); P.say('Me mareé… 😵‍💫', 2600, true);
      await B.moveTo(P.x + 138, 912, { mode: 'fly', speed: 0.6 });
      B.act('read'); B.say('«Mbarakaja una vénte opo’ẽ tatápe»: el gato se quema una sola vez. Aprendé, perrito 📖', 3400, true);
      await sleep(2800);
      B.act(null); await B.exit();
      P.act('bark'); P.say('¡Y NO VUELVAS, viejo sabelotodo! 😤', 2400, true);
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
  {
    // El mono deja la cáscara de banana y el chanchito se resbala
    cast: ['monkey', 'pig'],
    async run() {
      const K = A.monkey, G = A.pig;
      await come(K, 860, FLOOR);
      K.act('banana'); K.say('Banana rica… y la cáscara… ¡al piso! 😏', 2800, true);
      await sleep(3000);
      const peel = document.createElement('div');
      peel.className = 'peel'; peel.textContent = '🍌';
      Object.assign(peel.style, { left: '640px', top: FLOOR - 40 + 'px' });
      fxLayer.appendChild(peel);
      peel.animate([{ transform: 'translate(220px,-160px) rotate(0)' }, { transform: 'translate(0,0) rotate(540deg)' }], { duration: 700, easing: 'ease-in' });
      K.act('laugh'); await sleep(900); K.act(null);
      await G.enter();
      G.act('slip'); G.say('¡¿QUIÉN DEJÓ ESTA CÁSCARA?! 🍌', 3000, true);
      await sleep(900);
      K.act('laugh'); K.say('¡JAJAJA! ¡Clásico de los clásicos! 🐒', 3000, true);
      await sleep(3600);
      G.act('angry'); G.say('¡Mono, vení a limpiar esto! 😤', 2600, true);
      K.act('flip'); await sleep(2400);
      peel.remove(); K.act(null); G.act(null);
      await Promise.all([K.exit(), sleep(500).then(() => G.exit())]);
    },
  },
  {
    // 7) El pinscher persigue la bici del conejo
    cast: ['pinscher', 'rabbit'],
    async run() {
      const P = A.pinscher, R = A.rabbit;
      await P.enter(); P.act('sniff');
      await R.enter();
      R.act('bell'); R.say('¡Riiing! Permiso, perrito 🚲', 2400, true);
      P.act('growl'); await sleep(2400);
      P.act('bark'); P.say('¡GUAU! ¡Esa bici me provoca!', 2400, true);
      R.act(null); await sleep(600);
      await Promise.all([R.moveTo(2200, FLOOR, { mode: 'ride', speed: 0.9 }), sleep(300).then(() => P.moveTo(2120, FLOOR, { mode: 'run', speed: 0.85 }))]);
      R.resetHome();
      await sleep(1200);
      P.act(null); await P.moveTo(P.st.x, FLOOR, { mode: 'walk' });
      P.act('tremble'); P.say('Uf… casi la alcanzo 😮‍💨', 2600, true);
      await sleep(2800); P.act(null); await P.exit();
    },
  },
  {
    // 8) El mono juega a "buscá la pelota" con el pinscher… con trampa
    cast: ['monkey', 'pinscher'],
    async run() {
      const K = A.monkey, P = A.pinscher;
      await Promise.all([come(K, 900, FLOOR), P.enter()]);
      K.act('juggle'); K.say('¿Jugamos, perrito? ¡Buscá el hueso! 🦴', 2600, true);
      P.act('beg'); await sleep(2600);
      const bone = document.createElement('div');
      bone.className = 'peel'; bone.textContent = '🦴';
      Object.assign(bone.style, { left: K.x + 'px', top: K.y - 200 + 'px' });
      fxLayer.appendChild(bone);
      K.act('laugh');
      await bone.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-280px,-200px) rotate(400deg)', offset: 0.5 }, { transform: 'translate(-560px,150px) rotate(800deg)' }], { duration: 1100, easing: 'ease-out' }).finished;
      bone.style.transform = 'translate(-560px,150px)';
      P.act('bark');
      await P.moveTo(K.x - 520, FLOOR, { mode: 'run', speed: 0.9 });
      bone.remove(); P.act('fetch');
      await P.moveTo(K.x - 140, FLOOR, { mode: 'run', speed: 0.8 });
      K.act('chest'); K.say('¡Bien! ¡Otra vez! Ahora más lejos… 😏', 2400, true);
      await sleep(1800);
      P.act('beg'); K.act('laugh');
      fxLayer.appendChild(bone); bone.style.transform = '';
      await bone.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-1200px,-300px) rotate(900deg)' }], { duration: 1000, easing: 'ease-out' }).finished;
      bone.remove();
      P.act('bark'); await P.moveTo(-200, FLOOR, { mode: 'run', speed: 1 });
      K.say('¡JAJAJA! Esa no vuelve más 🐒', 2600, true);
      await sleep(2600);
      P.place(2100, FLOOR); P.act('fetch');
      await P.moveTo(K.x + 160, FLOOR, { mode: 'run', speed: 1 });
      P.act('growl'); P.say('Di la vuelta al mundo. ¡Acá está tu hueso! 😎', 2800, true);
      K.act('flip'); K.say('¡¿CÓMO?! 😱', 2200, true);
      await sleep(2800);
      K.act(null); P.act(null);
      await Promise.all([K.exit(), P.exit()]);
    },
  },
  {
    // 9) Las chispas del oso asustan al pinscher, que se esconde detrás del tanque
    cast: ['bear', 'pinscher'],
    async run() {
      const O = A.bear, P = A.pinscher;
      await O.enter(); O.act('weld');
      await P.enter(); await P.moveTo(760, FLOOR, { mode: 'walk', speed: 0.6 });
      P.act('growl'); P.say('¡Grrr! ¡Esas luces me atacan!', 2600, true);
      await sleep(2600);
      P.act('bark'); await sleep(1400);
      P.act(null); await P.moveTo(200, FLOOR, { mode: 'run', speed: 1 });
      P.act('tremble'); P.say('Desde acá estoy más seguro… 😰', 2600, true);
      await sleep(2000);
      O.act('terere'); O.say('Tranquilo, che, son chispas nomás. ¿Un tereré? 🧉', 3000, true);
      await sleep(3000);
      P.act(null); await P.moveTo(620, FLOOR, { mode: 'walk', speed: 0.5 });
      P.act('beg'); P.say('Bueno… pero con yuyito 🥺', 2600, true);
      await sleep(2800);
      O.act(null); P.act(null);
      await Promise.all([O.exit(), P.exit()]);
    },
  },
  {
    // 10) El pinscher le ladra a la escalera del pato
    cast: ['duck', 'pinscher'],
    async run() {
      const D = A.duck, P = A.pinscher;
      await D.enter(); D.act('change'); D.say('Cambiando la lámpara… concentración total ⛑️', 2600, true);
      await P.enter(); await P.moveTo(1500, FLOOR, { mode: 'walk', speed: 0.7 });
      P.act('bark'); P.say('¡GUAU! ¿Qué hacés ahí arriba?', 2400, true);
      await sleep(1600);
      D.act('wobble'); D.say('¡CUAC! ¡No me muevas la escalera!', 2600, true);
      P.act('chase'); await sleep(3200);
      D.act(null); P.act('tremble');
      await sleep(1400);
      D.act('quack'); D.say('Perro maleducado… 😤', 2400, true);
      P.act('beg'); P.say('Perdón, señor pato 🥺', 2400, true);
      await sleep(2800);
      D.act(null); P.act(null);
      await Promise.all([D.exit(), P.exit()]);
    },
  },
  {
    // 11) El chanchito le convida chipa al pinscher
    cast: ['pig', 'pinscher'],
    async run() {
      const G = A.pig, P = A.pinscher;
      await G.enter(); G.act('chipa');
      await P.enter(); await P.moveTo(870, FLOOR, { mode: 'walk', speed: 0.6 });
      P.act('sniff'); P.say('Sniff sniff… ¿eso es chipa? 👃', 2400, true);
      await sleep(2400);
      P.act('beg'); P.say('¿Me convidás un pedacito? 🥺', 2600, true);
      await sleep(2600);
      G.act('dream'); G.say('Bueno… tomá, que es Navidad 🎄', 2600, true);
      await sleep(1200);
      P.act('eat'); P.say('¡Al fin algo bueno hoy! ❤️', 2800, true);
      await sleep(3000);
      G.act(null); P.act('chase');
      await sleep(2000); P.act(null);
      await Promise.all([G.exit(), P.exit()]);
    },
  },
  {
    // 12) El ratón provoca al pinscher y se escapa al panel
    cast: ['mouse', 'pinscher'],
    async run() {
      const M = A.mouse, P = A.pinscher;
      await P.enter(); P.act('dig');
      await come(M, 980, FLOOR);
      M.act('salute'); M.say('¡Atrapame si podés, perrito! 😜', 2600, true);
      await sleep(1600);
      P.act('bark'); P.say('¡GRRR! ¡VENÍ ACÁ!', 2000, true);
      M.act(null);
      await Promise.all([M.moveTo(-160, FLOOR, { mode: 'run', speed: 1.1 }), sleep(400).then(() => P.moveTo(-180, FLOOR, { mode: 'run', speed: 0.95 }))]);
      await sleep(900);
      M.place(2060, FLOOR); P.place(2250, FLOOR);
      await Promise.all([M.moveTo(1320, FLOOR, { mode: 'run', speed: 1.1 }), P.moveTo(1500, FLOOR, { mode: 'run', speed: 0.95 })]);
      await M.moveTo(1320, 238, { mode: 'jump', arc: 220, speed: 0.8 }); M.setLayer('back'); M.spot = { level: 'top', x: 1320, y: 238 };
      P.act('growl'); P.say('¡Bajá si sos valiente!', 2600, true);
      M.act('cheese'); M.say('Desde acá arriba se ve todo… ñam 🧀', 2600, true);
      await sleep(3000);
      P.act('chase'); P.say('Me mareé de tanto correr… 😵‍💫', 2400, true);
      await sleep(2400);
      M.act('salute'); M.say('¡Bye bye! 👋', 1800, true); await sleep(1600);
      M.act(null); P.act(null);
      await Promise.all([M.exit(), P.exit()]);
    },
  },
  {
    // 13) Duelo de malabares: pulpo contra mono
    cast: ['octo', 'monkey'],
    async run() {
      const Oc = A.octo, K = A.monkey;
      await Oc.enter(); await come(K, 420, FLOOR);
      K.act('juggle'); K.say('¡Malabares con 3 llaves! ¿Quién da más? 🐒', 2600, true);
      await sleep(2600);
      Oc.act('juggle'); Oc.say('Ja… yo con 8 brazos podría hacer 20 🐙', 2800, true);
      await sleep(2800);
      K.act('flip'); K.say('¡Pero no sabés hacer esto! 🤸', 2400, true);
      await sleep(2400);
      Oc.act('ink'); Oc.say('¡Uy! ¡Me ganó la emoción! 😳', 2400, true);
      K.act('laugh'); await sleep(2600);
      Oc.act('wave'); K.act('chest'); await sleep(2000);
      Oc.act(null); K.act(null);
      await Promise.all([Oc.exit(), K.exit()]);
    },
  },
  {
    // 14) El loro inspecciona la seguridad del pato
    cast: ['parrot', 'duck'],
    async run() {
      const L = A.parrot, D = A.duck;
      await D.enter(); D.act('change');
      await come(L, 1680, 405);
      L.act('supervise'); L.say('Inspección: ¿arnés de seguridad para trabajo en altura? 📋', 3000, true);
      await sleep(3000);
      D.act('wobble'); D.say('¡Ups! ¡CUAC! Ya bajo y me lo pongo', 2600, true);
      await sleep(2600);
      D.act(null); await sleep(1200);
      D.act('quack'); L.act('talk'); L.say('Anotado: el pato cumple ✔ ¡Bien ahí!', 2600, true);
      await sleep(2800);
      D.act('coffee'); L.act('dance'); L.say('¡Cocido para todos! ☕', 2400, true);
      await sleep(2600);
      L.act(null); D.act(null);
      await Promise.all([L.exit(), D.exit()]);
    },
  },
  {
    // 15) El conejo le pide plata prestada al oso "hasta que cobre el aguinaldo"
    cast: ['rabbit', 'bear'],
    async run() {
      const R = A.rabbit, O = A.bear;
      await Promise.all([O.enter(), R.enter()]);
      await R.moveTo(O.x + 330, FLOOR, { mode: 'ride', speed: 0.5 });
      R.act('tired'); R.say('Che, oso… ¿me prestás 100 mil? 🙏', 2600, true);
      await sleep(2600);
      R.say('Te devuelvo cuando cobre el aguinaldo. ¡Palabra de conejo! 🐰', 3000, true);
      O.act('watch'); await sleep(3000);
      O.say('¿Y por qué no le pedís a tu banco? 🤨', 2600, true);
      await sleep(2400);
      R.act('flat'); R.say('Mi banco no me devuelve ni la llamada… 😅', 2800, true);
      await sleep(2800);
      O.act('sweat'); O.say('Bueno… pero firmás un pagaré, y el 15 me pagás sin falta 📝', 3200, true);
      await sleep(1600);
      const b = document.createElement('div');
      b.className = 'bill'; b.textContent = '₲ 100.000';
      Object.assign(b.style, { left: O.x + 40 + 'px', top: FLOOR - 220 + 'px', width: '150px', fontSize: '20px' });
      fxLayer.appendChild(b);
      await b.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(150px,-90px) rotate(200deg)', offset: 0.5 }, { transform: 'translate(290px,10px) rotate(360deg)' }], { duration: 1200, easing: 'ease-in-out' }).finished.catch(() => {});
      b.remove();
      R.act('wheelie'); R.say('¡Trato hecho! El 15 te pago… o el 16… o el 17 😬', 3000, true);
      await sleep(2600);
      O.act('hammer'); O.say('¡EL 15! 😤', 2000, true);
      await sleep(2000);
      O.act(null); R.act(null);
      await Promise.all([R.exit(), sleep(600).then(() => O.exit())]);
    },
  },
  {
    // 16) El mono pide un préstamo en el "Loro Bank"
    cast: ['monkey', 'parrot'],
    async run() {
      const K = A.monkey, L = A.parrot;
      await come(L, 1150, 238);
      L.act('supervise'); L.say('Ventanilla del Loro Bank: abierta… y sin intervención 🦜😏', 3000, true);
      await come(K, 1320, 238);
      K.act('chest'); K.say('¡Quiero un préstamo de 50 bananas! 🍌', 2600, true);
      await sleep(2600);
      K.act('banana'); K.say('Lo devuelvo con el aguinaldo, ¡promesa de mono! 🐒', 2800, true);
      await sleep(2800);
      L.act('talk'); L.say('¿Garantía? ¿Ingresos? ¿Algún pariente en el directorio? 🤨', 3200, true);
      await sleep(3200);
      K.act('selfie'); K.say('Tengo esta selfie con el reloj 🤳', 2600, true);
      await sleep(2600);
      L.act('radio'); L.say('Central: préstamo aprobado sin preguntas… así terminan los bancos 😬📻', 3400, true);
      await sleep(3400);
      K.act('flip'); K.say('¡Gracias, Loro Bank! Nos vemos el 15… creo 🤸', 2800, true);
      L.act('nap'); await sleep(2800);
      K.act(null); L.act(null);
      await Promise.all([K.exit(), L.exit()]);
    },
  },
  {
    // 17) El pinscher le pide la llave prestada al pulpo
    cast: ['pinscher', 'octo'],
    async run() {
      const P = A.pinscher, Oc = A.octo;
      await Promise.all([P.enter(), Oc.enter()]);
      await P.moveTo(420, FLOOR, { mode: 'walk', speed: 0.7 });
      P.act('beg'); P.say('Pulpo… ¿me prestás una de tus llaves? 🥺', 2600, true);
      await sleep(2600);
      P.say('Te la devuelvo cuando cobre el aguinaldo, ¡te juro! 🐕', 2800, true);
      Oc.act('multi'); await sleep(2800);
      Oc.say('Tengo 8 brazos y ya presté 7 llaves "hasta el aguinaldo" 🐙', 3200, true);
      await sleep(3200);
      P.act('growl'); P.say('¿Y quién te debe? ¡Decime nombres! 😤', 2600, true);
      await sleep(2600);
      Oc.act('check'); Oc.say('Está todo anotado en la planilla… cobro el 16 📋', 3000, true);
      await sleep(3000);
      Oc.act('wave'); P.act('chase'); P.say('¡Aunque sea prestame una cola nueva! 🌀', 2400, true);
      await sleep(2600);
      P.act(null); Oc.act(null);
      await Promise.all([P.exit(), Oc.exit()]);
    },
  },
  {
    // 18) El anó y el loro cambian cables (mantenimiento programado)
    cast: ['bird', 'parrot'],
    async run() {
      const B = A.bird, L = A.parrot;
      await come(L, 1150, 238);
      L.act('lockout'); L.say('Mantenimiento programado: cambio de cables. Equipo bloqueado 🔒', 3200, true);
      await sleep(2000);
      plannedStop('CAMBIO DE CABLES');
      await come(B, 1500, 528);
      B.act('pull'); B.say('Saco el cable viejo… ¡qué duro está! 🐦', 2600, true);
      await sleep(2600);
      L.act('radio'); L.say('¡Rojo con rojo, azul con azul! ¿O era al revés? 📻', 3000, true);
      B.act('peck'); await sleep(1400);
      B.say('¡AY! ¡Era al revés! 😵', 2200, true);
      await sleep(2200);
      B.act('wiring'); L.act('supervise'); L.say('Prueba de continuidad… anotando 📋', 3000, true);
      await sleep(4200);
      plannedRestart();
      B.act('sing'); L.act('dance'); B.say('¡Cables nuevos y ordenados! 🎵', 2600, true);
      await calibrate(3200);
      B.act(null); L.act(null);
      await Promise.all([B.exit(), L.exit()]);
    },
  },
  {
    // 19) El oso repara el motor del reloj y el ratón lo calibra al terminar
    cast: ['bear', 'mouse'],
    async run() {
      const O = A.bear, M = A.mouse;
      await O.enter(); await O.moveTo(880, FLOOR, { mode: 'walk' });
      O.act('sweat'); O.say('Este motor viene haciendo un ruidito raro… 🤔', 2800, true);
      await sleep(2800);
      plannedStop('MANTENIMIENTO DEL MOTOR');
      O.act('motor'); O.say('Paro el reloj un ratito: cambio rodamiento y tenso la correa 🔧', 3400, true);
      await sleep(4600);
      O.act('hammer'); O.say('Un golpecito de precisión… ¡PUM! 🔨', 2400, true);
      await sleep(2400);
      O.act('motor'); await sleep(2000);
      plannedRestart();
      O.say('¡Motor como nuevo! Ratón, ¿calibrás vos? 🐻', 2800, true);
      await come(M, 566, 242);
      M.act('sensor'); M.say('Primero el sensor de velocidad… ✔', 2600, true);
      await sleep(2800);
      M.act('tablet'); M.say('Ahora sincronizo con la hora oficial 🛰️', 3000, true);
      await calibrate();
      M.act('salute'); O.act('dance'); O.say('¡Equipo de lujo! 💪', 2400, true);
      await sleep(2600);
      M.act(null); O.act(null);
      await Promise.all([M.exit(), O.exit()]);
    },
  },
  {
    // 20) Trabajo programado entre el pato torpe y el pinscher nervioso
    cast: ['duck', 'pinscher'],
    async run() {
      const D = A.duck, P = A.pinscher;
      await Promise.all([D.enter(), P.enter()]);
      await P.moveTo(1420, FLOOR, { mode: 'walk', speed: 0.6 });
      D.act('quack'); D.say('¡Hoy nos toca el preventivo juntos, perrito! ⛑️', 2800, true);
      await sleep(2600);
      P.act('growl'); P.say('Vos no toques nada. NADA. 😠', 2600, true);
      await sleep(2600);
      D.act('trip'); D.say('¡CUAC! Perdón, se me cayó todo… 😅', 2800, true);
      P.act('tremble'); await sleep(3400);
      D.act('paint'); D.say('Mientras tanto pinto la línea de seguridad 🖌️', 2600, true);
      await sleep(2000);
      P.el.classList.add('painted'); P.act('bark'); P.say('¡¡ME PINTASTE LA PATA!! 😡', 2600, true);
      await sleep(2600);
      D.act('tangle'); D.say('Tranquilo, tranquilo… ¡ay, me enredé! 😵', 2600, true);
      P.act('chase'); P.say('No puedo trabajar así… ¡NO PUEDO! 🌀', 2600, true);
      await sleep(3200);
      D.act(null); P.act('tremble');
      D.say('¡Terminamos! ¿Mañana seguimos juntos? 🦆', 2800, true);
      await sleep(2000);
      P.act('bark'); P.say('¡¡NO!! Pido cambio de turno 😤', 2400, true);
      await sleep(1200);
      P.act(null); await P.moveTo(2100, FLOOR, { mode: 'run', speed: 1.2 });
      P.el.classList.remove('painted'); P.resetHome();
      D.act('coffee'); D.say('Qué perrito tan simpático… ☕', 2600, true);
      await sleep(2800); D.act(null); await D.exit();
    },
  },
  {
    // 21) El mono cambia un rodamiento y el ratón ajusta el sensor de vibración
    cast: ['monkey', 'mouse'],
    async run() {
      const K = A.monkey, M = A.mouse;
      await come(K, 1440, FLOOR);
      K.act('chest'); K.say('¡Este rodamiento suena a maraca! Lo cambio 🐒', 2800, true);
      await sleep(2400);
      plannedStop('CAMBIO DE RODAMIENTO');
      K.act('bearing'); await sleep(4400);
      K.say('¡Rodamiento nuevo! Ratón, revisá la vibración 🔧', 2800, true);
      await come(M, 1320, 238);
      M.act('sensor'); M.say('Vibración: 2,1 mm/s… ¡dentro de tolerancia! ✔', 3200, true);
      await sleep(3400);
      plannedRestart();
      K.act('flip'); M.act('salute'); M.say('Equipo liberado para producción 🐭', 2600, true);
      await calibrate(3000);
      K.act(null); M.act(null);
      await Promise.all([K.exit(), M.exit()]);
    },
  },
  {
    // 22) El pato le alcanza las herramientas equivocadas al oso
    cast: ['bear', 'duck'],
    async run() {
      const O = A.bear, D = A.duck;
      await Promise.all([O.enter(), D.enter()]);
      await O.moveTo(1180, FLOOR, { mode: 'walk' });
      O.act('motor'); O.say('Pato, alcanzame la llave 14, porfa 🔧', 2600, true);
      await sleep(2600);
      D.act('measure'); D.say('¡Ahí va! 🦆', 1800, true);
      await sleep(1800);
      O.act('sweat'); O.say('…Esto es un multímetro 😑', 2400, true);
      await sleep(2400);
      D.act('coffee'); D.say('¡Perdón! ¿Esto entonces? ☕', 2400, true);
      await sleep(2400);
      O.act('yawn'); O.say('Eso es tu cocido… 🥱', 2400, true);
      await sleep(2400);
      D.act('trip'); D.say('¡Ya sé! La caja entera… ¡CUAC! 💥', 2800, true);
      await sleep(3400);
      O.act('hammer'); O.say('Mejor lo arreglo a martillazos y listo 🐻', 2600, true);
      D.act('quack'); await sleep(2800);
      O.act(null); D.act(null);
      await Promise.all([O.exit(), D.exit()]);
    },
  },
  {
    // 23) El conejo trae repuestos y el pulpo suelda la placa
    cast: ['rabbit', 'octo'],
    async run() {
      const R = A.rabbit, Oc = A.octo;
      await Oc.enter(); Oc.act('check'); Oc.say('Me faltan resistencias para la placa del reloj… 📋', 2800, true);
      R.act('delivery'); await R.enter();
      await R.moveTo(560, FLOOR, { mode: 'ride', speed: 0.6 });
      R.act('bell'); R.say('¡Envío express! Resistencias, estaño y chipa 📦', 2800, true);
      await sleep(2800);
      Oc.act('pcb'); Oc.say('¡Justo a tiempo! Soldando con 4 brazos a la vez 🐙', 3000, true);
      R.act('carrot'); await sleep(4400);
      Oc.act('wave'); Oc.say('¿La chipa también era para la placa? 😋', 2600, true);
      R.act('wheelie'); R.say('¡Esa es mi propina! 🐰', 2400, true);
      await sleep(2600);
      R.act(null); Oc.act(null);
      await Promise.all([R.exit(), Oc.exit()]);
    },
  },
  {
    // 24) El loro bloquea la máquina y el pinscher quiere "un ajustecito"
    cast: ['parrot', 'pinscher'],
    async run() {
      const L = A.parrot, P = A.pinscher;
      await P.enter(); P.act('sniff');
      await come(L, 1420, 912);
      L.act('lockout'); L.say('Máquina M24 bloqueada por mantenimiento 🔒', 2800, true);
      await sleep(2800);
      P.act('torque'); P.say('Es solo un ajustecito… nadie se va a enterar 😏', 2600, true);
      await sleep(1600);
      L.act('snitch'); L.say('¡ALTO! ¡Equipo bloqueado! ¡Infracción! 🦜', 2800, true);
      P.act('tremble'); await sleep(2800);
      L.act('supervise'); L.say('Primero el permiso de trabajo, después la llave 📋', 3000, true);
      P.act('beg'); P.say('Bueno… ¿dónde firmo? 🥺', 2600, true);
      await sleep(3000);
      L.act(null); P.act('torque'); P.say('Con permiso firmado: ¡CLICK! 120 Nm ✔', 2600, true);
      await sleep(2800);
      P.act(null);
      await Promise.all([L.exit(), P.exit()]);
    },
  },
  {
    // 25) El pato tropieza con la escoba del chanchito
    cast: ['pig', 'duck'],
    async run() {
      const G = A.pig, D = A.duck;
      await G.enter(); G.act('sweep'); G.say('5S: piso limpio y ordenado 🧹', 2400, true);
      await D.enter(); await D.moveTo(1000, FLOOR, { mode: 'walk', speed: 0.35 });
      D.act('trip'); D.say('¡CUAC! ¿Quién puso una escoba en el pasillo?', 2800, true);
      G.act('angry'); await sleep(3400);
      G.say('¡Estaba barriendo, pato! 😤', 2400, true);
      D.act('paint'); D.say('¡Te ayudo! Pinto una línea así nadie más se tropieza 🖌️', 3000, true);
      await sleep(3600);
      G.act('filter'); G.say('…Mejor andá a tomar un cocido, ¿sí? 🐷', 2800, true);
      D.act('coffee'); await sleep(3000);
      G.act(null); D.act(null);
      await Promise.all([G.exit(), D.exit()]);
    },
  },
  {
    // 26) ¿Sabés quién no va a cobrar aguinaldo este año?
    cast: ['parrot', 'bear'],
    async run() {
      const L = A.parrot, O = A.bear;
      await O.enter(); await come(L, 205, 456);
      O.act('terere');
      L.act('talk'); L.say('Oso… ¿sabés quién NO va a cobrar aguinaldo este año? 🦜', 3000, true);
      await sleep(3000);
      O.act('watch'); O.say('¿Quién? 🤔', 1800, true);
      await sleep(1900);
      L.act('snitch'); L.say('¡SANTIAGO PEÑA! 🦜', 2400, true);
      await sleep(1200);
      O.act('dance'); O.say('¡JAJAJAJA! Ni él ni su banco amigo 😂', 3000, true);
      L.act('dance'); await sleep(3400);
      L.say('¡Este año el aguinaldo es para los que laburan! 💪', 2800, true);
      await sleep(3000);
      L.act(null); O.act(null);
      await Promise.all([L.exit(), O.exit()]);
    },
  },
  {
    // 27) ¿Dónde NO vas a depositar el aguinaldo?
    cast: ['monkey', 'pig'],
    async run() {
      const K = A.monkey, G = A.pig;
      await G.enter(); await come(K, 900, FLOOR);
      G.act('dream'); G.say('Ya estoy planeando dónde guardar el aguinaldo 💸', 2800, true);
      await sleep(2800);
      K.act('banana'); K.say('¿Sabés dónde seguro NO lo vas a depositar? 🍌', 2800, true);
      await sleep(2800);
      G.act('phone'); G.say('¿Dónde? 🐷', 1800, true);
      await sleep(1900);
      K.act('chest'); K.say('¡EN UENO! 🐒', 2200, true);
      await sleep(1200);
      G.act('angry'); G.say('¡Ni loco! Yo soy chanchito: ¡alcancía y colchón! 🐷🛏️', 3000, true);
      K.act('laugh'); await sleep(3400);
      K.act(null); G.act(null);
      await Promise.all([K.exit(), G.exit()]);
    },
  },
  {
    // 28) ¿Qué tienen en común el bulón M24 y la plata de ueno?
    cast: ['octo', 'pinscher'],
    async run() {
      const Oc = A.octo, P = A.pinscher;
      await Promise.all([Oc.enter(), P.enter()]);
      P.act('struggle'); P.say('¡Este bulón no sale ni a palos! 😤', 2600, true);
      await sleep(2600);
      Oc.act('wave'); Oc.say('¿Sabés qué tiene en común tu bulón con la plata de ueno? 🐙', 3000, true);
      await sleep(3000);
      P.act('growl'); P.say('¿Qué? 😠', 1800, true);
      await sleep(1900);
      Oc.act('juggle'); Oc.say('¡Que nadie los puede sacar! 😂', 2600, true);
      await sleep(1400);
      P.act('chase'); P.say('Jaja… ¡no me da risa! …bueno, un poquito 🌀', 2800, true);
      await sleep(3000);
      Oc.act(null); P.act(null);
      await Promise.all([Oc.exit(), P.exit()]);
    },
  },
  {
    // 29) El único auto de lujo del taller
    cast: ['rabbit', 'mouse'],
    async run() {
      const R = A.rabbit, M = A.mouse;
      await come(M, 860, FLOOR);
      M.act('tablet'); M.say('Che, la fiscalía secuestró los autos de lujo del dueño de ueno 📰', 3000, true);
      await sleep(3000);
      await R.enter();
      R.act('bell'); R.say('¡Riiing! ¿Y a mí cuándo me secuestran la bici? 🚲', 2800, true);
      await sleep(2800);
      M.act('salute'); M.say('Tranquilo: con un aguinaldo de taller nadie se compra un Bentley 😂', 3200, true);
      await sleep(3200);
      R.act('wheelie'); R.say('¡Mi bici es 100% mía y sin sobregiros! 😎', 2800, true);
      await sleep(3000);
      R.act(null); M.act(null);
      await Promise.all([R.exit(), M.exit()]);
    },
  },
  {
    // 30) El colchón, el banco más sólido del país
    cast: ['duck', 'bird'],
    async run() {
      const D = A.duck, B = A.bird;
      await D.enter(); await come(B, 1440, lightsY(1440) + 6);
      D.act('coffee'); D.say('Mi aguinaldo va directo al colchón 🛏️', 2600, true);
      await sleep(2600);
      B.act('sing'); B.say('¿Por qué al colchón, pato? 🐦', 2200, true);
      await sleep(2300);
      D.act('quack'); D.say('¡Porque al colchón nunca lo intervino el Banco Central! 🦆', 3200, true);
      await sleep(1500);
      B.act('balance'); B.say('¡JAJA! ¡Me caigo del cable! 😂', 2600, true);
      await sleep(3000);
      D.act('trip'); D.say('…ni yo de la risa ¡CUAC! 💥', 2600, true);
      await sleep(3200);
      D.act(null); B.act(null);
      await Promise.all([D.exit(), B.exit()]);
    },
  },
  {
    // 31) Ex presidente desocupado
    cast: ['parrot', 'monkey'],
    async run() {
      const L = A.parrot, K = A.monkey;
      await come(L, 1150, 238); await come(K, 1320, 238);
      K.act('selfie'); K.say('Che loro, ¿viste que en el taller necesitan un ayudante? 🤳', 3000, true);
      await sleep(3000);
      L.act('supervise'); L.say('Sí… y ya se postuló un ex presidente con experiencia en bancos 📋', 3200, true);
      await sleep(3200);
      K.act('laugh'); K.say('¡JAJAJA! ¿Y qué experiencia? 😂', 2400, true);
      await sleep(2400);
      L.act('talk'); L.say('Ninguna: los bancos que conoce… ¡cierran! 🦜', 2800, true);
      await sleep(1500);
      K.act('flip'); await sleep(2400);
      K.act(null); L.act(null);
      await Promise.all([K.exit(), L.exit()]);
    },
  },  {
    // 32) ¿Qué vas a hacer con tu aguinaldo? — el oso ya tiene todo destinado
    cast: ['pig', 'bear'],
    async run() {
      const G = A.pig, O = A.bear;
      await Promise.all([G.enter(), O.enter()]);
      G.act('chipa'); G.say('Oso, ¿qué vas a hacer con tu aguinaldo? 🐷', 2600, true);
      await sleep(2600);
      O.act('terere'); O.say('Hendapaitéma 🐻', 2200, true);
      await sleep(2200);
      G.act('gauge'); G.say('¿Todo? ¿Ni un poquito para ahorrar?', 2600, true);
      await sleep(2600);
      O.act('watch'); O.say('Todo. Hasta el último guaraní ya tiene dueño: el asado del 24 🥩', 3200, true);
      await sleep(3200);
      G.act('dream'); G.say('…¿y estoy invitado? 😍', 2400, true);
      await sleep(2600);
      O.act('dance'); O.say('¡Si traés la chipa, sí! 😂', 2400, true);
      await sleep(2800);
      G.act(null); O.act(null);
      await Promise.all([G.exit(), O.exit()]);
    },
  },
  {
    // 33) Al pinscher no le gusta que le pregunten
    cast: ['rabbit', 'pinscher'],
    async run() {
      const R = A.rabbit, P = A.pinscher;
      await P.enter(); P.act('struggle');
      await R.enter();
      R.act('bell'); R.say('¡Riiing! Pinscher, ¿qué vas a hacer con tu aguinaldo? 🚲', 2800, true);
      await sleep(2800);
      P.act('bark'); P.say('¡HENDAPAITÉMA! 😤', 2000, true);
      await sleep(2000);
      R.act('carrot'); R.say('Tranqui… ¿en qué, por ejemplo?', 2400, true);
      await sleep(2400);
      P.act('growl'); P.say('¡Bulón nuevo, llave de torque nueva… y un psicólogo! GRR', 3200, true);
      await sleep(3200);
      R.act('wheelie'); R.say('¡Me parece una muy buena inversión! 😂', 2600, true);
      await sleep(1200);
      await R.exit();
      P.act('tremble'); await sleep(1800);
      P.act(null); await P.exit();
    },
  },
  {
    // 34) El pulpo responde a todo con su frase
    cast: ['monkey', 'octo'],
    async run() {
      const K = A.monkey, Oc = A.octo;
      await Oc.enter(); Oc.act('check');
      await come(K, 470, FLOOR);
      K.act('selfie'); K.say('Pulpo, ¿ya sabés qué vas a hacer con el aguinaldo? 🐒', 2800, true);
      await sleep(2800);
      Oc.act('wave'); Oc.say('¡SEEEEEE! 🐙', 1800, true);
      await sleep(1800);
      K.act('chest'); K.say('¿Sí qué? ¿Qué vas a comprar?', 2400, true);
      await sleep(2400);
      Oc.act('juggle'); Oc.say('Ocho pares de zapatillas… ¡SEEEEEE! 👟', 2800, true);
      await sleep(2800);
      K.act('laugh'); K.say('¿Y te alcanza para tanto? 😂', 2200, true);
      await sleep(2200);
      Oc.act('coffee'); Oc.say('¡SEEEEEE! …bueno, hendapaitéma igual 💸', 2800, true);
      await sleep(3000);
      K.act('flip'); await sleep(1600);
      K.act(null); Oc.act(null);
      await Promise.all([K.exit(), Oc.exit()]);
    },
  },
  {
    // 35) Don Anó explica qué significa hendapaitéma
    cast: ['duck', 'bird'],
    async run() {
      const D = A.duck, B = A.bird;
      await D.enter(); await come(B, 1440, lightsY(1440) + 6);
      D.act('measure'); D.say('Don Anó, todos dicen «hendapaitéma»… ¿qué significa? 🦆', 3000, true);
      await sleep(3000);
      B.act('advise');
      const l1 = 'Hendapaitéma: «ya tiene su lugar». El aguinaldo llega… y ya sabe a dónde tiene que ir 💸';
      B.say(l1, 0, true); await sleep(readMs(l1));
      D.act('quack'); D.say('¡Ah! Como el mío: a pagar todo lo que rompí en el año ¡CUAC!', 3000, true);
      await sleep(3000);
      B.act('ponder');
      const l2 = 'Por eso, mitã: ¡menos tropezones y más aguinaldo para vos! 😉';
      B.say(l2, 0, true); await sleep(readMs(l2));
      D.act('trip'); D.say('…lo intento ¡CUAC! 💥', 2200, true);
      await sleep(2600);
      D.act(null); B.act(null);
      await Promise.all([D.exit(), B.exit()]);
    },
  },
  {
    // 36) El ratón se ofrece a "cuidar" el aguinaldo del chanchito
    cast: ['mouse', 'pig'],
    async run() {
      const M = A.mouse, G = A.pig;
      await G.enter(); G.act('phone');
      await come(M, 860, FLOOR);
      M.act('cheese'); M.say('Chanchito, ¿qué vas a hacer con tu aguinaldo? 🐭', 2600, true);
      await sleep(2600);
      G.act('chipa'); G.say('Comer. Ese es todo el plan 🐷 ¿Y vos?', 2600, true);
      await sleep(2600);
      M.act('salute'); M.say('Yo me ofrezco a cuidar el tuyo… en mi cueva 😏', 2800, true);
      await sleep(2800);
      G.act('angry'); G.say('¡NI LO SUEÑES! Hendapaitéma, ¡y vos no estás en la lista! 😤', 3200, true);
      await sleep(1400);
      await M.moveTo(1500, FLOOR, { mode: 'run' });
      M.say('¡Era un chiste! 😅', 1800, true);
      await sleep(1800);
      G.act(null); M.act(null);
      await Promise.all([G.exit(), M.exit()]);
    },
  },
  {
    // 37) El loro difunde la encuesta del taller
    cast: ['parrot', 'rabbit'],
    async run() {
      const L = A.parrot, R = A.rabbit;
      await come(L, 1150, 238);
      await R.enter();
      L.act('radio'); L.say('📻 Encuesta del taller: ¿en qué van a gastar el aguinaldo?', 3000, true);
      await sleep(3000);
      R.act('delivery'); R.say('Cubiertas para la bici y zanahorias para todo el año 🥕', 2800, true);
      await sleep(2800);
      L.act('talk'); L.say('Resultado: 1 conejo con plan… ¡y 9 que dijeron hendapaitéma! 🦜', 3200, true);
      await sleep(3200);
      R.act('wheelie'); R.say('¡Hendapaitéma también el mío, entonces! 😂', 2600, true);
      await sleep(1500);
      L.act('mimic'); L.say('¡Hendapaitéma! ¡Hendapaitéma! 🦜', 2400, true);
      await sleep(2600);
      R.act(null); L.act(null);
      await Promise.all([L.exit(), R.exit()]);
    },
  },
];

/* ---------------- Paradas del reloj: todos ayudan a repararlo ---------------- */
const BD = { active: false };
const stageEl = $('#stage');
function stopClock(msg) {
  if (director.party) return;
  clockState.stopped = true;
  clockState.frozen = Math.max(0, TARGET - Date.now());
  panelEl.classList.add('frozen');
  stageEl.classList.add('alarm');
  setStatus(msg || '⚠ PARADA', 'alert');
  setTickerAlarm(true);
}
// Mantenimiento programado: el reloj se pausa sin alarma y después se calibra
function plannedStop(label) {
  if (director.party || BD.active) return;
  clockState.stopped = true;
  clockState.frozen = Math.max(0, TARGET - Date.now());
  panelEl.classList.add('frozen');
  setStatus('🔧 ' + label, 'ok');
  machineCtl.stop(1400);
}
function plannedRestart() {
  machineCtl.start();
  setStatus('ARRANCANDO…', 'ok');
}
async function calibrate(dur = 4200) {
  if (director.party) return;
  clockState.calibrating = true; clockState.stopped = false;
  panelEl.classList.remove('frozen'); panelEl.classList.add('calibrating');
  setStatus('CALIBRANDO CON HORA OFICIAL…', 'ok');
  const from = clockState.frozen, t0 = performance.now();
  await new Promise((res) => {
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const real = Math.max(0, TARGET - Date.now());
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      let v = from + (real - from) * e;
      if (k < 0.8) v += (Math.random() - 0.5) * 7200000 * (1 - k);   // los dígitos "giran" buscando la hora
      renderMs(v);
      if (k < 1) requestAnimationFrame(step); else res();
    };
    step();
  });
  renderMs(Math.max(0, TARGET - Date.now()));
  setStatus('CALIBRADO ✔', 'ok');
  clockState.calibrating = false;
  await sleep(2200);
  panelEl.classList.remove('calibrating');
  setStatus('EN PROCESO');
}
function restartMachine() {
  machineCtl.start();
  stageEl.classList.remove('alarm', 'blackout', 'flicker');
  window.scene3d?.dim(false);
  setTickerAlarm(false);
  setStatus('ARRANCANDO…', 'ok');
}
async function recruit(ids, min = 3, wait = 10000, max = 4) {
  ids = [...ids].sort(() => Math.random() - 0.5).sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
  const t0 = performance.now(), got = [];
  while (performance.now() - t0 < wait) {
    for (const id of ids) if (got.length < max && !A[id].busy && !got.includes(A[id])) { A[id].busy = true; got.push(A[id]); }
    if (got.length >= max) break;
    if (got.length === ids.length || (got.length >= min && performance.now() - t0 > 2500)) break;
    await sleep(500);
  }
  return got;
}
// Lleva a un personaje a (x, y) según su forma de moverse
async function come(a, x, y) {
  const t = a.def.travel;
  if (t === 'fly') { a.setLayer('front'); a.show(); a.place(x < 960 ? -260 : 2180, y - 420); await a.moveTo(x, y, { mode: 'fly', dur: 1700, easing: 'ease-out' }); a.spot = { x, y, level: 'air' }; return; }
  if (t === 'leap') { a.setLayer('front'); a.show(); a.place(x < 960 ? -200 : 2120, FLOOR); await a.moveTo(x, y, { mode: 'leap', arc: 300 }); a.spot = { x, y, level: 'air' }; return; }
  if (t === 'ground') {
    a.setLayer('front'); a.show(); a.place(x < 960 ? -120 : 2040, FLOOR);
    await a.moveTo(x, FLOOR, { mode: 'run' });
    if (y < FLOOR - 10) await a.moveTo(x, y, { mode: 'jump', arc: 140, speed: 0.8 });
    a.spot = { x, y, level: y < 300 ? 'top' : y < FLOOR - 10 ? 'air' : 'floor' };
    if (y < 300) a.setLayer('back');
    return;
  }
  await a.enter();
  if (x != null && Math.abs(a.x - x) > 4) await a.moveTo(x, a.st.y, { mode: t === 'ride' ? 'ride' : 'walk' });
}
const pickFirst = (team, ids, visibleOnly = true) => ids.map((id) => A[id]).find((a) => team.includes(a) && (!visibleOnly || a.el.classList.contains('on')));
async function celebrateFix(team) {
  team = team.filter((a) => a.el.classList.contains('on'));
  const happy = { bear: 'dance', duck: 'quack', monkey: 'flip', parrot: 'dance', pig: 'dream', rabbit: 'wheelie', octo: 'wave', bird: 'sing', pinscher: 'win', mouse: 'salute' };
  const lines = ['¡Reloj en marcha! 🎉', '¡Trabajo en equipo! 💪', '¡Así se hace, taller!', '¡Sigue la cuenta al aguinaldo!'];
  team.forEach((a, i) => { a.act(happy[a.def.id]); if (i < 3) setTimeout(() => a.say(lines[i % lines.length], 2600, true), i * 500); });
  await sleep(4200);
  team.forEach((a) => a.act(null));
  await Promise.all(team.map((a, i) => sleep(i * 350).then(() => a.exit())));
}

const BREAKDOWNS = [
  {
    // 1) El ratón se roba el perno del engranaje maestro
    instigator: 'mouse',
    async run() {
      const M = A.mouse, m = machineCtl.master;
      await M.enter(); M.act('flash'); M.say('¿Y esa pieza dorada tan brillante? 👀', 2600, true);
      await sleep(2600); M.act(null);
      M.setLayer('front');
      await M.moveTo(m.x - 6, m.y + 46, { mode: 'jump', arc: 160, speed: 0.6 }); M.spot = { level: 'air' };
      M.act('grab'); await sleep(900);
      machineCtl.pin(false); M.act('loot-gear');
      machineCtl.stop(1800); stopClock('⚠ PARADA: FALTA PERNO MAESTRO');
      M.say('¡Uy…! Creo que era importante 😬', 2600, true);
      await sleep(1600);
      await M.moveTo(m.x - 60, FLOOR, { mode: 'jump', arc: 60 });
      await M.moveTo(-140, FLOOR, { mode: 'run', speed: 1.1 });
      M.resetHome();

      const team = await recruit(['parrot', 'octo', 'monkey', 'duck', 'bear', 'pig', 'rabbit', 'bird', 'pinscher']);
      const has = (id) => team.includes(A[id]);
      const jobs = [];
      if (has('parrot')) jobs.push(come(A.parrot, 1150, 238).then(async () => { A.parrot.act('snitch'); A.parrot.say('¡PARADA! ¡PARADA! ¡El ratón se llevó el perno maestro! 🦜', 3000, true); await sleep(3000); A.parrot.act('radio'); A.parrot.say('Central: reloj detenido. Pedimos apoyo a todo el taller 📻', 3200, true); }));
      if (has('octo')) jobs.push(sleep(800).then(() => A.octo.enter()).then(async () => { A.octo.act('check'); A.octo.say('Diagnóstico: falta el perno del engranaje maestro 📋', 3000, true); await sleep(3200); A.octo.act('multi'); }));
      if (has('bird')) jobs.push(sleep(1500).then(() => come(A.bird, 1440, lightsY(1440) + 6)).then(() => { A.bird.act('pull'); }));
      if (has('bear')) jobs.push(sleep(400).then(() => come(A.bear, 880, FLOOR)).then(() => { A.bear.act('weld'); A.bear.say('Soldadura de refuerzo: ¡este no se lo roban más! 🔥', 3000, true); }));
      if (has('pig')) jobs.push(sleep(1200).then(() => come(A.pig, 1440, FLOOR)).then(() => { A.pig.act('oil'); }));
      if (has('pinscher')) jobs.push(sleep(2000).then(() => A.pinscher.enter()).then(() => { A.pinscher.act('struggle'); A.pinscher.say('¡Ajustando el bulón de seguridad! 😤', 2600, true); }));
      await Promise.all(jobs);
      await sleep(1500);
      // Instalación del perno nuevo
      const installer = pickFirst(team, ['monkey', 'duck', 'octo'], false);
      if (installer?.def.id === 'monkey') {
        await come(A.monkey, m.x, m.y + 50);
        A.monkey.act('install'); A.monkey.say('¡Yo lo pongo! ¡Mono mecánico al rescate! 🐒🔧', 3000, true);
        await sleep(3000); machineCtl.pin(true); A.monkey.act('chest');
      } else if (installer?.def.id === 'duck') {
        await A.duck.enter(); A.duck.act('change'); A.duck.say('Perno nuevo instalado desde la escalera ⛑️', 3000, true);
        await sleep(3200); machineCtl.pin(true);
      } else { await sleep(2500); machineCtl.pin(true); }
      if (has('pinscher')) A.pinscher.act('win');
      // Arranque
      if (has('rabbit')) { await come(A.rabbit, 600, FLOOR); A.rabbit.act('power'); A.rabbit.say('¡Pedaleo para el arranque! ⚡⚡', 2800, true); await sleep(2200); }
      restartMachine();
      await sleep(1500);
      // El ratón vuelve arrepentido y calibra el reloj
      M.busy = true; M.setLayer('back'); M.show(); M.place(566, 442);
      await M.moveTo(566, 242, { mode: 'none', dur: 900, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      M.act('tablet'); M.say('Perdón… 😇 Para compensar, calibro el reloj con la hora oficial', 3600, true);
      await calibrate();
      M.act('salute'); M.say('¡Hora sincronizada! Prometo no robar más… por hoy 🤞', 3000, true);
      await celebrateFix([...team, M]);
    },
  },
  {
    // 2) El anó tironea un cable y deja al taller sin luz
    instigator: 'bird',
    async run() {
      const B = A.bird;
      await come(B, 1500, 528);
      B.act('pull'); B.say('Este cable está medio flojo… lo ajusto 🐦', 2600, true);
      await sleep(2800);
      stageEl.classList.add('blackout'); window.scene3d?.dim(true);
      machineCtl.stop(900); stopClock('⚠ APAGÓN');
      B.act('peck'); B.say('…¡Uy! ¿Quién apagó la luz? 😳', 2600, true);
      await sleep(2400); B.act(null);
      const team = await recruit(['duck', 'rabbit', 'monkey', 'parrot', 'octo', 'bear', 'pig', 'mouse', 'pinscher']);
      const has = (id) => team.includes(A[id]);
      const jobs = [];
      if (has('parrot')) jobs.push(come(A.parrot, 205, 456).then(async () => { A.parrot.act('radio'); A.parrot.say('Central: apagón total en el taller. ¡Generador de emergencia! 📻', 3200, true); }));
      if (has('duck')) jobs.push(A.duck.enter().then(async () => { A.duck.act('measure'); A.duck.say('0 voltios… ¡corte total! Revisando fusibles ⚡', 3000, true); }));
      if (has('mouse')) jobs.push(sleep(900).then(() => come(A.mouse, 960, 238)).then(() => { A.mouse.act('flash'); A.mouse.say('¡Yo alumbro con mi linterna! 🔦', 2600, true); }));
      if (has('pig')) jobs.push(sleep(1600).then(() => come(A.pig, 480, FLOOR)).then(() => { A.pig.act('sweep'); }));
      if (has('octo')) jobs.push(sleep(600).then(() => A.octo.enter()).then(() => { A.octo.act('ink'); A.octo.say('¡No veo nada! ¡Perdón por la tinta! 🐙', 2600, true); }));
      await Promise.all(jobs);
      await sleep(1200);
      if (has('rabbit')) {
        await come(A.rabbit, 1010, FLOOR); A.rabbit.act('power'); A.rabbit.say('¡Generador de emergencia a pedal! ⚡', 3000, true);
        stageEl.classList.add('flicker'); await sleep(3000);
      }
      if (has('bear')) { await come(A.bear, 1180, FLOOR); A.bear.act('weld'); A.bear.say('Empalme soldado como corresponde 🔥', 2800, true); await sleep(2600); }
      if (has('monkey')) {
        await come(A.monkey, 1700, FLOOR); A.monkey.act('switch'); A.monkey.say('¡Subo la térmica! ¡CLICK! 🐒', 2600, true); await sleep(1400);
      } else if (has('duck')) { A.duck.act('change'); A.duck.say('Fusible nuevo colocado ✅', 2600, true); await sleep(2600); }
      else await sleep(1500);
      B.act('tie'); B.say('Cable reconectado y precintado. Hasta el más sabio se equivoca, mitãnguéra 😅', 3200, true);
      restartMachine();
      await sleep(2000); B.act(null);
      const cal = pickFirst(team, ['duck', 'parrot', 'octo', 'mouse']);
      if (cal) {
        const act = { duck: 'measure', parrot: 'radio', octo: 'check', mouse: 'tablet' }[cal.def.id];
        cal.act(act); cal.say('Sincronizando con la hora oficial de Paraguay… 🛰️', 3400, true);
      }
      await calibrate();
      await celebrateFix([...team, B]);
    },
  },
  {
    // 3) El pinscher tira la llave y traba los engranajes
    instigator: 'pinscher',
    async run() {
      const P = A.pinscher, m = machineCtl.master;
      await P.enter(); P.act('struggle'); P.say('Este bulón me tiene harto… 😤', 2600, true);
      await sleep(2800);
      P.el.classList.add('no-wrench'); P.act('bark'); P.say('¡TOMÁ, LLAVE INÚTIL! ¡GUAU!', 2000, true);
      const wr = document.createElement('div');
      wr.className = 'stuck-wrench'; wr.textContent = '🔧';
      Object.assign(wr.style, { left: m.x - 70 + 'px', top: m.y - 150 + 'px' });
      fxLayer.appendChild(wr);
      await wr.animate([{ transform: `translate(${P.x - m.x + 40}px, ${FLOOR - m.y + 60}px) rotate(0)` }, { transform: 'translate(0,0) rotate(900deg)' }], { duration: 900, easing: 'ease-out' }).finished;
      wr.style.transform = 'rotate(900deg)';
      machineCtl.jam(); stopClock('⚠ ATASCO EN TRANSMISIÓN');
      P.act('tremble'); P.say('¡Ups! Se metió en el engranaje… 😰', 2800, true);
      await sleep(1600);
      const team = await recruit(['parrot', 'octo', 'monkey', 'pig', 'bear', 'rabbit', 'duck', 'bird', 'mouse']);
      const has = (id) => team.includes(A[id]);
      const jobs = [];
      if (has('parrot')) jobs.push(come(A.parrot, 1680, 405).then(() => { A.parrot.act('snitch'); A.parrot.say('¡Atasco! ¡Atasco! ¡Fue el pinscher! 🦜', 3000, true); }));
      if (has('octo')) jobs.push(A.octo.enter().then(() => { A.octo.act('multi'); A.octo.say('Con 8 brazos la saco en un segundo… o dos 🐙', 3000, true); }));
      if (has('pig')) jobs.push(sleep(1000).then(() => come(A.pig, 1180, FLOOR)).then(() => { A.pig.act('oil'); A.pig.say('Aceite en los dientes del engranaje 🐷', 2600, true); }));
      if (has('bear')) jobs.push(sleep(500).then(() => come(A.bear, 880, FLOOR)).then(() => { A.bear.act('hammer'); A.bear.say('Un golpecito técnico… ¡PUM! 🔨', 2600, true); }));
      if (has('bird')) jobs.push(sleep(1500).then(() => come(A.bird, 1830, 608)).then(() => { A.bird.act('balance'); }));
      if (has('mouse')) jobs.push(sleep(2000).then(() => come(A.mouse, 1320, 238)).then(() => { A.mouse.act('carry'); A.mouse.say('Traje un bulón nuevo para el pinscher 🐭', 2600, true); }));
      await Promise.all(jobs);
      await sleep(1500);
      const fixer = pickFirst(team, ['monkey', 'octo', 'bear'], false);
      if (fixer?.def.id === 'monkey') { await come(A.monkey, m.x - 40, m.y + 40); A.monkey.act('chest'); A.monkey.say('¡Me cuelgo del engranaje y lo destrabo! 🐒', 2800, true); await sleep(2400); A.monkey.act('flip'); }
      else await sleep(2000);
      machineCtl.unjam();
      await wr.animate([{ transform: 'rotate(900deg)' }, { transform: 'translate(-160px,-200px) rotate(1200deg)', offset: 0.3 }, { transform: `translate(-300px, ${FLOOR - m.y + 120}px) rotate(1600deg)`, opacity: 0.2 }], { duration: 1300, easing: 'ease-in' }).finished;
      wr.remove();
      if (has('rabbit')) { await come(A.rabbit, 640, FLOOR); A.rabbit.act('power'); A.rabbit.say('¡Le doy impulso al arranque! ⚡', 2600, true); await sleep(2000); }
      restartMachine();
      P.el.classList.remove('no-wrench');
      await sleep(1600);
      const cal = pickFirst(team, ['octo', 'parrot', 'duck', 'mouse']) || P;
      cal.act({ octo: 'check', parrot: 'radio', duck: 'measure', mouse: 'tablet', pinscher: 'tremble' }[cal.def.id]);
      cal.say('Calibrando el reloj con la hora oficial ✔', 3400, true);
      await calibrate();
      P.say('Prometo no tirar más la llave… 😇', 2600, true);
      await celebrateFix([...team, P]);
    },
  },
];


/* ---------------- Director de escena ---------------- */
const director = {
  party: false,
  target: 2,
  nextScene: performance.now() + 25000,
  nextBreakdown: performance.now() + 70000,
  async breakdown(n) {
    const opts = BREAKDOWNS.filter((b) => !A[b.instigator].busy);
    const bd = n != null ? BREAKDOWNS[n % BREAKDOWNS.length] : pick(opts);
    if (!bd) return false;
    BD.active = true; A[bd.instigator].busy = true;
    try { await bd.run(); } catch (e) { console.warn('parada', e); restartMachine(); clockState.stopped = false; clockState.calibrating = false; panelEl.classList.remove('frozen', 'calibrating'); }
    actors.forEach((a) => { if (a.busy && !a.el.classList.contains('on')) { a.resetHome(); a.busy = false; a.lastShown = performance.now(); } });
    A[bd.instigator].busy = false; A[bd.instigator].lastShown = performance.now();
    BD.active = false;
    return true;
  },
  async scene() {
    const visibles = actors.filter((a) => a.busy).length;
    if (visibles > 1) return false;
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
    for (let i = 0; i < 2; i++) { first[i].run(); await sleep(rnd(2500, 4000)); }
    while (!this.party) {
      const now = performance.now();
      if (BD.active) { await sleep(1000); continue; }
      if (now > this.nextBreakdown) {
        const opts = BREAKDOWNS.filter((b) => !A[b.instigator].busy);
        if (opts.length && !clockState.stopped && !clockState.calibrating) { this.nextBreakdown = Infinity; this.breakdown().then(() => { this.nextBreakdown = performance.now() + rnd(150000, 240000); }); await sleep(1000); continue; }
        this.nextBreakdown = now + 5000;
      }
      if (now > this.nextScene) {
        if (await this.scene()) this.nextScene = now + rnd(20000, 34000);
        else this.nextScene = now + 4000;
      }
      if (Math.random() < 0.08) this.target = 2 + (Math.random() < 0.35 ? 1 : 0); // 2 o 3 a la vez, nunca una multitud
      const busy = actors.filter((a) => a.busy).length;
      // si toca una escena, se espera a que el escenario se vacíe un poco en vez de sumar gente
      if (busy < this.target && now < this.nextScene) {
        const free = actors.filter((a) => !a.busy && now - a.lastShown > 5000).sort((a, b) => a.lastShown - b.lastShown);
        if (free.length) {
          pick(free.slice(0, 3)).run();
          if (Math.random() < 0.12 && busy + 1 < this.target) {
            const other = free.filter((a) => !a.busy);
            if (other.length) pick(other.slice(0, 3)).run();
          }
        }
      }
      await sleep(rnd(1500, 3500));
    }
  },
};
window.__scenes = SCENES; window.__sage = sageVisit; window.__director = director;
if (params.has('parada')) {
  setTimeout(() => director.breakdown(parseInt(params.get('parada'), 10) || 0), 1200);
} else if (params.has('escena')) {
  // ?escena=N  → prueba una escena puntual
  const n = Math.abs(parseInt(params.get('escena'), 10) || 0);
  setTimeout(() => { const s = SCENES[n % SCENES.length]; s.cast.forEach((id) => (A[id].busy = true)); s.run(); }, 1200);
} else if (!params.has('quieto')) director.loop();

/* ---------------- ¡Llegó el aguinaldo! ---------------- */
async function celebrate() {
  director.party = true;
  window.__party = true;
  machineCtl.stop = machineCtl.jam = () => {};
  // si había una parada en curso, se resuelve sola: ¡es día de cobro!
  clockState.stopped = false; clockState.calibrating = false;
  panelEl.classList.remove('frozen', 'calibrating');
  machineCtl.pin(true); machineCtl.unjam(); restartMachine();
  document.querySelectorAll('.peel, .stuck-wrench').forEach((e) => e.remove());
  renderMs(0);
  stageEl.classList.add('party-time');
  window.scene3d?.celebrate(true);
  const lbl = $('#faltanLabel');
  lbl.textContent = '¡LLEGÓ EL AGUINALDO!';
  lbl.classList.add('done');
  setStatus('¡A COBRAR! 🎉', 'ok');
  setTickerAlarm(false);
  MESSAGES.splice(0, MESSAGES.length, '🎉 ¡HOY SE COBRA EL AGUINALDO! 🎉', '¡FELIZ NAVIDAD, EQUIPO DE MANTENIMIENTO! 🎄', 'GRACIAS POR TODO EL AÑO DE TRABAJO 💪', '¡A COBRAR, GENTE! 💸');
  tickerAnim?.cancel(); runTicker();
  $('#treeStar') && ($('#treeStar').style.opacity = 1);
  const cheers = ['¡AGUINALDO! 🎉', '¡A cobrar, gente!', '¡Feliz Navidad, taller! 🎄', '¡Lo logramos!', '¡Tereré y aguinaldo!'];
  for (const a of actors) {
    a.el.getAnimations().forEach((x) => x.cancel());
    a.resetHome(true);
    a.el.classList.remove('no-chipa', 'no-wrench');
    a.show();
    a.el.classList.add('party');
  }
  document.querySelectorAll('.bubble').forEach((b) => b.remove()); activeBubbles = 0;
  setInterval(() => {
    stageEl.classList.remove('alarm', 'blackout', 'flicker');
    machineCtl.pin(true); renderMs(0);
  }, 400);
  setInterval(() => { activeBubbles = Math.min(activeBubbles, 1); pick(actors).say(pick(cheers), 2400, false, true); }, 1600);
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

/* ---------------- Fluidez automática (TV y equipos modestos) ----------------
   Mide los cuadros por segundo reales. Si el equipo no llega, baja la carga del fondo 3D
   y apaga adornos que casi no se notan; personajes, reloj y engranajes siguen igual.
   ?hd fuerza calidad completa · ?lite fuerza el modo liviano */
(function perfGuard() {
  if (params.has('hd')) return;
  const lite = () => { document.body.classList.add('lite'); window.scene3d?.setQuality?.('low'); };
  const liter = () => { document.body.classList.add('lite2'); window.scene3d?.pause?.(true); };
  const isTV = /tizen|web0s|webos|smart-?tv|hbbtv|netcast|bravia|aft[a-z]|crkey|googletv|android tv/i.test(navigator.userAgent);
  if (params.has('lite')) { lite(); return; }
  if (isTV) lite();
  const measure = (ms) => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const f = (t) => { n++; if (t - t0 < ms) requestAnimationFrame(f); else res((n * 1000) / (t - t0)); };
    requestAnimationFrame(f);
  });
  setTimeout(async () => {
    const a = await measure(5000);
    if (a >= 50) return;
    lite();
    await sleep(3000);
    const b = await measure(5000);
    if (b < 42) liter();
  }, 5000);
})();

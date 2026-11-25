/* Efectos visuales del clima. Todo lo que se mueve lo hace con transform/opacity (GPU),
   para que siga fluido en las TVs del taller. */
const NS = 'http://www.w3.org/2000/svg';
const RAINY = ['lluvia', 'llovizna', 'tormenta', 'granizo'];
export const isRainy = (k) => RAINY.includes(k);

// Goteras: puntos del techo por donde entra el agua. La del medio cae justo sobre el reloj.
export const LEAKS = [
  { x: 1060, top: 92, floor: 226, onPanel: true, patched: false },
  { x: 330, top: 92, floor: 1036, patched: false },
  { x: 1590, top: 92, floor: 1036, patched: false },
];

let root, rainA, rainB, flashEl, stormTimer = null;

// textura de lluvia: trazos finos inclinados, se repite y se desplaza en loop
function rainTile(n, len, alpha, hail) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, l = len * (0.6 + Math.random() * 0.8);
    if (hail) {
      g.fillStyle = `rgba(235,245,255,${alpha})`;
      g.beginPath(); g.arc(x, y, 2 + Math.random() * 2.5, 0, Math.PI * 2); g.fill();
    } else {
      g.strokeStyle = `rgba(190,215,255,${alpha * (0.5 + Math.random() * 0.5)})`;
      g.lineWidth = 1.2 + Math.random() * 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.18, y + l); g.stroke();
      // repetir en los bordes para que el mosaico no tenga cortes
      if (y + l > 256) { g.beginPath(); g.moveTo(x, y - 256); g.lineTo(x - l * 0.18, y - 256 + l); g.stroke(); }
    }
  }
  return c.toDataURL('image/png');
}

function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; parent.appendChild(e); return e; }

function buildLeak(L, i) {
  const wrap = el('div', 'leak', root);
  wrap.style.left = L.x + 'px';
  wrap.style.setProperty('--top', L.top + 'px');
  wrap.style.setProperty('--fall', (L.floor - L.top) + 'px');
  // mancha de humedad en el techo + parche (cuando lo tapan)
  const stain = el('div', 'leak-stain', wrap); stain.style.top = L.top - 10 + 'px';
  const patch = el('div', 'leak-patch', wrap); patch.style.top = L.top - 14 + 'px';
  for (let k = 0; k < 2; k++) {
    const d = el('div', 'drop', wrap);
    d.style.top = L.top + 'px';
    d.style.animationDelay = (k * 0.95 + i * 0.37).toFixed(2) + 's';
    const s = el('div', 'splash', wrap);
    s.style.top = L.floor - 6 + 'px';
    s.style.animationDelay = (k * 0.95 + i * 0.37).toFixed(2) + 's';
  }
  if (!L.onPanel) {
    // balde en el piso
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 60 54'); svg.setAttribute('class', 'bucket');
    svg.style.top = L.floor - 40 + 'px';
    svg.innerHTML = '<path d="M6 8 L54 8 L48 52 L12 52 Z" fill="#c4372c" stroke="#5a1410" stroke-width="2"/>'
      + '<ellipse cx="30" cy="8" rx="24" ry="5" fill="#2a3f62" stroke="#5a1410" stroke-width="2"/>'
      + '<ellipse cx="30" cy="10" rx="19" ry="3" fill="#6fa8ff" opacity=".7"/>'
      + '<path d="M8 8 Q30 -10 52 8" fill="none" stroke="#9aa3ad" stroke-width="2.5"/>';
    wrap.appendChild(svg);
  }
  L.el = wrap;
}

export function buildWeatherFx(stage, beforeEl) {
  root = document.createElement('div');
  root.id = 'weatherFx';
  root.setAttribute('aria-hidden', 'true');
  stage.insertBefore(root, beforeEl);
  el('div', 'wx-tint', root);
  el('div', 'wx-warm', root);
  const sun = el('div', 'wx-sun', root); el('div', 'wx-sun-core', sun);
  el('div', 'wx-frost', root);
  rainA = el('div', 'wx-rain wx-rain-a', root);
  rainB = el('div', 'wx-rain wx-rain-b', root);
  rainA.style.backgroundImage = `url(${rainTile(80, 60, 0.75)})`;
  rainB.style.backgroundImage = `url(${rainTile(45, 90, 0.9)})`;
  LEAKS.forEach(buildLeak);
  flashEl = el('div', 'wx-flash', root);
}

function lightning() {
  if (!flashEl) return;
  flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on');
}
export { lightning };

export function setWeatherFx(W) {
  if (!root) return;
  const k = W.kind;
  root.className = 'wx-' + k + (isRainy(k) ? ' wx-rainy' : '') + (W.rain >= 1.5 ? ' wx-heavy' : '');
  root.style.setProperty('--rain', Math.min(1, 0.35 + W.rain * 0.35).toFixed(2));
  if (W.hail) rainB.style.backgroundImage = `url(${rainTile(35, 0, 0.95, true)})`;
  // goteras: aparecen con lluvia; al parar la lluvia se secan y se reabren con la próxima
  if (!isRainy(k)) LEAKS.forEach((L) => setPatched(L, false));
  clearInterval(stormTimer); stormTimer = null;
  if (k === 'tormenta' || k === 'granizo') {
    stormTimer = setInterval(() => { if (Math.random() < 0.55) lightning(); }, 7000);
    setTimeout(lightning, 1500);
  }
  window.scene3d?.setWeather?.(isRainy(k) ? 'rain' : (k === 'calor' || k === 'sol' ? 'none' : 'snow'));
}

export function setPatched(L, on) {
  L.patched = on;
  L.el?.classList.toggle('patched', on);
}
export const openLeaks = () => LEAKS.filter((L) => !L.patched);

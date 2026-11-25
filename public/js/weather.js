/* Clima en tiempo real de Asunción (Open-Meteo: gratuito, sin clave, actualiza cada 15 min).
   ?clima=lluvia|llovizna|tormenta|granizo|calor|frio|nublado|sol  y  ?temp=38  fuerzan un clima para probar. */

const API = 'https://api.open-meteo.com/v1/forecast?latitude=-25.2637&longitude=-57.5759'
  + '&current=temperature_2m,apparent_temperature,precipitation,weather_code,is_day&timezone=America%2FAsuncion';
const REFRESH_MS = 10 * 60 * 1000;

// estado actual (lo leen el panel, los personajes y las animaciones)
export const W = { ok: false, kind: 'none', code: null, temp: null, feels: null, isDay: 1, rain: 0, hail: false, label: '', icon: '' };
const listeners = [];
export const onWeather = (fn) => { listeners.push(fn); if (W.ok) fn(W); };

const LABEL = {
  tormenta: ['TORMENTA', '⛈️'], granizo: ['TORMENTA CON GRANIZO', '⛈️'], lluvia: ['LLUVIA', '🌧️'], llovizna: ['LLOVIZNA', '🌦️'],
  calor: ['CALOR', '🥵'], sol: ['SOLEADO', '☀️'], despejado: ['DESPEJADO', '🌙'], nublado: ['NUBLADO', '☁️'],
  parcial: ['PARCIALMENTE NUBLADO', '⛅'], niebla: ['NIEBLA', '🌫️'], frio: ['FRÍO', '🥶'],
};

// códigos WMO → tipo de clima para las animaciones
function classify(code, temp, feels, isDay) {
  const hot = temp >= 32 || feels >= 35;
  if (code === 96 || code === 99) return ['granizo', 1.6, true];
  if (code === 95) return ['tormenta', 1.5, false];
  if ([65, 67, 82].includes(code)) return ['lluvia', 1.5, false];
  if ([61, 63, 66, 80, 81].includes(code)) return ['lluvia', 1, false];
  if (code >= 51 && code <= 57) return ['llovizna', 0.6, false];
  if (code >= 71 && code <= 77) return ['frio', 0, false];
  if (hot) return ['calor', 0, false];
  if (temp <= 14) return ['frio', 0, false];
  if (code === 45 || code === 48) return ['niebla', 0, false];
  if (code === 3) return ['nublado', 0, false];
  if (code === 1 || code === 2) return ['parcial', 0, false];
  return [isDay ? 'sol' : 'despejado', 0, false];
}

const FORCED = {
  lluvia: [63, 24], llovizna: [55, 23], tormenta: [95, 26], granizo: [96, 25], calor: [0, 38], frio: [3, 9],
  nublado: [3, 24], sol: [0, 29], niebla: [45, 18],
};

function apply(code, temp, feels, isDay) {
  const [kind, rain, hail] = classify(code, temp, feels, isDay);
  const changed = kind !== W.kind || Math.round(temp) !== Math.round(W.temp ?? -99);
  Object.assign(W, { ok: true, kind, code, temp, feels, isDay, rain, hail, label: LABEL[kind][0], icon: LABEL[kind][1] });
  if (changed) listeners.forEach((fn) => { try { fn(W); } catch (e) { console.warn('clima', e); } });
}

async function fetchNow() {
  try {
    const r = await fetch(API, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const c = (await r.json()).current;
    apply(c.weather_code, c.temperature_2m, c.apparent_temperature, c.is_day);
  } catch (e) {
    console.warn('No se pudo leer el clima (se reintenta luego):', e.message);
  }
}

export function startWeather(params) {
  const f = params.get('clima');
  if (f && FORCED[f]) {
    const [code, t] = FORCED[f];
    const temp = params.has('temp') ? parseFloat(params.get('temp')) || t : t;
    apply(code, temp, temp + (f === 'calor' ? 3 : 0), 1);
    return;
  }
  fetchNow();
  setInterval(fetchNow, REFRESH_MS);
}

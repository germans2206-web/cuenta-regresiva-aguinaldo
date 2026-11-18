// Personajes del taller. Cada uno es un SVG con partes nombradas y "acciones":
// grupos .A.a-<accion> que solo se muestran mientras el personaje tiene la clase act-<accion>.
// Las animaciones de cada acción viven inline (arrancan de cero cada vez que se muestran)
// y en el CSS propio de cada personaje.
import { gearPath } from './gear.js';

const O = '#1d1612';
const ol = (w = 4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const limb = (d, c, w = 16) =>
  `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + 8}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
// style: origen de transformación (coords del viewBox) + animación + variables
const S = (o, a = '', v = '') =>
  `style="transform-origin:${o.split(' ').map((n) => n + 'px').join(' ')};${a ? 'animation:' + a + ';' : ''}${v}"`;
const eye = (x, y, r = 6) =>
  `<g class="eye" style="transform-origin:${x}px ${y}px"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="${O}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.45}" r="${r * 0.38}" fill="#fff"/></g>`;
const txt = (x, y, t, size, fill) =>
  `<text x="${x}" y="${y}" font-family="Baloo 2, sans-serif" font-weight="800" font-size="${size}" fill="${fill}" stroke="${O}" stroke-width="${(size / 7).toFixed(1)}" paint-order="stroke" text-anchor="middle">${t}</text>`;
const rnd = (a, b) => a + Math.random() * (b - a);
const floatTxt = (x, y, t, size, color, dur = 1.6, delay = 0, dx = 0, dy = -60) =>
  `<g ${S(`${x} ${y}`, `rise ${dur}s ${delay}s linear infinite`, `--x:${dx}px;--y:${dy}px`)}>${txt(x, y, t, size, color)}</g>`;
const popTxt = (x, y, t, size, color, dur = 1, delay = 0) =>
  `<g ${S(`${x} ${y - size / 3}`, `popt ${dur}s ${delay}s ease-out infinite both`)}>${txt(x, y, t, size, color)}</g>`;
const star = (x, y, r, fill = '#ffd23f') => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    p.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}" ${ol(2)}/>`;
};
const dizzy = (x, y, r = 24) =>
  `<g ${S(`${x} ${y}`, 'spin 1.1s linear infinite')}>${star(x + r, y, 8)}${star(x - r, y + 4, 7)}${star(x, y - r * 0.5, 6, '#fff6b0')}</g>`;
const drop = (x, y, delay = 0, dy = 40) =>
  `<path d="M${x} ${y} q7 11 0 15 q-7 -4 0 -15z" fill="#7cd4ff" ${ol(2)} ${S(`${x} ${y}`, `drip 1.1s ${delay}s ease-in infinite both`, `--y:${dy}px`)}/>`;
const sparks = (x, y, n = 12, spread = 70, cols = ['#fff6b0', '#ffd23f', '#ff9a3c', '#bfe8ff']) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rnd(-Math.PI, Math.PI), d = rnd(spread * 0.4, spread);
    s += `<circle cx="${x}" cy="${y}" r="${rnd(1.8, 4).toFixed(1)}" fill="${cols[i % cols.length]}" style="animation:sparkfly ${rnd(0.3, 0.7).toFixed(2)}s ${(-rnd(0, 1)).toFixed(2)}s linear infinite;--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d * 0.7 + 24).toFixed(0)}px"/>`;
  }
  return s;
};
const puff = (x, y, n = 3, color = 'rgba(235,240,245,.9)', dy = -50) => {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${x + rnd(-10, 10)}" cy="${y}" r="${rnd(9, 14).toFixed(0)}" fill="${color}" ${S(`${x} ${y}`, `rise 1.4s ${(i * 0.45).toFixed(2)}s ease-out infinite both`, `--x:${rnd(-20, 20).toFixed(0)}px;--y:${dy}px`)}/>`;
  return s;
};
const hex = (x, y, r, fill = '#c7ced6') => {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; p.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`); }
  return `<polygon points="${p.join(' ')}" fill="${fill}" ${ol(3)}/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#59616d" ${ol(2)}/>`;
};
const wheel = (cx, cy, r, cls) => {
  let sp = '';
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; sp += `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * (r - 6)).toFixed(1)}" y2="${(cy + Math.sin(a) * (r - 6)).toFixed(1)}" stroke="#c7ced6" stroke-width="2.5"/>`; }
  return `<g class="${cls}" ${S(`${cx} ${cy}`)}><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${O}" stroke-width="13"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3a3f47" stroke-width="7"/>${sp}<circle cx="${cx}" cy="${cy}" r="6" fill="#59616d" ${ol(2)}/><circle cx="${cx}" cy="${cy - r}" r="3" fill="#ffd23f"/></g>`;
};

// Herramientas
const WRENCH = (x, y, rot, c = '#c7ced6') =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-5" y="-42" width="10" height="46" rx="4" fill="${c}" ${ol(3)}/><path d="M-13 -40 A13 13 0 1 1 13 -40 L6 -40 L6 -50 L-6 -50 L-6 -40 Z" fill="${c}" ${ol(3)}/></g>`;
const SCREW = (x, y, rot) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-2.5" y="-32" width="5" height="30" fill="#c7ced6" ${ol(2)}/><rect x="-7" y="-4" width="14" height="30" rx="5" fill="#e2283b" ${ol(3)}/></g>`;
const OILCAN = (x, y, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M8 4 L34 -16" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M8 4 L34 -16" stroke="#a07f1c" stroke-width="3" stroke-linecap="round"/><path d="M-16 0 h32 l-4 26 h-24 z" fill="#c9a227" ${ol(3)}/><ellipse cx="0" cy="0" rx="16" ry="5" fill="#a07f1c" ${ol(2)}/></g>`;
const CLIP = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-20" y="-26" width="40" height="52" rx="4" fill="#d7b98e" ${ol(3)}/><rect x="-14" y="-18" width="28" height="38" fill="#fff"/><rect x="-8" y="-31" width="16" height="9" rx="2" fill="#8d939b" ${ol(2)}/><path d="M-6 -10 h16 M-6 0 h16 M-6 10 h16" stroke="#999" stroke-width="2"/></g>`;

/* =====================================================================
   OSO SOLDADOR
   ===================================================================== */
const FUR = '#8a5a3b', MUZ = '#d9b08c', BLUE = '#2f6fb3';
const bear = {
  id: 'bear', name: 'Oso', vb: [300, 270], anchor: [120, 262], scale: 1.0,
  station: { x: 390, y: 1046 }, layer: 'front', enter: 'walkL', gap: 0.7,
  travel: 'walk', roamChance: 0.5, spots: [{ x: 390, y: 1046 }, { x: 620, y: 1046 }, { x: 880, y: 1046 }],
  svg: `
<defs><radialGradient id="bearGlow"><stop offset="0" stop-color="#f2fbff" stop-opacity="1"/><stop offset=".25" stop-color="#9fd8ff" stop-opacity=".7"/><stop offset="1" stop-color="#7fc8ff" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="135" cy="262" rx="100" ry="8" fill="rgba(0,0,0,.35)"/>
<g class="A a-hammer">
  <path d="M196 206 h70 q-8 14 -24 16 v30 h18 v10 h-60 v-10 h18 v-30 q-16 -2 -22 -16z" fill="#4a525e" ${ol()}/>
  <rect x="206" y="196" width="48" height="10" rx="3" fill="#ff7a2f" ${ol(2)} style="animation:flick .6s infinite"/>
</g>
<g class="A a-weld">
  <rect x="232" y="110" width="36" height="152" fill="#8d939b" ${ol()}/>
  <rect x="226" y="104" width="48" height="12" fill="#6d7580" ${ol()}/>
  <rect x="226" y="250" width="48" height="12" fill="#6d7580" ${ol()}/>
  <path d="M232 240 L232 150" stroke="#ff8a2a" stroke-width="6" stroke-dasharray="90" style="stroke-dashoffset:90;animation:seam 4s linear forwards;filter:drop-shadow(0 0 6px #ff8a2a)"/>
</g>
<g class="root" ${S('120 262')}>
  <rect x="86" y="198" width="30" height="52" rx="12" fill="${BLUE}" ${ol()}/>
  <rect x="124" y="198" width="30" height="52" rx="12" fill="${BLUE}" ${ol()}/>
  <rect x="76" y="244" width="44" height="16" rx="7" fill="#3b2b22" ${ol()}/>
  <rect x="120" y="244" width="44" height="16" rx="7" fill="#3b2b22" ${ol()}/>
  <ellipse cx="120" cy="170" rx="58" ry="52" fill="${FUR}" ${ol()}/>
  <path d="M66 182 Q120 168 174 182 L168 214 Q120 234 72 214 Z" fill="${BLUE}" ${ol()}/>
  <rect x="94" y="144" width="52" height="44" rx="8" fill="${BLUE}" ${ol()}/>
  <path d="M98 146 L84 124 M142 146 L156 124" stroke="${BLUE}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="102" cy="152" r="4" fill="#ffd23f" ${ol(2)}/><circle cx="138" cy="152" r="4" fill="#ffd23f" ${ol(2)}/>
  <rect x="104" y="160" width="32" height="14" rx="3" fill="#f2f2f2" ${ol(2)}/>
  <text x="120" y="171" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="10" fill="#333">MANT.</text>
  <g class="d-al">${limb('M68 150 Q50 178 60 206', FUR, 20)}</g>
  <g class="d-ar">${limb('M172 150 Q190 178 180 206', FUR, 20)}</g>
  <g class="head" ${S('120 130')}>
    <circle cx="80" cy="52" r="18" fill="${FUR}" ${ol()}/><circle cx="80" cy="52" r="9" fill="${MUZ}"/>
    <circle cx="160" cy="52" r="18" fill="${FUR}" ${ol()}/><circle cx="160" cy="52" r="9" fill="${MUZ}"/>
    <circle cx="120" cy="88" r="50" fill="${FUR}" ${ol()}/>
    <circle cx="90" cy="104" r="8" fill="#e8866f" opacity=".55"/><circle cx="150" cy="104" r="8" fill="#e8866f" opacity=".55"/>
    <ellipse cx="120" cy="108" rx="25" ry="18" fill="${MUZ}" ${ol()}/>
    <ellipse cx="120" cy="99" rx="10" ry="7" fill="${O}"/>
    <g class="d-mouth"><path d="M110 112 Q120 121 130 112" fill="none" ${ol(3)}/></g>
    <g class="d-eyes">${eye(102, 80)}${eye(138, 80)}</g>
    <g class="A a-terere a-dance"><path d="M95 82 q7 -9 14 0 M131 82 q7 -9 14 0" fill="none" ${ol(4)}/></g>
    <g class="A a-dance"><path d="M106 110 Q120 130 134 110 Z" fill="#7a1f1f" ${ol(3)}/></g>
    <g class="A a-yawn"><ellipse cx="120" cy="116" rx="13" ry="15" fill="#7a1f1f" ${ol(3)}/><path d="M95 80 q7 4 14 0 M131 80 q7 4 14 0" fill="none" ${ol(4)}/></g>
    <g class="A a-sweat">
      <path d="M78 44 Q120 10 162 44 L158 56 Q120 32 82 56 Z" fill="#3e4a3f" ${ol()}/>
      <path d="M96 76 l12 5 l-12 5 M144 76 l-12 5 l12 5" fill="none" ${ol(4)}/>
      <ellipse cx="120" cy="116" rx="7" ry="6" fill="#7a1f1f" ${ol(3)}/>
      ${drop(162, 62, 0)}${drop(80, 70, 0.5)}${drop(150, 44, 0.8)}
    </g>
    <g class="A a-weld">
      <path d="M72 58 Q120 36 168 58 L164 122 Q120 140 76 122 Z" fill="#3e4a3f" ${ol()}/>
      <rect x="92" y="76" width="56" height="18" rx="4" fill="#0e1a12" ${ol(3)}/>
      <rect x="96" y="79" width="48" height="12" rx="3" fill="#7fc8ff" style="animation:flick .1s steps(2) infinite"/>
      <path d="M96 106 h48" stroke="#59616d" stroke-width="5"/>
    </g>
    <g class="A a-watch">
      <path d="M100 86 l0 0" /><circle cx="102" cy="84" r="2.5" fill="#fff"/><circle cx="138" cy="84" r="2.5" fill="#fff"/>
    </g>
  </g>
  <g class="A a-weld">
    ${limb('M68 150 Q96 182 140 176', FUR, 20)}
    ${limb('M172 150 Q198 162 212 176', FUR, 20)}
    ${limb('M204 170 L230 190', '#5d6670', 9)}
    <rect x="226" y="186" width="13" height="9" rx="2" fill="#c9a227" ${ol(3)} transform="rotate(38 232 191)"/>
    <circle cx="238" cy="196" r="54" fill="url(#bearGlow)" style="animation:flick .08s steps(2) infinite"/>
    <ellipse cx="240" cy="196" rx="8" ry="5" fill="#ffffff"/>
    ${sparks(238, 196, 18, 80)}
  </g>
  <g class="A a-sweat">
    <g ${S('68 150', 'osc .45s ease-in-out infinite alternate', '--a:-8deg;--b:10deg')}>${limb('M68 150 Q58 110 104 70', FUR, 20)}</g>
  </g>
  <g class="A a-hammer">
    <g ${S('172 150', 'hammer .6s cubic-bezier(.55,0,.9,.45) infinite')}>
      ${limb('M172 150 Q196 130 206 112', FUR, 20)}
      ${limb('M206 112 L232 95', '#a0622d', 8)}
      <rect x="222" y="77" width="18" height="38" rx="3" fill="#59616d" ${ol()} transform="rotate(-33.7 231 96)"/>
    </g>
    <g ${S('262 160', 'pum .6s infinite')}>${txt(262, 168, '¡PUM!', 24, '#ffd23f')}</g>
    <g style="animation:pum .6s infinite">${sparks(240, 196, 8, 40)}</g>
  </g>
  <g class="A a-terere">
    ${limb('M68 150 Q48 176 58 196', FUR, 20)}
    <rect x="38" y="168" width="28" height="56" rx="9" fill="#1f8a52" ${ol()}/>
    <rect x="41" y="158" width="22" height="13" rx="4" fill="#dfe4ea" ${ol(3)}/>
    <path d="M40 192 h28" stroke="#ffd23f" stroke-width="5"/>
    <g ${S('156 128', 'bob 1.4s ease-in-out infinite', '--y:-4px')}>
      ${limb('M172 150 Q182 136 158 128', FUR, 20)}
      <path d="M151 114 L133 103" stroke="${O}" stroke-width="8" stroke-linecap="round"/>
      <path d="M151 114 L133 103" stroke="#dfe4ea" stroke-width="4" stroke-linecap="round"/>
      <path d="M140 112 h30 l-4 34 q-11 7 -22 0 z" fill="#b5835a" ${ol()}/>
      <rect x="141" y="119" width="28" height="6" fill="#dfe4ea" ${ol(2)}/>
    </g>
    ${floatTxt(186, 110, '✦', 18, '#bfe8ff', 1.4, 0, 10, -40)}${floatTxt(176, 130, '✦', 14, '#fff', 1.4, 0.7, 16, -40)}
  </g>
  <g class="A a-dance">
    <g ${S('68 150', 'osc .5s ease-in-out infinite alternate', '--a:-22deg;--b:14deg')}>${limb('M68 150 Q44 120 52 86', FUR, 20)}</g>
    <g ${S('172 150', 'osc .5s ease-in-out infinite alternate', '--a:22deg;--b:-14deg')}>${limb('M172 150 Q196 120 188 86', FUR, 20)}</g>
    ${floatTxt(40, 70, '♪', 34, '#ffd23f', 1.6, 0, -20, -70)}${floatTxt(200, 60, '♫', 34, '#3dff7a', 1.6, 0.8, 20, -70)}
  </g>
  <g class="A a-yawn">
    <g ${S('68 150', 'osc 1.4s ease-in-out infinite alternate', '--a:-10deg;--b:4deg')}>${limb('M68 150 Q40 110 60 70', FUR, 20)}</g>
    <g ${S('172 150', 'osc 1.4s ease-in-out infinite alternate', '--a:10deg;--b:-4deg')}>${limb('M172 150 Q200 110 180 70', FUR, 20)}</g>
    ${floatTxt(190, 50, 'Z', 26, '#bfe8ff', 2, 0, 20, -50)}${floatTxt(200, 40, 'z', 20, '#bfe8ff', 2, 0.8, 30, -50)}
  </g>
  <g class="A a-watch">
    ${limb('M68 150 Q80 184 118 168', FUR, 20)}
    <circle cx="112" cy="164" r="11" fill="#ffd23f" ${ol(3)}/>
    <path d="M112 164 v-7" ${ol(2)} ${S('112 164', 'spin 1s linear infinite')}/>
    <circle cx="112" cy="164" r="16" fill="none" stroke="#fff6b0" stroke-width="2" style="animation:flick .5s infinite"/>
  </g>
</g>`,
  css: `
.c-bear.act-weld .root{animation:jit .14s infinite}
.c-bear.act-dance .root{animation:sway .5s ease-in-out infinite alternate}
.c-bear.act-watch .head{transform:rotate(7deg) translate(-2px,5px);transition:transform .4s}
.c-bear.act-terere .head{transform:rotate(-4deg);transition:transform .4s}
.c-bear.act-sweat .root{animation:bob 1s ease-in-out infinite;--y:3px}
.c-bear.act-yawn .root{animation:bob 2.8s ease-in-out infinite;--y:-6px}
.c-bear.act-yawn .head{transform:rotate(-8deg);transition:transform .6s}`,
  actions: [
    { id: 'weld', dur: 5, hide: ['d-al', 'd-ar'], fx: 'weld', say: ['Soldando el aguinaldo pa\' que no se escape 🔥', 'Cordón prolijo, como el del aguinaldo', '¡Ojo con las chispas, gente!'] },
    { id: 'sweat', dur: 4, hide: ['d-al', 'd-eyes', 'd-mouth'], say: ['¡Qué calor, che! Y el aguinaldo sin llegar…', 'Uf… soldar en diciembre es deporte extremo'] },
    { id: 'hammer', dur: 4, hide: ['d-ar'], say: ['¡Pum! ¡Pum! Ajustando el reloj a martillazos', 'Si no entra, es que falta martillo'] },
    { id: 'terere', dur: 4.5, hide: ['d-al', 'd-ar', 'd-eyes'], say: ['Pausa técnica: tereré rupa 🧉', 'Con este calor, tereré bien helado'] },
    { id: 'dance', dur: 4, hide: ['d-al', 'd-ar', 'd-eyes', 'd-mouth'], say: ['¡Ya se siente el aguinaldo! 💃', '¡Faltan {d} días! ¡A bailar!'] },
    { id: 'yawn', dur: 4, hide: ['d-al', 'd-ar', 'd-eyes', 'd-mouth'], say: ['Aaaaah… ¿ya es 15? 🥱', 'Cinco minutitos más… 😴'] },
    { id: 'watch', dur: 4, hide: ['d-al'], say: ['Según mi reloj faltan {d} días y {h} horas ⌚', 'Este año el aguinaldo va al colchón: el banco más sólido del país 🛏️', 'Faltan {m} minutos… para la próxima hora'] },
  ],
};

/* =====================================================================
   PÁJARO NEGRO (ANÓ)
   ===================================================================== */
const BK = '#1b1c24';
const birdWingsOut = `<g ${S('92 118', 'osc .25s ease-in-out infinite alternate', '--a:-14deg;--b:10deg')}><path d="M96 118 Q60 70 14 82 Q46 100 40 116 Q66 112 84 132 Z" fill="#262838" ${ol()}/></g>
  <g ${S('112 118', 'osc .25s ease-in-out infinite alternate', '--a:14deg;--b:-10deg')}><path d="M108 116 Q150 66 196 74 Q166 96 172 112 Q142 112 120 132 Z" fill="#262838" ${ol()}/></g>`;
const bird = {
  id: 'bird', name: 'Anó', vb: [220, 200], anchor: [100, 188], scale: 0.9,
  station: { x: 1250, y: 0 }, perchOnLights: true, layer: 'front', enter: 'fly', gap: 0.4,
  travel: 'fly', roamChance: 0.85,
  spots: [
    { lights: 1250 }, { lights: 640 }, { lights: 1640 }, { lights: 330 },
    { x: 300, y: 202 }, { x: 1770, y: 268 }, { x: 1830, y: 608 }, { x: 1180, y: 238 },
    { x: 760, y: 1046 }, { x: 1120, y: 880 }, { x: 170, y: 790 },
  ],
  svg: `
<g class="A a-tie">
  ${limb('M0 178 Q100 168 220 178', '#e74c3c', 6)}${limb('M0 185 Q100 177 220 185', '#3498db', 6)}${limb('M0 192 Q100 186 220 192', '#2ecc71', 6)}
  <rect x="150" y="166" width="10" height="34" rx="3" fill="#f2f2f2" ${ol(2)} ${S('155 183', 'zip 1.2s ease-in-out infinite alternate')}/>
</g>
<g class="A a-peck">
  <rect x="172" y="146" width="34" height="30" rx="5" fill="#ffc21a" ${ol()}/>
  <circle cx="183" cy="161" r="4" fill="${O}"/><circle cx="196" cy="161" r="4" fill="${O}"/>
</g>
<g class="root" ${S('100 188')}>
  <g class="A a-pull"><path d="M198 100 Q260 150 340 240" fill="none" stroke="${O}" stroke-width="14" stroke-linecap="round"/><path d="M198 100 Q260 150 340 240" fill="none" stroke="#e67e22" stroke-width="8" stroke-linecap="round"/><path d="M198 100 Q260 150 340 240" fill="none" stroke="#ffe066" stroke-width="3" class="cable-flow"/></g>
  <g class="tail" ${S('72 140', 'osc 1.8s ease-in-out infinite alternate', '--a:-6deg;--b:8deg')}><path d="M72 134 Q34 152 8 196 Q34 180 46 184 Q46 168 80 150 Z" fill="${BK}" ${ol()}/></g>
  <g class="legs"><path d="M92 158 L90 186 M110 158 L112 186" ${ol(5)} fill="none"/><path d="M82 188 h16 M104 188 h16" ${ol(5)}/></g>
  <ellipse cx="100" cy="132" rx="46" ry="34" fill="${BK}" ${ol()}/>
  <path d="M72 120 Q100 104 130 116" fill="none" stroke="#4a5480" stroke-width="6" stroke-linecap="round"/>
  <g class="d-wing wing" ${S('92 118')}><path d="M74 120 Q112 106 134 132 Q108 152 70 140 Z" fill="#262838" ${ol()}/><path d="M84 132 q14 4 28 0" fill="none" stroke="#4a5480" stroke-width="3"/></g>
  <g class="A a-balance">${birdWingsOut}</g>
  <g class="head" ${S('128 118')}>
    <circle cx="138" cy="92" r="28" fill="${BK}" ${ol()}/>
    <path d="M120 70 q2 -14 12 -8 q0 -14 14 -6" fill="none" ${ol(4)}/>
    <g class="jaw" ${S('162 99')}><path d="M162 98 Q184 96 198 101 Q180 110 160 105 Z" fill="#2c2c33" ${ol()}/></g>
    <path d="M160 82 Q188 64 202 98 Q184 94 162 98 Z" fill="#2c2c33" ${ol()}/>
    <path d="M168 76 Q186 72 196 90" fill="none" stroke="#55555f" stroke-width="3"/>
    <circle cx="146" cy="86" r="10" fill="#fff" ${ol(3)}/>
    <g class="d-eyes">${eye(148, 86, 4.5)}</g>
    <g class="A a-peck"><path d="M140 80 l12 12 M152 80 l-12 12" ${ol(3)}/></g>
    <g class="A a-sing a-balance"><path d="M138 70 l14 4" ${ol(3)}/></g>
  </g>
  <g class="A a-peck">
    <path d="M196 132 l-14 18 h10 l-8 18 l20 -24 h-10 l8 -12z" fill="#fff36b" ${ol(3)} style="animation:zapflash .6s steps(1) infinite"/>
    <path d="M60 110 l-12 -6 M64 100 l-8 -10 M140 150 l8 8 M120 160 l2 12" ${ol(3)} style="animation:zapflash .6s steps(1) infinite"/>
  </g>
  <g class="A a-sing">${floatTxt(200, 70, '♪', 30, '#ffd23f', 1.5, 0, 20, -60)}${floatTxt(206, 90, '♫', 28, '#ff7bd5', 1.5, 0.5, 30, -60)}${floatTxt(196, 80, '♪', 24, '#4fc3ff', 1.5, 1, 10, -70)}</g>
  <g class="A a-fly"><g ${S('100 60')}>${floatTxt(30, 160, '·', 30, '#fff', 0.6, 0, -10, 40)}</g></g>
</g>`,
  css: `
.c-bird.act-pull .root{animation:lean .5s ease-in-out infinite alternate}
.c-bird.act-pull .wing,.c-bird.flying .wing{animation:flap .14s ease-in-out infinite alternate}
.c-bird.act-fly .root{animation:hover 1.1s ease-in-out infinite}
.c-bird.act-fly .wing{animation:flap .12s ease-in-out infinite alternate}
.c-bird.act-fly .legs{transform:translateY(-6px)}
.c-bird.act-tie .head{animation:peck .6s ease-in-out infinite}
.c-bird.act-peck .head{animation:peck .6s ease-in infinite}
.c-bird.act-peck .root{animation:jit .1s infinite}
.c-bird.act-sing .jaw{animation:osc .22s ease-in-out infinite alternate;--a:0deg;--b:24deg}
.c-bird.act-sing .root{animation:bob .44s ease-in-out infinite;--y:-5px}
.c-bird.act-balance .root{animation:osc .6s ease-in-out infinite alternate;--a:-13deg;--b:13deg}`,
  actions: [
    { id: 'pull', dur: 4.5, say: ['¡Estirando cables! Este va directo al aguinaldo ⚡', 'Anó anó… ¡qué duro está este cable!'] },
    { id: 'fly', dur: 4, say: ['¡Inspección aérea! Todo en orden por acá arriba', 'Desde acá se ve el 15 de diciembre…'] },
    { id: 'tie', dur: 4.5, say: ['Cables ordenados = técnico feliz', 'Precinto por acá, precinto por allá'] },
    { id: 'peck', dur: 3.5, hide: ['d-eyes'], say: ['¡Ay! Este sí tenía corriente 😵', '¡¿Quién no cortó la energía?!'] },
    { id: 'sing', dur: 4, say: ['🎵 Navidad, aguinaldo, navidad… 🎵', '🎵 Faltan {d} díaaas 🎵'] },
    { id: 'balance', dur: 4, hide: ['d-wing'], say: ['¡Ojo con la tensión de esta línea!', 'Equilibrio total, como mi presupuesto'] },
  ],
};

/* =====================================================================
   PULPO MULTITAREA
   ===================================================================== */
const PU = '#9b59d0', PL = '#c08ae6';
const tIdleL = `<g ${S('104 160', 'osc 1.6s ease-in-out infinite alternate', '--a:-10deg;--b:12deg')}>${limb('M104 160 Q62 172 50 142 Q44 120 64 116', PU, 18)}</g>
  <g ${S('110 172', 'osc 1.9s ease-in-out infinite alternate', '--a:8deg;--b:-10deg')}>${limb('M110 172 Q72 204 40 198', PU, 18)}</g>`;
const tIdleR = `<g ${S('196 160', 'osc 1.7s ease-in-out infinite alternate', '--a:10deg;--b:-12deg')}>${limb('M196 160 Q238 172 250 142 Q256 120 236 116', PU, 18)}</g>
  <g ${S('190 172', 'osc 2s ease-in-out infinite alternate', '--a:-8deg;--b:10deg')}>${limb('M190 172 Q228 204 260 198', PU, 18)}</g>`;
const valveSpokes = [0, 45, 90, 135].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${263 - Math.cos(r) * 32}" y1="${150 - Math.sin(r) * 32}" x2="${263 + Math.cos(r) * 32}" y2="${150 + Math.sin(r) * 32}" stroke="${O}" stroke-width="6"/>`; }).join('');
const octo = {
  id: 'octo', name: 'Pulpo', vb: [300, 300], anchor: [150, 250], scale: 0.95,
  station: { x: 170, y: 838 }, layer: 'front', enter: 'rise', gap: 0.6,
  svg: `
<g class="root" ${S('150 250')}>
  <g ${S('120 176', 'osc 1.4s ease-in-out infinite alternate', '--a:-6deg;--b:6deg')}>${limb('M120 176 Q106 224 126 262', PU, 20)}</g>
  <g ${S('140 178', 'osc 1.7s ease-in-out infinite alternate', '--a:5deg;--b:-5deg')}>${limb('M140 178 Q140 230 130 272', PU, 20)}</g>
  <g ${S('160 178', 'osc 1.5s ease-in-out infinite alternate', '--a:-5deg;--b:5deg')}>${limb('M160 178 Q162 230 172 272', PU, 20)}</g>
  <g ${S('180 176', 'osc 1.8s ease-in-out infinite alternate', '--a:6deg;--b:-6deg')}>${limb('M180 176 Q194 224 176 262', PU, 20)}</g>
  <g class="d-tl">${tIdleL}${tIdleR}</g>
  <g class="A a-multi">
    <g ${S('104 160', 'osc .5s ease-in-out infinite alternate', '--a:-12deg;--b:10deg')}>${limb('M104 160 Q64 150 58 108', PU, 18)}${WRENCH(58, 104, -20)}</g>
    <g ${S('110 172', 'osc .7s ease-in-out infinite alternate', '--a:10deg;--b:-14deg')}>${limb('M110 172 Q72 196 42 182', PU, 18)}${SCREW(38, 178, -70)}</g>
    <g ${S('196 160', 'osc .6s ease-in-out infinite alternate', '--a:12deg;--b:-8deg')}>${limb('M196 160 Q236 150 242 112', PU, 18)}${OILCAN(242, 98)}</g>
    <g ${S('190 172', 'osc .8s ease-in-out infinite alternate', '--a:-10deg;--b:12deg')}>${limb('M190 172 Q228 196 258 182', PU, 18)}${CLIP(262, 168)}</g>
  </g>
  <g class="A a-valve">
    <rect x="256" y="150" width="14" height="130" fill="#8d939b" ${ol()}/>
    <g ${S('263 150', 'spin 2.2s linear infinite')}>
      <circle cx="263" cy="150" r="34" fill="none" stroke="${O}" stroke-width="16"/>${valveSpokes}
      <circle cx="263" cy="150" r="34" fill="none" stroke="#e2283b" stroke-width="9"/>
      <circle cx="263" cy="150" r="8" fill="#59616d" ${ol(3)}/>
    </g>
    ${tIdleL}
    ${limb('M196 160 Q232 124 254 120', PU, 18)}${limb('M190 172 Q226 192 258 180', PU, 18)}
  </g>
  <g class="A a-check">
    ${tIdleL}
    ${limb('M196 160 Q236 168 240 158', PU, 18)}
    ${CLIP(250, 150, 1.5)}
    <g ${S('236 190', 'jit .18s infinite')}>${limb('M190 172 Q212 204 232 190', PU, 18)}<g transform="translate(234 186) rotate(-35)"><rect x="-3.5" y="-28" width="7" height="28" fill="#ffd23f" ${ol(2)}/><path d="M-3.5 0 l3.5 8 l3.5 -8z" fill="#333"/></g></g>
  </g>
  <g class="A a-juggle">
    <g ${S('104 160', 'osc .35s ease-in-out infinite alternate', '--a:-10deg;--b:14deg')}>${limb('M104 160 Q70 130 84 94', PU, 18)}</g>
    <g ${S('196 160', 'osc .35s ease-in-out infinite alternate', '--a:10deg;--b:-14deg')}>${limb('M196 160 Q230 130 216 94', PU, 18)}</g>
    <g ${S('110 172', 'osc 1.9s ease-in-out infinite alternate', '--a:8deg;--b:-10deg')}>${limb('M110 172 Q72 204 40 198', PU, 18)}</g>
    <g ${S('190 172', 'osc 2s ease-in-out infinite alternate', '--a:-8deg;--b:10deg')}>${limb('M190 172 Q228 204 260 198', PU, 18)}</g>
  </g>
  <g class="A a-coffee">
    ${tIdleL}
    <g ${S('196 160', 'osc .9s ease-in-out infinite alternate', '--a:6deg;--b:-6deg')}>${limb('M196 160 Q236 150 240 120', PU, 18)}<rect x="226" y="96" width="26" height="26" rx="4" fill="#fff" ${ol(3)}/>${floatTxt(239, 90, '~', 20, '#fff', 1.4, 0, 0, -30)}</g>
    <g ${S('190 172', 'osc 1.1s ease-in-out infinite alternate', '--a:-6deg;--b:6deg')}>${limb('M190 172 Q228 196 256 180', PU, 18)}<rect x="250" y="160" width="24" height="24" rx="4" fill="#e2283b" ${ol(3)}/></g>
  </g>
  <g class="A a-wave">
    <g ${S('104 160', 'osc .3s ease-in-out infinite alternate', '--a:-25deg;--b:15deg')}>${limb('M104 160 Q66 130 60 80', PU, 18)}</g>
    <g ${S('196 160', 'osc .3s ease-in-out infinite alternate', '--a:25deg;--b:-15deg')}>${limb('M196 160 Q234 130 240 80', PU, 18)}</g>
    <g ${S('110 172', 'osc .4s ease-in-out infinite alternate', '--a:14deg;--b:-14deg')}>${limb('M110 172 Q72 204 40 198', PU, 18)}</g>
    <g ${S('190 172', 'osc .4s ease-in-out infinite alternate', '--a:-14deg;--b:14deg')}>${limb('M190 172 Q228 204 260 198', PU, 18)}</g>
  </g>
  <path d="M88 142 Q78 38 150 32 Q222 38 212 142 Q208 180 150 184 Q92 180 88 142 Z" fill="${PU}" ${ol()}/>
  <circle cx="118" cy="104" r="6" fill="${PL}"/><circle cx="186" cy="100" r="5" fill="${PL}"/><circle cx="200" cy="126" r="4" fill="${PL}"/><circle cx="104" cy="130" r="4" fill="${PL}"/>
  <path d="M110 48 Q130 38 150 40" stroke="rgba(255,255,255,.35)" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M90 78 Q150 60 210 78" stroke="#2d2d33" stroke-width="10" fill="none"/>
  <circle cx="126" cy="70" r="15" fill="#7fd3ff" ${ol()}/><circle cx="174" cy="70" r="15" fill="#7fd3ff" ${ol()}/>
  <path d="M119 63 l6 -3 M167 63 l6 -3" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <g class="d-eyes" ${S('150 124')}>
    <ellipse cx="128" cy="124" rx="15" ry="17" fill="#fff" ${ol(3)}/><ellipse cx="172" cy="124" rx="15" ry="17" fill="#fff" ${ol(3)}/>
    ${eye(131, 127, 6)}${eye(175, 127, 6)}
  </g>
  <circle cx="108" cy="150" r="7" fill="#f08bb5" opacity=".6"/><circle cx="192" cy="150" r="7" fill="#f08bb5" opacity=".6"/>
  <g class="d-mouth"><path d="M140 154 Q150 164 160 154" fill="none" ${ol(3)}/></g>
  <g class="A a-wave"><path d="M114 128 q14 -14 28 0 M158 128 q14 -14 28 0" fill="none" ${ol(5)}/><path d="M136 152 Q150 172 164 152 Z" fill="#7a1f4f" ${ol(3)}/></g>
  <g class="A a-valve"><path d="M110 100 L140 110 M190 100 L160 110" ${ol(5)}/>${drop(214, 66, 0)}<path d="M138 158 h24" ${ol(3)}/></g>
  <g class="A a-ink">
    <circle cx="150" cy="156" r="7" fill="#5a1f3f" ${ol(3)}/>
    ${[0, 0.4, 0.8, 1.2].map((d, i) => `<circle cx="${110 + i * 26}" cy="200" r="22" fill="#241a33" ${S(`${110 + i * 26} 200`, `inkpuff 1.8s ${d}s ease-out infinite both`)}/>`).join('')}
    ${floatTxt(222, 60, '!', 40, '#ffd23f', 1, 0, 0, -20)}
  </g>
  <g class="A a-check">
    <path d="M238 128 l5 6 l9 -12" fill="none" stroke="#1fae5b" stroke-width="5" stroke-linecap="round" style="animation:ckin .2s .6s both"/>
    <path d="M238 146 l5 6 l9 -12" fill="none" stroke="#1fae5b" stroke-width="5" stroke-linecap="round" style="animation:ckin .2s 1.8s both"/>
    <path d="M238 164 l5 6 l9 -12" fill="none" stroke="#e2283b" stroke-width="5" stroke-linecap="round" style="animation:ckin .2s 3s both"/>
  </g>
  <g class="A a-juggle">
    ${[0, -0.5, -1].map((d) => `<g ${S('150 20', `spin 1.5s ${d}s linear infinite`)}>${hex(150, -40, 13)}</g>`).join('')}
  </g>
</g>`,
  css: `
.c-octo.act-ink .d-tl>g{animation-duration:.16s!important}
.c-octo.act-ink .d-eyes{transform:scale(1.25)}
.c-octo.act-ink .root{animation:jumpy .9s ease-out infinite}
.c-octo.act-ink .d-mouth{display:none}
.c-octo.act-multi .root{animation:bob .7s ease-in-out infinite;--y:-5px}
.c-octo.act-wave .root{animation:osc .6s ease-in-out infinite alternate;--a:-4deg;--b:4deg}`,
  actions: [
    { id: 'multi', dur: 5, hide: ['d-tl'], say: ['8 brazos y aún así no alcanzan para tantas OT', 'Llave, destornillador, aceite y planilla… ¡multitarea!'] },
    { id: 'valve', dur: 4.5, hide: ['d-tl', 'd-mouth'], say: ['Cerrando la válvula de gastos hasta el 15 💸', 'Esta válvula está más dura que el bolsillo a fin de mes'] },
    { id: 'ink', dur: 3.5, say: ['¡Uy! Me asustó el compresor 😳', '¡Perdón! Tinta en todo el taller…'] },
    { id: 'check', dur: 4.5, hide: ['d-tl'], say: ['Preventivo ✔ Lubricación ✔ Aguinaldo ⏳', 'Checklist: aguinaldo ⏳ banco abierto ✔ …¿seguro? 🤔', 'Checklist del día: sobrevivir hasta el 15'] },
    { id: 'juggle', dur: 4, hide: ['d-tl'], say: ['Malabares con los repuestos que faltan en el almacén', 'Tuercas M12, M10 y M8… ¡al aire!'] },
    { id: 'coffee', dur: 3.8, hide: ['d-tl'], say: ['Un café por brazo… y me faltan seis ☕', 'Cafeína para aguantar hasta el 15 🐙'] },
    { id: 'wave', dur: 3.5, hide: ['d-tl', 'd-eyes', 'd-mouth'], say: ['¡Mba\'éichapa, gente del taller! 👋', '¡Hola! ¿Ya cobraron? Yo tampoco'] },
  ],
};

/* =====================================================================
   CONEJO EN BICICLETA
   ===================================================================== */
const WH = '#f4efe6', PK = '#f4a6b8';
const rabbit = {
  id: 'rabbit', name: 'Conejo', vb: [320, 280], anchor: [160, 272], scale: 0.95,
  station: { x: 1010, y: 1046 }, layer: 'front', enter: 'ride', gap: 0.5,
  travel: 'ride', roamChance: 0.6, spots: [{ x: 1010, y: 1046 }, { x: 640, y: 1046 }, { x: 1300, y: 1046 }, { x: 440, y: 1046 }],
  svg: `
<ellipse cx="164" cy="270" rx="120" ry="8" fill="rgba(0,0,0,.35)"/>
<g class="A a-power">
  <path d="M62 272 L90 230 L118 272" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
  <path d="M62 272 L90 230 L118 272" fill="none" stroke="#8d939b" stroke-width="4" stroke-linecap="round"/>
  <rect x="22" y="206" width="30" height="38" rx="5" fill="#59616d" ${ol(3)}/><circle cx="50" cy="226" r="7" fill="#c9a227" ${ol(2)}/>
  <text x="37" y="230" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="11" fill="#ffd23f">⚡</text>
  ${[0, 0.25, 0.5].map((d, i) => `<path d="M${30 + i * 8} 196 l-10 16 h9 l-7 16 l18 -22 h-9 l7 -10z" fill="#fff36b" ${ol(2)} ${S(`${30 + i * 8} 200`, `rise .75s ${d}s linear infinite both`, `--x:${10 - i * 10}px;--y:-170px`)}/>`).join('')}
</g>
<g class="root" ${S('90 268')}>
  <g class="A a-ride"><path d="M6 180 h44 M-6 204 h52 M10 228 h36" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8" style="animation:speed .25s linear infinite"/></g>
  ${wheel(90, 226, 42, 'rw')}
  ${wheel(238, 226, 42, 'fw')}
  <path d="M90 226 L150 226 L126 160 Z M126 160 L216 156 L150 226 M216 156 L238 226" fill="none" stroke="${O}" stroke-width="12" stroke-linejoin="round"/>
  <path d="M90 226 L150 226 L126 160 Z M126 160 L216 156 L150 226 M216 156 L238 226" fill="none" stroke="#e2283b" stroke-width="6" stroke-linejoin="round"/>
  <path d="M214 156 L208 136 Q220 126 234 134" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
  <path d="M214 156 L208 136 Q220 126 234 134" fill="none" stroke="#c7ced6" stroke-width="4" stroke-linecap="round"/>
  <path d="M108 154 Q126 144 144 154 Q126 162 108 154 Z" fill="#222" ${ol(3)}/>
  <g class="leg2" ${S('130 150', 'osc .6s ease-in-out infinite alternate', '--a:12deg;--b:-8deg')}>${limb('M130 150 Q170 190 150 244', '#e3dccf', 13)}<ellipse cx="152" cy="246" rx="13" ry="6" fill="#e3dccf" ${ol(3)}/></g>
  <g class="crank" ${S('150 226', 'spin 1.2s linear infinite')}><circle cx="150" cy="226" r="13" fill="#59616d" ${ol(3)}/><path d="M150 204 L150 248" stroke="${O}" stroke-width="7"/><rect x="139" y="199" width="22" height="7" rx="2" fill="#333"/><rect x="139" y="245" width="22" height="7" rx="2" fill="#333"/></g>
  <ellipse cx="138" cy="122" rx="30" ry="38" fill="${WH}" ${ol()}/>
  <path d="M110 104 Q138 94 166 104 L168 140 Q138 152 108 140 Z" fill="#ff7a1a" ${ol(3)}/>
  <path d="M110 124 h56" stroke="#e8f0f2" stroke-width="5"/>
  <circle cx="106" cy="142" r="11" fill="#fff" ${ol(3)}/>
  <g class="leg1" ${S('130 150', 'osc .6s ease-in-out infinite alternate', '--a:-8deg;--b:12deg')}>${limb('M130 150 Q178 160 152 206', WH, 13)}<ellipse cx="154" cy="208" rx="13" ry="6" fill="${WH}" ${ol(3)}/></g>
  <g class="d-arm">${limb('M150 106 Q186 114 214 138', WH, 12)}</g>
  <g class="A a-flat a-tired">${limb('M150 106 Q186 118 212 140', WH, 12)}</g>
  <g class="A a-carrot">
    <g ${S('150 106', 'osc .4s ease-in-out infinite alternate', '--a:-4deg;--b:4deg')}>${limb('M150 106 Q190 112 196 96', WH, 12)}
      <path d="M196 98 L232 84 L200 108 Z" fill="#ff8a1c" ${ol(3)}/><path d="M232 84 l10 -10 M232 84 l12 0 M232 84 l6 -12" stroke="#2fbf4f" stroke-width="5" stroke-linecap="round"/></g>
  </g>
  <g class="A a-bell">
    <g ${S('222 130', 'osc .07s linear infinite alternate', '--a:-14deg;--b:14deg')}><path d="M214 132 q8 -18 16 0 z" fill="#ffd23f" ${ol(2)}/></g>
    ${limb('M150 106 Q186 108 216 124', WH, 12)}
    ${popTxt(250, 96, '¡RIIING!', 26, '#ffd23f', 0.8)}
    <path d="M238 118 l12 -6 M240 130 l14 0 M236 108 l8 -10" ${ol(3)} style="animation:flick .16s infinite"/>
  </g>
  <g class="head" ${S('160 100')}>
    <g class="ears" ${S('160 56', 'osc 1.2s ease-in-out infinite alternate', '--a:-4deg;--b:4deg')}>
      <ellipse cx="148" cy="24" rx="11" ry="34" fill="${WH}" ${ol()} transform="rotate(-18 148 24)"/><ellipse cx="148" cy="26" rx="5" ry="24" fill="${PK}" transform="rotate(-18 148 26)"/>
      <ellipse cx="172" cy="20" rx="11" ry="34" fill="${WH}" ${ol()} transform="rotate(8 172 20)"/><ellipse cx="172" cy="22" rx="5" ry="24" fill="${PK}" transform="rotate(8 172 22)"/>
    </g>
    <circle cx="166" cy="78" r="30" fill="${WH}" ${ol()}/>
    <path d="M136 68 Q138 40 166 38 Q194 40 196 66 Z" fill="#2b9cf0" ${ol(3)}/>
    <path d="M152 44 v20 M168 40 v24 M182 46 v18" stroke="#1b6fb0" stroke-width="3"/>
    <circle cx="186" cy="90" r="6" fill="${PK}" opacity=".7"/>
    <g class="d-eyes" ${S('178 76')}>${eye(170, 76, 5)}${eye(186, 75, 4.5)}</g>
    <ellipse cx="195" cy="85" rx="5" ry="4" fill="${PK}" ${ol(2)}/>
    <g class="d-mouth"><path d="M184 93 q5 5 10 0" fill="none" ${ol(2.5)}/><rect x="186" y="94" width="7" height="7" rx="1" fill="#fff" ${ol(2)}/></g>
    <g class="A a-wheelie a-ride"><path d="M180 92 Q188 104 198 92 Z" fill="#7a1f1f" ${ol(2.5)}/></g>
    <g class="A a-tired"><path d="M190 94 q4 14 -3 16 q-6 -2 -3 -16z" fill="#e8667a" ${ol(2)}/><rect x="162" y="66" width="30" height="8" fill="${WH}"/><path d="M162 74 h30" ${ol(2)}/>${drop(146, 60, 0)}${drop(200, 56, 0.6)}</g>
    <g class="A a-power"><path d="M162 64 l14 5 M194 64 l-10 5" ${ol(3)}/>${drop(144, 66, 0.2)}</g>
    <g class="A a-flat"><path d="M180 94 q6 -6 12 0" fill="none" ${ol(3)}/>${drop(140, 70, 0)}</g>
  </g>
  <g class="A a-flat">${popTxt(290, 210, 'psssss…', 22, '#bfe8ff', 1.2)}${puff(278, 236, 3, 'rgba(220,235,245,.8)', -30)}</g>
</g>`,
  css: `
.c-rabbit .rw,.c-rabbit .fw{animation:spin 1.2s linear infinite}
.c-rabbit.act-ride .rw,.c-rabbit.act-ride .fw,.c-rabbit.riding .rw,.c-rabbit.riding .fw{animation-duration:.32s}
.c-rabbit.act-ride .crank,.c-rabbit.riding .crank{animation-duration:.45s}
.c-rabbit.act-ride .leg1,.c-rabbit.act-ride .leg2,.c-rabbit.riding .leg1,.c-rabbit.riding .leg2{animation-duration:.225s}
.c-rabbit.act-ride .ears,.c-rabbit.riding .ears{--a:-32deg!important;--b:-24deg!important;animation-duration:.18s!important}
.c-rabbit.act-ride .root,.c-rabbit.riding .root{animation:bob .2s ease-in-out infinite;--y:-3px}
.c-rabbit.act-power .rw{animation-duration:.14s}
.c-rabbit.act-power .fw{animation-play-state:paused}
.c-rabbit.act-power .crank{animation-duration:.22s}
.c-rabbit.act-power .leg1,.c-rabbit.act-power .leg2{animation-duration:.11s}
.c-rabbit.act-power .root{animation:jit .12s infinite}
.c-rabbit.act-wheelie .root{animation:wheelie 2.4s ease-in-out infinite}
.c-rabbit.act-flat .fw{animation:none;transform-origin:238px 268px;transform:scale(1.08,.8)}
.c-rabbit.act-flat .rw,.c-rabbit.act-flat .crank,.c-rabbit.act-flat .leg1,.c-rabbit.act-flat .leg2,.c-rabbit.act-bell .fw,.c-rabbit.act-bell .rw,.c-rabbit.act-bell .crank,.c-rabbit.act-bell .leg1,.c-rabbit.act-bell .leg2{animation-play-state:paused}
.c-rabbit.act-flat .d-eyes{transform:scale(1.3)}
.c-rabbit.act-tired .leg1,.c-rabbit.act-tired .leg2{animation-duration:1.4s}
.c-rabbit.act-tired .crank,.c-rabbit.act-tired .rw,.c-rabbit.act-tired .fw{animation-duration:2.8s}
.c-rabbit.act-tired .ears{--a:-48deg!important;--b:-40deg!important}
.c-rabbit.act-tired .head{transform:rotate(8deg) translateY(4px);transition:transform .5s}
.c-rabbit.act-carrot .head{animation:bob .25s ease-in-out infinite;--y:2px}`,
  actions: [
    { id: 'ride', dur: 4, hide: ['d-mouth'], say: ['¡Voy a cobrar el aguinaldo en bici, pa\' ahorrar nafta!', '¡Paso, paso, que vengo con apuro! 🚲'] },
    { id: 'power', dur: 5, say: ['¡Pedaleando para darle energía al reloj! ⚡', 'Si dejo de pedalear se para el reloj… ¡no puedo parar!'] },
    { id: 'wheelie', dur: 4, hide: ['d-mouth'], say: ['¡Mirá, una willy! 😎', 'Nivel de felicidad: aguinaldo cerca'] },
    { id: 'bell', dur: 3, hide: ['d-arm'], say: ['¡Riiing! ¡Riiing! ¡Faltan {d} días!', '¡Atención taller, vengo a avisar!'] },
    { id: 'flat', dur: 4, hide: ['d-arm', 'd-mouth'], say: ['Pinchadura… ¡justo hoy! 😩', '¿Alguien tiene un parche? Pago con el aguinaldo'] },
    { id: 'carrot', dur: 3.8, hide: ['d-arm'], say: ['Zanahoria energética antes de pedalear 🥕', 'Ñam ñam… combustible de conejo'] },
    { id: 'tired', dur: 4.5, hide: ['d-arm', 'd-mouth'], say: ['Faltan {d} días… y {h} horas de pedaleo 😮‍💨', 'Uf… ¿quién puso esta subida?'] },
  ],
};

/* =====================================================================
   PATO CON CASCO AMARILLO + ESCALERA
   ===================================================================== */
let rungs = '';
for (let i = 1; i <= 9; i++) {
  const t = i / 10.2, y = 412 - 316 * t;
  rungs += `<line x1="${(160 + 54 * t).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(204 + 54 * t).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><line x1="${(160 + 54 * t).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(204 + 54 * t).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#c7ced6" stroke-width="4" stroke-linecap="round"/>`;
}
const bulb = (lit) => `<path d="M256 62 h14 v10 h-14 z" fill="#8d939b" ${ol(2)}/><circle cx="263" cy="84" r="14" fill="${lit ? '#fff6b0' : '#8f959c'}" ${ol(3)}/>${lit ? '' : '<path d="M257 80 l5 6 l5 -8" fill="none" stroke="#555" stroke-width="2"/>'}`;
const duck = {
  id: 'duck', name: 'Pato', vb: [300, 420], anchor: [100, 412], scale: 1.0,
  station: { x: 1600, y: 1046 }, layer: 'front', enter: 'walkR', gap: 1.1,
  svg: `
<ellipse cx="140" cy="412" rx="110" ry="8" fill="rgba(0,0,0,.35)"/>
<path d="M300 40 L300 70 M300 56 L270 56 L270 64" fill="none" ${ol(6)}/>
<g class="d-bulb"><circle cx="263" cy="84" r="34" fill="rgba(255,230,140,.35)" class="lamp-glow"/>${bulb(true)}</g>
<g class="A a-change">
  <g style="animation:fadeOut40 4.6s both"><g ${S('263 76', 'twist .22s linear infinite alternate')}>${bulb(false)}</g></g>
  <g style="animation:newbulb 4.6s ease-out both">${bulb(true)}<circle cx="263" cy="84" r="40" fill="rgba(255,230,140,.45)"/><path d="M263 40 v-14 M300 84 h14 M226 84 h-14 M290 58 l10 -10 M236 58 l-10 -10" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/></g>
</g>
<g class="ladall" ${S('182 412')}>
  <g class="ladder" ${S('182 412')}>
    ${rungs}
    ${limb('M160 412 L214 96', '#ffc21a', 8)}${limb('M204 412 L258 96', '#ffc21a', 8)}
    <rect x="152" y="404" width="20" height="10" rx="3" fill="#333"/><rect x="196" y="404" width="20" height="10" rx="3" fill="#333"/>
  </g>
  <g class="duck" ${S('100 400')}>
    <g class="feet"><path d="M90 386 v18 M112 386 v18" stroke="${O}" stroke-width="9"/><path d="M90 386 v18 M112 386 v18" stroke="#ff9f1c" stroke-width="5"/><path d="M78 404 l-10 8 h30 z M110 404 l-6 8 h30 z" fill="#ff9f1c" ${ol(3)}/></g>
    <path d="M48 338 Q46 296 100 294 Q154 296 154 342 Q152 394 100 394 Q58 392 48 362 L28 346 L50 340 Z" fill="#fff" ${ol()}/>
    <path d="M70 310 Q100 300 132 310 L138 354 Q100 366 64 354 Z" fill="#ff7a1a" ${ol(3)}/>
    <path d="M66 334 h72" stroke="#e8f0f2" stroke-width="5"/>
    <g class="d-wing" ${S('92 322')}><path d="M64 332 Q98 316 126 336 Q100 362 68 352 Z" fill="#eef0f2" ${ol()}/></g>
    <g class="A a-ladder"><g ${S('110 330', 'osc .4s ease-in-out infinite alternate', '--a:-6deg;--b:6deg')}><path d="M100 330 Q140 316 168 330 Q144 346 104 346 Z" fill="#eef0f2" ${ol()}/></g></g>
    <g class="A a-change"><path d="M110 322 Q150 280 160 248 Q172 262 128 340 Z" fill="#eef0f2" ${ol()}/></g>
    <g class="A a-wobble a-quack">
      <g ${S('80 320', 'osc .12s ease-in-out infinite alternate', '--a:-25deg;--b:10deg')}><path d="M84 322 Q50 290 34 250 Q70 270 96 330 Z" fill="#eef0f2" ${ol()}/></g>
      <g ${S('124 320', 'osc .12s ease-in-out infinite alternate', '--a:25deg;--b:-10deg')}><path d="M120 322 Q154 290 170 250 Q134 270 108 330 Z" fill="#eef0f2" ${ol()}/></g>
    </g>
    <g class="A a-coffee"><path d="M70 332 Q100 318 128 330 Q104 352 72 350 Z" fill="#eef0f2" ${ol()}/><rect x="122" y="314" width="28" height="30" rx="5" fill="#fff" ${ol(3)}/><path d="M150 320 q10 2 10 10 q0 8 -10 8" fill="none" ${ol(3)}/><rect x="125" y="318" width="22" height="6" fill="#7a4a2a"/>${floatTxt(136, 304, '~', 22, '#fff', 1.4, 0, 0, -40)}${floatTxt(130, 300, '~', 18, '#fff', 1.4, 0.7, 6, -40)}</g>
    <g class="A a-measure">
      <path d="M136 370 Q150 400 170 412 M146 368 Q170 392 196 410" fill="none" stroke="${O}" stroke-width="6"/>
      <path d="M136 370 Q150 400 170 412" fill="none" stroke="#e2283b" stroke-width="3"/><path d="M146 368 Q170 392 196 410" fill="none" stroke="#333" stroke-width="3"/>
      <rect x="118" y="318" width="38" height="54" rx="6" fill="#ffc21a" ${ol(3)}/>
      <rect x="123" y="324" width="28" height="16" rx="2" fill="#1b2a1f"/>
      <circle cx="137" cy="356" r="8" fill="#333" ${ol(2)}/>
      ${['220V', '219V', '221V'].map((v, i) => `<text x="137" y="337" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="11" fill="#7dff9a" style="animation:seq3 1.8s ${-i * 0.6}s steps(1) infinite">${v}</text>`).join('')}
      <path d="M70 332 Q96 316 124 330 Q100 352 72 350 Z" fill="#eef0f2" ${ol()}/>
    </g>
    <g class="head" ${S('110 292')}>
      <circle cx="112" cy="264" r="32" fill="#fff" ${ol()}/>
      <circle cx="102" cy="280" r="6" fill="#ffb3c1" opacity=".7"/>
      <g class="jaw" ${S('138 286')}><path d="M136 284 Q160 286 170 286 Q156 298 136 292 Z" fill="#f08a00" ${ol(3)}/></g>
      <path d="M138 272 Q170 264 176 278 Q160 288 136 284 Z" fill="#ff9f1c" ${ol(3)}/>
      <g class="d-eyes" ${S('126 266')}>${eye(126, 266, 5)}</g>
      <path d="M78 252 Q80 216 112 214 Q144 216 146 252 Z" fill="#ffc21a" ${ol()}/>
      <path d="M112 216 v32" stroke="#e0a000" stroke-width="6"/>
      <rect x="70" y="246" width="86" height="11" rx="5" fill="#ffb000" ${ol(3)}/>
      <g class="A a-wobble"><circle cx="126" cy="268" r="8" fill="#fff" ${ol(2)}/><circle cx="127" cy="268" r="3" fill="${O}"/></g>
    </g>
    <g class="A a-wobble a-quack">${popTxt(70, 210, '¡CUAC!', 30, '#ffd23f', 0.9)}</g>
    <g class="A a-wobble">${drop(160, 250, 0)}${drop(70, 256, 0.5)}</g>
  </g>
</g>`,
  css: `
.c-duck .duck{transition:transform .9s ease-in-out}
.c-duck.act-ladder .ladder{animation:ladup 3.4s ease-in-out both}
.c-duck.act-ladder .duck{transform:rotate(6deg) translateX(6px)}
.c-duck.act-climb .duck{animation:climb 4.6s ease-in-out both}
.c-duck.act-climb .feet{animation:jit .2s infinite}
.c-duck.act-change .duck,.c-duck.act-wobble .duck{transform:translate(110px,-232px)}
.c-duck.act-wobble .ladall{animation:osc .4s ease-in-out infinite alternate;--a:-5deg;--b:5deg}
.c-duck.act-wobble .d-eyes{opacity:0}
.c-duck.act-quack .duck{animation:hop .55s ease-in-out infinite}
.c-duck.act-quack .jaw,.c-duck.act-wobble .jaw{animation:osc .15s ease-in-out infinite alternate;--a:0deg;--b:22deg}
.c-duck.act-measure .head{transform:rotate(10deg);transition:transform .4s}`,
  actions: [
    { id: 'ladder', dur: 4, hide: ['d-wing'], say: ['Primero la escalera… ¡seguridad ante todo! ⛑️', 'Escalera bien apoyada, OT bien hecha'] },
    { id: 'climb', dur: 4.6, say: ['Subiendo… no miren para abajo', 'Tres puntos de apoyo, como dice el manual'] },
    { id: 'change', dur: 4.6, hide: ['d-wing', 'd-bulb'], say: ['Cambio de lámpara: ¡OT cerrada! ✅', '¡Hágase la luz… y el aguinaldo!'] },
    { id: 'wobble', dur: 3.6, hide: ['d-wing'], say: ['¡CUAC! ¡Alguien que me sostenga la escalera!', '¡¿Quién movió la escalera?!'] },
    { id: 'measure', dur: 4, hide: ['d-wing'], say: ['220 V… todo bien. Lo que no llega es el aguinaldo', 'Tensión correcta. Mi tensión, no tanto'] },
    { id: 'coffee', dur: 3.8, hide: ['d-wing'], say: ['Cocido quemado para arrancar ☕', 'Primero el cocido, después la OT'] },
    { id: 'quack', dur: 3.5, hide: ['d-wing'], say: ['¡Cuac cuac! ¡Ya casi cobramos!', '¡Faltan {d} días, cuac!'] },
  ],
};

/* =====================================================================
   PERRO PINSCHER RABIOSO
   ===================================================================== */
const BLK = '#1f1f24', TAN = '#c8743a';
const pinscher = {
  id: 'pinscher', name: 'Pinscher', vb: [300, 240], anchor: [100, 232], scale: 1.0,
  station: { x: 1290, y: 1046 }, layer: 'front', enter: 'drop', gap: 0.5,
  travel: 'walk', walkSpeed: 0.75, roamChance: 0.55, tripChance: 0.2,
  spots: [{ x: 1290, y: 1046 }, { x: 1000, y: 1046 }, { x: 720, y: 1046 }, { x: 1560, y: 1046 }, { x: 480, y: 1046 }],
  svg: `
<ellipse cx="104" cy="232" rx="54" ry="7" fill="rgba(0,0,0,.35)"/>
<g class="A a-win"><g ${S('222 156', 'boltpop 4.6s ease-out both')}>${hex(222, 156, 22)}</g></g>
<g class="root" ${S('100 232')}>
  <g ${S('68 172', 'osc .1s linear infinite alternate', '--a:-18deg;--b:18deg')}><path d="M68 172 L54 148" stroke="${O}" stroke-width="12" stroke-linecap="round"/><path d="M68 172 L54 148" stroke="${BLK}" stroke-width="6" stroke-linecap="round"/></g>
  <g class="hind">${limb('M80 196 L76 228', TAN, 8)}${limb('M92 200 L92 230', TAN, 8)}</g>
  ${limb('M112 200 L114 230', TAN, 8)}${limb('M126 196 L130 228', TAN, 8)}
  <ellipse cx="102" cy="182" rx="38" ry="26" fill="${BLK}" ${ol()}/>
  <ellipse cx="128" cy="190" rx="12" ry="14" fill="${TAN}"/>
  <path d="M116 160 Q132 172 148 160" stroke="#e2283b" stroke-width="7" fill="none"/><circle cx="132" cy="170" r="4" fill="#ffd23f" ${ol(1.5)}/>
  <g class="head" ${S('124 156')}>
    <g class="ears"><path d="M108 104 L92 46 L130 92 Z" fill="${BLK}" ${ol()}/><path d="M106 96 L98 62 L120 90 Z" fill="${TAN}"/>
    <path d="M140 94 L164 42 L160 104 Z" fill="${BLK}" ${ol()}/><path d="M144 92 L160 58 L156 98 Z" fill="${TAN}"/></g>
    <circle cx="128" cy="122" r="30" fill="${BLK}" ${ol()}/>
    <ellipse cx="152" cy="134" rx="17" ry="12" fill="${TAN}" ${ol(3)}/>
    <ellipse cx="166" cy="129" rx="6" ry="5" fill="${O}"/>
    <path d="M108 98 L126 106 M152 96 L136 106" stroke="${TAN}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="120" cy="116" r="12" fill="#fff" ${ol(3)}/><circle cx="142" cy="114" r="12" fill="#fff" ${ol(3)}/>
    <path d="M110 112 l4 2 M152 110 l-4 3" stroke="#e2283b" stroke-width="1.5"/>
    <g class="pupils" style="animation:jit .25s infinite"><circle cx="123" cy="117" r="4.5" fill="${O}"/><circle cx="145" cy="115" r="4.5" fill="${O}"/></g>
    <g class="d-mouth"><path d="M140 146 Q150 141 160 146" fill="none" ${ol(3)}/><path d="M144 145 l2 4 l2 -4 M152 145 l2 4 l2 -4" fill="#fff" stroke="${O}" stroke-width="1"/></g>
    <g class="A a-struggle a-kick a-tremble a-throw"><circle cx="128" cy="122" r="29" fill="#ff2a2a" opacity=".3" style="animation:flick .4s infinite"/></g>
    <g class="A a-dizzy"><path d="M114 110 l12 12 M126 110 l-12 12 M136 108 l12 12 M148 108 l-12 12" ${ol(3)}/></g>
    <g class="A a-bark a-snap"><path d="M140 140 Q156 164 170 140 Z" fill="#8a1c1c" ${ol(3)}/><path d="M146 141 l3 6 l3 -6 M160 141 l3 6 l3 -6" fill="#fff"/></g>
    <g class="A a-struggle"><path d="M140 145 h20" ${ol(4)}/></g>
    <g class="A a-tremble">${drop(100, 100, 0, 30)}${drop(160, 96, 0.5, 30)}${drop(108, 130, 0.3, 30)}</g>
    <g class="A a-win"><path d="M140 140 Q154 156 166 140 Z" fill="#8a1c1c" ${ol(3)}/></g>
    <g class="A a-beg"><circle cx="121" cy="117" r="8" fill="${O}"/><circle cx="143" cy="115" r="8" fill="${O}"/><circle cx="124" cy="113" r="3" fill="#fff"/><circle cx="146" cy="111" r="3" fill="#fff"/><circle cx="117" cy="120" r="1.6" fill="#fff"/><circle cx="139" cy="118" r="1.6" fill="#fff"/><path d="M144 146 q6 6 12 0" fill="none" ${ol(2.5)}/><path d="M149 149 q2 8 -3 9 q-5 -2 -1 -9z" fill="#e8667a" ${ol(1.5)}/></g>
    <g class="A a-growl"><path d="M138 142 Q152 152 166 142 L162 150 Q152 156 142 150 Z" fill="#fff" ${ol(2.5)}/><path d="M144 143 v6 M150 145 v6 M156 145 v6 M162 143 v5" stroke="${O}" stroke-width="1.5"/><path d="M108 100 L128 110 M154 98 L136 110" ${ol(5)}/></g>
    <g class="A a-fetch"><path d="M136 146 h40" stroke="${O}" stroke-width="13" stroke-linecap="round"/><path d="M136 146 h40" stroke="#f2ead8" stroke-width="7" stroke-linecap="round"/><circle cx="134" cy="141" r="6" fill="#f2ead8" ${ol(2)}/><circle cx="134" cy="151" r="6" fill="#f2ead8" ${ol(2)}/><circle cx="178" cy="141" r="6" fill="#f2ead8" ${ol(2)}/><circle cx="178" cy="151" r="6" fill="#f2ead8" ${ol(2)}/></g>
    <g class="A a-eat"><circle cx="160" cy="146" r="13" fill="none" stroke="${O}" stroke-width="12"/><circle cx="160" cy="146" r="13" fill="none" stroke="#e0a84a" stroke-width="7"/><path d="M110 104 q7 -8 14 0 M134 102 q7 -8 14 0" fill="none" ${ol(4)}/></g>
    <g class="A a-sniff">${floatTxt(176, 150, 'sniff', 14, '#fff', 1.2, 0, 20, -30)}${floatTxt(180, 160, 'sniff', 12, '#fff', 1.2, 0.6, 30, -30)}</g>
  </g>
  <g class="A a-growl"><path d="M76 160 l4 -12 l6 10 l4 -12 l6 10 l4 -12 l6 10 l4 -12 l6 10" fill="none" ${ol(4)}/>${popTxt(196, 70, 'Grrr…', 24, '#ff5a3c', 1.2)}</g>
  <g class="A a-dig">
    <ellipse cx="60" cy="230" rx="34" ry="10" fill="#6b4a2b" ${ol(3)}/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<circle cx="80" cy="222" r="${rnd(4, 7).toFixed(1)}" fill="#7a5532" style="animation:sparkfly ${rnd(0.4, 0.7).toFixed(2)}s ${(-rnd(0, 0.7)).toFixed(2)}s ease-out infinite;--x:${(-rnd(40, 110)).toFixed(0)}px;--y:${(-rnd(30, 90)).toFixed(0)}px"/>`).join('')}
  </g>
  <g class="A a-chase"><path d="M20 150 q20 -30 50 -40 M180 210 q-20 20 -60 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>${popTxt(160, 40, '¡TE AGARRO, COLA!', 18, '#ffd23f', 1.4)}</g>
  <g class="A a-beg">${floatTxt(176, 80, '❤', 22, '#ff5a8a', 1.4, 0, 10, -50)}</g>
  <g class="A a-eat">${floatTxt(176, 80, '❤', 22, '#ff5a8a', 1.4, 0, 10, -50)}${floatTxt(150, 70, '❤', 18, '#ff5a8a', 1.4, 0.6, -10, -50)}</g>
  <g class="A a-struggle">
    <g class="wrench-held" ${S('222 156', 'osc .16s ease-in-out infinite alternate', '--a:-4deg;--b:4deg')}>${limb('M158 144 L200 154', '#c7ced6', 9)}<circle cx="222" cy="156" r="27" fill="none" stroke="${O}" stroke-width="15"/><circle cx="222" cy="156" r="27" fill="none" stroke="#c7ced6" stroke-width="8"/></g>
    ${puff(118, 84, 3, 'rgba(240,240,240,.9)', -60)}
  </g>
  <g class="A a-bark">
    ${popTxt(196, 70, '¡GUAU!', 30, '#ff5a3c', 0.5)}${popTxt(60, 60, '¡GUAU!', 24, '#ff5a3c', 0.5, 0.25)}
    <g ${S('100 74', 'popt .5s .1s infinite both')}><path d="M90 64 l8 8 M110 64 l-8 8 M90 84 l8 -8 M110 84 l-8 -8" stroke="#e2283b" stroke-width="5" stroke-linecap="round"/></g>
  </g>
  <g class="A a-dizzy">${dizzy(130, 78, 28)}</g>
  <g class="A a-snap">${popTxt(200, 60, '¡GRRR!', 28, '#ff5a3c', 0.8)}</g>
  <g class="A a-kick">
    <g style="animation:late 1.6s infinite">${txt(150, 50, '¡AY!', 30, '#ffd23f')}${dizzy(128, 80, 26)}</g>
  </g>
  <g class="A a-throw">
    <g ${S('170 120', 'throwW 2.3s ease-in infinite')}>${WRENCH(170, 140, 30)}</g>
    <g style="animation:late2 2.3s infinite">${dizzy(128, 82, 26)}${txt(70, 70, '¡BONK!', 22, '#ffd23f')}</g>
  </g>
  <g class="A a-win">
    <g style="animation:late 4.6s both">${txt(150, 40, '¡SALIÓ!', 34, '#3dff7a')}</g>
    ${sparks(220, 150, 10, 60, ['#ffd23f', '#3dff7a', '#fff'])}
  </g>
</g>`,
  css: `
.c-pinscher .root{animation:jit .3s infinite}
.c-pinscher.act-struggle .root{animation:jit .06s infinite}
.c-pinscher.act-struggle .head{transform:rotate(-6deg)}
.c-pinscher.act-bark .root{animation:bob .25s ease-in-out infinite;--y:-12px}
.c-pinscher.act-bark .ears{animation:jit .1s infinite}
.c-pinscher.act-kick .root{animation:kick 1.6s ease-in-out infinite}
.c-pinscher.act-kick .block{animation:blockshake 1.6s ease-out infinite}
.c-pinscher.act-throw .root{animation:jit .2s infinite}
.c-pinscher.act-tremble .root{animation:jit .05s infinite}
.c-pinscher.act-tremble .pupils{animation:look 1.2s ease-in-out infinite}
.c-pinscher.act-win .root{animation:fallback 4.6s ease-in-out both}
.c-pinscher.act-snap .root{animation:snapjump .8s ease-in-out infinite}
.c-pinscher.act-dizzy .root{animation:none;transform:rotate(-26deg) translate(-14px,10px);transition:transform .3s}
.c-pinscher.act-dizzy .pupils{display:none}
.c-pinscher.no-wrench .wrench-held{display:none}
.c-pinscher.act-chase .root{animation:spin .55s linear infinite;transform-origin:102px 190px!important}
.c-pinscher.act-dig .root{animation:jit .08s infinite}
.c-pinscher.act-dig .head{transform:rotate(22deg) translateY(10px)}
.c-pinscher.act-growl .root{animation:jit .14s infinite}
.c-pinscher.act-growl .head{transform:rotate(10deg) translate(6px,6px)}
.c-pinscher.act-sniff .head{animation:sniffhead .5s ease-in-out infinite}
.c-pinscher.act-sniff .root{animation:osc 1.2s ease-in-out infinite alternate;--a:-2deg;--b:4deg}
.c-pinscher.act-beg .root{transform:rotate(-14deg) translate(-6px,-14px);transition:transform .3s}
.c-pinscher.act-beg .pupils,.c-pinscher.act-eat .pupils{display:none}
.c-pinscher.act-fetch .root{animation:bob .25s ease-in-out infinite;--y:-6px}
.c-pinscher.act-eat .head{animation:bob .3s ease-in-out infinite;--y:2px}
.c-pinscher.walking.act-bark .root,.c-pinscher.walking.act-fetch .root{animation:waddle .14s ease-in-out infinite alternate!important}`,
  actions: [
    { id: 'struggle', dur: 4.5, home: true, hide: ['d-mouth'], say: ['¡¿POR QUÉ NO SALE ESTE BULÓN?! 😤', 'Grrr… ¡este M24 me tiene podrido!'] },
    { id: 'bark', dur: 3.2, hide: ['d-mouth'], say: ['¡GUAU! ¡Que alguien traiga el aflojatodo!', '¡GUAU GUAU! ¡Así no se puede trabajar!'] },
    { id: 'kick', dur: 3.2, home: true, say: ['¡Ay, ay, ay! Mi patita…', 'La patada técnica no funcionó'] },
    { id: 'throw', dur: 2.3, say: ['¡Me rindo! …no, no me rindo', 'Llave al aire… ¡y me volvió!'] },
    { id: 'tremble', dur: 3.5, say: ['Faltan {d} días y este bulón sigue trabado… 😰', 'Estoy tranquilo. TRANQUILO. 😬'] },
    { id: 'snap', scene: true, hide: ['d-mouth'] },
    { id: 'dizzy', scene: true, hide: ['d-mouth'] },
    { id: 'chase', dur: 3.2, say: ['¡Esta cola me persigue hace años! 🌀', '¡Quieta, cola! ¡QUIETA!'] },
    { id: 'dig', dur: 3.6, say: ['¡Seguro el bulón de repuesto está enterrado acá! 🕳️', 'Excavando… el aguinaldo tiene que estar por algún lado'] },
    { id: 'growl', dur: 3.2, hide: ['d-mouth'], say: ['Grrr… nadie toca mi bulón M24', 'Te estoy vigilando… grrr 👀'] },
    { id: 'sniff', dur: 3.6, say: ['Sniff sniff… huele a aguinaldo 👃', 'Sniff… acá pasó el ratón, seguro'] },
    { id: 'beg', dur: 3.4, hide: ['d-mouth'], say: ['¿Una galletita? ¿Aunque sea una? 🥺', 'Prometo portarme bien hasta el 15 🥺'] },
    { id: 'fetch', scene: true, hide: ['d-mouth'] },
    { id: 'eat', scene: true, hide: ['d-mouth'] },
    { id: 'win', dur: 4.6, home: true, hide: ['d-mouth'], say: ['¡SALIÓ! ¡Soy el mejor técnico del taller! 🏆', '¡Bulón vencido! Ahora sí, que venga el aguinaldo'] },
  ],
};

/* =====================================================================
   CHANCHITO NAVIDEÑO
   ===================================================================== */
const PIG = '#f7a8bd', PIGD = '#e47b98', GRN = '#1f8a52';
const pig = {
  id: 'pig', name: 'Chanchito', vb: [280, 240], anchor: [110, 232], scale: 0.95,
  station: { x: 690, y: 1046 }, layer: 'front', enter: 'walkL', gap: 0.6,
  travel: 'walk', roamChance: 0.5, spots: [{ x: 690, y: 1046 }, { x: 480, y: 1046 }, { x: 960, y: 1046 }, { x: 1180, y: 1046 }],
  svg: `
<ellipse cx="116" cy="232" rx="70" ry="7" fill="rgba(0,0,0,.35)"/>
<g class="A a-oil"><g ${S('232 200', 'spin 3s linear infinite')}><path d="${gearPath(232, 200, 30, 10, 12)}" fill="#c9a227" fill-rule="evenodd" ${ol(3)}/></g></g>
<g class="A a-slip"><ellipse cx="150" cy="232" rx="60" ry="8" fill="#1b1410" opacity=".85"/><ellipse cx="140" cy="230" rx="20" ry="3" fill="rgba(255,255,255,.25)"/></g>
<g class="A a-gauge">
  <rect x="210" y="130" width="10" height="102" fill="#8d939b" ${ol(3)}/>
  <circle cx="215" cy="122" r="30" fill="#59616d" ${ol(4)}/><circle cx="215" cy="122" r="24" fill="#f3f1ea" ${ol(2)}/>
  <path d="M200 112 A18 18 0 0 1 230 112" fill="none" stroke="#e2283b" stroke-width="4"/>
  <g ${S('215 122', 'gaugejump 1.2s steps(4) infinite')}><path d="M213 122 L215 102 L217 122 Z" fill="#e2283b" ${ol(1.5)}/></g>
  <circle cx="215" cy="122" r="4" fill="${O}"/>
</g>
<g class="root" ${S('110 232')}>
  <g ${S('64 176', 'osc .9s ease-in-out infinite alternate', '--a:-12deg;--b:12deg')}><path d="M66 176 q-16 -4 -14 -16 q4 -10 12 -2 q4 7 -6 9" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M66 176 q-16 -4 -14 -16 q4 -10 12 -2 q4 7 -6 9" fill="none" stroke="${PIGD}" stroke-width="4" stroke-linecap="round"/></g>
  <rect x="84" y="204" width="22" height="26" rx="7" fill="${PIG}" ${ol()}/><rect x="116" y="204" width="22" height="26" rx="7" fill="${PIG}" ${ol()}/>
  <rect x="84" y="222" width="22" height="9" rx="3" fill="#5b3a3a"/><rect x="116" y="222" width="22" height="9" rx="3" fill="#5b3a3a"/>
  <ellipse cx="110" cy="178" rx="48" ry="40" fill="${PIG}" ${ol()}/>
  <path d="M64 186 Q110 172 156 186 L150 214 Q110 228 70 214 Z" fill="${GRN}" ${ol()}/>
  <rect x="90" y="158" width="40" height="34" rx="6" fill="${GRN}" ${ol()}/>
  <circle cx="96" cy="164" r="3.5" fill="#ffd23f"/><circle cx="124" cy="164" r="3.5" fill="#ffd23f"/>
  <g class="d-al">${limb('M68 168 Q56 186 62 204', PIG, 16)}</g>
  <g class="d-ar">${limb('M152 168 Q164 186 158 204', PIG, 16)}</g>
  <g class="head" ${S('112 146')}>
    <path d="M80 86 L70 54 L102 72 Z" fill="${PIG}" ${ol()}/><path d="M144 72 L156 42 L124 62 Z" fill="${PIG}" ${ol()}/>
    <circle cx="112" cy="108" r="40" fill="${PIG}" ${ol()}/>
    <circle cx="84" cy="124" r="8" fill="#ff7f9f" opacity=".6"/><circle cx="142" cy="124" r="8" fill="#ff7f9f" opacity=".6"/>
    <g class="snout" ${S('116 120')}><ellipse cx="116" cy="120" rx="18" ry="13" fill="${PIGD}" ${ol(3)}/><ellipse cx="110" cy="120" rx="3" ry="4.5" fill="${O}"/><ellipse cx="122" cy="120" rx="3" ry="4.5" fill="${O}"/></g>
    <g class="d-eyes">${eye(94, 100, 5.5)}${eye(134, 100, 5.5)}</g>
    <g class="d-mouth"><path d="M106 138 Q116 145 126 138" fill="none" ${ol(3)}/></g>
    <g class="A a-chipa a-dream"><path d="M87 102 q7 -8 14 0 M127 102 q7 -8 14 0" fill="none" ${ol(4)}/></g>
    <g class="A a-slip"><path d="M88 96 l12 8 M100 96 l-12 8 M128 96 l12 8 M140 96 l-12 8" ${ol(3)}/><ellipse cx="116" cy="140" rx="6" ry="7" fill="#7a1f1f" ${ol(2)}/></g>
    <g class="A a-angry"><circle cx="112" cy="108" r="39" fill="#ff2a2a" opacity=".3" style="animation:flick .4s infinite"/><path d="M84 90 L104 98 M140 90 L120 98" ${ol(5)}/><ellipse cx="116" cy="141" rx="9" ry="7" fill="#7a1f1f" ${ol(2)}/></g>
    <path d="M76 84 Q92 36 130 42 Q166 52 178 98 Q160 70 148 84 Z" fill="#e2283b" ${ol()}/>
    <rect x="68" y="76" width="88" height="16" rx="8" fill="#fff" ${ol(3)}/>
    <circle cx="178" cy="100" r="10" fill="#fff" ${ol(3)}/>
  </g>
  <g class="A a-oil">
    ${limb('M152 168 Q176 156 184 146', PIG, 16)}
    ${OILCAN(188, 138, 22)}
    ${[0, 0.35, 0.7].map((d) => `<ellipse cx="220" cy="130" rx="3" ry="5" fill="#3b2a12" ${S('220 130', `drip .9s ${d}s ease-in infinite both`, '--y:46px')}/>`).join('')}
  </g>
  <g class="A a-slip">${dizzy(112, 52, 30)}</g>
  <g class="A a-chipa">
    ${limb('M68 168 Q76 150 98 144', PIG, 16)}${limb('M152 168 Q148 150 130 144', PIG, 16)}
    <g class="chipa-ring" ${S('114 146', 'bob .3s ease-in-out infinite', '--y:-3px')}><circle cx="114" cy="146" r="18" fill="none" stroke="${O}" stroke-width="16"/><circle cx="114" cy="146" r="18" fill="none" stroke="#e0a84a" stroke-width="10"/><circle cx="104" cy="138" r="2" fill="#a86b1f"/><circle cx="124" cy="152" r="2" fill="#a86b1f"/><circle cx="120" cy="134" r="2" fill="#a86b1f"/></g>
    ${[0, 0.4, 0.8].map((d, i) => `<circle cx="${106 + i * 8}" cy="164" r="2.5" fill="#e0a84a" ${S('110 164', `drip .8s ${d}s ease-in infinite both`, '--y:60px')}/>`).join('')}
  </g>
  <g class="A a-gauge">
    <g ${S('152 168', 'osc .3s ease-in-out infinite alternate', '--a:-8deg;--b:8deg')}>${limb('M152 168 Q176 150 192 132', PIG, 16)}</g>
    ${popTxt(250, 70, '¡TOC TOC!', 18, '#ffd23f', 0.6)}
  </g>
  <g class="A a-angry">${puff(112, 50, 3, 'rgba(240,240,240,.9)', -50)}</g>
  <g class="A a-phone">
    ${limb('M152 168 Q166 140 146 110', PIG, 16)}<rect x="136" y="88" width="18" height="34" rx="4" fill="#222831" ${ol(3)}/><rect x="139" y="92" width="12" height="18" fill="#4fc3ff"/>
    ${floatTxt(186, 70, '?', 26, '#ffd23f', 1.4, 0, 10, -40)}
  </g>
  <g class="A a-sweep">
    <g ${S('112 170', 'osc .45s ease-in-out infinite alternate', '--a:-16deg;--b:14deg')}>
      <path d="M86 148 L176 222" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M86 148 L176 222" stroke="#a0622d" stroke-width="5" stroke-linecap="round"/>
      <path d="M166 216 l30 -8 l12 22 l-34 6 z" fill="#d9b25a" ${ol(3)}/>
      ${limb('M68 168 Q80 156 98 158', PIG, 16)}${limb('M152 168 Q148 186 140 196', PIG, 16)}
    </g>
    ${puff(200, 226, 3, 'rgba(200,180,150,.8)', -40)}
  </g>
  <g class="A a-dream">
    <circle cx="160" cy="60" r="5" fill="#fff" ${ol(2)}/><circle cx="174" cy="40" r="8" fill="#fff" ${ol(2)}/>
    <g ${S('220 0', 'bob 1.6s ease-in-out infinite', '--y:-6px')}>
      <path d="M170 0 q-6 -26 22 -28 q8 -18 34 -10 q22 -12 36 8 q24 4 16 26 q8 22 -20 24 q-14 14 -34 4 q-22 10 -36 -4 q-24 -2 -18 -20z" fill="#fff" ${ol(3)}/>
      <g ${S('216 6', 'osc .8s ease-in-out infinite alternate', '--a:-8deg;--b:8deg')}><rect x="190" y="-10" width="52" height="26" rx="4" fill="#8fd19e" ${ol(2.5)}/><text x="216" y="9" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="16" fill="#0f3d1f">₲₲₲</text></g>
    </g>
    ${floatTxt(150, 40, '♥', 20, '#ff5a8a', 1.6, 0, -10, -50)}
  </g>
</g>`,
  css: `
.c-pig.act-slip .root{animation:slip 4.4s ease-in-out both}
.c-pig.act-chipa .snout{animation:bob .25s ease-in-out infinite;--y:2px}
.c-pig.act-gauge .head{transform:rotate(6deg) translateX(4px);transition:transform .4s}
.c-pig.act-sweep .root{animation:osc .9s ease-in-out infinite alternate;--a:-3deg;--b:3deg}
.c-pig.act-dream .head{animation:osc 1.6s ease-in-out infinite alternate;--a:-5deg;--b:5deg}
.c-pig.act-angry .root{animation:jit .08s infinite}
.c-pig.act-phone .head{transform:rotate(10deg);transition:transform .4s}
.c-pig.no-chipa .chipa-ring{display:none}`,
  actions: [
    { id: 'oil', dur: 4.5, hide: ['d-ar'], say: ['Un poquito de aceite y el reloj anda como seda', 'Lubricación al día ✔'] },
    { id: 'slip', dur: 4.4, hide: ['d-eyes', 'd-mouth'], say: ['¡Ups! Ese aceite no era para el piso 🙈', '¡Señalicen el piso mojado, che!'] },
    { id: 'chipa', dur: 4, hide: ['d-al', 'd-ar', 'd-eyes'], say: ['Chipa calentita… el aguinaldo puede esperar. ¡NO, no puede!', 'Merienda reglamentaria: chipa y cocido'] },
    { id: 'gauge', dur: 4, hide: ['d-ar'], say: ['Presión OK. Mi presión no: falta el aguinaldo', 'Toc toc… ¿se trabó la aguja o es mi vista?'] },
    { id: 'sweep', dur: 4, hide: ['d-al', 'd-ar'], say: ['5S: orden y limpieza, che 🧹', 'Taller limpio, taller feliz'] },
    { id: 'phone', dur: 4, hide: ['d-ar'], say: ['¿Hola, banco? ¿Ya depositaron el aguinaldo? 📞', '¿Ueno? ¿Ueno? …¿hay alguien ahí? 📞😅', 'Tres semanas con música de espera… 🎵', 'Señorita, solo quiero saber si mi plata sigue ahí 🥲'] },
    { id: 'angry', scene: true, hide: ['d-mouth'] },
    { id: 'dream', dur: 4.5, hide: ['d-eyes'], say: ['Soñando con los guaraníes del aguinaldo 💸', 'Con el aguinaldo me compro… ¡una chipa más grande!', 'Este año lo guardo en la alcancía. Soy chanchito, ¿o no? 🐷'] },
  ],
};

/* =====================================================================
   RATÓN CON CASCO AMARILLO
   ===================================================================== */
const MG = '#9aa3ad', MGL = '#c7ced6', MP = '#f4a6b8';
const mouse = {
  id: 'mouse', name: 'Ratón', vb: [260, 200], anchor: [90, 192], scale: 0.9,
  station: { x: 566, y: 242 }, layer: 'back', enter: 'peekup', gap: 0.4,
  travel: 'ground', roamChance: 0.8, tripChance: 0.45,
  spots: [
    { x: 566, y: 242, level: 'top' }, { x: 1320, y: 238, level: 'top' }, { x: 960, y: 238, level: 'top' },
    { x: 540, y: 1046, level: 'floor' }, { x: 850, y: 1046, level: 'floor' }, { x: 1150, y: 1046, level: 'floor' }, { x: 1460, y: 1046, level: 'floor' },
  ],
  svg: `
<defs><linearGradient id="mbeam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></linearGradient></defs>
<g class="A a-run"><path d="M150 194 L176 128 L202 194" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round"/>
<path d="M150 194 L176 128 L202 194" fill="none" stroke="#8d939b" stroke-width="4" stroke-linecap="round"/>
<g class="mwheel" ${S('176 128')}>
  <path d="${gearPath(176, 128, 58, 18, 12, 0, 0.82)}" fill="#c9a227" fill-rule="evenodd" ${ol(3)}/>
  ${[0, 60, 120].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${(176 - Math.cos(r) * 47).toFixed(1)}" y1="${(128 - Math.sin(r) * 47).toFixed(1)}" x2="${(176 + Math.cos(r) * 47).toFixed(1)}" y2="${(128 + Math.sin(r) * 47).toFixed(1)}" stroke="#a07f1c" stroke-width="3"/>`; }).join('')}
  <circle cx="176" cy="128" r="8" fill="#59616d" ${ol(2)}/>
</g></g>
<g class="root" ${S('90 192')}>
  <g class="mouse" ${S('90 192')}>
    <g ${S('66 176', 'osc 1.2s ease-in-out infinite alternate', '--a:-10deg;--b:10deg')}><path d="M66 178 Q30 188 26 160 Q24 140 8 136" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M66 178 Q30 188 26 160 Q24 140 8 136" fill="none" stroke="${MP}" stroke-width="4" stroke-linecap="round"/></g>
    <g class="mfeet"><ellipse cx="80" cy="188" rx="12" ry="5" fill="${MP}" ${ol(2)}/><ellipse cx="104" cy="188" rx="12" ry="5" fill="${MP}" ${ol(2)}/></g>
    <ellipse cx="90" cy="158" rx="28" ry="31" fill="${MG}" ${ol()}/>
    <ellipse cx="96" cy="166" rx="16" ry="18" fill="${MGL}"/>
    <g class="d-al">${limb('M74 146 Q64 160 70 174', MG, 10)}</g>
    <g class="d-ar">${limb('M106 146 Q116 160 110 174', MG, 10)}</g>
    <g class="head" ${S('92 128')}>
      <circle cx="70" cy="76" r="20" fill="${MG}" ${ol()}/><circle cx="70" cy="76" r="11" fill="${MP}"/>
      <circle cx="116" cy="72" r="20" fill="${MG}" ${ol()}/><circle cx="116" cy="72" r="11" fill="${MP}"/>
      <ellipse cx="96" cy="104" rx="27" ry="25" fill="${MG}" ${ol()}/>
      <path d="M110 96 Q134 100 130 112 Q118 118 106 114 Z" fill="${MG}" ${ol(3)}/>
      <circle cx="131" cy="106" r="4.5" fill="${MP}" ${ol(2)}/>
      <path d="M118 112 l20 5 M118 108 l20 -2" stroke="${O}" stroke-width="1.5"/>
      <g class="d-eyes">${eye(106, 100, 4.5)}${eye(90, 102, 4)}</g>
      <path d="M70 94 Q72 66 96 64 Q122 66 122 92 Z" fill="#ffc21a" ${ol(3)}/>
      <rect x="64" y="88" width="64" height="8" rx="4" fill="#ffb000" ${ol(2.5)}/>
      <circle cx="114" cy="78" r="6" fill="#fff6b0" ${ol(2)}/>
      <g class="A a-flash"><g ${S('118 78', 'osc 1.4s ease-in-out infinite alternate', '--a:-28deg;--b:22deg')}><path d="M118 78 L250 26 L250 136 Z" fill="url(#mbeam)"/></g></g>
      <g class="A a-carry a-run">${drop(70, 96, 0)}${drop(124, 90, 0.5)}</g>
      <g class="A a-salute"><path d="M98 98 l8 -2 M86 100 l-6 -2" ${ol(2)}/></g>
    </g>
    <g class="A a-carry">
      <g ${S('92 110', 'osc .5s ease-in-out infinite alternate', '--a:-7deg;--b:7deg')}>
        <rect x="40" y="58" width="130" height="16" rx="3" fill="#c7ced6" ${ol(3)} transform="rotate(-10 105 66)"/>
        <path d="M60 64 l8 -12 M80 60 l8 -12 M100 57 l8 -12 M120 53 l8 -12 M140 50 l8 -12" stroke="#8d939b" stroke-width="3" transform="rotate(-10 105 66) translate(0 14)"/>
        ${hex(36, 76, 18)}
        ${limb('M74 146 Q60 110 64 84', MG, 10)}${limb('M106 146 Q124 110 120 76', MG, 10)}
      </g>
    </g>
    <g class="A a-tablet">
      ${limb('M74 146 Q90 156 104 148', MG, 10)}
      <rect x="96" y="124" width="60" height="44" rx="5" fill="#222831" ${ol(3)}/>
      <rect x="101" y="129" width="50" height="34" fill="#1b6fb0"/>
      <text x="126" y="142" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="10" fill="#fff">SAP · OT</text>
      <rect x="105" y="150" width="42" height="7" fill="#0d3f66"/>
      <rect x="105" y="150" width="42" height="7" fill="#3dff7a" ${S('105 153', 'pbar 4s ease-out both')}/>
      <g ${S('106 146', 'osc .2s ease-in-out infinite alternate', '--a:-8deg;--b:6deg')}>${limb('M106 146 Q122 136 130 140', MG, 10)}</g>
    </g>
    <g class="A a-salute">
      <g ${S('106 146', 'osc .6s ease-in-out infinite alternate', '--a:-2deg;--b:2deg')}>${limb('M106 146 Q128 124 112 94', MG, 10)}</g>
      ${popTxt(150, 50, '¡Sí, jefe!', 20, '#ffd23f', 1.6)}
    </g>
    <g class="A a-grab">${limb('M74 146 Q68 172 84 188', MG, 10)}${limb('M106 146 Q114 172 100 190', MG, 10)}</g>
    <g class="A a-loot-chipa a-loot-wrench a-loot-star a-loot-bolt a-loot-gear">${limb('M74 146 Q58 116 72 88', MG, 10)}${limb('M106 146 Q124 116 112 86', MG, 10)}</g>
    <g class="A a-loot-chipa"><circle cx="92" cy="70" r="20" fill="none" stroke="${O}" stroke-width="17"/><circle cx="92" cy="70" r="20" fill="none" stroke="#e0a84a" stroke-width="10"/><circle cx="82" cy="62" r="2" fill="#a86b1f"/><circle cx="102" cy="76" r="2" fill="#a86b1f"/></g>
    <g class="A a-loot-wrench">${WRENCH(50, 78, 90)}</g>
    <g class="A a-loot-star"><circle cx="92" cy="62" r="34" fill="rgba(255,210,63,.35)" style="animation:flick .5s infinite"/>${star(92, 62, 28)}</g>
    <g class="A a-loot-bolt"><rect x="60" y="66" width="72" height="14" rx="3" fill="#c7ced6" ${ol(3)}/>${hex(56, 73, 17)}</g>
    <g class="A a-loot-gear"><path d="${gearPath(92, 68, 24, 10, 9)}" fill="#c9a227" fill-rule="evenodd" ${ol(3)}/></g>
    <g class="A a-cheese">${limb('M74 146 Q84 136 96 132', MG, 10)}${limb('M106 146 Q112 136 108 128', MG, 10)}<path d="M92 110 L126 124 L92 138 Z" fill="#ffd23f" ${ol(3)}/><circle cx="102" cy="122" r="3" fill="#e0a800"/><circle cx="110" cy="128" r="2.5" fill="#e0a800"/>${[0, 0.4].map((d) => `<circle cx="104" cy="140" r="2.5" fill="#ffd23f" ${S('104 140', `drip .8s ${d}s ease-in infinite both`, '--y:46px')}/>`).join('')}</g>
    <g class="A a-run"><g class="runlegs">${limb('M82 184 L72 192', MG, 7)}${limb('M100 184 L112 192', MG, 7)}</g></g>
  </g>
</g>`,
  css: `
.c-mouse .mouse{transition:transform .6s ease-in-out}
.c-mouse.act-run .mouse{transform:translate(86px,-24px)}
.c-mouse.act-run .mwheel{animation:spinr .9s linear infinite}
.c-mouse.act-run .root{animation:bob .14s ease-in-out infinite;--y:-3px}
.c-mouse.act-run .mfeet,.c-mouse.act-run .runlegs{animation:jit .08s infinite}
.c-mouse.act-flash .head{animation:osc 1.4s ease-in-out infinite alternate;--a:-6deg;--b:6deg}
.c-mouse.act-carry .root{animation:squash .5s ease-in-out infinite alternate}
.c-mouse.act-tablet .head{transform:rotate(12deg) translate(4px,4px);transition:transform .4s}
.c-mouse.act-peek .root{animation:peek 4.6s ease-in-out both}
.c-mouse.act-peek .head{animation:osc .9s 1.6s ease-in-out infinite alternate;--a:-12deg;--b:12deg}
.c-mouse.act-salute .root{transform:scaleY(1.05)}
.c-mouse.act-grab .root{transform:scale(1.06,.86)}
.c-mouse.act-cheese .head{animation:bob .2s ease-in-out infinite;--y:2px}
.c-mouse[class*="act-loot"] .root{animation:bob .2s ease-in-out infinite;--y:-5px}
.c-mouse.walking[class*="act-loot"] .root{animation:waddle .16s ease-in-out infinite alternate!important}`,
  actions: [
    { id: 'flash', dur: 4.5, say: ['Inspección visual: encontré… ¡una miga de chipa!', 'Con la linterna se ve todo… menos el aguinaldo'] },
    { id: 'run', dur: 4.5, say: ['¡Generando energía de respaldo! 🐭⚡', 'Corro, corro… ¡y el 15 no llega!'] },
    { id: 'carry', dur: 4, hide: ['d-al', 'd-ar'], say: ['Este repuesto pesa más que yo 😩', 'Bulón M24 para el pinscher… ¡a ver si sale!'] },
    { id: 'tablet', dur: 4.2, hide: ['d-al', 'd-ar'], say: ['Cargando la OT en el sistema… 98%… 99%…', 'Revisando que mi banco siga abierto… ✔ uf 😅', 'Notificación cerrada. Ahora sí, a esperar el 15'] },
    { id: 'peek', dur: 4.6, home: true, say: ['¿Ya es 15? ¿No? Ok, sigo trabajando', '¿Faltan {d} días? Vuelvo después…'] },
    { id: 'salute', dur: 3.5, hide: ['d-ar'], say: ['¡Todo listo, jefe! 🫡', 'Ratón de mantenimiento reportándose'] },
    { id: 'cheese', dur: 3.6, hide: ['d-al', 'd-ar'], say: ['Queso Paraguay de contrabando 🧀', 'Ñam… el mejor repuesto es el queso'] },
    { id: 'grab', scene: true, hide: ['d-al', 'd-ar'] },
    ...['chipa', 'wrench', 'star', 'bolt', 'gear'].map((k) => ({ id: 'loot-' + k, scene: true, hide: ['d-al', 'd-ar'] })),
  ],
};


/* =====================================================================
   LORO CON CASCO AMARILLO (supervisor charlatán)
   ===================================================================== */
const LG = '#2fbf4f', LGD = '#1f8f3a';
const parrotWingHold = (inner) => `${inner}<path d="M72 122 Q104 112 122 140 Q124 160 112 168 Q90 150 72 122 Z" fill="${LGD}" ${ol()}/>`;
const parrot = {
  id: 'parrot', name: 'Loro', vb: [220, 230], anchor: [100, 222], scale: 0.85,
  station: { x: 205, y: 456 }, layer: 'front', enter: 'fly', gap: 0.5,
  travel: 'fly', roamChance: 0.45,
  spots: [{ x: 205, y: 456 }, { x: 300, y: 202 }, { x: 1150, y: 238 }, { x: 1680, y: 405 }, { x: 760, y: 238 }],
  svg: `
<g class="root" ${S('100 222')}>
  <g class="tail" ${S('86 168', 'osc 1.6s ease-in-out infinite alternate', '--a:-5deg;--b:6deg')}>
    <path d="M84 162 L50 224 L66 228 L94 172 Z" fill="#e2283b" ${ol(3)}/><path d="M94 166 L82 230 L98 230 L104 172 Z" fill="#2b7de0" ${ol(3)}/>
  </g>
  <path d="M92 196 L90 216 M112 196 L114 216" ${ol(6)} fill="none"/><path d="M80 220 h20 M104 220 h20" stroke="#8d939b" stroke-width="6" stroke-linecap="round"/>
  <ellipse cx="102" cy="150" rx="40" ry="52" fill="${LG}" ${ol()}/>
  <ellipse cx="112" cy="160" rx="22" ry="34" fill="#8be07a"/>
  <path d="M86 178 h40" stroke="#ff7a1a" stroke-width="7"/><path d="M86 178 h40" stroke="#e8f0f2" stroke-width="2"/>
  <g class="d-wing wing" ${S('84 122')}><path d="M70 120 Q102 110 118 140 Q112 188 86 200 Q66 170 70 120 Z" fill="${LGD}" ${ol()}/><path d="M80 182 Q92 192 104 186" fill="none" stroke="#2b7de0" stroke-width="7"/><path d="M84 164 Q96 172 110 166" fill="none" stroke="#e2283b" stroke-width="6"/></g>
  <g class="head" ${S('110 112')}>
    <circle cx="116" cy="82" r="31" fill="${LG}" ${ol()}/>
    <path d="M96 60 Q114 50 132 58" stroke="#ffd23f" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="126" cy="80" rx="14" ry="16" fill="#fff" ${ol(2.5)}/>
    <path d="M118 96 l4 4 M126 98 l2 5 M134 96 l0 5" stroke="#bbb" stroke-width="2"/>
    <g class="d-eyes">${eye(129, 79, 4.8)}</g>
    <g class="jaw" ${S('140 98')}><path d="M140 97 Q154 99 158 106 Q146 114 138 105 Z" fill="#3a3a3a" ${ol(3)}/></g>
    <path d="M138 74 Q168 70 166 102 Q158 94 140 98 Z" fill="#f1e3b5" ${ol(3)}/>
    <path d="M84 66 Q86 38 114 36 Q142 38 146 62 Z" fill="#ffc21a" ${ol(3)}/>
    <path d="M114 38 v26" stroke="#e0a000" stroke-width="5"/>
    <rect x="76" y="60" width="78" height="10" rx="5" fill="#ffb000" ${ol(2.5)}/>
    <g class="A a-nap"><path d="M118 80 q8 6 16 0" fill="none" ${ol(3)}/></g>
    <g class="A a-whistle"><circle cx="164" cy="104" r="5" fill="none" ${ol(2.5)}/></g>
  </g>
  <g class="A a-talk a-mimic a-snitch">${popTxt(190, 52, '¡AGUINALDO!', 18, '#ffd23f', 1.2)}</g>
  <g class="A a-supervise">
    ${parrotWingHold(CLIP(132, 140, 1.15))}
    <g ${S('150 150', 'jit .2s infinite')}><g transform="translate(150 150) rotate(-30)"><rect x="-3.5" y="-26" width="7" height="26" fill="#2b7de0" ${ol(2)}/><path d="M-3.5 0 l3.5 7 l3.5 -7z" fill="#333"/></g></g>
  </g>
  <g class="A a-radio">
    <g ${S('92 120', 'osc .5s ease-in-out infinite alternate', '--a:-3deg;--b:3deg')}>
      <path d="M72 122 Q100 100 116 82 Q126 96 104 126 Q90 150 72 122 Z" fill="${LGD}" ${ol()}/>
      <rect x="112" y="60" width="20" height="36" rx="4" fill="#222831" ${ol(3)}/><rect x="116" y="66" width="12" height="9" fill="#3dff7a"/>
      <path d="M128 60 v-20" ${ol(3)}/><circle cx="128" cy="38" r="4" fill="#e2283b" style="animation:flick .4s infinite"/>
    </g>
    ${floatTxt(160, 40, '📶', 18, '#fff', 1.2, 0, 10, -30)}
  </g>
  <g class="A a-whistle">${floatTxt(176, 96, '♪', 28, '#ffd23f', 1.3, 0, 20, -60)}${floatTxt(180, 90, '♫', 24, '#4fc3ff', 1.3, 0.6, 30, -60)}</g>
  <g class="A a-dance">
    <g ${S('84 122', 'osc .3s ease-in-out infinite alternate', '--a:-50deg;--b:-20deg')}><path d="M70 120 Q40 90 22 60 Q60 80 86 132 Z" fill="${LGD}" ${ol()}/></g>
    ${floatTxt(40, 60, '♪', 28, '#3dff7a', 1.4, 0, -20, -50)}
  </g>
  <g class="A a-nap">${floatTxt(160, 50, 'Z', 22, '#bfe8ff', 2, 0, 20, -50)}${floatTxt(164, 56, 'z', 18, '#bfe8ff', 2, 0.7, 30, -50)}</g>
  <g class="A a-mimic">${popTxt(190, 90, '¡GUAU!', 24, '#ff5a3c', 0.6, 0.3)}</g>
</g>`,
  css: `
.c-parrot.act-talk .jaw,.c-parrot.act-mimic .jaw,.c-parrot.act-snitch .jaw{animation:osc .14s ease-in-out infinite alternate;--a:0deg;--b:26deg}
.c-parrot.act-talk .head,.c-parrot.act-snitch .head{animation:bob .28s ease-in-out infinite;--y:-5px}
.c-parrot.act-snitch .root,.c-parrot.act-mimic .root{animation:bob .3s ease-in-out infinite;--y:-10px}
.c-parrot.act-dance .root{animation:sway .35s ease-in-out infinite alternate}
.c-parrot.act-dance .head{animation:osc .35s ease-in-out infinite alternate;--a:-12deg;--b:12deg}
.c-parrot.act-nap .head{transform:rotate(14deg) translateY(6px);transition:transform .6s}
.c-parrot.act-nap .d-eyes{display:none}
.c-parrot.act-whistle .head{animation:osc .5s ease-in-out infinite alternate;--a:-4deg;--b:4deg}
.c-parrot.act-supervise .head{transform:rotate(10deg);transition:transform .4s}
.c-parrot.flying .wing{animation:flap .13s ease-in-out infinite alternate}`,
  actions: [
    { id: 'talk', dur: 3.6, say: ['¡Aguinaldo! ¡Aguinaldo! 🦜', '¡Faltan {d} días! ¡{d} días! ¡{d} DÍAS!', '¡Lorito quiere aguinaldo… en efectivo! 💵', '¡Billete en mano! ¡Nada de apps raras! 🦜'] },
    { id: 'supervise', dur: 4.2, hide: ['d-wing'], say: ['Inspección de seguridad: ¿casco puesto? ✔', 'Anotando quién llega tarde… 📋', 'Permiso de trabajo en altura: firmado ✍️'] },
    { id: 'radio', dur: 4.2, hide: ['d-wing'], say: ['Taller a central: ¿cuándo cae el aguinaldo? Cambio 📻', 'Central dice: el 15. Cambio y fuera'] },
    { id: 'whistle', dur: 3.6, say: ['Fiu fiuuu… ¡a trabajar, gente! 🎵', 'Fiu fiu… ¿ese pinscher sigue con el bulón?'] },
    { id: 'dance', dur: 3.6, say: ['¡Llega diciembre y se baila! 💃', '¡Paso de loro aguinaldero!'] },
    { id: 'nap', dur: 4, say: ['Zzz… aguinaldo… zzz… 😴', 'Zzz… el 15… cobrar… zzz'] },
    { id: 'mimic', scene: true },
    { id: 'snitch', scene: true },
  ],
};

/* =====================================================================
   MONO TRAVIESO (mucha personalidad, salta por todos lados)
   ===================================================================== */
const MK = '#7b4a2a', MKF = '#f0c9a0', MKD = '#5a3319';
const monkeyArmsUp = `${limb('M80 160 Q60 120 78 92', MK, 13)}${limb('M140 160 Q160 120 142 92', MK, 13)}`;
const monkey = {
  id: 'monkey', name: 'Mono', vb: [240, 260], anchor: [110, 252], scale: 0.9,
  station: { x: 1180, y: 238 }, layer: 'front', enter: 'leap', gap: 0.4,
  travel: 'leap', roamChance: 0.8,
  spots: [
    { x: 1180, y: 238 }, { x: 760, y: 238 }, { x: 300, y: 202 }, { x: 1680, y: 405 },
    { x: 560, y: 1046 }, { x: 900, y: 1046 }, { x: 1440, y: 1046 }, { x: 205, y: 456 }, { x: 1830, y: 606 },
  ],
  svg: `
<ellipse cx="112" cy="252" rx="56" ry="6" fill="rgba(0,0,0,.3)"/>
<g class="A a-drum"><path d="M150 206 h64 l-6 46 h-52 z" fill="#2b6cb0" ${ol()}/><ellipse cx="182" cy="206" rx="32" ry="8" fill="#9aa3ad" ${ol(3)}/><path d="M154 226 h56" stroke="#ffd23f" stroke-width="5"/></g>
<g class="A a-switch">
  <rect x="160" y="120" width="56" height="110" rx="6" fill="#59616d" ${ol()}/>
  <rect x="168" y="128" width="40" height="14" fill="#ffc21a" ${ol(2)}/><text x="188" y="139" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="9" fill="#111">TÉRMICA</text>
  <g ${S('188 186', 'lever 2.4s ease-in-out infinite')}><rect x="184" y="150" width="9" height="40" rx="3" fill="#c7ced6" ${ol(2)}/><circle cx="188" cy="150" r="9" fill="#e2283b" ${ol(2)}/></g>
  <circle cx="176" cy="214" r="5" fill="#3dff7a" style="animation:flick .4s infinite"/>
</g>
<g class="root" ${S('110 252')}>
  <g ${S('76 206', 'osc 1.3s ease-in-out infinite alternate', '--a:-10deg;--b:12deg')}><path d="M78 206 Q30 214 26 170 Q24 130 54 128 Q72 130 66 148" fill="none" stroke="${O}" stroke-width="12" stroke-linecap="round"/><path d="M78 206 Q30 214 26 170 Q24 130 54 128 Q72 130 66 148" fill="none" stroke="${MK}" stroke-width="6" stroke-linecap="round"/></g>
  <g class="legs">${limb('M96 210 Q86 230 90 248', MK, 13)}${limb('M126 210 Q136 230 132 248', MK, 13)}<ellipse cx="86" cy="250" rx="13" ry="6" fill="${MKF}" ${ol(3)}/><ellipse cx="136" cy="250" rx="13" ry="6" fill="${MKF}" ${ol(3)}/></g>
  <ellipse cx="110" cy="178" rx="38" ry="42" fill="${MK}" ${ol()}/>
  <ellipse cx="112" cy="186" rx="24" ry="28" fill="${MKF}"/>
  <rect x="74" y="200" width="74" height="12" rx="4" fill="#3b2b22" ${ol(3)}/>
  <rect x="86" y="196" width="10" height="22" rx="2" fill="#c7ced6" ${ol(2)}/><rect x="124" y="196" width="8" height="20" rx="2" fill="#e2283b" ${ol(2)}/>
  <g class="d-al">${limb('M80 160 Q58 196 66 228', MK, 13)}</g>
  <g class="d-ar">${limb('M140 160 Q162 196 154 228', MK, 13)}</g>
  <g class="head" ${S('112 140')}>
    <circle cx="66" cy="102" r="17" fill="${MK}" ${ol()}/><circle cx="66" cy="102" r="9" fill="${MKF}"/>
    <circle cx="158" cy="102" r="17" fill="${MK}" ${ol()}/><circle cx="158" cy="102" r="9" fill="${MKF}"/>
    <circle cx="112" cy="100" r="40" fill="${MK}" ${ol()}/>
    <path d="M86 96 Q86 80 100 82 Q112 86 124 82 Q138 80 138 96 Q144 126 112 132 Q80 126 86 96 Z" fill="${MKF}" ${ol(3)}/>
    <g class="d-eyes">${eye(101, 96, 5.5)}${eye(124, 96, 5.5)}</g>
    <path d="M94 84 l12 4 M130 84 l-12 4" stroke="${MKD}" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="108" cy="110" rx="2.5" ry="2" fill="${O}"/><ellipse cx="117" cy="110" rx="2.5" ry="2" fill="${O}"/>
    <g class="d-mouth"><path d="M96 118 Q112 132 128 118 Q112 124 96 118 Z" fill="#fff" ${ol(2.5)}/></g>
    <g class="A a-chest a-laugh a-flip"><path d="M94 116 Q112 142 130 116 Z" fill="#7a1f1f" ${ol(3)}/><path d="M100 117 h24" stroke="#fff" stroke-width="4"/></g>
    <g class="A a-banana"><ellipse cx="112" cy="122" rx="9" ry="6" fill="#7a1f1f" ${ol(2)}/></g>
    <g class="A a-laugh a-banana"><path d="M94 96 q7 -8 14 0 M118 96 q7 -8 14 0" fill="none" ${ol(4)}/></g>
    <g transform="rotate(-16 112 62)">
      <path d="M78 70 Q80 40 110 38 Q140 40 144 68 Z" fill="#ffc21a" ${ol(3)}/>
      <path d="M110 40 v28" stroke="#e0a000" stroke-width="5"/>
      <rect x="70" y="64" width="80" height="10" rx="5" fill="#ffb000" ${ol(2.5)}/>
      <circle cx="128" cy="54" r="7" fill="#3dff7a" ${ol(2)}/><text x="128" y="58" text-anchor="middle" font-size="9" font-weight="800" font-family="Baloo 2">☺</text>
    </g>
  </g>
  <g class="A a-banana">
    <g ${S('140 160', 'osc .5s ease-in-out infinite alternate', '--a:-6deg;--b:8deg')}>
      ${limb('M140 160 Q160 140 132 122', MK, 13)}
      <path d="M126 122 Q118 98 128 82 Q140 98 134 124 Z" fill="#ffe14d" ${ol(3)}/>
      <path d="M128 122 Q140 132 150 150 M130 124 Q120 136 116 152" stroke="#e8c400" stroke-width="7" stroke-linecap="round" fill="none"/>
    </g>
  </g>
  <g class="A a-drum">
    <g ${S('140 160', 'osc .18s ease-in-out infinite alternate', '--a:-25deg;--b:15deg')}>${limb('M140 160 Q168 170 176 196', MK, 13)}${limb('M176 196 L196 186', '#c7ced6', 6)}</g>
    <g ${S('80 160', 'osc .18s .09s ease-in-out infinite alternate', '--a:20deg;--b:-10deg')}>${limb('M80 160 Q130 186 166 198', MK, 13)}</g>
    ${popTxt(210, 160, '¡PUM!', 22, '#ffd23f', 0.36)}${floatTxt(200, 120, '♪', 26, '#ff7bd5', 1.2, 0, 20, -60)}
  </g>
  <g class="A a-chest">
    <g ${S('80 160', 'osc .22s ease-in-out infinite alternate', '--a:-30deg;--b:10deg')}>${limb('M80 160 Q86 186 104 176', MK, 13)}</g>
    <g ${S('140 160', 'osc .22s .11s ease-in-out infinite alternate', '--a:30deg;--b:-10deg')}>${limb('M140 160 Q134 186 118 176', MK, 13)}</g>
    ${popTxt(196, 60, '¡UH UH AH AH!', 22, '#ffd23f', 0.9)}
  </g>
  <g class="A a-juggle a-install a-laugh a-flip a-selfie-x">${monkeyArmsUp}</g>
  <g class="A a-juggle">${[0, -0.4, -0.8].map((d) => `<g ${S('110 30', `spin 1.2s ${d}s linear infinite`)}>${WRENCH(110, -10, 0)}</g>`).join('')}</g>
  <g class="A a-selfie">
    ${limb('M80 160 Q66 196 70 222', MK, 13)}
    <g ${S('140 160', 'osc 1s ease-in-out infinite alternate', '--a:-4deg;--b:4deg')}>${limb('M140 160 Q178 134 186 98', MK, 13)}<rect x="176" y="62" width="26" height="44" rx="5" fill="#222831" ${ol(3)}/><rect x="180" y="68" width="18" height="30" fill="#4fc3ff"/><circle cx="189" cy="70" r="16" fill="#fff" style="animation:zapflash 1.6s steps(1) infinite"/></g>
    <text x="54" y="80" font-size="30">✌️</text>
  </g>
  <g class="A a-install"><g ${S('110 70', 'jit .12s infinite')}>${hex(110, 70, 20, '#ffd23f')}</g>${sparks(110, 70, 8, 50)}</g>
  <g class="A a-switch">${limb('M80 160 Q60 196 66 228', MK, 13)}<g ${S('140 160', 'lever 2.4s ease-in-out infinite')}>${limb('M140 160 Q170 150 188 152', MK, 13)}</g></g>
  <g class="A a-laugh">${popTxt(60, 70, 'JAJAJA', 24, '#ffd23f', 0.8)}${popTxt(190, 90, 'JIJI', 20, '#ffd23f', 0.8, 0.4)}</g>
</g>`,
  css: `
.c-monkey.act-banana .root{animation:bob .35s ease-in-out infinite;--y:-3px}
.c-monkey.act-drum .root{animation:bob .18s ease-in-out infinite;--y:-4px}
.c-monkey.act-drum .head{animation:wobblehead .36s ease-in-out infinite}
.c-monkey.act-flip .root{animation:flipback 1.1s ease-in-out infinite}
.c-monkey.act-chest .root{animation:bob .22s ease-in-out infinite;--y:-6px}
.c-monkey.act-juggle .head{animation:osc .6s ease-in-out infinite alternate;--a:-6deg;--b:6deg}
.c-monkey.act-laugh .root{animation:osc .18s ease-in-out infinite alternate;--a:-8deg;--b:8deg}
.c-monkey.act-selfie .head{transform:rotate(-10deg);transition:transform .3s}
.c-monkey.act-install .root{animation:jit .1s infinite}`,
  actions: [
    { id: 'banana', dur: 4, hide: ['d-ar', 'd-eyes', 'd-mouth'], say: ['Banana de la merienda 🍌 …la cáscara la dejo por ahí 😏', 'Potasio para aguantar hasta el 15 🍌'] },
    { id: 'drum', dur: 4, hide: ['d-al', 'd-ar'], say: ['¡Ritmo de taller! 🥁 ¡Pum pa pum!', 'Batería de llaves y baldes, ¡todos a bailar!'] },
    { id: 'flip', dur: 3.3, hide: ['d-al', 'd-ar', 'd-mouth'], say: ['¡Mortal hacia atrás! 🤸', '¿Viste eso? ¡Diez puntos!'] },
    { id: 'chest', dur: 3.2, hide: ['d-al', 'd-ar', 'd-mouth'], say: ['¡UH UH AH AH! ¡El aguinaldo es mío! 🐒', '¡Soy el rey del taller!'] },
    { id: 'juggle', dur: 3.8, hide: ['d-al', 'd-ar'], say: ['Malabares con llaves 14, 17 y 19 🔧', '¡Mirá, sin red de seguridad!'] },
    { id: 'selfie', dur: 3.8, hide: ['d-al', 'd-ar'], say: ['Selfie con el reloj del aguinaldo 🤳 #FaltaPoco', 'Sonrían, que va para el grupo del taller 📸', 'Selfie con mi auto de lujo… ah no, es la bici del conejo 🤳'] },
    { id: 'install', scene: true, hide: ['d-al', 'd-ar'] },
    { id: 'switch', scene: true, hide: ['d-al', 'd-ar'] },
    { id: 'laugh', scene: true, hide: ['d-al', 'd-ar', 'd-eyes', 'd-mouth'] },
  ],
};

export const CHARACTERS = [bear, bird, octo, rabbit, duck, pinscher, pig, mouse, parrot, monkey];

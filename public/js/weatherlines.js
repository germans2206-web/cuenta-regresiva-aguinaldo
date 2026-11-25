/* Frases según el clima real de Asunción. {T} = temperatura actual en °C. */

// frases generales por tipo de clima (cualquier personaje)
export const WX_LINES = {
  lluvia: [
    'Ojalá no caiga granizo… ya me rompió el parabrisas una vez 😩',
    '¡NOOO! ¡Dejé la ventana del auto abierta! 🚗💦',
    '¡Mi ropa estaba tendida afuera para que se seque! 👕💧',
    'Con esta lluvia, a la salida la calle es un raudal. Hoy vuelvo en canoa 🛶',
    'Día de lluvia = chipa calentita y sopa paraguaya 🌧️',
    'Otra gotera más y armamos pileta en el taller 🏊',
    'Llueve en Asunción: el tránsito ya colapsó y yo ni salí 🚦',
    '¿Alguien trajo paraguas? …¿no? Yo tampoco ☔',
    'La lluvia moja… pero el aguinaldo llega igual 💸',
  ],
  llovizna: [
    'Esta llovizna no moja… pero empapa 🌦️',
    'Ojalá no se largue fuerte, que dejé la ropa afuera 👕',
    '¿Llueve o no llueve? Decidite, cielo 🌦️',
    'Con esta llovizna, el tereré se pasa a mate cocido ☕',
  ],
  tormenta: [
    '¡Que no se corte la luz, que el reloj necesita energía! ⚡',
    'Rayo… uno, dos, tres… ¡TRUENO! ⛈️',
    'Ojalá no caiga granizo, que mi auto ya tiene cicatrices 😩',
    'Desenchufen lo que no usen, que se viene fuerte ⛈️',
    'Con esta tormenta, hasta el pinscher se esconde 🐕',
  ],
  calor: [
    '¡{T}° en Asunción! Hoy el tereré es una cuestión de supervivencia 🧉',
    'Me estoy derritiendo más rápido que un helado en la vereda 🥵',
    'Freí un huevo sobre la chapa del taller 🍳',
    '¡Ese sol paraguayo no perdona! ☀️',
    'Ni el ventilador aguanta este calor 🌀',
    'Agua fría del tanque, ¡ya! 💧',
    '{T} grados… y la sensación térmica dice «sufrí» 🔥',
  ],
  sol: [
    'Lindo día para un tereré bien frío 🧉',
    'Sol y {T}°: clima perfecto para cobrar aguinaldo ☀️',
    'Con este sol hasta los engranajes brillan ✨',
  ],
  frio: [
    '¡Qué frío! Hoy toca mate cocido y chipa calentita ☕',
    '{T}° en Asunción… ¿dónde quedó mi campera? 🥶',
    'Con este frío, el aguinaldo se va en frazadas 🛏️',
  ],
  nublado: [
    'Nublado… ¿llueve o no llueve hoy? ☁️',
    'Día gris, pero el aguinaldo pinta brillante 💸',
  ],
  niebla: ['Con esta niebla no veo ni el bulón M24 🌫️'],
};
WX_LINES.granizo = [...WX_LINES.tormenta, '¡GRANIZO! ¡Mi parabrisas otra vez nooo! 😱'];
WX_LINES.parcial = WX_LINES.nublado;
WX_LINES.despejado = ['Noche despejada: se ven las estrellas… y el aguinaldo más cerca ✨'];

// frases con la personalidad de cada uno
export const WX_CHAR = {
  rain: {
    duck: ['¡Lluvia! ¡El mejor día del año! ¡CUAC! 🦆💦', 'Ese charco es mío, que nadie lo toque 🦆'],
    pinscher: ['¡No me gusta mojarme! GRR ⛈️', '¡Me cayó una gota en la cabeza! ¡¿QUIÉN FUE?! 😤'],
    octo: ['¿Lluvia? ¡SEEEEEE! 🐙💧', 'Yo con agua estoy en mi elemento… ¡SEEEEEE!'],
    parrot: ['¡Alerta meteorológica! ¡Alerta! 🦜', '¡Ropa afuera, ropa mojada! ¡Ropa mojada! 🦜'],
    bird: ['«Oky», mitãnguéra: está lloviendo. Hoy se trabaja bajo techo 🌧️'],
    pig: ['Con lluvia, el barro me queda divino 🐷', 'Día de lluvia: siesta larga y chipa 😴'],
    rabbit: ['Hoy no hay delivery en bici: ¡hoy hay delivery en bote! 🚲🌊'],
    monkey: ['¡Yo tapo las goteras, yo tapo las goteras! 🐒🔧'],
    bear: ['Con esta humedad mi pelaje parece una esponja 🐻💧'],
    mouse: ['Mi cueva tiene gotera… me mudo al cajón de repuestos 🐭'],
  },
  hot: {
    pig: ['Sudo como chancho… porque SOY chancho 🐷💦'],
    bear: ['Con este pelaje, {T}° es una tortura 🐻🔥', '¡Tereré bien frío, ya! 🧉'],
    duck: ['¿Alguien vio mi pileta? 🦆☀️'],
    octo: ['¿Hace calor? ¡SEEEEEE! 🥵'],
    rabbit: ['Hoy pedaleo solo de bajada 🚲🥵'],
    pinscher: ['¡Hace mucho calor y me pongo más nervioso! GRR 🥵'],
    bird: ['«Kuarahy hatã»: el sol está fuerte. A la sombra, mitãnguéra ☀️'],
    parrot: ['¡Calor! ¡Calor! ¡Tereré! ¡Tereré! 🦜'],
    mouse: ['Me robé hielo del freezer… para todos, eh 🧊'],
    monkey: ['¿Y si ponemos el ventilador industrial en el máximo? 🌀'],
  },
  cold: {
    pinscher: ['Tiemblo de frío… bueno, siempre tiemblo 🐕🥶'],
    bear: ['Este frío me da ganas de hibernar hasta el 15 🐻😴'],
    octo: ['¿Frío? ¡SEEEEEE! Ocho brazos y ningún guante 🧤'],
  },
};

export function wxGroup(kind) {
  if (['lluvia', 'llovizna', 'tormenta', 'granizo'].includes(kind)) return 'rain';
  if (kind === 'calor') return 'hot';
  if (kind === 'frio') return 'cold';
  return null;
}

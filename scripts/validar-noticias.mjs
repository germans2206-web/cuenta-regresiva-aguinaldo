// Valida public/data/noticias.json antes de publicarlo.
// Uso: node scripts/validar-noticias.mjs   (sale con código 1 si algo está mal)
import { readFileSync } from 'node:fs';

const FILE = new URL('../public/data/noticias.json', import.meta.url);
const TEMAS = ['politica', 'futbol', 'deportes', 'economia', 'actualidad', 'clima', 'tecnologia', 'cultura'];
const errs = [];
let j;
try { j = JSON.parse(readFileSync(FILE, 'utf8')); } catch (e) { console.error('JSON inválido:', e.message); process.exit(1); }

const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Asuncion' }).format(new Date());
if (j.fecha !== hoy) errs.push(`"fecha" debe ser la de hoy en Asunción (${hoy}), es "${j.fecha}"`);
if (!Array.isArray(j.noticias)) errs.push('"noticias" debe ser una lista');
else {
  if (j.noticias.length < 3 || j.noticias.length > 12) errs.push(`debe haber entre 3 y 12 noticias (hay ${j.noticias.length})`);
  j.noticias.forEach((n, i) => {
    const p = `noticia ${i + 1}`;
    if (!TEMAS.includes(n.tema)) errs.push(`${p}: "tema" debe ser uno de ${TEMAS.join(', ')}`);
    if (typeof n.texto !== 'string' || n.texto.length < 20 || n.texto.length > 180) errs.push(`${p}: "texto" debe tener entre 20 y 180 caracteres`);
    if (/[<>]/.test(n.texto || '')) errs.push(`${p}: "texto" no puede contener < ni >`);
    if (n.texto && n.texto !== n.texto.toUpperCase()) errs.push(`${p}: "texto" debe ir en MAYÚSCULAS como el resto del cartel`);
    if (!n.fuente) errs.push(`${p}: falta "fuente"`);
    if (!/^https:\/\//.test(n.url || '')) errs.push(`${p}: "url" debe ser un enlace https a la nota original`);
  });
}
if (errs.length) { console.error('noticias.json NO es válido:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`noticias.json OK: ${j.noticias.length} noticias del ${j.fecha}`);

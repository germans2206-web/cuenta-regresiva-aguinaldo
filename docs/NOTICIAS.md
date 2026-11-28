# Noticias del día en el cartel de Avisos

Cada mañana una tarea programada busca las noticias más destacadas de Paraguay, escribe una línea con humor del taller para cada una y actualiza `public/data/noticias.json`. El panel lee ese archivo al abrir y cada 30 minutos, y muestra las noticias en el cartel de **Avisos** (con el ícono 📰), intercaladas con los avisos de siempre. Si el archivo tiene más de 3 días, el panel no muestra noticias viejas.

## Formato del archivo

```json
{
  "fecha": "2026-11-28",
  "generado": "2026-11-28T06:05:00-03:00",
  "noticias": [
    { "tema": "futbol", "texto": "TEXTO EN MAYÚSCULAS CON EL CHISTE ⚽", "fuente": "ABC Color", "url": "https://…" }
  ]
}
```

- `fecha`: el día de hoy en Asunción (AAAA-MM-DD).
- `tema`: `politica`, `futbol`, `deportes`, `economia`, `actualidad`, `clima`, `tecnologia` o `cultura`.
- `texto`: entre 20 y 180 caracteres, en MAYÚSCULAS, sin `<` ni `>`. El hecho primero y el chiste después; puede terminar con un emoji.
- `fuente` y `url`: el medio y el enlace https a la nota.
- Entre 3 y 12 noticias (lo ideal: 10 a 12). Se actualizan dos veces por día: 05:52 (lo de la noche y la mañana temprano) y 14:52 (lo del mediodía y la tarde).

Antes de publicar: `node scripts/validar-noticias.mjs` (falla si algo no cumple).

## Criterios editoriales

**Qué buscar** (últimas 24 h, como máximo 48 h): 2 de política, 2 o 3 de fútbol (clubes paraguayos y la Albirroja: resultados, títulos, fichajes, clásicos) y el resto de economía, clima o actualidad. Fuentes: ABC Color, Última Hora y D10, La Nación, Hoy, NPY, IP Paraguay, APF, Tigo Sports, o agencias (EFE, AFP, AP).

**Los hechos son sagrados.** Nunca inventar resultados, cifras, citas ni detalles: cada dato debe estar en la nota de la fuente. Si no se pudo verificar, no va.

**El humor es del taller.** Chistes cortos y livianos que conecten la noticia con el mundo del panel: el aguinaldo del 15, el tereré, la chipa, el «hendapaitéma», el pulpo del «¡SEEEEEE!», el pinscher nervioso, el pato torpe, el ratón que roba repuestos, las goteras, el preventivo. La rivalidad futbolera se vale con buena onda (Olimpia/Cerro/Libertad/Guaraní…), sin insultos a hinchadas.

**Con personas reales:** el chiste es sobre la situación o sobre el taller, nunca un insulto ni una acusación. Con causas judiciales se usan los mismos verbos que la noticia (imputado, detenido, se entregó); nadie es «culpable» sin condena. En política, misma vara para todos los partidos y sin tomar partido.

**Nunca con humor (se omiten):** muertes, accidentes, crímenes con víctimas, violencia, abuso, menores, enfermedades o brotes, tragedias y catástrofes.

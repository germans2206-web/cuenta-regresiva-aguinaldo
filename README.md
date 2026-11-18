# ⚙️ Cuenta regresiva al Aguinaldo — Taller de Mantenimiento

Panel online que muestra **PARA EL AGUINALDO FALTA _días · horas · minutos · segundos_** hasta el cobro del aguinaldo
(**15/12/2026, 00:00 hora de Paraguay**), con un taller animado de fondo y 8 animales trabajando.

## Qué tiene
- **Reloj digital de 7 segmentos** dentro de un panel de chapa con remaches y franjas de seguridad.
- **Maquinaria funcionando detrás**: engranajes que engranan de verdad, cables con corriente, caños de cobre,
  manómetro, pistón, vapor, luces navideñas y un arbolito hecho de engranajes.
- **Fondo 3D (Three.js)**: engranajes metálicos girando, caños, nieve y luces bokeh.
- **9 personajes con 6 animaciones cada uno** que van apareciendo de a poco (a veces varios a la vez):
  | Personaje | Acciones |
  |---|---|
  | Oso soldador | suelda, se seca el sudor, martilla, toma tereré, baila, mira el reloj |
  | Anó (pájaro negro) | estira cables, vuela, ordena cables, picotea un conector, canta, hace equilibrio |
  | Pulpo | multitarea con 4 herramientas, gira válvula, tira tinta, checklist, malabares, saluda |
  | Conejo en bici | pedalea, genera energía, hace willy, toca timbre, pinchadura, se cansa |
  | Pato con casco | levanta la escalera, sube, cambia la lámpara, tambalea, mide tensión, festeja |
  | Pinscher rabioso | pelea con el bulón, ladra, patea, tira la llave, tiembla, ¡lo saca! |
  | Chanchito navideño | aceita engranajes, se resbala, come chipa, golpea el manómetro, barre, sueña |
  | Ratón con casco | linterna, corre en la rueda, carga un bulón, carga la OT, espía, saluda — y **roba repuestos** recorriendo el panel y el piso |
  | Loro con casco | habla, supervisa con planilla, radio, silba, baila, duerme la siesta |
- **El anó y el loro vuelan por toda la pantalla** (luces, lámpara, manómetro, arbolito, panel).
- **Escenas entre animales**: el pinscher se pelea con el anó · el ratón le roba la chipa al chanchito · el ratón le roba la llave al pinscher · el ratón se roba la estrella del arbolito · el loro imita al pinscher · el oso le convida tereré al conejo.
- **Batería “Nivel de carga del aguinaldo”** (avance del año hasta la fecha objetivo).
- **Cartel LED** con avisos del taller.
- Al llegar a cero: **“¡LLEGÓ EL AGUINALDO!”**, fiesta de todos los personajes, confeti y billetes.

## Parámetros de URL
- `?fecha=2026-12-15T08:00` → cambia la fecha/hora objetivo (hora de Paraguay).
- `?demo=20` → prueba: la cuenta llega a cero en 20 segundos.
- `?escena=0` … `?escena=5` → muestra una escena entre animales puntual.

## Desarrollo y despliegue (Cloudflare Workers – Static Assets)
```bash
npm install
npm run dev      # compila el fondo 3D y levanta wrangler dev
npm run deploy   # compila y publica en Cloudflare
```
El sitio es 100 % estático (`public/`). `public/js/scene3d.bundle.js` se genera desde `src/scene3d.js`
con esbuild y está versionado, así Cloudflare puede publicar sin paso de build.

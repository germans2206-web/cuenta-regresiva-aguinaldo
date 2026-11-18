# ⚙️ Cuenta regresiva al Aguinaldo — Taller de Mantenimiento

Estética "calibre nocturno" de relojería suiza: platina con perlado, puentes de rodio con Côtes de Genève, ruedas de oro y acero esqueletadas, rubíes, volante con espiral y rueda de escape que avanza un diente por segundo.

Panel online que muestra **PARA EL AGUINALDO FALTA _días · horas · minutos · segundos_** hasta el cobro del aguinaldo
(**15/12/2026, 00:00 hora de Paraguay**), con un taller animado de fondo y 8 animales trabajando.

## Qué tiene
- **Reloj digital de 7 segmentos** dentro de un panel de chapa con remaches y franjas de seguridad.
- **Maquinaria funcionando detrás**: engranajes que engranan de verdad, cables con corriente, caños de cobre,
  manómetro, pistón, vapor, luces navideñas y un arbolito hecho de engranajes.
- **Fondo 3D (Three.js)**: engranajes metálicos girando, caños, nieve y luces bokeh.
- **10 personajes con 6 animaciones cada uno** que van apareciendo de a poco (a veces varios a la vez):
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
  | Mono travieso | come banana, toca batería, mortal hacia atrás, golpe de pecho, malabares, selfie — salta por toda la pantalla |
  | Loro con casco | habla, supervisa con planilla, radio, silba, baila, duerme la siesta |
- **El anó y el loro vuelan por toda la pantalla** (luces, lámpara, manómetro, arbolito, panel).
- **Escenas entre animales**: el pinscher se pelea con el anó · el ratón le roba la chipa al chanchito · el ratón le roba la llave al pinscher · el ratón se roba la estrella del arbolito · el loro imita al pinscher · el oso le convida tereré al conejo.
- **Trabajos de mantenimiento**: el oso repara el motor, el mono cambia rodamientos, el ratón ajusta sensores, el anó controla el cableado, el chanchito limpia filtros, el pulpo suelda placas, el conejo reparte repuestos, el pinscher da torque, el loro bloquea y etiqueta, y el pato… hace lo que puede (se tropieza, pinta de más y se enreda).
- **Mantenimientos programados en pareja**: el reloj se pausa sin alarma y al final alguien lo calibra.
- **Paradas del reloj** (cada 3–4 min): el ratón roba el perno del engranaje maestro, el anó provoca un apagón o el pinscher traba los engranajes con la llave. El reloj se congela, suenan las balizas y todos ayudan a repararlo; al final alguien **calibra el reloj** con la hora oficial (los dígitos giran hasta la hora real).
- **Batería “Nivel de carga del aguinaldo”** (avance del año hasta la fecha objetivo).
- **Cartel LED** con avisos del taller.
- Al llegar a cero: **“¡LLEGÓ EL AGUINALDO!”**, fiesta de todos los personajes, confeti y billetes.

## Parámetros de URL
- `?fecha=2026-12-15T08:00` → cambia la fecha/hora objetivo (hora de Paraguay).
- `?demo=20` → prueba: la cuenta llega a cero en 20 segundos.
- `?escena=0` … `?escena=31` (26–31: chistes del caso Ueno) (15–17: préstamos "hasta que cobre el aguinaldo"; 18–25: trabajos en pareja) → muestra una escena entre animales puntual.
- `?parada=0` … `?parada=2` → muestra una parada puntual (perno robado, apagón, atasco).

## Desarrollo y despliegue (Cloudflare Workers – Static Assets)
```bash
npm install
npm run dev      # compila el fondo 3D y levanta wrangler dev
npm run deploy   # compila y publica en Cloudflare
```
El sitio es 100 % estático (`public/`). `public/js/scene3d.bundle.js` se genera desde `src/scene3d.js`
con esbuild y está versionado, así Cloudflare puede publicar sin paso de build.

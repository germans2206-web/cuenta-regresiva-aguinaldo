// Genera el path SVG de un engranaje (con agujero central)
export function gearPath(cx, cy, r, teeth, h, phaseDeg = 0, hole = 0.32) {
  const ro = r + h / 2, ri = r - h / 2;
  const step = (Math.PI * 2) / teeth;
  const ph = (phaseDeg * Math.PI) / 180;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a = i * step + ph;
    const pts = [
      [ri, a - step * 0.5], [ri, a - step * 0.28], [ro, a - step * 0.17],
      [ro, a + step * 0.17], [ri, a + step * 0.28],
    ];
    pts.forEach(([rr, aa], j) => {
      const x = cx + rr * Math.cos(aa), y = cy + rr * Math.sin(aa);
      d += (i === 0 && j === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    });
  }
  d += 'Z';
  const hr = r * hole;
  d += `M${cx + hr} ${cy}A${hr} ${hr} 0 1 0 ${cx - hr} ${cy}A${hr} ${hr} 0 1 0 ${cx + hr} ${cy}Z`;
  return d;
}

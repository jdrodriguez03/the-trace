// PROVISIONAL: cambiar por cop y pct de web/src/lib/format.ts de Juan Angel (día 8).
// Mientras tanto, los componentes de esta carpeta formatean cifras con esto.
// Mismas reglas del prototipo: punto de miles, coma decimal y espacio antes de %.

const NBSP = "\u00a0";

/** Pesos sin decimales: 8586000 → «$8.586.000». */
export function cop(value: number): string {
  const n = Math.round(Math.abs(Number(value) || 0));
  const withDots = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (value < 0 && n !== 0 ? "−" : "") + "$" + withDots;
}

/** Porcentaje con signo: 1.4 → «+1,4 %», -0.6 → «−0,6 %». */
export function pct(value: number, decimals = 1): string {
  const n = Number(value) || 0;
  const rounded = Number(Math.abs(n).toFixed(decimals));
  const sign = rounded === 0 ? "" : n > 0 ? "+" : "−";
  return sign + rounded.toFixed(decimals).replace(".", ",") + NBSP + "%";
}

/** Porcentaje sin signo: 1.4 → «1,4 %». */
export function pctAbs(value: number, decimals = 1): string {
  return Math.abs(Number(value) || 0).toFixed(decimals).replace(".", ",") + NBSP + "%";
}

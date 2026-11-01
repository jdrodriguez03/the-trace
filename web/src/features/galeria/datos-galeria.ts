// Datos de prueba, solo para la galería. Copiados del catálogo y las noticias de ejemplo.

import type { MarketAsset, NewsItem, PricePoint } from "@/components/trace/types";

// Portafolio de ejemplo: Ecopetrol 1.200, Bancolombia 60, ISA 90 y Grupo Sura 40 (vale $8.586.000).
export const EXAMPLE = [
  { ticker: "ECOPETROL", name: "Ecopetrol", sector: "Petróleo y energía", shares: 1200, price: 2350, change: -1.4 },
  { ticker: "PFBCOLOM", name: "Bancolombia", sector: "Bancos", shares: 60, price: 38400, change: 0.8 },
  { ticker: "ISA", name: "ISA", sector: "Energía eléctrica", shares: 90, price: 21800, change: 1.9 },
  { ticker: "GRUPOSURA", name: "Grupo Sura", sector: "Seguros e inversiones", shares: 40, price: 37500, change: -0.6 },
];

export const MARKET_SAMPLE: MarketAsset[] = [
  { ticker: "ECOPETROL", name: "Ecopetrol", sector: "Petróleo y energía", price: 2350, changePct: -1.4 },
  { ticker: "PFBCOLOM", name: "Bancolombia", sector: "Bancos", price: 38400, changePct: 0.8 },
  { ticker: "ISA", name: "ISA", sector: "Energía eléctrica", price: 21800, changePct: 1.9 },
  { ticker: "GRUPOSURA", name: "Grupo Sura", sector: "Seguros e inversiones", price: 37500, changePct: -0.6 },
  { ticker: "GRUPOARGOS", name: "Grupo Argos", sector: "Seguros e inversiones", price: 16900, changePct: 0.3 },
  { ticker: "CEMARGOS", name: "Cementos Argos", sector: "Construcción", price: 9800, changePct: -2.1 },
  { ticker: "GEB", name: "Grupo Energía Bogotá", sector: "Energía eléctrica", price: 2700, changePct: 1.2 },
  { ticker: "CELSIA", name: "Celsia", sector: "Energía eléctrica", price: 4100, changePct: 2.6 },
  { ticker: "PFDAVVNDA", name: "Davivienda", sector: "Bancos", price: 22600, changePct: -0.9 },
  { ticker: "MINEROS", name: "Mineros", sector: "Minería", price: 8900, changePct: 2.8 },
];

// Noticias del portafolio de ejemplo, ordenadas por impacto × % del dinero.
export const NEWS_SAMPLE: NewsItem[] = [
  {
    id: 1,
    ticker: "ECOPETROL",
    assetName: "Ecopetrol",
    direction: "Negativo",
    impact: "Alta",
    title: "El petróleo baja de precio y Ecopetrol lo siente",
    summary: "El precio del petróleo es clave para Ecopetrol. Si baja, la empresa recibe menos por cada barril.",
    whyItAffects: "Si el petróleo baja, Ecopetrol recibe menos plata por cada barril que vende.",
    whatToWatch: "El precio del petróleo.",
    source: "Resumen de mercado",
    weightPct: 32.8,
  },
  {
    id: 5,
    ticker: "ISA",
    assetName: "ISA",
    direction: "Positivo",
    impact: "Alta",
    title: "ISA gana un contrato para nuevas líneas de energía",
    summary: "Construir y operar líneas eléctricas le asegura ingresos durante muchos años.",
    whyItAffects: "Los contratos de energía le aseguran ingresos durante muchos años.",
    whatToWatch: "Cómo avanzan las obras de esas líneas.",
    source: "Resumen de mercado",
    weightPct: 22.9,
  },
  {
    id: 3,
    ticker: "PFBCOLOM",
    assetName: "Bancolombia",
    direction: "Positivo",
    impact: "Media",
    title: "Bancolombia gana más por los préstamos que entrega",
    summary: "Cuando más personas piden préstamos y los pagan a tiempo, el banco gana más.",
    whyItAffects: "Cuando entrega más préstamos y se los pagan, el banco gana más.",
    whatToWatch: "Cuántos préstamos entrega y cuántos le pagan a tiempo.",
    source: "Resumen de mercado",
    weightPct: 26.8,
  },
  {
    id: 8,
    ticker: "GRUPOSURA",
    assetName: "Grupo Sura",
    direction: "Neutro",
    impact: "Media",
    title: "Grupo Sura presenta resultados parecidos a los del año pasado",
    summary: "Sus seguros y sus inversiones dejaron ganancias similares. No hubo sorpresas.",
    whyItAffects: "Sus ganancias son parecidas a las del año pasado, sin sorpresas.",
    whatToWatch: "Cuánto ganan sus seguros y sus inversiones.",
    source: "Resumen de mercado",
    weightPct: 17.5,
  },
  {
    id: 2,
    ticker: "ECOPETROL",
    assetName: "Ecopetrol",
    direction: "Positivo",
    impact: "Baja",
    title: "Ecopetrol produce un poco más de petróleo este mes",
    summary: "Producir más significa tener más petróleo disponible. El efecto es pequeño por ahora.",
    whyItAffects: "Con más petróleo para vender, la empresa puede recibir más plata.",
    whatToWatch: "Cuánto petróleo produce cada mes.",
    source: "Resumen de mercado",
    weightPct: 32.8,
  },
];

/** Un año de cierres de prueba que terminan en `end`, con una tendencia suave. */
export function samplePrices(end: number, trend: number, seed = 7): PricePoint[] {
  const points: PricePoint[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const days = 365;
  const start = new Date("2025-10-23T12:00:00");
  let price = end / (1 + trend);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    price *= 1 + trend / 250 + (rand() - 0.5) * 0.02;
    points.push({ date: d.toISOString().slice(0, 10), price: Math.round(price) });
  }
  // Ajuste para que el último cierre sea exactamente `end`.
  const factor = end / points[points.length - 1].price;
  return points.map((p) => ({ ...p, price: Math.round(p.price * factor) }));
}

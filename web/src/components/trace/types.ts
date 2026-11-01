// Formas de datos que reciben los componentes de esta carpeta.
// Los componentes no piden datos a la API: los reciben por props.

export type NewsDirection = "Positivo" | "Negativo" | "Neutro";
export type NewsImpact = "Alta" | "Media" | "Baja";

export type NewsItem = {
  id: number | string;
  ticker: string;
  /** Nombre de la empresa, por ejemplo «Ecopetrol». */
  assetName: string;
  direction: NewsDirection;
  impact: NewsImpact;
  title: string;
  summary: string;
  whyItAffects?: string;
  whatToWatch?: string;
  source?: string;
  /** Qué % de tu dinero está en esa acción (0 a 100). */
  weightPct?: number;
};

export type PricePoint = {
  /** Fecha en formato AAAA-MM-DD. */
  date: string;
  /** Precio de cierre en pesos. */
  price: number;
};

export type PriceRange = "1m" | "3m" | "1y";

export type MarketAsset = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  /** Cambio del día en %. */
  changePct: number;
};

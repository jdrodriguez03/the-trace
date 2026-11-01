// Un color fijo por sector, igual al prototipo. Los colores viven en index.css.
const SECTOR_COLORS: Record<string, string> = {
  "Petróleo y energía": "var(--sector-petroleo)",
  Bancos: "var(--sector-bancos)",
  "Energía eléctrica": "var(--sector-electrica)",
  "Seguros e inversiones": "var(--sector-seguros)",
  Construcción: "var(--sector-construccion)",
  Minería: "var(--sector-mineria)",
};

/** Color del sector; si no está en la lista, un gris neutro. */
export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? "var(--muted-ink)";
}

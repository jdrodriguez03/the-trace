import { copy } from "@/content/copy";

export const BOGOTA = "America/Bogota";

/** ¿La Bolsa está abierta? De lunes a viernes, de 8:00 a. m. a 5:00 p. m. (hora de Colombia). */
export function isMarketOpen(now: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOGOTA,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const weekdayOk = !["Sat", "Sun"].includes(weekday);
  return weekdayOk && minutes >= 8 * 60 && minutes < 17 * 60;
}

/** Texto de la hora del precio, por ejemplo «Actualizado hace 8 min · puede tener unos 15 min de retraso». */
export function freshnessText(updatedAt: Date, now: Date): string {
  if (!isMarketOpen(now)) {
    const date = new Intl.DateTimeFormat("es-CO", { timeZone: BOGOTA, day: "numeric", month: "long" }).format(
      updatedAt,
    );
    return copy.freshness.closed(date);
  }
  const min = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / 60000));
  const ago =
    min < 1 ? copy.freshness.justNow : min < 60 ? copy.freshness.minutesAgo(min) : copy.freshness.hoursAgo(Math.floor(min / 60));
  return `${ago} · ${copy.freshness.delay}`;
}


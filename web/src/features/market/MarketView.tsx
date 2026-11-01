import { DirectionChip } from "@/components/trace/DirectionChip";
import { cop, pctAbs } from "@/components/trace/format-provisional";
import { PriceFreshness } from "@/components/trace/PriceFreshness";
import { sectorColor } from "@/components/trace/sector-colors";
import type { MarketAsset } from "@/components/trace/types";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

type MarketViewProps = {
  assets: MarketAsset[];
  updatedAt: string | null;
  onOpenAsset?: (ticker: string) => void;
  /** Hora actual. Solo para la galería. */
  now?: Date;
};

/** Fondo del mapa de calor: más intenso entre más se movió (igual al prototipo). */
function heatBackground(change: number) {
  const a = Math.min(Math.abs(change) / 3, 1);
  if (change > 0) return `rgba(11, 122, 78, ${(0.06 + a * 0.15).toFixed(3)})`;
  if (change < 0) return `rgba(180, 69, 47, ${(0.06 + a * 0.13).toFixed(3)})`;
  return "var(--sunken)";
}

/** Pantalla Mercado colombiano, sin pedir datos: los recibe por props. */
export function MarketView({ assets, updatedAt, onOpenAsset, now }: MarketViewProps) {
  const sorted = [...assets].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const heat = sorted.slice(0, 9);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-[26px] font-extrabold tracking-tight">{copy.market.title}</h1>
          <p className="text-muted-foreground">{copy.market.subtitle}</p>
          {updatedAt ? <PriceFreshness updatedAt={updatedAt} now={now} /> : null}
        </div>
        <span className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-[13px] text-muted-foreground">
          <strong className="mr-1 text-foreground">{copy.market.count(assets.length)}</strong>
          {copy.market.countSuffix}
        </span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 pt-4 sm:px-5">
            <h2 className="text-lg font-bold tracking-tight">{copy.market.moversTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.market.moversSubtitle}</p>
          </div>
          <ul className="mt-2">
            {sorted.map((a) => (
              <li key={a.ticker} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => onOpenAsset?.(a.ticker)}
                  aria-label={copy.market.seeAsset(a.name)}
                  className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-hover sm:px-5"
                >
                  <strong className="truncate font-semibold">{a.name}</strong>
                  <span className="tnum text-right font-semibold">{cop(a.price)}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span>{a.ticker}</span>
                    <span aria-hidden="true">·</span>
                    <i
                      className="size-2 flex-none rounded-[2px]"
                      style={{ background: sectorColor(a.sector) }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{a.sector}</span>
                  </span>
                  <DirectionChip change={a.changePct} className="justify-self-end" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 className="text-lg font-bold tracking-tight">{copy.market.heatTitle}</h2>
          <p className="text-sm text-muted-foreground">{copy.market.heatSubtitle}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {heat.map((a) => (
              <button
                key={a.ticker}
                type="button"
                onClick={() => onOpenAsset?.(a.ticker)}
                aria-label={copy.market.seeAsset(a.name)}
                className="grid min-h-20 content-between gap-1 rounded-md p-2.5 text-left transition-transform hover:-translate-y-px"
                style={{ background: heatBackground(a.changePct) }}
              >
                <span className="truncate text-[13px] font-semibold">{a.name}</span>
                <span
                  className={cn(
                    "tnum text-[13px] font-bold",
                    a.changePct > 0 ? "text-up" : a.changePct < 0 ? "text-down" : "text-muted-foreground",
                  )}
                >
                  {a.changePct > 0 ? "▲" : a.changePct < 0 ? "▼" : "●"} {pctAbs(a.changePct)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

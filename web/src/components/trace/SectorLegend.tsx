import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import { sectorColor } from "./sector-colors";

export type SectorItem = {
  /** Nombre del sector, igual al catálogo. */
  sector: string;
  /** Qué % de tu dinero está en ese sector, de 0 a 100. */
  percent: number;
};

type SectorLegendProps = {
  sectors: SectorItem[];
  /** Sector seleccionado, o "all" para todos. */
  selected?: string;
  /** Se llama al tocar un sector. Sin esto, la lista solo se muestra. */
  onSelect?: (sector: string) => void;
  className?: string;
};

function pctText(p: number) {
  if (p > 0 && p < 1) return `${copy.weight.lessThanOne}\u00a0%`;
  return `${Math.round(p)}\u00a0%`;
}

/** Lista de sectores con su color y su %, que se puede tocar para filtrar. */
export function SectorLegend({ sectors, selected = "all", onSelect, className }: SectorLegendProps) {
  return (
    <ul className={cn("grid gap-1", className)}>
      {sectors.map(({ sector, percent }) => {
        const isSelected = selected === sector;
        return (
          <li key={sector}>
            <button
              type="button"
              disabled={!onSelect}
              aria-pressed={onSelect ? isSelected : undefined}
              onClick={() => onSelect?.(isSelected ? "all" : sector)}
              className={cn(
                "flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm transition-colors",
                "enabled:hover:bg-hover disabled:cursor-default",
                isSelected && "bg-brand-soft",
              )}
            >
              <span
                className="size-2 flex-none rounded-[2px]"
                style={{ background: sectorColor(sector) }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-ink-2">{sector}</span>
              <span className="tnum font-semibold text-foreground">{pctText(percent)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

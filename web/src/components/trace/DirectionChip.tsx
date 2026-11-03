import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import { pctAbs } from "./format-provisional";

type DirectionChipProps = {
  /** Cambio en %, por ejemplo -1.4. */
  change: number;
  /** Si es false, solo muestra «▲ Subió» sin el porcentaje. */
  showPercent?: boolean;
  className?: string;
};

/** Chip de dirección: ▲ Subió (verde), ▼ Bajó (coral) o ● Igual (gris). */
export function DirectionChip({ change, showPercent = true, className }: DirectionChipProps) {
  const rounded = Number(change.toFixed(1));
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const icon = dir === "up" ? "▲" : dir === "down" ? "▼" : "●";
  const styles = {
    up: "bg-up-soft text-up",
    down: "bg-down-soft text-down",
    flat: "bg-flat-soft text-ink-2",
  }[dir];

  return (
    <span
      className={cn(
        "tnum inline-flex h-6 items-center gap-1 rounded-[5px] px-2 text-[12.5px] font-bold whitespace-nowrap",
        styles,
        className,
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {copy.direction[dir]}
      {showPercent && dir !== "flat" ? ` ${pctAbs(change)}` : null}
    </span>
  );
}

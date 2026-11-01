import { cn } from "@/lib/utils";

import { cop, pct } from "./format-provisional";

type GainLossProps = {
  /** Ganancia (positiva) o pérdida (negativa) en pesos. */
  amount: number;
  /** La misma ganancia o pérdida en %. */
  percent: number;
  /** Decimales del %. Por defecto 1; para el cambio del día, 2. */
  decimals?: number;
  className?: string;
};

/** Ganancia o pérdida: «▲ $20.000 · +10,0 %» en verde, o en coral si pierde. */
export function GainLoss({ amount, percent, decimals = 1, className }: GainLossProps) {
  const rounded = Math.round(amount);
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const icon = dir === "up" ? "▲" : dir === "down" ? "▼" : "●";
  const color = { up: "text-up", down: "text-down", flat: "text-muted-foreground" }[dir];

  return (
    <span className={cn("tnum inline-flex items-center gap-1 font-semibold whitespace-nowrap", color, className)}>
      <span aria-hidden="true">{icon}</span>
      {cop(Math.abs(amount))} · {pct(percent, decimals)}
    </span>
  );
}

import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

type WeightBarProps = {
  /** Qué % de tu dinero está en esta acción, de 0 a 100. */
  percent: number;
  /** Color de la barra. Por defecto, el del sector o el azul de marca. */
  color?: string;
  className?: string;
};

function weightText(p: number) {
  if (p > 0 && p < 1) return `${copy.weight.lessThanOne}\u00a0%`;
  return `${Math.round(p)}\u00a0%`;
}

/** Barra de «Qué parte de tu dinero». */
export function WeightBar({ percent, color = "var(--brand)", className }: WeightBarProps) {
  const width = Math.max(0, Math.min(percent, 100));
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted-foreground">
        <span>{copy.weight.label}</span>
        <strong className="tnum font-semibold text-foreground">{weightText(percent)}</strong>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-hover"
        role="meter"
        aria-label={copy.weight.label}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

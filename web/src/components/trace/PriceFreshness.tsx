import { cn } from "@/lib/utils";

import { freshnessText, isMarketOpen } from "./freshness";

type PriceFreshnessProps = {
  /** Hora del último precio (updated_at de la API), en formato ISO. */
  updatedAt: string | Date;
  /** Hora actual. Solo para pruebas y la galería; por defecto, ahora. */
  now?: Date;
  className?: string;
};

/** Dice de cuándo es el último precio, con el aviso del retraso. */
export function PriceFreshness({ updatedAt, now, className }: PriceFreshnessProps) {
  const date = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  const open = isMarketOpen(now ?? new Date());
  return (
    <p className={cn("inline-flex items-center gap-2 text-[13px] text-muted-foreground", className)}>
      <span
        aria-hidden="true"
        className={cn("size-2 flex-none rounded-full", open ? "bg-up ring-[3px] ring-up-soft" : "bg-faint")}
      />
      {freshnessText(date, now ?? new Date())}
    </p>
  );
}

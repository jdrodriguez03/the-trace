import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import { PlanSheet, type NotifyPlan } from "./PlanSheet";

type AdSlotProps = {
  /** Corrimiento para que Hoy y Mi portafolio no muestren el mismo anuncio. Hoy: 0, Mi portafolio: 1. */
  offset?: number;
  /** Fecha del día. Solo para la galería; por defecto, hoy. */
  date?: Date;
  /** Guarda el «Avísame» de Trace+ (POST /v1/waitlist/trace-plus). */
  onNotifyPlan?: NotifyPlan;
  className?: string;
};

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Anuncio de ejemplo. Rota según el día y nunca lee el portafolio.
 * Va solo en Hoy y en Mi portafolio.
 */
export function AdSlot({ offset = 0, date, onNotifyPlan, className }: AdSlotProps) {
  const [planOpen, setPlanOpen] = useState(false);
  const items = copy.ads.items;
  const ad = items[(dayOfYear(date ?? new Date()) + offset) % items.length];

  return (
    <aside aria-label={copy.ads.label} className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-[5px] bg-sunken px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
          {copy.ads.label}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setPlanOpen(true)}>
          {copy.ads.remove}
        </Button>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid size-11 flex-none place-items-center rounded-md text-sm font-extrabold text-ink"
          style={{ background: ad.color }}
        >
          {ad.initials}
        </div>
        <div>
          <p className="font-semibold">{ad.brand}</p>
          <p className="text-sm text-ink-2">{ad.line}</p>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] text-muted-foreground">{copy.ads.note}</p>
      <PlanSheet open={planOpen} onOpenChange={setPlanOpen} onNotify={onNotifyPlan} />
    </aside>
  );
}

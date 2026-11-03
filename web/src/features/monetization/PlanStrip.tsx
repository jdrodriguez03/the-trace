import { useState } from "react";

import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

import { PlanSheet, type NotifyPlan } from "./PlanSheet";

/** Franja «Trace+ · Quita los anuncios y recibe alertas.» que abre la hoja del plan. */
type PlanStripProps = {
  /** Guarda el «Avísame» de Trace+ (POST /v1/waitlist/trace-plus). */
  onNotifyPlan?: NotifyPlan;
  className?: string;
};

export function PlanStrip({ onNotifyPlan, className }: PlanStripProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg border border-strip-line bg-strip px-4 py-3 text-left text-sm text-strip-ink",
          className,
        )}
      >
        <strong className="font-bold">{copy.plan.stripTitle}</strong>
        <span>{copy.plan.stripText}</span>
        <span aria-hidden="true" className="ml-auto">
          ›
        </span>
      </button>
      <PlanSheet open={open} onOpenChange={setOpen} onNotify={onNotifyPlan} />
    </>
  );
}

// Hoja de Trace+: 4 beneficios, «Avísame cuando esté listo» y «Ahora no». No cobra nada.
// Dueña: Isabela. No llama a la API: recibe `onNotify`, que en la app hace
// POST /v1/waitlist/trace-plus con el cliente de Juan Angel (web/src/api/).

import { Dialog } from "radix-ui";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";

export type NotifyPlan = () => Promise<unknown> | void;

type PlanSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guarda el «Avísame». Si falla, la hoja muestra el error. */
  onNotify?: NotifyPlan;
};

export function PlanSheet({ open, onOpenChange, onNotify }: PlanSheetProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function notify() {
    setStatus("saving");
    try {
      await onNotify?.();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function change(next: boolean) {
    if (!next) setStatus("idle");
    onOpenChange(next);
  }

  return (
    <Dialog.Root open={open} onOpenChange={change}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto grid max-h-[90dvh] w-full max-w-lg gap-4 overflow-y-auto rounded-t-2xl bg-card px-5 pt-3 pb-6 shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-line-2" />
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-extrabold tracking-tight">{copy.plan.title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={copy.nav.close}>
                <span aria-hidden="true">✕</span>
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-[15px] text-ink-2">{copy.plan.text}</Dialog.Description>
          <ul className="grid gap-2.5">
            {copy.plan.benefits.map((b) => (
              <li key={b} className="flex gap-2.5 text-[15px]">
                <span aria-hidden="true" className="font-bold text-up">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          {status === "done" ? (
            <p role="status" className="rounded-md bg-up-soft px-3 py-2.5 text-sm font-medium text-up">
              {copy.plan.notified}
            </p>
          ) : (
            <div className="grid gap-2">
              {status === "error" ? (
                <p role="alert" className="text-sm text-down">
                  {copy.plan.notifyError}
                </p>
              ) : null}
              <Button size="lg" onClick={notify} disabled={status === "saving"}>
                {copy.plan.notify}
              </Button>
              <Button variant="ghost" onClick={() => change(false)}>
                {copy.plan.later}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

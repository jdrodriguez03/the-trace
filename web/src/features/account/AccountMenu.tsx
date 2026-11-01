// Menú del avatar: correo o «Invitado», Mi portafolio, Plan Trace+, Empezar de nuevo y Cerrar sesión.
// Dueña: Isabela. No llama a la API ni a Supabase: recibe las acciones por props.
// Juan Angel lo pone en la barra superior y le pasa:
//   onReset  → POST /v1/portfolio/reset y luego navegar a /onboarding
//   onLogout → supabase.auth.signOut() y luego navegar a /login
//   onGoPortfolio → navegar a /portafolio
//   onNotifyPlan → POST /v1/waitlist/trace-plus

import { Dialog, DropdownMenu } from "radix-ui";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { copy } from "@/content/copy";
import { PlanSheet, type NotifyPlan } from "@/features/monetization/PlanSheet";

type AccountMenuProps = {
  /** Correo de la persona. Vacío o null si entró como invitada. */
  email?: string | null;
  onGoPortfolio?: () => void;
  onReset?: () => Promise<unknown> | void;
  onLogout?: () => Promise<unknown> | void;
  onNotifyPlan?: NotifyPlan;
};

const itemClass =
  "flex min-h-11 cursor-pointer items-center rounded-md px-3 text-[15px] outline-none select-none data-[highlighted]:bg-hover";

function initials(email?: string | null) {
  return email ? email.split("@")[0].slice(0, 2).toUpperCase() : "TR";
}

export function AccountMenu({ email, onGoPortfolio, onReset, onLogout, onNotifyPlan }: AccountMenuProps) {
  const [planOpen, setPlanOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "saving" | "error">("idle");
  const [logoutError, setLogoutError] = useState(false);

  async function confirmReset() {
    setResetStatus("saving");
    try {
      await onReset?.();
      setResetStatus("idle");
      setResetOpen(false);
    } catch {
      setResetStatus("error");
    }
  }

  async function logout() {
    setLogoutError(false);
    try {
      await onLogout?.();
    } catch {
      setLogoutError(true);
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={copy.account.menuLabel}
            className="grid size-11 place-items-center rounded-full bg-ink text-[13px] font-bold text-white hover:bg-ink-2"
          >
            {initials(email)}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 grid w-64 gap-0.5 rounded-lg border border-border bg-popover p-1.5 shadow-xl"
          >
            <div className="grid gap-0.5 px-3 py-2">
              <span className="truncate font-semibold">{email || copy.account.guest}</span>
              <span className="text-xs text-muted-foreground">
                {email ? copy.account.userSub : copy.account.guestSub}
              </span>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item className={itemClass} onSelect={() => onGoPortfolio?.()}>
              {copy.account.portfolio}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={() => setPlanOpen(true)}>
              {copy.account.plan}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={() => setResetOpen(true)}>
              {copy.account.reset}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item className={`${itemClass} text-down`} onSelect={logout}>
              {copy.account.logout}
            </DropdownMenu.Item>
            {logoutError ? (
              <p role="alert" className="px-3 py-1.5 text-sm text-down">
                {copy.account.logoutError}
              </p>
            ) : null}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Root open={resetOpen} onOpenChange={setResetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Dialog.Content
            role="alertdialog"
            className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-3 rounded-lg bg-card p-5 shadow-xl"
          >
            <Dialog.Title className="text-lg font-bold">{copy.account.resetTitle}</Dialog.Title>
            <Dialog.Description className="text-ink-2">{copy.account.resetText}</Dialog.Description>
            {resetStatus === "error" ? (
              <p role="alert" className="text-sm text-down">
                {copy.account.resetError}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary">{copy.account.resetCancel}</Button>
              </Dialog.Close>
              <Button onClick={confirmReset} disabled={resetStatus === "saving"}>
                {copy.account.resetConfirm}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <PlanSheet open={planOpen} onOpenChange={setPlanOpen} onNotify={onNotifyPlan} />
    </>
  );
}

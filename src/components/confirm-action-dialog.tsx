"use client";

import { useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function ConfirmActionDialog({
  locale,
  title,
  description,
  confirmLabel,
  triggerLabel,
  triggerTestId,
  dialogTestId,
  action,
  danger = false,
}: {
  locale: AppLocale;
  title: string;
  description?: string;
  confirmLabel: string;
  triggerLabel: string;
  triggerTestId?: string;
  dialogTestId?: string;
  action: (formData: FormData) => void | Promise<void>;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid={triggerTestId}
        onClick={() => setOpen(true)}
        className={
          danger
            ? "text-sm hover:underline"
            : "rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm"
        }
      >
        {triggerLabel}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        testId={dialogTestId ?? "confirm-dialog"}
      >
        {description ? (
          <p className="mb-3 text-sm text-[var(--color-foreground)]/70">{description}</p>
        ) : null}
        <form action={action} className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)]"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 rounded-xl border border-[var(--color-border)] px-4 py-2"
          >
            {t(locale, "Cancel", "ביטול")}
          </button>
        </form>
      </Dialog>
    </>
  );
}

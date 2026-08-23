"use client";

import {
  useEffect,
  useId,
  type ReactNode,
} from "react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  testId = "app-dialog",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-0 sm:items-start sm:p-4"
      data-testid={`${testId}-overlay`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        onClick={(event) => event.stopPropagation()}
        className="mt-0 flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:mt-10 sm:rounded-2xl"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ borderBlockEnd: "1px solid var(--color-border)" }}
        >
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-testid={`${testId}-close`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--color-border)] text-sm"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

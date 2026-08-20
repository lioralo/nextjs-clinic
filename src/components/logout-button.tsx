"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({
  locale,
  label,
}: {
  locale: "en" | "he";
  label: string;
}) {
  return (
    <button
      type="button"
      data-testid="logout"
      onClick={() => void signOut({ callbackUrl: `/${locale}/login` })}
      className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium"
      style={{ borderColor: "var(--color-border)" }}
    >
      {label}
    </button>
  );
}

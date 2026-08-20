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
      className="rounded-full px-3 py-1.5 text-sm border"
      style={{ borderColor: "var(--color-border)" }}
    >
      {label}
    </button>
  );
}

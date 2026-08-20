import Image from "next/image";
import Link from "next/link";

import { clinicName } from "@/lib/brand";
import type { AppLocale } from "@/lib/locale";

const SIZES = {
  sm: 32,
  md: 40,
  lg: 96,
} as const;

export function ClinicBrand({
  locale,
  href,
  size = "md",
  showName = true,
  preload = false,
}: {
  locale: AppLocale;
  href: string;
  size?: keyof typeof SIZES;
  showName?: boolean;
  preload?: boolean;
}) {
  const px = SIZES[size];
  const name = clinicName(locale);

  return (
    <Link
      href={href}
      data-testid={preload ? "clinic-logo" : undefined}
      className="flex min-h-11 items-center gap-3 rounded-xl text-[var(--color-foreground)] no-underline"
    >
      <Image
        src="/logo.png"
        alt={name}
        width={px}
        height={px}
        preload={preload || undefined}
        className="rounded-xl object-contain"
      />
      {showName ? (
        <span
          className={
            size === "lg"
              ? "text-2xl font-semibold"
              : "hidden text-base font-semibold sm:inline md:text-lg"
          }
        >
          {name}
        </span>
      ) : null}
    </Link>
  );
}

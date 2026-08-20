import type { Metadata } from "next";
import { headers } from "next/headers";
import { Heebo, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { clinicDescription, clinicName } from "@/lib/brand";
import { localeToDir, normalizeLocale } from "@/lib/locale";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: clinicName("he"),
    template: `%s · ${clinicName("he")}`,
  },
  description: clinicDescription("he"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerList = await headers();
  const locale = normalizeLocale(headerList.get("x-locale") ?? "") ?? "he";
  const dir = localeToDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${plusJakartaSans.variable} ${heebo.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

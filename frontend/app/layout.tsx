import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// BUG-004: mismo logotipo oficial (public/brand/logo.png) en todos los
// puntos de la app donde se muestra una marca — favicon/app icon/Apple
// Touch Icon vienen de app/icon.png y app/apple-icon.png (convención de
// Next.js), manifest de app/manifest.ts, y Open Graph de
// app/opengraph-image.png (misma convención, genera el meta tag solo).
export const metadata: Metadata = {
  title: "AI Inventory Agent",
  description: "Control de inventario con fotografía y voz, impulsado por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/store/provider";
import { SessionBootstrap } from "@/components/layout/session-bootstrap";
import { ThemeSync } from "@/components/layout/theme-sync";
import { ThemeBootstrap } from "@/components/layout/theme-bootstrap";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FidelOS",
  description: "FidelOS — control de inventario",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${hankenGrotesk.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head><ThemeBootstrap /></head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <StoreProvider>
          <SessionBootstrap />
          <ThemeSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}

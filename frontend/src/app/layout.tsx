import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/store/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionBootstrap } from "@/components/layout/session-bootstrap";
import { ThemeSync } from "@/components/layout/theme-sync";

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
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="fidelos-theme">
          <TooltipProvider>
            <StoreProvider>
              <SessionBootstrap />
              <ThemeSync />
              {children}
            </StoreProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

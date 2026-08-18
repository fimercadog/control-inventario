import type { ReactNode } from "react";

/**
 * Shared shell for Login/Olvide-password/Restablecer-password (§25: "el Login
 * es la primera impresión del producto"). Split layout on md+ (brand panel +
 * auth card, common enterprise auth pattern); collapses to just the card on
 * mobile. No commercial claims — the brand panel only states what the
 * product is, not unverified benefits.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen bg-background">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgb(255 255 255 / 0.16), transparent 32rem), radial-gradient(circle at 85% 85%, rgb(255 255 255 / 0.1), transparent 28rem)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15 text-lg font-bold shadow-inner">F</div>
          <div>
            <div className="text-lg font-bold tracking-tight">FidelOS</div>
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary-foreground/70">CRM + INVENTARIO</div>
          </div>
        </div>
        <div className="relative flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Control de inventario y CRM en un solo lugar.</h1>
          <p className="max-w-sm text-sm text-primary-foreground/75 text-pretty">
            Gestiona productos, stock, clientes y oportunidades comerciales desde una sola plataforma.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">FidelOS · Beta</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-1 text-center md:hidden">
            <div className="mb-2 grid size-10 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">F</div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">FidelOS</span>
          </div>
          <div className="rounded-2xl border border-border bg-surface-container-lowest p-8 shadow-[var(--shadow-elevation-2)]">
            <div className="mb-8 flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}

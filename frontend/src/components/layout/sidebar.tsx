import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";
import { BetaNotice } from "@/components/layout/beta-notice";

export function Sidebar() {
  return (
    <aside className="z-10 hidden w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-[8px_0_28px_rgb(0_0_0/0.12)] md:flex">
      <div className="mb-5 flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-[0_5px_12px_rgb(0_0_0/0.25)]">F</div>
        <div>
          <div className="text-lg font-bold tracking-tight text-sidebar-foreground">FidelOS</div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/60">CRM + INVENTARIO</div>
        </div>
      </div>
      <div className="mb-4"><BetaNotice /></div>
      <div className="mb-5"><ContingenciaControls /></div>
      <div className="min-h-0 flex-1 overflow-y-auto"><SidebarNav /></div>
    </aside>
  );
}

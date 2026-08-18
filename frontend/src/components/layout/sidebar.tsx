import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";

export function Sidebar() {
  return (
    <aside className="hidden w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">F</div>
        <div><div className="text-lg font-bold tracking-tight text-foreground">FidelOS</div><div className="text-[10px] font-semibold tracking-[0.18em] text-primary">INVENTARIO</div></div>
      </div>
      <div className="mb-5"><ContingenciaControls /></div>
      <SidebarNav />
    </aside>
  );
}

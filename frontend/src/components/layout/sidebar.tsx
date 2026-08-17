import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background p-4 md:flex">
      <div className="mb-4 px-2 text-lg font-semibold tracking-tight text-foreground">FidelOS</div>
      <div className="mb-5"><ContingenciaControls /></div>
      <SidebarNav />
    </aside>
  );
}

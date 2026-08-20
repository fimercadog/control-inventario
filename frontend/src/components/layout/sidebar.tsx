import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";
import { BetaNotice } from "@/components/layout/beta-notice";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function Sidebar() {
  return (
    <ShadcnSidebar collapsible="offcanvas" className="border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-4 pb-0">
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-[0_5px_12px_rgb(0_0_0/0.25)]">F</div>
        <div>
          <div className="text-lg font-bold tracking-tight text-sidebar-foreground">FidelOS</div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/60">CRM + INVENTARIO</div>
        </div>
      </div>
      </SidebarHeader>
      <SidebarContent className="gap-4 p-4">
        <BetaNotice />
        <ContingenciaControls />
        <SidebarNav />
      </SidebarContent>
    </ShadcnSidebar>
  );
}

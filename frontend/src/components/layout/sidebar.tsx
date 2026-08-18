import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";

export function Sidebar() {
  return (
    <aside className="hidden w-68 shrink-0 flex-col border-r border-[#30334e] bg-[#1a1c2e] p-4 text-slate-100 dark:border-[#303030] dark:bg-[#111111] [&_nav_a:not([aria-current=page])]:text-slate-300 [&_nav_a:not([aria-current=page]):hover]:bg-white/8 [&_nav_a:not([aria-current=page]):hover]:text-white [&_nav_span]:text-slate-400 md:flex">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-sm">F</div>
        <div><div className="text-lg font-bold tracking-tight text-white">FidelOS</div><div className="text-[10px] font-semibold tracking-[0.18em] text-indigo-300">INVENTARIO</div></div>
      </div>
      <div className="mb-5"><ContingenciaControls /></div>
      <SidebarNav />
    </aside>
  );
}

import { CircleAlert } from "lucide-react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";
import { BetaNotice } from "@/components/layout/beta-notice";

export function Sidebar() {
  return (
    <aside className="z-10 hidden w-68 shrink-0 flex-col border-r border-[#30334e] bg-[#1a1c2e] p-4 text-slate-100 shadow-[8px_0_28px_rgb(26_28_46/0.1)] dark:border-[#303030] dark:bg-[#111111] dark:shadow-[8px_0_28px_rgb(0_0_0/0.2)] [&_nav_a:not([aria-current=page])]:text-slate-300 [&_nav_a:not([aria-current=page]):hover]:bg-white/8 [&_nav_a:not([aria-current=page]):hover]:text-white [&_nav_span]:text-slate-400 md:flex">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-[0_5px_12px_rgb(99_102_241/0.35)]">F</div>
        <div>
          <div className="flex items-center gap-2"><div className="text-lg font-bold tracking-tight text-white">FidelOS</div><span className="inline-flex items-center gap-1 rounded-md border border-amber-300/45 bg-amber-400 px-2 py-1 text-[9px] font-extrabold tracking-[0.1em] text-amber-950 shadow-[0_3px_10px_rgb(251_191_36/0.28)]"><CircleAlert className="size-3" />VERSIÓN BETA</span></div>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-indigo-300">INVENTARIO</div>
        </div>
      </div>
      <div className="mb-5"><ContingenciaControls /></div>
      <div className="min-h-0 flex-1 overflow-y-auto"><SidebarNav /></div>
      <div className="mt-4 border-t border-white/10 pt-4"><BetaNotice /></div>
    </aside>
  );
}

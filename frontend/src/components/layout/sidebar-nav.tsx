"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { can } from "@/lib/permissions/can";
import { navItems } from "@/components/layout/nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const permissions = useAppSelector((state) => state.session.user?.permissions ?? []);

  const visibleItems = navItems.filter(
    (item) => !item.permission || can(permissions, item.permission)
  );

  // Groups items in navItems' own order (manual.html sección 5: General/Inventario/
  // Terceros/Administración) without reordering — an item with no group renders as its
  // own unlabeled section, so ungrouped items keep working exactly as before.
  const sections: { group: string | undefined; items: typeof visibleItems }[] = [];
  for (const item of visibleItems) {
    const last = sections[sections.length - 1];
    if (last && last.group === item.group) {
      last.items.push(item);
    } else {
      sections.push({ group: item.group, items: [item] });
    }
  }

  return (
    <nav className="flex flex-col gap-4" aria-label="Navegación principal">
      {sections.map((section, index) => (
        <div key={section.group ?? `ungrouped-${index}`} className="flex flex-col gap-1">
          {section.group ? (
            <span className="px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
              {section.group}
            </span>
          ) : null}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

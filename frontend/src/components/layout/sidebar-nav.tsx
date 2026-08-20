"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { can } from "@/lib/permissions/can";
import { navItems } from "@/components/layout/nav-items";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
    <nav aria-label="Navegación principal">
      {sections.map((section, index) => (
        <SidebarGroup key={section.group ?? `ungrouped-${index}`} className="p-0">
          {section.group ? (
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent><SidebarMenu>{section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton render={<Link href={item.href} />} onClick={onNavigate} isActive={isActive} tooltip={item.label}>
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}

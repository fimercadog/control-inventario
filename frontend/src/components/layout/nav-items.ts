import { LayoutDashboard, Shield, Tag, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission required for this item to be visible. Omit if always visible. */
  permission?: string;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categorias", label: "Categorías", icon: Tag, permission: "categorias.ver" },
  { href: "/proveedores", label: "Proveedores", icon: Truck, permission: "proveedores.ver" },
  { href: "/usuarios", label: "Usuarios", icon: Users, permission: "usuarios.ver" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles.ver" },
];

import {
  Award,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Repeat,
  Ruler,
  Shield,
  Sparkles,
  Tag,
  Truck,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Permission required for this item to be visible. Omit if always visible. */
  permission?: string;
  /**
   * Sidebar group, per manual.html section 5 ("Navegación"): (General) / Inventario /
   * Terceros / Administración. Omit for a top-level item outside all groups. Only modules
   * that actually have a real frontend page belong here — never a placeholder link
   * (memoria: "No placeholder modules, ever").
   */
  group?: "General" | "Inventario" | "Terceros" | "Administración";
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "General" },
  { href: "/reportes", label: "Reportes", icon: BarChart3, permission: "reportes.ver", group: "General" },
  { href: "/captura-ia", label: "Captura IA", icon: Sparkles, permission: "captura-ia.usar", group: "General" },

  { href: "/productos", label: "Productos", icon: Package, permission: "productos.ver", group: "Inventario" },
  { href: "/categorias", label: "Categorías", icon: Tag, permission: "categorias.ver", group: "Inventario" },
  { href: "/marcas", label: "Marcas", icon: Award, permission: "marcas.ver", group: "Inventario" },
  {
    href: "/unidades",
    label: "Unidades de Medida",
    icon: Ruler,
    permission: "unidades-medida.ver",
    group: "Inventario",
  },
  { href: "/stock", label: "Stock", icon: Boxes, permission: "stock.ver", group: "Inventario" },
  { href: "/movimientos", label: "Movimientos", icon: Repeat, permission: "movimientos.ver", group: "Inventario" },

  { href: "/proveedores", label: "Proveedores", icon: Truck, permission: "proveedores.ver", group: "Terceros" },
  { href: "/clientes", label: "Clientes", icon: UsersRound, permission: "clientes.ver", group: "Terceros" },

  { href: "/usuarios", label: "Usuarios", icon: Users, permission: "usuarios.ver", group: "Administración" },
  { href: "/roles", label: "Roles", icon: Shield, permission: "roles.ver", group: "Administración" },
  { href: "/auditoria", label: "Auditoría", icon: ClipboardList, permission: "auditoria.ver", group: "Administración" },
];

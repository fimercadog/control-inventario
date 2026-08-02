"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  Tags,
  Award,
  Ruler,
  Warehouse,
  ArrowLeftRight,
  Truck,
  Contact,
  UserCog,
  ShieldCheck,
  ScrollText,
  Settings,
  FileBarChart2,
  UserCircle,
  KeyRound,
  LogOut,
  Boxes,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/auth-slice";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AuthenticatedUser } from "@/lib/api/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Si no hay permiso en el catálogo para este módulo, es visible siempre. */
  permission?: string;
  /**
   * Módulo sin backend/frontend real todavía — sigue navegando a su
   * página real de "pendiente de implementación" (nunca desaparece del
   * sidebar), pero se marca visualmente como "Próximamente" para no
   * confundirlo con un módulo funcional. Decisión confirmada
   * explícitamente por el propietario del proyecto (2026-08-02): la
   * navegación completa del ERP debe quedar siempre visible.
   */
  pending?: boolean;
}

/**
 * Sidebar Oficial RC1 (2026-07-30). Agrupado en Inventario/Terceros/
 * Administración según lo aprobado — no es una reorganización estética,
 * es la navegación oficial del release. Módulos sin backend/frontend
 * completo todavía apuntan a una página real de "pendiente de
 * implementación" (`components/pending-module.tsx`), nunca a datos mock,
 * y quedan marcados `pending: true` (badge "Próximamente") en vez de
 * ocultarse o quitarse del menú.
 */
const TOP_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/captura", label: "Captura IA", icon: Sparkles, permission: "captura-ia.usar" },
];

const INVENTARIO_ITEMS: NavItem[] = [
  { href: "/productos", label: "Productos", icon: Package, permission: "productos.ver" },
  { href: "/categorias", label: "Categorías", icon: Tags },
  { href: "/marcas", label: "Marcas", icon: Award },
  { href: "/unidades-medida", label: "Unidades de Medida", icon: Ruler },
  { href: "/stock", label: "Stock", icon: Warehouse },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight, permission: "movimientos.ver" },
];

const TERCEROS_ITEMS: NavItem[] = [
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/clientes", label: "Clientes", icon: Contact, pending: true },
];

const ADMINISTRACION_ITEMS: NavItem[] = [
  { href: "/usuarios", label: "Usuarios", icon: UserCog, permission: "usuarios.ver" },
  { href: "/roles", label: "Roles", icon: ShieldCheck, permission: "roles.ver", pending: true },
  { href: "/auditoria", label: "Auditoría", icon: ScrollText, permission: "auditoria.ver", pending: true },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/reportes", label: "Reportes", icon: FileBarChart2, pending: true },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
];

/**
 * El catálogo de permisos hoy no cubre todos los módulos (p. ej. los
 * permisos de proveedores o categorías no están sembrados todavía), y
 * ningún módulo tiene enforcement de ruta real (docs/03_FUNCTIONAL_SPEC/Roles.md). Si el
 * usuario no tiene NINGÚN permiso asignado (rol sin permisos, o enforcement
 * simplemente no activo para esta cuenta todavía), se trata como "no
 * aplica todavía" y el módulo queda visible — nunca se oculta el sidebar
 * completo por un catálogo de permisos incompleto o sin usar.
 */
function puedeVerModulo(permiso: string | undefined, user: AuthenticatedUser | null): boolean {
  if (!permiso) return true;
  if (!user) return false;
  if (user.is_platform_admin) return true;
  if (user.permissions.length === 0) return true;
  return user.permissions.includes(permiso);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isMobile = useIsMobile();
  const menuButtonSize = isMobile ? "lg" : "default";

  async function handleLogout() {
    await dispatch(logoutThunk());
    router.push("/login");
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  function renderItems(items: NavItem[]) {
    return items
      .filter((item) => puedeVerModulo(item.permission, user))
      .map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              size={menuButtonSize}
              isActive={isActive}
              tooltip={item.pending ? `${item.label} (Próximamente)` : item.label}
              className={item.pending ? "text-muted-foreground" : undefined}
              render={
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.pending && (
                    <Badge
                      variant="outline"
                      className="ml-auto px-1.5 py-0 text-[10px] font-normal text-muted-foreground group-data-[collapsible=icon]:hidden"
                    >
                      Pronto
                    </Badge>
                  )}
                </Link>
              }
            />
          </SidebarMenuItem>
        );
      });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-4.5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Fidel OS</span>
            <span className="text-xs text-muted-foreground">AI Inventory Agent</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(TOP_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inventario</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(INVENTARIO_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Terceros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(TERCEROS_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(ADMINISTRACION_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(BOTTOM_ITEMS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size={menuButtonSize} className="h-auto py-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col items-start group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-medium">
                        {user?.name ?? "Invitado"}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.role ?? "Sin rol asignado"}
                      </span>
                    </div>
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
                    <span className="text-sm font-medium">{user?.name ?? "Invitado"}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.role ?? "Sin rol asignado"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/perfil")}>
                  <UserCircle />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/perfil/cambiar-contrasena")}>
                  <KeyRound />
                  Cambiar contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

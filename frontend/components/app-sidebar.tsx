"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
}

/**
 * Sidebar Oficial (metodología revisada 2026-08-02): "A module is either
 * COMPLETE or it does not exist in the navigation" — decisión explícita
 * del propietario del proyecto que reemplaza la regla anterior (RC1
 * 2026-07-30), que exigía mantener cada módulo del ERP visible aunque
 * fuera un placeholder "Próximamente". Esa regla queda revocada: este
 * sidebar solo lista módulos con vertical slice completo (DB real +
 * Backend + Frontend + persistencia + tests + documentación, ver
 * `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`). Un módulo
 * sin esas 6 capas completas no aparece aquí — no hay estado intermedio
 * "Próximamente"/`pending`. Cuando un módulo se construye por completo,
 * se agrega aquí en el mismo commit que lo hace real.
 */
const TOP_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reportes", label: "Reportes", icon: BarChart3, permission: "reportes.ver" },
  { href: "/captura", label: "Captura IA", icon: Sparkles, permission: "captura-ia.usar" },
];

const INVENTARIO_ITEMS: NavItem[] = [
  { href: "/productos", label: "Productos", icon: Package, permission: "productos.ver" },
  { href: "/categorias", label: "Categorías", icon: Tags, permission: "categorias.ver" },
  { href: "/marcas", label: "Marcas", icon: Award, permission: "marcas.ver" },
  { href: "/unidades-medida", label: "Unidades de Medida", icon: Ruler, permission: "unidades-medida.ver" },
  { href: "/stock", label: "Stock", icon: Warehouse, permission: "stock.ver" },
  { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight, permission: "movimientos.ver" },
];

const TERCEROS_ITEMS: NavItem[] = [
  { href: "/proveedores", label: "Proveedores", icon: Truck, permission: "proveedores.ver" },
  { href: "/clientes", label: "Clientes", icon: Contact, permission: "clientes.ver" },
];

const ADMINISTRACION_ITEMS: NavItem[] = [
  { href: "/usuarios", label: "Usuarios", icon: UserCog, permission: "usuarios.ver" },
  { href: "/roles", label: "Roles", icon: ShieldCheck, permission: "roles.ver" },
  { href: "/auditoria", label: "Auditoría", icon: ScrollText, permission: "auditoria.ver" },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

/**
 * Fase 4.5/4.6 (docs/security/ROLES_MATRIX.md) ya sembraron y enforced
 * permiso real para todos los módulos de negocio existentes — cada item
 * de arriba con `permission` usa el `.ver` real de su Policy.
 *
 * Si el usuario no tiene NINGÚN permiso asignado (rol recién creado sin
 * permisos todavía, o cuenta sin rol), se trata como "no aplica todavía"
 * y el módulo queda visible — nunca se oculta el sidebar completo por un
 * rol vacío. El Platform Super Admin (`is_platform_admin`) siempre ve
 * todo, sin excepción — el RBAC por permiso solo limita usuarios
 * normales de una empresa.
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
              tooltip={item.label}
              render={
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
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
                <DropdownMenuItem onClick={() => router.push("/configuracion")}>
                  <Settings />
                  Configuración
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

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, MessageSquarePlus, PanelLeft, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ContingenciaControls } from "@/components/layout/contingencia-controls";
import { BetaNotice } from "@/components/layout/beta-notice";
import { ThemeMenu } from "@/components/layout/theme-menu";
import { useAppDispatch } from "@/store/hooks";
import { useSessionUser } from "@/hooks/use-permission";
import { logout } from "@/store/slices/session-slice";
import { initialsFor } from "@/lib/utils/format";

const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeqvt1vfLT58IEtY87LuDVv2forZnFUM02tx4ZjRGwfbchmLw/viewform";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useSessionUser();

  async function handleLogout() {
    await dispatch(logout());
    router.replace("/login");
  }

  const initials = user?.name ? initialsFor(user.name) : "?";
  const pageName = pathname === "/dashboard" ? "Dashboard" : pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ?? "";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/80 bg-surface-container-low/95 px-4 shadow-[0_1px_0_rgb(255_255_255/0.55)] backdrop-blur-sm md:px-8 dark:shadow-[0_1px_0_rgb(255_255_255/0.03)]">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menú" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
            <SheetHeader className="p-0 pb-4">
              <SheetTitle className="text-sidebar-foreground">FidelOS</SheetTitle>
            </SheetHeader>
            <div className="mb-5"><ContingenciaControls /></div>
            <SidebarNav />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1 items-center gap-3 truncate text-sm">
        <PanelLeft className="hidden size-4 text-foreground md:block" />
        <span className="hidden text-muted-foreground sm:inline">Fidel OS</span>
        <span className="hidden text-muted-foreground sm:inline">/</span>
        <span className="truncate font-medium text-foreground">{pageName}</span>
      </div>

      <div className="flex items-center gap-1">
      <Button
        aria-label="Enviar comentarios para mejorar FidelOS"
        nativeButton={false}
        render={<a href={FEEDBACK_FORM_URL} rel="noreferrer" target="_blank" title="Enviar comentarios" />}
        size="icon"
        variant="ghost"
      >
        <MessageSquarePlus className="size-4" />
      </Button>
      <BetaNotice iconOnly />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            />
          }
        >
          <Avatar size="sm">
            {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block font-medium text-foreground">{user?.name}</span>
            <span className="block text-xs text-muted-foreground">{user?.role ?? "Sin rol"}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <span className="block truncate font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/perfil" />}>
            <UserCircle className="size-4" />
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/configuracion" />}>
            <Settings className="size-4" />
            Configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ThemeMenu />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}

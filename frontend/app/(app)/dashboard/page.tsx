"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Boxes,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  Camera,
  Mic,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { MovementTypeBadge } from "@/components/movement-type-badge";
import { EmptyState } from "@/components/empty-state";
import { getDashboardStats, getLowStockProducts, getRecentMovements } from "@/lib/mock/dashboard";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const stats = getDashboardStats();
  const recentMovements = getRecentMovements(6);
  const lowStockProducts = getLowStockProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {user?.name?.split(" ")[0] ?? "bienvenido"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Este es el estado de tu inventario hoy.
          </p>
        </div>
        <Button size="lg" className="h-11 gap-2 text-base" render={<Link href="/captura" />} nativeButton={false}>
          <Sparkles className="size-4" />
          Nueva captura
        </Button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: "Productos totales", value: formatNumber(stats.totalProducts), icon: Package, accent: "primary" as const },
          { label: "Stock total", value: formatNumber(stats.totalStock), icon: Boxes, accent: "primary" as const },
          { label: "Stock bajo", value: formatNumber(stats.lowStock), icon: AlertTriangle, accent: "warning" as const },
          { label: "Entradas hoy", value: formatNumber(stats.todayEntries), icon: ArrowDownLeft, accent: "success" as const },
          { label: "Salidas hoy", value: formatNumber(stats.todayExits), icon: ArrowUpRight, accent: "destructive" as const },
        ].map((item) => (
          <motion.div key={item.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
            <StatCard label={item.label} value={item.value} icon={item.icon} accent={item.accent} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Movimientos recientes</CardTitle>
              <CardDescription>Últimas entradas y salidas registradas.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              render={<Link href="/movimientos" />} nativeButton={false}
            >
              Ver todos
              <ChevronRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {recentMovements.length === 0 && (
              <EmptyState
                icon={ArrowLeftRight}
                title="Aún no hay movimientos"
                description="Cuando registres una entrada o salida, aparecerá aquí."
              />
            )}
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="size-9 shrink-0 rounded-lg"
                  style={{ backgroundColor: movement.productoImagenColor }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{movement.producto}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(movement.fecha)} &middot; {movement.usuario}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MovementTypeBadge tipo={movement.tipo} />
                  <span className="text-xs text-muted-foreground">
                    {movement.tipo === "salida" ? "-" : "+"}
                    {movement.cantidad}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-border/60 bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Registra inventario en segundos</p>
                <p className="text-sm text-primary-foreground/80">
                  Toma una foto, habla, o ambos — la IA hace el resto.
                </p>
              </div>
              <Button
                variant="secondary"
                className="mt-1 justify-between"
                render={<Link href="/captura" />} nativeButton={false}
              >
                Ir a Captura IA
                <ChevronRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" size="lg" className="h-11 justify-start gap-2" render={<Link href="/captura/foto" />} nativeButton={false}>
                <Camera className="size-4" />
                Capturar por foto
              </Button>
              <Button variant="outline" size="lg" className="h-11 justify-start gap-2" render={<Link href="/captura/voz" />} nativeButton={false}>
                <Mic className="size-4" />
                Capturar por voz
              </Button>
              <Button variant="outline" size="lg" className="h-11 justify-start gap-2" render={<Link href="/productos" />} nativeButton={false}>
                <Package className="size-4" />
                Ver productos
              </Button>
            </CardContent>
          </Card>

          {lowStockProducts.length > 0 && (
            <Card className="border-warning/30 bg-warning/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-amber-700 dark:text-amber-400" />
                  Stock bajo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{product.nombre}</span>
                    <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
                      {product.stock_actual} {product.unidad_medida.toLowerCase()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

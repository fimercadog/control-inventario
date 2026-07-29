"use client";

import { useMemo, useState } from "react";
import { Package, Search, SearchX, MoreHorizontal, Pencil, History } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_PRODUCTS } from "@/lib/mock/data";
import { formatCurrency, formatNumber } from "@/lib/format";

const CATEGORIES = ["Todas", ...Array.from(new Set(MOCK_PRODUCTS.map((p) => p.categoria)))];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  const filtered = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchesSearch =
        search.trim() === "" ||
        product.nombre.toLowerCase().includes(search.toLowerCase()) ||
        product.marca.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Todas" || product.categoria === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length === MOCK_PRODUCTS.length
              ? `${formatNumber(MOCK_PRODUCTS.length)} productos en tu catálogo.`
              : `${formatNumber(filtered.length)} de ${formatNumber(MOCK_PRODUCTS.length)} productos.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o marca..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={Object.fromEntries(CATEGORIES.map((c) => [c, c]))}
          value={category}
          onValueChange={(value) => setCategory(value ?? "Todas")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Presentación</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const low = product.stock_actual <= product.stock_minimo;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: product.imagenColor }}
                        >
                          <Package className="size-4" />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{product.nombre}</span>
                          <span className="text-xs text-muted-foreground">{product.marca}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.presentacion}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          low
                            ? "font-medium tabular-nums text-destructive"
                            : "font-medium tabular-nums"
                        }
                      >
                        {formatNumber(product.stock_actual)} {product.unidad_medida.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(product.precio)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History />
                            Ver movimientos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={SearchX}
                      title="No encontramos productos"
                      description="Prueba con otro nombre, marca o categoría."
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            setCategory("Todas");
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

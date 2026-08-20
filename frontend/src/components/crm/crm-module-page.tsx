"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import Link from "next/link";
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { apiClient } from "@/lib/api/client";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { PaginationMeta } from "@/types/api";

type RecordItem = Record<string, unknown>;
type FieldType = "text" | "email" | "number" | "date";

export type CrmModuleField = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  defaultValue?: string;
};

export type CrmModuleColumn = {
  header: string;
  value: (item: RecordItem) => ReactNode;
};

export type CrmModuleAction = {
  label: string;
  endpoint: (item: RecordItem) => string;
  method?: "post" | "patch";
};

interface CrmModulePageProps {
  title: string;
  singularTitle: string;
  createLabel?: string;
  description: string;
  endpoint: string;
  fields: CrmModuleField[];
  columns: CrmModuleColumn[];
  actions?: CrmModuleAction[];
  canEdit?: boolean;
  editEndpoint?: (item: RecordItem) => string;
  quickLink?: { href: string; label: string };
  stateOptions?: Array<{ value: string; label: string }>;
  stateValue?: (item: RecordItem) => string | boolean | null | undefined;
  matchesSearch?: (item: RecordItem, term: string) => boolean;
  searchPlaceholder: string;
  emptyMessage: string;
}

const DEFAULT_PAGE_SIZE = 20;

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return String((value as RecordItem).nombre ?? "—");
  return String(value);
}

function toPayload(fields: CrmModuleField[], form: HTMLFormElement): Record<string, unknown> {
  const values = new FormData(form);
  return fields.reduce<Record<string, unknown>>((payload, field) => {
    const value = String(values.get(field.name) ?? "").trim();
    if (value) payload[field.name] = field.type === "number" ? Number(value) : value;
    return payload;
  }, {});
}

export function CrmModulePage({
  title,
  singularTitle,
  createLabel = `Nuevo ${singularTitle}`,
  description,
  endpoint,
  fields,
  columns: configuredColumns,
  actions = [],
  canEdit = false,
  editEndpoint,
  quickLink,
  stateOptions,
  stateValue = (item) => String(item.estado ?? ""),
  matchesSearch,
  searchPlaceholder,
  emptyMessage,
}: CrmModulePageProps) {
  const { inputValue: searchInput, setInputValue: setSearchInput, searchTerm } = useDebouncedSearch();
  const [state, setState] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryKey = `${endpoint}|${searchTerm}|${pageSize}|${page}|${refreshNonce}`;
  const [resultKey, setResultKey] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<RecordItem | null>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const filterSignature = `${searchTerm}|${state}`;
  const [appliedFilterSignature, setAppliedFilterSignature] = useState(filterSignature);
  if (filterSignature !== appliedFilterSignature) {
    setAppliedFilterSignature(filterSignature);
    setPage(1);
  }

  useEffect(() => {
    let ignore = false;
    apiClient
      .get(endpoint, { params: { busqueda: searchTerm || undefined, per_page: pageSize, page } })
      .then(({ data }) => {
        if (ignore) return;
        const payload = data.data;
        const paginated = !Array.isArray(payload) && Array.isArray(payload?.data);
        setItems(paginated ? payload.data : Array.isArray(payload) ? payload : []);
        setMeta(
          paginated
            ? {
                current_page: payload.current_page,
                per_page: payload.per_page,
                last_page: payload.last_page,
                total: payload.total,
                from: payload.from,
                to: payload.to,
              }
            : null,
        );
        setError(null);
        setResultKey(queryKey);
      })
      .catch((requestError) => {
        if (!ignore) {
          setItems([]);
          setMeta(null);
          setError(extractApiErrorMessage(requestError, `No se pudieron cargar los ${title.toLowerCase()}.`));
          setResultKey(queryKey);
        }
      });
    return () => {
      ignore = true;
    };
  }, [endpoint, page, pageSize, queryKey, refreshNonce, searchTerm, title]);

  const searchedItems = searchTerm && matchesSearch ? items.filter((item) => matchesSearch(item, searchTerm)) : items;
  const filteredItems = state === "todos" ? searchedItems : searchedItems.filter((item) => String(stateValue(item)) === state);
  const visibleItems = meta ? filteredItems : filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const localTotal = filteredItems.length;
  const totalRows = meta?.total ?? localTotal;
  const totalPages = meta?.last_page ?? Math.max(Math.ceil(localTotal / pageSize), 1);
  const isLoading = resultKey !== queryKey;
  const isError = !isLoading && error !== null;

  async function submitForm(event: FormEvent<HTMLFormElement>, item?: RecordItem) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = toPayload(fields, event.currentTarget);
      if (item && editEndpoint) {
        await apiClient.patch(editEndpoint(item), payload);
      } else {
        await apiClient.post(endpoint, payload);
      }
      setCreateOpen(false);
      setEditing(null);
      setRefreshNonce((value) => value + 1);
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, `No se pudo guardar ${singularTitle.toLowerCase()}.`));
    } finally {
      setSubmitting(false);
    }
  }

  async function runAction(action: CrmModuleAction, item: RecordItem) {
    setActioningId(Number(item.id));
    setError(null);
    try {
      await apiClient.request({ method: action.method ?? "post", url: action.endpoint(item) });
      setRefreshNonce((value) => value + 1);
    } catch (requestError) {
      setError(extractApiErrorMessage(requestError, "No se pudo completar la acción."));
    } finally {
      setActioningId(null);
    }
  }

  const columns: ColumnDef<RecordItem, unknown>[] = configuredColumns.map((column) => ({
    id: column.header,
    header: column.header,
    cell: ({ row }) => column.value(row.original),
  }));

  columns.push({
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const item = row.original;
      const running = actioningId === Number(item.id);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" disabled={running} aria-label={`Acciones de ${singularTitle}`} />}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetail(item)}>Ver detalle</DropdownMenuItem>
            {canEdit && editEndpoint ? <DropdownMenuItem onClick={() => setEditing(item)}>Editar</DropdownMenuItem> : null}
            {actions.map((action) => (
              <DropdownMenuItem key={action.label} onClick={() => runAction(action, item)}>
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLink ? <Link href={quickLink.href} className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium shadow-sm hover:bg-muted">{quickLink.label}</Link> : null}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}><Plus className="size-4" />{createLabel}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo {singularTitle}</DialogTitle><DialogDescription>Completa los datos disponibles para este registro.</DialogDescription></DialogHeader>
              <ModuleForm fields={fields} submitting={submitting} submitLabel={`Crear ${singularTitle.toLowerCase()}`} onSubmit={submitForm} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={searchPlaceholder} className="pl-9" aria-label={`Buscar ${title.toLowerCase()}`} />
        </div>
        {stateOptions ? <Select value={state} onValueChange={(value) => setState(value ?? "todos")}><SelectTrigger className="w-44" aria-label="Filtrar por estado"><SelectValue>{(value: string) => stateOptions.find((option) => option.value === value)?.label ?? "Todos"}</SelectValue></SelectTrigger><SelectContent>{stateOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select> : null}
      </div>

      {error ? <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert> : null}

      <DataTable columns={columns} data={visibleItems} isLoading={isLoading} isError={isError} errorMessage={error ?? undefined} emptyMessage={emptyMessage} page={meta?.current_page ?? page} pageSize={meta?.per_page ?? pageSize} totalPages={totalPages} totalRows={totalRows} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent><DialogHeader><DialogTitle>{singularTitle}</DialogTitle><DialogDescription>Información disponible en el CRM.</DialogDescription></DialogHeader><dl className="grid gap-3 text-sm">{detail ? Object.entries(detail).filter(([key]) => !["id", "empresa_id", "created_at", "updated_at"].includes(key)).map(([key, value]) => <div key={key} className="grid gap-1 border-b border-border pb-2 last:border-0"><dt className="text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="font-medium">{displayValue(value)}</dd></div>) : null}</dl></DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar {singularTitle}</DialogTitle><DialogDescription>Actualiza únicamente la información permitida por este módulo.</DialogDescription></DialogHeader>{editing ? <ModuleForm fields={fields} item={editing} submitting={submitting} submitLabel="Guardar cambios" onSubmit={(event) => submitForm(event, editing)} /> : null}</DialogContent>
      </Dialog>
    </div>
  );
}

function ModuleForm({ fields, item, submitting, submitLabel, onSubmit }: { fields: CrmModuleField[]; item?: RecordItem; submitting: boolean; submitLabel: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={field.name} className="grid gap-2"><Label htmlFor={`crm-${field.name}`}>{field.label}</Label><Input id={`crm-${field.name}`} name={field.name} type={field.type ?? "text"} required={field.required} defaultValue={displayValue(item?.[field.name]) === "—" ? field.defaultValue : displayValue(item?.[field.name])} /></div>)}<div className="sm:col-span-2"><Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{submitLabel}</Button></div></form>;
}

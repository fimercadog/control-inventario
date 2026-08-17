"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Presentational grouping only — the backend returns a flat list; this just splits on the first "." of each real permission name (e.g. "productos.ver" -> group "productos"). */
function groupByModule(permissions: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const permission of permissions) {
    const [module] = permission.split(".");
    const list = groups.get(module) ?? [];
    list.push(permission);
    groups.set(module, list);
  }
  return groups;
}

export function PermissionsSelector({
  allPermissions,
  selected,
  onChange,
}: {
  allPermissions: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const groups = groupByModule(allPermissions);

  function toggle(permission: string, checked: boolean) {
    onChange(checked ? [...selected, permission] : selected.filter((p) => p !== permission));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {selected.length} de {allPermissions.length} permisos seleccionados
      </p>
      <div className="flex max-h-72 flex-col gap-4 overflow-y-auto rounded-lg border border-border p-3">
        {[...groups.entries()].map(([module, permissions]) => (
          <div key={module} className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {module}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => {
                const checkboxId = `perm-${permission}`;
                const suffix = permission.slice(module.length + 1);
                return (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selected.includes(permission)}
                      onCheckedChange={(checked) => toggle(permission, checked === true)}
                    />
                    <Label htmlFor={checkboxId} className="text-sm font-normal">
                      {suffix}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

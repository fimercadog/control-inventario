import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, initialsFor } from "@/lib/utils/format";
import type { Usuario } from "@/types/user";

export function UsuarioSummary({ usuario }: { usuario: Usuario }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {usuario.avatar_url ? <AvatarImage src={usuario.avatar_url} alt="" /> : null}
            <AvatarFallback>{initialsFor(usuario.name)}</AvatarFallback>
          </Avatar>
          <span className="text-xl font-semibold text-foreground">{usuario.name}</span>
        </div>
        {usuario.is_active ? (
          <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
        ) : (
          <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" value={usuario.email} />
        <Field label="Rol" value={usuario.role ?? "Sin rol"} />
        <Field label="Empresa" value={usuario.empresa?.nombre ?? "—"} />
        <Field label="Última actividad" value={formatDateTime(usuario.last_activity_at)} />
        <Field label="Última IP" value={usuario.last_login_ip ?? "—"} />
        <Field label="Invitado el" value={formatDateTime(usuario.invited_at)} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

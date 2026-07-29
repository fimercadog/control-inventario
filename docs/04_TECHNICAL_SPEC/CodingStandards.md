# Coding Standards

> Fuente: master spec §68 (Convenciones de Desarrollo) + `.editorconfig` (raíz del repo) + patrones verificados en `backend/app/**` y `frontend/**`.

## 1. Formato general (`.editorconfig`, raíz del repo — regla mecánica, no interpretación)

```ini
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 4
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml,json}]
indent_size = 2
```

Indentación de 4 espacios por defecto (PHP, TS incluidos salvo YAML/JSON que usan 2), LF, sin espacios finales salvo en Markdown (donde el trailing whitespace es sintaxis válida de salto de línea forzado). Cualquier editor conectado a este repo debe respetar este archivo automáticamente.

## 2. PHP (backend)

- **PSR-12** — estilo de código estándar. `laravel/pint` está instalado como dev-dependency (`composer.json`) para aplicarlo automáticamente.
- **`declare(strict_types=1)`** y type hinting obligatorio en toda función/método nuevo — verificado en el código real: todo DTO, Service, Repository y Contract audita usa tipos explícitos en parámetros y retornos (ejemplo: `ProductRepository::buscarPorNombreMarcaPresentacion(int $empresaId, string $nombre, ?string $marca, ?string $presentacion): ?Producto`).
- **DTOs inmutables**: `final readonly class`, ver `Backend.md` §6.
- **Enums de PHP, no `ENUM` de MySQL**: `App\Enums\TipoMovimiento`, `App\Enums\CapturaIA\{TipoCaptura,EstadoCaptura,EstadoCapturaDetalle}` — la columna de base de datos es `VARCHAR`, el enum vive en código (`Database.md`, master spec §74: "agregar un tipo nuevo es un cambio de código, no una migración de esquema").
- **Services** — una responsabilidad de dominio por clase (Alta Cohesión); nunca lógica de negocio en Controllers ni Middleware (`AGENTS.md`).
- **Repositories** — encapsulan queries no triviales; ver `Backend.md` §4 para el estado real (sin interfaz todavía).
- **Policies** — una por modelo, method-per-action (`view`, `update`, `delete`).
- **Events** — nombrados en pasado (`ProductCreated`, `UserLoggedIn`, `StockUpdated`), disparados con `DB::afterCommit()` cuando forman parte de una transacción más grande, para no emitir un evento sobre un cambio que terminó en rollback (patrón verificado en `ProductService::crear()`, `AuthenticationService::login()`).
- **Resources** — únicos responsables de transformar Model/DTO → JSON de respuesta (`CapturaIAResource`, `AuthenticatedUserResource`), nunca `Model::toArray()` expuesto directo desde un Controller.

## 3. TypeScript (frontend)

- **Strict Mode** — `tsconfig.json` de Next.js con `strict: true` (verificar con `npm run type-check`, script real en `package.json`).
- **Interfaces/tipos explícitos** — `lib/api/types.ts`, `lib/types.ts`, `lib/mock/types.ts` centralizan los tipos de dominio; los componentes no declaran shapes ad hoc para datos que ya tienen un tipo central.
- **No `any` salvo justificación documentada** — regla del master spec; no se auditó exhaustivamente el uso real de `any` en este pase, pero es la convención declarada y debe tratarse como regla dura en review.
- **Componentes `"use client"` explícitos** — todo componente con estado/efectos declara la directiva; no hay ambigüedad entre Server/Client Components sin marcar.

## 4. Git

Modelo de branching declarado por el master spec: `main`, `develop`, `feature/*`, `fix/*`, `hotfix/*`, `release/*`. **No verificado contra el historial real de branches en este pase** — se documenta como convención a seguir, no como hecho auditado del repositorio.

Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Mismo estado: convención declarada, no auditada línea por línea contra el log de commits real.

## 5. Reglas duras transversales (`AGENTS.md`, ya en vigor y verificadas en código)

- Nunca lógica de negocio en Controllers, componentes React, o Middleware.
- Nunca autorizar por nombre de rol (`hasRole()`) — siempre por permiso (`can()`). Ver `Security.md` §4 para el estado real de esta regla (implementada como principio, pendiente de permisos reales en Policies).
- Nunca confiar en `empresa_id` del request — siempre derivarlo del usuario autenticado vía `TenantContext`. Verificado en `BelongsToEmpresa::bootBelongsToEmpresa()`.
- Nunca exponer stack traces ni excepciones internas de Laravel al cliente.
- Clases y métodos pequeños, nombres significativos, evitar números mágicos (ejemplo real: `CAPTURA_IA_CONFIDENCE_THRESHOLD` es config, no un `0.85` hardcodeado en el Service).
- Preferir composición sobre herencia — excepción documentada y justificada: `App\Models\Role extends Spatie\Permission\Models\Role` (herencia necesaria para integrarse con el sistema de resolución de modelos de Spatie vía `config('permission.models.role')`).

## 6. Estados de UI obligatorios (frontend, `AGENTS.md`)

Loading, Empty y Error states son mandatorios en toda pantalla — ver `Frontend.md` §8 para los componentes reales que los implementan (`Skeleton`, `EmptyState`, `ApiError` + `Toaster`). Responsive es mandatorio; accesibilidad debe considerarse siempre (sin auditoría de accesibilidad realizada todavía — ver gap señalado en `docs/SDD_MIGRATION_PLAN.md` §4, `AccessibilityRequirements.md` pendiente).

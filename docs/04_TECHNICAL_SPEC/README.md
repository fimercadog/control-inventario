# 04_TECHNICAL_SPEC/

Cómo está construido el sistema técnicamente. Fuente de verdad técnica del proyecto — reutilizada y reorganizada desde los documentos técnicos originales, nunca reescrita donde ya era correcta (`AGENTS.md`, "código gana sobre documentación si difieren").

| Documento | Contenido |
|---|---|
| [`Architecture.md`](Architecture.md) | Arquitectura general del sistema. |
| [`DomainModel.md`](DomainModel.md) | Bounded contexts, entidades, agregados, invariantes — deriva de `Database.md` y de los modelos Eloquent reales. |
| [`Database.md`](Database.md) | Entidades, relaciones, índices, reglas de negocio a nivel de datos. |
| [`API.md`](API.md) | Contratos de la API REST. |
| [`Backend.md`](Backend.md) | Convenciones reales de `backend/` (Laravel 12, PHP 8.2). |
| [`Frontend.md`](Frontend.md) | Estructura real de `frontend/` (Next.js). |
| [`Security.md`](Security.md) | Aislamiento multi-tenant, autenticación, autorización — implementación real verificada. |
| [`Integrations.md`](Integrations.md) | Integraciones externas (proveedor de IA). |
| [`Deployment.md`](Deployment.md) | Estado real de despliegue — sin pipeline CI/CD, documentado como brecha explícita. |
| [`CodingStandards.md`](CodingStandards.md) | Convenciones de código verificadas contra `backend/app/**` y `frontend/**`. |
| [`Glossary.md`](Glossary.md) | Términos del dominio real del proyecto. |

Ver también: [`../08_ADR/ADR_INDEX.md`](../08_ADR/ADR_INDEX.md) (por qué se tomó cada decisión arquitectónica) y [`../05_IMPLEMENTATION/`](../05_IMPLEMENTATION/) (cómo se aplicó esta arquitectura módulo por módulo).

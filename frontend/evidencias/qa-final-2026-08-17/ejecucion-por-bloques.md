# Ejecución Playwright por bloques

Todos los comandos se ejecutaron desde `frontend/`, contra los servicios reales
en los puertos 3000 y 8000, con un worker.

| Comando | Resultado | Duración |
| --- | --- | --- |
| `npx playwright test tests/auth.spec.ts --workers=1 --reporter=line` | 16/16 PASS | 27.5 s |
| `npx playwright test tests/categorias.spec.ts --workers=1 --reporter=line` | 25/25 PASS | 1.7 min |
| `npx playwright test tests/roles.spec.ts --workers=1 --reporter=line` | 24/24 PASS | 1.7 min |
| `npx playwright test tests/proveedores.spec.ts --workers=1 --reporter=line` | 27/27 PASS | 1.7 min |
| `npx playwright test tests/usuarios.spec.ts --workers=1 --reporter=line` | 23/23 PASS | 1.8 min |
| `npx playwright test tests/fase6-qa-final.spec.ts --workers=1 --reporter=line` | 8/8 PASS | 25.7 s |
| `npx playwright test tests/captura-ia.spec.ts --workers=1 --reporter=line` | 8/8 PASS | 46.9 s |

**Total: 131/131 PASS.**

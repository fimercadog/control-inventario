# Fidel OS — AI Inventory Agent — Guía de Demo (RC1)

Este documento es la referencia rápida para levantar el proyecto y dar una demo comercial de 5 minutos.

## 1. Requisitos del sistema

- PHP 8.2+ con las extensiones estándar de Laravel (sqlite3, mbstring, openssl, pdo)
- Composer 2.x
- Node.js 20+ (probado con Node 22) y npm
- SQLite (el backend usa `database/database.sqlite`, no requiere MySQL para la demo)
- Una API key de OpenAI válida **solo si se quiere ejecutar el flujo real de Captura IA** (ver sección 5)

## 2. Cómo levantar el proyecto

### Backend (Laravel) — puerto 8000

```bash
cd backend
composer install
cp .env.example .env   # si no existe ya
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

El seeder crea automáticamente la empresa demo (`Fidel OS Demo`, id `1`).

### Frontend (Next.js) — puerto 3000

```bash
cd frontend
npm install
cp .env.example .env.local   # si no existe ya
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## 3. Credenciales de demo

No existe todavía un módulo de autenticación real (JWT) en el backend — está fuera de alcance de este MVP (ver Limitaciones). La pantalla de Login es una sesión local de demo:

- **Correo:** cualquier correo con formato válido (ej. `demo@fideos.com`)
- **Contraseña:** cualquier valor no vacío

Cualquier combinación válida crea una sesión local y entra al Dashboard.

## 4. Variables de entorno relevantes

**Backend (`backend/.env`)**

| Variable | Propósito |
|---|---|
| `APP_LOCALE` / `APP_FALLBACK_LOCALE` | `es` — mensajes de validación y error en español |
| `OPENAI_API_KEY` | **Requerida para que el flujo real de Captura IA funcione.** Ver sección 5 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` por defecto |
| `OPENAI_VISION_MODEL` | Modelo usado para analizar fotos (`gpt-4o` por defecto) |
| `OPENAI_SPEECH_MODEL` | Modelo usado para transcribir audio (`whisper-1` por defecto) |
| `OPENAI_RESPONSES_MODEL` | Modelo usado para extracción estructurada (`gpt-4o` por defecto) |
| `OPENAI_TIMEOUT` | Timeout en segundos para llamadas a OpenAI (`30` por defecto) |
| `CAPTURA_IA_CONFIDENCE_THRESHOLD` | Umbral de confianza para auto-aplicar detecciones (`0.85` por defecto) |

**Frontend (`frontend/.env.local`)**

| Variable | Propósito |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (`http://localhost:8000/api/v1`) |
| `NEXT_PUBLIC_DEMO_EMPRESA_ID` | `1` — la empresa sembrada por el seeder, usada en cada request de Captura IA |

## 5. Ubicación de la API key de OpenAI

La clave se coloca en `backend/.env`, variable `OPENAI_API_KEY`. **Este valor no viene incluido** (ni en `.env.example` ni en el repositorio) por razones de seguridad — debe obtenerse de [platform.openai.com](https://platform.openai.com/api-keys) y pegarse ahí antes de arrancar `php artisan serve`.

Sin esta clave, toda la app funciona (Dashboard, Productos, Movimientos usan datos de ejemplo del frontend), **excepto** el paso final de análisis dentro del flujo de Captura IA (Foto / Voz / Foto+Voz), que fallará con un mensaje de error amigable al intentar contactar a OpenAI.

## 6. Script de demo recomendado (5 minutos)

1. **Login (20s)** — entrar con cualquier correo/contraseña. Mostrar que la pantalla es simple y profesional.
2. **Dashboard (30s)** — señalar las tarjetas de resumen (productos totales, stock, stock bajo, entradas/salidas de hoy) y los movimientos recientes. Mencionar que esto se actualiza en tiempo real con cada captura.
3. **Captura IA — pantalla principal (20s)** — este es el momento "wow". Explicar las 3 formas de registrar inventario: Foto, Voz, o ambas combinadas.
4. **Foto + Voz (90s)** — la joya de la demo:
   - Tomar o subir una foto de un producto (una caja, bolsa, o estante).
   - Grabar un audio corto: *"Entraron cinco bolsas de Dog Chow"*.
   - Presionar "Analizar foto + voz" y mostrar los estados de carga conversacionales (Subiendo → Analizando → Transcribiendo → Combinando → Guardando).
5. **Pantalla de revisión (60s)** — mostrar las tarjetas de producto detectadas, la insignia de confianza, y cómo un producto de baja confianza se marca para revisión manual y es editable (nombre, cantidad, categoría). Editar uno y guardar. Confirmar todo.
6. **Regreso al Dashboard (20s)** — mostrar que el inventario recién capturado ya se refleja (movimiento nuevo, stock actualizado).
7. **Productos y Movimientos (30s)** — recorrer rápidamente la tabla de productos (buscar, filtrar) y la línea de tiempo de movimientos (entradas en verde, salidas en rojo).
8. **Cierre (10s)** — mencionar que cada captura queda auditada automáticamente y que el sistema está listo para múltiples tipos de captura futuros (código de barras, QR, PDF, video) sin cambios de arquitectura.

## 7. Límites conocidos del MVP

- **No hay autenticación real (JWT).** El login es una sesión local de demo; el módulo de autenticación está planeado pero fuera de alcance de este MVP.
- **Dashboard, Productos y Movimientos usan datos de ejemplo (mock)** del lado del frontend — no existen todavía endpoints REST de Empresas/Productos/Movimientos/Reportes en el backend. Solo el flujo de Captura IA (`/api/v1/captura-ia/*`) es 100% real, contra la base de datos y (si hay API key) contra OpenAI.
- **Requiere una `OPENAI_API_KEY` válida y con saldo** para que el análisis de foto/voz funcione de extremo a extremo; sin ella, el paso de análisis falla con un error amigable (ver sección 5).
- **Una sola empresa de demo** (`Fidel OS Demo`, id `1`) — no hay selector de empresa ni multi-tenant real en la UI todavía.
- **Sin roles ni permisos** — cualquier sesión de demo tiene acceso completo.
- **Sin soporte todavía para código de barras, QR, OCR de PDF o video** — la arquitectura de Captura IA está preparada para estos tipos futuros (mismo pipeline, misma interfaz `AIProviderInterface`), pero no están implementados en este MVP.
- **Sin notificaciones/listeners sobre los eventos de dominio** (`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted`) — los eventos se disparan correctamente pero aún no tienen listeners (email, webhooks, etc.), por diseño de esta fase.

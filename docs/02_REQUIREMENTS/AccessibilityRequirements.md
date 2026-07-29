# Requisitos de Accesibilidad

Documento nuevo — no existe accesibilidad como requisito dedicado en el master spec (solo una mención genérica en `AGENTS.md`: "Accessibility should always be considered" bajo Frontend Rules). No se ha realizado ninguna auditoría de accesibilidad sobre el frontend construido hasta la fecha de este documento. Este es un gap real, no una formalidad — se documenta explícitamente como tal.

## Línea base propuesta: WCAG 2.1 nivel AA

Se adopta WCAG 2.1 AA como estándar objetivo, por ser el estándar de facto para software empresarial y el más citado en `AGENTS.md`/`SDD_MIGRATION_PLAN.md` como ausente.

### Perceptible

- Todo contenido no textual (iconos, imágenes de producto capturadas por Captura IA) debe tener texto alternativo.
- Contraste de color mínimo 4.5:1 para texto normal, 3:1 para texto grande — pendiente de verificar contra la paleta de colores real definida en `04_TECHNICAL_SPEC/Frontend.md`.
- Ninguna información debe transmitirse únicamente por color (relevante para estados de captura IA: pendiente/confirmado/descartado deben distinguirse también por texto o ícono, no solo color).

### Operable

- Toda funcionalidad debe ser accesible por teclado, sin trampas de foco.
- Los flujos de Captura IA (foto, voz) deben tener una alternativa operable para usuarios que no puedan usar cámara/micrófono, o al menos un mensaje de error claro y accesible cuando el dispositivo no lo soporte.
- Tiempo suficiente: ninguna sesión debe expirar sin aviso previo accionable (relevante para el manejo de expiración de JWT/refresh token).

### Comprensible

- Etiquetas de formulario claras y asociadas correctamente a sus campos (relevante para los formularios de login, recuperación de contraseña, y los futuros formularios de Productos/Usuarios).
- Mensajes de error específicos y comprensibles, no genéricos — ya alineado con la regla de `AGENTS.md` de "nunca exponer stack traces ni excepciones internas", pero debe extenderse a que el mensaje de error mostrado al usuario sea además accesible por lector de pantalla (`aria-live` en validaciones).

### Robusto

- HTML semántico correcto, compatible con tecnologías de asistencia (lectores de pantalla).
- Componentes de UI de terceros (TanStack Table, Recharts, Framer Motion) deben verificarse individualmente por su nivel de soporte de accesibilidad — no asumir que lo tienen por defecto.

## Estados obligatorios ya declarados en `AGENTS.md` (Frontend Rules), relevantes a accesibilidad

- Loading states, empty states y error states son obligatorios en todo componente — esto ya es una regla vinculante en el proyecto, y se relaciona directamente con accesibilidad: un estado de carga sin anuncio accesible (`aria-live`, `aria-busy`) no cumple WCAG aunque exista visualmente.

## Estado real: gap confirmado

- **No se ha ejecutado ninguna auditoría de accesibilidad** (automatizada con herramientas tipo axe/Lighthouse, ni manual con lector de pantalla) sobre ninguna pantalla construida (Login, Dashboard, tabla de Productos, timeline de Movimientos, flujo de Captura IA).
- No hay política de accesibilidad ni checklist de QA que incluya verificación de accesibilidad en el ciclo de release actual (`07_RELEASE/ReleaseChecklist.md`, pendiente de autoría, debería incorporar un chequeo básico una vez este documento se apruebe).
- Recomendación: antes de la primera auditoría formal, correr al menos una pasada automatizada (Lighthouse/axe) sobre las pantallas ya construidas (Login, Dashboard, Productos, Movimientos, Captura IA) para tener una línea base medible, en vez de partir de cero criterio.

# Rediseño visual — referencia Manual de Usuario

## Resultado

Se adaptó el sistema visual del frontend a la guía visual de `manual.html`.
La referencia usa una interfaz clara, base blanca/lila, tipografía sans,
acento índigo `#4f46e5`, bordes lavanda suaves, tarjetas elevadas y una
jerarquía de contenido más amplia. La captura previa mostraba el tema oscuro
forzado, contraste bajo y una jerarquía visual poco consistente.

## Cambios aplicados

- Se eliminó el tema oscuro forzado desde el layout raíz.
- Se definieron tokens globales claros con índigo, lavanda, fondos suaves,
bordes y estados coherentes con el manual.
- Sidebar renovado con marca, insignia, jerarquía y superficie clara.
- Header claro y translúcido, con mejor separación del contenido.
- Captura IA rediseñada: cabecera de contexto, tabs segmentados, tarjetas,
zonas de carga con ayuda visible, acción primaria y listado de historial en
tarjetas responsive.

## Validación

- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- La suite Playwright existente de Captura IA pasó 8/8 en la revalidación QA
  por bloques registrada en `evidencias/qa-final-2026-08-17/`.

## Alcance visual

Los tokens globales se aplican a todos los módulos que consumen los componentes
UI compartidos. Captura IA fue revisada además con ajustes de composición
específicos por ser la pantalla mostrada en la captura proporcionada.

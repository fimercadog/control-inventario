# Incidentes — FidelOS Frontend

Registro de inconsistencias encontradas entre `spec.md`, el backend real, la base de datos real, el manual de usuario y el frontend existente, durante la ejecución autónoma de `spec.md`.

Regla del proyecto (spec.md, sección 1 y 6): el backend y la base de datos son inmutables. Ningún incidente se resuelve modificando `backend/`, migraciones, o `database.sqlite`. Si un incidente no puede resolverse solo con frontend, se registra aquí y el trabajo continúa con el siguiente punto posible.

- `INCIDENTES.md` — incidentes ya clasificados y resueltos (Tipo A/B) o registrados como bloqueo (Tipo C), con la resolución aplicada.
- `pendientes.md` — incidentes Tipo C sin resolución posible dentro del alcance de este proyecto (requieren backend/BD, fuera de alcance).

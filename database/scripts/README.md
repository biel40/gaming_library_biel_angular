# Scripts de base de datos

Registro de los cambios de PostgreSQL aplicados en producción (Supabase).

## Cómo se aplican

1. Los scripts se ejecutan **a mano** desde el SQL Editor del portal de Supabase, en orden de fecha.
2. Un script siempre se ejecuta **antes** de desplegar el código del frontend que lo necesita. Si el frontend pide columnas que todavía no existen, las consultas fallan.
3. Los scripts son idempotentes (`if not exists`, `create or replace`...), así que ejecutarlos dos veces no rompe nada.
4. Nombre: `YYYY-MM-DD_descripcion_corta.sql`.

No se usa el CLI de Supabase ni migraciones automáticas.

## Estado

| Script | Descripción | Producción |
| --- | --- | --- |
| `2026-09-30_hall_of_fame.sql` | Columnas `hall_of_fame` / `hall_of_fame_date` en `user_game_library` y trigger que limita el Hall de la Fama a 5 juegos | ✅ Aplicado |
| `2026-09-30_single_platinum_target.sql` | Índice único: como mucho un objetivo de platino por usuario (limpia duplicados antes). Opcional: el frontend funciona con o sin él | ✅ Aplicado |
| `2026-09-30_hall_of_fame_max_6.sql` | Amplía el límite del Hall de la Fama de 5 a 6 juegos (redefine la función del trigger) | ⏳ Pendiente |

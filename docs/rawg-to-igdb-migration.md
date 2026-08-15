# Migración de RAWG a IGDB

## Resumen
El proyecto ha sustituido la búsqueda de juegos realizada a través de RAWG por una integración basada en una Edge Function de Supabase que consulta IGDB. La lógica de búsqueda ahora se centraliza en el servicio de juego y convierte la respuesta externa a un modelo interno seguro para la UI.

## Motivo del cambio
- Centralizar el acceso a datos externos en Supabase para evitar exponer claves o credenciales del cliente.
- Aprovechar una capa intermedia con control de errores y transformación de datos.
- Mejorar la compatibilidad con la infraestructura actual del proyecto y mantener una única puerta de entrada para APIs externas.
- Alinear la búsqueda con el modelo de la aplicación, usando nombres, cover art, géneros, plataformas y fechas de lanzamiento normalizadas.

## Estado anterior
Antes del cambio, la búsqueda de juegos dependía de una llamada directa a RAWG. Esa integración requería una gestión más delicada de autenticación, rate limits y mapeo de campos, además de dejar la lógica más acoplada al frontend.

## Estado actual
La búsqueda se realiza a través de `SupabaseService.invokeFunction('igdb-games', { search: query })` desde el servicio `GameSearchService`, que transforma la respuesta de IGDB a un resultado local con el siguiente formato:

- `id`
- `name`
- `description`
- `imageUrl`
- `releaseDate`
- `rating`
- `genres`
- `platforms`

El servicio define además una URL base para covers de IGDB y un fallback para imágenes no disponibles:

- `IGDB_COVER_BASE_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big'`
- `FALLBACK_COVER_URL = '/assets/images/game-cover-placeholder.svg'`

## Transformaciones clave
La respuesta del endpoint de IGDB se normaliza para adaptarse al modelo de la app:

- `summary` -> `description`
- `cover.image_id` -> `imageUrl`
- `first_release_date` -> `Date`
- `rating` -> `rating`
- `genres[]` -> `genres: string[]`
- `platforms[]` -> `platforms: string[]`

Si algunos campos son opcionales o faltan, el servicio devuelve valores seguros y no rompe la UI.

## Ficheros relevantes
- `src/app/services/game-search/game-search.service.ts` — lógica principal de búsqueda y mapeado de IGDB.
- `src/app/services/game-search/game-search.service.vitest.ts` — pruebas del nuevo comportamiento y validación de fallbacks.

## Impacto
La búsqueda continúa funcionando con un modelo más estable y centralizado, y la aplicación evita depender directamente de la API externa desde el cliente. La migración mantiene la compatibilidad con la UX actual y mejora la robustez ante respuestas parciales o vacías.

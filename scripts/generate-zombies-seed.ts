/**
 * Generador del seed SQL para la tabla `zombies_maps`.
 *
 * Lee el catálogo estático de mapas (`ZOMBIES_MAPS`) y aplica el arte visual por
 * defecto (`withMapVisual`) para producir sentencias INSERT idempotentes hacia
 * Supabase. Se ejecuta con:
 *
 *   npx ts-node --project tsconfig.seed.json scripts/generate-zombies-seed.ts
 *
 * El objetivo es mantener la base de datos sincronizada con la fuente de datos
 * de forma reproducible, sin escribir 34 INSERTs a mano.
 */
import { writeFileSync } from 'fs';

import { withMapVisual } from '../src/app/features/zombies/data/zombies-map-visuals.data';
import { ZOMBIES_MAPS } from '../src/app/features/zombies/data/zombies-maps.data';
import { ZombiesMap } from '../src/app/features/zombies/models/zombies.models';

const OUTPUT_PATH = './supabase/zombies_maps_seed.sql';

function sqlText(value: string | undefined | null): string {
  if (value === undefined || value === null) {
    return 'NULL';
  }
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlBool(value: boolean | undefined): string {
  return value ? 'TRUE' : 'FALSE';
}

function sqlInt(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return 'NULL';
  }
  return String(value);
}

function sqlJson(value: unknown): string {
  if (value === undefined || value === null) {
    return 'NULL';
  }
  const json = JSON.stringify(value);
  return `'${json.replace(/'/g, "''")}'::jsonb`;
}

const COLUMNS = [
  'id',
  'slug',
  'game_id',
  'name',
  'saga',
  'main_quest_name',
  'has_main_quest',
  'description',
  'summary',
  'image_url',
  'image_alt',
  'image_position',
  'difficulty',
  'estimated_minutes',
  'minimum_players',
  'maximum_players',
  'solo_available',
  'release_order',
  'remaster_of',
  'collection',
  'content_status',
  'prerequisites',
  'recommended_loadout',
  'steps',
  'side_easter_eggs',
  'sources',
];

function rowValues(map: ZombiesMap): string {
  const values = [
    sqlText(map.id),
    sqlText(map.slug),
    sqlText(map.gameId),
    sqlText(map.name),
    sqlText(map.saga),
    sqlText(map.mainQuestName),
    sqlBool(map.hasMainQuest),
    sqlText(map.description),
    sqlText(map.summary),
    sqlText(map.imageUrl),
    sqlText(map.imageAlt),
    sqlText(map.imagePosition),
    sqlText(map.difficulty),
    sqlInt(map.estimatedMinutes),
    sqlInt(map.minimumPlayers),
    sqlInt(map.maximumPlayers),
    sqlBool(map.soloAvailable),
    sqlInt(map.releaseOrder),
    sqlText(map.remasterOf),
    sqlText(map.collection),
    sqlText(map.contentStatus),
    sqlJson(map.prerequisites),
    sqlJson(map.recommendedLoadout),
    sqlJson(map.steps ?? []),
    sqlJson(map.sideEasterEggs ?? []),
    sqlJson(map.sources),
  ];
  return `  (${values.join(', ')})`;
}

const maps = ZOMBIES_MAPS.map(withMapVisual);
const rows = maps.map(rowValues).join(',\n');

const sql = `-- ARCHIVO GENERADO AUTOMÁTICAMENTE. No editar a mano.
-- Fuente: src/app/features/zombies/data/zombies-maps.data.ts
-- Regenerar: npx ts-node --project tsconfig.seed.json scripts/generate-zombies-seed.ts
--
-- Inserta el catálogo de mapas de Zombies. Idempotente: si un mapa ya existe
-- (mismo id) no se sobrescribe, para no pisar ediciones posteriores del admin
-- (por ejemplo, imágenes personalizadas).

insert into public.zombies_maps (
${COLUMNS.map((c) => `  ${c}`).join(',\n')}
) values
${rows}
on conflict (id) do nothing;
`;

writeFileSync(OUTPUT_PATH, sql);

console.log(`✅ Seed generado con ${maps.length} mapas en ${OUTPUT_PATH}`);

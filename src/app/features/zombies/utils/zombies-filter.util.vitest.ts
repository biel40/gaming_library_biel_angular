import { beforeEach, describe, expect, it } from 'vitest';

import { EMPTY_FILTER_CRITERIA, ZombiesMap } from '../models/zombies.models';
import {
  computeProgressPercent,
  filterZombiesMaps,
  normalizeText,
  resolveGuideStatus,
} from './zombies-filter.util';

function makeMap(overrides: Partial<ZombiesMap>): ZombiesMap {
  return {
    id: 'id',
    slug: 'slug',
    gameId: 'bo1',
    name: 'Mapa',
    saga: 'aether',
    hasMainQuest: true,
    description: 'Descripción',
    minimumPlayers: 1,
    maximumPlayers: 4,
    soloAvailable: true,
    releaseOrder: 1,
    steps: [],
    sideEasterEggs: [],
    contentStatus: 'pending',
    ...overrides,
  };
}

const MAPS: ZombiesMap[] = [
  makeMap({ id: 'a', gameId: 'bo1', name: 'Ascensión', saga: 'aether', hasMainQuest: true, minimumPlayers: 1 }),
  makeMap({ id: 'b', gameId: 'bo2', name: 'TranZit', saga: 'aether', hasMainQuest: true, minimumPlayers: 2, soloAvailable: false }),
  makeMap({ id: 'c', gameId: 'bo4', name: 'IX', saga: 'chaos', hasMainQuest: true, minimumPlayers: 1 }),
  makeMap({ id: 'd', gameId: 'bo1', name: 'Kino der Toten', saga: 'aether', hasMainQuest: false, minimumPlayers: 1 }),
];

describe('normalizeText', () => {
  it('quita acentos y mayúsculas', () => {
    expect(normalizeText('Ascensión')).toBe('ascension');
    expect(normalizeText('  IX  ')).toBe('ix');
  });
});

describe('computeProgressPercent', () => {
  it('devuelve 0 cuando no hay pasos', () => {
    expect(computeProgressPercent(0, 0)).toBe(0);
    expect(computeProgressPercent(3, 0)).toBe(0);
  });

  it('calcula el porcentaje y lo redondea', () => {
    expect(computeProgressPercent(1, 3)).toBe(33);
    expect(computeProgressPercent(2, 4)).toBe(50);
    expect(computeProgressPercent(3, 3)).toBe(100);
  });

  it('no supera el 100% aunque haya más completados que pasos', () => {
    expect(computeProgressPercent(5, 3)).toBe(100);
  });
});

describe('resolveGuideStatus', () => {
  it('mapea el estado según el progreso', () => {
    expect(resolveGuideStatus(0, 0)).toBe('not-started');
    expect(resolveGuideStatus(0, 3)).toBe('not-started');
    expect(resolveGuideStatus(1, 3)).toBe('in-progress');
    expect(resolveGuideStatus(3, 3)).toBe('completed');
  });
});

describe('filterZombiesMaps', () => {
  it('filtra por juego', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, gameId: 'bo1' });
    expect(result.map((m) => m.id)).toEqual(['a', 'd']);
  });

  it('busca por nombre sin distinguir acentos ni mayúsculas', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, search: 'ascension' });
    expect(result.map((m) => m.id)).toEqual(['a']);
  });

  it('filtra por saga chaos', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, saga: 'chaos' });
    expect(result.map((m) => m.id)).toEqual(['c']);
  });

  it('filtra mapas con misión principal', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, hasMainQuest: false });
    expect(result.map((m) => m.id)).toEqual(['d']);
  });

  it('filtra por disponibilidad en solitario', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, soloOnly: true });
    expect(result.map((m) => m.id)).toEqual(['a', 'c', 'd']);
  });

  it('filtra por número mínimo de jugadores', () => {
    const result = filterZombiesMaps(MAPS, { ...EMPTY_FILTER_CRITERIA, minimumPlayers: 1 });
    expect(result.map((m) => m.id)).toEqual(['a', 'c', 'd']);
  });

  it('combina varios filtros', () => {
    const result = filterZombiesMaps(MAPS, {
      ...EMPTY_FILTER_CRITERIA,
      gameId: 'bo1',
      hasMainQuest: true,
    });
    expect(result.map((m) => m.id)).toEqual(['a']);
  });

  it('filtra por estado usando el resolver', () => {
    const statusResolver = (map: ZombiesMap) =>
      map.id === 'a' ? ('completed' as const) : ('not-started' as const);
    const result = filterZombiesMaps(
      MAPS,
      { ...EMPTY_FILTER_CRITERIA, status: 'completed' },
      statusResolver
    );
    expect(result.map((m) => m.id)).toEqual(['a']);
  });
});

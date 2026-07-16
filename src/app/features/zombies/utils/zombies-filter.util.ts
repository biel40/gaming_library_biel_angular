import {
  GuideStatus,
  ZombiesFilterCriteria,
  ZombiesMap,
} from '../models/zombies.models';

/**
 * Normaliza texto para búsquedas insensibles a mayúsculas y acentos.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Calcula el porcentaje de progreso (0-100) de forma pura.
 */
export function computeProgressPercent(
  completedSteps: number,
  totalSteps: number
): number {
  if (totalSteps <= 0) {
    return 0;
  }
  const clamped = Math.max(0, Math.min(completedSteps, totalSteps));
  return Math.round((clamped / totalSteps) * 100);
}

/**
 * Deriva el estado de una guía a partir del progreso.
 */
export function resolveGuideStatus(
  completedSteps: number,
  totalSteps: number
): GuideStatus {
  if (totalSteps <= 0 || completedSteps <= 0) {
    return 'not-started';
  }
  if (completedSteps >= totalSteps) {
    return 'completed';
  }
  return 'in-progress';
}

/**
 * Filtra y busca mapas de forma pura y testable.
 *
 * `statusResolver` desacopla el filtro del estado persistido: recibe un mapa y
 * devuelve su estado actual. Así la lógica de filtrado no depende de servicios.
 */
export function filterZombiesMaps(
  maps: readonly ZombiesMap[],
  criteria: ZombiesFilterCriteria,
  statusResolver: (map: ZombiesMap) => GuideStatus = () => 'not-started'
): ZombiesMap[] {
  const search = normalizeText(criteria.search ?? '');

  return maps.filter((map) => {
    if (criteria.gameId && map.gameId !== criteria.gameId) {
      return false;
    }

    if (criteria.saga && map.saga !== criteria.saga) {
      return false;
    }

    if (criteria.hasMainQuest !== null && map.hasMainQuest !== criteria.hasMainQuest) {
      return false;
    }

    if (criteria.soloOnly && !map.soloAvailable) {
      return false;
    }

    if (
      criteria.minimumPlayers !== null &&
      map.minimumPlayers > criteria.minimumPlayers
    ) {
      return false;
    }

    if (criteria.status && statusResolver(map) !== criteria.status) {
      return false;
    }

    if (search) {
      const haystack = [map.name, map.mainQuestName ?? '', map.description]
        .map(normalizeText)
        .join(' ');
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

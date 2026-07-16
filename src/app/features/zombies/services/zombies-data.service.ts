import { Injectable, computed, signal } from '@angular/core';

import { ZOMBIES_GAMES } from '../data/zombies-games.data';
import { withMapVisual } from '../data/zombies-map-visuals.data';
import { ZOMBIES_MAPS } from '../data/zombies-maps.data';
import { ZombiesGame, ZombiesMap } from '../models/zombies.models';

/**
 * Fuente de datos de la sección Zombies.
 *
 * Actualmente sirve datos estáticos desde archivos locales. Está preparado para
 * sustituirse por llamadas HTTP en el futuro sin cambiar la API pública.
 */
@Injectable({ providedIn: 'root' })
export class ZombiesDataService {
  private readonly _games = signal<readonly ZombiesGame[]>(ZOMBIES_GAMES);
  private readonly _maps = signal<readonly ZombiesMap[]>(
    ZOMBIES_MAPS.map(withMapVisual)
  );

  readonly games = computed(() =>
    [...this._games()].sort((a, b) => a.order - b.order)
  );

  readonly maps = computed(() =>
    [...this._maps()].sort((a, b) => a.releaseOrder - b.releaseOrder)
  );

  getGameById(gameId: string): ZombiesGame | undefined {
    return this._games().find((game) => game.id === gameId);
  }

  getGameBySlug(slug: string): ZombiesGame | undefined {
    return this._games().find((game) => game.slug === slug);
  }

  getMapsForGame(gameId: string): ZombiesMap[] {
    return this.maps().filter((map) => map.gameId === gameId);
  }

  getMapById(mapId: string): ZombiesMap | undefined {
    return this._maps().find((map) => map.id === mapId);
  }

  getMapBySlug(gameSlug: string, mapSlug: string): ZombiesMap | undefined {
    const game = this.getGameBySlug(gameSlug);
    if (!game) {
      return undefined;
    }
    return this._maps().find(
      (map) => map.gameId === game.id && map.slug === mapSlug
    );
  }
}

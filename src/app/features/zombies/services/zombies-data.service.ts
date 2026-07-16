import { Injectable, computed, inject, signal } from '@angular/core';

import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ZOMBIES_GAMES } from '../data/zombies-games.data';
import { withMapVisual } from '../data/zombies-map-visuals.data';
import { ZOMBIES_MAPS } from '../data/zombies-maps.data';
import {
  ContentStatus,
  GuideDifficulty,
  ZombiesGame,
  ZombiesMap,
  ZombiesSaga,
} from '../models/zombies.models';

/**
 * Fuente de datos de la sección Zombies.
 *
 * El catálogo de mapas vive en la tabla global `zombies_maps` de Supabase
 * (mismo patrón que `videogames`). Se carga al iniciar y se cachea en un signal.
 * Mientras llega la respuesta —o si falla la conexión— se sirve el catálogo
 * estático local como fallback, para que la UI siga funcionando y degrade con
 * elegancia.
 */
@Injectable({ providedIn: 'root' })
export class ZombiesDataService {
  private readonly supabase = inject(SupabaseService);

  private readonly _games = signal<readonly ZombiesGame[]>(ZOMBIES_GAMES);
  private readonly _maps = signal<readonly ZombiesMap[]>(
    ZOMBIES_MAPS.map(withMapVisual)
  );

  constructor() {
    void this.loadMaps();
  }

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

  /**
   * Carga el catálogo de mapas desde Supabase. Si la respuesta está vacía o
   * falla, se conserva el catálogo estático inicial como fallback.
   */
  async loadMaps(): Promise<void> {
    try {
      const rows = await this.supabase.getZombiesMaps();
      if (rows.length > 0) {
        this._maps.set(rows.map((row) => this.mapRow(row)));
      }
    } catch (error) {
      console.error('Error al cargar los mapas de Zombies:', error);
    }
  }

  /**
   * Guarda la imagen de un mapa (solo admin) y actualiza el estado reactivo
   * para que el cambio se refleje al instante, igual que las portadas de juegos.
   */
  async setMapImage(
    mapId: string,
    imageUrl: string,
    imagePosition = 'center'
  ): Promise<void> {
    await this.supabase.updateZombiesMapImage(mapId, imageUrl, imagePosition);
    this._maps.update((maps) =>
      maps.map((map) =>
        map.id === mapId ? { ...map, imageUrl, imagePosition } : map
      )
    );
  }

  private mapRow(row: any): ZombiesMap {
    return {
      id: row.id,
      slug: row.slug,
      gameId: row.game_id,
      name: row.name,
      saga: row.saga as ZombiesSaga,
      mainQuestName: row.main_quest_name ?? undefined,
      hasMainQuest: !!row.has_main_quest,
      description: row.description,
      summary: row.summary ?? undefined,
      imageUrl: row.image_url ?? undefined,
      imageAlt: row.image_alt ?? undefined,
      imagePosition: row.image_position ?? undefined,
      difficulty: (row.difficulty as GuideDifficulty) ?? undefined,
      estimatedMinutes: row.estimated_minutes ?? undefined,
      minimumPlayers: row.minimum_players,
      maximumPlayers: row.maximum_players,
      soloAvailable: !!row.solo_available,
      releaseOrder: row.release_order,
      remasterOf: row.remaster_of ?? undefined,
      collection: row.collection ?? undefined,
      steps: row.steps ?? [],
      sideEasterEggs: row.side_easter_eggs ?? [],
      prerequisites: row.prerequisites ?? undefined,
      recommendedLoadout: row.recommended_loadout ?? undefined,
      sources: row.sources ?? undefined,
      contentStatus: row.content_status as ContentStatus,
    };
  }
}

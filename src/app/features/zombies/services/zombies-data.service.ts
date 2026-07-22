import { Injectable, computed, inject, signal } from '@angular/core';

import { SupabaseService } from '../../../services/supabase/supabase.service';
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
 * Tanto el catálogo de juegos (`zombies_games`) como el de mapas
 * (`zombies_maps`) viven en Supabase (mismo patrón que `videogames`). Se
 * cargan al iniciar y se cachean en sendos signals. No existe fallback local:
 * la fuente de verdad en runtime es siempre Supabase.
 */
@Injectable({ providedIn: 'root' })
export class ZombiesDataService {
  private readonly supabase = inject(SupabaseService);

  private readonly _games = signal<readonly ZombiesGame[]>([]);
  private readonly _maps = signal<readonly ZombiesMap[]>([]);

  constructor() {
    void this.loadGames();
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
   * Carga el catálogo de juegos desde Supabase.
   */
  async loadGames(): Promise<void> {
    try {
      const rows = await this.supabase.getZombiesGames();
      this._games.set(rows.map((row) => this.mapGameRow(row)));
    } catch (error) {
      console.error('Error al cargar los juegos de Zombies:', error);
    }
  }

  /**
   * Carga el catálogo de mapas desde Supabase.
   */
  async loadMaps(): Promise<void> {
    try {
      const rows = await this.supabase.getZombiesMaps();
      this._maps.set(rows.map((row) => this.mapRow(row)));
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

  private mapGameRow(row: any): ZombiesGame {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortTitle: row.short_title,
      numeral: row.numeral,
      releaseYear: row.release_year,
      description: row.description,
      order: row.order,
    };
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

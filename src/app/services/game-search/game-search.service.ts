import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';

import { EdgeFunctionResponse, SupabaseService } from '../supabase/supabase.service';

const IGDB_COVER_BASE_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big';
const FALLBACK_COVER_URL = '/assets/images/game-cover-placeholder.svg';

interface IgdbNamedEntity {
  readonly id: number;
  readonly name: string;
}

interface IgdbGame {
  readonly id: number;
  readonly name: string;
  readonly summary?: string;
  readonly cover?: {
    readonly id: number;
    readonly image_id?: string;
  };
  readonly first_release_date?: number;
  readonly rating?: number;
  readonly genres?: IgdbNamedEntity[];
  readonly platforms?: IgdbNamedEntity[];
}

export interface GameSearchResult {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly releaseDate: Date | null;
  readonly rating: number | null;
  readonly genres: string[];
  readonly platforms: string[];
}

@Injectable({
  providedIn: 'root',
})
export class GameSearchService {
  private readonly _supabaseService = inject(SupabaseService);

  public searchGames(query: string): Observable<GameSearchResult[]> {
    return from(this._supabaseService.invokeFunction<IgdbGame[]>('igdb-games', { search: query })).pipe(
      map((response: EdgeFunctionResponse<IgdbGame[] | null>) => this.mapSearchResponse(response)),
    );
  }

  private mapSearchResponse(response: EdgeFunctionResponse<IgdbGame[] | null>): GameSearchResult[] {
    const { data, error } = response;

    if (error) {
      throw error;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((game: IgdbGame) => this.mapGame(game));
  }

  private mapGame(game: IgdbGame): GameSearchResult {
    return {
      id: game.id,
      name: game.name,
      description: this.getDescription(game),
      imageUrl: this.getImageUrl(game),
      releaseDate: this.getReleaseDate(game),
      rating: this.getRating(game),
      genres: this.getNames(game.genres),
      platforms: this.getNames(game.platforms),
    };
  }

  private getDescription(game: IgdbGame): string {
    return game.summary ?? '';
  }

  private getImageUrl(game: IgdbGame): string {
    if (!game.cover?.image_id) {
      return FALLBACK_COVER_URL;
    }

    return `${IGDB_COVER_BASE_URL}/${game.cover.image_id}.jpg`;
  }

  private getReleaseDate(game: IgdbGame): Date | null {
    if (typeof game.first_release_date !== 'number') {
      return null;
    }

    return new Date(game.first_release_date * 1000);
  }

  private getRating(game: IgdbGame): number | null {
    return typeof game.rating === 'number' ? game.rating : null;
  }

  private getNames(items: IgdbNamedEntity[] | undefined): string[] {
    return items?.map((item: IgdbNamedEntity) => item.name) ?? [];
  }
} 
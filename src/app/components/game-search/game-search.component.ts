import { Component, EventEmitter, Output, inject, ChangeDetectorRef, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSearchService, GameSearchResult } from '../../services/game-search/game-search.service';
import { Videogame, SupabaseService } from '../../services/supabase/supabase.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-game-search',
  templateUrl: './game-search.component.html',
  styleUrls: ['./game-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class GameSearchComponent implements OnInit {
  private readonly _gameSearchService = inject(GameSearchService);
  private readonly _supabaseService = inject(SupabaseService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _cdr = inject(ChangeDetectorRef);

  @Output() public gameSelected = new EventEmitter<Partial<Videogame>>();

  private _isReadOnlyUser = signal<boolean>(false);
  public readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  public searchQuery = '';
  public searchResults: GameSearchResult[] = [];
  public isLoading = false;
  public hasSearched = false;
  public error: string | null = null;
  public selectedGame: GameSearchResult | null = null;
  public savingGames: Set<number> = new Set();
  public readonly gamesInLibrary = signal<Set<string>>(new Set());

  public ngOnInit(): void {
    this.checkReadOnlyStatus();
  }

  private async checkReadOnlyStatus(): Promise<void> {
    try {
      const isReadOnly = await this._supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
    } catch (err) {
      this._isReadOnlyUser.set(false);
    }
  }

  public searchGames(): void {
    if (!this.searchQuery.trim()) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.error = null;
    this.searchResults = [];
    this.gamesInLibrary.set(new Set());

    this._gameSearchService.searchGames(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
        this._cdr.detectChanges();
        this.checkGamesInLibrary(results);
      },
      error: () => {
        this.error = 'Error al buscar juegos. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  public selectGame(game: GameSearchResult): void {
    this.selectedGame = game;
    this.gameSelected.emit(this.toVideogame(game));
  }

  public clearSelection(): void {
    this.selectedGame = null;
  }

  /**
   * Saves a game directly to the database without user rating
   * @param game The game to save
  */
  private async checkGamesInLibrary(games: GameSearchResult[]): Promise<void> {
    for (const game of games) {
      try {
        const exists = await this._supabaseService.gameExistsInLibrary(game.name);
        if (exists) {
          this.gamesInLibrary.update(set => new Set([...set, game.name]));
        }
      } catch {
        // Si falla la verificación, no bloqueamos la UI
      }
    }
  }

  public isGameInLibrary(gameName: string): boolean {
    return this.gamesInLibrary().has(gameName);
  }

  public async saveGameToLibrary(game: GameSearchResult, event?: Event): Promise<void> {
    if (this._isReadOnlyUser()) {
      this._notificationService.error('No tienes permisos para añadir juegos');
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    // Check if game is already being saved
    if (this.savingGames.has(game.id)) {
      return;
    }

    this.savingGames.add(game.id);

    try {
      let gameExists = false;

      try {
        gameExists = await this._supabaseService.gameExistsInLibrary(game.name);
      } catch {
        gameExists = false;
      }

      if (gameExists) {
        this._notificationService.info(`${game.name} ya está en tu biblioteca`);
        this.cleanupSavingState(game.id);
        return;
      }

      const videogame = this.toVideogame(game);

      // Save to database
      try {
        await this._supabaseService.addVideogame(videogame as Omit<Videogame, 'id'>);
        this._notificationService.success(`${game.name} se ha añadido a tu biblioteca exitosamente`);
        this.gamesInLibrary.update(set => new Set([...set, game.name]));
      } catch (saveError: unknown) {
        // Check if it's a 406 error - assume the game was saved successfully
        if (this.getErrorStatus(saveError) === 406) {
          this._notificationService.success(`${game.name} se ha añadido a tu biblioteca exitosamente`);
          this.gamesInLibrary.update(set => new Set([...set, game.name]));

          // Update the gameExists flag to prevent re-saving
          gameExists = true;

          // Clean up saving state
          this.cleanupSavingState(game.id);
        } else {
          throw saveError;
        }
      }

    } catch (error: unknown) {
      this._notificationService.error(`Error al guardar ${game.name}: ${this.getErrorMessage(error)}`);
    } finally {
      this.cleanupSavingState(game.id);
    }
  }

  /**
   * Clean up the saving state for a specific game
   * @param gameId The ID of the game to clean up
  */
  private cleanupSavingState(gameId: number): void {
    this.savingGames.delete(gameId);
    this._cdr.detectChanges();
  }

  /**
   * Check if a game is currently being saved
   * @param gameId The ID of the game to check
   * @returns true if the game is being saved
  */
  public isSavingGame(gameId: number): boolean {
    const isSaving = this.savingGames.has(gameId);

    return isSaving;
  }

  private toVideogame(game: GameSearchResult): Partial<Videogame> {
    return {
      name: game.name,
      description: game.description,
      image_url: game.imageUrl,
      genre: game.genres[0] ?? '',
      platform: game.platforms[0] ?? '',
      releaseDate: game.releaseDate ?? undefined,
    };
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('status' in error)) {
      return undefined;
    }

    return typeof error.status === 'number' ? error.status : undefined;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Error desconocido';
  }
} 
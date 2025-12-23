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
  private _gameSearchService = inject(GameSearchService);
  private _supabaseService = inject(SupabaseService);
  private _notificationService = inject(NotificationService);
  private _cdr = inject(ChangeDetectorRef);

  @Output() gameSelected = new EventEmitter<Partial<Videogame>>();

  private _isReadOnlyUser = signal<boolean>(false);
  public readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  public searchQuery = '';
  public searchResults: GameSearchResult[] = [];
  public isLoading = false;
  public error: string | null = null;
  public selectedGame: GameSearchResult | null = null;
  public savingGames: Set<number> = new Set();

  ngOnInit() {
    this.checkReadOnlyStatus();
  }

  private async checkReadOnlyStatus() {
    try {
      const isReadOnly = await this._supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
    } catch (err) {
      this._isReadOnlyUser.set(false);
    }
  }

  public searchGames() {
    if (!this.searchQuery.trim()) return;

    this.isLoading = true;
    this.error = null;
    this.searchResults = [];

    this._gameSearchService.searchGames(this.searchQuery).subscribe({
      next: (response) => {
        this.searchResults = response.results;
        this.isLoading = false;
        // Force change detection to update the UI immediately
        this._cdr.detectChanges();
        console.log('Search results received and UI updated:', this.searchResults.length, 'games found');
      },
      error: (err) => {
        console.error('Error searching games:', err);
        this.error = 'Error al buscar juegos. Por favor, inténtalo de nuevo.';
        this.isLoading = false;

        // Force change detection even on error
        this._cdr.detectChanges();
      }
    });
  }

  public selectGame(game: GameSearchResult) {
    this.selectedGame = game;

    // Map the game data to our Videogame format
    const videogame: Partial<Videogame> = {
      name: game.name,
      description: game.description || '',
      image_url: game.background_image ?? '',
      genre: game.genres?.length > 0 ? game.genres[0].name : '',
      platform: game.platforms?.length > 0 ? game.platforms[0].platform.name : '',
      releaseDate: game.released ? new Date(game.released) : new Date()
    };

    this.gameSelected.emit(videogame);
  }

  public clearSelection() {
    this.selectedGame = null;
  }

  /**
   * Saves a game directly to the database without user rating
   * @param game The game to save
  */
  public async saveGameToLibrary(game: GameSearchResult, event?: Event) {
    if (this._isReadOnlyUser()) {
      this._notificationService.error('No tienes permisos para añadir juegos');
      return;
    }

    if (event) {
      event.stopPropagation();
    }

    // Check if game is already being saved
    if (this.savingGames.has(game.id)) {
      console.log('Game is already being saved, returning early');
      return;
    }

    this.savingGames.add(game.id);

    try {
      let gameExists = false;

      try {
        gameExists = await this._supabaseService.gameExistsInLibrary(game.name);
      } catch (checkError: any) {
        console.warn('Error checking if game exists (406 error), assuming it does not exist:', checkError);
        gameExists = false;
      }

      if (gameExists) {
        console.log('Game already exists, showing notification and cleaning state');
        this._notificationService.info(`${game.name} ya está en tu biblioteca`);
        this.cleanupSavingState(game.id);
        return;
      }

      const videogame: Partial<Videogame> = {
        name: game.name,
        description: game.description || '',
        image_url: game.background_image ?? '',
        genre: game.genres?.length > 0 ? game.genres[0].name : '',
        platform: game.platforms?.length > 0 ? game.platforms[0].platform.name : '',
        releaseDate: game.released ? new Date(game.released) : new Date()
      };

      // Save to database
      try {
        await this._supabaseService.addVideogame(videogame as Omit<Videogame, 'id'>);
        console.log('Game saved successfully');
        this._notificationService.success(`${game.name} se ha añadido a tu biblioteca exitosamente`);
      } catch (saveError: any) {
        console.error('Error saving game:', saveError);

        // Check if it's a 406 error - assume the game was saved successfully
        if (saveError.status === 406) {
          console.log('Received 406 error, assuming game was saved successfully');
          this._notificationService.success(`${game.name} se ha añadido a tu biblioteca exitosamente`);

          // Update the gameExists flag to prevent re-saving
          gameExists = true;

          // Clean up saving state
          this.cleanupSavingState(game.id);
        } else {
          throw saveError;
        }
      }

    } catch (error: any) {
      console.error('Unexpected error in saveGameToLibrary:', error);
      this._notificationService.error(`Error al guardar ${game.name}: ${error.message || 'Error desconocido'}`);
    } finally {
      this.cleanupSavingState(game.id);
    }
  }

  /**
   * Clean up the saving state for a specific game
   * @param gameId The ID of the game to clean up
  */
  private cleanupSavingState(gameId: number) {
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
} 
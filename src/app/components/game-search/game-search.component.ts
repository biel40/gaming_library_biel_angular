import { Component, EventEmitter, Output, inject } from '@angular/core';
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
export class GameSearchComponent {
  private _gameSearchService = inject(GameSearchService);
  private _supabaseService = inject(SupabaseService);
  private _notificationService = inject(NotificationService);

  @Output() gameSelected = new EventEmitter<Partial<Videogame>>();

  public searchQuery = '';
  public searchResults: GameSearchResult[] = [];
  public isLoading = false;
  public error: string | null = null;
  public selectedGame: GameSearchResult | null = null;
  public savingGames: Set<number> = new Set();

  public searchGames() {
    if (!this.searchQuery.trim()) return;

    this.isLoading = true;
    this.error = null;
    this.searchResults = [];

    this._gameSearchService.searchGames(this.searchQuery).subscribe({
      next: (response) => {
        this.searchResults = response.results;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error searching games:', err);
        this.error = 'Error al buscar juegos. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
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
    if (event) {
      event.stopPropagation(); // Prevent selectGame from being called
    }

    // Check if game is already being saved
    if (this.savingGames.has(game.id)) {
      return;
    }

    this.savingGames.add(game.id);

    try {
      // Check if game already exists in library
      const gameExists = await this._supabaseService.gameExistsInLibrary(game.name);

      if (gameExists) {
        this._notificationService.info(`${game.name} ya está en tu biblioteca`);
        return;
      }

      // Map the game data to our Videogame format
      const videogame: Partial<Videogame> = {
        name: game.name,
        description: game.description || '',
        image_url: game.background_image ?? '',
        genre: game.genres?.length > 0 ? game.genres[0].name : '',
        platform: game.platforms?.length > 0 ? game.platforms[0].platform.name : '',
        releaseDate: game.released ? new Date(game.released) : new Date()
      };

      // Save to database
      await this._supabaseService.addVideogame(videogame as Omit<Videogame, 'id'>);

      // Show success notification
      this._notificationService.success(`${game.name} se ha añadido a tu biblioteca exitosamente`);

    } catch (error: any) {
      console.error('Error saving game:', error);
      this._notificationService.error(`Error al guardar ${game.name}: ${error.message || 'Error desconocido'}`);
    } finally {
      this.savingGames.delete(game.id);
    }
  }

  /**
   * Check if a game is currently being saved
   * @param gameId The ID of the game to check
   * @returns true if the game is being saved
   */
  public isSavingGame(gameId: number): boolean {
    return this.savingGames.has(gameId);
  }
} 
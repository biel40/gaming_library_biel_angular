import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameSearchService, GameSearchResult } from '../../services/game-search/game-search.service';
import { Videogame } from '../../services/supabase/supabase.service';

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

  @Output() gameSelected = new EventEmitter<Partial<Videogame>>();

  public searchQuery = '';
  public searchResults: GameSearchResult[] = [];
  public isLoading = false;
  public error: string | null = null;
  public selectedGame: GameSearchResult | null = null;

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

    console.log(game);
    
    // Map the game data to our Videogame format
    const videogame: Partial<Videogame> = {
      name: game.name,
      description: game.description || '',
      image_url: game.background_image,
      genre: game.genres.length > 0 ? game.genres[0].name : '',
      platform: game.platforms?.length > 0 ? game.platforms[0].platform.name : '',
      releaseDate: game.released ? new Date(game.released) : new Date()
    };
    
    this.gameSelected.emit(videogame);
  }

  public clearSelection() {
    this.selectedGame = null;
  }
} 
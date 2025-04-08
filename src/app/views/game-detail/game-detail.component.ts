import { Component, OnInit, signal, computed, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class GameDetailComponent implements OnInit {
  private _game = signal<Videogame | null>(null);
  private _loading = signal<boolean>(true);
  private _error = signal<string | null>(null);
  private _score: WritableSignal<number> = signal<number>(0);
  private _review: WritableSignal<string> = signal<string>('');

  // Computed signals
  readonly game = computed(() => this._game());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly score = computed(() => this._score());
  readonly review = signal<string>('');
  readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
  readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Remove from favorites' : 'Add to favorites');

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    // Get the game ID from the route
    this.route.paramMap.subscribe(params => {
      const gameId = params.get('id');
      if (gameId) {
        this.loadGameDetails(gameId);
      } else {
        this._error.set('No se encontró el ID del juego');
        this._loading.set(false);
      }
    });
  }

  private async loadGameDetails(gameId: string): Promise<void> {
    try {
      const game = await this.supabaseService.getVideogameDetails(gameId);

      this._game.set(game);

      if (game) {
        this._score.set(game.score || 0);
        this._review.set(game.review || '');
      }

      if (!this._game()) {
        this._error.set('No se encontró el juego');
      }
    } catch (err) {
      this._error.set('Error al cargar los detalles del juego');
      console.error(err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Toggle the favorite status of the current game
   */
  toggleFavorite(): void {
    const currentGame = this._game();
    if (currentGame) {
      this.supabaseService.toggleFavorite(currentGame);
    }
  }

  /**
   * Update the game score
   */
  async updateGameScore(): Promise<void> {
    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      await this.supabaseService.updateGameScore(currentGame.id, this._score());
    } catch (err) {
      this._error.set('Error al actualizar la puntuación');
      console.error(err);
    }
  }

  /**
   * Update the game review and the score at the same time
  */
  public async updateGameReviewAndScore(): Promise<void> {
    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      await this.supabaseService.updateGameReview(currentGame.id, this._review());
      await this.supabaseService.updateGameScore(currentGame.id, this._score());
    } catch (err) {
      this._error.set('Error al actualizar la reseña');
      console.error(err);
    }
  }


  /**
   * Set the game score from star rating
   * @param score The score to set (1-5)
   */
  setScore(score: number): void {
    this._score.set(score);
  }
}

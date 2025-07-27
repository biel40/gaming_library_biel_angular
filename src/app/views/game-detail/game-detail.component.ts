import { Component, OnInit, signal, computed, WritableSignal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { NotificationService } from '../../services/notification/notification.service';

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
  readonly review = computed(() => this._review());
  readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
  readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
  readonly platinumIcon = computed(() => this._game()?.platinum ? 'emoji_events' : 'emoji_events');
  readonly platinumTitle = computed(() => this._game()?.platinum ? 'Quitar Platino' : 'Marcar como Platino');

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
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
      this.notificationService.success('Puntuación guardada correctamente');
    } catch (err) {
      this._error.set('Error al actualizar la puntuación');
      this.notificationService.error('Error al guardar la puntuación');
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
      this.notificationService.success('Valoración guardada correctamente');

      // Update the local game object
      const updatedGame = { ...currentGame };

      updatedGame.review = this._review();
      updatedGame.score = this._score();
      this._game.set(updatedGame);
    } catch (err) {
      this._error.set('Error al actualizar la reseña');
      this.notificationService.error('Error al guardar la valoración');
      console.error(err);
    }
  }

  /**
   * Remove the game review and score
  */
  public async removeGameReviewAndScore(): Promise<void> {
    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      await this.supabaseService.removeGameReviewAndScore(currentGame.id);
      this.notificationService.success('Valoración eliminada correctamente');

      // Update the local game object with the removed values
      const updatedGame = { ...currentGame };
      updatedGame.review = '';
      updatedGame.score = 0;
      this._game.set(updatedGame);

      // Reset the local signals
      this._review.set('');
      this._score.set(0);
    } catch (err) {
      this._error.set('Error al eliminar la valoración');
      this.notificationService.error('Error al eliminar la valoración');
      console.error(err);
    }
  }


  /**
   * Set the game score from star rating
   * @param score The score to set (1-5)
   */
  public setScore(score: number): void {
    this._score.set(score);
  }

  /**
   * Set the game review text
   * @param review The review text to set
  */
  public setReview(review: string): void {
    this._review.set(review);
  }

  /**
   * Toggle the platinum status of the current game
  */
  async togglePlatinum(): Promise<void> {
    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      const updatedGame = await this.supabaseService.togglePlatinum(currentGame.id);

      this._game.set(updatedGame);

      // Show notification
      const message = updatedGame.platinum
        ? `¡${updatedGame.name} marcado como Platineado!`
        : `${updatedGame.name} ya no está Platineado`;
      this.notificationService.success(message);

    } catch (err) {
      this._error.set('Error al actualizar el estado de Platineado');
      this.notificationService.error('Error al actualizar el Platineado');
      console.error(err);
    }
  }
}

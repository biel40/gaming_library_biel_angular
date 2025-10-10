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
  private _description: WritableSignal<string> = signal<string>('');
  private _isEditingDescription = signal<boolean>(false);
  private _isEditingReview = signal<boolean>(false);
  private _isReadOnlyUser = signal<boolean>(false);
  private _hoursPlayed: WritableSignal<number> = signal<number>(0);
  private _isEditingHours = signal<boolean>(false);

  // Computed signals
  readonly game = computed(() => this._game());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly score = computed(() => this._score());
  readonly review = computed(() => this._review());
  readonly description = computed(() => this._description());
  readonly isEditingDescription = computed(() => this._isEditingDescription());
  readonly isEditingReview = computed(() => this._isEditingReview());
  readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());
  readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
  readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
  readonly platinumIcon = computed(() => this._game()?.platinum ? 'emoji_events' : 'emoji_events');
  readonly platinumTitle = computed(() => this._game()?.platinum ? 'Quitar Platino' : 'Marcar como Platino');
  readonly hoursPlayed = computed(() => this._hoursPlayed());
  readonly isEditingHours = computed(() => this._isEditingHours());
  readonly currentlyPlayingIcon = computed(() => this._game()?.currently_playing ? 'pause' : 'play_arrow');
  readonly currentlyPlayingTitle = computed(() => this._game()?.currently_playing ? 'Dejar de jugar' : 'Jugando actualmente');

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Check if current user is read-only
    this.checkReadOnlyUser();

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

  private async checkReadOnlyUser(): Promise<void> {
    try {
      const isReadOnly = await this.supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
    } catch (error) {
      console.error('Error checking read-only user status:', error);
      this._isReadOnlyUser.set(false);
    }
  }

  private async loadGameDetails(gameId: string): Promise<void> {
    try {
      const game = await this.supabaseService.getVideogameDetails(gameId);

      this._game.set(game);

      if (game) {
        this._score.set(game.score || 0);
        this._review.set(game.review || '');
        this._description.set(game.description || '');
        this._hoursPlayed.set(game.hours_played || 0);
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
  public toggleFavorite(): void {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar favoritos en modo solo lectura');
      return;
    }

    const currentGame = this._game();
    if (currentGame) {
      this.supabaseService.toggleFavorite(currentGame);
    }
  }

  /**
   * Update the game score
   */
  public async updateGameScore(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar puntuaciones en modo solo lectura');
      return;
    }

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
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar valoraciones en modo solo lectura');
      return;
    }

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
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para eliminar valoraciones en modo solo lectura');
      return;
    }

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
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar puntuaciones en modo solo lectura');
      return;
    }
    this._score.set(score);
  }

  /**
   * Set the game review text
   * @param review The review text to set
  */
  public setReview(review: string): void {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar reseñas en modo solo lectura');
      return;
    }
    this._review.set(review);
  }

  /**
   * Start editing the review
   */
  public startEditingReview(): void {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar reseñas en modo solo lectura');
      return;
    }
    this._isEditingReview.set(true);
  }

  /**
   * Cancel editing the review
   */
  public cancelEditingReview(): void {
    const currentGame = this._game();
    if (currentGame) {
      this._review.set(currentGame.review || '');
      this._score.set(currentGame.score || 0);
    }
    this._isEditingReview.set(false);
  }

  /**
   * Update the game review and score (for edit mode)
   */
  public async saveReviewChanges(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar valoraciones en modo solo lectura');
      return;
    }

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

      // Exit editing mode
      this._isEditingReview.set(false);
    } catch (err) {
      this._error.set('Error al actualizar la reseña');
      this.notificationService.error('Error al guardar la valoración');
      console.error(err);
    }
  }

  /**
   * Remove the game review and score (for edit mode)
   */
  public async removeReviewFromEditMode(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para eliminar valoraciones en modo solo lectura');
      return;
    }

    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      await this.supabaseService.removeGameReviewAndScore(currentGame.id);
      this.notificationService.success('Valoración eliminada correctamente');

      // Update the local game object
      const updatedGame = { ...currentGame };
      updatedGame.review = '';
      updatedGame.score = 0;
      this._game.set(updatedGame);

      // Reset the local signals and exit editing mode
      this._review.set('');
      this._score.set(0);
      this._isEditingReview.set(false);
    } catch (err) {
      this._error.set('Error al eliminar la valoración');
      this.notificationService.error('Error al eliminar la valoración');
      console.error(err);
    }
  }

  /**
   * Start editing the description
   */
  public startEditingDescription(): void {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar descripciones en modo solo lectura');
      return;
    }
    this._isEditingDescription.set(true);
  }

  /**
   * Cancel editing the description
   */
  public cancelEditingDescription(): void {
    const currentGame = this._game();
    if (currentGame) {
      this._description.set(currentGame.description || '');
    }
    this._isEditingDescription.set(false);
  }

  /**
   * Set the game description text
   * @param description The description text to set
   */
  public setDescription(description: string): void {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar descripciones en modo solo lectura');
      return;
    }
    this._description.set(description);
  }

  /**
   * Update the game description
   */
  public async updateGameDescription(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar descripciones en modo solo lectura');
      return;
    }

    const currentGame = this._game();
    if (!currentGame || !currentGame.id) return;

    try {
      await this.supabaseService.updateGameDescription(currentGame.id, this._description());
      this.notificationService.success('Descripción actualizada correctamente');

      // Update the local game object
      const updatedGame = { ...currentGame };
      updatedGame.description = this._description();
      this._game.set(updatedGame);

      // Exit editing mode
      this._isEditingDescription.set(false);
    } catch (err) {
      this._error.set('Error al actualizar la descripción');
      this.notificationService.error('Error al guardar la descripción');
      console.error(err);
    }
  }

  /**
   * Toggle the platinum status of the current game
  */
  public async togglePlatinum(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar el estado de Platino en modo solo lectura');
      return;
    }

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

  /**
   * Toggle the currently playing status of the current game
   */
  public async toggleCurrentlyPlaying(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.notificationService.info('No tienes permisos para modificar juegos en modo solo lectura');
      return;
    }

    const currentGame = this._game();
    
    if (!currentGame || !currentGame.id) return;

    try {
      const newStatus = !currentGame.currently_playing;
      await this.supabaseService.updateGameCurrentlyPlaying(currentGame.id, newStatus);

      // Update local state
      this._game.set({
        ...currentGame,
        currently_playing: newStatus
      });

      // Show notification
      const message = newStatus
        ? `${currentGame.name} añadido a juegos en progreso`
        : `${currentGame.name} eliminado de juegos en progreso`;
      this.notificationService.success(message);

    } catch (err) {
      console.error('Error toggling currently playing status:', err);
      this.notificationService.error('Error al actualizar el estado del juego');
    }
  }

  /**
   * Start editing the hours played
   */
  public startEditingHours(): void {
    if (this._isReadOnlyUser()) return;
    this._isEditingHours.set(true);
  }

  /**
   * Cancel editing the hours played
   */
  public cancelEditingHours(): void {
    const currentGame = this._game();
    if (currentGame) {
      this._hoursPlayed.set(currentGame.hours_played || 0);
    }
    this._isEditingHours.set(false);
  }

  /**
   * Save the updated hours played
   */
  public async saveHours(): Promise<void> {
    if (this._isReadOnlyUser()) return;

    const currentGame = this._game();
    const newHours = this._hoursPlayed();
    
    if (!currentGame || !currentGame.id) return;

    if (newHours < 0) {
      this.notificationService.error('Las horas no pueden ser negativas');
      return;
    }

    try {
      await this.supabaseService.updateGameHoursPlayed(currentGame.id, newHours);

      // Update local state
      this._game.set({
        ...currentGame,
        hours_played: newHours
      });

      this.notificationService.success('Horas actualizadas correctamente');
      this._isEditingHours.set(false);

    } catch (err) {
      console.error('Error updating hours played:', err);
      this.notificationService.error('Error al actualizar las horas jugadas');
    }
  }

  /**
   * Update hours value from input
   */
  public updateHoursValue(value: number): void {
    this._hoursPlayed.set(value);
  }

  /**
   * Format hours for display
   */
  public formatHours(hours: number): string {
    if (hours < 1) {
      return '< 1h';
    } else if (hours === 1) {
      return '1 hora';
    } else {
      return `${hours} horas`;
    }
  }
}

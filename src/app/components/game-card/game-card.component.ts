import { Component, Input, Output, EventEmitter, signal, computed, inject } from "@angular/core";
import { Videogame, SupabaseService, HallOfFameFullError, HALL_OF_FAME_MAX } from "../../services/supabase/supabase.service";
import { NotificationService } from "../../services/notification/notification.service";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class GameCardComponent {
  private _game = signal<Videogame | null>(null);
  
  @Input() set game(value: Videogame) {
    this._game.set(value);
  }

  @Input() selectMode: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() theme: 'dark' | 'light' = 'dark';

  @Output() platinumTargetChanged = new EventEmitter<Videogame>();

  readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
  readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
  readonly gameId = computed(() => this._game()?.id);
  readonly gameName = computed(() => this._game()?.name);
  readonly gameDescription = computed(() => {
    const description = this._game()?.description;
    if (!description || description.trim() === '') {
      return this.getPlaceholderDescription();
    }
    return description;
  });
  readonly gameGenre = computed(() => this._game()?.genre);
  readonly gamePlatform = computed(() => this._game()?.platform);
  readonly gameReleaseDate = computed(() => this._game()?.releaseDate);
  readonly gameImageUrl = computed(() => this._game()?.image_url);
  readonly isPlatinumTarget = computed(() => this._game()?.platinum_target || false);
  readonly platinumTargetIcon = computed(() => this.isPlatinumTarget() ? 'flag' : 'outlined_flag');
  readonly platinumTargetTitle = computed(() => 
    this.isPlatinumTarget() ? 'Quitar como objetivo de platino' : 'Marcar como objetivo de platino'
  );
  readonly isHallOfFame = computed(() => this._game()?.hall_of_fame || false);
  readonly hallOfFameTitle = computed(() =>
    this.isHallOfFame() ? 'Quitar del Hall de la Fama' : 'Añadir al Hall de la Fama'
  );

  private _hallOfFameLoading = signal(false);
  readonly hallOfFameLoading = computed(() => this._hallOfFameLoading());

  private _supabaseService: SupabaseService = inject(SupabaseService);
  private _notificationService: NotificationService = inject(NotificationService);

  constructor() { }

  private getPlaceholderDescription(): string {
    const placeholders = [
      'Este juego forma parte de tu biblioteca personal. Añade una valoración y comparte tu experiencia con otros jugadores.',
      'Un título fascinante que espera ser descubierto. Explora mundos increíbles y vive aventuras épicas.',
      'Una experiencia única de juego que te mantendrá entretenido durante horas. ¡Sumérgete en esta aventura!',
      'Descubre nuevas mecánicas de juego y disfruta de una experiencia inmersiva llena de sorpresas.',
      'Un juego que combina diversión y desafío. Perfecto para relajarse o ponerse a prueba.',
      'Una obra maestra del entretenimiento interactivo. Cada partida es una nueva oportunidad de diversión.',
      'Explora, conquista y disfruta de este increíble título. Una experiencia de juego que no olvidarás.',
      'Un videojuego que destaca por su jugabilidad única y su capacidad de mantenerte enganchado.'
    ];

    // Usar el nombre del juego para generar un índice consistente
    const gameName = this._game()?.name || '';
    const index = gameName.length % placeholders.length;
    return placeholders[index];
  }

  /**
   * Toggle favorite status for this game
   * @param event The click event
   */
  public async toggleFavorite(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    if (this.isReadOnly) {
      this._notificationService.info('No tienes permisos para modificar favoritos en modo solo lectura.');
      return;
    }

    const currentGame = this._game();
    if (currentGame) {
      try {
        await this._supabaseService.toggleFavorite(currentGame);
      } catch (err) {
        this._notificationService.error('Error al actualizar favorito');
      }
    }
  }

  /**
   * Add or remove this game from the Hall of Fame
   * @param event The click event
   */
  public async toggleHallOfFame(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    if (this.isReadOnly) {
      this._notificationService.info('No tienes permisos para modificar el Hall de la Fama en modo solo lectura.');
      return;
    }

    const currentGame = this._game();
    if (!currentGame?.id || this._hallOfFameLoading()) return;

    this._hallOfFameLoading.set(true);
    try {
      const updatedGame = await this._supabaseService.toggleHallOfFame(currentGame);
      this._game.set(updatedGame);
      this._notificationService.success(
        updatedGame.hall_of_fame
          ? `"${currentGame.name}" entra en tu Hall de la Fama`
          : `"${currentGame.name}" sale de tu Hall de la Fama`
      );
    } catch (error) {
      if (error instanceof HallOfFameFullError) {
        this._notificationService.error(
          `Tu Hall de la Fama ya tiene ${HALL_OF_FAME_MAX} juegos. Quita uno antes de añadir otro.`
        );
        return;
      }
      console.error('Error toggling hall of fame:', error);
      this._notificationService.error('Error al actualizar el Hall de la Fama');
    } finally {
      this._hallOfFameLoading.set(false);
    }
  }

  /**
   * Toggle platinum target status for this game
   * @param event The click event
   */
  public async togglePlatinumTarget(event: MouseEvent): Promise<void> {
    // Prevent navigation to game details when clicking the flag
    event.stopPropagation();
    event.preventDefault();

    if (this.isReadOnly) {
      this._notificationService.info('No tienes permisos para modificar objetivos de platino en modo solo lectura.');
      return;
    }

    const currentGame = this._game();
    if (!currentGame?.id) return;

    try {
      let updatedGame: Videogame;
      
      if (this.isPlatinumTarget()) {
        // Remove platinum target
        updatedGame = await this._supabaseService.removePlatinumTarget(currentGame.id);
        this._notificationService.success(`"${currentGame.name}" ya no es tu objetivo de platino`);
      } else {
        // Set as platinum target
        updatedGame = await this._supabaseService.setPlatinumTarget(currentGame.id);
        this._notificationService.success(`"${currentGame.name}" marcado como objetivo de platino`);
      }

      // Update the local game data
      this._game.set({
        ...currentGame,
        platinum_target: updatedGame.platinum_target
      });

      // Emit the event to notify parent components
      this.platinumTargetChanged.emit({
        ...currentGame,
        platinum_target: updatedGame.platinum_target
      });

    } catch (error) {
      console.error('Error toggling platinum target:', error);
      this._notificationService.error('Error al actualizar el objetivo de platino');
    }
  }
}
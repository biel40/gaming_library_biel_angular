import { Component, Input, signal, computed, inject, OnInit } from "@angular/core";
import { Videogame, SupabaseService } from "../../services/supabase/supabase.service";
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
export class GameCardComponent implements OnInit {
  private _game = signal<Videogame | null>(null);
  private _isReadOnlyUser = signal<boolean>(false);
  
  @Input() set game(value: Videogame) {
    this._game.set(value);
  }

  @Input() selectMode = signal(false);

  // Computed signals for template bindings
  readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
  readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
  readonly gameId = computed(() => this._game()?.id);
  readonly gameName = computed(() => this._game()?.name);
  readonly gameDescription = computed(() => {
    const description = this._game()?.description;
    // Si no hay descripción o está vacía, devolver una descripción placeholder
    if (!description || description.trim() === '') {
      return this.getPlaceholderDescription();
    }
    return description;
  });
  readonly gameGenre = computed(() => this._game()?.genre);
  readonly gamePlatform = computed(() => this._game()?.platform);
  readonly gameReleaseDate = computed(() => this._game()?.releaseDate);
  readonly gameImageUrl = computed(() => this._game()?.image_url);
  readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  private _supabaseService: SupabaseService = inject(SupabaseService);
  private _notificationService: NotificationService = inject(NotificationService);

  constructor() { }

  async ngOnInit(): Promise<void> {
    await this.checkReadOnlyUser();
  }

  private async checkReadOnlyUser(): Promise<void> {
    try {
      const isReadOnly = await this._supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
    } catch (error) {
      console.error('Error checking read-only user status:', error);
      this._isReadOnlyUser.set(false);
    }
  }

  /**
   * Genera una descripción placeholder variada basada en el nombre del juego
   * @returns Una descripción placeholder
   */
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
  toggleFavorite(event: MouseEvent): void {
    // Prevent navigation to game details when clicking the star
    event.stopPropagation();
    event.preventDefault();

    if (this._isReadOnlyUser()) {
      this._notificationService.info('No tienes permisos para modificar favoritos en modo solo lectura.');
      return;
    }

    const currentGame = this._game();
    if (currentGame) {
      // Toggle the favorite status through the service
      this._supabaseService.toggleFavorite(currentGame);
    }
  }
}
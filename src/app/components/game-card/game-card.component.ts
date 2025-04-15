import { Component, Input, signal, computed } from "@angular/core";
import { Videogame, SupabaseService } from "../../services/supabase/supabase.service";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { inject } from "@angular/core";

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
    
    // Input for select mode
    @Input() selectMode = signal(false);
    
    // Computed signals for template bindings
    readonly favoriteIcon = computed(() => this._game()?.favorite ? 'star' : 'star_border');
    readonly favoriteTitle = computed(() => this._game()?.favorite ? 'Remove from favorites' : 'Add to favorites');
    readonly gameId = computed(() => this._game()?.id);
    readonly gameName = computed(() => this._game()?.name);
    readonly gameDescription = computed(() => this._game()?.description);
    readonly gameGenre = computed(() => this._game()?.genre);
    readonly gamePlatform = computed(() => this._game()?.platform);
    readonly gameReleaseDate = computed(() => this._game()?.releaseDate);
    readonly gameImageUrl = computed(() => this._game()?.image_url);
    
    private _supabaseService: SupabaseService = inject(SupabaseService);
    
    constructor() {}
    
    /**
     * Toggle favorite status for this game
     * @param event The click event
     */
    toggleFavorite(event: MouseEvent): void {
      // Prevent navigation to game details when clicking the star
      event.stopPropagation();
      event.preventDefault();
      
      const currentGame = this._game();
      if (currentGame) {
        // Toggle the favorite status through the service
        this._supabaseService.toggleFavorite(currentGame);
      }
    }
}
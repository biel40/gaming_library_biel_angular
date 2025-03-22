import { Component, Input } from "@angular/core";
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
    @Input() game!: Videogame;
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
      
      // Toggle the favorite status through the service
      this._supabaseService.toggleFavorite(this.game);
    }

  }
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-game-detail',
  templateUrl: './game-detail.component.html',
  styleUrls: ['./game-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class GameDetailComponent implements OnInit {
  game: Videogame | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    // Get the game ID from the route
    this.route.paramMap.subscribe(params => {
      const gameId = params.get('id');
      if (gameId) {
        this.loadGameDetails(gameId);
      } else {
        this.error = 'No se encontró el ID del juego';
        this.loading = false;
      }
    });
  }

  private async loadGameDetails(gameId: string): Promise<void> {
    try {
      const game = await this.supabaseService.getVideogameDetails(gameId);

      this.game = game;

      if (!this.game) {
        this.error = 'No se encontró el juego';
      }
    } catch (err) {
      console.error('Error loading game details:', err);
      this.error = 'Error al cargar los detalles del juego';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Toggle the favorite status of the current game
   */
  toggleFavorite(): void {
    if (this.game) {
      this.supabaseService.toggleFavorite(this.game);
    }
  }
}

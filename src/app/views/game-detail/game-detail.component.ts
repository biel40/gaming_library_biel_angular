import { Component, OnInit } from '@angular/core';
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

  /**
   * Update the game score
   */
  async updateGameScore(): Promise<void> {
    if (this.game && this.game.id) {
      try {
        await this.supabaseService.updateGameScore(this.game.id, this.game.score || 0);
      } catch (err) {
        console.error('Error updating game score:', err);
        this.error = 'Error al actualizar la puntuación';
      }
    }
  }

  /**
   * Update the game review
   */
  async updateGameReview(): Promise<void> {
    if (this.game && this.game.id) {
      try {
        await this.supabaseService.updateGameReview(this.game.id, this.game.review || '');
      } catch (err) {
        console.error('Error updating game review:', err);
        this.error = 'Error al actualizar la review';
      }
    }
  }

  /**
   * Set the game score from star rating
   * @param score The score to set (1-10)
   */
  setScore(score: number): void {
    if (this.game) {
      this.game.score = score;
      this.updateGameScore();
    }
  }
}

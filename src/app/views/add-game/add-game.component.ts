import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { GameSearchComponent } from '../../components/game-search/game-search.component';

@Component({
  selector: 'app-add-game',
  templateUrl: './add-game.component.html',
  styleUrls: ['./add-game.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GameSearchComponent,
    RouterLink
  ]
})
export class AddGameComponent {
  private _supabaseService = inject(SupabaseService);
  private _router = inject(Router);

  public game: Partial<Videogame> = {
    name: '',
    description: '',
    genre: '',
    platform: '',
    image_url: '',
    releaseDate: new Date()
  };

  public isLoading = false;
  public error: string | null = null;
  public useSearch = true;
  public showManualForm = false;

  public onGameSelected(gameData: Partial<Videogame>) {
    this.game = { ...this.game, ...gameData };
  }

  public toggleManualForm() {
    this.showManualForm = !this.showManualForm;
  }

  public async onSubmit() {
    try {
      this.isLoading = true;
      this.error = null;

      await this._supabaseService.addVideogame(this.game as Omit<Videogame, 'id'>);

      this._router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Error adding game:', err);
      this.error = err.message || 'Error al añadir el juego. Por favor, inténtalo de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  public goBack() {
    this._router.navigate(['/dashboard']);
  }

  public toggleSearch() {
    this.useSearch = !this.useSearch;
  }
} 
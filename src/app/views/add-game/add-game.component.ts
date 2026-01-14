import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { GameSearchComponent } from '../../components/game-search/game-search.component';

@Component({
  selector: 'app-add-game',
  templateUrl: './add-game.component.html',
  styleUrls: ['./add-game.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    GameSearchComponent,
    RouterLink
  ]
})
export class AddGameComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);

  private _isReadOnlyUser = signal<boolean>(false);
  public readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  ngOnInit() {
    this.checkReadOnlyStatus();
  }

  private async checkReadOnlyStatus() {
    try {
      const isReadOnly = await this._supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
    } catch {
      this._isReadOnlyUser.set(false);
    }
  }

  public onGameSelected(gameData: Partial<Videogame>) {
    console.log('Game selected:', gameData);
  }
} 
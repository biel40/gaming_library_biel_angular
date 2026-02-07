import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { GameSearchComponent } from '../../components/game-search/game-search.component';
import { NotificationService } from '../../services/notification/notification.service';

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
  private _router = inject(Router);
  private _notificationService = inject(NotificationService);

  private _isReadOnlyUser = signal<boolean>(false);
  public readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  ngOnInit() {
    this.checkReadOnlyStatus();
  }

  private async checkReadOnlyStatus() {
    try {
      const isReadOnly = await this._supabaseService.isReadOnlyUser();
      this._isReadOnlyUser.set(isReadOnly);
      
      if (isReadOnly) {
        this._notificationService.info('No tienes permisos para añadir juegos. Solo lectura.');
        this._router.navigate(['/dashboard']);
      }
    } catch {
      this._isReadOnlyUser.set(false);
    }
  }

  public onGameSelected(gameData: Partial<Videogame>) {
    console.log('Game selected:', gameData);
  }
} 
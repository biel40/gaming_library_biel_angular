import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService, Profile } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);

  private _profiles = signal<Profile[]>([]);
  private _loading = signal<boolean>(true);
  private _error = signal<string | null>(null);
  private _currentUserId = signal<string | null>(null);

  readonly profiles = computed(() => this._profiles());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly currentUserId = computed(() => this._currentUserId());

  readonly hasProfiles = computed(() => this._profiles().length > 0);

  ngOnInit(): void {
    this._loadData();
  }

  private async _loadData(): Promise<void> {
    try {
      const session = await this._supabaseService.getSession();
      if (session) {
        this._currentUserId.set(session.user.id);
      }
      const profiles = await this._supabaseService.getAllProfiles();
      this._profiles.set(profiles);
    } catch (err) {
      this._error.set('No se pudieron cargar los perfiles de usuario.');
      console.error('Error loading profiles:', err);
    } finally {
      this._loading.set(false);
    }
  }

  public getAvatarLetter(profile: Profile): string {
    return (profile.name || 'U').charAt(0).toUpperCase();
  }
}

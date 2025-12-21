import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { NotificationService } from '../../services/notification/notification.service';
import { GenreNormalizerService } from '../../services/genre-normalizer/genre-normalizer.service';

@Component({
  selector: 'app-currently-playing',
  templateUrl: './currently-playing.component.html',
  styleUrls: ['./currently-playing.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class CurrentlyPlayingComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);
  private _notificationService = inject(NotificationService);
  private _genreNormalizer = inject(GenreNormalizerService);

  private _currentlyPlayingGames = signal<Videogame[]>([]);
  private _loading = signal<boolean>(true);
  private _error = signal<string | null>(null);
  private _isReadOnlyUser = signal<boolean>(false);
  private _editingHours = signal<string | null>(null);
  private _tempHours = signal<number>(0);
  private _searchTerm = signal<string>('');
  private _activeGenre = signal<string>('All');
  private _activePlatform = signal<string>('All');
  

  // Computed signals
  readonly currentlyPlayingGames = computed(() => this._currentlyPlayingGames());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());
  readonly editingHours = computed(() => this._editingHours());
  readonly tempHours = computed(() => this._tempHours());
  readonly searchTerm = computed(() => this._searchTerm());
  readonly activeGenre = computed(() => this._activeGenre());
  readonly activePlatform = computed(() => this._activePlatform());
  
  // Filtered games
  readonly filteredGames = computed(() => {
    let games = this._currentlyPlayingGames();
    
    // Filter by search term
    const search = this._searchTerm().toLowerCase().trim();
    if (search) {
      games = games.filter(game => 
        game.name?.toLowerCase().includes(search) ||
        game.description?.toLowerCase().includes(search)
      );
    }
    
    // Filter by genre
    if (this._activeGenre() !== 'All') {
      games = games.filter(game => 
        this._genreNormalizer.normalizeGenre(game.genre) === this._activeGenre()
      );
    }
    
    // Filter by platform
    if (this._activePlatform() !== 'All') {
      games = games.filter(game => game.platform === this._activePlatform());
    }
    
    return games;
  });

  // Grouped games by platform
  readonly gamesByPlatform = computed(() => {
    const games = this.filteredGames();
    const groups: { [platform: string]: Videogame[] } = {};
    
    games.forEach(game => {
      const platform = game.platform || 'Sin plataforma';
      if (!groups[platform]) {
        groups[platform] = [];
      }
      groups[platform].push(game);
    });
    
    // Sort platforms alphabetically, but put "Sin plataforma" at the end
    const sortedPlatforms = Object.keys(groups).sort((a, b) => {
      if (a === 'Sin plataforma') return 1;
      if (b === 'Sin plataforma') return -1;
      return a.localeCompare(b);
    });
    
    const sortedGroups: { platform: string; games: Videogame[] }[] = [];
    sortedPlatforms.forEach(platform => {
      // Sort games within each platform by name
      const sortedGames = groups[platform].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );
      sortedGroups.push({ platform, games: sortedGames });
    });
    
    return sortedGroups;
  });

  readonly hasMultiplePlatforms = computed(() => this.gamesByPlatform().length > 1);
  
  readonly totalHours = computed(() => 
    this.filteredGames().reduce((sum, game) => sum + (game.hours_played || 0), 0)
  );
  readonly hasGames = computed(() => this._currentlyPlayingGames().length > 0);
  readonly hasFilteredGames = computed(() => this.filteredGames().length > 0);
  
  // Unique values for filters
  readonly uniqueGenres = computed(() => {
    const genres = this._currentlyPlayingGames().map(game => game.genre);
    return this._genreNormalizer.getUniqueNormalizedGenres(genres);
  });
  
  readonly uniquePlatforms = computed(() => {
    const platforms = this._currentlyPlayingGames()
      .map(game => game.platform)
      .filter(platform => platform && platform.trim() !== '');
    return ['All', ...Array.from(new Set(platforms))];
  });

  async ngOnInit(): Promise<void> {
    this.checkReadOnlyUser();
    await this.loadCurrentlyPlayingGames();
  }

  private checkReadOnlyUser(): void {
    this._supabaseService.isReadOnlyUser().then(isReadOnly => {
      this._isReadOnlyUser.set(isReadOnly);
    }).catch(() => {
      this._isReadOnlyUser.set(false);
    });
  }

  private async loadCurrentlyPlayingGames(): Promise<void> {
    try {
      this._loading.set(true);
      this._error.set(null);
      
      const games = await this._supabaseService.getCurrentlyPlayingGames();
      this._currentlyPlayingGames.set(games);
    } catch (error: any) {
      console.error('Error loading currently playing games:', error);
      this._error.set('Error al cargar los juegos en progreso');
    } finally {
      this._loading.set(false);
    }
  }

  public async toggleCurrentlyPlaying(game: Videogame): Promise<void> {
    if (this._isReadOnlyUser()) {
      this._notificationService.error('No tienes permisos para modificar juegos');
      return;
    }

    if (!game.id) return;

    try {
      const newStatus = !game.currently_playing;
      await this._supabaseService.updateGameCurrentlyPlaying(game.id, newStatus);
      
      if (newStatus) {
        this._notificationService.success(`${game.name} añadido a juegos en progreso`);
      } else {
        this._notificationService.success(`${game.name} eliminado de juegos en progreso`);
        // Remove from local state if no longer currently playing
        const updatedGames = this._currentlyPlayingGames().filter(g => g.id !== game.id);
        this._currentlyPlayingGames.set(updatedGames);
      }
    } catch (error: any) {
      console.error('Error updating currently playing status:', error);
      this._notificationService.error('Error al actualizar el estado del juego');
    }
  }

  public startEditingHours(gameId: string, currentHours: number): void {
    if (this._isReadOnlyUser()) return;
    
    this._editingHours.set(gameId);
    this._tempHours.set(currentHours);
  }

  public cancelEditingHours(): void {
    this._editingHours.set(null);
    this._tempHours.set(0);
  }

  public updateTempHours(value: number): void {
    this._tempHours.set(value);
  }

  public async saveHours(game: Videogame): Promise<void> {
    if (this._isReadOnlyUser() || !game.id) return;

    const newHours = this._tempHours();
    
    if (newHours < 0) {
      this._notificationService.error('Las horas no pueden ser negativas');
      return;
    }

    try {
      await this._supabaseService.updateGameHoursPlayed(game.id, newHours);
      
      // Update local state
      const updatedGames = this._currentlyPlayingGames().map(g =>
        g.id === game.id ? { ...g, hours_played: newHours } : g
      );
      this._currentlyPlayingGames.set(updatedGames);
      
      this._notificationService.success(`Horas actualizadas para ${game.name}`);
      this.cancelEditingHours();
    } catch (error: any) {
      console.error('Error updating hours played:', error);
      this._notificationService.error('Error al actualizar las horas jugadas');
    }
  }

  public formatHours(hours: number): string {
    if (hours < 1) {
      return '< 1h';
    } else if (hours === 1) {
      return '1 hora';
    } else {
      return `${hours} horas`;
    }
  }

  public async refreshGames(): Promise<void> {
    await this.loadCurrentlyPlayingGames();
  }

  public filterByGenre(genre: string): void {
    this._activeGenre.set(genre);
  }

  public filterByPlatform(platform: string): void {
    this._activePlatform.set(platform);
  }

  public updateSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  public resetFilters(): void {
    this._searchTerm.set('');
    this._activeGenre.set('All');
    this._activePlatform.set('All');
  }

  public getActiveFiltersCount(): number {
    let count = 0;
    if (this._searchTerm()) count++;
    if (this._activeGenre() !== 'All') count++;
    if (this._activePlatform() !== 'All') count++;
    return count;
  }

  public getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      'PlayStation 5': '🎮',
      'PlayStation 4': '🎮',
      'PlayStation 3': '🎮',
      'PlayStation 2': '🎮',
      'PlayStation': '🎮',
      'Xbox Series X/S': '🎯',
      'Xbox One': '🎯',
      'Xbox 360': '🎯',
      'Xbox': '🎯',
      'Nintendo Switch': '🕹️',
      'Nintendo 3DS': '🕹️',
      'Nintendo DS': '🕹️',
      'PC': '💻',
      'Steam': '💻',
      'Steam Deck': '💻',
      'Mac': '🖥️',
      'Mobile': '📱',
      'Android': '📱',
      'iOS': '📱',
      'Sin plataforma': '❓'
    };
    
    // Try exact match first
    if (icons[platform]) {
      return icons[platform];
    }
    
    // Try partial matches
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('playstation') || platformLower.includes('ps')) return '🎮';
    if (platformLower.includes('xbox')) return '🎯';
    if (platformLower.includes('nintendo') || platformLower.includes('switch')) return '🕹️';
    if (platformLower.includes('pc') || platformLower.includes('steam')) return '💻';
    if (platformLower.includes('mobile') || platformLower.includes('android') || platformLower.includes('ios')) return '📱';
    
    return '🎮'; // Default gaming icon
  }

  public getPlatformHours(platform: string): number {
    const platformGroup = this.gamesByPlatform().find(group => group.platform === platform);
    return platformGroup ? platformGroup.games.reduce((sum, game) => sum + (game.hours_played || 0), 0) : 0;
  }
}
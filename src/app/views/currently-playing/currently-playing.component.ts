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

  ngOnInit(): void {
    this.checkReadOnlyUser();
    this.loadCurrentlyPlayingGames();
  }

  getPlatformClass(platform: string): string {
    return 'platform-' + platform.toLowerCase().replace(/[^a-z0-9]/g, '');
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
    const iconMap: { [key: string]: string } = {
      'PlayStation 5': 'assets/images/platforms/ps5.svg',
      'PlayStation 4': 'assets/images/platforms/ps4.svg',
      'PlayStation 3': 'assets/images/platforms/ps3.svg',
      'PlayStation 2': 'assets/images/platforms/ps2.svg',
      'PlayStation': 'assets/images/platforms/ps.svg',
      'Xbox Series X/S': 'assets/images/platforms/xbox-series-x.svg',
      'Xbox One': 'assets/images/platforms/xbox-one.svg',
      'Xbox 360': 'assets/images/platforms/xbox-360.svg',
      'Xbox': 'assets/images/platforms/xbox.svg',
      'Nintendo Switch': 'data:image/png;base64,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',
      'Nintendo 3DS': 'assets/images/platforms/3ds.svg',
      'Nintendo DS': 'assets/images/platforms/ds.svg',
      'PC': 'assets/images/platforms/pc.svg',
      'Steam': 'assets/images/platforms/steam.svg',
      'Steam Deck': 'assets/images/platforms/steam-deck.svg',
      'Mac': 'assets/images/platforms/mac.svg',
      'Mobile': 'assets/images/platforms/mobile.svg',
      'Android': 'assets/images/platforms/android.svg',
      'iOS': 'assets/images/platforms/ios.svg',
      'Sin plataforma': 'assets/images/platforms/unknown.svg'
    };

    if (iconMap[platform]) {
      return iconMap[platform];
    }

    const platformLower = platform.toLowerCase();
    if (platformLower.includes('playstation') || platformLower.includes('ps')) return 'assets/images/platforms/ps.svg';
    if (platformLower.includes('xbox')) return 'assets/images/platforms/xbox.svg';
    if (platformLower.includes('nintendo') || platformLower.includes('switch')) return 'assets/images/platforms/switch.svg';
    if (platformLower.includes('pc') || platformLower.includes('steam')) return 'assets/images/platforms/pc.svg';
    if (platformLower.includes('mobile') || platformLower.includes('android') || platformLower.includes('ios')) return 'assets/images/platforms/mobile.svg';

    return 'assets/images/platforms/gaming.svg';
  }

  public getPlatformHours(platform: string): number {
    const platformGroup = this.gamesByPlatform().find(group => group.platform === platform);
    return platformGroup ? platformGroup.games.reduce((sum, game) => sum + (game.hours_played || 0), 0) : 0;
  }
}

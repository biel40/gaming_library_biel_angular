import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Videogame, Profile } from '../../services/supabase/supabase.service';
import { GenreNormalizerService } from '../../services/genre-normalizer/genre-normalizer.service';
import { GameCardComponent } from '../../components/game-card/game-card.component';

@Component({
  selector: 'app-user-library',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, GameCardComponent],
  templateUrl: './user-library.component.html',
  styleUrls: ['./user-library.component.scss']
})
export class UserLibraryComponent implements OnInit {
  private _supabaseService = inject(SupabaseService);
  private _genreNormalizer = inject(GenreNormalizerService);
  private _route = inject(ActivatedRoute);

  private _games = signal<Videogame[]>([]);
  private _profile = signal<Profile | null>(null);
  private _loading = signal<boolean>(true);
  private _error = signal<string | null>(null);
  private _searchTerm = signal<string>('');
  private _activeGenre = signal<string>('All');

  readonly games = computed(() => this._games());
  readonly profile = computed(() => this._profile());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly searchTerm = computed(() => this._searchTerm());
  readonly activeGenre = computed(() => this._activeGenre());

  readonly hasGames = computed(() => this._games().length > 0);

  readonly uniqueGenres = computed(() => {
    const genres = this._games()
      .map(g => this._genreNormalizer.normalizeGenre(g.genre))
      .filter((g): g is string => !!g);
    return ['All', ...new Set(genres)];
  });

  readonly filteredGames = computed(() => {
    let games = this._games();
    const search = this._searchTerm().toLowerCase().trim();
    if (search) {
      games = games.filter(g =>
        g.name?.toLowerCase().includes(search) ||
        g.description?.toLowerCase().includes(search)
      );
    }
    if (this._activeGenre() !== 'All') {
      games = games.filter(g =>
        this._genreNormalizer.normalizeGenre(g.genre) === this._activeGenre()
      );
    }
    return games;
  });

  readonly platinumCount = computed(() =>
    this._games().filter(g => g.platinum).length
  );

  ngOnInit(): void {
    this._loadData();
  }

  private async _loadData(): Promise<void> {
    const userId = this._route.snapshot.paramMap.get('id');
    if (!userId) {
      this._error.set('ID de usuario no válido.');
      this._loading.set(false);
      return;
    }

    try {
      const [games, profiles] = await Promise.all([
        this._supabaseService.getVideogamesForUser(userId),
        this._supabaseService.getAllProfiles()
      ]);

      const profile = profiles.find(p => p.id === userId) ?? null;
      this._profile.set(profile);
      this._games.set(games);
    } catch (err) {
      this._error.set('No se pudo cargar la biblioteca de este usuario.');
      console.error('Error loading user library:', err);
    } finally {
      this._loading.set(false);
    }
  }

  public updateSearchTerm(value: string): void {
    this._searchTerm.set(value);
  }

  public filterByGenre(genre: string): void {
    this._activeGenre.set(genre);
  }

  public getAvatarLetter(): string {
    return (this._profile()?.name || 'U').charAt(0).toUpperCase();
  }
}

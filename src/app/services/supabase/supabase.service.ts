import { Injectable, signal, computed, EventEmitter } from '@angular/core'
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { environment } from '../../environments/environment';

export interface Profile {
  id?: string
  name?: string
  description?: string
  image_url?: string
  updated_at?: Date
}

export interface Videogame {
  id?: string
  name?: string
  description?: string
  image_url?: string
  genre?: string
  releaseDate?: Date
  platform?: string
  favorite?: boolean
  score?: number
  review?: string
  platinum?: boolean
  platinum_date?: Date
  platinum_target?: boolean
  currently_playing?: boolean
  hours_played?: number
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private _supabaseClient: SupabaseClient;
  private _session = signal<AuthSession | null | undefined>(undefined);
  private _videogames = signal<Videogame[]>([]);
  private _favorites = signal<string[]>([]);

  private static readonly CACHE_KEY = 'videogames-cache';
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
  private _cacheTimestamp: number | null = null;
  private _cachedReadOnly: boolean | null = null;
  private _favoritesLoaded = false;

  // Event emitter for favorite changes
  public favoriteChanged = new EventEmitter<Videogame>();

  constructor() {
    if (!environment.supabaseUrl || !environment.supabaseKey) {
      throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
    }

    this._supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Session management
  public async getSession(): Promise<AuthSession | null> {
    if (this._session() === undefined) {
      try {
        const { data, error } = await this._supabaseClient.auth.getSession();
        
        if (error) {
          console.warn('Session error, clearing invalid session:', error.message);
          await this._supabaseClient.auth.signOut();
          this._session.set(null);
          return null;
        }
        
        this._session.set(data.session);
      } catch (error) {
        console.error('Error getting session:', error);
        this._session.set(null);
        return null;
      }
    }

    return this._session() ?? null;
  }

  /**
   * Check if the current user is read-only (not the admin user)
   * @returns boolean - true if current user is NOT the admin (biel40aws@gmail.com)
  */
  public async isReadOnlyUser(): Promise<boolean> {
    if (this._cachedReadOnly !== null) return this._cachedReadOnly;
    const session = await this.getSession();
    this._cachedReadOnly = session?.user?.email !== 'biel40aws@gmail.com';
    return this._cachedReadOnly;
  }

  public profile(user: User) {
    return this._supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  }

  public async getProfileInfo(userId: string) {
    try {
      let profileInfo: any = this._supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return profileInfo;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  public authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this._supabaseClient.auth.onAuthStateChange(callback)
  }

  public signIn(email: string, password: string) {
    this._session.set(undefined);
    return this._supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  public async signInWithGoogle(): Promise<void> {
    const { error } = await this._supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  }

  /**
   * Signs out the current user and clears the session
   */
  public async signOut(): Promise<void> {
    this._session.set(null);
    this._videogames.set([]);
    this._favorites.set([]);
    this._favoritesLoaded = false;
    this._cachedReadOnly = null;
    this.invalidateCache();
    await this._supabaseClient.auth.signOut();
  }

  // Had to fix this manually to work
  public async updateProfile(profile: Profile) {

    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return await this._supabaseClient
      .from('profiles')
      .upsert(update)
      .select()
  }

  public async updateProfileStats(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }

    return await this._supabaseClient
      .from('profiles')
      .upsert(update)
      .select(`current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
  }


  public async signUp(email: string, password: string) {
    const result = await this._supabaseClient.auth.signUp({
      email: email,
      password: password,
    });
    if (result.data.session) {
      this._session.set(result.data.session);
    }
    return result;
  }

  public async insertProfile(profile: Profile) {
    // Create a new object to avoid modifying the original profile
    const profileData = {
      ...profile,
      updated_at: new Date()
    };

    return await this._supabaseClient
      .from('profiles')
      .insert(profileData)
      .select();
  }

  public async upsertProfile(profile: Profile) {
    return await this._supabaseClient
      .from('profiles')
      .upsert(profile)
      .select();
  }

  // Videogame Service functions

  /**
   * Delete multiple videogames by their IDs
   * @param ids Array of videogame IDs to delete
   */
  public async deleteVideogames(ids: string[]): Promise<void> {
    if (!ids.length) return;

    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .delete()
      .eq('user_id', session.user.id)
      .in('game_id', ids);

    if (error) throw error;

    const currentGames = this._videogames();
    if (currentGames.length > 0) {
      this._videogames.set(currentGames.filter(game => !ids.includes(game.id || '')));
    }
    this.invalidateCache();
  }
  public async getVideogames(forceRefresh = false): Promise<Videogame[]> {
    await this.loadFavorites();
    if (!forceRefresh) {
      const cached = this._getFromCache();
      if (cached) {
        this._videogames.set(cached);
        return cached;
      }
    }

    const session = await this.getSession();
    if (!session) {
      this._videogames.set([]);
      return [];
    }

    const effectiveUserId = await this._getEffectiveUserId(session);
    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', effectiveUserId);

    if (!data) {
      this._videogames.set([]);
      return [];
    }

    const videogames = data.map(item => this._mapLibraryEntry(item));
    this._videogames.set(videogames);
    this._saveToCache(videogames);
    return videogames;
  }

  public invalidateCache(): void {
    this._cacheTimestamp = null;
    try {
      sessionStorage.removeItem(SupabaseService.CACHE_KEY);
    } catch {}
  }

  /**
   * Syncs the local signal after an update to ensure the UI reflects the latest data
   * @param gameId 
   * @param changes 
   */
  private _syncAfterUpdate(gameId: string, changes: Partial<Videogame>): void {
    const currentGames = this._videogames();
    if (currentGames.length > 0) {
      const updatedGames = currentGames.map(game =>
        game.id === gameId ? { ...game, ...changes } : game
      );
      this._videogames.set(updatedGames);
    }
    this.invalidateCache();
  }

  private _saveToCache(games: Videogame[]): void {
    this._cacheTimestamp = Date.now();
    try {
      sessionStorage.setItem(SupabaseService.CACHE_KEY, JSON.stringify({
        timestamp: this._cacheTimestamp,
        data: games
      }));
    } catch {}
  }

  private _getFromCache(): Videogame[] | null {
    if (this._cacheTimestamp && (Date.now() - this._cacheTimestamp < SupabaseService.CACHE_TTL_MS)) {
      const current = this._videogames();
      if (current.length > 0) return current;
    }

    try {
      const raw = sessionStorage.getItem(SupabaseService.CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > SupabaseService.CACHE_TTL_MS) {
        sessionStorage.removeItem(SupabaseService.CACHE_KEY);
        return null;
      }
      const games: Videogame[] = parsed.data.map((item: any) => ({
        ...item,
        releaseDate: item.releaseDate ? new Date(item.releaseDate) : undefined,
        favorite: this.isFavorite(item.id)
      }));
      this._cacheTimestamp = parsed.timestamp;
      return games;
    } catch {
      return null;
    }
  }

  public async getVideogameDetails(id: string): Promise<Videogame | null> {
    await this.loadFavorites();
    const session = await this.getSession();
    if (!session) return null;

    const effectiveUserId = await this._getEffectiveUserId(session);
    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', effectiveUserId)
      .eq('game_id', id)
      .single();

    if (!data) return null;

    return this._mapLibraryEntry(data);
  }

  /**
   * Update the score for a specific game
   * @param gameId The ID of the game to update
   * @param score The new score value (0-10)
   */
  public async updateGameScore(gameId: string, score: number): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ score })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { score });
  }

  /**
   * Update the review for a specific game
   * @param gameId The ID of the game to update
   * @param review The new review text
   */
  public async updateGameReview(gameId: string, review: string): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ review })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { review });
  }

  /**
   * Update the description for a specific game
   * @param gameId The ID of the game to update
   * @param description The new description text
   */
  public async updateGameDescription(gameId: string, description: string): Promise<void> {
    const { error } = await this._supabaseClient
      .from('videogames')
      .update({ description })
      .eq('id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { description });
  }

  /**
   * Remove the review and score for a specific game
   * @param gameId The ID of the game to update
   */
  public async removeGameReviewAndScore(gameId: string): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ review: null, score: null })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { review: '', score: 0 });
  }

  /**
   * Update the currently playing status for a specific game
   * @param gameId The ID of the game to update
   * @param currentlyPlaying The new currently playing status
   */
  public async updateGameCurrentlyPlaying(gameId: string, currentlyPlaying: boolean): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ currently_playing: currentlyPlaying })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { currently_playing: currentlyPlaying });
  }

  /**
   * Update the hours played for a specific game
   * @param gameId The ID of the game to update
   * @param hoursPlayed The new hours played value
   */
  public async updateGameHoursPlayed(gameId: string, hoursPlayed: number): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ hours_played: hoursPlayed })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { hours_played: hoursPlayed });
  }

  /**
   * Get all games that are currently being played
   * @returns Promise<Videogame[]> - Array of games currently being played
   */
  public async getCurrentlyPlayingGames(): Promise<Videogame[]> {
    await this.loadFavorites();
    const session = await this.getSession();
    if (!session) return [];

    const effectiveUserId = await this._getEffectiveUserId(session);
    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', effectiveUserId)
      .eq('currently_playing', true)
      .order('hours_played', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(item => this._mapLibraryEntry(item));
  }

  /**
   * Set a game as platinum target (only one game can be target at a time)
   * @param gameId The ID of the game to set as platinum target
   * @returns Promise<Videogame> - the updated game
   */
  public async setPlatinumTarget(gameId: string): Promise<Videogame> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    await this._supabaseClient
      .from('user_game_library')
      .update({ platinum_target: false })
      .eq('user_id', session.user.id)
      .neq('game_id', gameId);

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ platinum_target: true })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    const currentGames = this._videogames();
    if (currentGames.length > 0) {
      this._videogames.set(currentGames.map(game => ({
        ...game,
        platinum_target: game.id === gameId
      })));
    }
    this.invalidateCache();

    const updatedGame = this._videogames().find(g => g.id === gameId);
    if (!updatedGame) throw new Error('Juego no encontrado');
    return updatedGame;
  }

  /**
   * Remove platinum target from a game
   * @param gameId The ID of the game to remove as platinum target
   * @returns Promise<Videogame> - the updated game
   */
  public async removePlatinumTarget(gameId: string): Promise<Videogame> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ platinum_target: false })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { platinum_target: false });

    const updatedGame = this._videogames().find(g => g.id === gameId);
    if (!updatedGame) throw new Error('Juego no encontrado');
    return updatedGame;
  }

  /**
   * Get the current platinum target game
   * @returns Promise<Videogame | null> - the current target game or null if none
   */
  public async getCurrentPlatinumTarget(): Promise<Videogame | null> {
    await this.loadFavorites();
    const session = await this.getSession();
    if (!session) return null;

    const effectiveUserId = await this._getEffectiveUserId(session);
    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', effectiveUserId)
      .eq('platinum_target', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return this._mapLibraryEntry(data);
  }

  public async loadFavorites(): Promise<void> {
    if (this._favoritesLoaded) return;

    const session = await this.getSession();
    if (!session) {
      this._favorites.set([]);
      return;
    }

    const { data, error } = await this._supabaseClient
      .from('user_favorites')
      .select('game_id');

    if (error) {
      console.error('Error loading favorites:', error);
      this._favorites.set([]);
      return;
    }

    this._favorites.set(data?.map(row => String(row.game_id)) ?? []);
    this._favoritesLoaded = true;
  }

  public isFavorite(gameId: string): boolean {
    return this._favorites().includes(String(gameId));
  }

  public async toggleFavorite(game: Videogame): Promise<boolean> {
    if (!game.id) return false;

    const session = await this.getSession();
    if (!session) return false;

    const isFav = this.isFavorite(game.id);

    if (isFav) {
      const { error } = await this._supabaseClient
        .from('user_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('game_id', game.id);

      if (error) throw error;

      game.favorite = false;
      this._favorites.update(favs => favs.filter(id => id !== String(game.id)));
    } else {
      const { error } = await this._supabaseClient
        .from('user_favorites')
        .insert({ user_id: session.user.id, game_id: game.id });

      if (error) throw error;

      game.favorite = true;
      this._favorites.update(favs => [...favs, String(game.id)]);
    }

    this.favoriteChanged.emit(game);
    this._updateGameInVideogamesSignal(game);

    return game.favorite ?? false;
  }

  /**
   * Updates a game in the videogames signal when its properties change
   * @param updatedGame The game with updated properties
   */
  private _updateGameInVideogamesSignal(updatedGame: Videogame): void {
    if (!updatedGame.id) return;

    const currentGames = this._videogames();
    const updatedGames = currentGames.map(game => {
      if (game.id === updatedGame.id) {
        return { ...game, favorite: updatedGame.favorite };
      }
      return game;
    });

    this._videogames.set(updatedGames);
  }

  private readonly LIBRARY_SELECT = `score, review, platinum, platinum_date, platinum_target, currently_playing, hours_played, videogames ( id, name, description, image_url, genre, release_date, platform )`;

  private async _getEffectiveUserId(session: AuthSession): Promise<string> {
    const isReadOnly = await this.isReadOnlyUser();
    return isReadOnly ? environment.adminUserId : session.user.id;
  }

  private _mapLibraryEntry(item: any): Videogame {
    const game = item.videogames;
    return {
      id: game.id,
      name: game.name,
      description: game.description,
      image_url: game.image_url,
      genre: game.genre,
      releaseDate: game.release_date ? new Date(game.release_date) : undefined,
      platform: game.platform,
      score: item.score,
      review: item.review,
      platinum: item.platinum || false,
      platinum_date: item.platinum_date ? new Date(item.platinum_date) : undefined,
      platinum_target: item.platinum_target || false,
      currently_playing: item.currently_playing || false,
      hours_played: item.hours_played || 0,
      favorite: this.isFavorite(String(game.id))
    };
  }

  public async addVideogame(game: Omit<Videogame, 'id'>): Promise<Videogame> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const description = game.description && game.description.trim() !== ''
      ? game.description
      : this.getPlaceholderDescription(game.name || '');

    const { data: catalogGame, error: catalogError } = await this._supabaseClient
      .from('videogames')
      .insert({
        name: game.name,
        description: description,
        genre: game.genre,
        platform: game.platform,
        image_url: game.image_url,
        release_date: game.releaseDate
      })
      .select()
      .single();

    if (catalogError) throw catalogError;

    const { error: libraryError } = await this._supabaseClient
      .from('user_game_library')
      .insert({ user_id: session.user.id, game_id: catalogGame.id });

    if (libraryError) throw libraryError;

    this.invalidateCache();
    return {
      id: catalogGame.id,
      name: catalogGame.name,
      description: catalogGame.description,
      genre: catalogGame.genre,
      platform: catalogGame.platform,
      image_url: catalogGame.image_url,
      releaseDate: new Date(catalogGame.release_date),
      favorite: false,
      platinum: false,
      platinum_target: false,
      currently_playing: false,
      hours_played: 0
    };
  }

  /**
   * Genera una descripción placeholder variada basada en el nombre del juego
   * @param gameName El nombre del juego
   * @returns Una descripción placeholder
   */
  private getPlaceholderDescription(gameName: string): string {
    const placeholders = [
      'Este juego forma parte de tu biblioteca personal. Añade una valoración y comparte tu experiencia con otros jugadores.',
      'Un título fascinante que espera ser descubierto. Explora mundos increíbles y vive aventuras épicas.',
      'Una experiencia única de juego que te mantendrá entretenido durante horas. ¡Sumérgete en esta aventura!',
      'Descubre nuevas mecánicas de juego y disfruta de una experiencia inmersiva llena de sorpresas.',
      'Un juego que combina diversión y desafío. Perfecto para relajarse o ponerse a prueba.',
      'Una obra maestra del entretenimiento interactivo. Cada partida es una nueva oportunidad de diversión.',
      'Explora, conquista y disfruta de este increíble título. Una experiencia de juego que no olvidarás.',
      'Un videojuego que destaca por su jugabilidad única y su capacidad de mantenerte enganchado.'
    ];

    // Usar el nombre del juego para generar un índice consistente
    const index = gameName.length % placeholders.length;
    return placeholders[index];
  }

  /**
   * Check if a game already exists in the user's library by name
   * @param gameName The name of the game to check
   * @returns Promise<boolean> - true if the game exists, false otherwise
   */
  public async gameExistsInLibrary(gameName: string): Promise<boolean> {
    const session = await this.getSession();
    if (!session) return false;

    const { data: catalogGame } = await this._supabaseClient
      .from('videogames')
      .select('id')
      .eq('name', gameName)
      .maybeSingle();

    if (!catalogGame) return false;

    const { data: libEntry } = await this._supabaseClient
      .from('user_game_library')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('game_id', catalogGame.id)
      .maybeSingle();

    return !!libEntry;
  }

  /*
    Public method to manually reset password for a given user email
  */
  public async resetPassword(email: string) {
    // Use window.location.origin to get the current domain (works for both local and production)
    const redirectUrl = `${window.location.origin}/reset-password`;
    return await this._supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
  }

  /*
    Public method to update the user's password with a new one
    This is used after the user clicks the reset password link in their email
  */
  public async updatePassword(newPassword: string) {
    return await this._supabaseClient.auth.updateUser({
      password: newPassword
    });
  }

  /**
   * Toggle the platinum status of a game
   * @param gameId The ID of the game to toggle platinum status
   * @returns Promise<Videogame> - the updated game
   */
  public async togglePlatinum(gameId: string): Promise<Videogame> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { data: currentEntry, error: fetchError } = await this._supabaseClient
      .from('user_game_library')
      .select('platinum')
      .eq('user_id', session.user.id)
      .eq('game_id', gameId)
      .single();

    if (fetchError) throw fetchError;

    const newPlatinumStatus = !currentEntry.platinum;
    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({
        platinum: newPlatinumStatus,
        platinum_date: newPlatinumStatus ? new Date().toISOString() : null
      })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, {
      platinum: newPlatinumStatus,
      platinum_date: newPlatinumStatus ? new Date() : undefined
    });

    const updatedGame = this._videogames().find(g => g.id === gameId);
    if (!updatedGame) throw new Error('Juego no encontrado');
    return updatedGame;
  }

  /**
   * Get all games with platinum trophies
   * @returns Promise<Videogame[]> - array of games with platinum status
   */
  public async getPlatinumGames(): Promise<Videogame[]> {
    await this.loadFavorites();
    const session = await this.getSession();
    if (!session) return [];

    const effectiveUserId = await this._getEffectiveUserId(session);
    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', effectiveUserId)
      .eq('platinum', true)
      .order('platinum_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => this._mapLibraryEntry(item));
  }

  /**
   * Update the platinum date of a game
   * @param gameId The ID of the game to update
   * @param date The new platinum date
   * @returns Promise<Videogame> - the updated game
   */
  public async updatePlatinumDate(gameId: string, date: Date): Promise<Videogame> {
    const session = await this.getSession();
    if (!session) throw new Error('No hay sesión activa');

    const { error } = await this._supabaseClient
      .from('user_game_library')
      .update({ platinum_date: date.toISOString() })
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);

    if (error) throw error;

    this._syncAfterUpdate(gameId, { platinum_date: date });

    const updatedGame = this._videogames().find(g => g.id === gameId);
    if (!updatedGame) throw new Error('Juego no encontrado');
    return updatedGame;
  }

  public async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await this._supabaseClient
      .from('profiles')
      .select('id, name, description, image_url')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  public async getVideogamesForUser(userId: string): Promise<Videogame[]> {
    const session = await this.getSession();
    if (!session) return [];

    const { data, error } = await this._supabaseClient
      .from('user_game_library')
      .select(this.LIBRARY_SELECT)
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    return data.map(item => this._mapLibraryEntry(item));
  }
}
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
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private _supabaseClient: SupabaseClient;
  private _session = signal<AuthSession | null>(null);
  private _videogames = signal<Videogame[]>([]);
  private _favorites = signal<string[]>([]);

  // Event emitter for favorite changes
  public favoriteChanged = new EventEmitter<Videogame>();

  constructor() {
    if (!environment.supabaseUrl || !environment.supabaseKey) {
      throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
    }

    this._supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
    this._loadFavoritesFromStorage();
  }

  // Session management
  public async getSession() {
    if (!this._session()) {
      const { data } = await this._supabaseClient.auth.getSession();
      this._session.set(data.session);
    }

    return this._session();
  }

  /**
   * Check if the current user is the read-only test user
   * @returns boolean - true if current user is test@testuser.com
  */
  public async isReadOnlyUser(): Promise<boolean> {
    const session = await this.getSession();
    return session?.user?.email === 'test@testuser.com';
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
    return this._supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });
  }

  /**
   * Signs out the current user and clears the session
   */
  public async signOut(): Promise<void> {
    await this._supabaseClient.auth.signOut();
    // Clear the session signal to ensure the user is properly logged out
    this._session.set(null);
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
    return await this._supabaseClient.auth.signUp({
      email: email,
      password: password,
    });
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

    const { error } = await this._supabaseClient
      .from('videogames')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }
  public async getVideogames(): Promise<Videogame[]> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select();

    if (!data) {
      this._videogames.set([]);
      return [];
    }

    // Always map the data to a Model
    const videogames: Videogame[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      genre: item.genre,
      releaseDate: new Date(item.release_date),
      image_url: item.image_url,
      platform: item.platform,
      favorite: this.isFavorite(item.id),
      platinum_target: item.platinum_target || false
    }));

    this._videogames.set(videogames);
    return videogames;
  }

  public async getVideogameDetails(id: string): Promise<Videogame | null> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select()
      .eq('id', id)
      .single();

    if (!data) {
      return null;
    }

    // Always map the data to a Model
    const videogame: Videogame = {
      id: data.id,
      name: data.name,
      description: data.description,
      genre: data.genre,
      releaseDate: new Date(data.release_date),
      image_url: data.image_url,
      platform: data.platform,
      score: data.score,
      review: data.review,
      platinum_target: data.platinum_target || false
    };

    // Check if game is favorite
    videogame.favorite = this.isFavorite(videogame.id || '');

    return videogame;
  }

  /**
   * Update the score for a specific game
   * @param gameId The ID of the game to update
   * @param score The new score value (0-10)
   */
  public async updateGameScore(gameId: string, score: number): Promise<void> {
    const { error } = await this._supabaseClient
      .from('videogames')
      .update({ score })
      .eq('id', gameId);

    if (error) {
      throw error;
    }
  }

  /**
   * Update the review for a specific game
   * @param gameId The ID of the game to update
   * @param review The new review text
   */
  public async updateGameReview(gameId: string, review: string): Promise<void> {
    const { error } = await this._supabaseClient
      .from('videogames')
      .update({ review })
      .eq('id', gameId);

    if (error) {
      throw error;
    }
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

    if (error) {
      throw error;
    }
  }

  /**
   * Remove the review and score for a specific game
   * @param gameId The ID of the game to update
   */
  public async removeGameReviewAndScore(gameId: string): Promise<void> {
    const { error } = await this._supabaseClient
      .from('videogames')
      .update({ review: null, score: null })
      .eq('id', gameId);

    if (error) {
      throw error;
    }
  }

  /**
   * Set a game as platinum target (only one game can be target at a time)
   * @param gameId The ID of the game to set as platinum target
   * @returns Promise<Videogame> - the updated game
   */
  public async setPlatinumTarget(gameId: string): Promise<Videogame> {
    // First, remove platinum_target from all other games
    await this._supabaseClient
      .from('videogames')
      .update({ platinum_target: false })
      .neq('id', gameId);

    // Then set the target game
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .update({ platinum_target: true })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Remove platinum target from a game
   * @param gameId The ID of the game to remove as platinum target
   * @returns Promise<Videogame> - the updated game
   */
  public async removePlatinumTarget(gameId: string): Promise<Videogame> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .update({ platinum_target: false })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get the current platinum target game
   * @returns Promise<Videogame | null> - the current target game or null if none
   */
  public async getCurrentPlatinumTarget(): Promise<Videogame | null> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select('*')
      .eq('platinum_target', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      genre: data.genre,
      releaseDate: new Date(data.release_date),
      image_url: data.image_url,
      platform: data.platform,
      score: data.score,
      review: data.review,
      platinum: data.platinum,
      platinum_date: data.platinum_date,
      platinum_target: data.platinum_target,
      favorite: this.isFavorite(data.id || '')
    };
  }

  // Store favorites in localStorage since we don't want to modify the database
  private _loadFavoritesFromStorage(): void {
    const favorites = localStorage.getItem('favorite-games');
    this._favorites.set(favorites ? JSON.parse(favorites) : []);
  }

  private getFavoritesFromStorage(): string[] {
    return this._favorites();
  }

  public isFavorite(gameId: string): boolean {
    return this._favorites().includes(gameId);
  }

  public toggleFavorite(game: Videogame): boolean {
    if (!game.id) return false;

    const favorites = this._favorites();
    const index = favorites.indexOf(game.id);

    // Toggle favorite status
    if (index >= 0) {
      favorites.splice(index, 1);
      game.favorite = false;
    } else {
      favorites.push(game.id);
      game.favorite = true;
    }

    // Update the favorites signal
    this._favorites.set([...favorites]);

    // Save to localStorage
    localStorage.setItem('favorite-games', JSON.stringify(favorites));

    // Emit an event to notify subscribers of the change
    this.favoriteChanged.emit(game);

    // Update the game in the videogames signal
    this._updateGameInVideogamesSignal(game);

    return game.favorite;
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

  public async addVideogame(game: Omit<Videogame, 'id'>): Promise<Videogame> {
    // Asegurar que siempre hay una descripción
    const description = game.description && game.description.trim() !== ''
      ? game.description
      : this.getPlaceholderDescription(game.name || '');

    const { data, error } = await this._supabaseClient
      .from('videogames')
      .insert([{
        name: game.name,
        description: description,
        genre: game.genre,
        platform: game.platform,
        image_url: game.image_url,
        release_date: game.releaseDate
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      genre: data.genre,
      platform: data.platform,
      image_url: data.image_url,
      releaseDate: new Date(data.release_date),
      favorite: false
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
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select('id')
      .eq('name', gameName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return !!data;
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
    // First get the current game to check its platinum status
    const { data: currentGame, error: fetchError } = await this._supabaseClient
      .from('videogames')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newPlatinumStatus = !currentGame.platinum;
    const updateData: any = {
      platinum: newPlatinumStatus,
      platinum_date: newPlatinumStatus ? new Date().toISOString() : null
    };

    const { data, error } = await this._supabaseClient
      .from('videogames')
      .update(updateData)
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get all games with platinum trophies
   * @returns Promise<Videogame[]> - array of games with platinum status
   */
  public async getPlatinumGames(): Promise<Videogame[]> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select('*')
      .eq('platinum', true)
      .order('platinum_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Update the platinum date of a game
   * @param gameId The ID of the game to update
   * @param date The new platinum date
   * @returns Promise<Videogame> - the updated game
   */
  public async updatePlatinumDate(gameId: string, date: Date): Promise<Videogame> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .update({
        platinum_date: date.toISOString()
      })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
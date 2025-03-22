import { Injectable } from '@angular/core'
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
  username?: string
  description?: string
  image_url?: string
}

export interface Videogame {
  id?: string
  name?: string
  description?: string
  image_url?: string
  genre?: string
  releaseDate?: Date
  platform?: string
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  private _supabaseClient: SupabaseClient;
  public _session: AuthSession | null = null;

  constructor() {
    this._supabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  public async getSession() {
    if (!this._session) {
      const { data } = await this._supabaseClient.auth.getSession();
      this._session = data.session;
    }
    return this._session;
  }


  public profile(user: User) {
    return this._supabaseClient
      .from('profiles')
      .select(`username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience`)
      .eq('id', user.id)
      .single()
  }

  public async getProfileInfo(userId: string) {
    try {
      let profileInfo: any = this._supabaseClient
        .from('profiles')
        .select(`id, username, clase, power, level, weapon, current_hp, total_hp, attack, defense, special_attack, special_defense, speed, current_experience, image_url`)
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

  public signOut(): any {
    return this._supabaseClient.auth.signOut()
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
    // TODO: Change this method select fields
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
    return await this._supabaseClient
      .from('profiles')
      .insert(profile)
      .select();
  }

  public async upsertProfile(profile: Profile) {
    return await this._supabaseClient
      .from('profiles')
      .upsert(profile)
      .select();
  }

  // Videogame Service functions
  public async getVideogames(): Promise<Videogame[]> {
    const { data, error } = await this._supabaseClient
      .from('videogames')
      .select();

    if (!data) {
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
      platform: item.platform
    }));

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
      platform: data.platform
    };

    return videogame;
  }
}
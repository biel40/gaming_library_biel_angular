import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GameSearchResult {
  id: number;
  name: string;
  background_image: string;
  released: string;
  platforms: { platform: { name: string } }[];
  genres: { name: string }[];
  description: string;
}

export interface GameSearchResponse {
  count: number;
  results: GameSearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class GameSearchService {
  private apiUrl = 'https://api.rawg.io/api';
  private apiKey = environment.rawgApiKey;

  constructor(private http: HttpClient) { }

  searchGames(query: string): Observable<GameSearchResponse> {
    return this.http.get<GameSearchResponse>(`${this.apiUrl}/games`, {
      params: {
        key: this.apiKey,
        search: query,
        page_size: '10'
      }
    });
  }

  getGameDetails(id: number): Observable<GameSearchResult> {
    return this.http.get<GameSearchResult>(`${this.apiUrl}/games/${id}`, {
      params: {
        key: this.apiKey
      }
    });
  }
} 
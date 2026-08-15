import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupabaseService } from '../supabase/supabase.service';
import { GameSearchService } from './game-search.service';

describe('GameSearchService (IGDB Edge Function)', () => {
  const invokeFunction = vi.fn();
  let service: GameSearchService;

  beforeEach(() => {
    invokeFunction.mockReset();

    TestBed.configureTestingModule({
      providers: [
        GameSearchService,
        {
          provide: SupabaseService,
          useValue: { invokeFunction },
        },
      ],
    });

    service = TestBed.inject(GameSearchService);
  });

  it('invokes igdb-games and maps the external response to the search model', async () => {
    invokeFunction.mockResolvedValue({
      data: [
        {
          id: 1022,
          name: 'The Legend of Zelda',
          summary: 'An adventure across Hyrule.',
          cover: { id: 86202, image_id: 'co1uii' },
          first_release_date: 509328000,
          rating: 80.52,
          genres: [{ id: 31, name: 'Adventure' }],
          platforms: [{ id: 18, name: 'Nintendo Entertainment System' }],
        },
      ],
      error: null,
    });

    const results = await firstValueFrom(service.searchGames('Zelda'));

    expect(invokeFunction).toHaveBeenCalledWith('igdb-games', {
      search: 'Zelda',
    });
    expect(results).toEqual([
      {
        id: 1022,
        name: 'The Legend of Zelda',
        description: 'An adventure across Hyrule.',
        imageUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1uii.jpg',
        releaseDate: new Date(509328000 * 1000),
        rating: 80.52,
        genres: ['Adventure'],
        platforms: ['Nintendo Entertainment System'],
      },
    ]);
  });

  it('propagates an Edge Function error', async () => {
    const edgeFunctionError = new Error('IGDB unavailable');
    invokeFunction.mockResolvedValue({ data: null, error: edgeFunctionError });

    await expect(firstValueFrom(service.searchGames('Zelda'))).rejects.toBe(edgeFunctionError);
  });

  it.each([
    ['an empty response', []],
    ['a null response', null],
  ])('returns no results for %s', async (_label, data) => {
    invokeFunction.mockResolvedValue({ data, error: null });

    await expect(firstValueFrom(service.searchGames('Unknown'))).resolves.toEqual([]);
  });

  it('provides safe values when optional IGDB fields are missing', async () => {
    invokeFunction.mockResolvedValue({
      data: [{ id: 7, name: 'Game without metadata' }],
      error: null,
    });

    const results = await firstValueFrom(service.searchGames('Game'));

    expect(results[0]).toEqual({
      id: 7,
      name: 'Game without metadata',
      description: '',
      imageUrl: '/assets/images/game-cover-placeholder.svg',
      releaseDate: null,
      rating: null,
      genres: [],
      platforms: [],
    });
  });
});
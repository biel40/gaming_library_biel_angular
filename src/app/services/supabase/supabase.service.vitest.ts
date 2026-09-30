import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createClient } from '@supabase/supabase-js';
import { SupabaseService, Videogame, HallOfFameFullError, HALL_OF_FAME_MAX } from './supabase.service';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('SupabaseService (critical local behavior)', () => {
  beforeEach(() => {
    (createClient as unknown as any).mockReset();
  });

  it('getSession clears invalid session on auth error', async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid JWT' },
      }),
      signOut: vi.fn().mockResolvedValue(undefined),
      onAuthStateChange: vi.fn(),
    };

    (createClient as unknown as any).mockReturnValue({ auth });

    const service = new SupabaseService();
    const session = await service.getSession();

    expect(session).toBeNull();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('toggleFavorite inserts to DB, emits event, and updates local games signal', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockResolvedValue({ error: null });
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });

    const from = vi.fn((table: string) => {
      if (table === 'user_favorites') {
        return {
          select: () => mockSelect(),
          insert: mockInsert,
          delete: () => ({ eq: mockDelete }),
        };
      }
      return {};
    });

    (createClient as unknown as any).mockReturnValue({
      auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
      from,
    });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com' } } as any);

    const game: Videogame = { id: 'g1', name: 'Game 1', favorite: false };
    (service as any)._videogames.set([{ ...game }]);

    const emitted: Videogame[] = [];
    service.favoriteChanged.subscribe((g) => emitted.push(g));

    const newValue = await service.toggleFavorite(game);

    expect(newValue).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-1', game_id: 'g1' });
    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('g1');
    expect(emitted[0].favorite).toBe(true);
    expect((service as any)._videogames()[0].favorite).toBe(true);
  });

  it('getVideogames throws when the library query fails instead of returning an empty library', async () => {
    const queryError = { message: 'column user_game_library.hall_of_fame does not exist', code: '42703' };
    const from = vi.fn((table: string) => {
      if (table === 'user_favorites') {
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      return { select: () => ({ eq: vi.fn().mockResolvedValue({ data: null, error: queryError }) }) };
    });

    (createClient as unknown as any).mockReturnValue({
      auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
      from,
    });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { id: 'user-1', email: 'biel40aws@gmail.com' } } as any);

    await expect(service.getVideogames(true)).rejects.toBe(queryError);
  });

  describe('setPlatinumTarget', () => {
    const setup = (clearError: { message: string } | null) => {
      const setEqGame = vi.fn().mockResolvedValue({ error: null });
      const clearNeq = vi.fn().mockResolvedValue({ error: clearError });
      const update = vi.fn((values: { platinum_target: boolean }) => ({
        eq: () => (values.platinum_target ? { eq: setEqGame } : { neq: clearNeq }),
      }));

      (createClient as unknown as any).mockReturnValue({
        auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
        from: vi.fn(() => ({ update })),
      });

      const service = new SupabaseService();
      vi.spyOn(service, 'getSession').mockResolvedValue({ user: { id: 'user-1' } } as any);

      return { service, setEqGame };
    };

    it('does not mark the new target when clearing the previous one fails', async () => {
      const clearError = { message: 'network error' };
      const { service, setEqGame } = setup(clearError);

      await expect(service.setPlatinumTarget('g1')).rejects.toBe(clearError);
      expect(setEqGame).not.toHaveBeenCalled();
    });

    it('falls back to the database when the library is not loaded in memory', async () => {
      const { service } = setup(null);
      const remoteGame: Videogame = { id: 'g1', name: 'Game 1', platinum_target: true };
      const details = vi.spyOn(service, 'getVideogameDetails').mockResolvedValue(remoteGame);

      await expect(service.setPlatinumTarget('g1')).resolves.toBe(remoteGame);
      expect(details).toHaveBeenCalledWith('g1');
    });
  });

  describe('toggleHallOfFame', () => {
    const setup = (hallOfFameCount: number, updateError: { message: string } | null = null) => {
      const updateEqGame = vi.fn().mockResolvedValue({ error: updateError });
      const update = vi.fn(() => ({ eq: () => ({ eq: updateEqGame }) }));
      const countEqHall = vi.fn().mockResolvedValue({ count: hallOfFameCount, error: null });
      const select = vi.fn(() => ({ eq: () => ({ eq: countEqHall }) }));

      (createClient as unknown as any).mockReturnValue({
        auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
        from: vi.fn(() => ({ select, update })),
      });

      const service = new SupabaseService();
      vi.spyOn(service, 'getSession').mockResolvedValue({ user: { id: 'user-1' } } as any);

      return { service, update };
    };

    it('adds a game, emits the change and syncs the local games signal', async () => {
      const { service, update } = setup(2);
      const game: Videogame = { id: 'g1', name: 'Game 1', hall_of_fame: false };
      (service as any)._videogames.set([{ ...game }]);

      const emitted: Videogame[] = [];
      service.hallOfFameChanged.subscribe((g) => emitted.push(g));

      const updated = await service.toggleHallOfFame(game);

      expect(updated.hall_of_fame).toBe(true);
      expect(updated.hall_of_fame_date).toBeInstanceOf(Date);
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ hall_of_fame: true }));
      expect(emitted).toHaveLength(1);
      expect((service as any)._videogames()[0].hall_of_fame).toBe(true);
    });

    it(`rejects adding a game when the Hall of Fame already has ${HALL_OF_FAME_MAX} games`, async () => {
      const { service, update } = setup(HALL_OF_FAME_MAX);

      await expect(service.toggleHallOfFame({ id: 'g6', hall_of_fame: false }))
        .rejects.toBeInstanceOf(HallOfFameFullError);
      expect(update).not.toHaveBeenCalled();
    });

    it('removes a game even when the Hall of Fame is full', async () => {
      const { service, update } = setup(HALL_OF_FAME_MAX);

      const updated = await service.toggleHallOfFame({ id: 'g1', hall_of_fame: true });

      expect(updated.hall_of_fame).toBe(false);
      expect(update).toHaveBeenCalledWith({ hall_of_fame: false, hall_of_fame_date: null });
    });

    it('maps the database limit error to HallOfFameFullError', async () => {
      const { service } = setup(0, { message: 'HALL_OF_FAME_FULL' });

      await expect(service.toggleHallOfFame({ id: 'g1', hall_of_fame: false }))
        .rejects.toBeInstanceOf(HallOfFameFullError);
    });
  });

  it('isReadOnlyUser returns false for admin user (biel40aws@gmail.com)', async () => {
    (createClient as unknown as any).mockReturnValue({
      auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
    });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { email: 'biel40aws@gmail.com' } } as any);

    await expect(service.isReadOnlyUser()).resolves.toBe(false);
  });

  it('isReadOnlyUser returns true for non-admin users', async () => {
    (createClient as unknown as any).mockReturnValue({
      auth: { getSession: vi.fn(), onAuthStateChange: vi.fn() },
    });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { email: 'test@testuser.com' } } as any);

    await expect(service.isReadOnlyUser()).resolves.toBe(true);
  });
});

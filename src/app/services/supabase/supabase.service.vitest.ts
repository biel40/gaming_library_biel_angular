import { describe, expect, it, vi, beforeEach } from 'vitest';

import { createClient } from '@supabase/supabase-js';
import { SupabaseService, Videogame } from './supabase.service';

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
    };

    (createClient as unknown as any).mockReturnValue({ auth });

    const service = new SupabaseService();
    const session = await service.getSession();

    expect(session).toBeNull();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('toggleFavorite persists to localStorage, emits event, and updates local games signal', () => {
    (createClient as unknown as any).mockReturnValue({ auth: { getSession: vi.fn() } });

    const service = new SupabaseService();
    const game: Videogame = { id: 'g1', name: 'Game 1', favorite: false };

    (service as any)._videogames.set([{ ...game }]);

    const emitted: Videogame[] = [];
    service.favoriteChanged.subscribe((g) => emitted.push(g));

    const newValue = service.toggleFavorite(game);

    expect(newValue).toBe(true);
    expect(JSON.parse(localStorage.getItem('favorite-games') || '[]')).toEqual(['g1']);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].id).toBe('g1');
    expect(emitted[0].favorite).toBe(true);
    expect((service as any)._videogames()[0].favorite).toBe(true);
  });

  it('isReadOnlyUser returns false for admin user (biel40aws@gmail.com)', async () => {
    (createClient as unknown as any).mockReturnValue({ auth: { getSession: vi.fn() } });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { email: 'biel40aws@gmail.com' } } as any);

    await expect(service.isReadOnlyUser()).resolves.toBe(false);
  });

  it('isReadOnlyUser returns true for non-admin users', async () => {
    (createClient as unknown as any).mockReturnValue({ auth: { getSession: vi.fn() } });

    const service = new SupabaseService();
    vi.spyOn(service, 'getSession').mockResolvedValue({ user: { email: 'test@testuser.com' } } as any);

    await expect(service.isReadOnlyUser()).resolves.toBe(true);
  });
});

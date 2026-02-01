import { describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { SupabaseService } from '../services/supabase/supabase.service';

describe('authGuard', () => {
  it('allows navigation when a session exists', async () => {
    const supabase = { getSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) };
    const router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabase },
        { provide: Router, useValue: router },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login when no session exists', async () => {
    const supabase = { getSession: vi.fn().mockResolvedValue(null) };
    const router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabase },
        { provide: Router, useValue: router },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

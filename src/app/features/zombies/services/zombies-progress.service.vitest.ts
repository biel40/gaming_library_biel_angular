import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ZombiesProgressService } from './zombies-progress.service';

const ZOMBIES_CONTENT_VERSION = 1;

const MAP_ID = 'bo1-ascension';

/** Deja resolver la carga asíncrona del constructor (isReadOnlyUser + fetch). */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface SupabaseMockOverrides {
  isReadOnlyUser?: () => Promise<boolean>;
  getZombiesMapProgress?: () => Promise<any[]>;
}

function setup(overrides: SupabaseMockOverrides = {}) {
  const supabaseMock = {
    isReadOnlyUser: vi.fn(overrides.isReadOnlyUser ?? (async () => false)),
    getZombiesMapProgress: vi.fn(
      overrides.getZombiesMapProgress ?? (async () => [] as any[])
    ),
    upsertZombiesMapProgress: vi.fn(async () => {}),
    deleteZombiesMapProgress: vi.fn(async () => {}),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ZombiesProgressService,
      { provide: SupabaseService, useValue: supabaseMock },
    ],
  });
  const service = TestBed.inject(ZombiesProgressService);
  return { service, supabaseMock };
}

describe('ZombiesProgressService', () => {
  it('marca y desmarca pasos', async () => {
    const { service } = setup();
    await flush();

    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(false);

    service.toggleStep(MAP_ID, 'step-1');
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(true);

    service.toggleStep(MAP_ID, 'step-1');
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(false);
  });

  it('calcula el porcentaje de progreso', async () => {
    const { service } = setup();
    await flush();

    service.setStepCompleted(MAP_ID, 'step-1', true);
    service.setStepCompleted(MAP_ID, 'step-2', true);
    expect(service.getProgressPercent(MAP_ID, 4)).toBe(50);
    expect(service.getStatus(MAP_ID, 4)).toBe('in-progress');
  });

  it('persiste el progreso en Supabase', async () => {
    const { service, supabaseMock } = setup();
    await flush();

    service.setStepCompleted(MAP_ID, 'step-1', true);
    expect(supabaseMock.upsertZombiesMapProgress).toHaveBeenCalledWith(
      MAP_ID,
      ['step-1'],
      expect.any(Number)
    );
  });

  it('hidrata el progreso desde Supabase al iniciar', async () => {
    const { service } = setup({
      getZombiesMapProgress: async () => [
        {
          map_id: MAP_ID,
          completed_step_ids: ['step-1', 'step-2'],
          content_version: ZOMBIES_CONTENT_VERSION,
          updated_at: new Date().toISOString(),
        },
      ],
    });
    await flush();

    expect(service.getCompletedStepIds(MAP_ID).sort()).toEqual([
      'step-1',
      'step-2',
    ]);
  });

  it('ignora progreso de una versión de contenido distinta', async () => {
    const { service } = setup({
      getZombiesMapProgress: async () => [
        {
          map_id: MAP_ID,
          completed_step_ids: ['step-1'],
          content_version: ZOMBIES_CONTENT_VERSION + 99,
          updated_at: new Date().toISOString(),
        },
      ],
    });
    await flush();

    expect(service.getCompletedStepIds(MAP_ID)).toEqual([]);
  });

  it('reinicia el progreso de un mapa', async () => {
    const { service, supabaseMock } = setup();
    await flush();

    service.setStepCompleted(MAP_ID, 'step-1', true);
    service.resetMap(MAP_ID);

    expect(service.getCompletedStepIds(MAP_ID)).toEqual([]);
    expect(supabaseMock.deleteZombiesMapProgress).toHaveBeenCalledWith(MAP_ID);
  });

  it('no permite escribir progreso en modo solo lectura', async () => {
    const { service, supabaseMock } = setup({
      isReadOnlyUser: async () => true,
    });
    await flush();

    service.setStepCompleted(MAP_ID, 'step-1', true);
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(false);
    expect(supabaseMock.upsertZombiesMapProgress).not.toHaveBeenCalled();
  });
});

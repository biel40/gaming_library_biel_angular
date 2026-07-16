import { beforeEach, describe, expect, it } from 'vitest';

import { ZOMBIES_CONTENT_VERSION } from '../data/zombies-maps.data';
import { ZombiesProgressService } from './zombies-progress.service';

const MAP_ID = 'bo1-ascension';
const keyFor = (mapId: string) =>
  `zombies-guide::${mapId}::v${ZOMBIES_CONTENT_VERSION}`;

describe('ZombiesProgressService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marca y desmarca pasos', () => {
    const service = new ZombiesProgressService();
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(false);

    service.toggleStep(MAP_ID, 'step-1');
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(true);

    service.toggleStep(MAP_ID, 'step-1');
    expect(service.isStepCompleted(MAP_ID, 'step-1')).toBe(false);
  });

  it('calcula el porcentaje de progreso', () => {
    const service = new ZombiesProgressService();
    service.setStepCompleted(MAP_ID, 'step-1', true);
    service.setStepCompleted(MAP_ID, 'step-2', true);
    expect(service.getProgressPercent(MAP_ID, 4)).toBe(50);
    expect(service.getStatus(MAP_ID, 4)).toBe('in-progress');
  });

  it('persiste el progreso en localStorage', () => {
    const service = new ZombiesProgressService();
    service.setStepCompleted(MAP_ID, 'step-1', true);

    const raw = localStorage.getItem(keyFor(MAP_ID));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).completedStepIds).toEqual(['step-1']);
  });

  it('recupera el progreso al crear una nueva instancia', () => {
    const first = new ZombiesProgressService();
    first.setStepCompleted(MAP_ID, 'step-1', true);
    first.setStepCompleted(MAP_ID, 'step-2', true);

    const second = new ZombiesProgressService();
    expect(second.getCompletedStepIds(MAP_ID).sort()).toEqual(['step-1', 'step-2']);
  });

  it('ignora datos corruptos sin lanzar errores', () => {
    localStorage.setItem(keyFor(MAP_ID), '{esto no es json valido');
    localStorage.setItem(keyFor('bo1-moon'), JSON.stringify({ unexpected: true }));

    const service = new ZombiesProgressService();
    expect(service.getCompletedStepIds(MAP_ID)).toEqual([]);
    expect(service.getCompletedStepIds('bo1-moon')).toEqual([]);
  });

  it('ignora progreso de una versión de contenido distinta', () => {
    localStorage.setItem(
      `zombies-guide::${MAP_ID}::v${ZOMBIES_CONTENT_VERSION + 99}`,
      JSON.stringify({
        mapId: MAP_ID,
        contentVersion: ZOMBIES_CONTENT_VERSION + 99,
        completedStepIds: ['step-1'],
        updatedAt: new Date().toISOString(),
      })
    );

    const service = new ZombiesProgressService();
    expect(service.getCompletedStepIds(MAP_ID)).toEqual([]);
  });

  it('reinicia el progreso de un mapa', () => {
    const service = new ZombiesProgressService();
    service.setStepCompleted(MAP_ID, 'step-1', true);
    service.resetMap(MAP_ID);

    expect(service.getCompletedStepIds(MAP_ID)).toEqual([]);
    expect(localStorage.getItem(keyFor(MAP_ID))).toBeNull();
  });
});

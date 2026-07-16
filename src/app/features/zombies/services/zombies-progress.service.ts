import { Injectable, computed, signal } from '@angular/core';

import { ZOMBIES_CONTENT_VERSION } from '../data/zombies-maps.data';
import {
  GuideStatus,
  MapProgress,
} from '../models/zombies.models';
import {
  computeProgressPercent,
  resolveGuideStatus,
} from '../utils/zombies-filter.util';

/**
 * Persistencia del progreso de cada guía en localStorage.
 *
 * - Ningún componente accede directamente a localStorage: esa responsabilidad
 *   vive aquí.
 * - La clave incluye el identificador del mapa y la versión del contenido.
 * - Es tolerante a errores de lectura, ausencia de `window` (contexto sin SSR)
 *   y datos corruptos.
 */
@Injectable({ providedIn: 'root' })
export class ZombiesProgressService {
  private static readonly STORAGE_PREFIX = 'zombies-guide';
  private readonly contentVersion = ZOMBIES_CONTENT_VERSION;

  /** Estado reactivo: mapId -> conjunto de ids de pasos completados. */
  private readonly _progress = signal<Record<string, MapProgress>>({});
  readonly progress = this._progress.asReadonly();

  constructor() {
    this.hydrate();
  }

  getCompletedStepIds(mapId: string): string[] {
    return this._progress()[mapId]?.completedStepIds ?? [];
  }

  isStepCompleted(mapId: string, stepId: string): boolean {
    return this.getCompletedStepIds(mapId).includes(stepId);
  }

  setStepCompleted(mapId: string, stepId: string, completed: boolean): void {
    const current = new Set(this.getCompletedStepIds(mapId));
    if (completed) {
      current.add(stepId);
    } else {
      current.delete(stepId);
    }
    this.writeMap(mapId, [...current]);
  }

  toggleStep(mapId: string, stepId: string): void {
    this.setStepCompleted(mapId, stepId, !this.isStepCompleted(mapId, stepId));
  }

  resetMap(mapId: string): void {
    this._progress.update((state) => {
      const next = { ...state };
      delete next[mapId];
      return next;
    });
    this.removeKey(mapId);
  }

  getProgressPercent(mapId: string, totalSteps: number): number {
    return computeProgressPercent(this.getCompletedStepIds(mapId).length, totalSteps);
  }

  getStatus(mapId: string, totalSteps: number): GuideStatus {
    return resolveGuideStatus(this.getCompletedStepIds(mapId).length, totalSteps);
  }

  // ---------------------------------------------------------------------------
  // Implementación privada
  // ---------------------------------------------------------------------------

  private writeMap(mapId: string, completedStepIds: string[]): void {
    const entry: MapProgress = {
      mapId,
      contentVersion: this.contentVersion,
      completedStepIds,
      updatedAt: new Date().toISOString(),
    };
    this._progress.update((state) => ({ ...state, [mapId]: entry }));
    this.persist(mapId, entry);
  }

  private hydrate(): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const restored: Record<string, MapProgress> = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(`${ZombiesProgressService.STORAGE_PREFIX}::`)) {
        continue;
      }
      const entry = this.safeParse(storage.getItem(key));
      if (entry && entry.contentVersion === this.contentVersion) {
        restored[entry.mapId] = entry;
      }
    }
    this._progress.set(restored);
  }

  private safeParse(raw: string | null): MapProgress | null {
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<MapProgress>;
      if (
        typeof parsed?.mapId === 'string' &&
        typeof parsed?.contentVersion === 'number' &&
        Array.isArray(parsed?.completedStepIds) &&
        parsed.completedStepIds.every((id) => typeof id === 'string')
      ) {
        return {
          mapId: parsed.mapId,
          contentVersion: parsed.contentVersion,
          completedStepIds: parsed.completedStepIds,
          updatedAt:
            typeof parsed.updatedAt === 'string'
              ? parsed.updatedAt
              : new Date(0).toISOString(),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private persist(mapId: string, entry: MapProgress): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(this.keyFor(mapId), JSON.stringify(entry));
    } catch {
      // Cuota superada o almacenamiento no disponible: se ignora sin romper la UI.
    }
  }

  private removeKey(mapId: string): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }
    try {
      storage.removeItem(this.keyFor(mapId));
    } catch {
      // Se ignora cualquier error de escritura.
    }
  }

  private keyFor(mapId: string): string {
    return `${ZombiesProgressService.STORAGE_PREFIX}::${mapId}::v${this.contentVersion}`;
  }

  private getStorage(): Storage | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage;
    } catch {
      return null;
    }
  }
}

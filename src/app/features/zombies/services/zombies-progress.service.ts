import { Injectable, inject, signal } from '@angular/core';

import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ZOMBIES_CONTENT_VERSION } from '../data/zombies-maps.data';
import { GuideStatus, MapProgress } from '../models/zombies.models';
import {
  computeProgressPercent,
  resolveGuideStatus,
} from '../utils/zombies-filter.util';

/**
 * Persistencia del progreso de cada guía en Supabase (tabla `zombies_map_progress`).
 *
 * - El estado se expone de forma reactiva y SÍNCRONA mediante un signal, para que
 *   los componentes (OnPush + signals) reaccionen sin cambiar su API pública.
 * - La carga inicial y las escrituras son asíncronas contra Supabase.
 * - Igual que la biblioteca de videojuegos, el progreso mostrado es el del
 *   usuario efectivo (el del admin para usuarios de solo lectura) y solo el
 *   admin puede modificarlo.
 */
@Injectable({ providedIn: 'root' })
export class ZombiesProgressService {
  private readonly supabase = inject(SupabaseService);
  private readonly contentVersion = ZOMBIES_CONTENT_VERSION;

  /** Estado reactivo: mapId -> progreso del mapa. */
  private readonly _progress = signal<Record<string, MapProgress>>({});
  readonly progress = this._progress.asReadonly();

  /** true hasta confirmar que el usuario es admin; bloquea escrituras. */
  private readonly _readOnly = signal<boolean>(true);
  readonly isReadOnly = this._readOnly.asReadonly();

  constructor() {
    void this.load();
  }

  getCompletedStepIds(mapId: string): string[] {
    return this._progress()[mapId]?.completedStepIds ?? [];
  }

  isStepCompleted(mapId: string, stepId: string): boolean {
    return this.getCompletedStepIds(mapId).includes(stepId);
  }

  setStepCompleted(mapId: string, stepId: string, completed: boolean): void {
    if (this._readOnly()) {
      return;
    }
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
    if (this._readOnly()) {
      return;
    }
    this._progress.update((state) => {
      const next = { ...state };
      delete next[mapId];
      return next;
    });
    void this.remove(mapId);
  }

  getProgressPercent(mapId: string, totalSteps: number): number {
    return computeProgressPercent(
      this.getCompletedStepIds(mapId).length,
      totalSteps
    );
  }

  getStatus(mapId: string, totalSteps: number): GuideStatus {
    return resolveGuideStatus(this.getCompletedStepIds(mapId).length, totalSteps);
  }

  // ---------------------------------------------------------------------------
  // Implementación privada
  // ---------------------------------------------------------------------------

  private async load(): Promise<void> {
    try {
      this._readOnly.set(await this.supabase.isReadOnlyUser());
      const rows = await this.supabase.getZombiesMapProgress();
      const restored: Record<string, MapProgress> = {};
      for (const row of rows) {
        if (row.content_version !== this.contentVersion) {
          continue;
        }
        restored[row.map_id] = {
          mapId: row.map_id,
          contentVersion: row.content_version,
          completedStepIds: Array.isArray(row.completed_step_ids)
            ? row.completed_step_ids
            : [],
          updatedAt:
            typeof row.updated_at === 'string'
              ? row.updated_at
              : new Date().toISOString(),
        };
      }
      this._progress.set(restored);
    } catch (error) {
      console.error('Error al cargar el progreso de Zombies:', error);
    }
  }

  private writeMap(mapId: string, completedStepIds: string[]): void {
    const entry: MapProgress = {
      mapId,
      contentVersion: this.contentVersion,
      completedStepIds,
      updatedAt: new Date().toISOString(),
    };
    this._progress.update((state) => ({ ...state, [mapId]: entry }));
    void this.persist(mapId, completedStepIds);
  }

  private async persist(
    mapId: string,
    completedStepIds: string[]
  ): Promise<void> {
    try {
      await this.supabase.upsertZombiesMapProgress(
        mapId,
        completedStepIds,
        this.contentVersion
      );
    } catch (error) {
      console.error('Error al guardar el progreso de Zombies:', error);
    }
  }

  private async remove(mapId: string): Promise<void> {
    try {
      await this.supabase.deleteZombiesMapProgress(mapId);
    } catch (error) {
      console.error('Error al borrar el progreso de Zombies:', error);
    }
  }
}

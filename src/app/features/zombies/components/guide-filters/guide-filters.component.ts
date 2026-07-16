import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import {
  GuideStatus,
  ZombiesFilterCriteria,
  ZombiesSaga,
} from '../../models/zombies.models';

@Component({
  selector: 'app-zombies-guide-filters',
  standalone: true,
  templateUrl: './guide-filters.component.html',
  styleUrl: './guide-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideFiltersComponent {
  readonly criteria = input.required<ZombiesFilterCriteria>();
  readonly criteriaChange = output<ZombiesFilterCriteria>();

  protected readonly statusOptions: { value: GuideStatus; label: string }[] = [
    { value: 'not-started', label: 'No empezado' },
    { value: 'in-progress', label: 'En progreso' },
    { value: 'completed', label: 'Completado' },
  ];

  protected readonly playerOptions = [1, 2, 3, 4];

  protected readonly isOpen = signal(true);

  readonly activeCount = computed(() => {
    const c = this.criteria();
    let count = 0;
    if (c.saga) count++;
    if (c.hasMainQuest !== null) count++;
    if (c.soloOnly) count++;
    if (c.minimumPlayers !== null) count++;
    if (c.status) count++;
    return count;
  });

  protected toggleOpen(): void {
    this.isOpen.update((open) => !open);
  }

  protected toggleSaga(saga: ZombiesSaga): void {
    const current = this.criteria();
    this.emit({ saga: current.saga === saga ? null : saga });
  }

  protected toggleMainQuest(): void {
    const current = this.criteria();
    this.emit({ hasMainQuest: current.hasMainQuest === true ? null : true });
  }

  protected toggleSolo(): void {
    this.emit({ soloOnly: !this.criteria().soloOnly });
  }

  protected setPlayers(value: number): void {
    const current = this.criteria();
    this.emit({ minimumPlayers: current.minimumPlayers === value ? null : value });
  }

  protected toggleStatus(status: GuideStatus): void {
    const current = this.criteria();
    this.emit({ status: current.status === status ? null : status });
  }

  protected clearAll(): void {
    this.emit({
      saga: null,
      hasMainQuest: null,
      soloOnly: false,
      minimumPlayers: null,
      status: null,
    });
  }

  private emit(patch: Partial<ZombiesFilterCriteria>): void {
    this.criteriaChange.emit({ ...this.criteria(), ...patch });
  }
}

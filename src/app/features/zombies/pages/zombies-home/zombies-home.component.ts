import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { GameSelectorComponent } from '../../components/game-selector/game-selector.component';
import { GuideFiltersComponent } from '../../components/guide-filters/guide-filters.component';
import { MapCardComponent } from '../../components/map-card/map-card.component';
import {
  EMPTY_FILTER_CRITERIA,
  GuideStatus,
  ZombiesFilterCriteria,
  ZombiesGame,
  ZombiesMap,
} from '../../models/zombies.models';
import { ZombiesDataService } from '../../services/zombies-data.service';
import { ZombiesProgressService } from '../../services/zombies-progress.service';
import { filterZombiesMaps } from '../../utils/zombies-filter.util';

@Component({
  selector: 'app-zombies-home',
  standalone: true,
  imports: [
    RouterLink,
    GameSelectorComponent,
    GuideFiltersComponent,
    MapCardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './zombies-home.component.html',
  styleUrl: './zombies-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZombiesHomeComponent {
  private readonly dataService = inject(ZombiesDataService);
  private readonly progress = inject(ZombiesProgressService);

  private readonly _criteria = signal<ZombiesFilterCriteria>({
    ...EMPTY_FILTER_CRITERIA,
  });
  readonly criteria = this._criteria.asReadonly();

  readonly games = this.dataService.games;

  private readonly gamesById = computed(() => {
    const lookup = new Map<string, ZombiesGame>();
    for (const game of this.games()) {
      lookup.set(game.id, game);
    }
    return lookup;
  });

  readonly filteredMaps = computed(() =>
    filterZombiesMaps(this.dataService.maps(), this._criteria(), (map) =>
      this.progress.getStatus(map.id, map.steps.length)
    )
  );

  readonly resultCount = computed(() => this.filteredMaps().length);

  gameFor(map: ZombiesMap): ZombiesGame | undefined {
    return this.gamesById().get(map.gameId);
  }

  progressFor(map: ZombiesMap): number {
    return this.progress.getProgressPercent(map.id, map.steps.length);
  }

  statusFor(map: ZombiesMap): GuideStatus {
    return this.progress.getStatus(map.id, map.steps.length);
  }

  protected onSelectGame(gameId: string | null): void {
    this.patch({ gameId });
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.patch({ search: value });
  }

  protected onCriteriaChange(criteria: ZombiesFilterCriteria): void {
    this._criteria.set(criteria);
  }

  protected resetAll(): void {
    this._criteria.set({ ...EMPTY_FILTER_CRITERIA });
  }

  private patch(partial: Partial<ZombiesFilterCriteria>): void {
    this._criteria.update((current) => ({ ...current, ...partial }));
  }
}

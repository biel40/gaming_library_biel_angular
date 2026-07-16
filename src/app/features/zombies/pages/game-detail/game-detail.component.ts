import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  BreadcrumbsComponent,
  ZombiesBreadcrumbItem,
} from '../../components/breadcrumbs/breadcrumbs.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { MapCardComponent } from '../../components/map-card/map-card.component';
import { ZombiesMap } from '../../models/zombies.models';
import { ZombiesDataService } from '../../services/zombies-data.service';
import { ZombiesProgressService } from '../../services/zombies-progress.service';

@Component({
  selector: 'app-zombies-game-detail',
  standalone: true,
  imports: [RouterLink, MapCardComponent, EmptyStateComponent, BreadcrumbsComponent],
  templateUrl: './game-detail.component.html',
  styleUrl: './game-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZombiesGameDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(ZombiesDataService);
  private readonly progress = inject(ZombiesProgressService);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly game = computed(() => {
    const slug = this.paramMap().get('gameSlug');
    return slug ? this.dataService.getGameBySlug(slug) : undefined;
  });

  readonly breadcrumbItems = computed<ZombiesBreadcrumbItem[]>(() => {
    const g = this.game();
    if (!g) {
      return [];
    }
    return [{ label: 'Zombies', link: '/zombies' }, { label: g.shortTitle }];
  });

  private readonly maps = computed(() => {
    const game = this.game();
    return game ? this.dataService.getMapsForGame(game.id) : [];
  });

  readonly mainMaps = computed(() =>
    this.maps().filter((map) => map.collection !== 'zombies-chronicles')
  );

  readonly chroniclesMaps = computed(() =>
    this.maps().filter((map) => map.collection === 'zombies-chronicles')
  );

  gameForCard(map: ZombiesMap) {
    return this.dataService.getGameById(map.gameId)!;
  }

  progressFor(map: ZombiesMap): number {
    return this.progress.getProgressPercent(map.id, map.steps.length);
  }

  statusFor(map: ZombiesMap) {
    return this.progress.getStatus(map.id, map.steps.length);
  }
}

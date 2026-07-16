import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { GuideProgressComponent } from '../../components/guide-progress/guide-progress.component';
import { GuideStepComponent } from '../../components/guide-step/guide-step.component';
import { EasterEggStep, ZombiesMap } from '../../models/zombies.models';
import { ZombiesDataService } from '../../services/zombies-data.service';
import { ZombiesProgressService } from '../../services/zombies-progress.service';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
  'very-hard': 'Muy difícil',
};

@Component({
  selector: 'app-zombies-map-guide',
  standalone: true,
  imports: [
    RouterLink,
    GuideStepComponent,
    GuideProgressComponent,
    EmptyStateComponent,
  ],
  templateUrl: './map-guide.component.html',
  styleUrl: './map-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZombiesMapGuideComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(ZombiesDataService);
  private readonly progress = inject(ZombiesProgressService);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly revealSpoilers = signal(false);
  readonly showResetConfirm = signal(false);
  readonly activeStepId = signal<string | null>(null);

  readonly game = computed(() => {
    const slug = this.paramMap().get('gameSlug');
    return slug ? this.dataService.getGameBySlug(slug) : undefined;
  });

  readonly map = computed(() => {
    const gameSlug = this.paramMap().get('gameSlug');
    const mapSlug = this.paramMap().get('mapSlug');
    if (!gameSlug || !mapSlug) {
      return undefined;
    }
    return this.dataService.getMapBySlug(gameSlug, mapSlug);
  });

  readonly isPending = computed(
    () => this.map()?.contentStatus === 'pending' || this.steps().length === 0
  );

  readonly sagaLabel = computed(() =>
    this.map()?.saga === 'chaos' ? 'Chaos' : 'Aether'
  );

  readonly difficultyLabel = computed(() => {
    const difficulty = this.map()?.difficulty;
    return difficulty ? DIFFICULTY_LABELS[difficulty] : null;
  });

  readonly steps = computed<EasterEggStep[]>(() =>
    [...(this.map()?.steps ?? [])].sort((a, b) => a.order - b.order)
  );

  readonly completedStepIds = computed(() => {
    const map = this.map();
    if (!map) {
      return new Set<string>();
    }
    return new Set(this.progress.getCompletedStepIds(map.id));
  });

  readonly completedCount = computed(
    () => this.steps().filter((step) => this.completedStepIds().has(step.id)).length
  );

  readonly percent = computed(() => {
    const map = this.map();
    return map ? this.progress.getProgressPercent(map.id, this.steps().length) : 0;
  });

  private readonly orderedMaps = computed(() =>
    this.dataService.maps()
  );

  readonly prevMap = computed<ZombiesMap | undefined>(() => {
    const map = this.map();
    if (!map) return undefined;
    const list = this.orderedMaps();
    const index = list.findIndex((m) => m.id === map.id);
    return index > 0 ? list[index - 1] : undefined;
  });

  readonly nextMap = computed<ZombiesMap | undefined>(() => {
    const map = this.map();
    if (!map) return undefined;
    const list = this.orderedMaps();
    const index = list.findIndex((m) => m.id === map.id);
    return index >= 0 && index < list.length - 1 ? list[index + 1] : undefined;
  });

  isStepCompleted(stepId: string): boolean {
    return this.completedStepIds().has(stepId);
  }

  linkFor(map: ZombiesMap): string[] {
    const game = this.dataService.getGameById(map.gameId);
    return ['/zombies', game?.slug ?? '', map.slug];
  }

  protected onStepCompletedChange(stepId: string, completed: boolean): void {
    const map = this.map();
    if (!map) return;
    this.progress.setStepCompleted(map.id, stepId, completed);
  }

  protected toggleSpoilers(): void {
    this.revealSpoilers.update((value) => !value);
  }

  protected requestReset(): void {
    this.showResetConfirm.set(true);
  }

  protected cancelReset(): void {
    this.showResetConfirm.set(false);
  }

  protected confirmReset(): void {
    const map = this.map();
    if (map) {
      this.progress.resetMap(map.id);
    }
    this.showResetConfirm.set(false);
  }

  protected scrollToStep(stepId: string): void {
    this.activeStepId.set(stepId);
    if (typeof document === 'undefined') {
      return;
    }
    const element = document.getElementById('step-' + stepId);
    if (!element) {
      return;
    }
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  GuideDifficulty,
  GuideStatus,
  ZombiesGame,
  ZombiesMap,
} from '../../models/zombies.models';

@Component({
  selector: 'app-zombies-map-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './map-card.component.html',
  styleUrl: './map-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCardComponent {
  readonly map = input.required<ZombiesMap>();
  readonly game = input.required<ZombiesGame>();
  readonly progressPercent = input<number>(0);
  readonly status = input<GuideStatus>('not-started');

  private readonly difficultyLabels: Record<GuideDifficulty, string> = {
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
    'very-hard': 'Muy difícil',
  };

  readonly sagaLabel = computed(() =>
    this.map().saga === 'aether' ? 'Aether' : 'Chaos'
  );

  readonly difficultyLabel = computed(() => {
    const difficulty = this.map().difficulty;
    return difficulty ? this.difficultyLabels[difficulty] : null;
  });

  readonly isPending = computed(() => this.map().contentStatus === 'pending');

  readonly actionLabel = computed(() => {
    if (this.isPending()) {
      return 'Ver estado';
    }
    return this.status() === 'in-progress' ? 'Continuar guía' : 'Ver guía';
  });

  readonly routerLinkTo = computed(() => [
    '/zombies',
    this.game().slug,
    this.map().slug,
  ]);

  protected onImageError(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }
}

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
  public readonly map = input.required<ZombiesMap>();
  public readonly game = input.required<ZombiesGame>();
  public readonly progressPercent = input<number>(0);
  public readonly status = input<GuideStatus>('not-started');

  private readonly difficultyLabels: Record<GuideDifficulty, string> = {
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
    'very-hard': 'Muy difícil',
  };

  public readonly sagaLabel = computed(() =>
    this.map().saga === 'aether' ? 'Aether' : 'Chaos'
  );

  public readonly difficultyLabel = computed(() => {
    const difficulty = this.map().difficulty;
    return difficulty ? this.difficultyLabels[difficulty] : null;
  });

  public readonly isPending = computed(() => this.map().contentStatus === 'pending');

  public readonly actionLabel = computed(() => {
    if (this.isPending()) {
      return 'Ver';
    }

    return this.status() === 'in-progress' ? 'Continuar guía' : 'Ver guía';
  });

  public readonly routerLinkTo = computed(() => [
    '/zombies',
    this.game().slug,
    this.map().slug,
  ]);

  protected onImageError(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }
}

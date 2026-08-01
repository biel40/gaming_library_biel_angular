import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { ZombiesGame } from '../../models/zombies.models';
import { ZombiesThemeService } from '../../services/zombies-theme.service';

@Component({
  selector: 'app-zombies-game-selector',
  standalone: true,
  templateUrl: './game-selector.component.html',
  styleUrl: './game-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSelectorComponent implements AfterViewInit, OnDestroy {
  readonly games = input<ZombiesGame[]>([]);
  readonly selectedGameId = input<string | null>(null);

  readonly selectGame = output<string | null>();

  protected readonly isLightTheme = inject(ZombiesThemeService).isLight;

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private resizeObserver?: ResizeObserver;

  // El desvanecido a la derecha (mask-image) solo debe aplicarse cuando la
  // lista de juegos realmente desborda el ancho disponible en móvil. Ver
  // memoria de repo: zombies-mobile-mask-only-when-scrollable.
  readonly isScrollable = signal(false);

  public constructor() {
    effect(() => {
      this.games();
      queueMicrotask(() => this.updateScrollable());
    });
  }

  public ngAfterViewInit(): void {
    const el = this.root()?.nativeElement;
    if (!el) return;

    this.resizeObserver = new ResizeObserver(() => this.updateScrollable());
    this.resizeObserver.observe(el);
    this.updateScrollable();
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private updateScrollable(): void {
    const el = this.root()?.nativeElement;
    if (!el) return;
    this.isScrollable.set(el.scrollWidth > el.clientWidth + 1);
  }
}

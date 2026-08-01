import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { ZombiesThemeService } from '../../services/zombies-theme.service';

@Component({
  selector: 'app-zombies-spoiler-content',
  standalone: true,
  templateUrl: './spoiler-content.component.html',
  styleUrl: './spoiler-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpoilerContentComponent {
  readonly isSpoiler = input<boolean>(false);
  readonly forceReveal = input<boolean>(false);
  readonly label = input<string>('Contenido con spoilers');

  protected readonly isLightTheme = inject(ZombiesThemeService).isLight;
  private readonly localReveal = signal(false);

  readonly revealed = computed(
    () => !this.isSpoiler() || this.forceReveal() || this.localReveal()
  );

  protected reveal(): void {
    this.localReveal.set(true);
  }
}

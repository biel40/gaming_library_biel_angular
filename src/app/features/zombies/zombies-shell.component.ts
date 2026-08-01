import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ZombiesIntroTransitionComponent } from './components/intro-transition/intro-transition.component';
import { ZombiesAudioService } from './services/zombies-audio.service';
import { ZombiesThemeService } from './services/zombies-theme.service';

@Component({
  selector: 'app-zombies-shell',
  standalone: true,
  imports: [RouterOutlet, ZombiesIntroTransitionComponent],
  templateUrl: './zombies-shell.component.html',
  styleUrl: './zombies-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZombiesShellComponent implements OnInit, OnDestroy {
  private readonly audio = inject(ZombiesAudioService);
  private readonly themeService = inject(ZombiesThemeService);

  protected readonly audioMuted = this.audio.muted;
  protected readonly isLightTheme = this.themeService.isLight;

  constructor() {
    // Reactivo: si el tema cambia (desde este toggle o desde el dashboard
    // en otra pestaña/navegación previa), body/.main se mantienen en sync.
    effect(() => {
      document.body.classList.toggle('light-theme', this.isLightTheme());
      document.querySelector('.main')?.classList.toggle('light-theme', this.isLightTheme());
    });
  }

  public ngOnInit(): void {
    this.audio.play();
    this.themeService.syncFromStorage();
  }

  public ngOnDestroy(): void {
    this.audio.stop();
    document.body.classList.remove('light-theme');
    document.querySelector('.main')?.classList.remove('light-theme');
  }

  protected onToggleMute(): void {
    this.audio.toggleMute();
  }

  protected onToggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

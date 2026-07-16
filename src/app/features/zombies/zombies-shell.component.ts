import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ZombiesIntroTransitionComponent } from './components/intro-transition/intro-transition.component';
import { ZombiesAudioService } from './services/zombies-audio.service';

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

  protected readonly audioMuted = this.audio.muted;

  public ngOnInit(): void {
    this.audio.play();
  }

  public ngOnDestroy(): void {
    this.audio.stop();
  }

  protected onToggleMute(): void {
    this.audio.toggleMute();
  }
}

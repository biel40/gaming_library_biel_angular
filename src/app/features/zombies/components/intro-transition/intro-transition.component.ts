import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
} from '@angular/core';

const DISPLAY_MS = 1900;
const FADE_MS = 650;
const EMBER_COUNT = 18;

@Component({
  selector: 'app-zombies-intro-transition',
  standalone: true,
  templateUrl: './intro-transition.component.html',
  styleUrl: './intro-transition.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZombiesIntroTransitionComponent implements OnInit {
  protected readonly visible = signal(true);
  protected readonly fadingOut = signal(false);
  protected readonly embers = Array.from({ length: EMBER_COUNT });

  public ngOnInit(): void {
    setTimeout(() => this.fadingOut.set(true), DISPLAY_MS);
    setTimeout(() => this.visible.set(false), DISPLAY_MS + FADE_MS);
  }
}

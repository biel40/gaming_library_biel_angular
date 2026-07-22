import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

import { EasterEggStep } from '../../models/zombies.models';
import { SpoilerContentComponent } from '../spoiler-content/spoiler-content.component';

@Component({
  selector: 'app-zombies-guide-step',
  standalone: true,
  imports: [SpoilerContentComponent],
  templateUrl: './guide-step.component.html',
  styleUrl: './guide-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideStepComponent {
  readonly step = input.required<EasterEggStep>();
  readonly stepNumber = input.required<number>();
  readonly completed = input<boolean>(false);
  readonly revealSpoilers = input<boolean>(false);
  readonly readOnly = input<boolean>(false);

  readonly completedChange = output<boolean>();

  protected readonly expanded = signal(false);

  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  protected onToggleComplete(event: Event): void {
    this.completedChange.emit((event.target as HTMLInputElement).checked);
  }
}

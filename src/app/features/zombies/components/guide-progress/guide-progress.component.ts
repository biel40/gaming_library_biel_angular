import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-zombies-guide-progress',
  standalone: true,
  templateUrl: './guide-progress.component.html',
  styleUrl: './guide-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideProgressComponent {
  readonly percent = input<number>(0);
  readonly completedCount = input<number>(0);
  readonly totalCount = input<number>(0);

  readonly reset = output<void>();
}

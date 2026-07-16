import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export type EmptyStateVariant = 'loading' | 'empty' | 'error' | 'unavailable';

@Component({
  selector: 'app-zombies-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly variant = input<EmptyStateVariant>('empty');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly actionLabel = input<string>('');

  readonly action = output<void>();

  protected readonly icons: Record<EmptyStateVariant, string> = {
    loading: 'hourglass_empty',
    empty: 'search_off',
    error: 'error_outline',
    unavailable: 'construction',
  };
}

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ZombiesGame } from '../../models/zombies.models';

@Component({
  selector: 'app-zombies-game-selector',
  standalone: true,
  templateUrl: './game-selector.component.html',
  styleUrl: './game-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSelectorComponent {
  readonly games = input<ZombiesGame[]>([]);
  readonly selectedGameId = input<string | null>(null);

  readonly selectGame = output<string | null>();
}

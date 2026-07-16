import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-zombies-guide-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="zombies-placeholder" role="alert">
      <span class="material-icons" aria-hidden="true">error_outline</span>
      <h1>Guía no encontrada</h1>
      <p>La guía que buscas no existe o todavía no está disponible.</p>
      <a routerLink="/zombies">Volver a Zombies</a>
    </section>
  `,
})
export class ZombiesGuideNotFoundComponent {}

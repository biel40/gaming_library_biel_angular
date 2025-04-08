import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true
})
export class AppComponent {
  title = signal('gaming_library_biel_angular');

  constructor(private _router: Router) {

  }

  public navigateToDashboard() {
    this._router.navigate(['/dashboard']);
  }
}

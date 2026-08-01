import { Injectable, computed, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'gaming-library-theme';

export type AppTheme = 'dark' | 'light';

// Comparte la clave de localStorage con el resto de la app (dashboard,
// game-detail) para que el modo claro/oscuro sea consistente al navegar
// hacia y desde la sección Zombies. El toggle también vive aquí, así que
// el tema puede cambiarse tanto desde el dashboard como desde Zombies.
@Injectable({ providedIn: 'root' })
export class ZombiesThemeService {
  private readonly _theme = signal<AppTheme>(this.readStoredTheme());

  public readonly theme = this._theme.asReadonly();
  public readonly isLight = computed(() => this._theme() === 'light');

  // Se llama al entrar en la sección Zombies (shell) para recoger el valor
  // más reciente, ya que este servicio es un singleton de toda la app y
  // podría haberse instanciado antes de que el usuario cambiara el tema.
  public syncFromStorage(): void {
    this._theme.set(this.readStoredTheme());
  }

  public toggleTheme(): void {
    const next: AppTheme = this._theme() === 'dark' ? 'light' : 'dark';
    this._theme.set(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  private readStoredTheme(): AppTheme {
    return (localStorage.getItem(THEME_STORAGE_KEY) as AppTheme) || 'dark';
  }
}

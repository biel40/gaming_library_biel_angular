import { Injectable, signal } from '@angular/core';

/**
 * Servicio de música de fondo para la sección Zombies.
 *
 * IMPORTANTE (copyright): este proyecto NO incluye ningún archivo de audio.
 * Para activar la música, coloca tu propio archivo (de tu propiedad legal)
 * en `public/assets/audio/zombies/damned.mp3`. Si el archivo no existe, el
 * servicio falla de forma silenciosa (solo un warning en consola) sin
 * romper la aplicación.
 */
const TRACK_SRC = '/assets/audio/zombies/damned.mp3';
const STORAGE_KEY = 'zombies-audio-muted';
const TARGET_VOLUME = 0.35;
const FADE_MS = 1200;
const FADE_STEPS = 20;

@Injectable({ providedIn: 'root' })
export class ZombiesAudioService {
  private audioEl: HTMLAudioElement | null = null;
  private fadeIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly _muted = signal<boolean>(this.readStoredMuted());
  readonly muted = this._muted.asReadonly();

  public play(): void {
    const audio = this.ensureAudioElement();

    this.clearFade();
    audio
      .play()
      .then(() => this.fadeTo(TARGET_VOLUME))
      .catch(() => {
        // Autoplay bloqueado por el navegador; se reintentará al hacer mute/unmute
        // o al volver a llamar a play() tras una interacción del usuario.
      });
  }

  public stop(): void {
    if (!this.audioEl) {
      return;
    }
    const audio = this.audioEl;

    this.fadeTo(0, () => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  public toggleMute(): void {
    const next = !this._muted();
    this._muted.set(next);

    if (this.audioEl) {
      this.audioEl.muted = next;
    }
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  private ensureAudioElement(): HTMLAudioElement {
    if (this.audioEl) {
      return this.audioEl;
    }

    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.volume = 0;
    audio.muted = this._muted();
    audio.addEventListener('error', () => {
      console.warn(
        `[ZombiesAudioService] No se pudo cargar "${TRACK_SRC}". ` +
          'Coloca tu propio archivo de audio (con licencia legal) en ' +
          'public/assets/audio/zombies/damned.mp3 para activar la música de fondo.'
      );
    });

    this.audioEl = audio;
    return audio;
  }

  private fadeTo(target: number, onComplete?: () => void): void {
    if (!this.audioEl) {
      return;
    }
    const audio = this.audioEl;

    this.clearFade();
    const start = audio.volume;
    const delta = (target - start) / FADE_STEPS;
    const stepMs = FADE_MS / FADE_STEPS;
    let step = 0;

    this.fadeIntervalId = setInterval(() => {
      step++;
      audio.volume = Math.min(1, Math.max(0, start + delta * step));

      if (step >= FADE_STEPS) {
        audio.volume = target;
        this.clearFade();
        onComplete?.();
      }
    }, stepMs);
  }

  private clearFade(): void {
    if (this.fadeIntervalId !== null) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }
  }

  private readStoredMuted(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }
}

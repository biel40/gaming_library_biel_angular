import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardScrollService {
    private readonly storageKey = 'dashboard-scroll-position';

    public capture(): void {
        const mainScrollPosition = document.querySelector<HTMLElement>('.main')?.scrollTop ?? 0;
        const documentScrollPosition = document.scrollingElement?.scrollTop ?? 0;
        const position = Math.max(window.scrollY, documentScrollPosition, mainScrollPosition);

        this.save(position);
    }

    public save(position: number): void {
        sessionStorage.setItem(this.storageKey, String(position));
    }

    public consume(): number | null {
        const storedPosition = sessionStorage.getItem(this.storageKey);
        sessionStorage.removeItem(this.storageKey);

        if (storedPosition === null) {
            return null;
        }

        const position = Number(storedPosition);
        return Number.isFinite(position) && position >= 0 ? position : null;
    }

    public restore(position: number): void {
        const main = document.querySelector<HTMLElement>('.main');
        if (main) {
            main.scrollTop = position;
        }

        window.scrollTo({ top: position, behavior: 'auto' });
    }
}
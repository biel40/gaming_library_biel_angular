import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardScrollService } from './dashboard-scroll.service';

describe('DashboardScrollService', () => {
    let service: DashboardScrollService;

    beforeEach(() => {
        sessionStorage.clear();
        service = new DashboardScrollService();
    });

    it('stores the current dashboard scroll position', () => {
        service.save(1480);

        expect(sessionStorage.getItem('dashboard-scroll-position')).toBe('1480');
    });

    it('captures the scroll position from the dashboard scroll container', () => {
        const main = document.createElement('main');
        main.classList.add('main');
        main.scrollTop = 1480;
        document.body.appendChild(main);

        service.capture();

        expect(sessionStorage.getItem('dashboard-scroll-position')).toBe('1480');
        main.remove();
    });

    it('restores the position on the dashboard container and the window', () => {
        const main = document.createElement('main');
        main.classList.add('main');
        document.body.appendChild(main);
        const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

        service.restore(1480);

        expect(main.scrollTop).toBe(1480);
        expect(scrollTo).toHaveBeenCalledWith({ top: 1480, behavior: 'auto' });
        scrollTo.mockRestore();
        main.remove();
    });

    it('returns a saved position only once', () => {
        sessionStorage.setItem('dashboard-scroll-position', '1480');

        expect(service.consume()).toBe(1480);
        expect(service.consume()).toBeNull();
    });

    it('ignores invalid stored positions', () => {
        sessionStorage.setItem('dashboard-scroll-position', 'invalid');

        expect(service.consume()).toBeNull();
    });
});
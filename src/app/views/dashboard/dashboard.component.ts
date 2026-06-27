import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit, signal, computed, effect, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { GenreNormalizerService } from '../../services/genre-normalizer/genre-normalizer.service';
import { PlatformNormalizerService } from '../../services/platform-normalizer/platform-normalizer.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GameCardComponent,
        UserAvatarComponent,
        RouterLink
    ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    public showNotification = signal(false);
    public notificationMessage = signal('');
    public notificationType = signal<'success' | 'error'>('success');
    @ViewChild('carousel') carouselElement!: ElementRef;

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _userService: UserService = inject(UserService);
    private _router: Router = inject(Router);
    private _genreNormalizer: GenreNormalizerService = inject(GenreNormalizerService);
    private _platformNormalizer: PlatformNormalizerService = inject(PlatformNormalizerService);
    private _resizeListener: () => void;
    private _favoriteSubscription: Subscription | null = null;

    // Signals for state management
    public title = signal('Gaming Library');
    public isAuthenticated = signal(false);
    public currentUser = signal<User | null>(null);
    public showMobileMenu = signal(false);
    public games = signal<Videogame[]>([]);
    public searchTerm = signal('');
    public activeGenre = signal('Todos');
    public viewMode = signal<'grid' | 'list'>('grid');
    public currentPage = signal(0);
    public itemsPerPage = signal(0);
    public carouselDots = signal<number[]>([]);
    public isLoading = signal(true);
    public error = signal<string | null>(null);

    // Filter signals
    public activePlatform = signal<string>('Todos');
    public activeCompany = signal<string>('Todos');
    public activeYear = signal<number | null>(null);
    public sortMode = signal<'default' | 'best-rated'>('default');
    public showGenrePanel = signal(false);
    public showCompanyPanel = signal(false);
    public showPlatformPanel = signal(false);
    public showYearPanel = signal(false);

    // Multi-select functionality
    public selectMode = signal(false);
    public selectedGameIds = signal<string[]>([]);
    public showDeleteConfirm = signal(false);
    public deleteLoading = signal(false);

    // Theme
    public theme = signal<'dark' | 'light'>(
        (localStorage.getItem('gaming-library-theme') as 'dark' | 'light') || 'dark'
    );
    public isAnimating = signal(false);
    public pendingTheme = signal<'dark' | 'light'>('dark');

    public toggleTheme() {
        if (this.isAnimating()) return;
        const next = this.theme() === 'dark' ? 'light' : 'dark';
        this.pendingTheme.set(next);
        this.isAnimating.set(true);
        setTimeout(() => {
            this.theme.set(next);
            localStorage.setItem('gaming-library-theme', next);
        }, 190);
        setTimeout(() => {
            this.isAnimating.set(false);
        }, 380);
    }

    // Computed properties
    public isReadOnly = computed(() => {
        const user = this.currentUser();
        return user?.email !== 'biel40aws@gmail.com';
    });

    public toggleMobileMenu() {
        this.showMobileMenu.set(!this.showMobileMenu());
        if (this.showMobileMenu()) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    public closeMobileMenu() {
        this.showMobileMenu.set(false);
        document.body.style.overflow = '';
    }

    public navigateAndCloseMenu(path: string) {
        this.closeMobileMenu();
        this._router.navigate([path]);
    }

    public toggleSelectMode() {
        if (this.isReadOnly()) return;

        this.selectMode.set(!this.selectMode());
        if (!this.selectMode()) this.selectedGameIds.set([]);
    }

    public isSelected(id: string | undefined) {
        return id ? this.selectedGameIds().includes(id) : false;
    }

    public toggleSelectGame(id: string | undefined) {
        if (!id) return;

        const selected = [...this.selectedGameIds()];
        const idx = selected.indexOf(id);

        if (idx > -1) {
            selected.splice(idx, 1);
        } else {
            selected.push(id);
        }

        this.selectedGameIds.set(selected);
    }

    public selectAllFiltered() {
        const ids = this.filteredGames()
            .map(g => g.id)
            .filter((id): id is string => !!id);
        this.selectedGameIds.set(ids);
    }

    public clearSelection() {
        this.selectedGameIds.set([]);
    }

    public openDeleteConfirm() {
        if (this.selectedGameIds().length === 0) return;
        this.showDeleteConfirm.set(true);
    }

    public closeDeleteConfirm() {
        this.showDeleteConfirm.set(false);
    }

    public async deleteSelectedGames() {
        const ids = this.selectedGameIds();
        if (!ids.length) return;

        this.deleteLoading.set(true);

        try {
            await this._supabaseService.deleteVideogames(ids);

            // Update local games list
            this.games.set(this.games().filter(g => !ids.includes(g.id!)));

            // Reset selection state
            this.selectedGameIds.set([]);
            this.showDeleteConfirm.set(false);
            this.selectMode.set(false);

            // Show success notification
            this.notificationMessage.set('Juegos eliminados correctamente');
            this.notificationType.set('success');
            this.showNotification.set(true);
        } catch (err) {
            // Show error notification
            this.notificationMessage.set('Error al eliminar juegos');
            this.notificationType.set('error');
            this.showNotification.set(true);
        } finally {
            this.deleteLoading.set(false);
            setTimeout(() => { this.showNotification.set(false); }, 2500);
        }
    }

    // Computed signals
    public filteredGames = computed(() => {
        const games = this.games();
        const searchTerm = this._normalizeText(this.searchTerm());
        const activeGenre = this.activeGenre();
        const activePlatform = this.activePlatform();
        const activeCompany = this.activeCompany();
        const activeYear = this.activeYear();
        const sortMode = this.sortMode();

        let result = games.filter(game => {
            const gameName = this._normalizeText(game.name || '');
            const gameDescription = this._normalizeText(game.description || '');
            const normalizedGenre = this._genreNormalizer.normalizeGenre(game.genre);

            const matchesSearch = !searchTerm ||
                gameName.includes(searchTerm) ||
                gameDescription.includes(searchTerm);

            const matchesGenre = activeGenre === 'Todos' || normalizedGenre === activeGenre;
            const matchesPlatform = activePlatform !== 'Todos'
                ? this._platformNormalizer.normalizePlatform(game.platform) === activePlatform
                : activeCompany === 'Todos' || this._platformNormalizer.gameMatchesCompany(game.platform, activeCompany);
            const matchesYear = activeYear === null ||
                (game.releaseDate && new Date(game.releaseDate).getFullYear() === activeYear);

            return matchesSearch && matchesGenre && matchesPlatform && matchesYear && !game.favorite;
        });

        if (sortMode === 'best-rated') {
            result = [...result].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }

        return result;
    });

    public favoriteGames = computed(() => {
        const games = this.games().filter(game => game.favorite);
        const activeGenre = this.activeGenre();
        const activePlatform = this.activePlatform();
        const activeCompany = this.activeCompany();
        const activeYear = this.activeYear();
        const searchTerm = this._normalizeText(this.searchTerm());
        const sortMode = this.sortMode();

        let result = games.filter(game => {
            const gameName = this._normalizeText(game.name || '');
            const gameDescription = this._normalizeText(game.description || '');
            const normalizedGenre = this._genreNormalizer.normalizeGenre(game.genre);

            const matchesSearch = !searchTerm ||
                gameName.includes(searchTerm) ||
                gameDescription.includes(searchTerm);

            const matchesGenre = activeGenre === 'Todos' || normalizedGenre === activeGenre;
            const matchesPlatform = activePlatform !== 'Todos'
                ? this._platformNormalizer.normalizePlatform(game.platform) === activePlatform
                : activeCompany === 'Todos' || this._platformNormalizer.gameMatchesCompany(game.platform, activeCompany);
            const matchesYear = activeYear === null ||
                (game.releaseDate && new Date(game.releaseDate).getFullYear() === activeYear);

            return matchesSearch && matchesGenre && matchesPlatform && matchesYear;
        });

        if (sortMode === 'best-rated') {
            result = [...result].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }

        return result;
    });

    public uniqueGenres = computed(() => {
        const genres = this.games().map(game => game.genre);
        return this._genreNormalizer.getUniqueNormalizedGenres(genres);
    });

    // Extract unique platforms from games for the platform filter
    public uniquePlatforms = computed(() => {
        const platforms = this.games().map(game => game.platform);
        return this._platformNormalizer.getUniquePlatforms(platforms);
    });

    public uniqueCompanies = computed(() => {
        const platforms = this.games().map(game => game.platform);
        return this._platformNormalizer.getUniqueCompanies(platforms);
    });

    public filteredPlatformsByCompany = computed(() => {
        const company = this.activeCompany();
        const allPlatforms = this.uniquePlatforms();
        if (company === 'Todos') {
            return allPlatforms;
        }
        const filtered = allPlatforms.filter(
            p => p !== 'Todos' && this._platformNormalizer.normalizedPlatformMatchesCompany(p, company)
        );
        return ['Todos', ...filtered];
    });

    // Extract unique years from games for the year filter
    public uniqueYears = computed(() => {
        const years = this.games()
            .map(game => game.releaseDate ? new Date(game.releaseDate).getFullYear() : null)
            .filter((y): y is number => y !== null);
        return [...new Set(years)].sort((a, b) => b - a);
    });

    // Helper method to normalize genre names
    public getNormalizedGenre(genre: string | undefined): string {
        return this._genreNormalizer.normalizeGenre(genre);
    }

    constructor() {
        this._resizeListener = () => this.calculateItemsPerPage();

        effect(() => {
            const isDark = this.theme() === 'dark';
            document.body.classList.toggle('light-theme', !isDark);
            document.querySelector('.main')?.classList.toggle('light-theme', !isDark);
        });

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            // Removed user menu close logic as it is now in a separate component
            if (!target.closest('.mobile-menu') && !target.closest('.hamburger-btn')) {
                this.showMobileMenu.set(false);
            }
        });
    }

    ngOnInit() {
        this.initializeDashboard();
    }

    private async initializeDashboard() {
        try {
            this.isLoading.set(true);
            this.error.set(null);

            // Check if user is authenticated
            const session = await this._supabaseService.getSession();
            this.isAuthenticated.set(!!session);

            // If not authenticated, redirect to login
            if (!session) {
                this._router.navigate(['/login']);
                return;
            }

            // Set current user information
            if (session.user) {
                this.currentUser.set(session.user);
                this._userService.setUser(session.user);
            }

            const games = await this._supabaseService.getVideogames();
            this.games.set(games);

            // Subscribe to favorite changes (only if authenticated)
            if (this.isAuthenticated()) {
                this._favoriteSubscription = this._supabaseService.favoriteChanged.subscribe(game => {
                    this.handleFavoriteChange(game);
                });
            }
        } catch (err) {
            this.error.set('Error loading games. Please try again later.');
        } finally {
            this.isLoading.set(false);
        }
    }

    ngAfterViewInit() {
        this.calculateItemsPerPage();
        window.addEventListener('resize', this._resizeListener);
    }

    ngOnDestroy() {
        window.removeEventListener('resize', this._resizeListener);
        document.body.style.overflow = '';
        document.body.classList.remove('light-theme');
        document.querySelector('.main')?.classList.remove('light-theme');

        if (this._favoriteSubscription) {
            this._favoriteSubscription.unsubscribe();
            this._favoriteSubscription = null;
        }
    }

    private calculateItemsPerPage() {
        if (!this.carouselElement) return;

        const containerWidth = this.carouselElement.nativeElement.offsetWidth;
        const itemWidth = 300; // Approximate width of a game card
        const gap = 20;

        const calculatedItemsPerPage = Math.floor((containerWidth + gap) / (itemWidth + gap));
        this.itemsPerPage.set(Math.max(1, calculatedItemsPerPage));

        const totalItems = this.filteredGames().length;
        const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage()));

        this.carouselDots.set(Array.from({ length: totalPages }, (_, i) => i));

        if (this.currentPage() >= totalPages) {
            this.currentPage.set(0);
        }
    }

    // Normalize text for consistent searching (remove accents, punctuation, and convert to lowercase)
    private _normalizeText(text: string): string {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/,/g, '')
            .toLowerCase()
            .trim();
    }

    private _closeAllPanels() {
        this.showGenrePanel.set(false);
        this.showCompanyPanel.set(false);
        this.showPlatformPanel.set(false);
        this.showYearPanel.set(false);
    }

    public filterByGenre(genre: string) {
        this.activeGenre.set(genre);
        this.showGenrePanel.set(false);
        this.currentPage.set(0);
    }

    public filterByPlatform(platform: string) {
        this.activePlatform.set(platform);
        this.showPlatformPanel.set(false);
        this.currentPage.set(0);
    }

    public filterByCompany(company: string) {
        this.activeCompany.set(company);
        this.showCompanyPanel.set(false);
        this.showPlatformPanel.set(false);
        this.currentPage.set(0);

        const platformsForCompany = this.uniquePlatforms().filter(
            p => p !== 'Todos' && this._platformNormalizer.normalizedPlatformMatchesCompany(p, company)
        );
        this.activePlatform.set(platformsForCompany.length === 1 ? platformsForCompany[0] : 'Todos');
    }

    public filterByYear(year: number | null) {
        this.activeYear.set(year);
        this.showYearPanel.set(false);
        this.currentPage.set(0);
    }

    public toggleGenrePanel() {
        const next = !this.showGenrePanel();
        this._closeAllPanels();
        this.showGenrePanel.set(next);
    }

    public toggleCompanyPanel() {
        const next = !this.showCompanyPanel();
        this._closeAllPanels();
        this.showCompanyPanel.set(next);
    }

    public togglePlatformPanel() {
        const next = !this.showPlatformPanel();
        this._closeAllPanels();
        this.showPlatformPanel.set(next);
    }

    public toggleYearPanel() {
        const next = !this.showYearPanel();
        this._closeAllPanels();
        this.showYearPanel.set(next);
    }

    public toggleSortMode() {
        this.sortMode.set(this.sortMode() === 'best-rated' ? 'default' : 'best-rated');
    }

    public resetFilters() {
        this.searchTerm.set('');
        this.activeGenre.set('Todos');
        this.activeCompany.set('Todos');
        this.activePlatform.set('Todos');
        this.activeYear.set(null);
        this._closeAllPanels();
        this.sortMode.set('default');
        this.currentPage.set(0);
    }

    public scrollCarousel(direction: 'left' | 'right') {
        const totalPages = this.carouselDots().length;
        let newPage = this.currentPage();

        if (direction === 'left') {
            newPage = (newPage - 1 + totalPages) % totalPages;
        } else {
            newPage = (newPage + 1) % totalPages;
        }

        this.currentPage.set(newPage);
    }

    public goToPage(pageIndex: number) {
        this.currentPage.set(pageIndex);
    }

    /**
     * Handle favorite change events from the SupabaseService
     * @param game The game that was favorited/unfavorited
     */
    private handleFavoriteChange(game: Videogame) {
        const updatedGames = this.games().map(g => {
            if (g.id === game.id) {
                return { ...g, favorite: game.favorite };
            }
            return g;
        });

        this.games.set(updatedGames);

        this.showNotification.set(true);
        this.notificationType.set('success');
        this.notificationMessage.set(
            game.favorite
                ? `${game.name} añadido a favoritos`
                : `${game.name} eliminado de favoritos`
        );

        setTimeout(() => {
            this.showNotification.set(false);
        }, 3000);
    }

    /**
     * Logs out the current user and redirects to the login page
     */
    public async logout(): Promise<void> {
        try {
            // Close the user menu immediately
            // this.showUserMenu.set(false);

            // Sign out and clear session
            await this._supabaseService.signOut();

            // Clear user information
            this.currentUser.set(null);
            this._userService.clearUser();
            this.isAuthenticated.set(false);

            // Show success notification
            this.notificationMessage.set('Sesión cerrada correctamente');
            this.notificationType.set('success');
            this.showNotification.set(true);

            // Wait a bit before navigating to show the notification
            setTimeout(() => {
                this._router.navigate(['/login']);
            }, 500);
        } catch (error) {
            this.notificationMessage.set('Error al cerrar sesión');
            this.notificationType.set('error');
            this.showNotification.set(true);

            // Auto-hide error notification
            setTimeout(() => {
                this.showNotification.set(false);
            }, 3000);
        }
    }
}  
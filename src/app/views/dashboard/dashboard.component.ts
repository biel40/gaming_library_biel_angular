import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit, signal, computed, effect, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { GenreNormalizerService } from '../../services/genre-normalizer/genre-normalizer.service';
import { User } from '@supabase/supabase-js';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        GameCardComponent,
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
    private _resizeListener: () => void;
    private _favoriteSubscription: Subscription | null = null;

    // Signals for state management
    public title = signal('My Game Library');
    public isAuthenticated = signal(false);
    public currentUser = signal<User | null>(null);
    public showUserMenu = signal(false);
    public showMobileMenu = signal(false);
    public games = signal<Videogame[]>([]);
    public searchTerm = signal('');
    public activeGenre = signal('All');
    public viewMode = signal<'grid' | 'list'>('grid');
    public currentPage = signal(0);
    public itemsPerPage = signal(0);
    public carouselDots = signal<number[]>([]);
    public isLoading = signal(true);
    public error = signal<string | null>(null);

    // Multi-select functionality
    public selectMode = signal(false);
    public selectedGameIds = signal<string[]>([]);
    public showDeleteConfirm = signal(false);
    public deleteLoading = signal(false);

    // Computed properties
    public isReadOnly = computed(() => {
        const user = this.currentUser();
        return user?.email === 'test@testuser.com';
    });

    public userDisplayName = computed(() => {
        const user = this.currentUser();
        if (!user) return '';
        return user.user_metadata?.['full_name'] || user.email || 'Usuario';
    });

    public userInitials = computed(() => {
        const user = this.currentUser();
        if (!user) return 'U';
        
        const name = user.user_metadata?.['full_name'] || user.email || 'Usuario';
        return name.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    });

    public toggleUserMenu() {
        this.showUserMenu.set(!this.showUserMenu());
    }

    public closeUserMenu() {
        this.showUserMenu.set(false);
    }

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
        const searchTerm = this.searchTerm().toLowerCase().trim();
        const activeGenre = this.activeGenre();

        return games.filter(game => {
            const gameName = game.name || '';
            const gameDescription = game.description || '';
            const normalizedGenre = this._genreNormalizer.normalizeGenre(game.genre);

            const matchesSearch = !searchTerm ||
                gameName.toLowerCase().includes(searchTerm) ||
                gameDescription.toLowerCase().includes(searchTerm);

            const matchesGenre = activeGenre === 'All' || normalizedGenre === activeGenre;

            return matchesSearch && matchesGenre;
        });
    });

    public favoriteGames = computed(() => {
        const games = this.games().filter(game => game.favorite);
        const activeGenre = this.activeGenre();
        const searchTerm = this.searchTerm().toLowerCase().trim();

        return games.filter(game => {
            const gameName = game.name || '';
            const gameDescription = game.description || '';
            const normalizedGenre = this._genreNormalizer.normalizeGenre(game.genre);

            const matchesSearch = !searchTerm ||
                gameName.toLowerCase().includes(searchTerm) ||
                gameDescription.toLowerCase().includes(searchTerm);

            const matchesGenre = activeGenre === 'All' || normalizedGenre === activeGenre;

            return matchesSearch && matchesGenre;
        });
    });

    public uniqueGenres = computed(() => {
        const genres = this.games().map(game => game.genre);
        return this._genreNormalizer.getUniqueNormalizedGenres(genres);
    });

    public getNormalizedGenre(genre: string | undefined): string {
        return this._genreNormalizer.normalizeGenre(genre);
    }

    constructor() {
        this._resizeListener = () => this.calculateItemsPerPage();
        
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.user-menu') && !target.closest('.user-avatar')) {
                this.showUserMenu.set(false);
            }
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

    public filterByGenre(genre: string) {
        this.activeGenre.set(genre);
        this.currentPage.set(0);
    }

    public resetFilters() {
        this.searchTerm.set('');
        this.activeGenre.set('All');
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
            this.showUserMenu.set(false);
            
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
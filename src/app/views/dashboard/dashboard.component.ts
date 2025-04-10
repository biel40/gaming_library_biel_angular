import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit, signal, computed, effect, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';

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
    private _resizeListener: () => void;
    private _favoriteSubscription: Subscription | null = null;

    // Signals for state management
    public title = signal('My Game Library');
    public games = signal<Videogame[]>([]);
    public searchTerm = signal('');
    public activeGenre = signal('All');
    public viewMode = signal<'grid' | 'list'>('grid');
    public currentPage = signal(0);
    public itemsPerPage = signal(0);
    public carouselDots = signal<number[]>([]);
    public isLoading = signal(true);
    public error = signal<string | null>(null);

    // Computed signals
    public filteredGames = computed(() => {
        const games = this.games();
        const searchTerm = this.searchTerm().toLowerCase().trim();
        const activeGenre = this.activeGenre();

        return games.filter(game => {
            // Handle null/undefined values
            const gameName = game.name || '';
            const gameDescription = game.description || '';
            const gameGenre = game.genre || '';

            const matchesSearch = !searchTerm ||
                gameName.toLowerCase().includes(searchTerm) ||
                gameDescription.toLowerCase().includes(searchTerm);

            const matchesGenre = activeGenre === 'All' || gameGenre === activeGenre;

            return matchesSearch && matchesGenre;
        });
    });

    public favoriteGames = computed(() => {
        const games = this.games().filter(game => game.favorite);
        const activeGenre = this.activeGenre();
        const searchTerm = this.searchTerm().toLowerCase().trim();

        return games.filter(game => {
            // Handle null/undefined values
            const gameName = game.name || '';
            const gameDescription = game.description || '';
            const gameGenre = game.genre || '';

            const matchesSearch = !searchTerm ||
                gameName.toLowerCase().includes(searchTerm) ||
                gameDescription.toLowerCase().includes(searchTerm);

            const matchesGenre = activeGenre === 'All' || gameGenre === activeGenre;

            return matchesSearch && matchesGenre;
        });
    });

    public uniqueGenres = computed(() => {
        const genres = new Set<string>();
        this.games().forEach(game => {
            if (game.genre) {
                genres.add(game.genre);
            }
        });
        return ['All', ...Array.from(genres).sort()];
    });

    constructor() {
        effect(() => {
            const filtered = this.filteredGames();
            this.calculateItemsPerPage();
        });

        effect(() => {
            const searchTerm = this.searchTerm();
            const activeGenre = this.activeGenre();
            const filteredCount = this.filteredGames().length;
            const totalGames = this.games().length;

            console.log(`Filtering: searchTerm="${searchTerm}", activeGenre="${activeGenre}", filtered=${filteredCount}/${totalGames}`);
        });

        this._resizeListener = () => this.calculateItemsPerPage();
    }

    async ngOnInit() {
        try {
            this.isLoading.set(true);
            this.error.set(null);
            const games = await this._supabaseService.getVideogames();
            this.games.set(games);
            
            // Subscribe to favorite changes
            this._favoriteSubscription = this._supabaseService.favoriteChanged.subscribe(game => {
                this.handleFavoriteChange(game);
            });
        } catch (err) {
            console.error('Error loading games:', err);
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
        
        // Unsubscribe from favorite changes
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
        // Update the games array with the updated game
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
}  
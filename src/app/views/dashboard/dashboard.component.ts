import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit, signal, computed, effect, OnDestroy } from '@angular/core';
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
    @ViewChild('carousel') carouselElement!: ElementRef;

    private _supabaseService: SupabaseService = inject(SupabaseService);
    private _resizeListener: () => void;

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

        return activeGenre === 'All'
            ? games
            : games.filter(game => game.genre === activeGenre);
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
        // Set up effect to recalculate items per page when filtered games change
        effect(() => {
            const filtered = this.filteredGames();
            this.calculateItemsPerPage();
        });

        // Debug effect to log filtering changes
        effect(() => {
            const searchTerm = this.searchTerm();
            const activeGenre = this.activeGenre();
            const filteredCount = this.filteredGames().length;
            const totalGames = this.games().length;

            console.log(`Filtering: searchTerm="${searchTerm}", activeGenre="${activeGenre}", filtered=${filteredCount}/${totalGames}`);
        });

        // Set up resize listener
        this._resizeListener = () => this.calculateItemsPerPage();
    }

    async ngOnInit() {
        try {
            this.isLoading.set(true);
            this.error.set(null);
            const games = await this._supabaseService.getVideogames();
            this.games.set(games);
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
    }

    private calculateItemsPerPage() {
        if (!this.carouselElement) return;

        const containerWidth = this.carouselElement.nativeElement.offsetWidth;
        const itemWidth = 300; // Approximate width of a game card
        const gap = 20; // Gap between items

        const calculatedItemsPerPage = Math.floor((containerWidth + gap) / (itemWidth + gap));
        this.itemsPerPage.set(Math.max(1, calculatedItemsPerPage));

        // Calculate number of pages
        const totalItems = this.filteredGames().length;
        const totalPages = Math.max(1, Math.ceil(totalItems / this.itemsPerPage()));

        // Generate dots array
        this.carouselDots.set(Array.from({ length: totalPages }, (_, i) => i));

        // Ensure current page is valid
        if (this.currentPage() >= totalPages) {
            this.currentPage.set(0);
        }
    }

    public filterByGenre(genre: string) {
        this.activeGenre.set(genre);
        this.currentPage.set(0); // Reset to first page when changing genre
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
}  
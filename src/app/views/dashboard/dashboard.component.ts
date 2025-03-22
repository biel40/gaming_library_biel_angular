import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit } from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {
    @ViewChild('carousel') carouselElement!: ElementRef;

    private _supabaseService: SupabaseService = inject(SupabaseService);

    public title: string = 'My Game Library';

    // Game data
    public games: Videogame[] = [];
    public filteredGames: Videogame[] = [];
    public uniqueGenres: string[] = [];
    private genreMap: Map<string, string> = new Map<string, string>();

    // UI state
    public searchTerm: string = '';
    public activeGenre: string = 'All';
    public viewMode: 'grid' | 'list' = 'grid';
    
    // Carousel state
    public currentPage: number = 0;
    public itemsPerPage: number = 0;
    public carouselDots: number[] = [];

    constructor() { }

    async ngOnInit() {
        this.games = await this._supabaseService.getVideogames();
        this.filteredGames = [...this.games];
        this.extractUniqueGenres();
    }

    ngAfterViewInit() {
        // Calculate items per page based on viewport
        this.calculateItemsPerPage();
        window.addEventListener('resize', () => this.calculateItemsPerPage());
    }

    private calculateItemsPerPage() {
        // Get the carousel width and approximate item width (320px + margin)
        const carouselWidth = this.carouselElement?.nativeElement.offsetWidth || 0;
        const itemWidth = 352; // 320px card width + 32px margins

        this.itemsPerPage = Math.floor(carouselWidth / itemWidth) || 3;
        
        const totalPages = Math.ceil(this.filteredGames.length / this.itemsPerPage);
        this.carouselDots = Array(totalPages).fill(0).map((_, i) => i);
    }

    /**
     * Filter games by search term and genre
    */
    public filterGames() {
        this.filteredGames = this.games.filter(game => {
            // Apply search filter
            const matchesSearch = this.searchTerm ? 
                game.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                game.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) :
                true;
            
            // Apply genre filter
            const matchesGenre = this.activeGenre === 'All' ? 
                true : 
                game.genre?.trim().toLowerCase() === this.activeGenre;
                
            return matchesSearch && matchesGenre;
        });

        this.calculateItemsPerPage();
        this.currentPage = 0;
    }

    /**
     * Filter games by genre
    */
    public filterByGenre(genre: string) {
        // Use normalized genre for filtering
        this.activeGenre = genre === 'All' ? 'All' : genre.trim().toLowerCase();
        this.filterGames();
    }

    /**
     * Reset all filters
    */
    public resetFilters() {
        this.searchTerm = '';
        this.activeGenre = 'All';
        this.filteredGames = [...this.games];
        this.calculateItemsPerPage();
    }

    /**
     * Extract unique genres from games for filter chips
    */
    private extractUniqueGenres() {
        const genres = new Set<string>();
        this.genreMap.clear();
        
        this.games.forEach(game => {
            if (game.genre) {
                // Normalize genre text (trim whitespace and convert to lowercase)
                const normalizedGenre = game.genre.trim().toLowerCase();
                
                if (!this.genreMap.has(normalizedGenre)) {
                    this.genreMap.set(normalizedGenre, game.genre);
                }

                if (genres.has(normalizedGenre)) {
                    return;
                }
                
                genres.add(normalizedGenre);
            }
        });
        
        // Transform normalized genres to display versions
        this.uniqueGenres = Array.from(genres).map(genre => this.genreMap.get(genre) || genre);
    }

    /**
     * Scroll the carousel left or right
     */
    public scrollCarousel(direction: 'left' | 'right') {
        if (direction === 'left') {
            this.currentPage = Math.max(0, this.currentPage - 1);
        } else {
            this.currentPage = Math.min(this.carouselDots.length - 1, this.currentPage + 1);
        }
        this.goToPage(this.currentPage);
    }

    /**
     * Go to a specific page in the carousel
     */
    public goToPage(pageIndex: number) {
        this.currentPage = pageIndex;
        const scrollAmount = pageIndex * (this.itemsPerPage * 352); // 352px = card width + margins
        this.carouselElement.nativeElement.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}  
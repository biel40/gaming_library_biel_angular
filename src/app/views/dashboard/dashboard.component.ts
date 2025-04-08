import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, AfterViewInit, signal, computed } from '@angular/core';
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

    // Signals for state management
    public title = signal('My Game Library');
    public games = signal<Videogame[]>([]);
    public searchTerm = signal('');
    public activeGenre = signal('All');
    public viewMode = signal<'grid' | 'list'>('grid');
    public currentPage = signal(0);
    public itemsPerPage = signal(0);
    public carouselDots = signal<number[]>([]);
    
    // Computed signals
    public filteredGames = computed(() => {
        const games = this.games();
        const searchTerm = this.searchTerm().toLowerCase();
        const activeGenre = this.activeGenre();
        
        return games.filter(game => {
            const matchesSearch = !searchTerm || 
                (game.name?.toLowerCase().includes(searchTerm) || 
                 game.description?.toLowerCase().includes(searchTerm));
            
            const matchesGenre = activeGenre === 'All' || game.genre === activeGenre;
            
            return matchesSearch && matchesGenre;
        });
    });
    
    public favoriteGames = computed(() => {
        return this.games().filter(game => game.favorite);
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

    constructor() { }

    async ngOnInit() {
        const games = await this._supabaseService.getVideogames();
        this.games.set(games);
        this.extractUniqueGenres();
    }

    ngAfterViewInit() {
        this.calculateItemsPerPage();
        window.addEventListener('resize', () => this.calculateItemsPerPage());
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
        const totalPages = Math.ceil(totalItems / this.itemsPerPage());
        
        // Generate dots array
        this.carouselDots.set(Array.from({ length: totalPages }, (_, i) => i));
    }

    public filterGames() {
        // No need to manually filter as the computed signal handles it
        this.currentPage.set(0); // Reset to first page when filtering
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

    private extractUniqueGenres() {
        // No need to manually extract genres as the computed signal handles it
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

    private updateFavoriteGames() {
        // No need to manually update favorite games as the computed signal handles it
    }
}  
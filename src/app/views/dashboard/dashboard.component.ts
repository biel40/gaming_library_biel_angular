import { Component, inject } from '@angular/core';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [
        GameCardComponent
    ]
})
export class DashboardComponent {

    private _supabaseService: SupabaseService = inject(SupabaseService);

    public games: Videogame[] = [];

    constructor() { }

    async ngOnInit() {
        this.games = await this._supabaseService.getVideogames();
    }

}  
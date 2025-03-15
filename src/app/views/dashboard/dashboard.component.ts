import { Component } from '@angular/core';
import { Game } from '../../models/game.interface';
import { GameCardComponent } from '../../components/game-card/game-card.component';

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

    public games: Game[] = [
        {
            id: 1,
            title: 'Final Fantasy X',
            description: 'Juego de rol de acción y aventura',
            image: 'assets/images/ffx.jpg'
        }
    ];

    constructor() { }

}  
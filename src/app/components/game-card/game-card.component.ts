import { Component, Input } from "@angular/core";
import { Game } from "../../models/game.interface";

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss']
  })
  export class GameCardComponent {
    @Input() game!: Game;

    constructor(

    ) {

    }


  }
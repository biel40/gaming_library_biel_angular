import { Component, Input } from "@angular/core";
import { Videogame } from "../../services/supabase/supabase.service";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    standalone: true,
    imports: [
      CommonModule
    ]
  })
  export class GameCardComponent {
    @Input() game!: Videogame;

    constructor(

    ) {

    }


  }
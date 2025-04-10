import { Routes } from "@angular/router";
import { DashboardComponent } from "./views/dashboard/dashboard.component";
import { GameDetailComponent } from "./views/game-detail/game-detail.component";
import { AddGameComponent } from "./views/add-game/add-game.component";

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'game/:id', component: GameDetailComponent },
    { path: 'add-game', component: AddGameComponent },
];

import { Routes } from "@angular/router";
import { DashboardComponent } from "./views/dashboard/dashboard.component";
import { GameDetailComponent } from "./views/game-detail/game-detail.component";
import { AddGameComponent } from "./views/add-game/add-game.component";
import { LoginComponent } from "./views/auth/login/login.component";
import { ProfileComponent } from "./views/profile/profile.component";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    // { path: 'login', component: LoginComponent }, // Login route disabled
    { path: 'dashboard', component: DashboardComponent },
    { path: 'game/:id', component: GameDetailComponent },
    { path: 'add-game', component: AddGameComponent },
    { path: 'profile', component: ProfileComponent },
];

import { Routes } from "@angular/router";
import { DashboardComponent } from "./views/dashboard/dashboard.component";
import { GameDetailComponent } from "./views/game-detail/game-detail.component";
import { AddGameComponent } from "./views/add-game/add-game.component";
import { LoginComponent } from "./views/auth/login/login.component";
import { ProfileComponent } from "./views/profile/profile.component";
import { ResetPasswordComponent } from "./views/auth/reset-password/reset-password.component";
import { PlatinumTrophiesComponent } from "./views/platinum-trophies/platinum-trophies.component";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent }, // Login route reactivated
    { path: 'reset-password', component: ResetPasswordComponent }, // Reset password route
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'game/:id', component: GameDetailComponent, canActivate: [authGuard] },
    { path: 'add-game', component: AddGameComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'platinum-trophies', component: PlatinumTrophiesComponent, canActivate: [authGuard] },
];

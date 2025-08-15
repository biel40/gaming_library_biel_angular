import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-platinum-trophies',
  templateUrl: './platinum-trophies.component.html',
  styleUrls: ['./platinum-trophies.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ]
})
export class PlatinumTrophiesComponent implements OnInit, OnDestroy {
  private _supabaseService: SupabaseService = inject(SupabaseService);
  private _userService: UserService = inject(UserService);
  private _router: Router = inject(Router);

  // Event listeners for cleanup
  private _clickListener?: (event: Event) => void;
  private _keydownListener?: (event: KeyboardEvent) => void;

  // Signals for state management
  public platinumGames = signal<Videogame[]>([]);
  public isLoading = signal(true);
  public error = signal<string | null>(null);
  public showNotification = signal(false);
  public notificationMessage = signal('');
  public notificationType = signal<'success' | 'error'>('success');
  
  // Read-only user state
  private _isReadOnlyUser = signal<boolean>(false);
  
  // User info
  public currentUser = signal<User | null>(null);
  public showUserMenu = signal(false);

  // Date editing modal
  public showDateModal = signal(false);
  public editingGame = signal<Videogame | null>(null);
  public newPlatinumDate = signal<string>('');
  public isUpdatingDate = signal(false);

  // Platinum target functionality
  public platinumTargetGame = signal<Videogame | null>(null);
  public loadingPlatinumTarget = signal(false);

  // Computed properties
  public userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.user_metadata?.['full_name'] || user.email || 'Usuario';
  });

  public readonly isReadOnlyUser = computed(() => this._isReadOnlyUser());

  public userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';
    
    const name = user.user_metadata?.['full_name'] || user.email || 'Usuario';
    return name.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  public platinumCount = computed(() => this.platinumGames().length);
  
  public bestPlatinumYear = computed(() => {
    const games = this.platinumGames();
    if (games.length === 0) return { year: new Date().getFullYear(), count: 0 };

    // Create a map to count platinums per year
    const yearCounts = new Map<number, number>();
    
    games.forEach(game => {
      if (game.platinum_date) {
        const year = new Date(game.platinum_date).getFullYear();
        yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
      }
    });

    // Find the year with the most platinums
    let bestYear = new Date().getFullYear();
    let maxCount = 0;

    yearCounts.forEach((count, year) => {
      if (count > maxCount) {
        maxCount = count;
        bestYear = year;
      }
    });

    return { year: bestYear, count: maxCount };
  });

  /**
   * Check if the current device is a mobile device
   */
  private isMobileDevice(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Detect if the user prefers reduced motion
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  constructor() {
    // Close user menu when clicking outside
    this._clickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu') && !target.closest('.user-avatar')) {
        this.showUserMenu.set(false);
      }
    };
    document.addEventListener('click', this._clickListener);

    // Add escape key handler for modal
    this._keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (this.showDateModal()) {
          this.closeDateEditModal();
        }
        if (this.showUserMenu()) {
          this.showUserMenu.set(false);
        }
      }
    };
    document.addEventListener('keydown', this._keydownListener);
  }

  ngOnDestroy() {
    // Clean up event listeners
    if (this._clickListener) {
      document.removeEventListener('click', this._clickListener);
    }
    if (this._keydownListener) {
      document.removeEventListener('keydown', this._keydownListener);
    }
    
    // Restore body scroll in case modal was open
    document.body.style.overflow = '';
  }

  async ngOnInit() {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Check if user is authenticated
      const session = await this._supabaseService.getSession();
      if (!session) {
        this._router.navigate(['/login']);
        return;
      }

      // Set current user information
      if (session.user) {
        this.currentUser.set(session.user);
        this._userService.setUser(session.user);
        
        // Check if user is read-only
        const isReadOnly = await this._supabaseService.isReadOnlyUser();
        this._isReadOnlyUser.set(isReadOnly);
      } else {
        this._isReadOnlyUser.set(false);
      }

      // Load platinum games
      const games = await this._supabaseService.getPlatinumGames();
      this.platinumGames.set(games);

      // Load current platinum target
      await this.loadPlatinumTarget();

    } catch (err) {
      console.error('Error loading platinum games:', err);
      this.error.set('Error cargando los trofeos de platino. Inténtalo de nuevo más tarde.');
    } finally {
      this.isLoading.set(false);
    }
  }

  public toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
  }

  public closeUserMenu() {
    this.showUserMenu.set(false);
  }

  /**
   * Logs out the current user and redirects to the login page
   */
  public async logout(): Promise<void> {
    try {
      // Sign out and clear session
      await this._supabaseService.signOut();
      
      // Clear user information
      this.currentUser.set(null);
      this._userService.clearUser();
      
      this.notificationMessage.set('Sesión cerrada correctamente');
      this.notificationType.set('success');
      this.showNotification.set(true);
      
      this._router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.notificationMessage.set('Error al cerrar sesión');
      this.notificationType.set('error');
      this.showNotification.set(true);
    }
  }

  /**
   * Show success notification with mobile-optimized timing
   */
  private showSuccessNotification(message: string) {
    this.notificationMessage.set(message);
    this.notificationType.set('success');
    this.showNotification.set(true);
    // Longer timeout for mobile devices for better UX
    const timeout = this.isMobileDevice() ? 4000 : 3000;
    setTimeout(() => this.showNotification.set(false), timeout);
  }

  /**
   * Show error notification with mobile-optimized timing
   */
  private showErrorNotification(message: string) {
    this.notificationMessage.set(message);
    this.notificationType.set('error');
    this.showNotification.set(true);
    // Longer timeout for mobile devices for better UX
    const timeout = this.isMobileDevice() ? 4000 : 3000;
    setTimeout(() => this.showNotification.set(false), timeout);
  }

  /**
   * Open the date editing modal for a specific game
   */
  public openDateEditModal(game: Videogame): void {
    if (this._isReadOnlyUser()) {
      this.showErrorNotification('No puedes editar fechas en modo de solo lectura');
      return;
    }

    this.editingGame.set(game);
    
    // Set the current date in YYYY-MM-DD format for the input
    if (game.platinum_date) {
      const date = new Date(game.platinum_date);
      const isoString = date.toISOString().split('T')[0];
      this.newPlatinumDate.set(isoString);
    } else {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      this.newPlatinumDate.set(today);
    }
    
    this.showDateModal.set(true);

    // Prevent body scroll on mobile when modal is open
    if (this.isMobileDevice()) {
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close the date editing modal
   */
  public closeDateEditModal(): void {
    this.showDateModal.set(false);
    this.editingGame.set(null);
    this.newPlatinumDate.set('');
    this.isUpdatingDate.set(false);

    // Restore body scroll on mobile
    if (this.isMobileDevice()) {
      document.body.style.overflow = '';
    }
  }

  /**
   * Update the platinum date for the selected game
   */
  public async updatePlatinumDate(): Promise<void> {
    if (this._isReadOnlyUser()) {
      this.showErrorNotification('No puedes actualizar fechas en modo de solo lectura');
      return;
    }

    const game = this.editingGame();
    const dateString = this.newPlatinumDate();
    
    if (!game || !dateString) return;

    try {
      this.isUpdatingDate.set(true);
      
      const newDate = new Date(dateString);
      const updatedGame = await this._supabaseService.updatePlatinumDate(game.id!, newDate);
      
      // Update the game in the local array
      const currentGames = this.platinumGames();
      const updatedGames = currentGames.map(g => 
        g.id === game.id ? { ...g, platinum_date: updatedGame.platinum_date } : g
      );
      this.platinumGames.set(updatedGames);
      
      this.showSuccessNotification(
        `Fecha de platino de "${game.name}" actualizada correctamente`
      );
      
      this.closeDateEditModal();
      
    } catch (error) {
      console.error('Error updating platinum date:', error);
      this.showErrorNotification('Error al actualizar la fecha de platino');
    } finally {
      this.isUpdatingDate.set(false);
    }
  }

  /**
   * Load the current platinum target game
   */
  private async loadPlatinumTarget(): Promise<void> {
    try {
      this.loadingPlatinumTarget.set(true);
      const targetGame = await this._supabaseService.getCurrentPlatinumTarget();
      this.platinumTargetGame.set(targetGame);
    } catch (error) {
      console.error('Error loading platinum target:', error);
      this.platinumTargetGame.set(null);
    } finally {
      this.loadingPlatinumTarget.set(false);
    }
  }

  /**
   * Remove the current platinum target
   */
  public async removePlatinumTarget(): Promise<void> {
    const currentTarget = this.platinumTargetGame();
    if (!currentTarget?.id) return;

    if (this._isReadOnlyUser()) {
      this.showErrorNotification('No puedes modificar objetivos en modo de solo lectura');
      return;
    }

    try {
      await this._supabaseService.removePlatinumTarget(currentTarget.id);
      this.platinumTargetGame.set(null);
      
      this.showSuccessNotification('Objetivo de platino eliminado correctamente');
    } catch (error) {
      console.error('Error removing platinum target:', error);
      this.showErrorNotification('Error al eliminar el objetivo de platino');
    }
  }

  /**
   * Set a game as platinum target
   */
  public async setPlatinumTarget(game: Videogame): Promise<void> {
    if (!game.id) return;

    if (this._isReadOnlyUser()) {
      this.showErrorNotification('No puedes modificar objetivos en modo de solo lectura');
      return;
    }

    try {
      const updatedGame = await this._supabaseService.setPlatinumTarget(game.id);
      this.platinumTargetGame.set({
        ...game,
        platinum_target: true
      });
      
      this.showSuccessNotification(`"${game.name}" marcado como objetivo de platino`);
    } catch (error) {
      console.error('Error setting platinum target:', error);
      this.showErrorNotification('Error al establecer el objetivo de platino');
    }
  }
}

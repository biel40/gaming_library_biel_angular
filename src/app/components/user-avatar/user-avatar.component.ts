import { Component, computed, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  // Inputs
  public user = input<User | null>(null);
  
  private _elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this._elementRef.nativeElement.contains(event.target)) {
      this.showUserMenu.set(false);
    }
  }

  // Private services
  private _supabaseService = inject(SupabaseService);
  private _userService = inject(UserService);
  private _notificationService = inject(NotificationService);
  private _router = inject(Router);

  // State
  public showUserMenu = signal(false);

  // Computed
  public userDisplayName = computed(() => {
    const user = this.user();
    if (!user) return '';
    return user.user_metadata?.['full_name'] || user.email || 'Usuario';
  });

  public userInitials = computed(() => {
    const user = this.user();
    if (!user) return 'U';
    
    const name = user.user_metadata?.['full_name'] || user.email || 'Usuario';
    return name.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
  });

  public toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  public async logout(): Promise<void> {
    try {
        // Close the user menu immediately
        this.showUserMenu.set(false);
        
        // Sign out and clear session
        await this._supabaseService.signOut();
        
        // Clear user information
        this._userService.clearUser();
        
        // Show success notification via global service
        this._notificationService.success('Sesión cerrada correctamente');
        
        // Navigate to login
        this._router.navigate(['/login']);
    } catch (error) {
        this._notificationService.error('Error al cerrar sesión');
    }
  }
}

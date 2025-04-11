import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService, Profile } from '../../services/supabase/supabase.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profile: Profile | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  userId = '';

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
    this.checkSession();
  }

  private async checkSession(): Promise<void> {
    const session = await this.supabaseService.getSession();

    if (!session) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.userId = session.user.id;
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      image_url: ['']
    });
  }

  private async loadProfile(): Promise<void> {
    this.loading = true;
    
    try {
      const { data, error } = await this.supabaseService.getProfileInfo(this.userId);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        this.profile = data;
        this.profileForm.patchValue({
          name: data.name || '',
          description: data.description || '',
          image_url: data.image_url || ''
        });
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load profile';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      const updatedProfile: Profile = {
        id: this.profile?.id,
        name: this.profileForm.value.name,
        description: this.profileForm.value.description || '',
        image_url: this.profileForm.value.image_url || ''
      };
      
      const { data, error } = await this.supabaseService.updateProfile(updatedProfile);
      
      if (error) {
        throw error;
      }
      
      this.successMessage = 'Profile updated successfully';
      if (data && data.length > 0) {
        this.profile = data[0];
      }
    } catch (error: any) {
      console.error('Profile update exception:', error);
      this.errorMessage = error.message || 'Failed to update profile';
    } finally {
      this.loading = false;
    }
  }

  signOut(): void {
    // Authentication signout commented out
    // this.supabaseService.signOut().then(() => {
    //   this.router.navigate(['/login']);
    // });
    
    // Just navigate to dashboard instead
    this.router.navigate(['/dashboard']);
  }
}

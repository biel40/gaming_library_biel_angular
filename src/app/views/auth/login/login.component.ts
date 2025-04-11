import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile, SupabaseService } from '../../../services/supabase/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoginMode = true;
  loading = false;
  errorMessage = '';

  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForms();
    this.checkExistingSession();
  }

  private async checkExistingSession(): Promise<void> {
    const session = await this.supabaseService.getSession();
    if (session) {
      this.router.navigate(['/dashboard']);
    }
  }

  private initForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      if (this.isLoginMode) {
        await this.handleLogin();
      } else {
        await this.handleRegistration();
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An unexpected error occurred';
    } finally {
      this.loading = false;
    }
  }

  private async handleLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly';
      return;
    }

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.supabaseService.signIn(email, password);
    
    if (error) {
      throw error;
    }
    
    this.router.navigate(['/dashboard']);
  }

  private async handleRegistration(): Promise<void> {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      return;
    }

    const { email, password, name } = this.registerForm.value;
    
    try {
      const { data, error } = await this.supabaseService.signUp(email, password);
      
      if (error) {
        throw error;
      }
      
      if (data.user) {

        // TODO: Arreglar login para que use el id de la tabla auth

        const userId = data.user.id;

        const profile: Profile = {
          id: userId,
          name: name
        };

        console.log('Creating profile: ', profile);
        
        const { error: profileError } = await this.supabaseService.insertProfile(profile);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          this.errorMessage = 'Error creating profile: ' + profileError.message;
          return;
        }
        
        this.errorMessage = 'Registration successful! Please check your email to confirm your account.';
        this.isLoginMode = true;
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      this.errorMessage = err.message || 'An unexpected error occurred during registration.';
      throw err;
    }
  }
}

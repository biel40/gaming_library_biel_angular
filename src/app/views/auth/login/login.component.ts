import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Profile, SupabaseService } from '../../../services/supabase/supabase.service';
import { environment } from '../../../environments/environment';

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
  resetPasswordForm!: FormGroup;
  isLoginMode = true;
  isResetPasswordMode = false;
  loading = false;
  errorMessage = '';
  allowRegistration = environment.allowRegistration;

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
    
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  toggleMode(): void {
    // Solo permite cambiar al modo de registro si está habilitado en el entorno
    if (!this.isLoginMode || this.allowRegistration) {
      this.isLoginMode = !this.isLoginMode;
      this.isResetPasswordMode = false;
      this.errorMessage = '';
    }
  }
  
  showResetPasswordForm(): void {
    this.isResetPasswordMode = true;
    this.isLoginMode = false;
    this.errorMessage = '';
    
    // Pre-fill email if it's already entered in login form
    if (this.loginForm.get('email')?.valid) {
      this.resetPasswordForm.get('email')?.setValue(this.loginForm.get('email')?.value);
    }
  }
  
  async handleResetPassword(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.errorMessage = 'Por favor, introduce un correo electrónico válido';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    try {
      const email = this.resetPasswordForm.get('email')?.value;
      const { error } = await this.supabaseService.resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      this.errorMessage = 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña';
      this.isLoginMode = true;
      this.isResetPasswordMode = false;
    } catch (error: any) {
      this.errorMessage = error.message || 'Ha ocurrido un error al intentar restablecer la contraseña';
    } finally {
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    
    try {
      if (this.isResetPasswordMode) {
        await this.handleResetPassword();
      } else if (this.isLoginMode) {
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
    // Verificar si el registro está permitido en el entorno actual
    if (!this.allowRegistration) {
      this.errorMessage = 'El registro de nuevos usuarios está deshabilitado en este momento.';
      return;
    }

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
        const userId = data.user.id;

        const profile: Profile = {
          id: userId,
          name: name
        };
        
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

import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  resetPasswordForm!: FormGroup;
  isLoginMode = signal(true);
  isResetPasswordMode = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  allowRegistration = signal(environment.allowRegistration);

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
    if (!this.isLoginMode() || this.allowRegistration()) {
      this.isLoginMode.update(v => !v);
      this.isResetPasswordMode.set(false);
      this.errorMessage.set('');
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      await this.supabaseService.signInWithGoogle();
    } catch (error: any) {
      this.errorMessage.set(this.translateAuthError(error));
    } finally {
      this.loading.set(false);
    }
  }
  
  showResetPasswordForm(): void {
    this.isResetPasswordMode.set(true);
    this.isLoginMode.set(false);
    this.errorMessage.set('');
    
    // Pre-fill email if it's already entered in login form
    if (this.loginForm.get('email')?.valid) {
      this.resetPasswordForm.get('email')?.setValue(this.loginForm.get('email')?.value);
    }
  }
  
  async handleResetPassword(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.errorMessage.set('Por favor, introduce un correo electrónico válido');
      return;
    }

    const email = this.resetPasswordForm.get('email')?.value;
    const { error } = await this.supabaseService.resetPassword(email);

    if (error) {
      throw error;
    }

    this.errorMessage.set('Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña');
    this.isLoginMode.set(true);
    this.isResetPasswordMode.set(false);
  }

  async onSubmit(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    
    try {
      if (this.isResetPasswordMode()) {
        await this.handleResetPassword();
      } else if (this.isLoginMode()) {
        await this.handleLogin();
      } else {
        await this.handleRegistration();
      }
    } catch (error: any) {
      this.errorMessage.set(this.translateAuthError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private async handleLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
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
    if (!this.allowRegistration()) {
      this.errorMessage.set('El registro de nuevos usuarios está deshabilitado en este momento.');
      return;
    }

    if (this.registerForm.invalid) {
      this.errorMessage.set('Por favor, completa todos los campos correctamente');
      return;
    }

    const { email, password, name } = this.registerForm.value;
    const { data, error } = await this.supabaseService.signUp(email, password);

    if (error) {
      throw error;
    }

    if (!data.user || data.user.identities?.length === 0) {
      throw new Error('User already registered');
    }

    const profile: Profile = {
      id: data.user.id,
      name: name
    };

    const { error: profileError } = await this.supabaseService.insertProfile(profile);

    if (profileError) {
      throw profileError;
    }

    this.router.navigate(['/dashboard']);
  }

  private translateAuthError(error: any): string {
    const message: string = error?.message ?? '';
    const errorMap: Record<string, string> = {
      'Email not confirmed': 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
      'Invalid login credentials': 'Correo electrónico o contraseña incorrectos.',
      'User already registered': 'Ya existe una cuenta con este correo electrónico.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'Unable to validate email address: invalid format': 'El formato del correo electrónico no es válido.',
      'Email rate limit exceeded': 'Has superado el límite de intentos. Espera unos minutos e inténtalo de nuevo.',
      'For security purposes, you can only request this after': 'Por razones de seguridad, espera unos segundos antes de volver a intentarlo.',
      'Token has expired or is invalid': 'El enlace ha caducado o no es válido. Solicita uno nuevo.',
    };

    for (const [key, translation] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return translation;
      }
    }

    return message || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
  }
}

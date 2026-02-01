import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { ResetPasswordComponent } from './reset-password.component';
import { SupabaseService } from '../../../services/supabase/supabase.service';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let supabaseService: jasmine.SpyObj<SupabaseService>;
  let router: Router;

  beforeEach(async () => {
    supabaseService = jasmine.createSpyObj<SupabaseService>('SupabaseService', ['updatePassword']);
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule],
      providers: [
        { provide: SupabaseService, useValue: supabaseService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark confirm password as mismatch when values differ', () => {
    component.resetForm.setValue({
      password: 'password123',
      confirmPassword: 'password124'
    });

    component.resetForm.updateValueAndValidity();

    expect(component.resetForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should set error message when submitting invalid form', async () => {
    component.resetForm.setValue({
      password: '',
      confirmPassword: ''
    });

    await component.onSubmit();

    expect(component.errorMessage).toBe('Por favor, completa todos los campos correctamente');
    expect(component.loading).toBeFalse();
  });

  it('should update password and navigate on success', fakeAsync(() => {
    supabaseService.updatePassword.and.returnValue(Promise.resolve({
      data: { user: { id: 'user-1' } as any },
      error: null
    }));

    component.resetForm.setValue({
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();
    flushMicrotasks();

    expect(component.successMessage).toBe('Tu contraseña ha sido actualizada correctamente');
    expect(component.loading).toBeFalse();

    tick(3000);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));
});

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  
  // Authentication check reactivated
  const session = await supabaseService.getSession();
  
  if (session) {
    return true;
  }
  
  // Redirect to login page if not authenticated
  router.navigate(['/login']);
  return false;
};

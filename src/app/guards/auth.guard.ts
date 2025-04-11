import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  
  // Authentication check commented out
  // const session = await supabaseService.getSession();
  
  // if (session) {
  //   return true;
  // }
  
  // Always return true to bypass authentication
  return true;
  
  // The following code is commented out as we're disabling authentication checks
  // // Redirect to login page if not authenticated
  // // router.navigate(['/login']);
  
  // //TODO: Arreglar login para que use el id de la tabla auth
  // router.navigate(['dashboard']);
  // return false;
};

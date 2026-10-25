import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from './auth-service';

/** Must be logged in, and (if the route lists roles) have one of them. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  if (!user) {
    // Remember where they were going so we can send them back after login
    return router.createUrlTree(['/login'], {
      queryParams: state.url === '/' ? {} : { returnUrl: state.url },
    });
  }

  const allowed = route.data['roles'] as Role[] | undefined;
  if (allowed && !allowed.includes(user.role)) return router.createUrlTree(['/']);

  return true;
};

/** For the login page: if you're already signed in, go to the dashboard. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user() ? inject(Router).createUrlTree(['/']) : true;
};
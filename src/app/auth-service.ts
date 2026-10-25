import { Injectable, computed, inject, signal } from '@angular/core';
import { ProfileService } from './profile-service';

export type Role = 'Administrator' | 'HR';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Account extends SessionUser {
  password: string;
}

/** DEMO ONLY. Replace with a real backend login. Never ship real passwords in front-end code. */
export const DEMO_ACCOUNTS: Account[] = [
  { id: 'admin', name: 'Admin User', email: 'admin@company.com', password: 'admin123', role: 'Administrator' },
  { id: 'hr', name: 'Maria Santos', email: 'hr@company.com', password: 'hr12345', role: 'HR' },
];

const KEY = 'employee-monitoring-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private profile = inject(ProfileService);

  private _user = signal<SessionUser | null>(this.restore());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor() {
    const u = this._user();
    if (u) this.profile.switchTo(u); // returning visitor: load their profile
  }

  /** Returns an error message, or '' when the login worked. */
  login(email: string, password: string, remember: boolean): string {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase() && a.password === password
    );
    // Same message for a wrong email and a wrong password, on purpose
    if (!account) return 'Incorrect email or password.';

    const user: SessionUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    };
    this._user.set(user);
    this.profile.switchTo(user);
    this.persist(user.id, remember);
    return '';
  }

  logout() {
    this._user.set(null);
    this.profile.clear();
    this.forget();
  }

  hasRole(...roles: Role[]): boolean {
    const u = this._user();
    return !!u && roles.includes(u.role);
  }

  // --- Session storage ---
  // Only the account id is stored (never the password or role).
  // "Keep me signed in" uses localStorage; otherwise the session ends when the tab closes.

  private persist(id: string, remember: boolean) {
    try {
      this.forget();
      (remember ? localStorage : sessionStorage).setItem(KEY, id);
    } catch {
      /* storage blocked */
    }
  }

  private forget() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  private restore(): SessionUser | null {
    try {
      const id = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
      const a = DEMO_ACCOUNTS.find((x) => x.id === id);
      // Rebuilt from the account list, so editing storage can't change your role
      return a ? { id: a.id, name: a.name, email: a.email, role: a.role } : null;
    } catch {
      return null; // storage blocked, or running on the server
    }
  }
}
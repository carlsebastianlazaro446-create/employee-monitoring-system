import { Component, computed, inject, isDevMode, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Account, AuthService, DEMO_ACCOUNTS } from './auth-service';
import { SettingsService } from '../settings-service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="submit()">
        <div class="login-brand">👥</div>
        <h1>{{ company() }}</h1>
        <p class="muted">Sign in to continue</p>

        <label>Email
          <input name="email" type="email" autocomplete="username" [(ngModel)]="email" required />
        </label>

        <label>Password
          <div class="password-field">
            <input
              name="password"
              autocomplete="current-password"
              [type]="show() ? 'text' : 'password'"
              [(ngModel)]="password"
              required
            />
            <button type="button" class="reveal" (click)="show.set(!show())">
              {{ show() ? 'Hide' : 'Show' }}
            </button>
          </div>
        </label>

        <label class="check">
          <input type="checkbox" name="remember" [(ngModel)]="remember" />
          Keep me signed in
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" class="btn primary block">Sign in</button>

        @if (devMode) {
          <details class="demo">
            <summary>Demo accounts</summary>
            @for (a of demo; track a.id) {
              <div class="demo-row">
                <span>
                  <strong>{{ a.role }}</strong><br />
                  {{ a.email }} / {{ a.password }}
                </span>
                <button type="button" class="btn small" (click)="fill(a)">Use</button>
              </div>
            }
          </details>
        }
      </form>
    </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private settings = inject(SettingsService);

  company = computed(() => this.settings.settings().companyName.trim() || 'Employee Monitoring');

  devMode = isDevMode(); // the demo box is hidden in a production build
  demo = DEMO_ACCOUNTS;

  email = '';
  password = '';
  remember = false;

  show = signal(false);
  error = signal('');

  fill(a: Account) {
    this.email = a.email;
    this.password = a.password;
    this.error.set('');
  }

  submit() {
    const problem = this.auth.login(this.email, this.password, this.remember);
    if (problem) {
      this.error.set(problem);
      this.password = '';
      return;
    }

    // Go back to the page they wanted, but only to pages inside this app
    const back = this.route.snapshot.queryParamMap.get('returnUrl');
    const safe = back && back.startsWith('/') && !back.startsWith('//') && !back.startsWith('/login');
    this.router.navigateByUrl(safe ? back : '/');
  }
}
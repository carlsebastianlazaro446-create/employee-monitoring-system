import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, Role } from './auth-service';
import { ProfileService } from './profile-service';
import { SettingsService } from '../settings-service';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
  roles?: Role[]; // leave out = every signed-in user
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      @if (user()) {
        <aside class="sidebar" [class.collapsed]="collapsed()">
          <div class="sidebar-header">
            <span class="brand">👥 <span class="label">{{ name() }}</span></span>
            <button class="toggle" (click)="collapsed.set(!collapsed())" aria-label="Toggle sidebar">☰</button>
          </div>

          <nav class="sidebar-nav">
            @for (l of visibleLinks(); track l.path) {
              <a
                [routerLink]="l.path"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: l.exact }"
                [title]="l.label"
              >
                <span class="icon">{{ l.icon }}</span>
                <span class="label">{{ l.label }}</span>
              </a>
            }
          </nav>

          <div class="sidebar-footer">
            <a class="sidebar-user" routerLink="/profile" routerLinkActive="active" title="My profile">
              <span class="avatar" [style.background-image]="avatarCss()">{{ profile().avatar ? '' : initials() }}</span>
              <span class="user-info label">
                <strong>{{ profile().name }}</strong>
                <small>{{ profile().role }}</small>
              </span>
            </a>
            <button class="logout" (click)="logout()" title="Sign out">
              <span class="icon">🚪</span>
              <span class="label">Sign out</span>
            </button>
          </div>
        </aside>
      }

      <div class="main">
        <main [class.content]="!!user()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class App {
  private settingsSvc = inject(SettingsService);
  private profileSvc = inject(ProfileService);
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;

  collapsed = signal(this.settingsSvc.settings().sidebarCollapsed);
  name = computed(() => this.settingsSvc.settings().companyName.trim() || 'Employee Monitoring');

  profile = this.profileSvc.profile;
  initials = this.profileSvc.initials;
  avatarCss = this.profileSvc.avatarCss;

  private links: NavLink[] = [
    { path: '/', label: 'Dashboard', icon: '📊', exact: true, roles: ['Administrator', 'HR'] },
    { path: '/employees', label: 'Employees', icon: '👥', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/attendance', label: 'Attendance', icon: '🕒', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/leaves', label: 'Leaves', icon: '🌴', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/reports', label: 'Reports', icon: '📄', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/incidents', label: 'Incidents', icon: '⚠️', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/documents', label: 'Documents', icon: '📁', exact: false, roles: ['Administrator', 'HR'] },
    { path: '/payroll', label: 'Payroll', icon: '💰', exact: false, roles: ['Administrator'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', exact: false, roles: ['Administrator'] },
  ];

  /** Only the links this role is allowed to open */
  visibleLinks = computed(() => {
    const u = this.user();
    return this.links.filter((l) => !l.roles || (!!u && l.roles.includes(u.role)));
  });

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
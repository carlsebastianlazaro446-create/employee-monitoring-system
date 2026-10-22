import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-header">
          <span class="brand">👥 <span class="label">Employee Monitoring</span></span>
          <button class="toggle" (click)="collapsed.set(!collapsed())" aria-label="Toggle sidebar">☰</button>
        </div>

        <nav class="sidebar-nav">
          @for (l of links; track l.path) {
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
          <span class="label">Employee Monitoring v1.0</span>
        </div>
      </aside>

      <div class="main">
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class App {
  collapsed = signal(false);

  links = [
    { path: '/', label: 'Dashboard', icon: '📊', exact: true },
    { path: '/employees', label: 'Employees', icon: '👥', exact: false },
    { path: '/attendance', label: 'Attendance', icon: '🕒', exact: false },
        { path: '/leaves', label: 'Leaves', icon: '🌴', exact: false },
  ];
}
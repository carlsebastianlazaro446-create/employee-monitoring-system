import { Component, inject } from '@angular/core';
import { Accent, AppSettings, SettingsService, Theme } from './settings-service';

@Component({
  selector: 'app-settings',
  template: `
    <h1>Settings</h1>
    <p class="muted">Changes are saved automatically in this browser.</p>

    <section class="panel">
      <h2>Appearance</h2>

      <div class="setting">
        <div>
          <strong>Theme</strong>
          <p class="muted">Light, dark, or follow your device's setting.</p>
        </div>
        <div class="seg">
          @for (t of themes; track t.value) {
            <button class="tab" [class.active]="s().theme === t.value" (click)="set('theme', t.value)">
              {{ t.icon }} {{ t.label }}
            </button>
          }
        </div>
      </div>

      <div class="setting">
        <div>
          <strong>Accent color</strong>
          <p class="muted">Used for buttons, active menu items and highlights.</p>
        </div>
        <div class="swatches">
          @for (a of accents; track a.value) {
            <button
              class="swatch"
              [class.active]="s().accent === a.value"
              [style.background]="a.color"
              [title]="a.label"
              [attr.aria-label]="a.label"
              (click)="set('accent', a.value)"
            ></button>
          }
        </div>
      </div>

      <div class="setting">
        <div>
          <strong>Compact tables</strong>
          <p class="muted">Smaller row height so more rows fit on screen.</p>
        </div>
        <label class="switch">
          <input type="checkbox" [checked]="s().compact" (change)="set('compact', $any($event.target).checked)" />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>Organization</h2>

      <div class="setting">
        <div>
          <strong>Company name</strong>
          <p class="muted">Shown at the top of the sidebar.</p>
        </div>
        <input type="text" [value]="s().companyName" (input)="setCompany($event)" />
      </div>

      <div class="setting">
        <div>
          <strong>Start with sidebar collapsed</strong>
          <p class="muted">Takes effect the next time the app opens.</p>
        </div>
        <label class="switch">
          <input type="checkbox" [checked]="s().sidebarCollapsed" (change)="set('sidebarCollapsed', $any($event.target).checked)" />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>Work hours and payroll</h2>

      <div class="setting">
        <div>
          <strong>Late after</strong>
          <p class="muted">Clock-ins after this time count as late in Reports.</p>
        </div>
        <input type="time" [value]="s().lateAfter" (change)="setLate($event)" />
      </div>

      <div class="setting">
        <div>
          <strong>Pay date lag (days)</strong>
          <p class="muted">Days after each cut-off (15th and 30th) that employees are paid. Use 0 to pay on the cut-off date.</p>
        </div>
        <input type="number" min="0" max="15" [value]="s().payLagDays" (change)="setLag($event)" />
      </div>
    </section>

    <section class="panel">
      <h2>Reset</h2>
      <div class="setting">
        <div>
          <strong>Restore default settings</strong>
          <p class="muted">Does not delete employees, attendance or any other data.</p>
        </div>
        <button class="btn danger" (click)="reset()">Reset settings</button>
      </div>
    </section>
  `,
})
export class Settings {
  private svc = inject(SettingsService);
  s = this.svc.settings;

  themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  accents: { value: Accent; label: string; color: string }[] = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'green', label: 'Green', color: '#16a34a' },
    { value: 'purple', label: 'Purple', color: '#7c3aed' },
    { value: 'orange', label: 'Orange', color: '#ea580c' },
  ];

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.svc.update(key, value);
  }

  setCompany(ev: Event) {
    this.set('companyName', (ev.target as HTMLInputElement).value);
  }

  setLate(ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    if (value) this.set('lateAfter', value);
  }

  setLag(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const n = Math.round(Number(input.value));
    const clamped = Number.isFinite(n) ? Math.min(15, Math.max(0, n)) : 0;
    input.value = String(clamped);
    this.set('payLagDays', clamped);
  }

  reset() {
    if (confirm('Reset all settings to their defaults?')) this.svc.reset();
  }
}
import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'blue' | 'green' | 'purple' | 'orange';

export interface AppSettings {
  theme: Theme;
  accent: Accent;
  compact: boolean;          // smaller table rows
  companyName: string;       // shown in the sidebar
  sidebarCollapsed: boolean; // sidebar state when the app opens
  lateAfter: string;         // 'HH:mm', clock-ins after this are "late"
  payLagDays: number;        // days after cut-off that employees are paid
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  accent: 'blue',
  compact: false,
  companyName: 'Employee Monitoring',
  sidebarCollapsed: false,
  lateAfter: '09:00',
  payLagDays: 5,
};

const STORAGE_KEY = 'employee-monitoring-settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private doc = inject(DOCUMENT);

  private _settings = signal<AppSettings>(this.load());
  readonly settings = this._settings.asReadonly();

  constructor() {
    // Runs now and again every time a setting changes
    effect(() => {
      const s = this._settings();
      this.apply(s);
      this.save(s);
    });

    // If the theme is "System", re-apply when the device switches light/dark
    if (typeof matchMedia !== 'undefined') {
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () =>
        this._settings.update((s) => ({ ...s }))
      );
    }
  }

  update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this._settings.update((s) => ({ ...s, [key]: value }));
  }

  reset() {
    this._settings.set({ ...DEFAULT_SETTINGS });
  }

  /** Puts the settings on the <html> element so CSS can react to them. */
  private apply(s: AppSettings) {
    const prefersDark =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = s.theme === 'dark' || (s.theme === 'system' && prefersDark);

    const root = this.doc.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-accent', s.accent);
    root.setAttribute('data-density', s.compact ? 'compact' : 'comfortable');
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS }; // storage blocked, or running on the server
    }
  }

  private save(s: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
}
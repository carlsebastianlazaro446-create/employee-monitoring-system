import { Injectable, computed, effect, signal } from '@angular/core';
import { squareAvatar } from './image-utils';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar: string | null;
  memberSince: string;
}

interface AccountInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const KEY_PREFIX = 'employee-monitoring-profile:';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private storageKey: string | null = null;

  private _profile = signal<UserProfile>(this.defaults({ name: '', email: '', role: '' }));
  readonly profile = this._profile.asReadonly();

  /** 'Admin User' -> 'AU' */
  readonly initials = computed(() => {
    const parts = this._profile().name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  });

  /** CSS value for the photo, or null when there is none */
  readonly avatarCss = computed(() => {
    const avatar = this._profile().avatar;
    return avatar ? `url("${avatar}")` : null;
  });

  constructor() {
    effect(() => {
      const profile = this._profile();
      if (this.storageKey) this.save(this.storageKey, profile);
    });
  }

  /** Called after login: loads this account's saved profile. */
  switchTo(account: AccountInfo) {
    this.storageKey = KEY_PREFIX + account.id;
    this._profile.set({
      ...this.defaults(account),
      ...this.load(this.storageKey),
      role: account.role,
    });
  }

  /** Called on logout. */
  clear() {
    this.storageKey = null;
    this._profile.set(this.defaults({ name: '', email: '', role: '' }));
  }

  update(patch: Partial<UserProfile>) {
    this._profile.update((profile) => ({ ...profile, ...patch }));
  }

  async setAvatar(file: File) {
    this.update({ avatar: await squareAvatar(file) });
  }

  private defaults(account: { name: string; email: string; role: string }): UserProfile {
    return {
      name: account.name,
      email: account.email,
      phone: '',
      role: account.role,
      avatar: null,
      memberSince: new Date().toLocaleDateString('en-CA'),
    };
  }

  private load(key: string): Partial<UserProfile> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private save(key: string, profile: UserProfile) {
    try {
      localStorage.setItem(key, JSON.stringify(profile));
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
}

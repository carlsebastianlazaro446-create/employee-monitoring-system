import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from './profile-service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  template: `
    <h1>My Profile</h1>

    <div class="profile-grid">
      <!-- Summary card -->
      <section class="panel profile-card">
        <span class="avatar large" [style.background-image]="avatarCss()">{{ p().avatar ? '' : initials() }}</span>
        <h2>{{ p().name }}</h2>
        <span class="badge approved">{{ p().role }}</span>
        <p class="muted">{{ p().email }}</p>
        <p class="muted">Member since {{ p().memberSince }}</p>

        <input #photo type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onPhoto(photo)" />
        <div class="actions">
          <button class="btn" (click)="photo.click()">Change photo</button>
          @if (p().avatar) {
            <button class="btn danger" (click)="removePhoto()">Remove</button>
          }
        </div>
        @if (photoError()) {
          <p class="error">{{ photoError() }}</p>
        }
      </section>

      <!-- Edit form -->
      <form class="panel form" (ngSubmit)="save()">
        <h2>Personal information</h2>
        <div class="grid">
          <label>Full name
            <input name="name" [(ngModel)]="form.name" required />
          </label>
          <label>Email
            <input name="email" type="email" [(ngModel)]="form.email" required />
          </label>
          <label>Phone
            <input name="phone" [(ngModel)]="form.phone" placeholder="09XX XXX XXXX" />
          </label>
          <label>Role
            <input [value]="p().role" disabled />
          </label>
        </div>
        <p class="muted hint">Your role is assigned by an administrator and can't be changed here.</p>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <div class="actions">
          <button type="submit" class="btn primary">Save changes</button>
          @if (saved()) {
            <span class="saved">✓ Saved</span>
          }
        </div>
      </form>
    </div>
  `,
})
export class Profile {
  private svc = inject(ProfileService);

  p = this.svc.profile;
  initials = this.svc.initials;
  avatarCss = this.svc.avatarCss;

  form = { name: this.p().name, email: this.p().email, phone: this.p().phone };

  error = signal('');
  photoError = signal('');
  saved = signal(false);

  save() {
    const name = this.form.name.trim();
    const email = this.form.email.trim();

    if (!name) return this.error.set('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return this.error.set('Please enter a valid email address.');

    this.error.set('');
    this.svc.update({ name, email, phone: this.form.phone.trim() });

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  async onPhoto(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = ''; // lets you pick the same file again later
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return this.photoError.set('Please choose an image under 5 MB.');

    try {
      await this.svc.setAvatar(file);
      this.photoError.set('');
    } catch {
      this.photoError.set('That file could not be read as an image.');
    }
  }

  removePhoto() {
    this.svc.update({ avatar: null });
  }
}
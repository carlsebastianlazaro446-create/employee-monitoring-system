import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EmployeeService } from './employee-service';
import { squareAvatar } from './image-utils';
import { CivilStatus, Employee, Gender, Status } from './models';

interface ProfileForm {
  name: string;
  email: string;
  department: string;
  position: string;
  status: Status;
  hireDate: string;
  birthDate: string;
  gender: Gender;
  civilStatus: CivilStatus;
  phone: string;
  address: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  sssNo: string;
  philhealthNo: string;
  pagibigNo: string;
  tin: string;
}

@Component({
  selector: 'app-employee-profile',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Employee Profile</h1>
      <a class="btn" routerLink="/employees">← Back to employees</a>
    </div>

    @if (employee(); as e) {
      <div class="profile-grid">
        <section class="panel profile-card">
          <span class="avatar large" [style.background-image]="photoCss()">{{ details().photo ? '' : initials() }}</span>
          <h2>{{ e.name }}</h2>
          <p class="muted">{{ e.position }} · {{ e.department }}</p>
          <span class="badge" [class]="'badge ' + statusClass(e.status)">{{ e.status }}</span>
          <p class="muted">{{ e.email }}</p>
          @if (tenure()) {
            <p class="muted">With the company {{ tenure() }}</p>
          }

          <input #photo type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onPhoto(photo)" />
          <div class="actions">
            <button class="btn" type="button" (click)="photo.click()">Change photo</button>
            @if (details().photo) {
              <button class="btn danger" type="button" (click)="removePhoto()">Remove</button>
            }
          </div>
          @if (photoError()) {
            <p class="error">{{ photoError() }}</p>
          }

          <ul class="stat-list">
            <li><span>Days present this month</span><strong>{{ stats().present }}</strong></li>
            <li><span>Approved leaves</span><strong>{{ stats().leaves }}</strong></li>
            <li><span>Incident reports</span><strong>{{ stats().incidents }}</strong></li>
            <li><span>Documents on file</span><strong>{{ stats().documents }}</strong></li>
          </ul>
        </section>

        <form class="panel form" (ngSubmit)="save()">
          <h3 class="section-title">Employment</h3>
          <div class="grid">
            <label>Full name <input name="name" [(ngModel)]="form.name" required /></label>
            <label>Email <input name="email" type="email" [(ngModel)]="form.email" required /></label>
            <label>Department <input name="department" [(ngModel)]="form.department" required /></label>
            <label>Position <input name="position" [(ngModel)]="form.position" required /></label>
            <label>Status
              <select name="status" [(ngModel)]="form.status">
                @for (status of statuses; track status) {
                  <option [value]="status">{{ status }}</option>
                }
              </select>
            </label>
            <label>Date hired <input name="hireDate" type="date" [(ngModel)]="form.hireDate" /></label>
          </div>

          <h3 class="section-title">Personal details</h3>
          <div class="grid">
            <label>Birth date <input name="birthDate" type="date" [(ngModel)]="form.birthDate" /></label>
            <label>Gender
              <select name="gender" [(ngModel)]="form.gender">
                <option value="">—</option>
                @for (gender of genders; track gender) {
                  <option [value]="gender">{{ gender }}</option>
                }
              </select>
            </label>
            <label>Civil status
              <select name="civilStatus" [(ngModel)]="form.civilStatus">
                <option value="">—</option>
                @for (civilStatus of civilStatuses; track civilStatus) {
                  <option [value]="civilStatus">{{ civilStatus }}</option>
                }
              </select>
            </label>
            <label>Phone <input name="phone" [(ngModel)]="form.phone" placeholder="09XX XXX XXXX" /></label>
            <label class="wide">Home address <input name="address" [(ngModel)]="form.address" /></label>
          </div>

          <h3 class="section-title">Emergency contact</h3>
          <div class="grid">
            <label>Name <input name="emergencyName" [(ngModel)]="form.emergencyName" /></label>
            <label>Relationship <input name="emergencyRelation" [(ngModel)]="form.emergencyRelation" placeholder="e.g. Spouse, Mother" /></label>
            <label>Phone <input name="emergencyPhone" [(ngModel)]="form.emergencyPhone" /></label>
          </div>

          <h3 class="section-title">Government IDs</h3>
          <div class="grid">
            <label>SSS number <input name="sssNo" [(ngModel)]="form.sssNo" placeholder="00-0000000-0" /></label>
            <label>PhilHealth number <input name="philhealthNo" [(ngModel)]="form.philhealthNo" placeholder="00-000000000-0" /></label>
            <label>Pag-IBIG number <input name="pagibigNo" [(ngModel)]="form.pagibigNo" placeholder="0000-0000-0000" /></label>
            <label>TIN <input name="tin" [(ngModel)]="form.tin" placeholder="000-000-000" /></label>
          </div>

          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <div class="actions">
            <button type="submit" class="btn primary">Save changes</button>
            <button type="button" class="btn" (click)="discard()">Discard changes</button>
            @if (saved()) {
              <span class="saved">✓ Saved</span>
            }
          </div>
        </form>
      </div>
    } @else {
      <div class="panel empty">Employee not found. They may have been deleted.</div>
    }
  `,
})
export class EmployeeProfile {
  private svc = inject(EmployeeService);

  private id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 }
  );

  statuses: Status[] = ['Active', 'On Leave', 'Inactive'];
  genders: Exclude<Gender, ''>[] = ['Male', 'Female', 'Other'];
  civilStatuses: Exclude<CivilStatus, ''>[] = ['Single', 'Married', 'Widowed', 'Separated'];

  employee = computed(() => this.svc.employees().find((employee) => employee.id === this.id()));
  details = computed(() => this.svc.detailsOf(this.id()));

  form: ProfileForm = this.blankForm();
  error = signal('');
  photoError = signal('');
  saved = signal(false);

  constructor() {
    effect(() => {
      const employee = this.employee();
      if (employee) untracked(() => (this.form = this.buildForm(employee)));
    });
  }

  initials = computed(() => {
    const parts = (this.employee()?.name ?? '').trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  });

  photoCss = computed(() => {
    const photo = this.details().photo;
    return photo ? `url("${photo}")` : null;
  });

  tenure = computed(() => {
    const hired = this.details().hireDate;
    if (!hired) return '';
    const start = new Date(`${hired}T00:00:00`);
    if (Number.isNaN(start.getTime())) return '';

    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months--;
    if (months < 0) return 'starting soon';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const parts = [];
    if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (remainingMonths || !years) parts.push(`${remainingMonths} mo${remainingMonths === 1 ? '' : 's'}`);
    return `for ${parts.join(' ')}`;
  });

  stats = computed(() => {
    const id = this.id();
    const month = this.svc.today().slice(0, 7);
    return {
      present: this.svc.attendance().filter((record) => record.employeeId === id && record.date.startsWith(month)).length,
      leaves: this.svc.leaves().filter((leave) => leave.employeeId === id && leave.status === 'Approved').length,
      incidents: this.svc.incidents().filter((incident) => incident.employeeId === id).length,
      documents: this.svc.documents().filter((document) => document.employeeId === id).length,
    };
  });

  statusClass(status: Status) {
    return status.toLowerCase().replace(' ', '-');
  }

  private blankForm(): ProfileForm {
    return {
      name: '',
      email: '',
      department: '',
      position: '',
      status: 'Active',
      hireDate: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      phone: '',
      address: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      sssNo: '',
      philhealthNo: '',
      pagibigNo: '',
      tin: '',
    };
  }

  private buildForm(employee: Employee): ProfileForm {
    const details = this.svc.detailsOf(employee.id);
    return {
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      status: employee.status,
      hireDate: details.hireDate,
      birthDate: details.birthDate,
      gender: details.gender,
      civilStatus: details.civilStatus,
      phone: details.phone,
      address: details.address,
      emergencyName: details.emergencyName,
      emergencyRelation: details.emergencyRelation,
      emergencyPhone: details.emergencyPhone,
      sssNo: details.sssNo,
      philhealthNo: details.philhealthNo,
      pagibigNo: details.pagibigNo,
      tin: details.tin,
    };
  }

  private badId(value: string, lengths: number[]): boolean {
    if (!value.trim()) return false;
    if (/[^\d\s-]/.test(value)) return true;
    return !lengths.includes(value.replace(/\D/g, '').length);
  }

  private validate(form: ProfileForm, id: number): string {
    if (!form.name.trim()) return 'Please enter a name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email address.';
    if (this.svc.employees().some((employee) =>
      employee.id !== id && employee.email.toLowerCase() === form.email.trim().toLowerCase()
    )) {
      return 'Another employee already uses that email.';
    }
    if (!form.department.trim() || !form.position.trim()) return 'Department and position are required.';
    if (form.birthDate && form.birthDate > this.svc.today()) return 'Birth date cannot be in the future.';

    const phonePattern = /^[\d\s+()-]{7,20}$/;
    if (form.phone.trim() && !phonePattern.test(form.phone.trim())) return 'Please enter a valid phone number.';
    if (form.emergencyPhone.trim() && !phonePattern.test(form.emergencyPhone.trim())) {
      return 'Please enter a valid emergency contact phone.';
    }

    if (this.badId(form.sssNo, [10])) return 'SSS number should have 10 digits.';
    if (this.badId(form.philhealthNo, [12])) return 'PhilHealth number should have 12 digits.';
    if (this.badId(form.pagibigNo, [12])) return 'Pag-IBIG number should have 12 digits.';
    if (this.badId(form.tin, [9, 12])) return 'TIN should have 9 or 12 digits.';
    return '';
  }

  save() {
    const employee = this.employee();
    if (!employee) return;

    const problem = this.validate(this.form, employee.id);
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.error.set('');

    this.svc.update({
      ...employee,
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      department: this.form.department.trim(),
      position: this.form.position.trim(),
      status: this.form.status,
    });

    this.svc.saveDetails({
      ...this.svc.detailsOf(employee.id),
      employeeId: employee.id,
      hireDate: this.form.hireDate,
      birthDate: this.form.birthDate,
      gender: this.form.gender,
      civilStatus: this.form.civilStatus,
      phone: this.form.phone.trim(),
      address: this.form.address.trim(),
      emergencyName: this.form.emergencyName.trim(),
      emergencyRelation: this.form.emergencyRelation.trim(),
      emergencyPhone: this.form.emergencyPhone.trim(),
      sssNo: this.form.sssNo.trim(),
      philhealthNo: this.form.philhealthNo.trim(),
      pagibigNo: this.form.pagibigNo.trim(),
      tin: this.form.tin.trim(),
    });

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  discard() {
    const employee = this.employee();
    if (employee) this.form = this.buildForm(employee);
    this.error.set('');
  }

  async onPhoto(input: HTMLInputElement) {
    const employee = this.employee();
    const file = input.files?.[0];
    input.value = '';
    if (!employee || !file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.photoError.set('Please choose an image under 5 MB.');
      return;
    }

    try {
      const photo = await squareAvatar(file);
      if (this.id() === employee.id) {
        this.svc.saveDetails({ ...this.svc.detailsOf(employee.id), photo });
        this.photoError.set('');
      }
    } catch {
      if (this.id() === employee.id) this.photoError.set('That file could not be read as an image.');
    }
  }

  removePhoto() {
    const employee = this.employee();
    if (employee) this.svc.saveDetails({ ...this.svc.detailsOf(employee.id), photo: null });
  }
}

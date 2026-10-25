import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmployeeService } from './employee-service';
import { Employee, Status } from './models';

@Component({
  selector: 'app-employees',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Employees</h1>
      <button class="btn primary" (click)="openAdd()">+ Add Employee</button>
    </div>

    <div class="toolbar">
      <input type="text" placeholder="Search name or email..." [(ngModel)]="search" />
      <select [(ngModel)]="departmentFilter">
        <option value="">All departments</option>
        @for (d of departments(); track d) {
          <option [value]="d">{{ d }}</option>
        }
      </select>
    </div>

    @if (showForm()) {
      <form class="panel form" (ngSubmit)="save()">
        <h2>{{ form.id ? 'Edit Employee' : 'New Employee' }}</h2>
        <div class="grid">
          <label>Name <input name="name" [(ngModel)]="form.name" required /></label>
          <label>Email <input name="email" type="email" [(ngModel)]="form.email" required /></label>
          <label>Department <input name="department" [(ngModel)]="form.department" required /></label>
          <label>Position <input name="position" [(ngModel)]="form.position" required /></label>
          <label>Status
            <select name="status" [(ngModel)]="form.status">
              @for (s of statuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>
        </div>
        <div class="actions">
          <button type="submit" class="btn primary">Save</button>
          <button type="button" class="btn" (click)="showForm.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="panel table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          @for (e of filtered(); track e.id) {
            <tr>
              <td>{{ e.name }}</td>
              <td>{{ e.email }}</td>
              <td>{{ e.department }}</td>
              <td>{{ e.position }}</td>
              <td><span class="badge" [class]="statusClass(e.status)">{{ e.status }}</span></td>
              <td class="row-actions">
                <a class="btn small" [routerLink]="['/employees', e.id]">Profile</a>
                <button class="btn small" (click)="openEdit(e)">Edit</button>
                <button class="btn small danger" (click)="remove(e)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">No employees found.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Employees {
  private svc = inject(EmployeeService);

  statuses: Status[] = ['Active', 'On Leave', 'Inactive'];

  search = signal('');
  departmentFilter = signal('');
  showForm = signal(false);

  form: Partial<Employee> = this.emptyForm();

  departments = computed(() => [...new Set(this.svc.employees().map((e) => e.department))]);

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const dept = this.departmentFilter();
    return this.svc
      .employees()
      .filter(
        (e) =>
          (!q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)) &&
          (!dept || e.department === dept)
      );
  });

  private emptyForm(): Partial<Employee> {
    return { name: '', email: '', department: '', position: '', status: 'Active' };
  }

  statusClass(s: Status) {
    return 'badge ' + s.toLowerCase().replace(' ', '-');
  }

  openAdd() {
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  openEdit(e: Employee) {
    this.form = { ...e };
    this.showForm.set(true);
  }

  save() {
    if (this.form.id) {
      this.svc.update(this.form as Employee);
    } else {
      this.svc.add(this.form as Omit<Employee, 'id'>);
    }
    this.showForm.set(false);
  }

  remove(e: Employee) {
    if (confirm(`Delete ${e.name}?`)) this.svc.remove(e.id);
  }
}
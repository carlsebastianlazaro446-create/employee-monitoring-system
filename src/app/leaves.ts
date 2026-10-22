import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee-service';
import { LeaveRequest, LeaveStatus, LeaveType } from './models';

type Filter = 'All' | LeaveStatus;

@Component({
  selector: 'app-leaves',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Leave Requests</h1>
      <button class="btn primary" (click)="showForm.set(!showForm())">+ New Request</button>
    </div>

    <div class="cards">
      <div class="card"><span>Pending</span><strong>{{ count('Pending') }}</strong></div>
      <div class="card"><span>Approved</span><strong>{{ count('Approved') }}</strong></div>
      <div class="card"><span>Rejected</span><strong>{{ count('Rejected') }}</strong></div>
    </div>

    @if (showForm()) {
      <form class="panel form leave-form" (ngSubmit)="submit()">
        <h2>New Leave Request</h2>
        <div class="grid">
          <label>Employee
            <select name="employeeId" [(ngModel)]="form.employeeId" required>
              <option [ngValue]="0" disabled>Select employee</option>
              @for (e of svc.employees(); track e.id) {
                <option [ngValue]="e.id">{{ e.name }}</option>
              }
            </select>
          </label>
          <label>Leave type
            <select name="type" [(ngModel)]="form.type">
              @for (t of types; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </label>
          <label>Start date
            <input name="startDate" type="date" [(ngModel)]="form.startDate" required />
          </label>
          <label>End date
            <input name="endDate" type="date" [(ngModel)]="form.endDate" required />
          </label>
          <label class="wide">Reason
            <input name="reason" [(ngModel)]="form.reason" required />
          </label>
        </div>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <div class="actions">
          <button type="submit" class="btn primary">Submit</button>
          <button type="button" class="btn" (click)="showForm.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="tabs">
      @for (f of filters; track f) {
        <button class="tab" [class.active]="filter() === f" (click)="filter.set(f)">
          {{ f }}
        </button>
      }
    </div>

    <div class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th><th>Type</th><th>Dates</th><th>Days</th>
            <th>Reason</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          @for (l of filtered(); track l.id) {
            <tr>
              <td>{{ nameOf(l.employeeId) }}<br /><small class="muted">Requested {{ l.requestedOn }}</small></td>
              <td>{{ l.type }}</td>
              <td>{{ l.startDate }}<br /><small class="muted">to {{ l.endDate }}</small></td>
              <td>{{ days(l) }}</td>
              <td>{{ l.reason }}</td>
              <td><span class="badge" [class]="'badge ' + l.status.toLowerCase()">{{ l.status }}</span></td>
              <td class="row-actions">
                @if (l.status === 'Pending') {
                  <button class="btn small success" (click)="svc.setLeaveStatus(l.id, 'Approved')">Approve</button>
                  <button class="btn small danger" (click)="svc.setLeaveStatus(l.id, 'Rejected')">Reject</button>
                } @else {
                  <button class="btn small" (click)="svc.setLeaveStatus(l.id, 'Pending')">Undo</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty">No leave requests.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Leaves {
  svc = inject(EmployeeService);

  types: LeaveType[] = ['Vacation', 'Sick', 'Emergency', 'Other'];
  filters: Filter[] = ['All', 'Pending', 'Approved', 'Rejected'];

  filter = signal<Filter>('Pending');
  showForm = signal(false);
  error = signal('');

  form = this.emptyForm();

  filtered = computed(() => {
    const f = this.filter();
    return this.svc.leaves().filter((l) => f === 'All' || l.status === f);
  });

  private emptyForm() {
    const today = this.svc.today();
    return {
      employeeId: 0,
      type: 'Vacation' as LeaveType,
      startDate: today,
      endDate: today,
      reason: '',
    };
  }

  count(status: LeaveStatus) {
    return this.svc.leaves().filter((l) => l.status === status).length;
  }

  nameOf(id: number) {
    return this.svc.employees().find((e) => e.id === id)?.name ?? 'Unknown';
  }

  days(l: LeaveRequest) {
    const ms = new Date(l.endDate).getTime() - new Date(l.startDate).getTime();
    return Math.round(ms / 86_400_000) + 1;
  }

  submit() {
    if (!this.form.employeeId) {
      this.error.set('Please select an employee.');
      return;
    }
    if (this.form.endDate < this.form.startDate) {
      this.error.set('End date cannot be before the start date.');
      return;
    }
    this.error.set('');
    this.svc.addLeave({ ...this.form });
    this.form = this.emptyForm();
    this.showForm.set(false);
    this.filter.set('Pending');
  }
}
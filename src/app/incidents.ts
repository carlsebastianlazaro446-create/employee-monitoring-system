import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee-service';
import { IncidentSeverity, IncidentStatus, IncidentType } from './models';

type Filter = 'All' | IncidentStatus;

@Component({
  selector: 'app-incidents',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Incident Reports</h1>
      <button class="btn primary" (click)="showForm.set(!showForm())">+ New Incident</button>
    </div>

    <div class="cards">
      <div class="card"><span>Open</span><strong>{{ count('Open') }}</strong></div>
      <div class="card"><span>Investigating</span><strong>{{ count('Investigating') }}</strong></div>
      <div class="card"><span>Resolved</span><strong>{{ count('Resolved') }}</strong></div>
    </div>

    @if (showForm()) {
      <form class="panel form leave-form" (ngSubmit)="submit()">
        <h2>New Incident Report</h2>
        <div class="grid">
          <label>Employee involved
            <select name="employeeId" [(ngModel)]="form.employeeId" required>
              <option [ngValue]="0" disabled>Select employee</option>
              @for (e of svc.employees(); track e.id) {
                <option [ngValue]="e.id">{{ e.name }}</option>
              }
            </select>
          </label>
          <label>Type
            <select name="type" [(ngModel)]="form.type">
              @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
            </select>
          </label>
          <label>Severity
            <select name="severity" [(ngModel)]="form.severity">
              @for (s of severities; track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </label>
          <label>Date of incident
            <input name="date" type="date" [(ngModel)]="form.date" required />
          </label>
          <label>Location
            <input name="location" [(ngModel)]="form.location" required />
          </label>
          <label>Reported by
            <input name="reportedBy" [(ngModel)]="form.reportedBy" required />
          </label>
          <label class="wide">Description
            <textarea name="description" rows="3" [(ngModel)]="form.description" required></textarea>
          </label>
        </div>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <div class="actions">
          <button type="submit" class="btn primary">Submit report</button>
          <button type="button" class="btn" (click)="showForm.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="tabs">
      @for (f of filters; track f) {
        <button class="tab" [class.active]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
      }
    </div>

    <div class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Employee</th><th>Incident</th><th>Severity</th>
            <th>Status</th><th>Action taken</th><th></th>
          </tr>
        </thead>
        <tbody>
          @for (i of filtered(); track i.id) {
            <tr>
              <td>{{ nameOf(i.employeeId) }}<br /><small class="muted">{{ i.date }} · {{ i.location }}</small></td>
              <td>
                <strong>{{ i.type }}</strong><br />
                {{ i.description }}<br />
                <small class="muted">Reported by {{ i.reportedBy }}</small>
              </td>
              <td><span class="badge" [class]="'badge ' + i.severity.toLowerCase()">{{ i.severity }}</span></td>
              <td><span class="badge" [class]="'badge ' + i.status.toLowerCase()">{{ i.status }}</span></td>
              <td>{{ i.actionTaken || '—' }}</td>
              <td class="row-actions">
                @if (i.status === 'Open') {
                  <button class="btn small" (click)="svc.setIncidentStatus(i.id, 'Investigating')">Investigate</button>
                }
                @if (i.status !== 'Resolved') {
                  <button class="btn small success" (click)="resolve(i.id)">Resolve</button>
                } @else {
                  <button class="btn small" (click)="svc.setIncidentStatus(i.id, 'Open')">Reopen</button>
                }
                <button class="btn small danger" (click)="remove(i.id)">Delete</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">No incident reports.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Incidents {
  svc = inject(EmployeeService);

  types: IncidentType[] = ['Safety', 'Misconduct', 'Equipment', 'Harassment', 'Other'];
  severities: IncidentSeverity[] = ['Low', 'Medium', 'High'];
  filters: Filter[] = ['All', 'Open', 'Investigating', 'Resolved'];

  filter = signal<Filter>('All');
  showForm = signal(false);
  error = signal('');

  form = this.emptyForm();

  filtered = computed(() => {
    const f = this.filter();
    return this.svc.incidents().filter((i) => f === 'All' || i.status === f);
  });

  private emptyForm() {
    return {
      employeeId: 0,
      type: 'Safety' as IncidentType,
      severity: 'Low' as IncidentSeverity,
      date: this.svc.today(),
      location: '',
      description: '',
      reportedBy: '',
    };
  }

  count(status: IncidentStatus) {
    return this.svc.incidents().filter((i) => i.status === status).length;
  }

  nameOf(id: number) {
    return this.svc.employees().find((e) => e.id === id)?.name ?? 'Unknown';
  }

  submit() {
    if (!this.form.employeeId) {
      this.error.set('Please select an employee.');
      return;
    }
    this.error.set('');
    this.svc.addIncident({ ...this.form });
    this.form = this.emptyForm();
    this.showForm.set(false);
    this.filter.set('All');
  }

  resolve(id: number) {
    const action = prompt('What action was taken?');
    if (action === null) return; // cancelled
    this.svc.setIncidentStatus(id, 'Resolved', action.trim());
  }

  remove(id: number) {
    if (confirm('Delete this incident report?')) this.svc.removeIncident(id);
  }
}
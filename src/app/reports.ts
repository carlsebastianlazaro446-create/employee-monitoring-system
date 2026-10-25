import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee-service';

@Component({
  selector: 'app-reports',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h1>Employee Reports</h1>
      <div class="header-actions no-print">
        <button class="btn" (click)="print()">🖨 Print</button>
        <button class="btn primary" (click)="exportCsv()">⬇ Export CSV</button>
      </div>
    </div>

    <div class="toolbar no-print">
      <label class="inline-label">Month
        <input type="month" [ngModel]="month()" (ngModelChange)="month.set($event)" />
      </label>
    </div>

    <p class="muted">
      Report for <strong>{{ monthLabel() }}</strong>. Absences count past weekdays only,
      and approved leave days are not counted as absent.
    </p>

    <div class="cards">
      <div class="card"><span>Total Late Arrivals</span><strong>{{ totals().late }}</strong></div>
      <div class="card"><span>Total Absences</span><strong>{{ totals().absent }}</strong></div>
      <div class="card"><span>Leave Days</span><strong>{{ totals().leave }}</strong></div>
      <div class="card"><span>Incidents</span><strong>{{ totals().incidents }}</strong></div>
    </div>

    <div class="panel table-wrap report-table">
      <table>
        <thead>
          <tr>
            <th>Employee</th><th>Days Present</th><th>Late</th><th>Absent</th>
            <th>Leave Days</th><th>Hours Worked</th><th>Incidents</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.id) {
            <tr>
              <td>{{ r.name }}<br /><small class="muted">{{ r.department }}</small></td>
              <td>{{ r.present }}</td>
              <td [class.flag]="r.late > 0">{{ r.late }}</td>
              <td [class.flag]="r.absent > 0">{{ r.absent }}</td>
              <td>{{ r.leave }}</td>
              <td>{{ r.hours }}</td>
              <td [class.flag]="r.incidents > 0">{{ r.incidents }}</td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty">No employees.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Reports {
  private svc = inject(EmployeeService);

  /** 'YYYY-MM' */
  month = signal(this.svc.today().slice(0, 7));

  monthLabel = computed(() => {
    const [y, m] = this.month().split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  /** '08:45 AM' -> minutes since midnight */
  private toMinutes(t: string | null): number | null {
    if (!t) return null;
    const [time, ap] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  rows = computed(() => {
    const month = this.month();
    if (!month) return [];
    const [y, m] = month.split('-').map(Number);
    const today = this.svc.today();

    // Past weekdays in this month
    const days: string[] = [];
    const last = new Date(y, m, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const dt = new Date(y, m - 1, d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const iso = dt.toLocaleDateString('en-CA');
      if (iso < today) days.push(iso);
    }

    return this.svc.employees().map((emp) => {
      const recs = this.svc
        .attendance()
        .filter((r) => r.employeeId === emp.id && r.date.startsWith(month));

      let late = 0;
      let minutes = 0;
      for (const r of recs) {
        const i = this.toMinutes(r.timeIn);
        const o = this.toMinutes(r.timeOut);
        if (i !== null && i > 9 * 60) late++;
        if (i !== null && o !== null && o > i) minutes += o - i;
      }

      const approved = this.svc
        .leaves()
        .filter((l) => l.employeeId === emp.id && l.status === 'Approved');
      const onLeave = (d: string) => approved.some((l) => d >= l.startDate && d <= l.endDate);
      const presentDates = new Set(recs.map((r) => r.date));

      return {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        present: recs.length,
        late,
        absent:
          emp.status === 'Active'
            ? days.filter((d) => !presentDates.has(d) && !onLeave(d)).length
            : 0,
        leave: days.filter(onLeave).length,
        hours: (minutes / 60).toFixed(1),
        incidents: this.svc
          .incidents()
          .filter((i) => i.employeeId === emp.id && i.date.startsWith(month)).length,
      };
    });
  });

  totals = computed(() => ({
    late: this.rows().reduce((s, r) => s + r.late, 0),
    absent: this.rows().reduce((s, r) => s + r.absent, 0),
    leave: this.rows().reduce((s, r) => s + r.leave, 0),
    incidents: this.rows().reduce((s, r) => s + r.incidents, 0),
  }));

  print() {
    window.print();
  }

  exportCsv() {
    const header = ['Employee', 'Department', 'Days Present', 'Late', 'Absent', 'Leave Days', 'Hours Worked', 'Incidents'];
    const lines = this.rows().map((r) =>
      [r.name, r.department, r.present, r.late, r.absent, r.leave, r.hours, r.incidents]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-report-${this.month()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
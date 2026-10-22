import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmployeeService } from './employee-service';
import { Employee, AttendanceRecord } from './models';

interface DayCell {
  day: number;
  date: string;
  count: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <h1>Dashboard</h1>

    <div class="cards">
      <div class="card"><span>Total Employees</span><strong>{{ total() }}</strong></div>
      <div class="card"><span>Active</span><strong>{{ active() }}</strong></div>
      <a class="card card-link" routerLink="/leaves"><span>On Leave</span><strong>{{ onLeave() }}</strong></a>
      <div class="card"><span>Present Today</span><strong>{{ presentToday() }}</strong></div>
    </div>

    <div class="dashboard-grid">
      <!-- Calendar -->
      <section class="panel calendar">
        <div class="calendar-header">
          <button class="btn small" (click)="prevMonth()" aria-label="Previous month">‹</button>
          <strong>{{ monthLabel() }}</strong>
          <button class="btn small" (click)="nextMonth()" aria-label="Next month">›</button>
        </div>

        <div class="calendar-grid weekdays">
          @for (w of weekdays; track w) {
            <span>{{ w }}</span>
          }
        </div>

        <div class="calendar-grid">
          @for (c of cells(); track $index) {
            @if (c) {
              <button
                class="day"
                [class.selected]="c.date === selected()"
                [class.today]="c.date === svc.today()"
                (click)="selected.set(c.date)"
              >
                <span>{{ c.day }}</span>
                @if (c.count > 0) {
                  <small class="day-count">{{ c.count }}</small>
                }
              </button>
            } @else {
              <span class="day blank"></span>
            }
          }
        </div>

        <button class="btn small today-btn" (click)="goToday()">Go to today</button>
        <p class="muted legend">The number on each day is how many employees clocked in.</p>
      </section>

      <!-- Time in / out for selected day -->
      <section class="panel table-wrap">
        <div class="table-title">
          <strong>Time In / Time Out</strong>
          <span class="muted">{{ selectedLabel() }}</span>
        </div>
        <table>
          <thead>
            <tr><th>Employee</th><th>Time In</th><th>Time Out</th><th>Status</th></tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.emp.id) {
              <tr>
                <td>{{ r.emp.name }}<br /><small class="muted">{{ r.emp.department }}</small></td>
                <td>{{ r.rec?.timeIn ?? '—' }}</td>
                <td>{{ r.rec?.timeOut ?? '—' }}</td>
                <td><span class="badge" [class]="'badge ' + statusOf(r.rec).css">{{ statusOf(r.rec).label }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty">No employees yet.</td></tr>
            }
          </tbody>
        </table>
      </section>
    </div>

    <h2>Employees by Department</h2>
    <div class="panel">
      @for (d of departments(); track d.name) {
        <div class="bar-row">
          <span class="bar-label">{{ d.name }}</span>
          <div class="bar"><div class="bar-fill" [style.width.%]="d.percent"></div></div>
          <span>{{ d.count }}</span>
        </div>
      }
    </div>
  `,
})
export class Dashboard {
  svc = inject(EmployeeService);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** First day of the month being displayed */
  month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selected = signal(this.svc.today());

  // --- Summary cards ---
  total = computed(() => this.svc.employees().length);
  active = computed(() => this.svc.employees().filter((e) => e.status === 'Active').length);
  onLeave = computed(() => this.svc.employees().filter((e) => e.status === 'On Leave').length);
  presentToday = computed(
    () => this.svc.attendance().filter((r) => r.date === this.svc.today()).length
  );

  // --- Calendar ---
  monthLabel = computed(() =>
    this.month().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  cells = computed<(DayCell | null)[]>(() => {
    const first = this.month();
    const y = first.getFullYear();
    const m = first.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const counts = new Map<string, number>();
    for (const r of this.svc.attendance()) {
      counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
    }

    const result: (DayCell | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) result.push(null); // leading blanks
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ day: d, date, count: counts.get(date) ?? 0 });
    }
    return result;
  });

  prevMonth() {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  nextMonth() {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  goToday() {
    const t = new Date();
    this.month.set(new Date(t.getFullYear(), t.getMonth(), 1));
    this.selected.set(this.svc.today());
  }

  // --- Time in / out table ---
  selectedLabel = computed(() =>
    new Date(this.selected() + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  );

  rows = computed(() =>
    this.svc.employees().map((emp: Employee) => ({
      emp,
      rec: this.svc.recordOn(emp.id, this.selected()),
    }))
  );

  statusOf(rec?: AttendanceRecord): { label: string; css: string } {
    if (rec?.timeOut) return { label: 'Completed', css: 'present' };
    if (rec) return { label: 'Working', css: 'working' };
    if (this.selected() > this.svc.today()) return { label: '—', css: 'inactive' };
    return { label: 'Absent', css: 'absent' };
  }

  // --- Department chart ---
  departments = computed(() => {
    const counts: Record<string, number> = {};
    for (const e of this.svc.employees()) {
      counts[e.department] = (counts[e.department] ?? 0) + 1;
    }
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: (count / max) * 100,
    }));
  });
}
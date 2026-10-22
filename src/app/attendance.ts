import { Component, inject } from '@angular/core';
import { EmployeeService } from './employee-service';

@Component({
  selector: 'app-attendance',
  template: `
    <h1>Attendance</h1>
    <p class="muted">Today: {{ svc.today() }}</p>

    <div class="panel table-wrap">
      <table>
        <thead>
          <tr><th>Employee</th><th>Department</th><th>Time In</th><th>Time Out</th><th></th></tr>
        </thead>
        <tbody>
          @for (e of svc.employees(); track e.id) {
            @let rec = svc.recordFor(e.id);
            <tr>
              <td>{{ e.name }}</td>
              <td>{{ e.department }}</td>
              <td>{{ rec?.timeIn ?? '—' }}</td>
              <td>{{ rec?.timeOut ?? '—' }}</td>
              <td class="row-actions">
                @if (!rec) {
                  <button class="btn small primary" (click)="svc.clockIn(e.id)">Clock In</button>
                } @else if (!rec.timeOut) {
                  <button class="btn small" (click)="svc.clockOut(e.id)">Clock Out</button>
                } @else {
                  <span class="muted">Done</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class Attendance {
  svc = inject(EmployeeService);
}
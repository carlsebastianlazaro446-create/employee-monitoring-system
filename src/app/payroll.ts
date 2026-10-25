import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from './employee-service';
import { computePay, getPeriod } from './payroll-calc';

@Component({
  selector: 'app-payroll',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div [class.payslip-only]="payslipOnly()">
      <div class="register">
        <div class="page-header">
          <h1>Payroll</h1>
          <div class="header-actions no-print">
            <button class="btn" (click)="print()">🖨 Print register</button>
            @if (paid()) {
              <span class="badge approved">Paid</span>
            } @else {
              <button class="btn success" (click)="markPaid()">Mark as paid</button>
            }
          </div>
        </div>

        <div class="toolbar no-print">
          <label class="inline-label">Month <input type="month" [(ngModel)]="month" /></label>
          <div class="tabs">
            <button class="tab" [class.active]="half() === 1" (click)="half.set(1)">1st – 15th</button>
            <button class="tab" [class.active]="half() === 2" (click)="half.set(2)">16th – End of month</button>
          </div>
        </div>

        <div class="panel period-info">
          <div><span class="muted">Pay period</span><strong>{{ period().label }}</strong></div>
          <div><span class="muted">Cut-off date</span><strong>{{ period().cutOff }}</strong></div>
          <div><span class="muted">Pay date</span><strong>{{ period().payDate }}</strong></div>
          <div>
            <span class="muted">Status</span>
            <span class="badge" [class]="paid() ? 'badge approved' : 'badge pending'">{{ paid() ? 'Paid' : 'Not yet paid' }}</span>
          </div>
        </div>

        <div class="cards">
          <div class="card"><span>Employees Paid</span><strong>{{ rows().length }}</strong></div>
          <div class="card"><span>Gross Pay</span><strong>{{ totals().gross | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></div>
          <div class="card"><span>Deductions</span><strong>{{ totals().totalDeductions | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></div>
          <div class="card"><span>Net Pay</span><strong>{{ totals().net | currency: 'PHP' : 'symbol-narrow' : '1.0-0' }}</strong></div>
        </div>

        <div class="panel table-wrap" style="margin-top: 16px">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Monthly salary</th>
                <th class="num">Gross pay</th>
                <th class="num">SSS</th>
                <th class="num">PhilHealth</th>
                <th class="num">Pag-IBIG</th>
                <th class="num">Tax</th>
                <th class="num">Net pay</th>
                <th class="no-print"></th>
              </tr>
            </thead>
            <tbody>
              @for (r of rows(); track r.emp.id) {
                <tr>
                  <td>{{ r.emp.name }}<br /><small class="muted">{{ r.emp.position }}</small></td>
                  <td>
                    <input class="salary" type="number" min="0" step="500"
                      [value]="r.monthly" [disabled]="paid()"
                      (change)="setSalary(r.emp.id, $event)" />
                  </td>
                  <td class="num">{{ r.gross | currency: 'PHP' : 'symbol-narrow' }}</td>
                  <td class="num">{{ r.sss | currency: 'PHP' : 'symbol-narrow' }}</td>
                  <td class="num">{{ r.philhealth | currency: 'PHP' : 'symbol-narrow' }}</td>
                  <td class="num">{{ r.pagibig | currency: 'PHP' : 'symbol-narrow' }}</td>
                  <td class="num">{{ r.tax | currency: 'PHP' : 'symbol-narrow' }}</td>
                  <td class="num"><strong>{{ r.net | currency: 'PHP' : 'symbol-narrow' }}</strong></td>
                  <td class="no-print"><button class="btn small" (click)="slipId.set(r.emp.id)">Payslip</button></td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty">No employees to pay.</td></tr>
              }
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td></td>
                <td class="num">{{ totals().gross | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="num">{{ totals().sss | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="num">{{ totals().philhealth | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="num">{{ totals().pagibig | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="num">{{ totals().tax | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="num">{{ totals().net | currency: 'PHP' : 'symbol-narrow' }}</td>
                <td class="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p class="muted">
          Each cut-off pays half of the monthly salary and deducts half of the monthly SSS, PhilHealth,
          Pag-IBIG and withholding tax. Inactive employees are not included.
        </p>
      </div>

      @if (slip(); as s) {
        <section class="panel payslip-panel">
          <div class="slip-head">
            <div>
              <h2>Payslip</h2>
              <p class="muted">{{ period().label }} · Pay date {{ period().payDate }}</p>
            </div>
            <div class="header-actions no-print">
              <button class="btn" (click)="printPayslip()">🖨 Print payslip</button>
              <button class="btn" (click)="slipId.set(0)">Close</button>
            </div>
          </div>

          <p><strong>{{ s.emp.name }}</strong> · {{ s.emp.position }}, {{ s.emp.department }}</p>

          <div class="slip-row"><span>Basic pay (this cut-off)</span><span>{{ s.gross | currency: 'PHP' : 'symbol-narrow' }}</span></div>

          <div class="slip-row head"><span>Deductions</span></div>
          <div class="slip-row"><span>SSS</span><span>{{ s.sss | currency: 'PHP' : 'symbol-narrow' }}</span></div>
          <div class="slip-row"><span>PhilHealth</span><span>{{ s.philhealth | currency: 'PHP' : 'symbol-narrow' }}</span></div>
          <div class="slip-row"><span>Pag-IBIG</span><span>{{ s.pagibig | currency: 'PHP' : 'symbol-narrow' }}</span></div>
          <div class="slip-row"><span>Withholding tax</span><span>{{ s.tax | currency: 'PHP' : 'symbol-narrow' }}</span></div>
          <div class="slip-row total"><span>Total deductions</span><span>{{ s.totalDeductions | currency: 'PHP' : 'symbol-narrow' }}</span></div>

          <div class="slip-row net"><span>Net pay</span><span>{{ s.net | currency: 'PHP' : 'symbol-narrow' }}</span></div>
        </section>
      }
    </div>
  `,
})
export class Payroll {
  svc = inject(EmployeeService);

  month = signal(this.svc.today().slice(0, 7));
  half = signal<1 | 2>(new Date().getDate() <= 15 ? 1 : 2);
  slipId = signal(0);
  payslipOnly = signal(false);

  period = computed(() => getPeriod(this.month() || this.svc.today().slice(0, 7), this.half()));
  paid = computed(() => this.svc.paidRuns().includes(this.period().key));

  rows = computed(() =>
    this.svc
      .employees()
      .filter((e) => e.status !== 'Inactive')
      .map((emp) => {
        const monthly = this.svc.salaries()[emp.id] ?? 0;
        return { emp, monthly, ...computePay(monthly) };
      })
  );

  totals = computed(() => {
    const t = { gross: 0, sss: 0, philhealth: 0, pagibig: 0, tax: 0, totalDeductions: 0, net: 0 };
    for (const r of this.rows()) {
      t.gross += r.gross;
      t.sss += r.sss;
      t.philhealth += r.philhealth;
      t.pagibig += r.pagibig;
      t.tax += r.tax;
      t.totalDeductions += r.totalDeductions;
      t.net += r.net;
    }
    return t;
  });

  slip = computed(() => this.rows().find((r) => r.emp.id === this.slipId()) ?? null);

  setSalary(id: number, ev: Event) {
    const value = Number((ev.target as HTMLInputElement).value);
    this.svc.setSalary(id, Number.isFinite(value) && value > 0 ? value : 0);
  }

  markPaid() {
    if (confirm(`Mark ${this.period().label} as paid?`)) this.svc.markRunPaid(this.period().key);
  }

  print() {
    window.print();
  }

  /** Hides the payroll table while printing so only the payslip is on the page. */
  printPayslip() {
    this.payslipOnly.set(true);
    setTimeout(() => {
      window.print();
      this.payslipOnly.set(false);
    }, 50);
  }
}
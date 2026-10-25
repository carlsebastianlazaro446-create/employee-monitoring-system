/** Days after the cut-off date that employees receive their pay.
 *  5 means: 15th cut-off -> paid on the 20th, 30th cut-off -> paid on the 5th. Use 0 to pay on the cut-off date. */
export const PAY_LAG_DAYS = 5;

const round2 = (n: number) => Math.round(n * 100) / 100;
const half = (n: number) => round2(n / 2);

// ---- Monthly employee contributions (2026 rates) ----

export function sssEmployee(monthly: number): number {
  if (monthly <= 0) return 0;
  const msc = Math.min(35000, Math.max(5000, Math.round(monthly / 500) * 500));
  return msc * 0.05;
}

export function philhealthEmployee(monthly: number): number {
  if (monthly <= 0) return 0;
  return Math.min(100000, Math.max(10000, monthly)) * 0.025;
}

export function pagibigEmployee(monthly: number): number {
  if (monthly <= 0) return 0;
  return Math.min(monthly, 10000) * 0.02;
}

/** TRAIN-law monthly withholding tax on taxable compensation. */
export function withholdingTaxMonthly(taxable: number): number {
  if (taxable <= 20833) return 0;
  if (taxable < 33333) return (taxable - 20833) * 0.15;
  if (taxable < 66667) return 1875 + (taxable - 33333) * 0.2;
  if (taxable < 166667) return 8541.8 + (taxable - 66667) * 0.25;
  if (taxable < 666667) return 33541.8 + (taxable - 166667) * 0.3;
  return 183541.8 + (taxable - 666667) * 0.35;
}

// ---- Pay for ONE cut-off (half of the month) ----

export function computePay(monthlySalary: number) {
  const sss = sssEmployee(monthlySalary);
  const philhealth = philhealthEmployee(monthlySalary);
  const pagibig = pagibigEmployee(monthlySalary);
  const tax = withholdingTaxMonthly(Math.max(0, monthlySalary - sss - philhealth - pagibig));

  const gross = half(monthlySalary);
  const d = { sss: half(sss), philhealth: half(philhealth), pagibig: half(pagibig), tax: half(tax) };
  const totalDeductions = round2(d.sss + d.philhealth + d.pagibig + d.tax);

  return { gross, ...d, totalDeductions, net: round2(gross - totalDeductions) };
}

// ---- Pay periods ----

export interface PayPeriod {
  key: string;      // e.g. '2026-10-2'
  label: string;    // 'Oct 16 – Oct 31, 2026'
  cutOff: string;   // 'Oct 30, 2026'
  payDate: string;  // 'Nov 4, 2026'
}

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** half 1 = 1st to 15th (cut-off 15th). half 2 = 16th to end of month (cut-off 30th, or last day in February). */
export function getPeriod(month: string, half: 1 | 2): PayPeriod {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();

  const start = new Date(y, m - 1, half === 1 ? 1 : 16);
  const end = new Date(y, m - 1, half === 1 ? 15 : lastDay);
  const cutOffDay = half === 1 ? 15 : Math.min(30, lastDay);
  const cutOff = new Date(y, m - 1, cutOffDay);
  const payDate = new Date(y, m - 1, cutOffDay + PAY_LAG_DAYS); // overflows into next month correctly

  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return {
    key: `${month}-${half}`,
    label: `${short(start)} – ${fmt(end)}`,
    cutOff: fmt(cutOff),
    payDate: fmt(payDate),
  };
}


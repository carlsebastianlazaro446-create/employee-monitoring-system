import { Injectable, signal } from '@angular/core';
import {
  AttendanceRecord,
  DocCategory,
  Employee,
  EmployeeDetails,
  EmployeeDocument,
  IncidentReport,
  IncidentStatus,
  LeaveRequest,
  LeaveStatus,
} from './models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private nextId = 6;

  private _employees = signal<Employee[]>([
    { id: 1, name: 'Maria Santos', email: 'maria@company.com', department: 'HR', position: 'HR Manager', status: 'Active' },
    { id: 2, name: 'John Reyes', email: 'john@company.com', department: 'IT', position: 'Developer', status: 'Active' },
    { id: 3, name: 'Ana Cruz', email: 'ana@company.com', department: 'Finance', position: 'Accountant', status: 'On Leave' },
    { id: 4, name: 'Mark Lim', email: 'mark@company.com', department: 'IT', position: 'System Admin', status: 'Active' },
    { id: 5, name: 'Sofia Garcia', email: 'sofia@company.com', department: 'Sales', position: 'Sales Lead', status: 'Inactive' },
  ]);

  private _details = signal<Record<number, EmployeeDetails>>(this.seedDetails());
  private _attendance = signal<AttendanceRecord[]>(this.seedAttendance());
   
  private nextLeaveId = 5;
  private _leaves = signal<LeaveRequest[]>(this.seedLeaves());
  readonly leaves = this._leaves.asReadonly();

  private nextIncidentId = 4;
  private _incidents = signal<IncidentReport[]>(this.seedIncidents());
  readonly incidents = this._incidents.asReadonly();

  // Documents
  private nextDocId = 1;
  private _documents = signal<EmployeeDocument[]>([]);
  readonly documents = this._documents.asReadonly();

  // Payroll: monthly salary per employee id, and which pay periods are marked paid
  private _salaries = signal<Record<number, number>>({ 1: 45000, 2: 38000, 3: 32000, 4: 35000, 5: 28000 });
  readonly salaries = this._salaries.asReadonly();
  private _paidRuns = signal<string[]>([]);
  readonly paidRuns = this._paidRuns.asReadonly();


  readonly employees = this._employees.asReadonly();
  readonly attendance = this._attendance.asReadonly();

   
  
  today(): string {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD (local time)
  }

  private now(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  add(data: Omit<Employee, 'id'>) {
    this._employees.update((list) => [...list, { ...data, id: this.nextId++ }]);
  }

  update(emp: Employee) {
    this._employees.update((list) => list.map((e) => (e.id === emp.id ? emp : e)));
  }

  detailsOf(id: number): EmployeeDetails {
    return this._details()[id] ?? this.blankDetails(id);
  }

  saveDetails(details: EmployeeDetails) {
    this._details.update((current) => ({ ...current, [details.employeeId]: details }));
  }

  private blankDetails(id: number): EmployeeDetails {
    return {
      employeeId: id,
      hireDate: '',
      phone: '',
      birthDate: '',
      gender: '',
      civilStatus: '',
      address: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      sssNo: '',
      philhealthNo: '',
      pagibigNo: '',
      tin: '',
      photo: null,
    };
  }

  /** Sample details so the page isn't empty. Delete when you add a backend. */
  private seedDetails(): Record<number, EmployeeDetails> {
    const makeDetails = (id: number, hireDate: string, phone: string): EmployeeDetails => ({
      ...this.blankDetails(id),
      hireDate,
      phone,
    });
    return {
      1: makeDetails(1, '2021-02-15', '0917 123 4567'),
      2: makeDetails(2, '2022-06-01', '0918 234 5678'),
      3: makeDetails(3, '2020-09-21', '0919 345 6789'),
      4: makeDetails(4, '2023-01-09', '0920 456 7890'),
      5: makeDetails(5, '2019-11-04', '0921 567 8901'),
    };
  }

  remove(id: number) {
    this._employees.update((list) => list.filter((e) => e.id !== id));
    this._attendance.update((list) => list.filter((r) => r.employeeId !== id));
    this._leaves.update((list) => list.filter((l) => l.employeeId !== id));
    this._incidents.update((list) => list.filter((i) => i.employeeId !== id));
    this._details.update((details) => {
      const copy = { ...details };
      delete copy[id];
      return copy;
    });
    this._documents().filter((d) => d.employeeId === id).forEach((d) => URL.revokeObjectURL(d.url));
    this._documents.update((list) => list.filter((d) => d.employeeId !== id));
  }

    recordOn(employeeId: number, date: string): AttendanceRecord | undefined {
    return this._attendance().find((r) => r.employeeId === employeeId && r.date === date);
  }

    addLeave(data: Omit<LeaveRequest, 'id' | 'status' | 'requestedOn'>) {
      this._leaves.update((list) => [
        { ...data, id: this.nextLeaveId++, status: 'Pending', requestedOn: this.today() },
        ...list,
      ]);
    }

    setLeaveStatus(id: number, status: LeaveStatus) {
      this._leaves.update((list) => list.map((leave) => (leave.id === id ? { ...leave, status } : leave)));
    }

    addIncident(data: Omit<IncidentReport, 'id' | 'status' | 'actionTaken'>) {
      this._incidents.update((list) => [
        { ...data, id: this.nextIncidentId++, status: 'Open', actionTaken: '' },
        ...list,
      ]);
    }

    setIncidentStatus(id: number, status: IncidentStatus, actionTaken?: string) {
      this._incidents.update((list) =>
        list.map((i) =>
          i.id === id ? { ...i, status, actionTaken: actionTaken ?? i.actionTaken } : i
        )
      );
    }

    removeIncident(id: number) {
      this._incidents.update((list) => list.filter((i) => i.id !== id));
    }

    addDocument(employeeId: number, category: DocCategory, file: File) {
      this._documents.update((list) => [
        {
          id: this.nextDocId++,
          employeeId,
          category,
          fileName: file.name,
          size: file.size,
          uploadedOn: this.today(),
          url: URL.createObjectURL(file),
        },
        ...list,
      ]);
    }

    removeDocument(id: number) {
      const doc = this._documents().find((d) => d.id === id);
      if (doc) URL.revokeObjectURL(doc.url);
      this._documents.update((list) => list.filter((d) => d.id !== id));
    }

    setSalary(employeeId: number, amount: number) {
      this._salaries.update((s) => ({ ...s, [employeeId]: amount }));
    }

    markRunPaid(key: string) {
      this._paidRuns.update((list) => (list.includes(key) ? list : [...list, key]));
    }
    
    



    private offsetDate(days: number): string {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days).toLocaleDateString('en-CA');
    }

    /** Sample requests. Delete when you add a backend. */
    private seedLeaves(): LeaveRequest[] {
      return [
        { id: 1, employeeId: 2, type: 'Vacation', startDate: this.offsetDate(5), endDate: this.offsetDate(9), reason: 'Family trip', status: 'Pending', requestedOn: this.offsetDate(-2) },
        { id: 2, employeeId: 4, type: 'Sick', startDate: this.offsetDate(1), endDate: this.offsetDate(2), reason: 'Flu and fever', status: 'Pending', requestedOn: this.offsetDate(-1) },
        { id: 3, employeeId: 3, type: 'Vacation', startDate: this.offsetDate(-3), endDate: this.offsetDate(4), reason: 'Out of town', status: 'Approved', requestedOn: this.offsetDate(-14) },
        { id: 4, employeeId: 1, type: 'Other', startDate: this.offsetDate(10), endDate: this.offsetDate(10), reason: 'Personal errand', status: 'Rejected', requestedOn: this.offsetDate(-5) },
      ];
    }

    /** Sample incidents. Delete when you add a backend. */
    private seedIncidents(): IncidentReport[] {
      return [
        { id: 1, employeeId: 2, type: 'Equipment', severity: 'Low', date: this.offsetDate(-2), location: 'IT Room', description: 'Laptop charger overheated and was replaced.', reportedBy: 'Mark Lim', status: 'Resolved', actionTaken: 'Charger replaced, old unit disposed.' },
        { id: 2, employeeId: 4, type: 'Safety', severity: 'High', date: this.offsetDate(-1), location: 'Server Room', description: 'Water leak near the server rack.', reportedBy: 'Maria Santos', status: 'Investigating', actionTaken: '' },
        { id: 3, employeeId: 5, type: 'Misconduct', severity: 'Medium', date: this.offsetDate(-6), location: 'Sales Floor', description: 'Repeated disregard of dress code after a warning.', reportedBy: 'Maria Santos', status: 'Open', actionTaken: '' },
      ];
    }

    /** Sample history for the last 30 days (weekdays only). Delete when you add a backend. */
    private seedAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();

    for (let back = 1; back <= 30; back++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const date = d.toLocaleDateString('en-CA');

      for (const e of this._employees()) {
        if (e.status !== 'Active') continue;
        if ((e.id * 7 + back * 3) % 11 === 0) continue; // occasional absence
        const inMin = 8 * 60 + 45 + ((e.id * 13 + back * 7) % 40);
        const outMin = 17 * 60 + ((e.id * 11 + back * 5) % 60);
        records.push({ employeeId: e.id, date, timeIn: this.fmt(inMin), timeOut: this.fmt(outMin) });
      }
    }
    return records;
  }

  private fmt(totalMinutes: number): string {
    const h24 = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const h = h24 % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
  }
  recordFor(employeeId: number): AttendanceRecord | undefined {
    return this._attendance().find((r) => r.employeeId === employeeId && r.date === this.today());
  }

  clockIn(employeeId: number) {
    if (this.recordFor(employeeId)) return;
    this._attendance.update((list) => [
      ...list,
      { employeeId, date: this.today(), timeIn: this.now(), timeOut: null },
    ]);
  }

  clockOut(employeeId: number) {
    this._attendance.update((list) =>
      list.map((r) =>
        r.employeeId === employeeId && r.date === this.today() && !r.timeOut
          ? { ...r, timeOut: this.now() }
          : r
      )
    );
  }
}
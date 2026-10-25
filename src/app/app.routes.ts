import { Routes } from '@angular/router';
import { Dashboard } from './dashboard';
import { Employees } from './employees';
import { Attendance } from './attendance';
import { Leaves } from './leaves';
import { Incidents } from './incidents';
import { Reports } from './reports';
import { Documents } from './documents';
import { Payroll } from './payroll';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'employees', component: Employees },
  { path: 'attendance', component: Attendance },
  { path: 'leaves', component: Leaves },
  { path: 'reports', component: Reports },
  { path: 'incidents', component: Incidents },
  { path: 'documents', component: Documents },
  { path: 'payroll', component: Payroll },
  { path: '**', redirectTo: '' },
];
import { Routes } from '@angular/router';
import { Dashboard } from './dashboard';
import { Employees } from './employees';
import { Attendance } from './attendance';
import { Leaves } from './leaves';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'employees', component: Employees },
  { path: 'attendance', component: Attendance },
  { path: 'leaves', component: Leaves },
  { path: '**', redirectTo: '' },
];
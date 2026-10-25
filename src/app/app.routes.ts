import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth-guards';
import { Role } from './auth-service';

import { Attendance } from './attendance';
import { Dashboard } from './dashboard';
import { Documents } from './documents';
import { EmployeeProfile } from './employee-profile';
import { Employees } from './employees';
import { Incidents } from './incidents';
import { Leaves } from './leaves';
import { Login } from './login';
import { Payroll } from './payroll';
import { Profile } from './profile';
import { Reports } from './reports';
import { Settings } from '../settings';

const STAFF: Role[] = ['Administrator', 'HR'];
const ADMIN: Role[] = ['Administrator'];

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },

  // Everything inside here requires a login. `data.roles` limits who can open each page.
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', component: Dashboard, data: { roles: STAFF } },
      { path: 'employees', component: Employees, data: { roles: STAFF } },
      { path: 'employees/:id', component: EmployeeProfile, data: { roles: STAFF } },
      { path: 'attendance', component: Attendance, data: { roles: STAFF } },
      { path: 'leaves', component: Leaves, data: { roles: STAFF } },
      { path: 'reports', component: Reports, data: { roles: STAFF } },
      { path: 'incidents', component: Incidents, data: { roles: STAFF } },
      { path: 'documents', component: Documents, data: { roles: STAFF } },
      { path: 'payroll', component: Payroll, data: { roles: ADMIN } },
      { path: 'settings', component: Settings, data: { roles: ADMIN } },
      { path: 'profile', component: Profile }, // any signed-in user
    ],
  },

  { path: '**', redirectTo: '' },
];
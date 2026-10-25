export type Status = 'Active' | 'On Leave' | 'Inactive';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Vacation' | 'Sick' | 'Emergency' | 'Other';
export type IncidentType = 'Safety' | 'Misconduct' | 'Equipment' | 'Harassment' | 'Other';
export type IncidentSeverity = 'Low' | 'Medium' | 'High';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved';
export type DocCategory =| 'Contract' | 'Government ID' | 'Resume' | 'Certificate' | 'Medical' | 'Clearance' | 'Other'

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: Status;
}

export type Gender = 'Male' | 'Female' | 'Other' | '';
export type CivilStatus = 'Single' | 'Married' | 'Widowed' | 'Separated' | '';

export interface EmployeeDetails {
  employeeId: number;
  hireDate: string;
  phone: string;
  birthDate: string;
  gender: Gender;
  civilStatus: CivilStatus;
  address: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  sssNo: string;
  philhealthNo: string;
  pagibigNo: string;
  tin: string;
  photo: string | null;
}

export interface AttendanceRecord {
  employeeId: number;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  requestedOn: string;
}

export interface IncidentReport {
  id: number;
  employeeId: number;
  type: IncidentType;
  severity: IncidentSeverity;
  date: string; // YYYY-MM-DD
  location: string;
  description: string;
  reportedBy: string;
  status: IncidentStatus;
  actionTaken: string;
}

export interface EmployeeDocument {
  id: number;
  employeeId: number;
  category: DocCategory;
  fileName: string;
  size: number;       // bytes
  uploadedOn: string; // YYYY-MM-DD
  url: string;        // temporary browser URL (lost on refresh)
}
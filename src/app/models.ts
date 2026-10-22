export type Status = 'Active' | 'On Leave' | 'Inactive';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Vacation' | 'Sick' | 'Emergency' | 'Other';


export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  status: Status;
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
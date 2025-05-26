import { api } from './api';

// Types that match the backend models
export interface AttendanceSettings {
  type: "QR Code" | "Face Recognition" | "Keduanya";
  autoClose: boolean;
  duration: number;
  allowLate: boolean;
  lateThreshold: number;
  notes: string;
}

export interface AttendanceSession {
  id: number;
  courseScheduleId: number;
  courseCode: string;
  courseName: string;
  room: string;
  date: string;
  startTime: string;
  endTime?: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  type: string;
  status: string;
  autoClose: boolean;
  duration: number;
  allowLate: boolean;
  lateThreshold: number;
  notes: string;
  qrCodeUrl?: string;
  totalStudents: number;
  attendedCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  createdAt: string;
}

export interface StudentAttendance {
  id: number;
  attendanceSessionId: number;
  studentId: number;
  studentName: string;
  studentNIM: string;
  status: string;
  checkInTime?: string;
  notes: string;
  verificationMethod: string;
}

export interface AttendanceStatistics {
  totalSessions: number;
  totalStudents: number;
  totalAttendance: number;
  totalLate: number;
  totalAbsent: number;
  totalExcused: number;
  averageAttendance: number;
}

// Create a new attendance session
export async function createAttendanceSession(
  courseScheduleId: number,
  date: string,
  type: string,
  settings: Partial<AttendanceSettings>
): Promise<AttendanceSession> {
  const response = await api<AttendanceSession>('/lecturer/attendance/sessions', {
    method: 'POST',
    body: {
      course_schedule_id: courseScheduleId,
      type: mapAttendanceTypeToApi(type),
      date,
      settings: {
        autoClose: settings.autoClose,
        duration: settings.duration,
        allowLate: settings.allowLate,
        lateThreshold: settings.lateThreshold,
        notes: settings.notes
      }
    }
  });
  
  return mapSessionFromApi(response);
}

// Get active attendance sessions
export async function getActiveAttendanceSessions(): Promise<AttendanceSession[]> {
  const response = await api<any>('/lecturer/attendance/sessions/active');
  // Handle different response formats
  const data = Array.isArray(response) ? response : response?.data || response?.sessions || [];
  return data.map(mapSessionFromApi);
}

// Get all attendance sessions with optional date range
export async function getAttendanceSessions(
  startDate?: string,
  endDate?: string
): Promise<AttendanceSession[]> {
  let endpoint = '/lecturer/attendance/sessions';
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    endpoint += `?${params.toString()}`;
  }
  
  const response = await api<any>(endpoint);
  // Handle different response formats
  const data = Array.isArray(response) ? response : response?.data || response?.sessions || [];
  return data.map(mapSessionFromApi);
}

// Get details for a specific attendance session
export async function getAttendanceSessionDetails(
  sessionId: number
): Promise<AttendanceSession> {
  const response = await api<any>(`/lecturer/attendance/sessions/${sessionId}`);
  // Handle different response formats
  const sessionData = response?.data || response;
  return mapSessionFromApi(sessionData);
}

// Close an active attendance session
export async function closeAttendanceSession(sessionId: number): Promise<void> {
  await api(`/lecturer/attendance/sessions/${sessionId}/close`, {
    method: 'PUT'
  });
}

// Cancel an active attendance session
export async function cancelAttendanceSession(sessionId: number): Promise<void> {
  await api(`/lecturer/attendance/sessions/${sessionId}/cancel`, {
    method: 'PUT'
  });
}

// Get student attendances for a session
export async function getStudentAttendances(
  sessionId: number
): Promise<StudentAttendance[]> {
  const response = await api<any>(`/lecturer/attendance/sessions/${sessionId}/students`);
  // Handle different response formats
  return Array.isArray(response) ? response : response?.data || response?.attendances || [];
}

// Mark a student's attendance
export async function markStudentAttendance(
  sessionId: number,
  studentId: number,
  status: string,
  notes: string,
  verificationMethod: string
): Promise<void> {
  await api(`/lecturer/attendance/sessions/${sessionId}/students/${studentId}`, {
    method: 'PUT',
    body: {
      status: mapStatusToApi(status),
      notes,
      verification_method: verificationMethod
    }
  });
}

// Get attendance statistics for a course
export async function getAttendanceStatistics(
  courseScheduleId: number
): Promise<AttendanceStatistics> {
  return await api<AttendanceStatistics>(`/lecturer/attendance/statistics/course/${courseScheduleId}`);
}

// Get QR code URL for a session
export function getQRCodeUrl(sessionId: number): string {
  return `/api/lecturer/attendance/qrcode/${sessionId}`;
}

// Helper functions to map between frontend and API format
function mapAttendanceTypeToApi(type: string): string {
  switch (type) {
    case 'QR Code': return 'QR_CODE';
    case 'Face Recognition': return 'FACE_RECOGNITION';
    case 'Manual': return 'MANUAL';
    case 'Keduanya': return 'BOTH';
    default: return type;
  }
}

function mapStatusToApi(status: string): string {
  switch (status) {
    case 'Present': return 'PRESENT';
    case 'Late': return 'LATE';
    case 'Absent': return 'ABSENT';
    case 'Excused': return 'EXCUSED';
    default: return status;
  }
}

function mapSessionFromApi(session: any): AttendanceSession {
  return {
    id: session.id,
    courseScheduleId: session.course_schedule_id,
    courseCode: session.course_code,
    courseName: session.course_name,
    room: session.room,
    date: session.date,
    startTime: session.start_time,
    endTime: session.end_time,
    scheduleStartTime: session.schedule_start_time,
    scheduleEndTime: session.schedule_end_time,
    type: mapTypeFromApi(session.type),
    status: mapStatusFromApi(session.status),
    autoClose: session.auto_close,
    duration: session.duration,
    allowLate: session.allow_late,
    lateThreshold: session.late_threshold,
    notes: session.notes,
    qrCodeUrl: session.qr_code_url,
    totalStudents: session.total_students,
    attendedCount: session.attended_count,
    lateCount: session.late_count,
    absentCount: session.absent_count,
    excusedCount: session.excused_count,
    createdAt: session.created_at
  };
}

function mapTypeFromApi(type: string): string {
  switch (type) {
    case 'QR_CODE': return 'QR Code';
    case 'FACE_RECOGNITION': return 'Face Recognition';
    case 'MANUAL': return 'Manual';
    case 'BOTH': return 'Keduanya';
    default: return type;
  }
}

function mapStatusFromApi(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'active';
    case 'CLOSED': return 'closed';
    case 'CANCELED': return 'canceled';
    default: return status;
  }
} 
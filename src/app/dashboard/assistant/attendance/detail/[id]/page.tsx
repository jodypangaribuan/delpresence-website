"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Users, Filter, Search, Download, BookOpen, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/utils/api";

// Define interfaces for the API data
interface AttendanceSession {
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

interface StudentAttendance {
  id: number;
  studentNIM: string;
  studentName: string;
  status: string;
  checkInTime?: string;
  verificationMethod?: string;
  notes?: string;
}

// Define our interface for raw attendance session data from API
interface AttendanceSessionData {
  id: number;
  course_schedule_id: number;
  course_code: string;
  course_name: string;
  room: string;
  date: string;
  start_time: string;
  end_time?: string;
  schedule_start_time: string;
  schedule_end_time: string;
  type: string;
  status: string;
  auto_close: boolean;
  duration: number;
  allow_late: boolean;
  late_threshold: number;
  notes: string;
  qr_code_url?: string;
  total_students: number;
  attended_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  created_at: string;
}

interface StudentAttendanceData {
  id: number;
  attendance_session_id: number;
  student_id: number;
  student_name: string;
  student_nim: string;
  status: string;
  check_in_time?: string;
  notes?: string;
  verification_method?: string;
}

export default function AttendanceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const sessionId = parseInt(id as string);
  
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [attendances, setAttendances] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || isNaN(sessionId)) return;
      
      setIsLoading(true);
      try {
        // Fetch session details
        const sessionData = await api<AttendanceSessionData>(`/lecturer/attendance/sessions/${sessionId}`);
        setSession(mapSessionFromApi(sessionData));
        
        // Fetch student attendances
        const attendanceData = await api<StudentAttendanceData[]>(`/lecturer/attendance/sessions/${sessionId}/students`);
        setAttendances(attendanceData.map(attendance => ({
          id: attendance.id,
          studentNIM: attendance.student_nim,
          studentName: attendance.student_name,
          status: attendance.status,
          checkInTime: attendance.check_in_time,
          verificationMethod: attendance.verification_method,
          notes: attendance.notes
        })));
      } catch (error) {
        console.error("Error fetching attendance details:", error);
        toast.error("Gagal memuat data presensi");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);

  // Mapping function to ensure consistent format
  const mapSessionFromApi = (session: AttendanceSessionData): AttendanceSession => {
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
  };

  // Map API types to display types
  const mapTypeFromApi = (type: string): string => {
    switch (type) {
      case 'QR_CODE': return 'QR Code';
      case 'FACE_RECOGNITION': return 'Face Recognition';
      case 'BOTH': return 'Keduanya';
      default: return type;
    }
  };

  // Map API status to display status
  const mapStatusFromApi = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'CLOSED': return 'Closed';
      case 'CANCELED': return 'Canceled';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return "bg-green-50 text-green-700 border-green-200";
      case 'late':
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 'absent':
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Filter and search
  const filteredAttendances = attendances.filter(attendance => {
    const matchesSearch = 
      attendance.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendance.studentNIM.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = 
      statusFilter === "all" || 
      attendance.status.toLowerCase() === statusFilter.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const presentCount = attendances.filter(a => a.status.toLowerCase() === 'present').length;
  const lateCount = attendances.filter(a => a.status.toLowerCase() === 'late').length;
  const absentCount = attendances.filter(a => a.status.toLowerCase() === 'absent').length;
  const totalStudents = attendances.length;
  const attendanceRate = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Button 
          variant="outline" 
          className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        
        {!isLoading && session && (
          <Button className="bg-[#0687C9] hover:bg-[#0572aa]">
            <Download className="h-4 w-4 mr-2" />
            Unduh Laporan
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : session ? (
        <>
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0687C9] h-1.5"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-black">Detail Presensi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold">{session.courseCode}: {session.courseName}</h3>
                  <div className="mt-2 text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Mata Kuliah: {session.courseName}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Ruangan: {session.room}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Tanggal: {session.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Waktu: {session.scheduleStartTime} - {session.scheduleEndTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Kehadiran: {presentCount + lateCount} dari {totalStudents} mahasiswa ({attendanceRate.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-green-50 border-green-100">
                    <p className="text-sm text-green-600 font-medium">Hadir</p>
                    <p className="text-2xl font-semibold text-green-700">{presentCount}</p>
                  </Card>
                  <Card className="p-4 bg-yellow-50 border-yellow-100">
                    <p className="text-sm text-yellow-600 font-medium">Terlambat</p>
                    <p className="text-2xl font-semibold text-yellow-700">{lateCount}</p>
                  </Card>
                  <Card className="p-4 bg-red-50 border-red-100">
                    <p className="text-sm text-red-600 font-medium">Tidak Hadir</p>
                    <p className="text-2xl font-semibold text-red-700">{absentCount}</p>
                  </Card>
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#0687C9] h-2.5 rounded-full" 
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0687C9] h-1.5"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-black">Daftar Mahasiswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari mahasiswa..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="present">Hadir</SelectItem>
                    <SelectItem value="late">Terlambat</SelectItem>
                    <SelectItem value="absent">Tidak Hadir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                      <TableHead className="w-[120px] font-bold text-black">NIM</TableHead>
                      <TableHead className="font-bold text-black">Nama Mahasiswa</TableHead>
                      <TableHead className="font-bold text-black">Status</TableHead>
                      <TableHead className="font-bold text-black">Waktu Presensi</TableHead>
                      <TableHead className="font-bold text-black">Metode</TableHead>
                      <TableHead className="font-bold text-black">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map((attendance, index) => (
                      <TableRow key={attendance.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{attendance.studentNIM}</TableCell>
                        <TableCell>{attendance.studentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(attendance.status)}>
                            {attendance.status === 'PRESENT' ? 'Hadir' : 
                             attendance.status === 'LATE' ? 'Terlambat' : 
                             attendance.status === 'ABSENT' ? 'Tidak Hadir' : attendance.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{attendance.checkInTime || '-'}</TableCell>
                        <TableCell>{attendance.verificationMethod || '-'}</TableCell>
                        <TableCell>{attendance.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredAttendances.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="h-10 w-10 text-gray-300 mb-2" />
                            <p>Tidak ada data yang sesuai dengan filter</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#0687C9] h-1.5"></div>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Users className="h-10 w-10 text-gray-300 mb-2" />
              <p>Sesi presensi tidak ditemukan</p>
              <Button 
                variant="outline" 
                className="mt-4 border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" 
                onClick={() => router.back()}
              >
                Kembali ke Daftar Presensi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
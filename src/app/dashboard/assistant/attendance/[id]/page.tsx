"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Users, Filter, Search, Download, BookOpen, MapPin, CheckCircle2, AlertCircle, XCircle, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "@/utils/env";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { api } from "@/utils/api";

// Define interfaces for the API data
interface Schedule {
  id: number;
  course_id: number;
  course_name: string;
  course_code: string;
  day: string;
  start_time: string;
  end_time: string;
  room_name: string;
  building_name: string;
  lecturer_id: number;
  lecturer_name: string;
  student_group_id: number;
  student_group_name: string;
  academic_year_id: number;
  academic_year_name: string;
  capacity: number;
  enrolled: number;
  semester: string;
}

interface AttendanceSession {
  id: number;
  course_schedule_id: number;
  schedule: Schedule;
  start_time: string;
  end_time: string | null;
  attendance_method: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  attendedCount: number;
  totalStudents: number;
}

interface StudentAttendance {
  id: number;
  student: {
    id: number;
    nim: string;
    full_name: string;
  };
  status: string;
  checked_in_at: string | null;
}

export default function AssistantAttendanceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const scheduleId = parseInt(id as string);
  
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [attendances, setAttendances] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qrCode, setQrCode] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState(false);

  // Token for API requests
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;

  // Fetch schedule details
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!scheduleId || isNaN(scheduleId)) {
        router.push('/dashboard/assistant/schedules');
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/assistant/schedules`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.status === 'success' && response.data.data) {
          // Find the schedule with the matching ID
          const matchingSchedule = response.data.data.find((s: any) => s.id === scheduleId);
          if (matchingSchedule) {
            setSchedule(matchingSchedule);
          } else {
            toast.error('Jadwal tidak ditemukan');
            router.push('/dashboard/assistant/schedules');
          }
        }
      } catch (error) {
        console.error('Failed to fetch schedule details:', error);
        toast.error('Gagal memuat detail jadwal');
        router.push('/dashboard/assistant/schedules');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedule();
  }, [scheduleId, router, token]);

  // Fetch attendance sessions
  useEffect(() => {
    const fetchAttendanceSessions = async () => {
      if (!scheduleId || isNaN(scheduleId)) return;
      
      try {
        // Active sessions
        const activeResponse = await axios.get(`${API_URL}/api/assistant/attendance/sessions/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (activeResponse.data.status === 'success' && activeResponse.data.data) {
          const filteredActiveSessions = activeResponse.data.data
            .filter((session: any) => session.course_schedule_id === scheduleId)
            .map((session: any) => ({
              ...session,
              schedule: schedule
            }));
          
          // Get attendance counts for each session
          const processedActive = await Promise.all(
            filteredActiveSessions.map(async (session: any) => {
              try {
                const attendanceResponse = await axios.get(`${API_URL}/api/assistant/attendance/sessions/${session.id}/students`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (attendanceResponse.data.status === 'success') {
                  const attendedCount = attendanceResponse.data.data.filter((a: any) => a.status === 'present').length;
                  const totalStudents = attendanceResponse.data.data.length;
                  return {
                    ...session,
                    attendedCount,
                    totalStudents
                  };
                }
                return session;
              } catch (error) {
                console.error(`Failed to fetch attendance for session ${session.id}:`, error);
                return session;
              }
            })
          );
          
          setActiveSessions(processedActive);
        }
        
        // Past sessions
        const pastResponse = await axios.get(`${API_URL}/api/assistant/attendance/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (pastResponse.data.status === 'success' && pastResponse.data.data) {
          const filteredPastSessions = pastResponse.data.data
            .filter((session: any) => 
              session.course_schedule_id === scheduleId && 
              !session.is_active
            )
            .map((session: any) => ({
              ...session,
              schedule: schedule
            }));
          
          // Get attendance counts for each session
          const processedPast = await Promise.all(
            filteredPastSessions.map(async (session: any) => {
              try {
                const attendanceResponse = await axios.get(`${API_URL}/api/assistant/attendance/sessions/${session.id}/students`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                if (attendanceResponse.data.status === 'success') {
                  const attendedCount = attendanceResponse.data.data.filter((a: any) => a.status === 'present').length;
                  const totalStudents = attendanceResponse.data.data.length;
                  return {
                    ...session,
                    attendedCount,
                    totalStudents
                  };
                }
                return session;
              } catch (error) {
                console.error(`Failed to fetch attendance for session ${session.id}:`, error);
                return session;
              }
            })
          );
          
          setPastSessions(processedPast);
        }
      } catch (error) {
        console.error('Failed to fetch attendance sessions:', error);
        toast.error('Gagal memuat sesi presensi');
      }
    };
    
    if (schedule) {
      fetchAttendanceSessions();
    }
  }, [scheduleId, schedule, token]);

  // View attendance list for a session
  const viewAttendanceList = async (session: AttendanceSession) => {
    setSelectedSession(session);
    setIsLoadingAttendance(true);
    
    try {
      const response = await axios.get(`${API_URL}/api/assistant/attendance/sessions/${session.id}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        setAttendances(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance list:', error);
      toast.error('Gagal memuat daftar hadir');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  // View QR code for an active session
  const viewQRCode = async (session: AttendanceSession) => {
    setSelectedSession(session);
    setShowQRCode(true);
    
    try {
      const response = await axios.get(`${API_URL}/api/lecturer/attendance/qrcode/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success' && response.data.data) {
        setQrCode(response.data.data.qr_code);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      toast.error('Gagal memuat kode QR');
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d MMMM yyyy", { locale: idLocale });
    } catch (error) {
      return dateString;
    }
  };

  // Function to format time
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    
    try {
      // If it's a full ISO date string
      if (timeString.includes('T')) {
        const date = parseISO(timeString);
        return format(date, "HH:mm", { locale: idLocale });
      }
      
      // If it's just a time string (HH:mm:ss)
      return timeString.substring(0, 5);
    } catch (error) {
      return timeString;
    }
  };

  // Filter attendances based on search term and status filter
  const filteredAttendances = attendances.filter(attendance => {
    const matchesSearch = searchTerm === "" || 
      attendance.student?.nim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendance.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || attendance.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // API Calls
  const getAttendanceSessionDetails = async (id: string) => {
    return await api<any>(`/assistant/attendance/sessions/${id}`);
  };

  const getStudentAttendances = async (id: string) => {
    return await api<any>(`/assistant/attendance/sessions/${id}/students`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : schedule ? (
        <>
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-black">Detail Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-semibold text-lg">{schedule.course_code} - {schedule.course_name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">Semester {schedule.semester}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Dosen</p>
                      <p className="text-sm text-muted-foreground">{schedule.lecturer_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Kelas</p>
                      <p className="text-sm text-muted-foreground">{schedule.student_group_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Hari</p>
                      <p className="text-sm text-muted-foreground">{schedule.day}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Waktu</p>
                      <p className="text-sm text-muted-foreground">{schedule.start_time} - {schedule.end_time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Ruangan</p>
                      <p className="text-sm text-muted-foreground">{schedule.room_name}, {schedule.building_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-black">Sesi Presensi Aktif</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                      <TableHead className="font-bold text-black">Tanggal</TableHead>
                      <TableHead className="font-bold text-black">Waktu</TableHead>
                      <TableHead className="font-bold text-black">Metode</TableHead>
                      <TableHead className="font-bold text-black">Kehadiran</TableHead>
                      <TableHead className="w-[180px] text-right font-bold text-black">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.length > 0 ? (
                      activeSessions.map((session, index) => (
                        <TableRow key={session.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{formatDate(session.created_at)}</TableCell>
                          <TableCell>{formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'Berlangsung'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              session.attendance_method === 'qr_code' 
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : session.attendance_method === 'face_recognition'
                                ? "bg-purple-50 text-purple-700 border-purple-200" 
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }>
                              {session.attendance_method === 'qr_code' 
                                ? 'QR Code' 
                                : session.attendance_method === 'face_recognition'
                                ? 'Face Recognition'
                                : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>{session.attendedCount}/{session.totalStudents}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[#0687C9] hover:text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                                onClick={() => {
                                  viewQRCode(session);
                                  setShowQRCode(true);
                                }}
                              >
                                <QrCode className="h-4 w-4 mr-2" />
                                QR Code
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[#0687C9] hover:text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                                onClick={() => viewAttendanceList(session)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Daftar Hadir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                            <p>Tidak ada sesi presensi aktif</p>
                            <p className="text-sm">Dosen akan memulai sesi presensi saat perkuliahan berlangsung</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-black">Riwayat Presensi</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
                    className="pl-10 h-9 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9">
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
            </CardHeader>
            <CardContent className="p-6">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                      <TableHead className="font-bold text-black">Tanggal</TableHead>
                      <TableHead className="font-bold text-black">Waktu</TableHead>
                      <TableHead className="font-bold text-black">Metode</TableHead>
                      <TableHead className="font-bold text-black">Kehadiran</TableHead>
                      <TableHead className="w-[150px] text-right font-bold text-black">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastSessions.length > 0 ? (
                      pastSessions
                        .filter(session => 
                          !searchTerm || 
                          formatDate(session.created_at).toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((session, index) => (
                        <TableRow key={session.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{formatDate(session.created_at)}</TableCell>
                          <TableCell>{formatTime(session.start_time)} - {formatTime(session.end_time || '')}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              session.attendance_method === 'qr_code' 
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : session.attendance_method === 'face_recognition'
                                ? "bg-purple-50 text-purple-700 border-purple-200" 
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }>
                              {session.attendance_method === 'qr_code' 
                                ? 'QR Code' 
                                : session.attendance_method === 'face_recognition'
                                ? 'Face Recognition'
                                : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>{session.attendedCount}/{session.totalStudents}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#0687C9] hover:text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                              onClick={() => viewAttendanceList(session)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Daftar Hadir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                            <p>Tidak ada riwayat presensi</p>
                            <p className="text-sm">Riwayat presensi akan muncul setelah sesi presensi selesai</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* Attendance Detail Card (shows when viewing a session's attendance) */}
          {selectedSession && attendances.length > 0 && (
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-black">Daftar Hadir Mahasiswa</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sesi pada {formatDate(selectedSession.created_at)} • {formatTime(selectedSession.start_time)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                  Tutup
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="bg-green-50 border border-green-100">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Hadir</p>
                          <p className="text-2xl font-bold text-green-600">
                            {attendances.filter(a => a.status === 'present').length}
                          </p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-orange-50 border border-orange-100">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Terlambat</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {attendances.filter(a => a.status === 'late').length}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border border-blue-100">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Izin</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {attendances.filter(a => a.status === 'excused').length}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border border-red-100">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Absen</p>
                          <p className="text-2xl font-bold text-red-600">
                            {attendances.filter(a => a.status === 'absent').length}
                          </p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mahasiswa..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="present">Hadir</SelectItem>
                      <SelectItem value="late">Terlambat</SelectItem>
                      <SelectItem value="absent">Tidak Hadir</SelectItem>
                      <SelectItem value="excused">Izin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                        <TableHead className="font-bold text-black">NIM</TableHead>
                        <TableHead className="font-bold text-black">Nama</TableHead>
                        <TableHead className="font-bold text-black">Status</TableHead>
                        <TableHead className="font-bold text-black">Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances
                        .filter(a => 
                          (statusFilter === 'all' || a.status === statusFilter) &&
                          (!searchTerm || 
                            a.student.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((attendance, index) => (
                        <TableRow key={attendance.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{attendance.student.nim}</TableCell>
                          <TableCell>{attendance.student.full_name}</TableCell>
                          <TableCell>
                            {attendance.status === 'present' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hadir
                              </Badge>
                            )}
                            {attendance.status === 'late' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Terlambat
                              </Badge>
                            )}
                            {attendance.status === 'excused' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Izin
                              </Badge>
                            )}
                            {attendance.status === 'absent' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="h-3 w-3 mr-1" />
                                Tidak Hadir
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {attendance.checked_in_at ? formatTime(attendance.checked_in_at) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* QR Code Modal (shows when viewing QR code) */}
          {showQRCode && qrCode && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">QR Code Presensi</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowQRCode(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex flex-col items-center mb-4">
                  <div className="border p-2 rounded-md mb-4">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  {selectedSession && (
                    <div className="text-center">
                      <h3 className="font-medium">{schedule?.course_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedSession.created_at)} • {formatTime(selectedSession.start_time)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowQRCode(false)}>
                    Tutup
                  </Button>
                  <Button variant="default" onClick={() => {
                    setShowQRCode(false);
                    if (selectedSession) {
                      viewAttendanceList(selectedSession);
                    }
                  }}>
                    <Users className="h-4 w-4 mr-2" />
                    Lihat Kehadiran
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex justify-center py-8">
          <p>Jadwal tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
} 
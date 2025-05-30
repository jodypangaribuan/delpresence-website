"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar, 
  QrCode, 
  Clock, 
  FileText,
  BarChart,
  Filter,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  ExternalLink,
  Timer
} from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import axios from "axios";
import { API_URL } from "@/utils/env";

// AttendanceSession interface
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

interface Schedule {
  id: number;
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  date: string;
  totalStudents: number;
  lecturerName: string;
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

// Direct API functions
const getActiveAttendanceSessions = async (): Promise<AttendanceSession[]> => {
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;
  
  try {
    const response = await axios.get(`${API_URL}/api/assistant/attendance/sessions/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle different response formats
    const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return data.map((session: AttendanceSessionData) => mapSessionFromApi(session));
  } catch (error) {
    console.error('Error fetching active attendance sessions:', error);
    return [];
  }
};

const getAttendanceSessions = async (startDate?: string, endDate?: string): Promise<AttendanceSession[]> => {
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;
  
  let endpoint = `${API_URL}/api/assistant/attendance/sessions`;
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    endpoint += `?${params.toString()}`;
  }
  
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle different response formats
    const data = Array.isArray(response.data) ? response.data : response.data?.data || response.data?.sessions || [];
    return data.map((session: AttendanceSessionData) => mapSessionFromApi(session));
  } catch (error) {
    console.error('Error fetching attendance sessions:', error);
    return [];
  }
};

const getAssistantSchedules = async (): Promise<Schedule[]> => {
  // This endpoint will only return schedules for courses where the current user is assigned as a teaching assistant
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;
  
  try {
    const response = await axios.get(`${API_URL}/api/assistant/schedules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const schedules = response.data?.data || [];
    
    return schedules.map((schedule: any) => ({
      id: schedule.id,
      courseCode: schedule.course?.code || schedule.course_code || "",
      courseName: schedule.course?.name || schedule.course_name || "",
      day: schedule.day || "",
      startTime: schedule.start_time || "",
      endTime: schedule.end_time || "",
      room: schedule.room ? 
        `${schedule.room.name || ""}, ${schedule.room.building?.name || ""}` : 
        `${schedule.room_name || ""}, ${schedule.building_name || ""}`,
      date: schedule.date || "",
      totalStudents: schedule.enrolled || 0,
      lecturerName: schedule.lecturer?.full_name || schedule.lecturer_name || ""
    }));
  } catch (error) {
    console.error('Error fetching assistant schedules:', error);
    return [];
  }
};

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

const mapTypeFromApi = (type: string): string => {
  switch (type) {
    case "QR_CODE": return "QR Code";
    case "FACE_RECOGNITION": return "Face Recognition";
    case "BOTH": return "Keduanya";
    default: return type;
  }
};

const mapStatusFromApi = (status: string): string => {
  switch (status) {
    case "ACTIVE": return "Aktif";
    case "CLOSED": return "Selesai";
    case "PENDING": return "Menunggu";
    default: return status;
  }
};

interface AcademicYear {
  id: number;
  name: string;
}

export default function AssistantAttendancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [pastSessions, setPastSessions] = useState<AttendanceSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(0);

  // Fetch data on component mount
  useEffect(() => {
    // Debug: Check user role from token
    const checkUserRole = async () => {
      try {
        const token = typeof window !== 'undefined' ? 
          localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;
        
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Current user info:', response.data);
        
        // Alert if role is not "Asisten Dosen"
        if (response.data.role !== "Asisten Dosen") {
          console.warn('User role is not "Asisten Dosen":', response.data.role);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    checkUserRole();
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch schedules where the user is assigned as a teaching assistant
        // This endpoint will only return schedules for courses where the user is assigned
        const schedulesData = await getAssistantSchedules();
        setSchedules(schedulesData);

        // If no schedules, no need to fetch sessions
        if (schedulesData.length === 0) {
          setActiveSessions([]);
          setPastSessions([]);
          setIsLoading(false);
          return;
        }

        // Create a map of course IDs that the teaching assistant is assigned to
        const relevantScheduleIds = schedulesData.map(s => s.id);

        // Fetch active sessions
        try {
          const activeSessionsData = await getActiveAttendanceSessions();
          
          // Filter active sessions to only those related to schedules where user is an assistant
          const filteredActiveSessions = activeSessionsData.filter(
            session => relevantScheduleIds.includes(session.courseScheduleId)
          );
          
          setActiveSessions(filteredActiveSessions);
        } catch (error) {
          console.error("Error fetching active sessions:", error);
          setActiveSessions([]);
        }

        // Fetch past sessions
        try {
          const pastSessionsData = await getAttendanceSessions();
          
          // Filter past sessions to only those related to schedules where user is an assistant
          const filteredPastSessions = pastSessionsData.filter(
            session => relevantScheduleIds.includes(session.courseScheduleId) && session.status !== "Aktif"
          );
          
          setPastSessions(filteredPastSessions);
        } catch (error) {
          console.error("Error fetching past sessions:", error);
          setPastSessions([]);
        }

        // Fetch academic years
        await fetchAcademicYears();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data presensi");
        // Set empty states to avoid loading
        setSchedules([]);
        setActiveSessions([]);
        setPastSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up a polling interval to refresh active sessions
    const intervalId = setInterval(() => {
      if (activeTab === "active") {
        const refreshActiveSessions = async () => {
          try {
            const activeSessionsData = await getActiveAttendanceSessions();
            const relevantScheduleIds = schedules.map(s => s.id);
            const filteredActiveSessions = activeSessionsData.filter(
              session => relevantScheduleIds.includes(session.courseScheduleId)
            );
            setActiveSessions(filteredActiveSessions);
          } catch (error) {
            console.error("Error refreshing active sessions:", error);
          }
        };
        refreshActiveSessions();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [activeTab]);

  // Filter schedules based on search term and day filter
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchTerm === "" || 
      schedule.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = dayFilter === "all" || schedule.day.toLowerCase() === dayFilter.toLowerCase();
    
    return matchesSearch && matchesDay;
  });

  // Navigate to attendance detail
  const viewAttendanceDetail = (scheduleId: number) => {
    router.push(`/dashboard/assistant/attendance/${scheduleId}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d MMMM yyyy", { locale: idLocale });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate attendance rate
  const calculateAttendanceRate = (session: AttendanceSession) => {
    if (session.totalStudents === 0) return 0;
    return ((session.attendedCount + session.lateCount) / session.totalStudents) * 100;
  };

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;
      
      const response = await axios.get(`${API_URL}/api/assistant/academic-years`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data?.data) {
        if (response.data.data.length > 0) {
          setAcademicYears(response.data.data);
          // Just use the first year in the list if available
          setSelectedAcademicYear(response.data.data[0].id);
        } else {
          // Handle case when there are no academic years
          console.log('No academic years found');
          setAcademicYears([]);
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      setAcademicYears([]);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Kelola Presensi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Pantau kehadiran mahasiswa di kelas yang Anda bantu</p>
                </div>
                <div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-full md:w-[400px] bg-gray-100">
                      <TabsTrigger 
                        value="upcoming" 
                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                      >
                        Jadwal
                      </TabsTrigger>
                      <TabsTrigger 
                        value="active" 
                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                      >
                        Sesi Aktif
                      </TabsTrigger>
                      <TabsTrigger 
                        value="past" 
                        className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
                      >
                        Riwayat
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="mt-6">
                {activeTab === "upcoming" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                      <div className="relative w-full sm:w-[40%]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari jadwal..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3 items-center">
                        <Select value={dayFilter} onValueChange={setDayFilter}>
                          <SelectTrigger className="w-[240px] h-10">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter Hari" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Hari</SelectItem>
                            <SelectItem value="senin">Senin</SelectItem>
                            <SelectItem value="selasa">Selasa</SelectItem>
                            <SelectItem value="rabu">Rabu</SelectItem>
                            <SelectItem value="kamis">Kamis</SelectItem>
                            <SelectItem value="jumat">Jumat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                              <TableHead className="w-[80px] font-bold text-black">Kode MK</TableHead>
                              <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                              <TableHead className="font-bold text-black">Dosen</TableHead>
                              <TableHead className="font-bold text-black">Hari</TableHead>
                              <TableHead className="font-bold text-black">Jam</TableHead>
                              <TableHead className="font-bold text-black">Ruangan</TableHead>
                              <TableHead className="w-[100px] text-right font-bold text-black">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSchedules.map((schedule, index) => (
                              <TableRow key={schedule.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{schedule.courseCode}</TableCell>
                                <TableCell>{schedule.courseName}</TableCell>
                                <TableCell>{schedule.lecturerName}</TableCell>
                                <TableCell>{schedule.day}</TableCell>
                                <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                                <TableCell>{schedule.room}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-[#0687C9] hover:bg-[#0572aa]"
                                    onClick={() => viewAttendanceDetail(schedule.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Detail
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredSchedules.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center">
                                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                                    <p>Tidak ada jadwal perkuliahan tersedia</p>
                                    <p className="text-sm">Jadwal akan muncul di sini saat tersedia</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "active" && (
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeSessions.length === 0 ? (
                          <div className="text-center py-10 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <Clock className="h-10 w-10 text-gray-300" />
                              <p>Tidak ada sesi presensi aktif</p>
                              <p className="text-sm">Dosen akan memulai sesi presensi saat perkuliahan berlangsung</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {activeSessions.map((session) => (
                              <Card key={session.id} className="border border-gray-200 overflow-hidden mb-4">
                                <div className="bg-[#0687C9] h-1.5"></div>
                                <CardContent className="p-4 sm:p-6">
                                  <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                    <div className="space-y-4">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className="bg-green-50 text-green-700 border-green-200 px-2 py-1"
                                        >
                                          <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span>Aktif</span>
                                          </div>
                                        </Badge>
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            session.type === "QR Code" 
                                              ? "bg-blue-50 text-blue-700 border-blue-200"
                                              : session.type === "Face Recognition"
                                              ? "bg-purple-50 text-purple-700 border-purple-200" 
                                              : "bg-orange-50 text-orange-700 border-orange-200"
                                          }
                                        >
                                          {session.type === "QR Code" && <QrCode className="h-3.5 w-3.5 mr-1" />}
                                          {session.type}
                                        </Badge>
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-lg font-semibold">{session.courseCode}: {session.courseName}</h3>
                                        <p className="text-sm text-muted-foreground">{session.room}</p>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-4 w-4 text-[#0687C9]" />
                                          <span className="text-sm">{formatDate(session.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-4 w-4 text-[#0687C9]" />
                                          <span className="text-sm">{session.scheduleStartTime} - {session.scheduleEndTime}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Timer className="h-4 w-4 text-[#0687C9]" />
                                          <span className="text-sm">{session.duration} menit</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center gap-1.5 text-sm">
                                        <Users className="h-4 w-4 text-[#0687C9]" />
                                        <span>Kehadiran: </span>
                                        <span className="font-medium">{session.attendedCount + session.lateCount}/{session.totalStudents}</span>
                                        <span className="text-muted-foreground">({calculateAttendanceRate(session).toFixed(1)}%)</span>
                                      </div>
                                      
                                      <div className="flex gap-2 mt-auto">
                                        <Button 
                                          variant="outline" 
                                          className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]"
                                          onClick={() => viewAttendanceDetail(session.courseScheduleId)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          Lihat Detail
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === "past" && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                      <div className="relative w-full sm:w-[40%]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari riwayat presensi..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                              <TableHead className="font-bold text-black">Tanggal</TableHead>
                              <TableHead className="w-[80px] font-bold text-black">Kode MK</TableHead>
                              <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                              <TableHead className="font-bold text-black">Tipe Presensi</TableHead>
                              <TableHead className="font-bold text-black">Durasi</TableHead>
                              <TableHead className="font-bold text-black">Kehadiran</TableHead>
                              <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastSessions
                              .filter(session => 
                                !searchTerm || 
                                formatDate(session.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
                                session.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                session.courseName.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((session, index) => (
                              <TableRow key={session.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{formatDate(session.date)}</TableCell>
                                <TableCell className="font-medium">{session.courseCode}</TableCell>
                                <TableCell>{session.courseName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    session.type === "QR Code" 
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : session.type === "Face Recognition"
                                      ? "bg-purple-50 text-purple-700 border-purple-200" 
                                      : "bg-orange-50 text-orange-700 border-orange-200"
                                  }>
                                    {session.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{session.duration} menit</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>{session.attendedCount + session.lateCount}/{session.totalStudents}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({calculateAttendanceRate(session).toFixed(1)}%)
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-[#0687C9] hover:bg-[#E6F3FB] hover:text-[#0687C9]"
                                    onClick={() => viewAttendanceDetail(session.courseScheduleId)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {pastSessions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center">
                                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                    <p>Tidak ada riwayat presensi</p>
                                    <p className="text-sm">Riwayat presensi akan muncul di sini setelah sesi presensi selesai</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
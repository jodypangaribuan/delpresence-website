"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar, 
  QrCode, 
  ScanFace, 
  Clock, 
  Plus, 
  Edit,
  FileText,
  BarChart,
  Filter,
  Search,
  Settings,
  Timer,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer as TimerIcon,
  Sliders
} from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// AttendanceSession and AttendanceSettings interfaces
interface AttendanceSettings {
  type: "QR Code" | "Face Recognition" | "Keduanya";
  autoClose: boolean;
  duration: number;
  allowLate: boolean;
  lateThreshold: number;
  notes: string;
}

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
}

// Modified to match the API format
interface ActiveSession extends AttendanceSession {
  remainingTime?: number; // in seconds
}

interface PastSession extends AttendanceSession {
  // No additional fields needed
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

// Direct API functions to replace attendance-api.ts
const createAttendanceSession = async (
  courseScheduleId: number,
  date: string,
  type: string,
  settings: Partial<{
    autoClose: boolean;
    duration: number;
    allowLate: boolean;
    lateThreshold: number;
    notes: string;
  }>
): Promise<AttendanceSession> => {
  const mappedType = type === "QR Code" ? "QR_CODE" : 
                    type === "Face Recognition" ? "FACE_RECOGNITION" : 
                    type === "Keduanya" ? "BOTH" : "QR_CODE";
  
  // Ensure numeric values are correctly formatted as integers
  const formattedSettings = {
    autoClose: settings.autoClose,
    duration: settings.duration ? Math.floor(settings.duration) : 15,
    allowLate: settings.allowLate,
    lateThreshold: settings.lateThreshold ? Math.floor(settings.lateThreshold) : 10,
    notes: settings.notes
  };
  
  console.log("Sending formatted settings to API:", formattedSettings);
  
  const response = await api<AttendanceSessionData>('/lecturer/attendance/sessions', {
    method: 'POST',
    body: {
      course_schedule_id: courseScheduleId,
      type: mappedType,
      date,
      settings: formattedSettings
    }
  });
  
  return mapSessionFromApi(response);
};

const getActiveAttendanceSessions = async (): Promise<AttendanceSession[]> => {
  const response = await api<any>('/lecturer/attendance/sessions/active');
  // Handle different response formats
  const data = Array.isArray(response) ? response : response?.data || response?.sessions || [];
  return data.map((session: AttendanceSessionData) => mapSessionFromApi(session));
};

const getAttendanceSessions = async (startDate?: string, endDate?: string): Promise<AttendanceSession[]> => {
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
  return data.map((session: AttendanceSessionData) => mapSessionFromApi(session));
};

const getAttendanceSessionDetails = async (sessionId: number): Promise<AttendanceSession> => {
  const response = await api<any>(`/lecturer/attendance/sessions/${sessionId}`);
  // Handle different response formats
  const sessionData = response?.data || response;
  return mapSessionFromApi(sessionData as AttendanceSessionData);
};

const closeAttendanceSession = async (sessionId: number): Promise<void> => {
  await api(`/lecturer/attendance/sessions/${sessionId}/close`, {
    method: 'PUT'
  });
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
    case 'QR_CODE': return 'QR Code';
    case 'FACE_RECOGNITION': return 'Face Recognition';
    case 'BOTH': return 'Keduanya';
    default: return type;
  }
};

const mapStatusFromApi = (status: string): string => {
  switch (status) {
    case 'ACTIVE': return 'active';
    case 'CLOSED': return 'closed';
    case 'CANCELED': return 'canceled';
    default: return status;
  }
};

export default function AttendancePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSettings>({
    type: "QR Code",
    autoClose: true,
    duration: 15,
    allowLate: true,
    lateThreshold: 10,
    notes: ""
  });
  
  // State for QR code modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<AttendanceSession | null>(null);
  
  // QR code cache - moved inside the component
  const qrCodeCache = useMemo(() => new Map<number, string>(), []);
  
  // Function to get or create QR code URL - moved inside the component
  const getQRCodeUrl = (sessionId: number): string => {
    // Check if we already have this QR code in the cache
    if (!qrCodeCache.has(sessionId)) {
      // Create a stable data string that won't change with each render
      const qrData = `delpresence:attendance:${sessionId}`;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      qrCodeCache.set(sessionId, url);
    }
    
    // Return the cached URL
    return qrCodeCache.get(sessionId)!;
  };

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch lecturer schedules
        const response = await api<{status: string, data: any[]}>('lecturer/schedules');
        
        if (response.status === 'success' && response.data) {
          const mappedSchedules = response.data.map((schedule: any) => ({
            id: schedule.id,
            courseCode: schedule.course_code,
            courseName: schedule.course_name,
            day: schedule.day,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            room: `${schedule.room_name} (${schedule.building_name})`,
            date: new Date().toISOString().split('T')[0], // Today's date as default
            totalStudents: schedule.enrolled || 0
          }));
          setSchedules(mappedSchedules);
        } else {
          // Fallback to old method
          const schedulesResponse = await api<any>('/lecturer/schedules');
          const schedulesData = Array.isArray(schedulesResponse) ? schedulesResponse : 
                          schedulesResponse?.data || schedulesResponse?.schedules || [];
          
          // Filter out null or undefined items before mapping
          const validSchedules = schedulesData.filter((schedule: any) => schedule && schedule.id);
          
          const mappedSchedules = validSchedules.map((schedule: any) => ({
            id: schedule.id || 0,
            courseCode: schedule.course?.code || "N/A",
            courseName: schedule.course?.name || "Mata Kuliah Tidak Ditemukan",
            day: schedule.day || "N/A",
            startTime: schedule.start_time || "--:--",
            endTime: schedule.end_time || "--:--",
            room: schedule.room?.name || "N/A",
            date: new Date().toISOString().split('T')[0], // Today's date as default
            totalStudents: schedule.enrolled || 0
          }));
          setSchedules(mappedSchedules);
        }

        // Fetch active sessions
        const activeSessionsResponse = await getActiveAttendanceSessions();
        // Add remainingTime to active sessions
        const activeWithTime = activeSessionsResponse.map(session => {
          const remainingTime = calculateRemainingTime(session);
          return { ...session, remainingTime };
        });
        setActiveSessions(activeWithTime);

        // Fetch past sessions (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const pastSessionsResponse = await getAttendanceSessions(
          thirtyDaysAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        // Filter to only closed or canceled sessions
        const closedSessions = pastSessionsResponse.filter(
          session => session.status === 'closed' || session.status === 'canceled'
        );
        
        setPastSessions(closedSessions);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate remaining time for a session in seconds
  const calculateRemainingTime = (session: AttendanceSession): number => {
    if (session.status !== 'active') return 0;
    
    try {
      // Use createdAt as the definitive start time for the countdown
      if (!session.createdAt) {
        console.warn("Session has no creation time:", session.id);
        return session.duration * 60; // Default to full duration
      }
      
      // Parse the createdAt string to a Date object
      const creationTimeDate = new Date(session.createdAt);
      
      // Validate the parsed date
      if (isNaN(creationTimeDate.getTime())) {
        console.warn("Invalid creation time:", session.createdAt);
        return session.duration * 60; // Default to full duration
      }
      
      // Convert duration from minutes to milliseconds
      const durationMs = session.duration * 60 * 1000;
      
      // Calculate the end time by adding duration to creation time
      const endTime = creationTimeDate.getTime() + durationMs;
      
      // Get the current time (without any adjustments to keep it simpler)
      const now = Date.now();
      
      // Calculate remaining milliseconds
      const remainingMs = endTime - now;
      
      console.log(`Session ${session.id} countdown: ${Math.floor(remainingMs/1000)}s remaining, duration: ${session.duration}m, created: ${creationTimeDate.toLocaleTimeString()}, ends: ${new Date(endTime).toLocaleTimeString()}`);
      
      // Return remaining seconds, minimum 0
      return Math.max(0, Math.floor(remainingMs / 1000));
    } catch (error) {
      console.error("Error calculating remaining time:", error, {
        sessionId: session.id,
        createdAt: session.createdAt,
        duration: session.duration
      });
      // Default to full duration to prevent immediate auto-close
      return session.duration * 60;
    }
  };

  // Update remaining time for active sessions
  useEffect(() => {
    let isComponentMounted = true;
    let countdownTimer: NodeJS.Timeout | null = null;
    
    // Function to update the countdown timer
    const updateCountdown = () => {
      if (!isComponentMounted) return;
      
      setActiveSessions(prev => 
        prev.map(session => {
          if (session.status !== 'active') return session;
          
          // Recalculate remaining time based on creation time and duration
          const newRemainingTime = calculateRemainingTime(session);
          
          // Auto-close sessions if timer has reached zero
          if (newRemainingTime <= 0 && session.autoClose) {
            // End the session on the server
            closeAttendanceSession(session.id).catch(err => 
              console.error("Failed to end session automatically:", err)
            );
            
            // Update local state to show session as closed
            return { ...session, status: 'closed', remainingTime: 0 };
          }
          
          return { ...session, remainingTime: newRemainingTime };
        })
      );
    };
    
    // Function to fetch active sessions and sync with the server
    const fetchActiveSessions = async () => {
      if (!isComponentMounted) return;
      
      try {
        const activeSessionsResponse = await getActiveAttendanceSessions();
        
        // Force an immediate recalculation of remaining time for all sessions
        const activeWithTime = activeSessionsResponse.map(session => {
          const remainingTime = calculateRemainingTime(session);
          return { ...session, remainingTime };
        });
        
        if (isComponentMounted) {
          setActiveSessions(activeWithTime);
        }
      } catch (error) {
        console.error("Error fetching active sessions:", error);
      }
    };
    
    // Set up periodic sync with the server
    const syncWithServer = () => {
      // Immediate sync
      fetchActiveSessions();
      
      // Set up regular sync intervals (every 15 seconds)
      const syncInterval = setInterval(() => {
        fetchActiveSessions();
      }, 15000);
      
      // Start the countdown timer immediately
      countdownTimer = setInterval(updateCountdown, 1000);
      
      return () => {
        clearInterval(syncInterval);
        if (countdownTimer) clearInterval(countdownTimer);
      };
    };
    
    // Start server sync and countdown timer
    const cleanup = syncWithServer();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (countdownTimer) clearInterval(countdownTimer);
      cleanup();
    };
  }, []);

  // Open settings dialog for starting attendance
  const openSettingsDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setAttendanceSettings({
      type: "QR Code",
      autoClose: true,
      duration: 15,
      allowLate: true,
      lateThreshold: 10,
      notes: ""
    });
    setShowSettingsDialog(true);
  };

  // Function to start a new attendance session with advanced settings
  const startAttendanceSession = async () => {
    if (!selectedSchedule) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      console.log("Creating new attendance session with settings:", {
        scheduleId: selectedSchedule.id,
        date: today,
        type: attendanceSettings.type,
        settings: attendanceSettings
      });
      
      const newSession = await createAttendanceSession(
        selectedSchedule.id,
        today,
        attendanceSettings.type,
        attendanceSettings
      );
      
      console.log("New session created:", newSession);
      
      // Calculate the actual remaining time based on creation time
      const actualRemainingTime = calculateRemainingTime(newSession);
      
      // Add the remaining time property for proper display
      const sessionWithTime: ActiveSession = {
        ...newSession,
        remainingTime: actualRemainingTime
      };
      
      console.log("Session with calculated time:", {
        sessionId: sessionWithTime.id,
        createdAt: sessionWithTime.createdAt,
        remainingTime: sessionWithTime.remainingTime,
        duration: sessionWithTime.duration
      });
      
      setActiveSessions(prev => [...prev, sessionWithTime]);
      setShowSettingsDialog(false);
      setActiveTab("active");
      toast.success("Sesi presensi berhasil dimulai");
    } catch (error) {
      console.error("Error starting attendance session:", error);
      toast.error("Gagal memulai sesi presensi");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to end an active attendance session
  const endAttendanceSession = async (sessionId: number) => {
    try {
      setIsLoading(true);
      await closeAttendanceSession(sessionId);
      
      // Get updated session details
      const updatedSession = await getAttendanceSessionDetails(sessionId);
      
      // Move from active to past sessions
      setPastSessions([updatedSession, ...pastSessions]);
      setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
      
      toast.success("Sesi presensi berhasil diakhiri");
    } catch (error) {
      console.error("Error ending attendance session:", error);
      toast.error("Gagal mengakhiri sesi presensi");
    } finally {
      setIsLoading(false);
    }
  };

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    // Ensure seconds is a valid number
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      console.warn("Invalid remaining time:", seconds);
      return "00:00";
    }
    
    // Ensure positive value
    const positiveSeconds = Math.max(0, seconds);
    
    // Calculate minutes and seconds
    const minutes = Math.floor(positiveSeconds / 60);
    const remainingSeconds = Math.floor(positiveSeconds % 60);
    
    // Format with leading zeros
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get a more accurate display time based on session state
  const getDisplayTime = (session: ActiveSession): string => {
    // If we have a valid remaining time, use it
    if (session.status === 'active' && typeof session.remainingTime === 'number') {
      return formatRemainingTime(session.remainingTime);
    } 
    // Fallback to showing the full duration
    return `${session.duration}:00`;
  };

  // Function to open QR code modal
  const openQrCodeModal = (session: AttendanceSession) => {
    setSelectedSessionForQr(session);
    setShowQrModal(true);
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
                  <p className="text-sm text-muted-foreground mt-1">Kelola kehadiran mahasiswa dengan berbagai metode autentikasi</p>
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
                        />
                      </div>
                      <div className="flex gap-3 items-center">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-[240px] h-10">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter Hari" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Hari</SelectItem>
                            <SelectItem value="mon">Senin</SelectItem>
                            <SelectItem value="tue">Selasa</SelectItem>
                            <SelectItem value="wed">Rabu</SelectItem>
                            <SelectItem value="thu">Kamis</SelectItem>
                            <SelectItem value="fri">Jumat</SelectItem>
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
                              <TableHead className="font-bold text-black">Hari</TableHead>
                              <TableHead className="font-bold text-black">Jam</TableHead>
                              <TableHead className="font-bold text-black">Ruangan</TableHead>
                              <TableHead className="font-bold text-black">Mahasiswa</TableHead>
                              <TableHead className="w-[120px] text-right font-bold text-black">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schedules.map((schedule, index) => (
                              <TableRow key={schedule.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{schedule.courseCode}</TableCell>
                                <TableCell>{schedule.courseName}</TableCell>
                                <TableCell>{schedule.day}</TableCell>
                                <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                                <TableCell>{schedule.room}</TableCell>
                                <TableCell>{schedule.totalStudents}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-[#0687C9] hover:bg-[#0572aa]"
                                    onClick={() => openSettingsDialog(schedule)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Mulai Presensi
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {schedules.length === 0 && (
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
                              <p className="text-sm">Mulai sesi baru dari tab Jadwal</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {activeSessions.map((session) => {
                              const schedule = schedules.find(s => s.id === session.courseScheduleId);
                              const resolvedTotalStudents = (schedule && schedule.totalStudents > 0) ? schedule.totalStudents : (session.totalStudents || 0);
                              const attendancePercentage = resolvedTotalStudents > 0 ? (session.attendedCount / resolvedTotalStudents) * 100 : 0;

                              return (
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
                                          <Badge variant="outline" className="bg-blue-50 text-[#0687C9] border-[#0687C9]/20">
                                            {session.type}
                                          </Badge>
                                        </div>
                                        
                                        <div>
                                          <h3 className="text-lg font-semibold">
                                            {session.courseCode}: {session.courseName}
                                          </h3>
                                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                            <div className="flex items-center">
                                              <Clock className="h-4 w-4 mr-2" />
                                              <span>{session.scheduleStartTime} - {session.scheduleEndTime}</span>
                                            </div>
                                            <div className="flex items-center">
                                              <QrCode className="h-4 w-4 mr-2" />
                                              <span>Tipe: {session.type}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                          <div className="w-full sm:w-48">
                                            <div className="text-sm mb-1">
                                              Kehadiran: <span className="font-medium">{session.attendedCount}/{resolvedTotalStudents}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                              <div 
                                                className="bg-[#0687C9] h-2.5 rounded-full" 
                                                style={{ width: `${attendancePercentage}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                          
                                          {/* Always show the timer for active sessions */}
                                          <div className="flex items-center gap-2 bg-[#E6F3FB] px-3 py-2 rounded-md">
                                            <TimerIcon className="h-4 w-4 text-[#0687C9]" />
                                            <div>
                                              <span className="text-sm text-muted-foreground">Sisa waktu:</span>
                                              <span className="ml-1 font-semibold text-[#0687C9]">
                                                {getDisplayTime(session)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-row sm:flex-col gap-2 sm:w-44">
                                        {(session.type === "QR Code" || session.type === "Keduanya") && (
                                          <Button 
                                            variant="default" 
                                            className="flex-1 bg-[#0687C9] hover:bg-[#0572aa]"
                                            onClick={() => openQrCodeModal(session)}
                                          >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Lihat QR
                                          </Button>
                                        )}
                                        <Button 
                                          variant="outline" 
                                          className="flex-1 border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]"
                                          onClick={() => endAttendanceSession(session.id)}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Akhiri Sesi
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "past" && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cari riwayat..."
                            className="pl-8"
                          />
                        </div>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full md:w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                            {/* Generate course filter dynamically */}
                            {Array.from(new Set(pastSessions.map(s => s.courseCode))).map(code => (
                              <SelectItem key={code} value={code.toLowerCase()}>{code}</SelectItem>
                            ))}
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
                            {pastSessions.map((session, index) => {
                              const schedule = schedules.find(s => s.id === session.courseScheduleId);
                              const resolvedTotalStudents = (schedule && schedule.totalStudents > 0) ? schedule.totalStudents : (session.totalStudents || 0);
                              const attendancePercentage = resolvedTotalStudents > 0 ? (session.attendedCount / resolvedTotalStudents) * 100 : 0;

                              return (
                                <TableRow key={session.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{session.date}</TableCell>
                                  <TableCell className="font-medium">{session.courseCode}</TableCell>
                                  <TableCell>{session.courseName}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      session.type === "QR Code" 
                                        ? "bg-blue-50 text-[#0687C9] border-[#0687C9]/20" 
                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                    }>
                                      {session.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{session.duration} menit</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <span>{session.attendedCount}/{resolvedTotalStudents}</span>
                                      <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                                        <div 
                                          className="bg-[#0687C9] h-2 rounded-full" 
                                          style={{ width: `${attendancePercentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]"
                                      onClick={() => window.location.href = `/dashboard/lecturer/attendance/detail/${session.id}`}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Detail
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {pastSessions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center">
                                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                    <p>Belum ada riwayat presensi</p>
                                    <p className="text-sm">Riwayat presensi akan muncul di sini setelah sesi selesai</p>
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
          
          {/* Attendance Settings Dialog */}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-black">Pengaturan Sesi Presensi</DialogTitle>
                <DialogDescription>
                  Atur parameter untuk sesi presensi yang akan dimulai
                </DialogDescription>
                {selectedSchedule && (
                  <div className="mt-3 text-left">
                    <div className="font-medium">{selectedSchedule.courseCode}: {selectedSchedule.courseName}</div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{selectedSchedule.day}, {selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                    </div>
                  </div>
                )}
              </DialogHeader>
              
              <div className="grid gap-5 py-4">
                <div className="grid grid-cols-1 gap-3">
                  <Label htmlFor="attendance-type" className="font-medium">Tipe Presensi</Label>
                  <Select 
                    value={attendanceSettings.type} 
                    onValueChange={(value: any) => setAttendanceSettings({...attendanceSettings, type: value})}
                  >
                    <SelectTrigger id="attendance-type" className="bg-white">
                      <SelectValue placeholder="Pilih tipe presensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QR Code">
                        <div className="flex items-center">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </div>
                      </SelectItem>
                      <SelectItem value="Face Recognition">
                        <div className="flex items-center">
                          <ScanFace className="h-4 w-4 mr-2" />
                          Pengenalan Wajah
                        </div>
                      </SelectItem>
                      <SelectItem value="Keduanya">
                        <div className="flex items-center">
                          <Sliders className="h-4 w-4 mr-2" />
                          QR Code & Pengenalan Wajah
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Label className="font-medium">Durasi Presensi</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Durasi: {attendanceSettings.duration} menit</span>
                    </div>
                    <Slider 
                      value={[attendanceSettings.duration]} 
                      min={5} 
                      max={30} 
                      step={5}
                      onValueChange={(value: number[]) => setAttendanceSettings({...attendanceSettings, duration: value[0]})}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-close" className="font-medium">Tutup Otomatis</Label>
                      <Switch 
                        id="auto-close" 
                        checked={attendanceSettings.autoClose}
                        onCheckedChange={(checked) => setAttendanceSettings({...attendanceSettings, autoClose: checked})}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sesi akan otomatis ditutup setelah durasi berakhir
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allow-late" className="font-medium">Izinkan Terlambat</Label>
                      <Switch 
                        id="allow-late" 
                        checked={attendanceSettings.allowLate}
                        onCheckedChange={(checked) => setAttendanceSettings({...attendanceSettings, allowLate: checked})}
                      />
                    </div>
                    {attendanceSettings.allowLate && (
                      <div className="mt-3">
                        <Label className="text-sm">Batas Keterlambatan</Label>
                        <div className="flex items-center mt-2">
                          <Slider 
                            value={[attendanceSettings.lateThreshold]} 
                            min={5} 
                            max={20} 
                            step={5}
                            onValueChange={(value: number[]) => setAttendanceSettings({...attendanceSettings, lateThreshold: value[0]})}
                            className="flex-1 mr-4"
                          />
                          <span className="text-sm font-medium">{attendanceSettings.lateThreshold} menit</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="font-medium">Catatan</Label>
                    <Input 
                      id="notes" 
                      placeholder="Tambahkan catatan (opsional)" 
                      value={attendanceSettings.notes}
                      onChange={(e) => setAttendanceSettings({...attendanceSettings, notes: e.target.value})}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button variant="outline" className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" onClick={() => setShowSettingsDialog(false)}>
                  Batal
                </Button>
                <Button className="bg-[#0687C9] hover:bg-[#0572aa]" onClick={startAttendanceSession}>
                  Mulai Sesi
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* QR Code Modal */}
          <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-black">QR Code Presensi</DialogTitle>
                <DialogDescription>
                  Tunjukkan QR code ini kepada mahasiswa untuk melakukan presensi
                </DialogDescription>
                {selectedSessionForQr && (
                  <div className="mt-3 text-left">
                    <div className="font-medium">{selectedSessionForQr.courseCode}: {selectedSessionForQr.courseName}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedSessionForQr.date}, {selectedSessionForQr.startTime}
                    </div>
                  </div>
                )}
              </DialogHeader>
              
              <div className="flex flex-col items-center justify-center p-4">
                {selectedSessionForQr && (
                  <>
                    <div className="relative bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <img 
                        src={getQRCodeUrl(selectedSessionForQr.id)} 
                        alt="QR Code for attendance" 
                        className="w-[250px] h-[250px]"
                      />
                    </div>
                    <p className="text-sm text-center mt-4 text-muted-foreground">
                      Mahasiswa dapat melakukan scan QR code ini menggunakan aplikasi DelPresence untuk melakukan presensi
                    </p>
                    <Button
                      className="mt-4 bg-[#0687C9] hover:bg-[#0572aa]"
                      onClick={() => window.open(getQRCodeUrl(selectedSessionForQr.id), '_blank')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Buka QR dalam Tab Baru
                    </Button>
                  </>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowQrModal(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 
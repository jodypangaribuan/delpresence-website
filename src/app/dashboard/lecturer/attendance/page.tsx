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
import * as attendanceApi from "@/utils/attendance-api";
import { AttendanceSession, AttendanceSettings } from "@/utils/attendance-api";

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
        const activeSessionsResponse = await attendanceApi.getActiveAttendanceSessions();
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
        
        const pastSessionsResponse = await attendanceApi.getAttendanceSessions(
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
    
    const startTime = new Date(session.startTime).getTime();
    const durationMs = session.duration * 60 * 1000;
    const endTime = startTime + durationMs;
    const now = Date.now();
    
    const remainingMs = endTime - now;
    return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
  };

  // Update remaining time for active sessions
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSessions(prev => 
        prev.map(session => {
          if (session.remainingTime && session.remainingTime > 0) {
            return { ...session, remainingTime: session.remainingTime - 1 };
          } else if (session.remainingTime === 0) {
            // Auto close session when time expires
            if (session.autoClose) {
              endAttendanceSession(session.id);
              return session;
            }
          }
          return session;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
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
      
      const newSession = await attendanceApi.createAttendanceSession(
        selectedSchedule.id,
        today,
        attendanceSettings.type,
        attendanceSettings
      );
      
      // Add remaining time for frontend display
      const sessionWithTime: ActiveSession = {
        ...newSession,
        remainingTime: attendanceSettings.duration * 60
      };
      
      setActiveSessions([...activeSessions, sessionWithTime]);
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
      await attendanceApi.closeAttendanceSession(sessionId);
      
      // Get updated session details
      const updatedSession = await attendanceApi.getAttendanceSessionDetails(sessionId);
      
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                      <div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cari jadwal..."
                            className="pl-8"
                          />
                        </div>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-full md:w-[180px]">
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
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-black">Sesi Presensi Aktif</h4>
                      <p className="text-sm text-muted-foreground mt-1">Pantau sesi presensi yang sedang berlangsung</p>
                    </div>
                    
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
                                            <span>{session.startTime} - {session.endTime || session.scheduleEndTime}</span>
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
                                            Kehadiran: <span className="font-medium">{session.attendedCount + session.lateCount}/{session.totalStudents}</span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                              className="bg-[#0687C9] h-2.5 rounded-full" 
                                              style={{ width: `${((session.attendedCount + session.lateCount) / session.totalStudents) * 100}%` }}
                                            ></div>
                                          </div>
                                        </div>
                                        
                                        {session.remainingTime !== undefined && session.remainingTime > 0 && (
                                          <div className="flex items-center gap-2 bg-[#E6F3FB] px-3 py-2 rounded-md">
                                            <TimerIcon className="h-4 w-4 text-[#0687C9]" />
                                            <div>
                                              <span className="text-sm text-muted-foreground">Sisa waktu:</span>
                                              <span className="ml-1 font-semibold text-[#0687C9]">
                                                {formatRemainingTime(session.remainingTime)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-row sm:flex-col gap-2 sm:w-44">
                                      <Button 
                                        variant="default" 
                                        className="flex-1 bg-[#0687C9] hover:bg-[#0572aa]"
                                        onClick={() => window.open(attendanceApi.getQRCodeUrl(session.id), '_blank')}
                                      >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        Lihat QR
                                      </Button>
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
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "past" && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                      <div>
                        <h4 className="text-lg font-medium text-black">Riwayat Sesi Presensi</h4>
                        <p className="text-sm text-muted-foreground mt-1">Rekam jejak sesi presensi yang telah selesai</p>
                      </div>
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
                            {pastSessions.map((session, index) => (
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
                                    <span>{session.attendedCount + session.lateCount}/{session.totalStudents}</span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                                      <div 
                                        className="bg-[#0687C9] h-2 rounded-full" 
                                        style={{ width: `${((session.attendedCount + session.lateCount) / session.totalStudents) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.location.href = `/dashboard/lecturer/attendance/detail/${session.id}`}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Detail
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
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
        </CardContent>
      </Card>
    </div>
  );
} 
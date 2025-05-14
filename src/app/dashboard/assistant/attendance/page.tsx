"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar, 
  QrCode, 
  Clock, 
  Plus,
  FileText,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Timer as TimerIcon,
  BarChart3,
  ScanFace
} from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Schedule {
  id: number;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  date: string;
  totalStudents: number;
}

interface ActiveSession {
  id: number;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  startTime: string;
  endTime: string;
  room: string;
  attendanceType: string;
  startedAt: string;
  status: string;
  attendedCount: number;
  totalStudents: number;
  remainingTime?: number; // in seconds
}

interface PastSession {
  id: number;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  attendanceType: string;
  attendedCount: number;
  totalStudents: number;
  duration?: number; // in minutes
}

interface AttendanceSettings {
  type: "QR Code" | "Face Recognition" | "Manual";
  autoClose: boolean;
  duration: number; // in minutes
  allowLate: boolean;
  lateThreshold: number; // in minutes
  notes: string;
}

export default function AssistantAttendancePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showAttendanceList, setShowAttendanceList] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
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

  // Mock data for development
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSchedules([
        {
          id: 1,
          courseCode: "IF210",
          courseName: "Algoritma & Pemrograman",
          lecturerName: "Dr. Parmonangan Rotua Togatorop",
          day: "Senin",
          startTime: "08:00",
          endTime: "10:30",
          room: "Ruang Lab 3",
          date: "2023-10-16",
          totalStudents: 42
        },
        {
          id: 2,
          courseCode: "IF310",
          courseName: "Basis Data",
          lecturerName: "Dr. Arlinta Christy Barus",
          day: "Selasa",
          startTime: "13:00",
          endTime: "15:30",
          room: "Ruang Lab 1",
          date: "2023-10-17",
          totalStudents: 38
        }
      ]);

      setActiveSessions([
        {
          id: 101,
          courseCode: "IF240",
          courseName: "Struktur Data",
          lecturerName: "Dr. Johannes Harungguan Sianipar",
          startTime: "09:00",
          endTime: "11:30",
          room: "Ruang Lab 4",
          attendanceType: "QR Code",
          startedAt: "09:05",
          status: "active",
          attendedCount: 23,
          totalStudents: 30,
          remainingTime: 300 // 5 minutes remaining
        }
      ]);

      setPastSessions([
        {
          id: 201,
          courseCode: "IF210",
          courseName: "Algoritma & Pemrograman",
          lecturerName: "Dr. Parmonangan Rotua Togatorop",
          date: "2023-10-09",
          startTime: "08:00",
          endTime: "10:30",
          room: "Ruang Lab 3",
          attendanceType: "QR Code",
          attendedCount: 28,
          totalStudents: 30,
          duration: 15
        },
        {
          id: 202,
          courseCode: "IF310",
          courseName: "Basis Data",
          lecturerName: "Dr. Arlinta Christy Barus",
          date: "2023-10-10",
          startTime: "13:00",
          endTime: "15:30",
          room: "Ruang Lab 1",
          attendanceType: "Face Recognition",
          attendedCount: 25,
          totalStudents: 28,
          duration: 20
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  // Update remaining time for active sessions
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSessions(prev => 
        prev.map(session => {
          if (session.remainingTime && session.remainingTime > 0) {
            return { ...session, remainingTime: session.remainingTime - 1 };
          }
          return session;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format remaining time
  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to view attendance list
  const viewAttendanceList = (session: ActiveSession) => {
    setSelectedSession(session);
    setShowAttendanceList(true);
  };

  // Function to view QR code
  const viewQRCode = (session: ActiveSession) => {
    setSelectedSession(session);
    setShowQRDialog(true);
  };

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
      // In a real implementation, you would call the API to start a session
      toast.success("Sesi presensi berhasil dimulai");
      
      // Calculate remaining time in seconds
      const remainingTimeInSeconds = attendanceSettings.duration * 60;
      
      // Create new session
      const newSession: ActiveSession = {
        id: Date.now(),
        courseCode: selectedSchedule.courseCode,
        courseName: selectedSchedule.courseName,
        lecturerName: selectedSchedule.lecturerName,
        startTime: selectedSchedule.startTime,
        endTime: selectedSchedule.endTime,
        room: selectedSchedule.room,
        attendanceType: attendanceSettings.type,
        startedAt: new Date().toLocaleTimeString(),
        status: "active",
        attendedCount: 0,
        totalStudents: selectedSchedule.totalStudents,
        remainingTime: remainingTimeInSeconds
      };
      
      setActiveSessions([...activeSessions, newSession]);
      setShowSettingsDialog(false);
      setActiveTab("active");
    } catch (error) {
      console.error("Error starting attendance session:", error);
      toast.error("Gagal memulai sesi presensi");
    }
  };

  // Function to end an active attendance session
  const endAttendanceSession = async (sessionId: number) => {
    try {
      // In a real implementation, you would call the API to end a session
      toast.success("Sesi presensi berhasil diakhiri");
      
      // Move from active to past sessions
      const session = activeSessions.find(s => s.id === sessionId);
      if (session) {
        const pastSession: PastSession = {
          ...session,
          date: new Date().toISOString().split('T')[0],
          duration: 15 // Default duration or could be stored in session
        };
        
        setPastSessions([pastSession, ...pastSessions]);
        setActiveSessions(activeSessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error("Error ending attendance session:", error);
      toast.error("Gagal mengakhiri sesi presensi");
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
                  <h3 className="text-xl font-semibold text-[#002A5C]">Kelola Presensi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Bantu dosen dalam mengelola presensi mahasiswa</p>
                </div>
                <div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-full md:w-[400px] bg-gray-100">
                      <TabsTrigger 
                        value="upcoming" 
                        className="data-[state=active]:bg-white data-[state=active]:text-[#002A5C] data-[state=active]:shadow-sm"
                      >
                        Jadwal
                      </TabsTrigger>
                      <TabsTrigger 
                        value="active" 
                        className="data-[state=active]:bg-white data-[state=active]:text-[#002A5C] data-[state=active]:shadow-sm"
                      >
                        Sesi Aktif
                      </TabsTrigger>
                      <TabsTrigger 
                        value="past" 
                        className="data-[state=active]:bg-white data-[state=active]:text-[#002A5C] data-[state=active]:shadow-sm"
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
                          <SelectTrigger className="w-full md:w-[140px]">
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
                              <TableHead className="font-bold text-black">Dosen</TableHead>
                              <TableHead className="font-bold text-black">Hari</TableHead>
                              <TableHead className="font-bold text-black">Jam</TableHead>
                              <TableHead className="font-bold text-black">Ruangan</TableHead>
                              <TableHead className="font-bold text-black">Mahasiswa</TableHead>
                              <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schedules.map((schedule, index) => (
                              <TableRow key={schedule.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{schedule.courseCode}</TableCell>
                                <TableCell>{schedule.courseName}</TableCell>
                                <TableCell>{schedule.lecturerName}</TableCell>
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
                                <TableCell colSpan={9} className="h-32 text-center">
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
                      <h4 className="text-lg font-medium text-[#002A5C]">Sesi Presensi Aktif</h4>
                      <p className="text-sm text-muted-foreground mt-1">Sesi presensi yang sedang berlangsung</p>
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
                              <p className="text-sm">Sesi presensi dimulai oleh dosen pengampu</p>
                            </div>
                          </div>
                        ) : (
                          activeSessions.map((session) => (
                            <Card key={session.id} className="border border-gray-200 overflow-hidden">
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
                                        {session.attendanceType}
                                      </Badge>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {session.courseCode}: {session.courseName}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">Dosen: {session.lecturerName}</p>
                                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-2" />
                                          <span>{session.startTime} - {session.endTime}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                      <div className="w-full sm:w-48">
                                        <div className="text-sm mb-1">
                                          Kehadiran: <span className="font-medium">{session.attendedCount}/{session.totalStudents}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div 
                                            className="bg-[#0687C9] h-2.5 rounded-full" 
                                            style={{ width: `${(session.attendedCount / session.totalStudents) * 100}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      
                                      {session.remainingTime !== undefined && (
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
                                      onClick={() => viewQRCode(session)}
                                    >
                                      <QrCode className="h-4 w-4 mr-2" />
                                      Lihat QR
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      className="flex-1 border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]"
                                      onClick={() => viewAttendanceList(session)}
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      Daftar Hadir
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
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "past" && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                      <div>
                        <h4 className="text-lg font-medium text-[#002A5C]">Riwayat Presensi</h4>
                        <p className="text-sm text-muted-foreground mt-1">Riwayat sesi presensi yang telah selesai</p>
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
                            <SelectItem value="if210">IF210 - Algoritma</SelectItem>
                            <SelectItem value="if310">IF310 - Basis Data</SelectItem>
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
                              <TableHead className="font-bold text-black">Dosen</TableHead>
                              <TableHead className="font-bold text-black">Tipe Presensi</TableHead>
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
                                <TableCell>{session.lecturerName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    session.attendanceType === "QR Code" 
                                      ? "bg-blue-50 text-[#0687C9] border-[#0687C9]/20" 
                                      : "bg-purple-50 text-purple-700 border-purple-200"
                                  }>
                                    {session.attendanceType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <span>{session.attendedCount}/{session.totalStudents}</span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2 ml-2">
                                      <div 
                                        className="bg-[#0687C9] h-2 rounded-full" 
                                        style={{ width: `${(session.attendedCount / session.totalStudents) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Laporan
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
          
          {/* QR Code Dialog */}
          <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-[#002A5C]">QR Code Presensi</DialogTitle>
                <DialogDescription>
                  Gunakan QR Code ini untuk melakukan presensi mahasiswa
                </DialogDescription>
              </DialogHeader>
              
              {selectedSession && (
                <div className="py-4">
                  <div className="text-center mb-4">
                    <h3 className="font-semibold">{selectedSession.courseCode}: {selectedSession.courseName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedSession.startTime} - {selectedSession.endTime} | {selectedSession.room}</p>
                  </div>
                  
                  <div className="flex justify-center my-4">
                    {/* Placeholder for QR Code */}
                    <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <QrCode className="h-20 w-20 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>QR Code akan berubah setiap 30 detik</p>
                    <p className="mt-1">Sisa waktu sesi: {selectedSession.remainingTime && formatRemainingTime(selectedSession.remainingTime)}</p>
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center bg-[#E6F3FB] p-3 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-[#002A5C]">Status Kehadiran:</p>
                      <p className="text-sm">{selectedSession.attendedCount} dari {selectedSession.totalStudents} mahasiswa</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                      onClick={() => {
                        setShowQRDialog(false);
                        setShowAttendanceList(true);
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Lihat Daftar
                    </Button>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" onClick={() => setShowQRDialog(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Student Attendance List Dialog */}
          <Dialog open={showAttendanceList} onOpenChange={setShowAttendanceList}>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-[#002A5C]">Daftar Kehadiran Mahasiswa</DialogTitle>
                <DialogDescription>
                  {selectedSession && (
                    <div className="mt-2">
                      <p className="font-medium">{selectedSession.courseCode}: {selectedSession.courseName}</p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{selectedSession.startTime} - {selectedSession.endTime} | {selectedSession.room}</span>
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Cari mahasiswa..." className="pl-8" />
                  </div>
                  <Badge className="ml-2 bg-[#0687C9]">
                    {selectedSession?.attendedCount}/{selectedSession?.totalStudents} Hadir
                  </Badge>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                        <TableHead className="w-[100px] font-bold text-black">NIM</TableHead>
                        <TableHead className="font-bold text-black">Nama</TableHead>
                        <TableHead className="font-bold text-black">Status</TableHead>
                        <TableHead className="font-bold text-black">Waktu Presensi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Mock data for student attendance */}
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>10120001</TableCell>
                        <TableCell>Ahmad Rizky</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Hadir
                          </Badge>
                        </TableCell>
                        <TableCell>09:05</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2</TableCell>
                        <TableCell>10120002</TableCell>
                        <TableCell>Budi Santoso</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Hadir
                          </Badge>
                        </TableCell>
                        <TableCell>09:08</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>3</TableCell>
                        <TableCell>10120003</TableCell>
                        <TableCell>Citra Dewi</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Terlambat
                          </Badge>
                        </TableCell>
                        <TableCell>09:17</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>4</TableCell>
                        <TableCell>10120004</TableCell>
                        <TableCell>Dian Permata</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Belum Hadir
                          </Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>5</TableCell>
                        <TableCell>10120005</TableCell>
                        <TableCell>Eko Priyanto</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Belum Hadir
                          </Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  className="text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Unduh Laporan
                </Button>
                <Button className="bg-[#0687C9] hover:bg-[#0572aa]" onClick={() => setShowAttendanceList(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Attendance Settings Dialog */}
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-[#002A5C]">Pengaturan Sesi Presensi</DialogTitle>
                <DialogDescription>
                  {selectedSchedule && (
                    <div className="mt-2">
                      <p className="font-medium">{selectedSchedule.courseCode}: {selectedSchedule.courseName}</p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{selectedSchedule.day}, {selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                      </div>
                    </div>
                  )}
                </DialogDescription>
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
                      <SelectItem value="Manual">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Manual
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
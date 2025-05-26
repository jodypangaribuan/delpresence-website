"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Users, Filter, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { toast } from "sonner";
import * as attendanceApi from "@/utils/attendance-api";
import { AttendanceSession, StudentAttendance } from "@/utils/attendance-api";

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
        const sessionData = await attendanceApi.getAttendanceSessionDetails(sessionId);
        setSession(sessionData);
        
        // Fetch student attendances
        const attendanceData = await attendanceApi.getStudentAttendances(sessionId);
        setAttendances(attendanceData);
      } catch (error) {
        console.error("Error fetching attendance details:", error);
        toast.error("Gagal memuat data presensi");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [sessionId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return "bg-green-50 text-green-700 border-green-200";
      case 'late':
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 'absent':
        return "bg-red-50 text-red-700 border-red-200";
      case 'excused':
        return "bg-blue-50 text-blue-700 border-blue-200";
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
  const excusedCount = attendances.filter(a => a.status.toLowerCase() === 'excused').length;
  const totalStudents = attendances.length;
  const attendanceRate = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
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
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-black">Detail Presensi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold">{session.courseCode}: {session.courseName}</h3>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Tanggal: {session.date}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Waktu: {session.startTime} - {session.endTime || session.scheduleEndTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Kehadiran: {presentCount + lateCount} dari {totalStudents} mahasiswa ({attendanceRate.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 bg-green-50 border-green-100">
                    <p className="text-sm text-green-600">Hadir</p>
                    <p className="text-2xl font-semibold text-green-700">{presentCount}</p>
                  </Card>
                  <Card className="p-4 bg-yellow-50 border-yellow-100">
                    <p className="text-sm text-yellow-600">Terlambat</p>
                    <p className="text-2xl font-semibold text-yellow-700">{lateCount}</p>
                  </Card>
                  <Card className="p-4 bg-red-50 border-red-100">
                    <p className="text-sm text-red-600">Tidak Hadir</p>
                    <p className="text-2xl font-semibold text-red-700">{absentCount}</p>
                  </Card>
                  <Card className="p-4 bg-blue-50 border-blue-100">
                    <p className="text-sm text-blue-600">Izin</p>
                    <p className="text-2xl font-semibold text-blue-700">{excusedCount}</p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-100 shadow-sm">
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
                    <SelectItem value="excused">Izin</SelectItem>
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
                             attendance.status === 'ABSENT' ? 'Tidak Hadir' : 
                             attendance.status === 'EXCUSED' ? 'Izin' : attendance.status}
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
        <Card className="border border-gray-100 shadow-sm p-8 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-10 w-10 text-gray-300 mb-2" />
            <p>Sesi presensi tidak ditemukan</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Kembali ke Daftar Presensi
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  Users, 
  BookOpen, 
  FileCheck, 
  MapPin,
  ExternalLink
} from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { toast } from "sonner";

interface Schedule {
  id: number;
  courseCode: string;
  courseName: string;
  lecturerName: string;
  day: string;
  time: string;
  room: string;
  date: string;
  totalStudents: number;
  upcoming: boolean;
  status: "upcoming" | "completed" | "active" | "today";
}

export default function AssistantSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Mock data for development
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockSchedules = [
        {
          id: 1,
          courseCode: "IF210",
          courseName: "Algoritma & Pemrograman",
          lecturerName: "Dr. Parmonangan Rotua Togatorop",
          day: "Senin",
          time: "08:00 - 10:30",
          room: "Ruang Lab 3",
          date: "2023-10-16",
          totalStudents: 42,
          upcoming: true,
          status: "upcoming" as const
        },
        {
          id: 2,
          courseCode: "IF310",
          courseName: "Basis Data",
          lecturerName: "Dr. Arlinta Christy Barus",
          day: "Selasa",
          time: "13:00 - 15:30",
          room: "Ruang Lab 1",
          date: "2023-10-17",
          totalStudents: 38,
          upcoming: true,
          status: "today" as const
        },
        {
          id: 3,
          courseCode: "IF240",
          courseName: "Struktur Data",
          lecturerName: "Dr. Johannes Harungguan Sianipar",
          day: "Kamis",
          time: "09:00 - 11:30",
          room: "Ruang Lab 4",
          date: "2023-10-19",
          totalStudents: 30,
          upcoming: true,
          status: "upcoming" as const
        },
        {
          id: 4,
          courseCode: "IF402",
          courseName: "Pemrograman Mobile",
          lecturerName: "Iustisia Natali Rani Riandari",
          day: "Rabu",
          time: "10:00 - 12:30",
          room: "Ruang Lab 2",
          date: "2023-10-11",
          totalStudents: 25,
          upcoming: false,
          status: "completed" as const
        },
        {
          id: 5,
          courseCode: "IF330",
          courseName: "Jaringan Komputer",
          lecturerName: "Dr. Yaya Setiadi",
          day: "Jumat",
          time: "13:00 - 15:30",
          room: "Ruang Lab 3",
          date: "2023-10-13",
          totalStudents: 35,
          upcoming: false,
          status: "completed" as const
        }
      ];

      setSchedules(mockSchedules);
      setFilteredSchedules(mockSchedules);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter schedules based on search term, day and status filters
  useEffect(() => {
    let filtered = schedules;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.lecturerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply day filter
    if (dayFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.day.toLowerCase() === dayFilter.toLowerCase());
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }
    
    setFilteredSchedules(filtered);
  }, [searchTerm, dayFilter, statusFilter, schedules]);

  // Function to view schedule details
  const viewScheduleDetails = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Jadwal Perkuliahan</h3>
                  <p className="text-sm text-muted-foreground mt-1">Daftar jadwal perkuliahan yang Anda bantu sebagai asisten dosen</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mata kuliah..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="w-full md:w-[140px]">
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[140px]">
                      <Clock className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="upcoming">Akan Datang</SelectItem>
                      <SelectItem value="today">Hari Ini</SelectItem>
                      <SelectItem value="active">Sedang Berlangsung</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
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
                        <TableHead className="font-bold text-black">Status</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
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
                          <TableCell>{schedule.time}</TableCell>
                          <TableCell>{schedule.room}</TableCell>
                          <TableCell>
                            {schedule.status === "upcoming" && (
                              <Badge variant="outline" className="bg-blue-50 text-[#0687C9] border-[#0687C9]/20">
                                Akan Datang
                              </Badge>
                            )}
                            {schedule.status === "today" && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Hari Ini
                              </Badge>
                            )}
                            {schedule.status === "active" && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                Sedang Berlangsung
                              </Badge>
                            )}
                            {schedule.status === "completed" && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                Selesai
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-[#0687C9] hover:text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20"
                              onClick={() => viewScheduleDetails(schedule)}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSchedules.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                              <p>Tidak ada jadwal yang tersedia</p>
                              <p className="text-sm">Jadwal akan muncul di sini ketika Anda ditugaskan sebagai asisten</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Detail Jadwal Perkuliahan</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang jadwal perkuliahan
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col space-y-1.5">
                <h3 className="text-lg font-semibold">{selectedSchedule.courseCode}: {selectedSchedule.courseName}</h3>
                <p className="text-sm text-muted-foreground">{selectedSchedule.day}, {selectedSchedule.time}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Dosen Pengampu</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.lecturerName}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Lokasi</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.room}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Tanggal</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.date}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Jumlah Mahasiswa</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.totalStudents} mahasiswa</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Status</p>
                    <div className="mt-1">
                      {selectedSchedule.status === "upcoming" && (
                        <Badge variant="outline" className="bg-blue-50 text-[#0687C9] border-[#0687C9]/20">
                          Akan Datang
                        </Badge>
                      )}
                      {selectedSchedule.status === "today" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Hari Ini
                        </Badge>
                      )}
                      {selectedSchedule.status === "active" && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Sedang Berlangsung
                        </Badge>
                      )}
                      {selectedSchedule.status === "completed" && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Selesai
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Peran Anda: <span className="text-[#0687C9]">Asisten Dosen</span></p>
                  {(selectedSchedule.status === "today" || selectedSchedule.status === "upcoming") && (
                    <Button variant="outline" size="sm" className="text-[#0687C9] hover:bg-[#E6F3FB] border-[#0687C9]/20">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Laporan Absensi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" onClick={() => setShowDetails(false)}>
              Tutup
            </Button>
            {selectedSchedule && (selectedSchedule.status === "today" || selectedSchedule.status === "active") && (
              <Button className="bg-[#0687C9] hover:bg-[#0572aa]">
                <Clock className="h-4 w-4 mr-2" />
                Mulai Mengajar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
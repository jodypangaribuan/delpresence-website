"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  status?: "upcoming" | "today" | "active" | "completed";
}

interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
}

export default function LecturerSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | 'all'>(0);

  // Load academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api<{status: string, data: AcademicYear[]}>('lecturer/academic-years');
        if (response.status === 'success' && response.data) {
          setAcademicYears(response.data);
          // Just use the first year in the list
          if (response.data.length > 0) {
            setSelectedAcademicYear(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
        toast.error('Gagal memuat tahun akademik');
      }
    };
    
    fetchAcademicYears();
  }, []);

  // Load lecturer's schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);
      try {
        let queryParam = '';
        
        // Handle academic year parameter
        if (selectedAcademicYear === 'all') {
          // Don't add any parameter for 'all'
          queryParam = '';
        } else if (selectedAcademicYear === 0) {
          // Don't specify a parameter for 0 - backend will use active year by default
          queryParam = '';
        } else {
          // Use the specific academic year ID
          queryParam = `?academic_year_id=${selectedAcademicYear}`;
        }
          
        const response = await api<{status: string, data: Schedule[]}>(`lecturer/schedules${queryParam}`);
        if (response.status === 'success' && response.data) {
          // Process schedules to add status
          const processedSchedules = processScheduleStatus(response.data);
          setSchedules(processedSchedules);
          setFilteredSchedules(processedSchedules);
        }
      } catch (error) {
        console.error('Failed to fetch lecturer schedules:', error);
        toast.error('Gagal memuat jadwal mengajar');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedules();
  }, [selectedAcademicYear]);

  // Process schedules to add status
  const processScheduleStatus = (schedules: Schedule[]): Schedule[] => {
    const today = new Date();
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const currentDay = dayNames[today.getDay()].toLowerCase();
    
    return schedules.map(schedule => {
      const scheduleCopy = { ...schedule };
      const day = schedule.day.toLowerCase();
      
      if (day === currentDay) {
        // Check if current time is within class time
        const now = today.getHours() * 60 + today.getMinutes();
        const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
        const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        if (now >= startTime && now <= endTime) {
          scheduleCopy.status = 'active';
        } else if (now < startTime) {
          scheduleCopy.status = 'today';
        } else {
          scheduleCopy.status = 'completed';
        }
      } else {
        // Compare day of week
        const dayIndex = dayNames.indexOf(day);
        const currentDayIndex = today.getDay();
        
        if ((dayIndex > currentDayIndex) || 
            (dayIndex < currentDayIndex && dayIndex > 0)) { // Next week
          scheduleCopy.status = 'upcoming';
        } else {
          scheduleCopy.status = 'completed';
        }
      }
      
      return scheduleCopy;
    });
  };

  // Filter schedules based on search term, day and status filters
  useEffect(() => {
    let filtered = schedules;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.lecturer_name.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Format time for display
  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Jadwal Mengajar</h3>
                  <p className="text-sm text-muted-foreground mt-1">Daftar jadwal mengajar mata kuliah yang Anda ampu</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                  <Select value={selectedAcademicYear.toString()} onValueChange={(value) => setSelectedAcademicYear(value === 'all' ? 'all' : parseInt(value))}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tahun Akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tahun Akademik</SelectItem>
                      {academicYears.map(year => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name} {year.is_active && '(Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                        <TableHead className="font-bold text-black">Hari</TableHead>
                        <TableHead className="font-bold text-black">Jam</TableHead>
                        <TableHead className="font-bold text-black">Ruangan</TableHead>
                        <TableHead className="font-bold text-black">Kelas</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule, index) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{schedule.course_code}</TableCell>
                          <TableCell>{schedule.course_name}</TableCell>
                          <TableCell>{schedule.day}</TableCell>
                          <TableCell>{formatTimeRange(schedule.start_time, schedule.end_time)}</TableCell>
                          <TableCell>{schedule.room_name} ({schedule.building_name})</TableCell>
                          <TableCell>{schedule.student_group_name}</TableCell>
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
                          <TableCell colSpan={8} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                              <p>Tidak ada jadwal yang tersedia</p>
                              <p className="text-sm">Jadwal akan muncul di sini ketika Anda ditugaskan mengajar</p>
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
                <h3 className="text-lg font-semibold">{selectedSchedule.course_code}: {selectedSchedule.course_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSchedule.day}, {formatTimeRange(selectedSchedule.start_time, selectedSchedule.end_time)}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Mata Kuliah</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.course_code}: {selectedSchedule.course_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Lokasi</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.room_name} ({selectedSchedule.building_name})</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Jadwal</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.day}, {formatTimeRange(selectedSchedule.start_time, selectedSchedule.end_time)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Kelas</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.student_group_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-[#0687C9] mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Kapasitas</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.enrolled}/{selectedSchedule.capacity} mahasiswa</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">Peran Anda: <span className="text-[#0687C9]">Dosen Pengampu</span></p>
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
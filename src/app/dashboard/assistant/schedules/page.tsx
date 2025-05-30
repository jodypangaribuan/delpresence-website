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
import axios from "axios";
import { API_URL } from "@/utils/env";

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
}

export default function AssistantSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | 'all'>(0);

  // Token for API requests
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;

  // Load academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/assistant/academic-years`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.status === 'success') {
          if (response.data.data && response.data.data.length > 0) {
            setAcademicYears(response.data.data);
            // Set default to the first year in the list
            setSelectedAcademicYear(response.data.data[0].id);
          } else {
            // Handle case when there are no academic years
            console.log('No academic years found');
            // Set a dummy academic year to avoid loading state
            setAcademicYears([]);
            setSelectedAcademicYear('all');
          }
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        // Set default value to avoid infinite loading
        setAcademicYears([]);
        setSelectedAcademicYear('all');
        setIsLoading(false);
      }
    };
    
    fetchAcademicYears();
  }, [token]);

  // Load schedules for assigned courses
  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);
      try {
        // Use the assistant-specific endpoint that returns only assigned schedules
        const response = await axios.get(`${API_URL}/api/assistant/schedules`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            academic_year_id: selectedAcademicYear === 'all' ? '' : selectedAcademicYear
          }
        });
        
        if (response.data.status === 'success' && response.data.data) {
          // Process schedules to add status
          const processedSchedules = processScheduleStatus(response.data.data);
          setSchedules(processedSchedules);
          setFilteredSchedules(processedSchedules);
        } else {
          // Set empty schedules if no data
          setSchedules([]);
          setFilteredSchedules([]);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        toast.error('Gagal memuat jadwal');
        // Set empty schedules on error
        setSchedules([]);
        setFilteredSchedules([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token && selectedAcademicYear) {
      fetchSchedules();
    } else {
      // If there's no selected academic year, stop loading
      setIsLoading(false);
    }
  }, [token, selectedAcademicYear]);

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

  // Filter schedules based on search term and day filter
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
    
    setFilteredSchedules(filtered);
  }, [searchTerm, dayFilter, schedules]);

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
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-black">Jadwal Perkuliahan</h3>
              <p className="text-sm text-muted-foreground mt-1">Daftar jadwal perkuliahan yang Anda bantu sebagai asisten dosen</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
            <div className="relative w-full sm:w-[40%]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mata kuliah..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={selectedAcademicYear.toString()} onValueChange={(value) => setSelectedAcademicYear(value === 'all' ? 'all' : parseInt(value))}>
                <SelectTrigger className="w-[200px] h-10">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tahun Akademik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun Akademik</SelectItem>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-[150px] h-10">
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
                    <TableHead className="font-bold text-black">Status</TableHead>
                    <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((schedule, index) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{schedule.course_code}</TableCell>
                        <TableCell>{schedule.course_name}</TableCell>
                        <TableCell>{schedule.lecturer_name}</TableCell>
                        <TableCell>{schedule.day}</TableCell>
                        <TableCell>{formatTimeRange(schedule.start_time, schedule.end_time)}</TableCell>
                        <TableCell>{`${schedule.room_name}, ${schedule.building_name}`}</TableCell>
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
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                          <p>Tidak ada jadwal yang ditemukan</p>
                          <p className="text-sm">Tidak ada jadwal yang cocok dengan filter atau Anda belum ditugaskan ke mata kuliah manapun</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Detail Jadwal</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang jadwal perkuliahan
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-primary mr-2" />
                  <h4 className="font-semibold text-lg">{selectedSchedule.course_code} - {selectedSchedule.course_name}</h4>
                </div>
                <p className="text-sm text-muted-foreground ml-7">Semester {selectedSchedule.semester}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Dosen</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.lecturer_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Kelas</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.student_group_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hari</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.day}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Waktu</p>
                    <p className="text-sm text-muted-foreground">{formatTimeRange(selectedSchedule.start_time, selectedSchedule.end_time)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Ruangan</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.room_name}, {selectedSchedule.building_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Jumlah Mahasiswa</p>
                    <p className="text-sm text-muted-foreground">{selectedSchedule.enrolled}/{selectedSchedule.capacity} orang</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <a href={`/dashboard/assistant/attendance/${selectedSchedule.id}`}>
                  <Button className="w-full">
                    <FileCheck className="h-4 w-4 mr-2" />
                    Kelola Presensi
                  </Button>
                </a>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
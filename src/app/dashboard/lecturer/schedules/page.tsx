"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  CalendarDays, 
  Loader2,
  Clock,
  Users,
  MapPin,
  Building,
  BookOpen,
  Calendar,
  Search,
  Filter,
  ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Interface for academic year
interface AcademicYear {
  id: number;
  name: string;
  semester: string;
  start_date: string;
  end_date: string;
}

// Interface for schedule
interface Schedule {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  building_name?: string;
  course_name?: string;
  course_code?: string;
  group_name?: string;
  student_count?: number;
  academic_year_name?: string;
  academic_year_semester?: string;
}

// Days of the week in Indonesian
const daysOfWeek = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu"
];

// Helper function to get color class for day badge
const getScheduleBadgeClass = (day: string): string => {
  switch (day) {
    case 'Senin':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Selasa':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Rabu':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Kamis':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Jumat':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function LecturerSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lecturer/academic-years`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        const academicYearsData = response.data.data || [];
        setAcademicYears(academicYearsData);
        
        // If we have academic years and none is selected, select the first one (likely the current)
        if (academicYearsData.length > 0 && !selectedAcademicYearId) {
          // Try to find the active academic year first
          const activeYear = academicYearsData.find((year: AcademicYear) => {
            const now = new Date();
            const start = new Date(year.start_date);
            const end = new Date(year.end_date);
            return now >= start && now <= end;
          });
          
          if (activeYear) {
            setSelectedAcademicYearId(activeYear.id.toString());
          } else {
            // If no active year, select the first one
            setSelectedAcademicYearId(academicYearsData[0].id.toString());
          }
        } else if (academicYearsData.length === 0) {
          // If no academic years available, set loading to false and show empty state
          setIsLoading(false);
        }
      } else {
        toast.error("Gagal memuat data tahun akademik");
        setAcademicYears([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun akademik");
      setAcademicYears([]);
      setIsLoading(false);
    }
  };

  // Fetch lecturer's schedules
  const fetchMySchedules = async () => {
    setIsLoading(true);
    
    try {
      // Use the lecturer's schedules endpoint
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lecturer/schedules${selectedAcademicYearId ? `?academic_year_id=${selectedAcademicYearId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data.status === "success") {
        let responseData = response.data.data;
        if (!responseData) {
          console.log("No schedule data in response");
          setSchedules([]);
          return;
        }
        
        // Ensure responseData is an array
        if (!Array.isArray(responseData)) {
          console.log("Response data is not an array, attempting to convert:", responseData);
          if (typeof responseData === 'object') {
            responseData = [responseData];
          } else {
            responseData = [];
          }
        }
        
        // Transform schedule data with proper extraction and validation
        const processedSchedules = responseData
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => {
            console.log("Processing schedule item:", item);
            
            if (typeof item !== 'object') {
              console.log("Schedule item is not an object:", item);
              return null;
            }
            
            // Extract schedule data with various possible field names
            const schedule: Schedule = {
              id: item.id || item.schedule_id || 0,
              day: extractValue(item, ['day', 'day_name']),
              start_time: extractValue(item, ['start_time', 'startTime']),
              end_time: extractValue(item, ['end_time', 'endTime']),
              room_name: extractValue(item, ['room_name', 'roomName']),
              building_name: extractValue(item, ['building_name', 'buildingName']),
              course_name: extractValue(item, ['course_name', 'courseName']),
              course_code: extractValue(item, ['course_code', 'courseCode']),
              group_name: extractValue(item, ['group_name', 'groupName']),
              student_count: extractNumericValue(item, ['student_count', 'studentCount']),
              academic_year_name: extractValue(item, ['academic_year_name', 'academicYearName']),
              academic_year_semester: extractValue(item, ['academic_year_semester', 'academicYearSemester'])
            };
            
            // Only return schedule items with at least day and time info
            if (schedule.day && schedule.start_time) {
              return schedule;
            }
            
            return null;
          })
          .filter((schedule: Schedule | null) => schedule !== null);
        
        console.log("Processed schedules:", processedSchedules);
        setSchedules(processedSchedules as Schedule[]);
      } else {
        console.log("API returned error status:", response.data.status);
        toast.error("Gagal memuat data jadwal mengajar");
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Gagal memuat data jadwal mengajar");
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract values from various possible field names
  const extractValue = (obj: any, fieldNames: string[]): string => {
    for (const field of fieldNames) {
      if (obj[field] !== undefined && obj[field] !== null) {
        return String(obj[field]);
      }
    }
    return '';
  };

  // Helper function to extract numeric values
  const extractNumericValue = (obj: any, fieldNames: string[]): number => {
    for (const field of fieldNames) {
      if (obj[field] !== undefined && obj[field] !== null) {
        return Number(obj[field]);
      }
    }
    return 0;
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch schedules when academic year changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchMySchedules();
    }
  }, [selectedAcademicYearId]);

  // Format time for display (e.g., "14:00:00" to "14:00")
  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  // Filter schedules based on search query and selected day
  const filteredSchedules = schedules
    .filter((schedule) => {
      // Filter by day if a specific day is selected
      if (selectedDay !== 'all' && schedule.day !== selectedDay) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (schedule.course_name?.toLowerCase() || '').includes(query) ||
          (schedule.course_code?.toLowerCase() || '').includes(query) ||
          (schedule.room_name?.toLowerCase() || '').includes(query) ||
          (schedule.building_name?.toLowerCase() || '').includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by day first
      const dayA = daysOfWeek.indexOf(a.day);
      const dayB = daysOfWeek.indexOf(b.day);
      if (dayA !== dayB) return dayA - dayB;
      
      // Then sort by start time
      return a.start_time.localeCompare(b.start_time);
    });

  // Get selected academic year name for display
  const getSelectedAcademicYearName = () => {
    if (!selectedAcademicYearId) return "";
    const academicYear = academicYears.find(year => year.id.toString() === selectedAcademicYearId);
    return academicYear ? `${academicYear.name} - ${academicYear.semester}` : "";
  };
  
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
                  <h3 className="text-xl font-semibold text-[#002A5C]">Jadwal Perkuliahan</h3>
                  <p className="text-sm text-muted-foreground mt-1">Daftar jadwal perkuliahan yang Anda ampu sebagai dosen</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari jadwal..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedAcademicYearId} onValueChange={setSelectedAcademicYearId}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tahun Akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name} - {year.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="w-full md:w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Hari</SelectItem>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedules list */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-[#0687C9] animate-spin" />
                  <span className="ml-2 text-muted-foreground">Memuat data jadwal...</span>
                </div>
              ) : filteredSchedules.length > 0 ? (
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
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule, index) => (
                        <TableRow key={schedule.id} className="hover:bg-[#F9FBFC]">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{schedule.course_code || "-"}</TableCell>
                          <TableCell>{schedule.course_name || "Mata Kuliah"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getScheduleBadgeClass(schedule.day)}>
                              {schedule.day}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-[#0687C9]" />
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-[#0687C9]" />
                              {schedule.room_name || "Ruangan"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1.5 text-[#0687C9]" />
                              {schedule.student_count || 0}
                              {schedule.group_name ? ` (${schedule.group_name})` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB] hover:text-[#0687C9]"
                              onClick={() => viewScheduleDetails(schedule)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-gray-50">
                  <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-neutral-600">Belum ada jadwal mengajar</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {academicYears.length > 0
                      ? selectedDay !== 'all'
                        ? `Anda belum memiliki jadwal mengajar pada hari ${selectedDay}`
                        : "Anda belum memiliki jadwal mengajar yang ditugaskan pada tahun akademik ini"
                      : "Tidak ada data tahun akademik yang tersedia"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Schedule Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#002A5C]">Detail Jadwal</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai jadwal perkuliahan
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="space-y-6">
              <div className="bg-[#F9FBFC] p-4 rounded-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-[#002A5C] mb-2">
                  {selectedSchedule.course_name || "Mata Kuliah"}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-2 text-[#0687C9]" />
                  <span>{selectedSchedule.course_code || "-"}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Waktu Perkuliahan</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>{selectedSchedule.day}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>{formatTime(selectedSchedule.start_time)} - {formatTime(selectedSchedule.end_time)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Lokasi</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>{selectedSchedule.room_name || "Ruangan"}</span>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>{selectedSchedule.building_name || "Gedung"}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Informasi Kelas</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-[#0687C9]" />
                    <span>{selectedSchedule.student_count || 0} Mahasiswa</span>
                  </div>
                  {selectedSchedule.group_name && (
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Kelas: {selectedSchedule.group_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Tutup
                </Button>
                <Button
                  className="bg-[#0687C9] hover:bg-[#056da8]"
                  onClick={() => setShowDetails(false)}
                >
                  Kelola Presensi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Popover } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parse, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { useForm } from "react-hook-form";
import axios from "axios";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { 
  CalendarDays, 
  Clock, 
  Building, 
  Users, 
  Pencil, 
  Plus, 
  MoreHorizontal, 
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarIcon,
  Filter,
  RefreshCw,
  MapPin
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { z } from "zod";

interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
  department_name?: string;
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
}

interface Room {
  id: number;
  name: string;
  building_id: number;
  capacity: number;
  building?: {
    id: number;
    name: string;
  };
}

interface Lecturer {
  id: number;
  name: string;
  code?: string;
  email?: string;
  department_id?: number;
  department?: {
    id: number;
    name: string;
  };
}

interface StudentGroup {
  id: number;
  name: string;
  department_id: number;
  department?: {
    id: number;
    name: string;
  };
  semester: number;
  student_count: number;
}

interface AcademicYear {
  id: number;
  name: string;
  semester: "ganjil" | "genap";
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CourseSchedule {
  id: number;
  course_id: number;
  course?: Course;
  course_code?: string;
  course_name?: string;
  room_id: number;
  room?: Room;
  room_name?: string;
  building_name?: string;
  day: string;
  start_time: string;
  end_time: string;
  lecturer_id: number;
  lecturer?: Lecturer;
  lecturer_name?: string;
  student_group_id: number;
  student_group?: StudentGroup;
  student_group_name?: string;
  academic_year_id: number;
  academic_year?: AcademicYear;
  academic_year_name?: string;
  semester?: number;
  capacity: number;
  enrolled: number;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAY_MAPPING: Record<string, number> = {
  "Senin": 1,
  "Selasa": 2, 
  "Rabu": 3, 
  "Kamis": 4, 
  "Jumat": 5, 
  "Sabtu": 6, 
  "Minggu": 0
};

// Dummy data for now - will be replaced with API calls
const SAMPLE_SCHEDULES: CourseSchedule[] = [
  // Keep the existing data but update to match the new interface
  {
    id: 1,
    course_id: 101,
    course_code: "MK101",
    course_name: "Pengantar Teknologi Informasi",
    room_id: 1,
    room_name: "Ruang 101",
    building_name: "Gedung Teknik",
    day: "Senin",
    start_time: "08:00",
    end_time: "10:30",
    lecturer_id: 1,
    lecturer_name: "Dr. Ahmad Wijaya",
    student_group_id: 1,
    student_group_name: "Informatika 2023",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 1,
    capacity: 50,
    enrolled: 45
  },
  // ... other sample schedules with the updated structure
  {
    id: 2,
    course_id: 102,
    course_code: "MK201",
    course_name: "Struktur Data dan Algoritma",
    room_id: 2,
    room_name: "Ruang 203",
    building_name: "Gedung Teknik",
    day: "Selasa",
    start_time: "13:00",
    end_time: "15:30",
    lecturer_id: 2,
    lecturer_name: "Prof. Siti Rahayu",
    student_group_id: 2,
    student_group_name: "Informatika 2022",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 3,
    capacity: 40,
    enrolled: 38
  },
  {
    id: 3,
    course_id: 103,
    course_code: "MK301",
    course_name: "Basis Data Lanjut",
    room_id: 3,
    room_name: "Lab Database",
    building_name: "Gedung Informatika",
    day: "Rabu",
    start_time: "10:00",
    end_time: "12:30",
    lecturer_id: 3,
    lecturer_name: "Dr. Budi Santoso",
    student_group_id: 3,
    student_group_name: "Sistem Informasi 2022",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 3,
    capacity: 35,
    enrolled: 35
  },
  {
    id: 4,
    course_id: 104,
    course_code: "MK401",
    course_name: "Kecerdasan Buatan dan Machine Learning",
    room_id: 4,
    room_name: "Lab AI",
    building_name: "Gedung Riset",
    day: "Kamis",
    start_time: "15:00",
    end_time: "17:30",
    lecturer_id: 4,
    lecturer_name: "Dr. Dewi Pratiwi",
    student_group_id: 4,
    student_group_name: "Informatika 2021",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 5,
    capacity: 30,
    enrolled: 24
  },
  {
    id: 5,
    course_id: 105,
    course_code: "MK501",
    course_name: "Pengembangan Aplikasi Web",
    room_id: 5,
    room_name: "Lab Komputer 3",
    building_name: "Gedung Teknik",
    day: "Jumat",
    start_time: "08:00",
    end_time: "10:30",
    lecturer_id: 5,
    lecturer_name: "Prof. Rudi Hartono",
    student_group_id: 5,
    student_group_name: "Sistem Informasi 2021",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 5,
    capacity: 30,
    enrolled: 28
  },
  {
    id: 6,
    course_id: 106,
    course_code: "MK102",
    course_name: "Matematika Diskrit",
    room_id: 6,
    room_name: "Ruang 105",
    building_name: "Gedung MIPA",
    day: "Senin",
    start_time: "13:00",
    end_time: "15:30",
    lecturer_id: 6,
    lecturer_name: "Dr. Hendra Gunawan",
    student_group_id: 6,
    student_group_name: "Informatika 2023",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 1,
    capacity: 45,
    enrolled: 42
  },
  {
    id: 7,
    course_id: 107,
    course_code: "MK202",
    course_name: "Jaringan Komputer",
    room_id: 7,
    room_name: "Lab Jaringan",
    building_name: "Gedung Informatika",
    day: "Rabu",
    start_time: "13:00",
    end_time: "15:30",
    lecturer_id: 7,
    lecturer_name: "Prof. Agus Setiawan",
    student_group_id: 7,
    student_group_name: "Informatika 2022",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 3,
    capacity: 35,
    enrolled: 30
  },
  {
    id: 8,
    course_id: 108,
    course_code: "MK302",
    course_name: "Pemrograman Mobile",
    room_id: 8,
    room_name: "Lab Mobile",
    building_name: "Gedung Informatika",
    day: "Kamis",
    start_time: "10:00",
    end_time: "12:30",
    lecturer_id: 8,
    lecturer_name: "Dr. Maya Anggraini",
    student_group_id: 8,
    student_group_name: "Informatika 2021",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 5,
    capacity: 30,
    enrolled: 29
  },
  {
    id: 9,
    course_id: 109,
    course_code: "MK601",
    course_name: "Praktikum Komputasi Awan",
    room_id: 9,
    room_name: "Lab Cloud",
    building_name: "Gedung Riset",
    day: "Senin",
    start_time: "08:00",
    end_time: "11:30",
    lecturer_id: 9,
    lecturer_name: "Dr. Rini Wulandari",
    student_group_id: 9,
    student_group_name: "Informatika 2021",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 5,
    capacity: 25,
    enrolled: 20
  },
  {
    id: 10,
    course_id: 110,
    course_code: "MK602",
    course_name: "Workshop Internet of Things",
    room_id: 10,
    room_name: "Lab IoT",
    building_name: "Gedung Riset",
    day: "Senin",
    start_time: "13:00",
    end_time: "16:30",
    lecturer_id: 10,
    lecturer_name: "Prof. Bambang Supriyanto",
    student_group_id: 10,
    student_group_name: "Sistem Informasi 2021",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 5,
    capacity: 25,
    enrolled: 23
  },
  {
    id: 11,
    course_id: 111,
    course_code: "MK103",
    course_name: "Praktikum Pemrograman Dasar",
    room_id: 11,
    room_name: "Lab Komputer 1",
    building_name: "Gedung Teknik",
    day: "Sabtu",
    start_time: "08:00",
    end_time: "10:30",
    lecturer_id: 11,
    lecturer_name: "Dr. Anita Permatasari",
    student_group_id: 11,
    student_group_name: "Informatika 2023",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 1,
    capacity: 40,
    enrolled: 40
  },
  {
    id: 12,
    course_id: 112,
    course_code: "MK203",
    course_name: "Workshop Desain UI/UX",
    room_id: 12,
    room_name: "Studio Desain",
    building_name: "Gedung Multimedia",
    day: "Sabtu",
    start_time: "13:00",
    end_time: "16:30",
    lecturer_id: 12,
    lecturer_name: "Dr. Ratna Kusuma",
    student_group_id: 12,
    student_group_name: "Sistem Informasi 2022",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 3,
    capacity: 30,
    enrolled: 28
  },
  {
    id: 13,
    course_id: 113,
    course_code: "MK104",
    course_name: "Bahasa Inggris untuk IT",
    room_id: 13,
    room_name: "Ruang 201",
    building_name: "Gedung Bahasa",
    day: "Sabtu",
    start_time: "10:30",
    end_time: "12:30",
    lecturer_id: 13,
    lecturer_name: "Dr. Sarah Johnson",
    student_group_id: 13,
    student_group_name: "Informatika 2023",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 1,
    capacity: 45,
    enrolled: 40
  },
  {
    id: 14,
    course_id: 114,
    course_code: "MK303",
    course_name: "Seminar Teknologi Terkini",
    room_id: 14,
    room_name: "Auditorium",
    building_name: "Gedung Multimedia",
    day: "Minggu",
    start_time: "09:00",
    end_time: "12:00",
    lecturer_id: 14,
    lecturer_name: "Prof. Darmawan Pratama",
    student_group_id: 14,
    student_group_name: "Informatika 2022",
    academic_year_id: 1,
    academic_year_name: "2023/2024",
    semester: 3,
    capacity: 60,
    enrolled: 55
  }
];

export default function ScheduleManagePage() {
  // State for schedules data
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for related data
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(true);
  
  // State for lecturer search
  const [lecturerSearchTerm, setLecturerSearchTerm] = useState("");
  const [searchedLecturers, setSearchedLecturers] = useState<any[]>([]);
  const [showLecturerResults, setShowLecturerResults] = useState(false);
  const [searchingLecturers, setSearchingLecturers] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<any | null>(null);
  
  // State for current date and dialog visibility
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<CourseSchedule | null>(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null);
  const [lecturerFilter, setLecturerFilter] = useState<number | null>(null);
  const [courseFilter, setCourseFilter] = useState<number | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<number | null>(null);
  
  // Extract unique values for filters
  const uniqueBuildings = Array.from(new Set(schedules.map(s => s.building_name))).filter(Boolean) as string[];
  const uniqueSemesters = Array.from(new Set(schedules.map(s => s.semester))).filter(Boolean) as number[];
  const uniqueLecturers = Array.from(new Set(schedules.map(s => s.lecturer_name))).filter(Boolean) as string[];
  const uniqueCourses = Array.from(new Set(schedules.map(s => s.course_name))).filter(Boolean) as string[];

  // API functions
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await api('/admin/schedules', {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setSchedules(response.data);
      } else {
        toast.error("Gagal memuat jadwal", {
          description: "Terjadi kesalahan saat memuat data jadwal perkuliahan"
        });
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Gagal memuat jadwal", {
        description: "Terjadi kesalahan saat memuat data jadwal perkuliahan"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch schedules with filters applied via query parameters
  const fetchFilteredSchedules = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      
      if (academicYearFilter) {
        params.append('academic_year_id', academicYearFilter.toString());
      }
      
      if (lecturerFilter) {
        params.append('lecturer_id', lecturerFilter.toString());
      }
      
      if (dayFilter) {
        params.append('day', dayFilter);
      }
      
      if (buildingFilter) {
        params.append('building_id', buildingFilter);
      }
      
      if (courseFilter) {
        params.append('course_id', courseFilter.toString());
      }
      
      // Construct URL with query parameters
      const url = `/admin/schedules${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await api(url, {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setSchedules(response.data);
      } else {
        toast.error("Gagal memuat jadwal", {
          description: "Terjadi kesalahan saat memuat jadwal dengan filter"
        });
      }
    } catch (error) {
      console.error("Error fetching filtered schedules:", error);
      toast.error("Gagal memuat jadwal", {
        description: "Terjadi kesalahan saat memuat jadwal dengan filter"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to search lecturers by search term
  const searchLecturers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchedLecturers([]);
      setShowLecturerResults(false);
      return;
    }
    
    setShowLecturerResults(true);
    setSearchingLecturers(true);
    
    try {
      const response = await api(`/admin/lecturers/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET'
      });
      
      if (response.status === "success") {
        setSearchedLecturers(response.data);
      } else {
        console.error("Failed to search lecturers:", response);
        setSearchedLecturers([]);
      }
    } catch (error) {
      console.error("Error searching lecturers:", error);
      setSearchedLecturers([]);
    } finally {
      setSearchingLecturers(false);
    }
  };
  
  // Function to select lecturer from search results
  const selectLecturer = (lecturer: any) => {
    setSelectedLecturer(lecturer);
    
    // If we're in add form
    if (showAddDialog) {
      addForm.setValue("lecturer_id", lecturer.id.toString());
    }
    
    // If we're in edit form
    if (showEditDialog) {
      editForm.setValue("lecturer_id", lecturer.id.toString());
    }
    
    setLecturerSearchTerm(lecturer.full_name || lecturer.name);
    setShowLecturerResults(false);
  };

  // Function to check schedule conflicts before saving
  const checkScheduleConflicts = async (scheduleData: any, scheduleId?: number) => {
    try {
      const endpoint = '/admin/schedules/check-conflicts';
      const body = {
        ...scheduleData,
        schedule_id: scheduleId
      };
      
      const response = await api(endpoint, {
        method: 'POST',
        body
      });
      
      if (response.status === "success") {
        const conflicts = response.data;
        
        // Check if any conflicts exist
        const hasConflicts = Object.values(conflicts).some(value => !!value);
        
        if (hasConflicts) {
          let conflictMessage = "Konflik jadwal terdeteksi:";
          
          if (conflicts.room) {
            conflictMessage += "\n- Ruangan sudah digunakan pada waktu tersebut";
          }
          
          if (conflicts.lecturer) {
            conflictMessage += "\n- Dosen sudah dijadwalkan pada waktu tersebut";
          }
          
          if (conflicts.student_group) {
            conflictMessage += "\n- Kelompok mahasiswa sudah memiliki jadwal pada waktu tersebut";
          }
          
          toast.error("Konflik jadwal", {
            description: conflictMessage
          });
          
          return true; // Has conflicts
        }
        
        return false; // No conflicts
      } else {
        toast.error("Gagal memeriksa konflik jadwal");
        return true; // Treat as conflict to prevent save
      }
    } catch (error) {
      console.error("Error checking schedule conflicts:", error);
      toast.error("Gagal memeriksa konflik jadwal");
      return true; // Treat as conflict to prevent save
    }
  };

  // Function to handle adding a new schedule
  const handleAddSchedule = async (data: any) => {
    setIsSubmitting(true);
    try {
      // First check for conflicts
      const hasConflicts = await checkScheduleConflicts(data);
      
      if (hasConflicts) {
        setIsSubmitting(false);
        return;
      }
      
      const response = await api('/admin/schedules', {
        method: 'POST',
        body: data,
      });
      
      if (response.status === "success") {
        toast.success("Jadwal berhasil ditambahkan", {
          description: "Jadwal perkuliahan baru telah berhasil ditambahkan"
        });
        setShowAddDialog(false);
        fetchSchedules(); // Refresh the schedule list
      } else {
        toast.error("Gagal menambahkan jadwal", {
          description: response.message || "Terjadi kesalahan saat menambahkan jadwal baru"
        });
      }
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      toast.error("Gagal menambahkan jadwal", {
        description: error.message || "Terjadi kesalahan saat menambahkan jadwal baru"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle editing a schedule
  const handleEditSchedule = async (data: any) => {
    setIsSubmitting(true);
    try {
      // First check for conflicts
      const hasConflicts = await checkScheduleConflicts(data, currentSchedule?.id);
      
      if (hasConflicts) {
        setIsSubmitting(false);
        return;
      }
      
      const response = await api(`/admin/schedules/${currentSchedule?.id}`, {
        method: 'PUT',
        body: data,
      });
      
      if (response.status === "success") {
        toast.success("Jadwal berhasil diperbarui", {
          description: "Jadwal perkuliahan telah berhasil diperbarui"
        });
        setShowEditDialog(false);
        fetchSchedules(); // Refresh the schedule list
      } else {
        toast.error("Gagal memperbarui jadwal", {
          description: response.message || "Terjadi kesalahan saat memperbarui jadwal"
        });
      }
    } catch (error: any) {
      console.error("Error updating schedule:", error);
      toast.error("Gagal memperbarui jadwal", {
        description: error.message || "Terjadi kesalahan saat memperbarui jadwal"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle deleting a schedule
  const handleDeleteSchedule = async () => {
    if (!currentSchedule) {
      toast.error("Tidak dapat menghapus jadwal", {
        description: "Data jadwal tidak valid"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api(`/admin/schedules/${currentSchedule.id}`, {
        method: 'DELETE',
      });
      
      if (response.status === "success") {
        toast.success("Jadwal berhasil dihapus", {
          description: "Jadwal perkuliahan telah berhasil dihapus"
        });
        setShowDeleteDialog(false);
        fetchSchedules(); // Refresh the schedule list
      } else {
        toast.error("Gagal menghapus jadwal", {
          description: response.message || "Terjadi kesalahan saat menghapus jadwal"
        });
      }
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast.error("Gagal menghapus jadwal", {
        description: error.message || "Terjadi kesalahan saat menghapus jadwal"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch courses
  const fetchCourses = async () => {
    try {
      const response = await api('/admin/courses', {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setCourses(response.data);
        
        // Show warning if no courses are available
        if (response.data.length === 0) {
          toast.warning("Tidak ada mata kuliah tersedia", {
            description: "Silakan tambahkan mata kuliah terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data mata kuliah");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Gagal memuat data mata kuliah");
    }
  };

  // Function to fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await api('/admin/rooms', {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setRooms(response.data);
        
        // Show warning if no rooms are available
        if (response.data.length === 0) {
          toast.warning("Tidak ada ruangan tersedia", {
            description: "Silakan tambahkan ruangan terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data ruangan");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Gagal memuat data ruangan");
    }
  };

  // Function to fetch lecturers
  const fetchLecturers = async () => {
    try {
      const response = await api('/admin/lecturers', {
        method: 'GET',
      });
      
      if (response.status === "success" || (response.data && Array.isArray(response.data))) {
        // Map the response data to match our Lecturer interface
        const formattedLecturers = response.data.map((lecturer: any) => ({
          id: lecturer.id,
          name: lecturer.full_name || lecturer.FullName || lecturer.name || lecturer.username || `Dosen ID: ${lecturer.id}`,
          code: lecturer.nidn || lecturer.NIDN || lecturer.nip || lecturer.NIP,
          email: lecturer.email || lecturer.Email,
          department_id: lecturer.study_program_id || lecturer.StudyProgramID,
          department: {
            id: lecturer.study_program_id || lecturer.StudyProgramID || 0,
            name: lecturer.study_program_name || lecturer.StudyProgramName || lecturer.prodi || ""
          }
        }));
        
        setLecturers(formattedLecturers);
        
        // Show warning if no lecturers are available
        if (formattedLecturers.length === 0) {
          toast.warning("Tidak ada dosen tersedia", {
            description: "Silakan tambahkan dosen terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data dosen");
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
      toast.error("Gagal memuat data dosen");
    }
  };

  // Function to fetch student groups
  const fetchStudentGroups = async () => {
    try {
      const response = await api('/admin/student-groups', {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setStudentGroups(response.data);
        
        // Show warning if no student groups are available
        if (response.data.length === 0) {
          toast.warning("Tidak ada kelompok mahasiswa tersedia", {
            description: "Silakan tambahkan kelompok mahasiswa terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data kelompok mahasiswa");
      }
    } catch (error) {
      console.error("Error fetching student groups:", error);
      toast.error("Gagal memuat data kelompok mahasiswa");
    }
  };

  // Function to fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await api('/admin/academic-years', {
        method: 'GET',
      });
      
      if (response.status === "success") {
        setAcademicYears(response.data);
        
        // Show warning if no academic years are available
        if (response.data.length === 0) {
          toast.warning("Tidak ada tahun akademik tersedia", {
            description: "Silakan tambahkan tahun akademik terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data tahun akademik");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun akademik");
    }
  };

  // Fetch all necessary data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchCourses(),
        fetchRooms(),
        fetchLecturers(),
        fetchStudentGroups(),
        fetchAcademicYears()
      ]);
      setLoadingRelatedData(false);
      fetchSchedules();
    };
    
    loadAllData();
  }, []);

  // Setup edit schedule
  const setupEditSchedule = (schedule: CourseSchedule) => {
    setCurrentSchedule(schedule);
    setShowEditDialog(true);
    
    // Set the lecturer search term when editing
    if (schedule.lecturer_name) {
      setLecturerSearchTerm(schedule.lecturer_name);
      setSelectedLecturer({
        id: schedule.lecturer_id,
        full_name: schedule.lecturer_name
      });
    }
  };
  
  // Setup delete schedule
  const setupDeleteSchedule = (schedule: CourseSchedule) => {
    setCurrentSchedule(schedule);
    setShowDeleteDialog(true);
  };

  // Calendar navigation functions
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  // Get current week range for display
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as week start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const formattedWeekRange = `${format(weekStart, 'd MMMM')} - ${format(weekEnd, 'd MMMM yyyy')}`;

  // Filter schedules based on user criteria
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      (schedule.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (schedule.course_code?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (schedule.lecturer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (schedule.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesDay = !dayFilter || dayFilter === "all" || schedule.day === dayFilter;
    const matchesBuilding = !buildingFilter || buildingFilter === "all" || schedule.building_name === buildingFilter;
    const matchesSemester = !semesterFilter || schedule.semester === semesterFilter;
    const matchesLecturer = !lecturerFilter || schedule.lecturer_id === lecturerFilter;
    const matchesCourse = !courseFilter || schedule.course_id === courseFilter;
    const matchesAcademicYear = !academicYearFilter || schedule.academic_year_id === academicYearFilter;
    
    return matchesSearch && matchesDay && matchesBuilding && matchesSemester && 
           matchesLecturer && matchesCourse && matchesAcademicYear;
  });

  // Group schedules by day for calendar view
  const schedulesByDay = DAYS.reduce<Record<string, CourseSchedule[]>>((acc, day) => {
    acc[day] = filteredSchedules.filter(schedule => schedule.day === day);
    return acc;
  }, {});

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setDayFilter(null);
    setBuildingFilter(null);
    setSemesterFilter(null);
    setLecturerFilter(null);
    setCourseFilter(null);
    setAcademicYearFilter(null);
    
    // Fetch all schedules without filters
    fetchSchedules();
  };

  // Forms for adding/editing schedules
  const addForm = useForm({
    defaultValues: {
      course_id: "",
      room_id: "",
      day: "",
      start_time: "",
      end_time: "",
      lecturer_id: "",
      student_group_id: "",
      academic_year_id: "",
    }
  });

  const editForm = useForm({
    defaultValues: {
      course_id: "",
      room_id: "",
      day: "",
      start_time: "",
      end_time: "",
      lecturer_id: "",
      student_group_id: "",
      academic_year_id: "",
    }
  });

  // Clear lecturer search when dialogs close
  useEffect(() => {
    if (!showAddDialog && !showEditDialog) {
      setSearchedLecturers([]);
      setShowLecturerResults(false);
    }
  }, [showAddDialog, showEditDialog]);

  useEffect(() => {
    if (currentSchedule) {
      // Populate edit form with current schedule data
      editForm.reset({
        student_group_id: currentSchedule.student_group_id?.toString() || "",
        academic_year_id: currentSchedule.academic_year_id?.toString() || "",
        lecturer_id: currentSchedule.lecturer_id?.toString() || "",
        course_id: currentSchedule.course_id?.toString() || "",
        day: currentSchedule.day || "",
        start_time: currentSchedule.start_time || "",
        end_time: currentSchedule.end_time || "",
        room_id: currentSchedule.room_id?.toString() || ""
      });
      
      // Set the selected lecturer for display
      if (currentSchedule.lecturer_id && currentSchedule.lecturer_name) {
        setSelectedLecturer({
          id: currentSchedule.lecturer_id,
          full_name: currentSchedule.lecturer_name,
          name: currentSchedule.lecturer_name
        });
      }
    }
  }, [currentSchedule, editForm]);

  return (
    <div className="container p-4 mx-auto space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
        <div>
              <CardTitle className="text-2xl font-bold flex items-center">
            <CalendarDays className="mr-2 h-6 w-6 text-[#0687C9]" />
            Jadwal Perkuliahan
              </CardTitle>
              <CardDescription className="mt-1">
            Kelola jadwal perkuliahan untuk semester aktif
              </CardDescription>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Perkuliahan</DialogTitle>
              <DialogDescription>
                Masukkan detail jadwal baru yang ingin ditambahkan.
              </DialogDescription>
            </DialogHeader>
            
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(handleAddSchedule)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="course_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mata Kuliah</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih mata kuliah" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses.length > 0 ? (
                                  courses.map(course => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                      {course.code} - {course.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Memuat data mata kuliah...
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hari</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                              </FormControl>
                  <SelectContent>
                                {DAYS.map(day => (
                                  <SelectItem key={day} value={day}>
                                    {day}
                                  </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="start_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jam Mulai</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="end_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jam Selesai</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="room_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ruangan</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                  <SelectTrigger>
                                  <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                              </FormControl>
                  <SelectContent>
                                {rooms.length > 0 ? (
                                  rooms.map(room => (
                                    <SelectItem key={room.id} value={room.id.toString()}>
                                      {room.name}, {room.building?.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Memuat data ruangan...
                                  </SelectItem>
                                )}
                  </SelectContent>
                </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="lecturer_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosen</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  placeholder="Cari dosen..." 
                                  value={lecturerSearchTerm}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setLecturerSearchTerm(value);
                                    searchLecturers(value);
                                  }}
                                  className="w-full"
                                />
                              </FormControl>
                              
                              {showLecturerResults && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto min-w-[300px]">
                                  {searchingLecturers ? (
                                    <div className="flex items-center justify-center p-4">
                                      <Loader2 className="h-5 w-5 animate-spin text-gray-500 mr-2" />
                                      <span className="text-sm text-gray-500">Mencari dosen...</span>
                                    </div>
                                  ) : searchedLecturers.length > 0 ? (
                                    <ul className="py-1">
                                      {searchedLecturers.map((lecturer) => (
                                        <li 
                                          key={lecturer.id} 
                                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                          onClick={() => selectLecturer(lecturer)}
                                        >
                                          <div className="font-medium">{lecturer.full_name}</div>
                                          <div className="text-xs text-gray-500 flex items-center">
                                            <span className="mr-2">{lecturer.nidn || lecturer.nip || ""}</span>
                                            {lecturer.program && (
                                              <span>{lecturer.program}</span>
                                            )}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : lecturerSearchTerm.length >= 2 ? (
                                    <div className="p-3 text-center text-sm text-gray-500">
                                      Tidak ada dosen yang ditemukan.
                                    </div>
                                  ) : (
                                    <div className="p-3 text-center text-sm text-gray-500">
                                      Ketik minimal 2 karakter untuk mencari dosen.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <input type="hidden" {...field} />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="student_group_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kelas/Kelompok</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kelompok mahasiswa" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {studentGroups.length > 0 ? (
                                  studentGroups.map(group => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                      {group.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Memuat data kelompok...
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="academic_year_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tahun Akademik</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                  <SelectTrigger>
                                  <SelectValue placeholder="Pilih tahun akademik" />
                  </SelectTrigger>
                              </FormControl>
                  <SelectContent>
                                {academicYears.length > 0 ? (
                                  academicYears.map(year => (
                                    <SelectItem key={year.id} value={year.id.toString()}>
                                      {year.name} ({year.semester})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="loading" disabled>
                                    Memuat data tahun akademik...
                                  </SelectItem>
                                )}
                  </SelectContent>
                </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
            </div>
            
            <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddDialog(false)}
                      >
                Batal
              </Button>
                      <Button 
                        type="submit"
                        className="bg-[#0687C9] hover:bg-[#0670a8]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          "Simpan Jadwal"
                        )}
              </Button>
            </DialogFooter>
                  </form>
                </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Jadwal</TabsTrigger>
          <TabsTrigger value="calendar">Tampilan Kalender</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div className="flex-1 relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                        placeholder="Cari jadwal berdasarkan nama, kode, atau dosen..."
                        className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select
                  value={dayFilter || "all"}
                  onValueChange={(value) => setDayFilter(value === "all" ? null : value)}
                >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Hari</SelectItem>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={buildingFilter || "all"}
                  onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gedung</SelectItem>
                    {uniqueBuildings.map((building) => (
                      <SelectItem key={building} value={building}>{building}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={semesterFilter?.toString() || "all"}
                        onValueChange={(value) => setSemesterFilter(value === "all" ? null : Number(value))}
                >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Semester</SelectItem>
                    {uniqueSemesters.map((semester) => (
                            <SelectItem key={semester} value={semester.toString()}>
                              Semester {semester}
                            </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0687C9] mb-2" />
                        <p className="text-muted-foreground">Memuat data jadwal perkuliahan...</p>
                      </div>
                    ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                    <TableHead className="w-[100px] font-bold text-black">Kode</TableHead>
                    <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                    <TableHead className="font-bold text-black">Jadwal</TableHead>
                    <TableHead className="font-bold text-black">Ruangan</TableHead>
                    <TableHead className="font-bold text-black">Dosen</TableHead>
                    <TableHead className="font-bold text-black">Kelompok Mahasiswa</TableHead>
                    <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.length === 0 ? (
                    <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                {searchQuery || dayFilter || buildingFilter || semesterFilter ? (
                                  "Tidak ada jadwal yang sesuai dengan filter"
                                ) : (
                                  "Belum ada jadwal perkuliahan yang ditambahkan"
                                )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((schedule, index) => (
                      <TableRow key={schedule.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                                  {schedule.course_code}
                        </TableCell>
                        <TableCell>
                          <div>
                                    <p>{schedule.course_name}</p>
                            <p className="text-xs text-muted-foreground">
                                      Semester {schedule.semester} - {schedule.academic_year_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{schedule.day}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                                      <span>{schedule.start_time} - {schedule.end_time}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Building className="mr-1 h-4 w-4 text-muted-foreground" />
                                      <span>{schedule.building_name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                      {schedule.room_name}
                            </span>
                          </div>
                        </TableCell>
                                <TableCell>{schedule.lecturer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                                    <span>{schedule.student_group_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                        onClick={() => setupEditSchedule(schedule)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                        onClick={() => setupDeleteSchedule(schedule)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
                    )}
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4 border-b bg-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap gap-2 flex-grow max-w-3xl">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Cari jadwal..."
                      className="pl-9 w-full md:w-64 bg-white text-sm h-9 shadow-sm border-gray-200 focus-visible:ring-[#0687C9]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 text-xs font-normal shadow-sm flex gap-1.5 bg-white border-gray-200">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                        Filter
                        {(buildingFilter || semesterFilter || lecturerFilter || academicYearFilter) && (
                          <Badge className="ml-1 h-5 bg-[#0687C9]">{
                            [buildingFilter, semesterFilter, lecturerFilter, academicYearFilter]
                              .filter(Boolean).length
                          }</Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Filter Jadwal</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="building" className="text-xs">Gedung</Label>
                    <Select
                      value={buildingFilter || "all"}
                      onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                    >
                                <SelectTrigger id="building" className="bg-white h-8 text-xs">
                                  <SelectValue placeholder="Semua Gedung" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Gedung</SelectItem>
                        {uniqueBuildings.map((building) => (
                          <SelectItem key={building} value={building}>{building}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                            </div>
                            <div>
                              <Label htmlFor="semester" className="text-xs">Semester</Label>
                    <Select
                      value={semesterFilter?.toString() || "all"}
                                onValueChange={(value) => setSemesterFilter(value === "all" ? null : Number(value))}
                    >
                                <SelectTrigger id="semester" className="bg-white h-8 text-xs">
                                  <SelectValue placeholder="Semua Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Semester</SelectItem>
                        {uniqueSemesters.map((semester) => (
                                    <SelectItem key={semester} value={semester.toString()}>
                                      Semester {semester}
                                    </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                            </div>
                            <div>
                              <Label htmlFor="lecturer" className="text-xs">Dosen</Label>
                              <Select
                                value={lecturerFilter?.toString() || "all"}
                                onValueChange={(value) => setLecturerFilter(value === "all" ? null : Number(value))}
                              >
                                <SelectTrigger id="lecturer" className="bg-white h-8 text-xs">
                                  <SelectValue placeholder="Semua Dosen" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Semua Dosen</SelectItem>
                                  {uniqueLecturers.map(lecturer => (
                                    <SelectItem key={lecturer} value={lecturer}>{lecturer}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="academic-year" className="text-xs">Tahun Akademik</Label>
                              <Select
                                value={academicYearFilter?.toString() || "all"}
                                onValueChange={(value) => setAcademicYearFilter(value === "all" ? null : Number(value))}
                              >
                                <SelectTrigger id="academic-year" className="bg-white h-8 text-xs">
                                  <SelectValue placeholder="Semua T.A." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Semua Tahun Akademik</SelectItem>
                                  {schedules.map(s => s.academic_year_id)
                                    .filter((id, index, self) => self.indexOf(id) === index)
                                    .map(id => {
                                      const academicYear = schedules.find(s => s.academic_year_id === id);
                                      return academicYear ? (
                                        <SelectItem key={id} value={id.toString()}>
                                          {academicYear.academic_year_name}
                                        </SelectItem>
                                      ) : null;
                                    })
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-8">
                            Reset Filter
                          </Button>
                          <Button 
                            size="sm" 
                            className="text-xs h-8 bg-[#0687C9] hover:bg-[#0670a8]"
                            onClick={fetchFilteredSchedules}
                          >
                            Terapkan
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  </div>
                  
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-md border bg-white p-1 shadow-sm">
                    <Button 
                      variant={calendarView === 'week' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCalendarView('week')}
                      className={`text-xs rounded-sm ${calendarView === 'week' ? 'bg-[#0687C9] text-white' : 'text-gray-700'}`}
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      Minggu
                    </Button>
                    <Button 
                      variant={calendarView === 'day' ? 'default' : 'ghost'} 
                      size="sm"
                      onClick={() => setCalendarView('day')}
                      className={`text-xs rounded-sm ${calendarView === 'day' ? 'bg-[#0687C9] text-white' : 'text-gray-700'}`}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      Hari
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToToday}
                    className="text-xs h-8 shadow-sm hover:bg-[#0687C9]/10"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                      Hari Ini
                    </Button>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                      onClick={goToPreviousWeek}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      </Button>
                    <div className="px-3 py-1.5 text-sm font-medium bg-white border rounded-md shadow-sm">
                      {formattedWeekRange}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                      onClick={goToNextWeek}
                    >
                      <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-[#0687C9]"></div>
                    <span>Teknik Informatika</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                    <span>Sistem Informasi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                    <span>T. Elektro</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                    <span>Manajemen</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
                    <span>Akuntansi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-sm bg-gray-500"></div>
                    <span>Lainnya</span>
                    </div>
                  </div>
                </div>
                
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0687C9] mb-2" />
                  <p className="text-muted-foreground">Memuat data jadwal perkuliahan...</p>
                </div>
              ) : (
                <div className="min-h-[700px]">
                  {calendarView === 'week' ? (
                    <>
                      {/* Week View */}
                      {/* Day headers */}
                      <div className="grid grid-cols-7 border-b">
                        {DAYS.map((day, index) => {
                          const isToday = day === format(new Date(), 'EEEE', { locale: id }).charAt(0).toUpperCase() + 
                            format(new Date(), 'EEEE', { locale: id }).slice(1);
                          const currentDay = addDays(weekStart, index);
                          
                          return (
                            <div key={day} className={`py-3 text-center ${index < 6 ? 'border-r' : ''} ${isToday ? 'bg-blue-50' : ''}`}>
                              <div className={`text-sm font-bold ${isToday ? 'text-[#0687C9]' : 'text-gray-700'}`}>
                      {day}
                    </div>
                              <div className={`text-xs mt-1 ${isToday ? 'text-[#0687C9] font-medium' : 'text-gray-500'}`}>
                                {format(currentDay, 'd MMM')}
                              </div>
                            </div>
                          );
                        })}
                </div>
                
                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 min-h-[650px]">
                        {DAYS.map((day, i) => {
                          const isToday = day === format(new Date(), 'EEEE', { locale: id }).charAt(0).toUpperCase() + 
                            format(new Date(), 'EEEE', { locale: id }).slice(1);
                          const daySchedules = schedulesByDay[day] || [];
                          const sortedSchedules = daySchedules.sort((a, b) => 
                            a.start_time.localeCompare(b.start_time)
                          );
                          
                          // Group schedules by time blocks for better visualization
                          const timeBlocks: Record<string, CourseSchedule[]> = {};
                          sortedSchedules.forEach(schedule => {
                            const timeKey = `${schedule.start_time}-${schedule.end_time}`;
                            if (!timeBlocks[timeKey]) {
                              timeBlocks[timeKey] = [];
                            }
                            timeBlocks[timeKey].push(schedule);
                          });
                          
                          return (
                            <div 
                              key={`day-column-${day}`} 
                              className={`relative border-r border-b min-h-full ${
                                isToday ? 'bg-blue-50/40' : ''
                              }`}
                            >
                              {/* Time blocks for this day */}
                              <div className="absolute inset-0 p-1 overflow-y-auto pb-16">
                                {Object.entries(timeBlocks).length > 0 ? (
                                  Object.entries(timeBlocks).map(([timeKey, schedules], blockIndex) => (
                                    <div 
                                      key={`time-block-${day}-${timeKey}`} 
                                      className="mb-3 px-1"
                                    >
                                      <div className="text-xs text-gray-500 font-medium mb-1.5 flex items-center bg-gray-50/80 py-1 px-1.5 rounded">
                                        <Clock className="h-3 w-3 mr-1.5 text-[#0687C9]" />
                                        {schedules[0].start_time} - {schedules[0].end_time}
                                      </div>
                        <div className="space-y-2">
                                        {schedules.map((schedule, idx) => {
                                          // Determine class color based on department or course type
                                          let borderColor = 'border-[#0687C9]';
                                          let hoverColor = 'hover:bg-blue-50';
                                          let bgColor = 'bg-white';
                                          let textColor = 'text-[#0687C9]';
                                          
                                          if (schedule.course_name?.includes('Informatika') || schedule.student_group_name?.includes('Informatika')) {
                                            borderColor = 'border-[#0687C9]';
                                            hoverColor = 'hover:bg-blue-50';
                                            textColor = 'text-[#0687C9]';
                                          } else if (schedule.course_name?.includes('Sistem') || schedule.student_group_name?.includes('Sistem Informasi')) {
                                            borderColor = 'border-purple-500';
                                            hoverColor = 'hover:bg-purple-50';
                                            textColor = 'text-purple-500';
                                          } else if (schedule.course_name?.includes('Elektro') || schedule.student_group_name?.includes('Elektro')) {
                                            borderColor = 'border-amber-500';
                                            hoverColor = 'hover:bg-amber-50';
                                            textColor = 'text-amber-500';
                                          } else if (schedule.course_name?.includes('Manajemen') || schedule.student_group_name?.includes('Manajemen')) {
                                            borderColor = 'border-emerald-500';
                                            hoverColor = 'hover:bg-emerald-50';
                                            textColor = 'text-emerald-500';
                                          } else if (schedule.course_name?.includes('Akuntansi') || schedule.student_group_name?.includes('Akuntansi')) {
                                            borderColor = 'border-rose-500';
                                            hoverColor = 'hover:bg-rose-50';
                                            textColor = 'text-rose-500';
                                          } else {
                                            // Fallback to modulo-based coloring
                                            if (schedule.course_id % 5 === 0) {
                                              borderColor = 'border-purple-500';
                                              hoverColor = 'hover:bg-purple-50';
                                              textColor = 'text-purple-500';
                                            } else if (schedule.course_id % 4 === 0) {
                                              borderColor = 'border-amber-500';
                                              hoverColor = 'hover:bg-amber-50';
                                              textColor = 'text-amber-500';
                                            } else if (schedule.course_id % 3 === 0) {
                                              borderColor = 'border-emerald-500';
                                              hoverColor = 'hover:bg-emerald-50';
                                              textColor = 'text-emerald-500';
                                            } else if (schedule.course_id % 2 === 0) {
                                              borderColor = 'border-rose-500';
                                              hoverColor = 'hover:bg-rose-50';
                                              textColor = 'text-rose-500';
                                            } else {
                                              borderColor = 'border-[#0687C9]';
                                              hoverColor = 'hover:bg-blue-50';
                                              textColor = 'text-[#0687C9]';
                                            }
                                          }
                                          
                                          return (
                                            <div
                                              key={`schedule-${schedule.id}`}
                                              onClick={() => setupEditSchedule(schedule)}
                                              className={`p-2 rounded-md ${bgColor} border-l-4 shadow-sm ${hoverColor} transition-all cursor-pointer ${borderColor} group`}
                                            >
                                              <div className="flex flex-col">
                                                <div className="font-semibold text-sm truncate mb-1 group-hover:text-gray-900">
                                                  {schedule.course_name}
                                </div>
                                                <div className={`text-xs font-medium mb-1 ${textColor}`}>
                                                  {schedule.course_code}
                                </div>
                                                
                                                <div className="flex flex-col space-y-1.5 mt-1">
                                                  <div className="flex items-center text-xs text-gray-600">
                                                    <Users className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span className="truncate max-w-[120px]">{schedule.lecturer_name}</span>
                                </div>
                                                  <div className="flex items-center text-xs text-gray-600">
                                                    <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span className="truncate max-w-[150px]">{schedule.room_name}</span>
                              </div>
                                                  <div className="flex items-center text-xs text-gray-600">
                                                    <BookOpen className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span className="truncate max-w-[150px]">{schedule.student_group_name}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-xs text-gray-400 italic border border-dashed p-4 rounded-md w-full text-center">
                              Tidak ada jadwal
                                    </div>
                            </div>
                          )}
                        </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    // Day View
                    <div className="p-4 pb-6">
                      <div className="mb-6 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#0687C9]/10 flex items-center justify-center mr-4">
                            <CalendarDays className="h-5 w-5 text-[#0687C9]" />
                          </div>
                          <div>
                            <div className="text-xl font-semibold text-gray-800">
                              {format(currentDate, 'EEEE', { locale: id })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(currentDate, 'd MMMM yyyy', { locale: id })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => {
                              setCurrentDate(addDays(currentDate, -1));
                            }}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => {
                              setCurrentDate(addDays(currentDate, 1));
                            }}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {(() => {
                          const dayName = format(currentDate, 'EEEE', { locale: id });
                          const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                          const daySchedules = schedulesByDay[capitalized] || [];
                          
                          if (daySchedules.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-blue-50/50 to-white rounded-lg border border-dashed">
                                <CalendarDays className="h-16 w-16 text-gray-300 mb-3" />
                                <p className="text-gray-600 font-medium">Tidak ada jadwal untuk hari ini</p>
                                <p className="text-xs text-gray-500 mt-1">Pilih hari lain atau tambahkan jadwal baru</p>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-4 bg-white"
                                  onClick={() => setShowAddDialog(true)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Tambah Jadwal Baru
                                </Button>
                              </div>
                            );
                          }
                          
                          // Group by hour blocks for day view
                          const hourBlocks: {[key: string]: CourseSchedule[]} = {};
                          const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
                                             "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
                          
                          timeSlots.forEach(timeSlot => {
                            hourBlocks[timeSlot] = daySchedules.filter(schedule => {
                              const start = schedule.start_time;
                              return start.startsWith(timeSlot.slice(0, 2));
                            });
                          });
                          
                          return (
                            <div className="relative border rounded-lg shadow-sm overflow-hidden">
                              {/* Time guide */}
                              <div className="absolute top-0 left-0 bottom-0 w-20 bg-gray-50 border-r z-10">
                                {timeSlots.map((timeSlot, index) => (
                                  <div key={`time-label-${timeSlot}`} className="relative">
                                    <div className="h-16 flex items-center justify-center border-b last:border-b-0">
                                      <div className="text-xs font-medium text-gray-500">{timeSlot}</div>
                      </div>
                    </div>
                  ))}
                </div>
                              
                              {/* Main schedule content */}
                              <div className="ml-20">
                                {timeSlots.map((timeSlot, index) => {
                                  const schedules = hourBlocks[timeSlot];
                                  const hasSchedules = schedules.length > 0;
                                  
                                  return (
                                    <div key={`hour-${timeSlot}`} className="relative">
                                      <div className="h-16 border-b last:border-b-0 group flex">
                                        {/* Hour background with grid lines */}
                                        <div className="absolute inset-0 border-l border-dashed border-gray-100 grid grid-cols-4 w-full pointer-events-none">
                                          <div className="border-r border-dashed border-gray-100"></div>
                                          <div className="border-r border-dashed border-gray-100"></div>
                                          <div className="border-r border-dashed border-gray-100"></div>
                                          <div></div>
              </div>
                                        
                                        {/* Schedule content */}
                                        <div className={`w-full px-4 py-2 ${hasSchedules ? 'flex items-center' : ''}`}>
                                          {schedules.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                              {schedules.map(schedule => {
                                                // Determine class color based on department or course type
                                                let borderColor = 'border-l-[#0687C9]';
                                                let bgColor = 'bg-blue-50/50';
                                                let hoverBg = 'hover:bg-blue-50';
                                                let textColor = 'text-[#0687C9]';
                                                
                                                if (schedule.course_name?.includes('Informatika') || schedule.student_group_name?.includes('Informatika')) {
                                                  borderColor = 'border-l-[#0687C9]';
                                                  bgColor = 'bg-blue-50/50';
                                                  hoverBg = 'hover:bg-blue-100/70';
                                                  textColor = 'text-[#0687C9]';
                                                } else if (schedule.course_name?.includes('Sistem') || schedule.student_group_name?.includes('Sistem Informasi')) {
                                                  borderColor = 'border-l-purple-500';
                                                  bgColor = 'bg-purple-50/50';
                                                  hoverBg = 'hover:bg-purple-100/70';
                                                  textColor = 'text-purple-600';
                                                } else if (schedule.course_name?.includes('Elektro') || schedule.student_group_name?.includes('Elektro')) {
                                                  borderColor = 'border-l-amber-500';
                                                  bgColor = 'bg-amber-50/50';
                                                  hoverBg = 'hover:bg-amber-100/70';
                                                  textColor = 'text-amber-600';
                                                } else if (schedule.course_name?.includes('Manajemen') || schedule.student_group_name?.includes('Manajemen')) {
                                                  borderColor = 'border-l-emerald-500';
                                                  bgColor = 'bg-emerald-50/50';
                                                  hoverBg = 'hover:bg-emerald-100/70';
                                                  textColor = 'text-emerald-600';
                                                } else if (schedule.course_name?.includes('Akuntansi') || schedule.student_group_name?.includes('Akuntansi')) {
                                                  borderColor = 'border-l-rose-500';
                                                  bgColor = 'bg-rose-50/50';
                                                  hoverBg = 'hover:bg-rose-100/70';
                                                  textColor = 'text-rose-600';
                                                } else {
                                                  // Fallback to modulo-based coloring
                                                  if (schedule.course_id % 5 === 0) {
                                                    borderColor = 'border-l-purple-500';
                                                    bgColor = 'bg-purple-50/50';
                                                    hoverBg = 'hover:bg-purple-100/70';
                                                    textColor = 'text-purple-600';
                                                  } else if (schedule.course_id % 4 === 0) {
                                                    borderColor = 'border-l-amber-500';
                                                    bgColor = 'bg-amber-50/50';
                                                    hoverBg = 'hover:bg-amber-100/70';
                                                    textColor = 'text-amber-600';
                                                  } else if (schedule.course_id % 3 === 0) {
                                                    borderColor = 'border-l-emerald-500';
                                                    bgColor = 'bg-emerald-50/50';
                                                    hoverBg = 'hover:bg-emerald-100/70';
                                                    textColor = 'text-emerald-600';
                                                  } else if (schedule.course_id % 2 === 0) {
                                                    borderColor = 'border-l-rose-500';
                                                    bgColor = 'bg-rose-50/50';
                                                    hoverBg = 'hover:bg-rose-100/70';
                                                    textColor = 'text-rose-600';
                                                  } else {
                                                    borderColor = 'border-l-[#0687C9]';
                                                    bgColor = 'bg-blue-50/50';
                                                    hoverBg = 'hover:bg-blue-100/70';
                                                    textColor = 'text-[#0687C9]';
                                                  }
                                                }
                                                
                                                return (
                                                  <div 
                                                    key={`day-item-${schedule.id}`} 
                                                    onClick={() => setupEditSchedule(schedule)}
                                                    className={`p-2 rounded border ${bgColor} ${borderColor} border-l-4 ${hoverBg} transition-all cursor-pointer shadow-sm hover:shadow flex items-center gap-2 h-full`}
                                                  >
                                                    <div className="flex-grow min-w-0">
                                                      <div className="flex items-center justify-between">
                                                        <div className={`text-sm font-medium truncate ${textColor}`}>
                                                          {schedule.course_code}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 whitespace-nowrap ml-1">
                                                          {schedule.start_time} - {schedule.end_time}
                                                        </div>
                                                      </div>
                                                      <div className="text-xs font-medium text-gray-800 truncate">
                                                        {schedule.course_name}
                                                      </div>
                                                      <div className="flex flex-wrap gap-x-2 mt-1 text-[10px] text-gray-500">
                                                        <div className="flex items-center">
                                                          <Users className="h-2.5 w-2.5 mr-0.5" />
                                                          <span className="truncate">{schedule.lecturer_name?.split(' ')[0]}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                          <MapPin className="h-2.5 w-2.5 mr-0.5" />
                                                          <span className="truncate">{schedule.room_name}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Perkuliahan</DialogTitle>
            <DialogDescription>
              Ubah detail jadwal perkuliahan yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentSchedule && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSchedule)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="course_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mata Kuliah</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={currentSchedule.course_id.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih mata kuliah" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.length > 0 ? (
                              courses.map(course => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={currentSchedule.course_id.toString()}>
                                {currentSchedule.course_code} - {currentSchedule.course_name}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hari</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={currentSchedule.day}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih hari" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS.map(day => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Mulai</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field} 
                            defaultValue={currentSchedule.start_time}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jam Selesai</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                            defaultValue={currentSchedule.end_time}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="room_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ruangan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={currentSchedule.room_id.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih ruangan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.length > 0 ? (
                              rooms.map(room => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  {room.name}, {room.building?.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={currentSchedule.room_id.toString()}>
                                {currentSchedule.room_name}, {currentSchedule.building_name}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="lecturer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosen</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              placeholder="Cari dosen..." 
                              value={lecturerSearchTerm}
                              onChange={(e) => {
                                const value = e.target.value;
                                setLecturerSearchTerm(value);
                                searchLecturers(value);
                              }}
                              className="w-full"
                            />
                          </FormControl>
                          
                          {showLecturerResults && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto min-w-[300px]">
                              {searchingLecturers ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-gray-500 mr-2" />
                                  <span className="text-sm text-gray-500">Mencari dosen...</span>
                                </div>
                              ) : searchedLecturers.length > 0 ? (
                                <ul className="py-1">
                                  {searchedLecturers.map((lecturer) => (
                                    <li 
                                      key={lecturer.id} 
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                      onClick={() => selectLecturer(lecturer)}
                                    >
                                      <div className="font-medium">{lecturer.full_name}</div>
                                      <div className="text-xs text-gray-500 flex items-center">
                                        <span className="mr-2">{lecturer.nidn || lecturer.nip || ""}</span>
                                        {lecturer.program && (
                                          <span>{lecturer.program}</span>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : lecturerSearchTerm.length >= 2 ? (
                                <div className="p-3 text-center text-sm text-gray-500">
                                  Tidak ada dosen yang ditemukan.
                                </div>
                              ) : (
                                <div className="p-3 text-center text-sm text-gray-500">
                                  Ketik minimal 2 karakter untuk mencari dosen.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <input type="hidden" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="student_group_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kelas/Kelompok</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={currentSchedule.student_group_id.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih kelompok mahasiswa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {studentGroups.length > 0 ? (
                              studentGroups.map(group => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  {group.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={currentSchedule.student_group_id.toString()}>
                                {currentSchedule.student_group_name}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="academic_year_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tahun Akademik</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={currentSchedule.academic_year_id.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun akademik" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.length > 0 ? (
                              academicYears.map(year => (
                                <SelectItem key={year.id} value={year.id.toString()}>
                                  {year.name} ({year.semester})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value={currentSchedule.academic_year_id.toString()}>
                                {currentSchedule.academic_year_name}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditDialog(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#0687C9] hover:bg-[#0670a8]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jadwal Perkuliahan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus jadwal perkuliahan ini?
            </DialogDescription>
          </DialogHeader>
          
          {currentSchedule && (
            <div className="space-y-2 my-4">
              <p><strong>Mata Kuliah:</strong> {currentSchedule.course_code} - {currentSchedule.course_name}</p>
              <p><strong>Jadwal:</strong> {currentSchedule.day}, {currentSchedule.start_time} - {currentSchedule.end_time}</p>
              <p><strong>Ruangan:</strong> {currentSchedule.room_name}, {currentSchedule.building_name}</p>
              <p><strong>Dosen:</strong> {currentSchedule.lecturer_name}</p>
              <p><strong>Kelompok Mahasiswa:</strong> {currentSchedule.student_group_name}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteSchedule}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus Jadwal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
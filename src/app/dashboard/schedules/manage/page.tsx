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
import { 
  PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Popover } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
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
  Loader2,
  Filter,
  MapPin,
  Search
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
import { zodResolver } from "@hookform/resolvers/zod";

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
  academic_year_id?: number;
  academic_year?: {
    id: number;
    name: string;
    semester?: string;
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

// Form schema
const scheduleFormSchema = z.object({
  course_id: z.string().nonempty("Pilih mata kuliah"),
  room_id: z.string().nonempty("Pilih ruangan"),
  day: z.string().nonempty("Pilih hari"),
  start_time: z.string().nonempty("Masukkan jam mulai"),
  end_time: z.string().nonempty("Masukkan jam selesai"),
  lecturer_id: z.string().nonempty("Pilih dosen").refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "ID dosen tidak valid"
  }),
  student_group_id: z.string().nonempty("Pilih kelompok mahasiswa"),
  academic_year_id: z.string(),
});

type FormValues = z.infer<typeof scheduleFormSchema>;

// Define an interface for the lecturer object returned by fetchLecturerForCourse
interface CourseAssignedLecturer {
  id: number;
  external_user_id?: number;
  full_name: string;
  email?: string;
  academicYearId?: number;
  academicYearName?: string;
}

// Add this helper function at the top of the file, after the interfaces
// Helper function to get the academic year display name
const getAcademicYearDisplay = (
  courseId: string | undefined, 
  academicYearId: string | undefined, 
  courses: Course[], 
  academicYears: AcademicYear[]
): string => {
  // If we have a course ID
  if (courseId) {
    // Find the course to get its academic year
    const courseIdNum = parseInt(courseId);
    const selectedCourse = courses.find(course => course.id === courseIdNum);
    
    // If we found the course and it has an academic year
    if (selectedCourse && selectedCourse.academic_year_id) {
      // Use the course's academic year name directly if available
      if (selectedCourse.academic_year?.name) {
        return selectedCourse.academic_year.name;
      }
      
      // As a fallback, look up in the academicYears array
      const academicYear = academicYears.find(y => y.id === selectedCourse.academic_year_id);
      if (academicYear) {
        return academicYear.name;
      }
      
      // Last resort, just return the ID
      return `Tahun Akademik ID: ${selectedCourse.academic_year_id}`;
    }
  }
  
  // If we have an academic year ID but no matching course
  if (academicYearId) {
    const academicYearIdNum = parseInt(academicYearId);
    const academicYear = academicYears.find(y => y.id === academicYearIdNum);
    return academicYear?.name || `Tahun Akademik ID: ${academicYearId}`;
  }
  
  return "Tahun akademik akan ditentukan berdasarkan mata kuliah";
};

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
  const [selectedLecturer, setSelectedLecturer] = useState<CourseAssignedLecturer | null>(null);
  
  // State for dialog visibility
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

  // New function to fetch the lecturer for a selected course
  const fetchLecturerForCourse = async (courseId: number, academicYearId?: number): Promise<CourseAssignedLecturer | null> => {
    try {
      // Build URL with academic year if provided
      let url = `/admin/course-lecturers/course/${courseId}`;
      if (academicYearId) {
        url += `?academic_year_id=${academicYearId}`;
      }
      
      const response = await api(url, {
        method: 'GET',
      });
      
      if (response.status === "success" && response.data) {
        console.log("Lecturer data from API:", response.data);
        
        // We can use either lecturer_id or user_id - they should be the same
        // The backend is now sending both to ensure compatibility
        return {
          id: response.data.user_id || response.data.lecturer_id, // Prefer user_id if available
          external_user_id: response.data.external_user_id, // Store this for reference
          full_name: response.data.name || "Dosen", // Ensure full_name is always a string
          email: response.data.email,
          academicYearId: response.data.academic_year_id,
          academicYearName: response.data.academic_year_name
        };
      } else {
        console.log("No lecturer assigned to this course");
        return null;
      }
    } catch (error: any) {
      // Don't show error toast for 404 (no lecturer assigned)
      if (error.status === 404) {
        console.log("No lecturer assigned to this course (404)");
        return null;
      }
      
      // For other errors, log but don't break the UI
      console.error("Error fetching lecturer for course:", error);
      
      // Only show toast for non-404 errors that aren't related to missing lecturer assignments
      if (error.status !== 404 && !error.message?.includes("Lecturer: unsupported relations")) {
        toast.error("Gagal mendapatkan data dosen untuk mata kuliah ini", {
          description: "Silakan pilih dosen secara manual"
        });
      }
      
      return null;
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
        // Format lecturers to ensure consistent structure
        const formattedLecturers = response.data.map((lecturer: any) => ({
          id: lecturer.id || lecturer.user_id || lecturer.lecturer_id,
          external_user_id: lecturer.external_user_id,
          full_name: lecturer.full_name || lecturer.name || lecturer.FullName || `Dosen (ID: ${lecturer.id})`,
          email: lecturer.email || lecturer.Email,
          department_id: lecturer.department_id || lecturer.study_program_id,
          department_name: lecturer.department_name || lecturer.study_program_name
        }));
        
        setSearchedLecturers(formattedLecturers);
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
    console.log("Selected lecturer:", lecturer);
    
    // Ensure lecturer has a valid ID and it can be converted to a number
    if (!lecturer || typeof lecturer.id === 'undefined') {
      console.error("Invalid lecturer selected - missing ID:", lecturer);
      toast.error("Data dosen tidak valid (ID tidak ditemukan)");
      return;
    }
    
    // Ensure ID is a valid number
    const lecturerId = Number(lecturer.id);
    
    if (isNaN(lecturerId) || lecturerId <= 0) {
      console.error("Invalid lecturer ID (not a valid number):", lecturer.id);
      toast.error("ID dosen tidak valid (bukan angka)");
      return;
    }
    
    // Log for debugging
    console.log("Lecturer ID as number:", lecturerId);
    console.log("Lecturer ID type:", typeof lecturerId);

    // Get the lecturer name, prioritizing different potential properties
    const lecturerName = lecturer.full_name || lecturer.name || 
                        (lecturer.FullName || lecturer.fullName) || 
                        `Dosen (ID: ${lecturerId})`;
    
    // Format lecturer object to match CourseAssignedLecturer interface
    const lecturerInfo: CourseAssignedLecturer = {
      id: lecturerId,
      external_user_id: lecturer.external_user_id,
      full_name: lecturerName,
      email: lecturer.email,
      academicYearId: lecturer.academicYearId,
      academicYearName: lecturer.academicYearName
    };
    
    // Store full lecturer object for reference
    setSelectedLecturer(lecturerInfo);
        
    // Store as string in the form (React Hook Form expects string values)
    const lecturerIdStr = String(lecturerId);
    
    // If we're in add form
    if (showAddDialog) {
      addForm.setValue("lecturer_id", lecturerIdStr);
      console.log("Set lecturer_id in add form:", lecturerIdStr, typeof lecturerIdStr);
      
      // Force validation update
      addForm.trigger("lecturer_id");
      
      // Show success toast for manual selection
      toast.success("Dosen dipilih secara manual", {
        description: `${lecturerName} telah dipilih sebagai dosen untuk jadwal ini`
      });
    }
          
    // If we're in edit form
    if (showEditDialog) {
      editForm.setValue("lecturer_id", lecturerIdStr);
      console.log("Set lecturer_id in edit form:", lecturerIdStr, typeof lecturerIdStr);
      
      // Force validation update
      editForm.trigger("lecturer_id");
      
      // Show success toast for manual selection
      toast.success("Dosen dipilih secara manual", {
        description: `${lecturerName} telah dipilih sebagai dosen untuk jadwal ini`
      });
    }
    
    // Set search term for display - we've already ensured lecturerName is a string
    setLecturerSearchTerm(lecturerName);
    setShowLecturerResults(false);
  };

  // Function to handle adding a new schedule
  const handleAddSchedule = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Log raw form data for debugging
      console.log("Raw form data:", data);
      
      // Get the course ID and academic year ID
      const courseId = parseInt(data.course_id);
      const academicYearId = parseInt(data.academic_year_id);
      
      if (isNaN(courseId) || courseId <= 0 || isNaN(academicYearId) || academicYearId <= 0) {
        toast.error("Tidak dapat menambahkan jadwal", {
          description: "ID mata kuliah atau tahun akademik tidak valid"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if we have a lecturer ID
      if (!data.lecturer_id) {
        toast.error("Tidak dapat menambahkan jadwal", {
          description: "Dosen harus dipilih untuk jadwal ini"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert form string values to appropriate types for the API
      try {
        // Since we're using zod validation, we know the values are valid
        const formattedData = {
          course_id: courseId,
          room_id: parseInt(data.room_id),
          day: data.day,
          start_time: data.start_time,
          end_time: data.end_time,
          lecturer_id: parseInt(data.lecturer_id), // Use the lecturer ID directly from the form
          student_group_id: parseInt(data.student_group_id),
          academic_year_id: academicYearId
        };
        
        // Debug log for troubleshooting
        console.log("Sending schedule data:", formattedData);
        console.log("Lecturer ID in formattedData:", formattedData.lecturer_id);
        
        // Make API request
        const response = await api('/admin/schedules', {
          method: 'POST',
          body: formattedData,
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
      } catch (parseError) {
        console.error("Error parsing form data:", parseError);
        toast.error("Format data tidak valid", {
          description: "Periksa kembali semua field dan pastikan data yang dimasukkan valid"
        });
      }
    } catch (error: any) {
      console.error("Error adding schedule:", error);
      
      // Handle specific error messages
      if (error.message && error.message.includes("is not assigned to this course")) {
        toast.error("Gagal menambahkan jadwal", {
          description: "Dosen yang dipilih tidak ditugaskan untuk mata kuliah ini pada tahun akademik yang dipilih"
        });
      } else if (error.message && error.message.includes("invalid lecturer/user ID")) {
        toast.error("Gagal menambahkan jadwal", {
          description: "ID dosen tidak valid atau tidak ada dosen yang ditugaskan untuk mata kuliah ini"
        });
      } else {
        toast.error("Gagal menambahkan jadwal", {
          description: error.message || "Terjadi kesalahan saat menambahkan jadwal baru"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle editing a schedule
  const handleEditSchedule = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Log raw form data for debugging
      console.log("Raw edit form data:", data);
      
      // Get the course ID and academic year ID
      const courseId = parseInt(data.course_id);
      const academicYearId = parseInt(data.academic_year_id);
      
      if (isNaN(courseId) || courseId <= 0 || isNaN(academicYearId) || academicYearId <= 0) {
        toast.error("Tidak dapat memperbarui jadwal", {
          description: "ID mata kuliah atau tahun akademik tidak valid"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if we have a lecturer ID
      if (!data.lecturer_id) {
        toast.error("Tidak dapat memperbarui jadwal", {
          description: "Dosen harus dipilih untuk jadwal ini"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convert form string values to appropriate types for the API
      const formattedData = {
        course_id: courseId,
        room_id: parseInt(data.room_id),
        day: data.day,
        start_time: data.start_time,
        end_time: data.end_time, 
        lecturer_id: parseInt(data.lecturer_id), // Use the lecturer ID directly from the form
        student_group_id: parseInt(data.student_group_id),
        academic_year_id: academicYearId
      };
      
      // Debug log for troubleshooting
      console.log("Sending edit schedule data:", formattedData);
      console.log("Lecturer ID in edit formattedData:", formattedData.lecturer_id);
        
      // Make API request
      const response = await api(`/admin/schedules/${currentSchedule?.id}`, {
        method: 'PUT',
        body: formattedData,
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
      
      // Handle specific error messages
      if (error.message && error.message.includes("is not assigned to this course")) {
        toast.error("Gagal memperbarui jadwal", {
          description: "Dosen yang dipilih tidak ditugaskan untuk mata kuliah ini pada tahun akademik yang dipilih"
        });
      } else if (error.message && error.message.includes("invalid lecturer/user ID")) {
        toast.error("Gagal memperbarui jadwal", {
          description: "ID dosen tidak valid atau tidak ada dosen yang ditugaskan untuk mata kuliah ini"
        });
      } else {
        toast.error("Gagal memperbarui jadwal", {
          description: error.message || "Terjadi kesalahan saat memperbarui jadwal"
        });
      }
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
        // Check that courses have academic year information
        const coursesWithAcademicYear = response.data.map((course: any) => {
          if (!course.academic_year_id) {
            console.warn(`Course ${course.id} (${course.name}) is missing academic_year_id`);
          }
          if (!course.academic_year) {
            console.warn(`Course ${course.id} (${course.name}) is missing academic_year object`);
          } else {
            console.log(`Course ${course.id} (${course.name}) has academic_year_id: ${course.academic_year_id}, academic_year.name: ${course.academic_year?.name}`);
          }
          return course;
        });
        
        setCourses(coursesWithAcademicYear);
        
        // Log courses to verify academic year information
        console.log("Loaded courses with academic year info:", coursesWithAcademicYear);
        
        // Show warning if no courses are available
        if (coursesWithAcademicYear.length === 0) {
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
    setLoading(true);
    try {
      const response = await api('/admin/academic-years', {
        method: 'GET',
      });
      if (response.status === "success") {
        setAcademicYears(response.data);
        
        // Don't set a default filter value - show all academic years by default
        // This allows users to see schedules from all academic years initially
        // They can then filter to a specific year if needed
        
        // Optional: If you want to set a default filter, uncomment this code:
        /*
        if (!academicYearFilter && response.data.length > 0) {
          // Just use the first academic year in the list
          setAcademicYearFilter(response.data[0].id);
        }
        */
      } else {
        toast.error("Gagal memuat tahun akademik");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat tahun akademik");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all data
  useEffect(() => {
    // Load all data on component mount
    const loadAllData = async () => {
      setLoadingRelatedData(true);
      await fetchSchedules();
      await Promise.all([
        fetchCourses(),
        fetchRooms(),
        fetchLecturers(),
        fetchStudentGroups(),
        fetchAcademicYears()
      ]);
      setLoadingRelatedData(false);
    };

    loadAllData();
  }, []);

  // useEffect to fetch schedules when academicYearFilter changes
  useEffect(() => {
    if (academicYearFilter) {
      // If a specific academic year is selected, use filtered schedules
      fetchFilteredSchedules();
    } else {
      // If no academic year filter is set, show all schedules
      fetchSchedules();
    }
  }, [academicYearFilter]);

  // Setup edit schedule
  const setupEditSchedule = (schedule: CourseSchedule) => {
    console.log("Setting up edit for schedule:", schedule);
    
    // First set the current schedule
    setCurrentSchedule(schedule);
    
    // Initialize the lecturer information explicitly
    if (schedule.lecturer_name) {
      console.log("Initializing lecturer info with name:", schedule.lecturer_name);
      const lecturerInfo: CourseAssignedLecturer = {
        id: schedule.lecturer_id,
        full_name: schedule.lecturer_name
      };
      setSelectedLecturer(lecturerInfo);
      setLecturerSearchTerm(schedule.lecturer_name);
    } else if (schedule.lecturer_id) {
      // We have a lecturer ID but no name - this should not happen in normal cases
      // Still, we'll handle it gracefully
      console.log("No lecturer name but have ID:", schedule.lecturer_id);
      
      // Try to find the lecturer name from our lecturers state
      const foundLecturer = lecturers.find(lec => lec.id === schedule.lecturer_id);
      
      if (foundLecturer && foundLecturer.name) {
        console.log("Found lecturer name from list:", foundLecturer.name);
        const lecturerInfo: CourseAssignedLecturer = {
          id: schedule.lecturer_id,
          full_name: foundLecturer.name
        };
        setSelectedLecturer(lecturerInfo);
        setLecturerSearchTerm(foundLecturer.name);
      } else {
        // If we still can't find a name, use a placeholder with ID
        const lecturerInfo: CourseAssignedLecturer = {
          id: schedule.lecturer_id,
          full_name: `Dosen (ID: ${schedule.lecturer_id})`
        };
        setSelectedLecturer(lecturerInfo);
        setLecturerSearchTerm(`Dosen (ID: ${schedule.lecturer_id})`);
      }
    } else {
      // No lecturer information at all
      console.log("No lecturer information available");
      setSelectedLecturer(null);
      setLecturerSearchTerm("");
    }
    
    // Find the course to get its academic year
    const courseId = schedule.course_id;
    const selectedCourse = courses.find(course => course.id === courseId);
    
    // Use the academic year from the course, not from the schedule
    let academicYearId = schedule.academic_year_id?.toString() || "";
    if (selectedCourse && selectedCourse.academic_year_id) {
      academicYearId = selectedCourse.academic_year_id.toString();
      console.log("Using academic year ID from course instead of schedule:", academicYearId);
    }
    
    // Initialize form data
    editForm.reset({
      student_group_id: schedule.student_group_id?.toString() || "",
      academic_year_id: academicYearId,
      lecturer_id: schedule.lecturer_id?.toString() || "",
      course_id: schedule.course_id?.toString() || "",
      day: schedule.day || "",
      start_time: schedule.start_time || "",
      end_time: schedule.end_time || "",
      room_id: schedule.room_id?.toString() || ""
    });
    
    // Finally, open the dialog
    setShowEditDialog(true);
  };
  
  // Setup delete schedule
  const setupDeleteSchedule = (schedule: CourseSchedule) => {
    setCurrentSchedule(schedule);
    setShowDeleteDialog(true);
  };

  // Function to reset filters
  const resetFilters = () => {
    setDayFilter(null);
    setBuildingFilter(null);
    setSemesterFilter(null);
    setLecturerFilter(null);
    setCourseFilter(null);
    setAcademicYearFilter(null); // Reset to null to show all academic years
    setSearchQuery("");
    
    // After resetting filters, fetch all schedules
    fetchSchedules();
  };

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

  // Forms for adding/editing schedules
  const addForm = useForm<FormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      course_id: "",
      room_id: "",
      day: "Senin",
      start_time: "08:00",
      end_time: "10:00",
      lecturer_id: "",
      student_group_id: "",
      academic_year_id: academicYears.length > 0 ? academicYears[0].id.toString() : "",
    }
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      course_id: "",
      room_id: "",
      day: "Senin",
      start_time: "08:00",
      end_time: "10:00",
      lecturer_id: "",
      student_group_id: "",
      academic_year_id: academicYears.length > 0 ? academicYears[0].id.toString() : "",
    }
  });

  // Clear lecturer search when dialogs close
  useEffect(() => {
    // Always set showLecturerResults to false since fields are now read-only
    setShowLecturerResults(false);
    
    if (!showAddDialog && !showEditDialog) {
      setSearchedLecturers([]);
    }
  }, [showAddDialog, showEditDialog]);

  // useEffect to update form when currentSchedule changes
  useEffect(() => {
    if (currentSchedule && showEditDialog) {
      console.log("Setting up edit form with schedule:", currentSchedule);
      
      // Set the lecturer name first before form reset
      if (currentSchedule.lecturer_name) {
        console.log("Setting lecturer name:", currentSchedule.lecturer_name);
        setLecturerSearchTerm(currentSchedule.lecturer_name);
        
        // Create a properly typed lecturer object
        const lecturerInfo: CourseAssignedLecturer = {
          id: currentSchedule.lecturer_id,
          full_name: currentSchedule.lecturer_name
        };
        setSelectedLecturer(lecturerInfo);
      }
      
      // Then populate edit form with current schedule data
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
    }
  }, [currentSchedule, editForm, showEditDialog]);

  // Update the effect to reset academic_year_id when showing the add dialog
  useEffect(() => {
    if (showAddDialog) {
      // Reset the form when dialog is opened
      addForm.reset({
        course_id: "",
        room_id: "",
        day: "Senin",
        start_time: "08:00",
        end_time: "10:00",
        lecturer_id: "",
        student_group_id: "",
        academic_year_id: "", // Set to empty string initially
      });
      
      // Clear selected lecturer
      setSelectedLecturer(null);
      setLecturerSearchTerm("");
    }
  }, [showAddDialog, addForm, academicYears]);

  // Watch for changes in course_id in add form
  useEffect(() => {
    const subscription = addForm.watch(async (value, { name, type }) => {
      // Only respond to course_id changes
      if (name === 'course_id' && value.course_id) {
        const courseId = parseInt(value.course_id);
        
        // Only proceed if we have a valid course ID
        if (!isNaN(courseId) && courseId > 0) {
          try {
            // Find the selected course to get its academic year
            const selectedCourse = courses.find(course => course.id === courseId);
            
            // If we found the course and it has an academic year ID, use it
            if (selectedCourse && selectedCourse.academic_year_id) {
              // Set the academic year ID from the course (not from any other source)
              addForm.setValue("academic_year_id", selectedCourse.academic_year_id.toString());
              console.log("Watch: Setting academic year from course directly:", selectedCourse.academic_year_id);
            }
            
            // Now try to fetch the lecturer for this course and academic year
            const academicYearId = selectedCourse?.academic_year_id;
            const lecturer = await fetchLecturerForCourse(courseId, academicYearId);
            
            if (lecturer) {
              // Only update lecturer if it wasn't manually selected or if we're changing the course
              const currentLecturerId = addForm.getValues("lecturer_id");
              const manuallySelected = selectedLecturer && currentLecturerId && 
                                      selectedLecturer.id.toString() === currentLecturerId;
              
              if (!manuallySelected || name === 'course_id') {
                // Set the lecturer in the form
                addForm.setValue("lecturer_id", lecturer.id.toString());
                setSelectedLecturer(lecturer);
                // Since we're using our interface, full_name is guaranteed to be a string
                setLecturerSearchTerm(lecturer.full_name);
                
                toast.success("Dosen telah ditentukan secara otomatis", {
                  description: `${lecturer.full_name} ditugaskan untuk mata kuliah ini`
                });
              }
            } else {
              // No lecturer found, but don't clear if manually selected
              const currentLecturerId = addForm.getValues("lecturer_id");
              const manuallySelected = selectedLecturer && currentLecturerId && 
                                      selectedLecturer.id.toString() === currentLecturerId;
              
              if (!manuallySelected) {
                console.log("No lecturer found for course ID:", courseId, "academic year ID:", academicYearId);
                addForm.setValue("lecturer_id", "");
                setSelectedLecturer(null);
                setLecturerSearchTerm("");
              }
              
              // If both course and academic year are selected but no lecturer found, show a warning
              if (courseId && academicYearId && !manuallySelected) {
                toast.warning("Perhatian", {
                  description: "Tidak ada dosen yang ditugaskan untuk mata kuliah ini pada tahun akademik yang dipilih. Silakan pilih dosen secara manual."
                });
              }
            }
          } catch (error) {
            // Silently handle errors - already logged in fetchLecturerForCourse
            console.log("Error handled in form watch:", error);
            
            // Don't clear lecturer if manually selected
            const currentLecturerId = addForm.getValues("lecturer_id");
            const manuallySelected = selectedLecturer && currentLecturerId && 
                                    selectedLecturer.id.toString() === currentLecturerId;
            
            if (!manuallySelected) {
              addForm.setValue("lecturer_id", "");
              setSelectedLecturer(null);
              setLecturerSearchTerm("");
            }
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [addForm, courses, selectedLecturer]);

  // Watch for changes in course_id in edit form
  useEffect(() => {
    const subscription = editForm.watch(async (value, { name, type }) => {
      // Only respond to course_id changes if edit dialog is open
      if (showEditDialog && name === 'course_id' && value.course_id) {
        const courseId = parseInt(value.course_id);
        
        if (!isNaN(courseId) && courseId > 0) {
          console.log("Course changed in edit form: course ID:", courseId);
          
          // Check if the course ID is different from the original one
          const courseChanged = currentSchedule && courseId !== currentSchedule.course_id;
          
          try {
            // Find the selected course to get its academic year
            const selectedCourse = courses.find(course => course.id === courseId);
            
            // If we found the course and it has an academic year ID, use it
            if (selectedCourse && selectedCourse.academic_year_id) {
              // Set the academic year ID from the course (not from any other source)
              editForm.setValue("academic_year_id", selectedCourse.academic_year_id.toString());
              console.log("Watch (edit): Setting academic year from course directly:", selectedCourse.academic_year_id);
            }
            
            // Now try to fetch the lecturer for this course and academic year
            const academicYearId = selectedCourse?.academic_year_id;
            const lecturer = await fetchLecturerForCourse(courseId, academicYearId);
            
            if (lecturer) {
              console.log("Found lecturer for selected course/year:", lecturer);
              
              // Only update lecturer if it wasn't manually selected or if we're changing the course
              const currentLecturerId = editForm.getValues("lecturer_id");
              const manuallySelected = selectedLecturer && currentLecturerId && 
                                      selectedLecturer.id.toString() === currentLecturerId &&
                                      selectedLecturer.id !== lecturer.id;
              
              if (!manuallySelected || courseChanged) {
                // Set the lecturer in the form
                editForm.setValue("lecturer_id", lecturer.id.toString());
                setSelectedLecturer(lecturer);
                // Since we're using our interface, full_name is guaranteed to be a string
                setLecturerSearchTerm(lecturer.full_name);
                
                toast.success("Dosen telah ditentukan secara otomatis", {
                  description: `${lecturer.full_name} ditugaskan untuk mata kuliah ini`
                });
              }
            } else {
              console.log("No lecturer found for course/year combo:", courseId, academicYearId);
              
              // Don't clear lecturer if manually selected
              const currentLecturerId = editForm.getValues("lecturer_id");
              const manuallySelected = selectedLecturer && currentLecturerId && 
                                      selectedLecturer.id.toString() === currentLecturerId;
              
              if (!manuallySelected) {
                // Clear lecturer field
                editForm.setValue("lecturer_id", "");
                setSelectedLecturer(null);
                setLecturerSearchTerm("");
              }
              
              // If both course and academic year are selected but no lecturer found, show a warning
              if (courseId && academicYearId && !manuallySelected) {
                toast.warning("Perhatian", {
                  description: "Tidak ada dosen yang ditugaskan untuk mata kuliah ini pada tahun akademik yang dipilih. Silakan pilih dosen secara manual."
                });
              }
            }
          } catch (error) {
            // Silently handle errors - already logged in fetchLecturerForCourse
            console.log("Error handled in edit form course watch:", error);
            
            // Don't clear lecturer if manually selected
            const currentLecturerId = editForm.getValues("lecturer_id");
            const manuallySelected = selectedLecturer && currentLecturerId && 
                                    selectedLecturer.id.toString() === currentLecturerId;
            
            if (!manuallySelected) {
              // Clear lecturer field
              editForm.setValue("lecturer_id", "");
              setSelectedLecturer(null);
              setLecturerSearchTerm("");
            }
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [editForm, showEditDialog, currentSchedule, courses, selectedLecturer]);

  // Watch for changes in edit dialog visibility
  useEffect(() => {
    if (showEditDialog && currentSchedule) {
      // Force update the lecturer search term whenever the dialog opens
      if (currentSchedule.lecturer_name) {
        console.log("Dialog opened, updating lecturer term to name:", currentSchedule.lecturer_name);
        setLecturerSearchTerm(currentSchedule.lecturer_name);
      } else if (selectedLecturer && selectedLecturer.full_name) {
        // If we have a selected lecturer but no name in currentSchedule, use that
        console.log("Using selected lecturer name:", selectedLecturer.full_name);
        setLecturerSearchTerm(selectedLecturer.full_name);
      } else {
        // Fallback if there's no name
        setLecturerSearchTerm("Pilih dosen");
      }
    }
  }, [showEditDialog, currentSchedule, selectedLecturer]);

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
                    Masukkan detail jadwal baru yang ingin ditambahkan. Dosen akan dipilih otomatis berdasarkan mata kuliah, 
                    atau Anda dapat mencari dan memilih dosen secara manual.
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
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // When a course is selected, get its details to set the academic year
                                    if (value) {
                                      const courseId = parseInt(value);
                                      const selectedCourse = courses.find(course => course.id === courseId);
                                      console.log("Selected course:", selectedCourse);
                                      
                                      if (selectedCourse) {
                                        console.log("Course academic_year_id:", selectedCourse.academic_year_id);
                                        console.log("Course academic_year:", selectedCourse.academic_year);
                                        
                                        if (selectedCourse.academic_year_id) {
                                          // ALWAYS set the academic year based on the course's academic_year_id
                                          // NOT from academicYears array
                                          addForm.setValue("academic_year_id", selectedCourse.academic_year_id.toString());
                                          console.log("Setting academic year from course:", selectedCourse.academic_year_id);
                                          
                                          // Show a toast to inform the user
                                          const academicYearName = selectedCourse.academic_year?.name || 
                                            academicYears.find(y => y.id === selectedCourse.academic_year_id)?.name || 
                                            selectedCourse.academic_year_id.toString();
                                          
                                          toast.info("Tahun akademik dipilih otomatis", {
                                            description: `Tahun akademik ${academicYearName} dipilih berdasarkan mata kuliah`
                                          });
                                        } else {
                                          console.warn("Selected course has no academic_year_id");
                                          addForm.setValue("academic_year_id", "");
                                        }
                                      } else {
                                        console.warn("Could not find selected course with ID:", courseId);
                                        addForm.setValue("academic_year_id", "");
                                      }
                                    } else {
                                      // Clear academic year if no course is selected
                                      addForm.setValue("academic_year_id", "");
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Pilih mata kuliah" className="truncate" />
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih hari" className="truncate" />
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
                  <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih ruangan" className="truncate" />
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
                                <FormControl>
                                  <div className="relative">
                                    <div className="flex items-center">
                                      <Input 
                                        value={lecturerSearchTerm || "Dosen akan ditentukan berdasarkan mata kuliah"}
                                        readOnly
                                        className="w-full"
                                        placeholder="Dosen akan ditentukan berdasarkan mata kuliah"
                                      />
                                      {selectedLecturer && (
                                        <Badge className="ml-2 bg-[#0687C9] absolute right-2 top-1/2 transform -translate-y-1/2">
                                          {addForm.getValues().course_id ? "Otomatis" : "Manual"}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    {showLecturerResults && (
                                      <div className="absolute z-10 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                                        {searchingLecturers ? (
                                          <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            <span>Mencari dosen...</span>
                                          </div>
                                        ) : searchedLecturers.length > 0 ? (
                                          <ScrollArea className="max-h-60">
                                            {searchedLecturers.map((lecturer) => (
                                              <div
                                                key={lecturer.id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => selectLecturer(lecturer)}
                                              >
                                                <div className="font-medium">{lecturer.full_name || lecturer.name}</div>
                                                {lecturer.email && <div className="text-xs text-gray-500">{lecturer.email}</div>}
                                              </div>
                                            ))}
                                          </ScrollArea>
                                        ) : (
                                          <div className="p-2 text-center text-gray-500">
                                            Tidak ada dosen yang ditemukan
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <input 
                                  type="hidden" 
                                  name={field.name}
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Dosen otomatis dipilih sesuai dengan mata kuliah
                                </p>
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
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih kelompok mahasiswa" className="truncate" />
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
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  value={getAcademicYearDisplay(addForm.getValues().course_id, field.value, courses, academicYears)}
                                  readOnly
                                  className="w-full"
                                />
                                {field.value && (
                                  <Badge className="ml-2 bg-[#0687C9] absolute right-2 top-1/2 transform -translate-y-1/2">
                                    Otomatis
                                  </Badge>
                                )}
                              </div>
                            </FormControl>
                            <input 
                              type="hidden" 
                              name={field.name}
                              value={field.value || ""}
                              onChange={field.onChange}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Tahun akademik otomatis dipilih sesuai dengan mata kuliah
                            </p>
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

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari jadwal perkuliahan..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-56">
              <Select value={dayFilter || "all"} onValueChange={(value) => setDayFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Hari" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Hari</SelectItem>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full flex justify-between">
                    <span>Filter Lanjutan</span>
                    <Filter className="h-4 w-4 ml-2" />
                    {(buildingFilter || semesterFilter || lecturerFilter || academicYearFilter) && (
                      <Badge className="ml-1 h-5 bg-[#0687C9]">{
                        [buildingFilter, semesterFilter, lecturerFilter, academicYearFilter]
                          .filter(Boolean).length
                      }</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[460px] p-5">
                  <div className="space-y-5">
                    <h4 className="font-medium text-base">Filter Jadwal</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="building" className="mb-1.5 block">Gedung</Label>
                        <Select
                          value={buildingFilter || "all"}
                          onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                        >
                          <SelectTrigger id="building" className="w-full">
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
                        <Label htmlFor="semester" className="mb-1.5 block">Semester</Label>
                        <Select
                          value={semesterFilter?.toString() || "all"}
                          onValueChange={(value) => setSemesterFilter(value === "all" ? null : Number(value))}
                        >
                          <SelectTrigger id="semester" className="w-full">
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
                        <Label htmlFor="lecturer" className="mb-1.5 block">Dosen</Label>
                        <Select
                          value={lecturerFilter?.toString() || "all"}
                          onValueChange={(value) => setLecturerFilter(value === "all" ? null : Number(value))}
                        >
                          <SelectTrigger id="lecturer" className="w-full">
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
                        <Label htmlFor="academic-year" className="mb-1.5 block">Tahun Akademik</Label>
                        <Select
                          value={academicYearFilter?.toString() || "all"}
                          onValueChange={(value) => setAcademicYearFilter(value === "all" ? null : Number(value))}
                        >
                          <SelectTrigger id="academic-year" className="w-full">
                            <SelectValue placeholder="Semua Tahun Akademik" />
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
                    
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset Filter
                      </Button>
                      <Button 
                        className="bg-[#0687C9] hover:bg-[#0670a8]"
                        onClick={fetchFilteredSchedules}
                      >
                        Terapkan
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                    <TableHead className="font-bold text-black">Dosen</TableHead>
                    <TableHead className="font-bold text-black">Jadwal</TableHead>
                    <TableHead className="font-bold text-black">Ruangan</TableHead>
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
                          <div className="font-medium">
                            {schedule.lecturer_name 
                              ? (schedule.lecturer_name === "Dosen" || schedule.lecturer_name.startsWith("Dosen (ID:")) 
                                ? "Belum ada dosen" 
                                : schedule.lecturer_name
                              : "Belum ada dosen"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge variant="outline" className="rounded-sm font-normal text-[#0687C9] border-[#0687C9] bg-[#0687C9]/5">
                              {schedule.day}
                            </Badge>
                            <span className="mx-1.5">•</span>
                            <div className="text-sm">
                              {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 text-gray-500 mr-1.5" />
                            <div>
                              {schedule.room_name} <span className="text-xs text-muted-foreground">({schedule.building_name})</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {schedule.student_group_name}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setupEditSchedule(schedule)}
                                className="cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setupDeleteSchedule(schedule)}
                                className="cursor-pointer text-red-600"
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
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Jadwal Perkuliahan</DialogTitle>
            <DialogDescription>
              Ubah detail jadwal perkuliahan yang sudah ada. Dosen akan dipilih otomatis berdasarkan mata kuliah, 
              atau Anda dapat mencari dan memilih dosen secara manual.
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            // When a course is selected, get its details to set the academic year
                            if (value) {
                              const courseId = parseInt(value);
                              const selectedCourse = courses.find(course => course.id === courseId);
                              console.log("Selected course (edit form):", selectedCourse);
                              
                              if (selectedCourse) {
                                console.log("Course academic_year_id (edit form):", selectedCourse.academic_year_id);
                                console.log("Course academic_year (edit form):", selectedCourse.academic_year);
                                
                                if (selectedCourse.academic_year_id) {
                                  // ALWAYS set the academic year based on the course's academic_year_id
                                  // NOT from academicYears array
                                  editForm.setValue("academic_year_id", selectedCourse.academic_year_id.toString());
                                  console.log("Setting academic year from course (edit form):", selectedCourse.academic_year_id);
                                  
                                  // Show a toast to inform the user
                                  const academicYearName = selectedCourse.academic_year?.name || 
                                    academicYears.find(y => y.id === selectedCourse.academic_year_id)?.name || 
                                    selectedCourse.academic_year_id.toString();
                                  
                                  toast.info("Tahun akademik dipilih otomatis", {
                                    description: `Tahun akademik ${academicYearName} dipilih berdasarkan mata kuliah`
                                  });
                                } else {
                                  console.warn("Selected course has no academic_year_id (edit form)");
                                  editForm.setValue("academic_year_id", "");
                                }
                              } else {
                                console.warn("Could not find selected course with ID (edit form):", courseId);
                                editForm.setValue("academic_year_id", "");
                              }
                            } else {
                              // Clear academic year if no course is selected
                              editForm.setValue("academic_year_id", "");
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih mata kuliah" className="truncate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.length > 0 ? (
                              courses.map(course => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.code} - {course.name}
                                </SelectItem>
                              ))
                            ) : currentSchedule ? (
                              <SelectItem value={currentSchedule.course_id.toString()}>
                                {currentSchedule.course_code} - {currentSchedule.course_name}
                              </SelectItem>
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
                    control={editForm.control}
                    name="day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hari</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih hari" className="truncate" />
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
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih ruangan" className="truncate" />
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
                        <FormControl>
                          <div className="relative">
                            <div className="flex items-center">
                              <Input 
                                value={lecturerSearchTerm || "Dosen akan ditentukan berdasarkan mata kuliah"}
                                readOnly
                                className="w-full"
                                placeholder="Dosen akan ditentukan berdasarkan mata kuliah"
                              />
                              {selectedLecturer && (
                                <Badge className="ml-2 bg-[#0687C9] absolute right-2 top-1/2 transform -translate-y-1/2">
                                  {editForm.getValues().course_id !== currentSchedule?.course_id?.toString() ? "Otomatis" : "Manual"}
                                </Badge>
                              )}
                            </div>
                            
                            {showLecturerResults && (
                              <div className="absolute z-10 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                                {searchingLecturers ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span>Mencari dosen...</span>
                                  </div>
                                ) : searchedLecturers.length > 0 ? (
                                  <ScrollArea className="max-h-60">
                                    {searchedLecturers.map((lecturer) => (
                                      <div
                                        key={lecturer.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => selectLecturer(lecturer)}
                                      >
                                        <div className="font-medium">{lecturer.full_name || lecturer.name}</div>
                                        {lecturer.email && <div className="text-xs text-gray-500">{lecturer.email}</div>}
                                      </div>
                                    ))}
                                  </ScrollArea>
                                ) : (
                                  <div className="p-2 text-center text-gray-500">
                                    Tidak ada dosen yang ditemukan
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <input 
                          type="hidden" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Dosen otomatis dipilih sesuai dengan mata kuliah
                        </p>
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
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih kelompok mahasiswa" className="truncate" />
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
                        <FormControl>
                          <div className="relative">
                            <Input 
                              value={getAcademicYearDisplay(editForm.getValues().course_id, field.value, courses, academicYears)}
                              readOnly
                              className="w-full"
                            />
                            {field.value && (
                              <Badge className="ml-2 bg-[#0687C9] absolute right-2 top-1/2 transform -translate-y-1/2">
                                Otomatis
                              </Badge>
                            )}
                          </div>
                        </FormControl>
                        <input 
                          type="hidden" 
                          name={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tahun akademik otomatis dipilih sesuai dengan mata kuliah
                        </p>
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
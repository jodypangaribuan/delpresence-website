"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserCog, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Loader2,
  X,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { cn } from "@/lib/utils";

// Interface for lecturer
interface Lecturer {
  id: number;
  uuid: string;
  full_name: string;
  nip?: string;
  email?: string;
  user_id?: number;
}

// Interface for course
interface Course {
  id: number;
  uuid: string;
  code: string;
  name: string;
  semester: number;
}

// Interface for academic year
interface AcademicYear {
  id: number;
  uuid: string;
  name: string;         // e.g. "2023/2024"
  semester: string;     // "Ganjil" or "Genap"
  start_date: string;
  end_date: string;
}

// Interface for lecturer assignment
interface Assignment {
  id: number;
  user_id: number;
  course_id: number;
  academic_year_id: number;
  created_at?: string;
  updated_at?: string;
  
  // API response fields (from backend)
  course_name?: string;
  course_code?: string;
  course_semester?: number;
  academic_year_name?: string;
  academic_year_semester?: string;
  lecturer_name?: string;
  lecturer_nip?: string;
  lecturer_email?: string;
  
  // Optional nested objects (for backward compatibility)
  lecturer?: Lecturer;
  course?: Course;
  academic_year?: AcademicYear;
}

// Fix for DeleteConfirmationModal props issue 
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  itemName?: string;
}

export default function LecturerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchingLecturers, setSearchingLecturers] = useState(false);
  const [searchedLecturers, setSearchedLecturers] = useState<Lecturer[]>([]);
  const [lecturerSearchTerm, setLecturerSearchTerm] = useState('');
  const [showLecturerResults, setShowLecturerResults] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string | null>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Separate state for initial loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{id: number, name: string} | null>(null);
  
  // Form states
  const [formLecturerId, setFormLecturerId] = useState<string>("");
  const [formCourseId, setFormCourseId] = useState<string>("");
  const [formAcademicYearId, setFormAcademicYearId] = useState<string>("");
  const [formLecturerName, setFormLecturerName] = useState<string>("");
  
  // Mock data for testing
  const mockCourses: Course[] = [
    { id: 1, uuid: "c1", code: "CS101", name: "Introduction to Computer Science", semester: 1 },
    { id: 2, uuid: "c2", code: "CS102", name: "Data Structures", semester: 2 },
    { id: 3, uuid: "c3", code: "CS201", name: "Algorithms", semester: 3 },
    { id: 4, uuid: "c4", code: "CS202", name: "Database Systems", semester: 4 },
    { id: 5, uuid: "c5", code: "CS301", name: "Computer Networks", semester: 5 },
  ];
  
  const mockAcademicYears: AcademicYear[] = [
    { id: 1, uuid: "ay1", name: "2023/2024", semester: "Ganjil", start_date: "2023-09-01", end_date: "2024-02-28" },
    { id: 2, uuid: "ay2", name: "2023/2024", semester: "Genap", start_date: "2024-03-01", end_date: "2024-08-31" },
    { id: 3, uuid: "ay3", name: "2024/2025", semester: "Ganjil", start_date: "2024-09-01", end_date: "2025-02-28" },
  ];
  
  const mockLecturers: Lecturer[] = [
    { id: 1, uuid: "l1", full_name: "Dr. John Smith", nip: "198001012010011001", email: "john.smith@example.com", user_id: 101 },
    { id: 2, uuid: "l2", full_name: "Prof. Jane Doe", nip: "198103022011022002", email: "jane.doe@example.com", user_id: 102 },
    { id: 3, uuid: "l3", full_name: "Dr. Robert Johnson", nip: "197905032012033003", email: "robert.johnson@example.com", user_id: 103 },
    { id: 4, uuid: "l4", full_name: "Dr. Emily Williams", nip: "198207042013044004", email: "emily.williams@example.com", user_id: 104 },
    { id: 5, uuid: "l5", full_name: "Prof. Michael Brown", nip: "197608052014055005", email: "michael.brown@example.com", user_id: 105 },
  ];
  
  const mockAssignments: Assignment[] = [
    { 
      id: 1, 
      user_id: 101, 
      course_id: 1, 
      academic_year_id: 1,
      lecturer: mockLecturers[0],
      course: mockCourses[0],
      academic_year: mockAcademicYears[0]
    },
    { 
      id: 2, 
      user_id: 102, 
      course_id: 2, 
      academic_year_id: 1,
      lecturer: mockLecturers[1],
      course: mockCourses[1],
      academic_year: mockAcademicYears[0]
    },
    { 
      id: 3, 
      user_id: 103, 
      course_id: 3, 
      academic_year_id: 1,
      lecturer: mockLecturers[2],
      course: mockCourses[2],
      academic_year: mockAcademicYears[0]
    },
    { 
      id: 4, 
      user_id: 104, 
      course_id: 4, 
      academic_year_id: 2,
      lecturer: mockLecturers[3],
      course: mockCourses[3],
      academic_year: mockAcademicYears[1]
    },
    { 
      id: 5, 
      user_id: 105, 
      course_id: 5, 
      academic_year_id: 2,
      lecturer: mockLecturers[4],
      course: mockCourses[4],
      academic_year: mockAcademicYears[1]
    },
  ];
  
  // Load data on initial render
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Fetch all initial data
  const fetchInitialData = async () => {
    setIsInitialLoading(true);
    try {
      // Fetch real data
      await fetchAcademicYears();
      await fetchCourses();
      
      setIsInitialLoading(false);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setIsInitialLoading(false);
      toast.error("Gagal memuat data awal. Silakan muat ulang halaman.");
    }
  };
  
  // Fetch assignments based on academic year
  const fetchAssignments = async (specificAcademicYearId?: string) => {
    setIsLoading(true);
    
    try {
      // Clear existing assignments to prevent duplicates
      setAssignments([]);
      
      // Use specificAcademicYearId if provided, otherwise use the selected one
      const academicYearId = specificAcademicYearId || selectedAcademicYearId;
      
      // Determine query parameter for academic year
      const queryParam = academicYearId && academicYearId !== "all" 
        ? `?academic_year_id=${academicYearId}` 
        : "";
      
      // Fetch actual data from API
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/assignments${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setAssignments(Array.isArray(response.data.data) ? response.data.data : []);
      } else {
        toast.error("Gagal memuat data penugasan dosen", {
          description: response.data.message || "Terjadi kesalahan pada server"
        });
      }
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      toast.error("Gagal memuat data penugasan dosen", {
        description: error.response?.data?.message || error.message || "Terjadi kesalahan pada server"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setCourses(response.data.data || []);
      } else {
        toast.error("Gagal memuat data mata kuliah. Silakan muat ulang halaman.");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Gagal memuat data mata kuliah. Silakan muat ulang halaman.");
      setCourses([]);
    }
  };
  
  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/academic-years`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        const academicYearsData = response.data.data || [];
        setAcademicYears(academicYearsData);
        
        // If we have academic years available, use the first one
        if (academicYearsData.length > 0) {
          const firstYear = academicYearsData[0].academic_year || academicYearsData[0];
          const yearId = firstYear.id.toString();
          setFormAcademicYearId(yearId);
          setSelectedAcademicYearId(yearId);
          
          // Fetch assignments for this academic year
          await fetchAssignments(yearId);
        } else {
          toast.warning("Tidak ada tahun akademik tersedia", {
            description: "Silakan tambahkan tahun akademik terlebih dahulu"
          });
          setAssignments([]);
        }
      } else {
        toast.error("Gagal memuat data tahun akademik. Silakan muat ulang halaman.");
        setAcademicYears([]);
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun akademik. Silakan muat ulang halaman.");
      setAcademicYears([]);
    }
  };
  
  // Search lecturers
  const searchLecturers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchedLecturers([]);
      setShowLecturerResults(false);
      return;
    }
    
    setLecturerSearchTerm(searchTerm);
    setShowLecturerResults(true);
    setSearchingLecturers(true);
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturers/search?query=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        setSearchedLecturers(response.data.data || []);
      } else {
        setSearchedLecturers([]);
        toast.error("Gagal mencari dosen", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error searching lecturers:", error);
      setSearchedLecturers([]);
      toast.error("Gagal mencari dosen", { duration: 2000 });
    } finally {
      setSearchingLecturers(false);
    }
  };
  
  // Select lecturer for assignment
  const selectLecturer = async (lecturer: Lecturer) => {
    // Check if user_id exists before proceeding - change to warning
    if (lecturer.user_id === undefined) {
      toast.warning("Data dosen tidak lengkap. ID pengguna tidak ditemukan.", {
        description: "Dosen belum disinkronisasi dengan pengguna sistem."
      });
      // Continue and select the lecturer anyway
    }
    
    setSelectedLecturer(lecturer);
    // Always use user_id from lecturer, fallback to lecturer.id if user_id is undefined
    setFormLecturerId(lecturer.user_id?.toString() || lecturer.id.toString());
    setFormLecturerName(lecturer.full_name);
    setShowLecturerResults(false);
  };
  
  // Fetch lecturer by ID
  const fetchLecturerById = async (id: number) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturers/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching lecturer:", error);
      return null;
    }
  };
  
  // Get available semesters from current assignments
  const availableSemesters = useMemo(() => {
    // Ensure assignments is an array before filtering
    if (!assignments || !Array.isArray(assignments)) {
      return [];
    }
    
    const semesters = [...new Set(assignments
      .filter(assignment => assignment.course?.semester !== undefined)
      .map(assignment => assignment.course?.semester))]
      .filter(Boolean)
      .sort() as number[];
    return semesters;
  }, [assignments]);
  
  // Filter assignments based on search query and semester filter
  const filteredAssignments = (assignments || []).filter((assignment) => {
    // Ensure assignment is defined
    if (!assignment) return false;
    
    const matchesSearch = 
      ((assignment.lecturer_name?.toLowerCase() || assignment.lecturer?.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())) ||
      ((assignment.course_name?.toLowerCase() || assignment.course?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())) ||
      ((assignment.course_code?.toLowerCase() || assignment.course?.code?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
    
    const matchesSemester = 
      semesterFilter === "all" || 
      (!assignment.course_semester && !assignment.course?.semester) || // Include assignments with undefined semester
      (semesterFilter && (assignment.course_semester === parseInt(semesterFilter) || assignment.course?.semester === parseInt(semesterFilter)));
    
    return matchesSearch && matchesSemester;
  });

  // Handle add assignment
  const handleAddAssignment = async () => {
    // Validate form inputs
    if (!formLecturerId || !formCourseId) {
      toast.error("Form tidak lengkap", {
        description: "Pilih dosen dan mata kuliah terlebih dahulu"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the active academic year if available, otherwise use the first one
      let academicYearId = formAcademicYearId;
      if (!academicYearId && academicYears.length > 0) {
        const activeYear = academicYears.find(year => year.name.includes("aktif"));
        academicYearId = activeYear ? activeYear.id.toString() : academicYears[0].id.toString();
      }
      
      // Prepare request data
      const requestData = {
        user_id: parseInt(formLecturerId),
        course_id: parseInt(formCourseId)
      };
      
      // Send request to API
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/assignments`, requestData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Penugasan dosen berhasil ditambahkan");
        resetForm();
        setShowAddDialog(false);
        fetchAssignments(); // Refresh assignments list
      } else {
        toast.error("Gagal menambahkan penugasan dosen", {
          description: response.data.message || "Terjadi kesalahan pada server"
        });
      }
    } catch (error: any) {
      console.error("Error adding assignment:", error);
      toast.error("Gagal menambahkan penugasan dosen", {
        description: error.response?.data?.message || error.message || "Terjadi kesalahan pada server"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit assignment
  const handleEditAssignment = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setFormLecturerId(assignment.user_id.toString());
    setFormLecturerName(assignment.lecturer_name || assignment.lecturer?.full_name || 'Unknown Lecturer');
    setFormCourseId(assignment.course_id.toString());
    setFormAcademicYearId(assignment.academic_year_id.toString());
    setShowEditDialog(true);
  };
  
  // Handle update assignment
  const handleUpdateAssignment = async () => {
    // Validate form inputs
    if (!formLecturerId || !formCourseId) {
      toast.error("Form tidak lengkap", {
        description: "Pilih dosen dan mata kuliah terlebih dahulu"
      });
      return;
    }
    
    if (!currentAssignment) {
      toast.error("Tidak ada penugasan yang sedang diedit");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare request data
      const requestData = {
        user_id: parseInt(formLecturerId),
        course_id: parseInt(formCourseId)
        // No academic_year_id, will be handled by backend
      };
      
      // Send request to API
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/assignments/${currentAssignment.id}`, 
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Penugasan dosen berhasil diperbarui");
        resetForm();
        setShowEditDialog(false);
        fetchAssignments(); // Refresh assignments list
      } else {
        toast.error("Gagal memperbarui penugasan dosen", {
          description: response.data.message || "Terjadi kesalahan pada server"
        });
      }
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast.error("Gagal memperbarui penugasan dosen", {
        description: error.response?.data?.message || error.message || "Terjadi kesalahan pada server"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle delete confirmation
  const confirmDeleteAssignment = (assignment: Assignment) => {
    setAssignmentToDelete({ 
      id: assignment.id, 
      name: `${assignment.lecturer_name || assignment.lecturer?.full_name || 'Unknown Lecturer'} - ${assignment.course_code || assignment.course?.code || ''} ${assignment.course_name || assignment.course?.name || ''}` 
    });
    setShowDeleteModal(true);
  };
  
  // Handle delete assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Delete the assignment using API
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/assignments/${assignmentToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        // Remove the assignment from the list
        setAssignments(prev => prev.filter(a => a.id !== assignmentToDelete.id));
        
        // Close modal
        setShowDeleteModal(false);
        setAssignmentToDelete(null);
        
        // Show success message
        toast.success("Penugasan dosen berhasil dihapus");
      } else {
        toast.error(response.data.message || "Gagal menghapus penugasan dosen");
      }
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus penugasan dosen");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormLecturerId("");
    setFormCourseId("");
    // Don't reset academic year ID to maintain context for multiple operations
    setFormLecturerName("");
    setSelectedLecturer(null);
    setCurrentAssignment(null);
  };

  // Fetch assignment by ID
  const fetchAssignmentById = async (id: number) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/assignments/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching assignment:", error);
      return null;
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <UserCog className="mr-2 h-6 w-6 text-[#0687C9]" />
                Penugasan Dosen
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola penugasan dosen untuk mata kuliah
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                // Replace error blocks with warning toasts
                if (courses.length === 0) {
                  toast.warning("Tidak ada mata kuliah tersedia", {
                    description: "Silakan tambahkan mata kuliah terlebih dahulu"
                  });
                }
                
                if (academicYears.length === 0) {
                  toast.warning("Tidak ada tahun akademik tersedia", {
                    description: "Silakan tambahkan tahun akademik terlebih dahulu"
                  });
                }
                
                setShowAddDialog(true);
              }}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Penugasan
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari dosen atau mata kuliah..."
                className="pl-10 w-full h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Select 
                onValueChange={(value) => setSemesterFilter(value)}
                value={semesterFilter || "all"}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {availableSemesters.map((semester) => (
                    <SelectItem key={semester} value={semester.toString()}>
                      Semester {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                onValueChange={(value) => {
                  if (value) {
                    setSelectedAcademicYearId(value);
                    fetchAssignments(value);
                  } else {
                    setSelectedAcademicYearId("");
                    setAssignments([]);
                  }
                }}
                value={selectedAcademicYearId}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Pilih Tahun Akademik" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} - {year.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-black w-16">No</TableHead>
                  <TableHead className="font-bold text-black">Dosen</TableHead>
                  <TableHead className="font-bold text-black">Kode MK</TableHead>
                  <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                  <TableHead className="text-center font-bold text-black">Semester</TableHead>
                  <TableHead className="font-bold text-black">Tahun Akademik</TableHead>
                  <TableHead className="text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2"></div>
                        <span>Memuat data awal...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2"></div>
                        <span>Memperbarui data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment, index) => (
                      <TableRow key={`assignment-${assignment.id}-${assignment.course_id}-${assignment.user_id}-${index}`}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.lecturer_name || assignment.lecturer?.full_name || 'Unknown Lecturer'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{assignment.course_code || assignment.course?.code || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.course_name || assignment.course?.name || 'Unknown Course'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{assignment.course_semester || assignment.course?.semester || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {assignment.academic_year_name || (typeof assignment.academic_year?.name === 'string' ? assignment.academic_year.name : 'N/A')} - 
                        {assignment.academic_year_semester || (typeof assignment.academic_year?.semester === 'string' ? assignment.academic_year.semester : 'N/A')}
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
                              onClick={() => handleEditAssignment(assignment)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteAssignment(assignment)}
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      {!selectedAcademicYearId ? 
                        "Silakan pilih tahun akademik" : 
                        "Tidak ada penugasan dosen yang sesuai dengan filter"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog untuk Tambah Penugasan */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Penugasan Dosen</DialogTitle>
            <DialogDescription>
              Tambahkan penugasan dosen baru untuk mata kuliah.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Dosen</label>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    placeholder="Cari nama dosen..."
                    value={formLecturerName}
                    onChange={(e) => {
                      setFormLecturerName(e.target.value);
                      searchLecturers(e.target.value);
                    }}
                    onFocus={() => {
                      if (lecturerSearchTerm.length >= 2) {
                        setShowLecturerResults(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay closing to allow for selection
                      setTimeout(() => setShowLecturerResults(false), 150);
                    }}
                  />
                  {showLecturerResults && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-lg">
                      <ul className="max-h-60 overflow-auto rounded-md py-1 text-base sm:text-sm">
                        {searchingLecturers ? (
                          <li className="px-4 py-2 text-gray-500 flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mencari dosen...
                          </li>
                        ) : searchedLecturers.length > 0 ? (
                          searchedLecturers.map((lecturer) => (
                            <li
                              key={lecturer.id}
                              onMouseDown={() => selectLecturer(lecturer)}
                              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                            >
                              <div className="font-medium">{lecturer.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {lecturer.nip && `NIP: ${lecturer.nip}`}
                                {lecturer.nip && lecturer.email && " | "}
                                {lecturer.email && `Email: ${lecturer.email}`}
                                {(lecturer.nip || lecturer.email) && " | "}
                                UserID: {lecturer.user_id || 'N/A'}
                              </div>
                            </li>
                          ))
                        ) : lecturerSearchTerm.length >= 2 ? (
                          <li className="px-4 py-2 text-gray-500">Tidak ada dosen yang sesuai</li>
                        ) : (
                          <li className="px-4 py-2 text-gray-500">Ketikkan minimal 2 karakter untuk mencari</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Mata Kuliah</label>
              <div className="col-span-3">
                <Select value={formCourseId} onValueChange={setFormCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name} (Semester {course.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button 
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              onClick={handleAddAssignment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk Edit Penugasan */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Penugasan Dosen</DialogTitle>
            <DialogDescription>
              Ubah penugasan dosen untuk mata kuliah.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Dosen</label>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    placeholder="Cari nama dosen..."
                    value={formLecturerName}
                    onChange={(e) => {
                      setFormLecturerName(e.target.value);
                      searchLecturers(e.target.value);
                    }}
                    onFocus={() => {
                      if (formLecturerName.length >= 2) {
                        setShowLecturerResults(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay closing to allow for selection
                      setTimeout(() => setShowLecturerResults(false), 150);
                    }}
                  />
                  {showLecturerResults && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-lg">
                      <ul className="max-h-60 overflow-auto rounded-md py-1 text-base sm:text-sm">
                        {searchingLecturers ? (
                          <li className="px-4 py-2 text-gray-500 flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mencari dosen...
                          </li>
                        ) : searchedLecturers.length > 0 ? (
                          searchedLecturers.map((lecturer) => (
                            <li
                              key={lecturer.id}
                              onMouseDown={() => selectLecturer(lecturer)}
                              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                            >
                              <div className="font-medium">{lecturer.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {lecturer.nip && `NIP: ${lecturer.nip}`}
                                {lecturer.nip && lecturer.email && " | "}
                                {lecturer.email && `Email: ${lecturer.email}`}
                                {(lecturer.nip || lecturer.email) && " | "}
                                UserID: {lecturer.user_id || 'N/A'}
                              </div>
                            </li>
                          ))
                        ) : formLecturerName.length >= 2 ? (
                          <li className="px-4 py-2 text-gray-500">Tidak ada dosen yang sesuai</li>
                        ) : (
                          <li className="px-4 py-2 text-gray-500">Ketikkan minimal 2 karakter untuk mencari</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Mata Kuliah</label>
              <div className="col-span-3">
                <Select value={formCourseId} onValueChange={setFormCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name} (Semester {course.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              onClick={handleUpdateAssignment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memperbarui...
                </>
              ) : "Perbarui"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAssignment}
        isLoading={isDeleting}
        title="Hapus Penugasan Dosen"
        description="Apakah Anda yakin ingin menghapus penugasan untuk"
        itemName={assignmentToDelete?.name}
      />
    </div>
  );
}
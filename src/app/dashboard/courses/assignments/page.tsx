"use client";

import { useState, useEffect } from "react";
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
  is_active: boolean;
  start_date: string;
  end_date: string;
}

// Interface for lecturer assignment
interface Assignment {
  id: number;
  uuid: string;
  user_id: number;  // Changed back to user_id to match the API response
  course_id: number;
  academic_year_id: number;
  lecturer: Lecturer;
  course: Course;
  academic_year: AcademicYear;
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
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string | null>("all");
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Load data on initial render
  useEffect(() => {
    // First fetch academic years, which will trigger fetching assignments with the right ID
    fetchAcademicYears();
    // Still fetch courses
    fetchCourses();
  }, []);
  
  // Fetch assignments from API
  const fetchAssignments = async (specificAcademicYearId?: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      
      // Use specificAcademicYearId or current active year
      const academicYearParam = specificAcademicYearId ? 
        `?academic_year_id=${specificAcademicYearId}` : '';
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturer-assignments${academicYearParam}`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        const assignmentsData = response.data.data || [];
        setAssignments(assignmentsData);
      } else {
        toast.error("Gagal memuat data penugasan");
      }
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      // If 404 or no active academic year, set empty assignments
      if (error.response?.status === 404 || 
          error.response?.data?.error === "No active academic year found") {
        setAssignments([]);
        toast.warning("Tidak ada tahun akademik aktif");
      } else {
        toast.error("Gagal memuat data penugasan");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setCourses(response.data.data);
      } else {
        toast.error("Gagal memuat data mata kuliah");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Gagal memuat data mata kuliah");
    }
  };
  
  // Fetch academic years from API
  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      
      try {
        const activeResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/academic-years/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (activeResponse.data.status === "success") {
          const activeYear = activeResponse.data.data;
          setActiveAcademicYear(activeYear);
          setFormAcademicYearId(activeYear.id.toString());
          // Set the selected academic year to the active one
          setSelectedAcademicYearId(activeYear.id.toString());
          
          // Fetch assignments specifically for this academic year
          console.log("Fetching assignments for active academic year:", activeYear.id);
          fetchAssignments(activeYear.id.toString());
        }
      } catch (error: any) {
        // If 404 or no active academic year, don't show error toast
        if (error.response?.status !== 404 && 
            error.response?.data?.error !== "No active academic year found") {
          toast.error("Gagal memuat data tahun akademik aktif");
        }
      }
      
      const allResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/academic-years`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (allResponse.data.status === "success") {
        setAcademicYears(allResponse.data.data);
        
        // If no active academic year found, use the first one in the list
        if (!activeAcademicYear && allResponse.data.data.length > 0) {
          const firstYear = allResponse.data.data[0];
          setFormAcademicYearId(firstYear.id.toString());
          setSelectedAcademicYearId(firstYear.id.toString());
          
          // Fetch assignments for this academic year since there's no active one
          console.log("No active year, fetching assignments for first academic year:", firstYear.id);
          fetchAssignments(firstYear.id.toString());
        }
      } else {
        toast.error("Gagal memuat data tahun akademik");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun akademik");
    }
  };
  
  // Fetch lecturers with search term from API
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
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturers/search?q=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setSearchedLecturers(response.data.data);
      } else {
        console.error("Failed to search lecturers:", response.data);
        setSearchedLecturers([]);
      }
    } catch (error) {
      console.error("Error searching lecturers:", error);
      setSearchedLecturers([]);
    } finally {
      setSearchingLecturers(false);
    }
  };
  
  // Select lecturer for assignment
  const selectLecturer = async (lecturer: Lecturer) => {
    // Check if user_id exists before proceeding
    if (lecturer.user_id === undefined) {
      toast.error("Data dosen tidak lengkap. ID pengguna tidak ditemukan.");
      return;
    }
    
    setSelectedLecturer(lecturer);
    // Always use user_id from lecturer
    setFormLecturerId(lecturer.user_id.toString());
    setFormLecturerName(lecturer.full_name);
    setShowLecturerResults(false);
  };
  
  // Fetch lecturer by ID
  const fetchLecturerById = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching lecturer by ID:", error);
      return null;
    }
  };
  
  // Filter assignments based on search query and semester filter
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = 
      assignment.lecturer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSemester = 
      semesterFilter === "all" || 
      (semesterFilter && assignment.course.semester === parseInt(semesterFilter));
    
    return matchesSearch && matchesSemester;
  });

  // Handle add assignment
  const handleAddAssignment = async () => {
    if (!formLecturerId || !formCourseId || !formAcademicYearId) {
      toast.error("Mohon lengkapi semua field");
      return;
    }
    
    const lecturerId = parseInt(formLecturerId);
    const courseId = parseInt(formCourseId);
    const academicYearId = parseInt(formAcademicYearId);
    
    // Validate that we have a valid user_id (not lecturer.id)
    if (selectedLecturer && selectedLecturer.user_id === undefined) {
      toast.error("Data dosen tidak valid, silakan pilih dosen lain");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturer-assignments`;
      
      // Use user_id as the field name since that's what the backend expects now
      const payload = {
        user_id: lecturerId,
        course_id: courseId,
        academic_year_id: academicYearId
      };
      
      // Debugging - log the data being sent
      console.log("Sending payload:", payload);
      
      const response = await axios.post(
        apiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Penugasan dosen berhasil ditambahkan");
        
        // Fetch assignments to refresh the table, with a short delay to allow database to update
        try {
          // Short delay before fetching to ensure database is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchAssignments(academicYearId.toString());
        } catch (refreshError) {
          console.error("Error refreshing assignments:", refreshError);
        }
        
        setShowAddDialog(false);
        resetForm();
      } else {
        toast.error("Gagal menambahkan penugasan dosen: " + (response.data.error || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error adding assignment:", error);
      if (error.response) {
        // Check for 409 Conflict status specifically
        if (error.response.status === 409) {
          toast.error("Dosen sudah ditugaskan untuk mata kuliah ini pada tahun akademik yang dipilih");
        } else {
          const errorMessage = error.response.data?.error || "Gagal menambahkan penugasan dosen";
          toast.error(errorMessage);
        }
      } else if (error.request) {
        toast.error("Tidak ada respons dari server. Silakan coba lagi.");
      } else {
        toast.error("Terjadi kesalahan: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit assignment
  const handleEditAssignment = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setFormLecturerId(assignment.user_id.toString());
    setFormLecturerName(assignment.lecturer.full_name);
    setFormCourseId(assignment.course_id.toString());
    setFormAcademicYearId(assignment.academic_year_id.toString());
    setShowEditDialog(true);
  };
  
  // Handle update assignment
  const handleUpdateAssignment = async () => {
    if (!currentAssignment || !formLecturerId || !formCourseId || !formAcademicYearId) {
      toast.error("Mohon lengkapi semua field");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturer-assignments/${currentAssignment.id}`,
        {
          user_id: parseInt(formLecturerId),
          course_id: parseInt(formCourseId),
          academic_year_id: parseInt(formAcademicYearId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Penugasan dosen berhasil diperbarui");
        fetchAssignments(formAcademicYearId);
        setShowEditDialog(false);
        resetForm();
      } else {
        toast.error("Gagal memperbarui penugasan dosen");
      }
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      const errorMessage = error.response?.data?.error || "Gagal memperbarui penugasan dosen";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle delete confirmation
  const confirmDeleteAssignment = (assignment: Assignment) => {
    setAssignmentToDelete({ 
      id: assignment.id, 
      name: `${assignment.lecturer.full_name} - ${assignment.course.code} ${assignment.course.name}` 
    });
    setShowDeleteModal(true);
  };
  
  // Handle delete assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturer-assignments/${assignmentToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Penugasan dosen berhasil dihapus");
        fetchAssignments(selectedAcademicYearId);
        setShowDeleteModal(false);
        setAssignmentToDelete(null);
      } else {
        toast.error("Gagal menghapus penugasan dosen");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Gagal menghapus penugasan dosen");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormLecturerId("");
    setFormCourseId("");
    setLecturerSearchTerm("");
    setFormLecturerName("");
    setSearchedLecturers([]);
    setSelectedLecturer(null);
    if (activeAcademicYear) {
      setFormAcademicYearId(activeAcademicYear.id.toString());
    } else {
      setFormAcademicYearId("");
    }
    setCurrentAssignment(null);
  };

  // Fetch assignment by ID to verify data
  const fetchAssignmentById = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturer-assignments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        console.log("Complete assignment data:", response.data.data);
        return response.data.data;
      }
      console.error("Failed to fetch assignment details:", response.data);
      return null;
    } catch (error) {
      console.error("Error fetching assignment by ID:", error);
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
                setShowAddDialog(true);
              }}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Penugasan
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari dosen atau mata kuliah..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <Select 
                onValueChange={(value) => setSemesterFilter(value)}
                value={semesterFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                    <SelectItem key={semester} value={semester.toString()}>
                      Semester {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-72">
              <Select 
                onValueChange={(value) => {
                  setSelectedAcademicYearId(value);
                  fetchAssignments(value);
                }}
                value={selectedAcademicYearId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tahun Akademik" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} - {year.semester} {year.is_active && '(Aktif)'}
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2"></div>
                        <span>Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment, index) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.lecturer.full_name}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{assignment.course.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.course.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{assignment.course.semester}</TableCell>
                      <TableCell className="font-medium">
                        {assignment.academic_year.name} - {assignment.academic_year.semester}
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
                      Tidak ada penugasan dosen yang sesuai dengan filter
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
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Tahun Akademik</label>
              <div className="col-span-3">
                <Select value={formAcademicYearId} onValueChange={setFormAcademicYearId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun akademik" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name} - {year.semester} {year.is_active && '(Aktif)'}
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
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
              Ubah detail penugasan dosen untuk mata kuliah.
            </DialogDescription>
          </DialogHeader>
          
          {currentAssignment && (
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
                      <SelectValue />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Tahun Akademik</label>
                <div className="col-span-3">
                  <Select value={formAcademicYearId} onValueChange={setFormAcademicYearId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name} - {year.semester} {year.is_active && '(Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
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
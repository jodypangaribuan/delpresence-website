"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users, UserCheck, UserX, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import axios from "axios";
import { toast } from "sonner";

// Skema validasi untuk form
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Nama kelompok harus terdiri dari minimal 2 karakter.",
  }),
  department_id: z.coerce.number().min(1, {
    message: "Program studi harus dipilih.",
  }),
  semester: z.coerce.number().min(1, {
    message: "Semester harus dipilih.",
  }),
  academic_year_id: z.coerce.number().min(1, {
    message: "Tahun akademik harus dipilih.",
  })
});

// Interface untuk data kelompok mahasiswa
interface StudentGroup {
  id: number;
  name: string;
  department: {
    id: number;
    name: string;
  };
  semester: number;
  academic_year: {
    id: number;
    name: string;
    semester?: "ganjil" | "genap";
    is_active?: boolean;
  };
  student_count: number;
  created_at: string;
  updated_at: string;
}

// Interface untuk data mahasiswa
interface Student {
  id: number;
  nim: string;
  full_name: string;
  study_program_id?: number;
  study_program?: string;
  faculty?: string;
  year_enrolled?: number;
  status?: string;
  selected?: boolean;
}

// Interface untuk data program studi
interface Department {
  id: number;
  name: string;
  faculty_id: number;
  faculty_name?: string;
}

// Interface untuk data tahun akademik
interface AcademicYear {
  id: number;
  name: string;
  semester: "ganjil" | "genap";
  is_active: boolean;
}

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function StudentGroupsPage() {
  // State
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [groupMembers, setGroupMembers] = useState<Student[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("all");
  const [studentYearFilter, setStudentYearFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availablePage, setAvailablePage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Constants
  const STUDENTS_PER_PAGE = 30; // Batas jumlah mahasiswa per halaman

  // Form untuk tambah/edit kelompok
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department_id: 0,
      semester: 0,
      academic_year_id: 0,
    },
  });

  // Load data awal
  useEffect(() => {
    fetchStudentGroups();
    fetchDepartments();
    fetchAcademicYears();
  }, []);

  // Function to fetch student groups from API
  const fetchStudentGroups = async () => {
    setIsLoading(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/student-groups`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setStudentGroups(response.data.data);
      } else {
        toast.error("Gagal memuat data kelompok mahasiswa");
      }
    } catch (error) {
      console.error("Error fetching student groups:", error);
      toast.error("Terjadi kesalahan saat memuat data kelompok mahasiswa");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch departments (study programs) from API
  const fetchDepartments = async () => {
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/study-programs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setDepartments(response.data.data);
        
        // Show warning if no departments are available
        if (response.data.data.length === 0) {
          toast.warning("Tidak ada program studi tersedia", {
            description: "Silakan tambahkan program studi terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data program studi");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Terjadi kesalahan saat memuat data program studi");
    }
  };

  // Function to fetch academic years from API
  const fetchAcademicYears = async () => {
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/academic-years`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setAcademicYears(response.data.data);
        
        // Show warning if no academic years are available
        if (response.data.data.length === 0) {
          toast.warning("Tidak ada tahun akademik tersedia", {
            description: "Silakan tambahkan tahun akademik terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data tahun akademik");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Terjadi kesalahan saat memuat data tahun akademik");
    }
  };

  // Function to fetch available students for a group
  const fetchAvailableStudents = async (groupId: number) => {
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/student-groups/${groupId}/available-students`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        const studentsWithSelected = response.data.data.map((student: Student) => ({
          ...student,
          selected: false
        }));
        setAvailableStudents(studentsWithSelected);
      } else {
        toast.error("Gagal memuat data mahasiswa yang tersedia");
      }
    } catch (error) {
      console.error("Error fetching available students:", error);
      toast.error("Terjadi kesalahan saat memuat data mahasiswa yang tersedia");
    }
  };

  // Function to fetch group members
  const fetchGroupMembers = async (groupId: number) => {
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/student-groups/${groupId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        const membersWithSelected = response.data.data.map((student: Student) => ({
          ...student,
          selected: false
        }));
        setGroupMembers(membersWithSelected);
      } else {
        toast.error("Gagal memuat data anggota kelompok");
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast.error("Terjadi kesalahan saat memuat data anggota kelompok");
    }
  };

  // Filter untuk mencari grup
  const filteredGroups = studentGroups.filter((group) => {
    const matchesSearch = searchTerm 
      ? group.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesDept = deptFilter && deptFilter !== "all" 
      ? group.department.id === parseInt(deptFilter) 
      : true;
    const matchesSemester = semesterFilter && semesterFilter !== "all" 
      ? group.semester === parseInt(semesterFilter) 
      : true;
    const matchesAcademicYear = academicYearFilter && academicYearFilter !== "all" 
      ? group.academic_year.id === parseInt(academicYearFilter) 
      : true;
    
    return matchesSearch && matchesDept && matchesSemester && matchesAcademicYear;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredGroups.length / pageSize);
  const currentData = filteredGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Utility function to safely handle batch operation responses
  const handleBatchResponse = (response: any, successMessage: string, failureMessage: string) => {
    if (response?.data?.status === "success") {
      const successCount = response.data.data?.success_count || 0;
      
      if (successCount > 0) {
        toast.success(`${successCount} ${successMessage}`);
      }
      
      const failedCount = response.data.data?.failed_students?.length || 0;
      if (failedCount > 0) {
        toast.warning(`${failedCount} ${failureMessage}`);
      }
      
      return true;
    }
    return false;
  };

  // Handle submit form tambah kelompok
  const onSubmitAdd = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/student-groups`, 
        values, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Kelompok mahasiswa berhasil ditambahkan");
        fetchStudentGroups();
        setIsAddDialogOpen(false);
        form.reset();
      } else {
        toast.error("Gagal menambahkan kelompok mahasiswa");
      }
    } catch (error) {
      console.error("Error adding student group:", error);
      toast.error("Terjadi kesalahan saat menambahkan kelompok mahasiswa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit form edit kelompok
  const onSubmitEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedGroup) return;
    
    setIsSubmitting(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/student-groups/${selectedGroup.id}`, 
        values, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Kelompok mahasiswa berhasil diperbarui");
        fetchStudentGroups();
        setIsEditDialogOpen(false);
        form.reset();
      } else {
        toast.error("Gagal memperbarui kelompok mahasiswa");
      }
    } catch (error) {
      console.error("Error updating student group:", error);
      toast.error("Terjadi kesalahan saat memperbarui kelompok mahasiswa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete kelompok
  const handleDelete = async () => {
    if (!selectedGroup) return;
    
    setIsSubmitting(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/student-groups/${selectedGroup.id}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Kelompok mahasiswa berhasil dihapus");
        fetchStudentGroups();
        setIsDeleteDialogOpen(false);
      } else {
        toast.error("Gagal menghapus kelompok mahasiswa");
      }
    } catch (error) {
      console.error("Error deleting student group:", error);
      toast.error("Terjadi kesalahan saat menghapus kelompok mahasiswa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Setup dialog edit kelompok
  const setupEditDialog = (group: StudentGroup) => {
    setSelectedGroup(group);
    form.setValue("name", group.name);
    form.setValue("department_id", group.department.id);
    form.setValue("semester", group.semester);
    form.setValue("academic_year_id", group.academic_year.id);
    setIsEditDialogOpen(true);
  };

  // Setup dialog hapus kelompok
  const setupDeleteDialog = (group: StudentGroup) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  // Setup dialog kelola anggota kelompok
  const setupManageMembersDialog = async (group: StudentGroup) => {
    setSelectedGroup(group);
    setIsManageMembersDialogOpen(true);
    // Reset filters dan pagination
    setStudentSearchTerm("");
    setStudentDeptFilter("all");
    setStudentYearFilter("all");
    setAvailablePage(1);
    setMembersPage(1);
    await Promise.all([
      fetchAvailableStudents(group.id),
      fetchGroupMembers(group.id)
    ]);
  };

  // Filter students in manage members dialog
  const filteredAvailableStudents = availableStudents.filter(student => {
    // Text search filter
    const textMatch = student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (student.nim && student.nim.toLowerCase().includes(studentSearchTerm.toLowerCase()));
    
    // Department filter
    const deptMatch = studentDeptFilter === "all" || student.study_program_id === parseInt(studentDeptFilter);
    
    // Year filter (angkatan)
    const yearMatch = studentYearFilter === "all" || student.year_enrolled === parseInt(studentYearFilter);
    
    return textMatch && deptMatch && yearMatch;
  });

  const filteredGroupMembers = groupMembers.filter(student => 
    student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    (student.nim && student.nim.toLowerCase().includes(studentSearchTerm.toLowerCase()))
  );

  // Get unique study programs from available students for filter
  const getUniqueStudyPrograms = () => {
    const programs = new Map();
    
    // Collect from available students
    availableStudents.forEach(student => {
      if (student.study_program_id && student.study_program) {
        programs.set(student.study_program_id, student.study_program);
      }
    });
    
    // Collect from group members as well
    groupMembers.forEach(student => {
      if (student.study_program_id && student.study_program) {
        programs.set(student.study_program_id, student.study_program);
      }
    });
    
    return Array.from(programs).map(([id, name]) => ({
      id: id,
      name: name
    }));
  };
  
  // Get unique enrollment years from available students for filter
  const getUniqueEnrollmentYears = () => {
    const years = new Set<number>();
    
    // Collect from available students
    availableStudents.forEach(student => {
      if (student.year_enrolled) {
        years.add(student.year_enrolled);
      }
    });
    
    // Collect from group members as well
    groupMembers.forEach(student => {
      if (student.year_enrolled) {
        years.add(student.year_enrolled);
      }
    });
    
    return Array.from(years).sort((a: number, b: number) => b - a); // Sort descending (newest first)
  };
  
  // Get the study programs and years for filters
  const uniqueStudyPrograms = getUniqueStudyPrograms();
  const uniqueEnrollmentYears = getUniqueEnrollmentYears();

  // Apply pagination to filtered students
  const paginatedAvailableStudents = filteredAvailableStudents.slice(
    (availablePage - 1) * STUDENTS_PER_PAGE,
    availablePage * STUDENTS_PER_PAGE
  );
  
  const paginatedGroupMembers = filteredGroupMembers.slice(
    (membersPage - 1) * STUDENTS_PER_PAGE,
    membersPage * STUDENTS_PER_PAGE
  );
  
  // Calculate max pages
  const maxAvailablePages = Math.ceil(filteredAvailableStudents.length / STUDENTS_PER_PAGE);
  const maxMembersPages = Math.ceil(filteredGroupMembers.length / STUDENTS_PER_PAGE);
  
  // Pagination controls for available students
  const renderAvailablePagination = () => {
    return (
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
        <div>
          Menampilkan {filteredAvailableStudents.length > 0 ? (availablePage - 1) * STUDENTS_PER_PAGE + 1 : 0} - {Math.min(availablePage * STUDENTS_PER_PAGE, filteredAvailableStudents.length)} dari {filteredAvailableStudents.length}
        </div>
        <div className="flex gap-1">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-7 w-7"
            onClick={() => setAvailablePage(p => Math.max(1, p - 1))}
            disabled={availablePage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-7 w-7"
            onClick={() => setAvailablePage(p => Math.min(maxAvailablePages, p + 1))}
            disabled={availablePage === maxAvailablePages || maxAvailablePages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  
  // Pagination controls for group members
  const renderMembersPagination = () => {
    return (
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
        <div>
          Menampilkan {filteredGroupMembers.length > 0 ? (membersPage - 1) * STUDENTS_PER_PAGE + 1 : 0} - {Math.min(membersPage * STUDENTS_PER_PAGE, filteredGroupMembers.length)} dari {filteredGroupMembers.length}
        </div>
        <div className="flex gap-1">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-7 w-7"
            onClick={() => setMembersPage(p => Math.max(1, p - 1))}
            disabled={membersPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-7 w-7"
            onClick={() => setMembersPage(p => Math.min(maxMembersPages, p + 1))}
            disabled={membersPage === maxMembersPages || maxMembersPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Toggle select all available students
  const toggleSelectAllAvailable = (checked: boolean) => {
    // Update semua mahasiswa yang terfilter, bukan hanya yang ada di halaman saat ini
    setAvailableStudents(
      availableStudents.map(student => {
        // Cek apakah mahasiswa ini ada di daftar terfilter
        const isFiltered = filteredAvailableStudents.some(s => s.id === student.id);
        // Jika terfilter, update status seleksi, jika tidak, pertahankan status seleksi sebelumnya
        return isFiltered ? { ...student, selected: checked } : student;
      })
    );
  };

  // Toggle select all group members
  const toggleSelectAllMembers = (checked: boolean) => {
    // Update semua mahasiswa yang terfilter, bukan hanya yang ada di halaman saat ini
    setGroupMembers(
      groupMembers.map(student => {
        // Cek apakah mahasiswa ini ada di daftar terfilter
        const isFiltered = filteredGroupMembers.some(s => s.id === student.id);
        // Jika terfilter, update status seleksi, jika tidak, pertahankan status seleksi sebelumnya
        return isFiltered ? { ...student, selected: checked } : student;
      })
    );
  };

  // Add students to group
  const addStudentsToGroup = async () => {
    if (!selectedGroup) return;
    
    // Ambil semua mahasiswa terfilter yang dipilih, bukan hanya yang ada di halaman saat ini
    const selectedStudents = filteredAvailableStudents
      .filter(student => {
        // Cari mahasiswa di availableStudents menggunakan ID
        const originalStudent = availableStudents.find(s => s.id === student.id);
        // Jika ditemukan dan selected, masukkan ke daftar
        return originalStudent && originalStudent.selected;
      })
      .map(student => student.id);
    
    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal satu mahasiswa untuk ditambahkan");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/student-groups/${selectedGroup.id}/members/batch`, 
        { student_ids: selectedStudents }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const success = handleBatchResponse(
        response, 
        "mahasiswa berhasil ditambahkan ke kelompok",
        "mahasiswa gagal ditambahkan"
      );
      
      if (success) {
        // Refresh data
        await Promise.all([
          fetchStudentGroups(),
          fetchAvailableStudents(selectedGroup.id),
          fetchGroupMembers(selectedGroup.id)
        ]);
      } else {
        toast.error("Gagal menambahkan mahasiswa ke kelompok");
      }
    } catch (error) {
      console.error("Error adding students to group:", error);
      toast.error("Terjadi kesalahan saat menambahkan mahasiswa ke kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove students from group
  const removeStudentsFromGroup = async () => {
    if (!selectedGroup) return;
    
    // Ambil semua mahasiswa terfilter yang dipilih, bukan hanya yang ada di halaman saat ini
    const selectedStudents = filteredGroupMembers
      .filter(student => {
        // Cari mahasiswa di groupMembers menggunakan ID
        const originalStudent = groupMembers.find(s => s.id === student.id);
        // Jika ditemukan dan selected, masukkan ke daftar
        return originalStudent && originalStudent.selected;
      })
      .map(student => student.id);
    
    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal satu mahasiswa untuk dihapus");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Get token from sessionStorage first, fallback to localStorage
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/student-groups/${selectedGroup.id}/members/remove-batch`, 
        { student_ids: selectedStudents }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const success = handleBatchResponse(
        response, 
        "mahasiswa berhasil dihapus dari kelompok",
        "mahasiswa gagal dihapus"
      );
      
      if (success) {
        // Refresh data
        await Promise.all([
          fetchStudentGroups(),
          fetchAvailableStudents(selectedGroup.id),
          fetchGroupMembers(selectedGroup.id)
        ]);
      } else {
        toast.error("Gagal menghapus mahasiswa dari kelompok");
      }
    } catch (error) {
      console.error("Error removing students from group:", error);
      toast.error("Terjadi kesalahan saat menghapus mahasiswa dari kelompok");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle select individual available student
  const toggleSelectAvailableStudent = (id: number, checked: boolean) => {
    setAvailableStudents(
      availableStudents.map(student => 
        student.id === id 
          ? { ...student, selected: checked } 
          : student
      )
    );
  };

  // Toggle select individual group member
  const toggleSelectGroupMember = (id: number, checked: boolean) => {
    setGroupMembers(
      groupMembers.map(student => 
        student.id === id 
          ? { ...student, selected: checked } 
          : student
      )
    );
  };

  // Pagination
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <TooltipProvider>
      <div className="container p-4 mx-auto">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center">
                  <Users className="mr-2 h-6 w-6 text-[#0687C9]" />
                  Kelompok Mahasiswa
                </CardTitle>
                <CardDescription className="mt-1">
                  Kelola kelompok mahasiswa dari berbagai program studi dan semester
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  form.reset();
                  setIsAddDialogOpen(true);
                }}
                className="bg-[#0687C9] hover:bg-[#0670a8]"
              >
                <Plus className="h-4 w-4 mr-2" /> Tambah Kelompok
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama kelompok..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={deptFilter || "all"} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Program Studi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Program Studi</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={semesterFilter || "all"} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Semester</SelectItem>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Semester {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={academicYearFilter || "all"} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tahun Akademik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun Akademik</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name} - {year.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-2 border-[#0687C9] border-opacity-50 border-t-[#0687C9] rounded-full"></div>
                <span className="ml-2">Memuat data...</span>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                      <TableHead className="font-bold text-black">Nama Kelompok</TableHead>
                      <TableHead className="font-bold text-black">Program Studi</TableHead>
                      <TableHead className="font-bold text-black">Semester</TableHead>
                      <TableHead className="font-bold text-black">Jumlah Mahasiswa</TableHead>
                      <TableHead className="font-bold text-black">Tahun Akademik</TableHead>
                      <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="mt-2 text-sm text-gray-500">
                            {searchTerm || deptFilter !== "all" || semesterFilter !== "all" || academicYearFilter !== "all"
                              ? "Tidak ada data kelompok yang sesuai dengan filter"
                              : "Belum ada data kelompok mahasiswa"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((group, index) => {
                        const department = departments.find((d) => d.id === group.department.id);
                        const academicYear = academicYears.find((y) => y.id === group.academic_year.id);
                        
                        return (
                          <TableRow key={group.id}>
                            <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{department?.name || group.department?.name}</TableCell>
                            <TableCell>Semester {group.semester}</TableCell>
                            <TableCell>{group.student_count} Mahasiswa</TableCell>
                            <TableCell>
                              {academicYear ? `${academicYear.name} - ${academicYear.semester}` : 
                                `${group.academic_year.name} - ${group.academic_year.semester}`}
                              {group.academic_year.is_active && (
                                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                  Aktif
                                </Badge>
                              )}
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
                                    onClick={() => setupEditDialog(group)}
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Kelompok
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setupManageMembersDialog(group)}
                                    className="cursor-pointer"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Lihat Anggota
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setupDeleteDialog(group)}
                                    className="cursor-pointer text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus Kelompok
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredGroups.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, filteredGroups.length)} dari {filteredGroups.length} data
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      className={currentPage === pageNumber ? "bg-[#0687C9] hover:bg-[#0670a8]" : ""}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Tambah Kelompok */}
        <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
          setIsAddDialogOpen(isOpen);
          if (!isOpen) form.reset();
        }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Tambah Kelompok Mahasiswa</DialogTitle>
              <DialogDescription>
                Isi detail informasi kelompok mahasiswa baru di bawah ini.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nama Kelompok</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="e.g., Kelas A, Kelompok Belajar 1, dll." {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Program Studi</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program studi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Semester</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 8 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Semester {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="academic_year_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tahun Akademik</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun akademik" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.id.toString()}>
                                {year.name} - {year.semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset();
                  }}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0687C9] hover:bg-[#0670a8]" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog Edit Kelompok */}
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) form.reset();
        }}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Kelompok Mahasiswa</DialogTitle>
              <DialogDescription>
                Ubah detail informasi kelompok mahasiswa.
              </DialogDescription>
            </DialogHeader>
           
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nama Kelompok</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="e.g., Kelas A, Kelompok Belajar 1, dll." {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
               
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Program Studi</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program studi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
               
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Semester</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 8 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Semester {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
               
                <FormField
                  control={form.control}
                  name="academic_year_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tahun Akademik</FormLabel>
                      <div className="col-span-3">
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(val) => field.onChange(parseInt(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun akademik" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={year.id.toString()}>
                                {year.name} - {year.semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
               
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0687C9] hover:bg-[#0670a8]" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog Konfirmasi Hapus */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Konfirmasi Hapus Kelompok</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus kelompok <span className="font-semibold">"{selectedGroup?.name}"</span>?
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-start mt-6">
              <Button
                variant="destructive" 
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hapus
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Batal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Kelola Anggota Kelompok */}
        <Dialog 
          open={isManageMembersDialogOpen} 
          onOpenChange={(open) => {
            setIsManageMembersDialogOpen(open);
            if (!open) {
              // Reset filters when dialog is closed
              setStudentSearchTerm("");
              setStudentDeptFilter("all");
              setStudentYearFilter("all");
            }
          }}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0687C9]">
                <Users className="h-5 w-5" />
                Kelola Anggota Kelompok
              </DialogTitle>
              <DialogDescription>
                Kelola anggota untuk kelompok <span className="font-semibold">{selectedGroup?.name}</span>
              </DialogDescription>
            </DialogHeader>
          
            <div className="flex flex-col h-[600px]">
              <div className="mb-4">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Select value={studentDeptFilter} onValueChange={setStudentDeptFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter Program Studi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Program Studi</SelectItem>
                      {uniqueStudyPrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={studentYearFilter} onValueChange={setStudentYearFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter Angkatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Angkatan</SelectItem>
                      {uniqueEnrollmentYears.map((year: number) => (
                        <SelectItem key={year} value={year.toString()}>
                          Angkatan {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 h-full overflow-auto">
                {/* Kolom Mahasiswa Tersedia */}
                <div className="border rounded-md flex flex-col h-full overflow-hidden border-blue-200">
                  <div className="p-3 border-b bg-blue-100 flex justify-between items-center">
                    <h3 className="font-medium text-sm flex items-center">
                      <UserX className="h-4 w-4 mr-2 text-blue-500" />
                      Mahasiswa Tersedia ({filteredAvailableStudents.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-available"
                        onCheckedChange={(checked) => toggleSelectAllAvailable(!!checked)}
                        checked={
                          filteredAvailableStudents.length > 0 && 
                          filteredAvailableStudents.every(student => {
                            const originalStudent = availableStudents.find(s => s.id === student.id);
                            return originalStudent && originalStudent.selected;
                          })
                        }
                      />
                      <Label htmlFor="select-all-available" className="text-xs">
                        Pilih Semua
                      </Label>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-3">
                      {isSubmitting ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : filteredAvailableStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tidak ada mahasiswa tersedia
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {paginatedAvailableStudents.map((student) => (
                            <div 
                              key={student.id} 
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                            >
                              <Checkbox
                                id={`available-${student.id}`}
                                checked={student.selected}
                                onCheckedChange={(checked) => 
                                  toggleSelectAvailableStudent(student.id, !!checked)
                                }
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground">{student.nim}</p>
                                {student.study_program && (
                                  <p className="text-xs text-muted-foreground">{student.study_program}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Pagination for available students */}
                  {filteredAvailableStudents.length > STUDENTS_PER_PAGE && renderAvailablePagination()}
                  
                  <div className="p-3 border-t">
                    <Button 
                      onClick={addStudentsToGroup} 
                      disabled={
                        isSubmitting || 
                        !filteredAvailableStudents.some(student => {
                          const originalStudent = availableStudents.find(s => s.id === student.id);
                          return originalStudent && originalStudent.selected;
                        })
                      }
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UserCheck className="h-4 w-4 mr-2" /> 
                      Tambahkan ke Kelompok
                    </Button>
                  </div>
                </div>
                
                {/* Kolom Anggota Kelompok */}
                <div className="border rounded-md flex flex-col h-full overflow-hidden border-green-200">
                  <div className="p-3 border-b bg-green-100 flex justify-between items-center">
                    <h3 className="font-medium text-sm flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                      Anggota Kelompok ({filteredGroupMembers.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-members"
                        onCheckedChange={(checked) => toggleSelectAllMembers(!!checked)}
                        checked={
                          filteredGroupMembers.length > 0 && 
                          filteredGroupMembers.every(student => {
                            const originalStudent = groupMembers.find(s => s.id === student.id);
                            return originalStudent && originalStudent.selected;
                          })
                        }
                      />
                      <Label htmlFor="select-all-members" className="text-xs">
                        Pilih Semua
                      </Label>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-3">
                      {isSubmitting ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        </div>
                      ) : filteredGroupMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Belum ada anggota dalam kelompok ini
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {paginatedGroupMembers.map((student) => (
                            <div 
                              key={student.id} 
                              className="flex items-center space-x-2 p-2 rounded-md hover:bg-green-50 border border-transparent hover:border-green-200 transition-colors"
                            >
                              <Checkbox
                                id={`member-${student.id}`}
                                checked={student.selected}
                                onCheckedChange={(checked) => 
                                  toggleSelectGroupMember(student.id, !!checked)
                                }
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{student.full_name}</p>
                                <p className="text-xs text-muted-foreground">{student.nim}</p>
                                {student.study_program && (
                                  <p className="text-xs text-muted-foreground">{student.study_program}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Pagination for group members */}
                  {filteredGroupMembers.length > STUDENTS_PER_PAGE && renderMembersPagination()}
                  
                  <div className="p-3 border-t">
                    <Button 
                      onClick={removeStudentsFromGroup} 
                      disabled={
                        isSubmitting || 
                        !filteredGroupMembers.some(student => {
                          const originalStudent = groupMembers.find(s => s.id === student.id);
                          return originalStudent && originalStudent.selected;
                        })
                      }
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UserX className="h-4 w-4 mr-2" /> 
                      Hapus dari Kelompok
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                onClick={() => setIsManageMembersDialogOpen(false)}
                className="bg-[#0687C9] hover:bg-[#056da5]"
              >
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
} 
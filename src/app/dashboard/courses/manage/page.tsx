"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Clock,
  CalendarDays,
  Building,
  Users
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Type untuk data Mata Kuliah
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
    faculty_id?: number;
    faculty?: {
      id: number;
      name: string;
    };
  };
  faculty_name?: string;
  faculty?: {
    id: number;
    name: string;
  };
  course_type: "theory" | "practice" | "mixed";
  academic_year_id?: number;
  academic_year?: {
    id: number;
    name: string;
    semester: string;
  };
}

// Type for Study Program (Department)
interface Department {
  id: number;
  name: string;
  faculty_id: number;
  faculty: Faculty;
}

// Type for Faculty
interface Faculty {
  id: number;
  name: string;
}

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null);
  const [academicYearFilter, setAcademicYearFilter] = useState<string | null>(null);
  const [uniqueSemesters, setUniqueSemesters] = useState<number[]>([]);
  const [uniqueAcademicYears, setUniqueAcademicYears] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form for adding a new course
  const addForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      department_id: "",
      credits: 0,
      semester: 1,
      course_type: "theory",
      academic_year_id: ""
    }
  });
  
  // Form for editing a course
  const editForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      department_id: "",
      credits: 0,
      semester: 1,
      course_type: "theory",
      academic_year_id: ""
    }
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchAcademicYears();
  }, []);

  // Add effect to log when department filter changes
  useEffect(() => {
    if (departmentFilter) {
      console.log("Department filter changed to:", departmentFilter);
      const normalizedFilter = normalizeString(departmentFilter);
      
      // Count how many courses should match this filter
      const matchingCourses = courses.filter(course => {
        // Try matching by department.name
        if (normalizeString(course.department?.name) === normalizedFilter) {
          return true;
        }
        // Try matching by department_name
        if (normalizeString(course.department_name) === normalizedFilter) {
          return true;
        }
        // Try matching by department_id
        if (course.department_id) {
          const dept = departments.find(d => d.id === course.department_id);
          if (dept && normalizeString(dept.name) === normalizedFilter) {
            return true;
          }
        }
        return false;
      });
      
      console.log(`Found ${matchingCourses.length} courses matching department filter out of ${courses.length} total courses`);
      
      if (matchingCourses.length === 0) {
        console.log("Sample courses with department data:");
        courses.slice(0, 5).forEach((course, idx) => {
          console.log(`Course ${idx}:`, {
            name: course.name,
            departmentName: course.department?.name,
            normalizedDeptName: normalizeString(course.department?.name),
            departmentName2: course.department_name,
            normalizedDeptName2: normalizeString(course.department_name),
            departmentId: course.department_id,
            deptFromId: course.department_id ? departments.find(d => d.id === course.department_id)?.name : undefined,
            normalizedDeptFromId: course.department_id ? normalizeString(departments.find(d => d.id === course.department_id)?.name) : undefined,
            filterValue: departmentFilter,
            normalizedFilter: normalizedFilter
          });
        });
      }
    }
  }, [departmentFilter, courses, departments]);

  // Function to normalize strings for comparison (trim whitespace and convert to lowercase)
  const normalizeString = (str?: string): string => {
    return (str || "").trim().toLowerCase();
  };

  // Fetch courses from API
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        const coursesData = response.data.data || [];
        setCourses(coursesData);
        
        // Extract unique values for filters
        if (coursesData.length > 0) {
          // Extract and set unique semesters
          const semesters = [...new Set(coursesData.map((course: Course) => course.semester))] as number[];
          setUniqueSemesters(semesters.sort((a, b) => a - b));
          
          // Extract academic years with semester type
          const yearLabels: string[] = [];
          
          coursesData.forEach((course: Course) => {
            if (course.academic_year?.name && course.academic_year?.semester) {
              yearLabels.push(`${course.academic_year.name} - ${course.academic_year.semester}`);
            }
          });
          
          // Remove duplicates and sort
          const uniqueYearLabels = [...new Set(yearLabels)].sort();
          
          setUniqueAcademicYears(uniqueYearLabels);
        }
      } else {
        toast.error("Gagal memuat data mata kuliah", {
          description: "Terjadi kesalahan saat memuat data mata kuliah"
        });
        setCourses([]);
      }
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      
      // Tampilkan pesan yang lebih spesifik berdasarkan error
      if (error.response?.status === 404) {
        toast.warning("Tidak ada data mata kuliah yang tersedia", {
          description: "Silakan tambahkan mata kuliah baru"
        });
      } else {
        toast.error("Gagal memuat data mata kuliah", {
          description: error.response?.data?.message || "Terjadi kesalahan saat memuat data mata kuliah"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/study-programs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        console.log("Study programs data:", response.data.data);
        if (response.data.data.length > 0) {
          console.log("First study program:", response.data.data[0]);
        }
        setDepartments(response.data.data);
        
        // Tampilkan peringatan jika tidak ada program studi tersedia
        if (response.data.data.length === 0) {
          toast.warning("Tidak ada program studi tersedia", {
            description: "Silakan tambahkan program studi terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data program studi", {
          description: "Terjadi kesalahan saat memuat data program studi"
        });
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Gagal memuat data program studi", {
        description: "Terjadi kesalahan saat memuat data program studi"
      });
    }
  };

  // Fetch academic years from API
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
        
        // Tampilkan peringatan jika tidak ada tahun akademik tersedia
        if (academicYearsData.length === 0) {
          toast.warning("Tidak ada tahun akademik tersedia", {
            description: "Silakan tambahkan tahun akademik terlebih dahulu"
          });
        }
      } else {
        toast.error("Gagal memuat data tahun akademik", {
          description: "Terjadi kesalahan saat memuat data tahun akademik"
        });
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat data tahun akademik", {
        description: "Terjadi kesalahan saat memuat data tahun akademik"
      });
    }
  };

  // Function to handle adding a new course
  const handleAddCourse = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Convert string values to numbers where needed
      const formattedData = {
        ...data,
        credits: Number(data.credits),
        semester: Number(data.semester), 
        department_id: Number(data.department_id),
        academic_year_id: Number(data.academic_year_id)
      };
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`,
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Mata kuliah berhasil ditambahkan");
        setShowAddDialog(false);
        fetchCourses(); // Refresh courses list
        addForm.reset(); // Reset form
      } else {
        toast.error("Gagal menambahkan mata kuliah: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error adding course:", error);
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat menambahkan mata kuliah");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle editing a course
  const handleEditCourse = async (data: any) => {
    if (!currentCourse) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert string values to numbers where needed
      const formattedData = {
        ...data,
        credits: Number(data.credits),
        semester: Number(data.semester),
        department_id: Number(data.department_id), 
        academic_year_id: Number(data.academic_year_id)
      };
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${currentCourse.id}`,
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Mata kuliah berhasil diperbarui");
        setShowEditDialog(false);
        fetchCourses(); // Refresh courses list
      } else {
        toast.error("Gagal memperbarui mata kuliah: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast.error(error.response?.data?.message || "Terjadi kesalahan saat memperbarui mata kuliah");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!currentCourse) return;
    
    setIsDeleting(true);
    
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses/${currentCourse.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Mata kuliah berhasil dihapus", {
          description: "Mata kuliah telah berhasil dihapus dari sistem"
        });
        setShowDeleteDialog(false);
        setCurrentCourse(null);
        fetchCourses();
      } else {
        toast.error(response.data.message || "Gagal menghapus mata kuliah", {
          description: "Terjadi kesalahan saat menghapus mata kuliah"
        });
      }
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus mata kuliah", {
        description: "Terjadi kesalahan saat menghapus mata kuliah"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Setup edit course
  const setupEditCourse = (course: Course) => {
    setCurrentCourse(course);
    
    // Reset form with current course data
    editForm.reset({
      code: course.code,
      name: course.name,
      department_id: course.department?.id.toString() || "",
      credits: course.credits,
      semester: course.semester,
      course_type: course.course_type,
      academic_year_id: course.academic_year?.id.toString() || "",
    });
    
    setShowEditDialog(true);
  };
  
  // Setup delete course
  const setupDeleteCourse = (course: Course) => {
    setCurrentCourse(course);
    setShowDeleteDialog(true);
  };

  const handleDepartmentFilter = (value: string) => {
    if (value === "all") {
      console.log("Clearing department filter");
      setDepartmentFilter(null);
    } else {
      console.log(`Setting department filter to: ${value}`);
      
      // Log departments that have this name for debugging
      const normalizedValue = normalizeString(value);
      const matchingDepts = departments.filter(dept => normalizeString(dept.name) === normalizedValue);
      console.log(`Found ${matchingDepts.length} departments with name matching "${value}":`, matchingDepts);
      
      // Check if any courses will match this filter
      const matchingCourses = courses.filter(course => 
        normalizeString(course.department?.name) === normalizedValue || 
        normalizeString(course.department_name) === normalizedValue ||
        (course.department_id && departments.find(d => d.id === course.department_id && normalizeString(d.name) === normalizedValue))
      );
      
      console.log(`This filter will match ${matchingCourses.length} courses`);
      
      // Set the filter
      setDepartmentFilter(value);
    }
  };

  // Filter courses based on search and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDepartment = !departmentFilter;
    
    if (departmentFilter && !matchesDepartment) {
      const normalizedFilter = normalizeString(departmentFilter);
      
      // Try matching by department.name
      if (normalizeString(course.department?.name) === normalizedFilter) {
        matchesDepartment = true;
      }
      // Try matching by department_name
      else if (normalizeString(course.department_name) === normalizedFilter) {
        matchesDepartment = true;
      }
      // Try matching by department_id by getting the name from departments array
      else if (course.department_id) {
        const dept = departments.find(d => d.id === course.department_id);
        if (dept && normalizeString(dept.name) === normalizedFilter) {
          matchesDepartment = true;
        }
      }
    }
    
    const matchesSemester = 
      !semesterFilter || 
      course.semester === semesterFilter;
    
    const matchesAcademicYear =
      !academicYearFilter ||
      course.academic_year?.name === academicYearFilter;
    
    return matchesSearch && matchesDepartment && matchesSemester && matchesAcademicYear;
  });

  // Get course type label
  const getCourseTypeLabel = (type: string) => {
    switch(type) {
      case 'theory':
        return "Teori";
      case 'practice':
        return "Praktikum";
      case 'mixed':
        return "Teori & Praktikum";
      default:
        return type;
    }
  };

  // Function to get department name by ID
  const getDepartmentName = (departmentId?: number | string) => {
    if (!departmentId) return "-";
    
    const department = departments.find(
      dept => dept.id === departmentId || dept.id.toString() === departmentId.toString()
    );
    
    return department ? department.name : `ID: ${departmentId}`;
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-[#0687C9]" />
                Mata Kuliah
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola data mata kuliah untuk sistem absensi
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Mata Kuliah
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari mata kuliah berdasarkan nama atau kode..."
                className="pl-10 w-full h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select 
                onValueChange={handleDepartmentFilter}
                value={departmentFilter || "all"}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Program Studi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                onValueChange={(value) => setSemesterFilter(value === "all" ? null : Number(value))}
                value={semesterFilter?.toString() || "all"}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {uniqueSemesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                onValueChange={(value) => setAcademicYearFilter(value === "all" ? null : value)}
                value={academicYearFilter || "all"}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Tahun Akademik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {academicYears && academicYears.length > 0 ? academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.name}>
                      {year.name} - {year.semester}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[80px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Mata Kuliah</TableHead>
                  <TableHead className="text-center font-bold text-black">SKS</TableHead>
                  <TableHead className="text-center font-bold text-black">Semester</TableHead>
                  <TableHead className="font-bold text-black">Tipe</TableHead>
                  <TableHead className="text-center font-bold text-black">Tahun Akademik</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course, index) => (
                    <TableRow key={course.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {course.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {getDepartmentName(course.department_id || (course.department && course.department.id))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{course.credits}</TableCell>
                      <TableCell className="text-center">{course.semester}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {getCourseTypeLabel(course.course_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {course.academic_year?.name} 
                        {course.academic_year?.semester && ` - ${course.academic_year.semester}`}
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
                              onClick={() => setupEditCourse(course)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setupDeleteCourse(course)}
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
                    <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                      Tidak ada mata kuliah yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog untuk menambah Mata Kuliah baru */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail mata kuliah baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddCourse)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Kode</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Contoh: IF2001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => {
                  const selectedDeptId = addForm.watch("department_id");
                  const selectedDept = departments.find(d => d.id.toString() === selectedDeptId);
                  const deptName = selectedDept ? selectedDept.name : "";
                  
                  return (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nama</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            placeholder={deptName ? `Nama mata kuliah untuk ${deptName}` : "Nama mata kuliah"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  );
                }}
              />
              
              <FormField
                control={addForm.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Program Studi</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih program studi" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="credits"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">SKS</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Jumlah SKS" 
                          min="1"
                          {...field}
                          onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="semester"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Semester</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                              <SelectItem key={semester} value={semester.toString()}>
                                Semester {semester}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="course_type"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Tipe</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe mata kuliah" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="theory">Teori</SelectItem>
                            <SelectItem value="practice">Praktikum</SelectItem>
                            <SelectItem value="mixed">Teori & Praktikum</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="academic_year_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Tahun Akademik</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tahun akademik" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYears && academicYears.length > 0 ? academicYears.map((year) => (
                              year && year.id ? (
                                <SelectItem key={year.id} value={year.id.toString()}>
                                  {year.name} - {year.semester}
                                </SelectItem>
                              ) : null
                            )) : (
                              <SelectItem value="no-data" disabled>Tidak ada data</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#0687C9] hover:bg-[#0670a8]"
                >
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk mengedit Mata Kuliah */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Mata Kuliah</DialogTitle>
            <DialogDescription>
              Edit informasi mata kuliah yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentCourse && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditCourse)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Kode</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Contoh: IF2001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => {
                    const selectedDeptId = editForm.watch("department_id");
                    const selectedDept = departments.find(d => d.id.toString() === selectedDeptId);
                    const deptName = selectedDept ? selectedDept.name : "";
                    
                    return (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Nama</FormLabel>
                        <div className="col-span-3">
                          <FormControl>
                            <Input 
                              placeholder={deptName ? `Nama mata kuliah untuk ${deptName}` : "Nama mata kuliah"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={editForm.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Program Studi</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program studi" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">SKS</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Jumlah SKS" 
                            min="1"
                            {...field}
                            onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Semester</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih semester" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                                <SelectItem key={semester} value={semester.toString()}>
                                  Semester {semester}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="course_type"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tipe</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe mata kuliah" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="theory">Teori</SelectItem>
                              <SelectItem value="practice">Praktikum</SelectItem>
                              <SelectItem value="mixed">Teori & Praktikum</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="academic_year_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tahun Akademik</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tahun akademik" />
                            </SelectTrigger>
                            <SelectContent>
                              {academicYears && academicYears.length > 0 ? academicYears.map((year) => (
                                year && year.id ? (
                                  <SelectItem key={year.id} value={year.id.toString()}>
                                    {year.name} - {year.semester}
                                  </SelectItem>
                                ) : null
                              )) : (
                                <SelectItem value="no-data" disabled>Tidak ada data</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#0687C9] hover:bg-[#0670a8]"
                  >
                    Simpan Perubahan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog untuk menghapus Mata Kuliah */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Hapus Mata Kuliah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus mata kuliah ini?
            </DialogDescription>
          </DialogHeader>
          
          {currentCourse && (
            <div className="space-y-4">
              <p>Kode: <span className="font-medium">{currentCourse.code}</span></p>
              <p>Nama: <span className="font-medium">{currentCourse.name}</span></p>
              <p>Program Studi: <span className="text-gray-600">{getDepartmentName(currentCourse.department_id || (currentCourse.department?.id))}</span></p>
              <p>SKS: <span className="font-medium">{currentCourse.credits}</span></p>
              <p>Semester: <span className="font-medium">{currentCourse.semester}</span></p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button 
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
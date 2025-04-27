"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FolderKanban, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  BookOpen,
  Layers,
  Loader2,
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
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

// Type untuk data Mata Kuliah (copied from manage page)
interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
  department_name?: string;
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
  semester_type: "ganjil" | "genap";
}

// Kelompok Mata Kuliah
interface CourseGroup {
  id: number;
  code: string;
  name: string;
  faculty_name?: string;
  faculty?: {
    id: number;
    name: string;
  };
  faculty_id?: number;
  department_name?: string;
  department?: {
    id: number;
    name: string;
  };
  department_id?: number;
  course_count: number;
  semester_range: string;
  total_credits: number;
  courses?: Course[];
  selected_courses?: number[];
}

// Type for Department
interface Department {
  id: number;
  code?: string;
  name: string;
  faculty_id: number;
  faculty?: {
    id: number;
    name: string;
  };
  degree?: string;
  accreditation?: string;
  head_of_department?: string;
  lecturer_count?: number;
  student_count?: number;
}

export default function CourseGroupsPage() {
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [uniqueDepartments, setUniqueDepartments] = useState<{id: number, name: string}[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCourseGroup, setCurrentCourseGroup] = useState<CourseGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form for adding a new course group
  const addForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      department_id: "",
      selected_courses: [] as number[]
    }
  });
  
  // Form for editing a course group
  const editForm = useForm({
    defaultValues: {
      code: "",
      name: "",
      department_id: "",
      selected_courses: [] as number[]
    }
  });

  useEffect(() => {
    fetchCourseGroups();
    fetchCourses();
    fetchStudyPrograms();
  }, []);
  
  // Add a useEffect to sync department information when both courseGroups and departments are loaded
  useEffect(() => {
    if (courseGroups.length > 0 && departments.length > 0) {
      console.log("Syncing department data with courseGroups");
      
      // Transform data to ensure we have department information
      const transformedGroups = courseGroups.map((group) => {
        const deptId = group.department_id;
        if (deptId && (!group.department_name || !group.department)) {
          // If we have department_id but no department information, try to set it
          const dept = departments.find(d => d.id === deptId || 
                                      d.id.toString() === deptId.toString());
          if (dept) {
            // Create a new object to avoid modifying the original
            return {
              ...group,
              department_name: dept.name,
              department: { id: dept.id, name: dept.name }
            };
          }
        }
        return group;
      });
      
      // Only update if there's any change
      const hasChanges = JSON.stringify(transformedGroups) !== JSON.stringify(courseGroups);
      if (hasChanges) {
        console.log("Updated course groups with department information");
        setCourseGroups(transformedGroups);
      }
      
      // Extract unique departments from course groups
      const departmentsMap = new Map<number, {id: number, name: string}>();
      
      // Add departments from course groups
      transformedGroups.forEach(group => {
        if (group.department && group.department.id && group.department.name) {
          departmentsMap.set(group.department.id, {
            id: group.department.id,
            name: group.department.name
          });
        } else if (group.department_id && group.department_name) {
          departmentsMap.set(group.department_id, {
            id: group.department_id,
            name: group.department_name
          });
        }
      });
      
      const extractedDepartments = Array.from(departmentsMap.values());
      console.log("Extracted departments from course groups:", extractedDepartments);
      setUniqueDepartments(extractedDepartments);
    }
  }, [departments, courseGroups]);

  // Fetch course groups from API
  const fetchCourseGroups = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/course-groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        console.log("Course groups data:", response.data.data);
        if (response.data.data.length > 0) {
          console.log("Sample course group:", response.data.data[0]);
          console.log("Department data in course group:", {
            department: response.data.data[0].department,
            department_id: response.data.data[0].department_id,
            department_name: response.data.data[0].department_name
          });
        }
        
        setCourseGroups(response.data.data);
      } else {
        toast.error("Gagal memuat kelompok mata kuliah", {
          description: "Terjadi kesalahan saat memuat data kelompok mata kuliah"
        });
      }
    } catch (error) {
      console.error("Error fetching course groups:", error);
      toast.error("Gagal memuat kelompok mata kuliah", {
        description: "Terjadi kesalahan saat memuat data kelompok mata kuliah"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setCourses(response.data.data);
      } else {
        toast.error("Gagal memuat data mata kuliah", {
          description: "Terjadi kesalahan saat memuat data mata kuliah"
        });
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Gagal memuat data mata kuliah", {
        description: "Terjadi kesalahan saat memuat data mata kuliah"
      });
    }
  };

  // Fetch study programs from API
  const fetchStudyPrograms = async () => {
    try {
      console.log("Fetching study programs...");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/study-programs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        console.log("Study programs fetched successfully:", response.data.data.length, "programs");
        if (response.data.data.length > 0) {
          console.log("First study program:", response.data.data[0]);
        }
        setDepartments(response.data.data);
      } else {
        console.error("Error in study programs response:", response.data);
        toast.error("Gagal memuat data program studi", {
          description: "Terjadi kesalahan saat memuat data program studi"
        });
      }
    } catch (error: any) {
      console.error("Error fetching study programs:", error);
      // Check if it's an axios error with response
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      toast.error("Gagal memuat data program studi", {
        description: "Terjadi kesalahan saat memuat data program studi"
      });
    }
  };

  // Add a new course group
  const handleAddCourseGroup = async (data: any) => {
    setIsSubmitting(true);
    console.log("Adding course group with data:", data);
    
    // Convert department_id to number if it's a string
    const departmentId = typeof data.department_id === 'string' ? 
      parseInt(data.department_id) : data.department_id;
    
    if (!departmentId) {
      toast.error("Program studi harus dipilih", {
        description: "Silakan pilih program studi terlebih dahulu"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Find department data
    const department = departments.find(dept => 
      dept.id === departmentId || 
      dept.id.toString() === data.department_id
    );
    
    console.log("Selected department ID:", departmentId);
    console.log("Found department:", department);
    console.log("Available departments:", departments.map(d => ({ id: d.id, name: d.name })));
    
    if (!department) {
      toast.error("Program studi tidak ditemukan", {
        description: `Program studi dengan ID ${departmentId} tidak ditemukan di sistem. Tersedia ${departments.length} program studi.`
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!department.faculty_id) {
      toast.error("Data program studi tidak lengkap", {
        description: "Data fakultas untuk program studi ini tidak ditemukan"
      });
      setIsSubmitting(false);
      return;
    }
    
    const payload = {
      code: data.code,
      name: data.name,
      department_id: parseInt(departmentId.toString()), // Ensure it's an integer
      faculty_id: parseInt(department.faculty_id.toString()), // Ensure it's an integer
      course_ids: data.selected_courses || []
    };
    
    console.log("Sending payload to backend:", payload);
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/course-groups`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Kelompok mata kuliah berhasil ditambahkan", {
          description: "Kelompok mata kuliah baru telah berhasil ditambahkan"
        });
        fetchCourseGroups();
        setShowAddDialog(false);
        addForm.reset();
      } else {
        toast.error("Gagal menambahkan kelompok mata kuliah", {
          description: response.data.message || "Terjadi kesalahan saat menambahkan kelompok mata kuliah"
        });
      }
    } catch (error: any) {
      console.error("Error adding course group:", error);
      
      // Log more detailed error info
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      
      toast.error("Gagal menambahkan kelompok mata kuliah", {
        description: error.response?.data?.message || "Terjadi kesalahan saat menambahkan kelompok mata kuliah"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit course group
  const handleEditCourseGroup = async (data: any) => {
    if (!currentCourseGroup) return;
    
    setIsSubmitting(true);
    console.log("Editing course group with data:", data);
    
    // Convert department_id to number if it's a string
    const departmentId = typeof data.department_id === 'string' ? 
      parseInt(data.department_id) : data.department_id;
    
    if (!departmentId) {
      toast.error("Program studi harus dipilih", {
        description: "Silakan pilih program studi terlebih dahulu"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Find department data
    const department = departments.find(dept => 
      dept.id === departmentId || 
      dept.id.toString() === data.department_id
    );
    
    console.log("Selected department ID:", departmentId);
    console.log("Found department:", department);
    console.log("Available departments:", departments.map(d => ({ id: d.id, name: d.name })));
    
    if (!department) {
      toast.error("Program studi tidak ditemukan", {
        description: `Program studi dengan ID ${departmentId} tidak ditemukan di sistem`
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!department.faculty_id) {
      toast.error("Data program studi tidak lengkap", {
        description: "Data fakultas untuk program studi ini tidak ditemukan"
      });
      setIsSubmitting(false);
      return;
    }
    
    const payload = {
      code: data.code,
      name: data.name,
      department_id: parseInt(departmentId.toString()), // Ensure it's an integer
      faculty_id: parseInt(department.faculty_id.toString()), // Ensure it's an integer  
      course_ids: data.selected_courses || []
    };
    
    console.log("Sending payload to backend:", payload);
    
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/course-groups/${currentCourseGroup.id}`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Kelompok mata kuliah berhasil diperbarui", {
          description: "Kelompok mata kuliah telah berhasil diperbarui"
        });
        fetchCourseGroups();
        setShowEditDialog(false);
      } else {
        toast.error("Gagal memperbarui kelompok mata kuliah", {
          description: response.data.message || "Terjadi kesalahan saat memperbarui kelompok mata kuliah"
        });
      }
    } catch (error: any) {
      console.error("Error updating course group:", error);
      
      // Log more detailed error info
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      
      toast.error("Gagal memperbarui kelompok mata kuliah", {
        description: error.response?.data?.message || "Terjadi kesalahan saat memperbarui kelompok mata kuliah"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete course group
  const handleDeleteCourseGroup = async () => {
    if (!currentCourseGroup) return;
    
    setIsDeleting(true);
    
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/course-groups/${currentCourseGroup.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Kelompok mata kuliah berhasil dihapus", {
          description: "Kelompok mata kuliah telah berhasil dihapus dari sistem"
        });
        fetchCourseGroups();
        setShowDeleteDialog(false);
        setCurrentCourseGroup(null);
      } else {
        toast.error("Gagal menghapus kelompok mata kuliah", {
          description: response.data.message || "Terjadi kesalahan saat menghapus kelompok mata kuliah"
        });
      }
    } catch (error: any) {
      console.error("Error deleting course group:", error);
      toast.error("Gagal menghapus kelompok mata kuliah", {
        description: error.response?.data?.message || "Terjadi kesalahan saat menghapus kelompok mata kuliah"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Setup edit course group
  const setupEditCourseGroup = (group: CourseGroup) => {
    setCurrentCourseGroup(group);
    
    // Get selected course IDs
    const selectedCourseIds = group.courses?.map(course => course.id) || [];
    
    // Reset form with current group data
    editForm.reset({
      code: group.code,
      name: group.name,
      department_id: group.department?.id?.toString() || "",
      selected_courses: selectedCourseIds
    });
    
    setShowEditDialog(true);
  };
  
  // Setup delete course group
  const setupDeleteCourseGroup = (group: CourseGroup) => {
    setCurrentCourseGroup(group);
    setShowDeleteDialog(true);
  };

  // Function to normalize strings for comparison (trim whitespace and convert to lowercase)
  const normalizeString = (str?: string): string => {
    return (str || "").trim().toLowerCase();
  };

  // Filter course groups
  const filteredCourseGroups = courseGroups.filter((group) => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDepartment = !departmentFilter;
    
    if (departmentFilter && !matchesDepartment) {
      const normalizedFilter = normalizeString(departmentFilter);
      
      // Try matching by department.name
      if (normalizeString(group.department?.name) === normalizedFilter) {
        matchesDepartment = true;
      }
      // Try matching by department_name
      else if (normalizeString(group.department_name) === normalizedFilter) {
        matchesDepartment = true;
      }
      // Try matching by department_id by getting the name from departments array
      else if (group.department_id) {
        const dept = departments.find(d => d.id === group.department_id);
        if (dept && normalizeString(dept.name) === normalizedFilter) {
          matchesDepartment = true;
        }
      }
    }
    
    return matchesSearch && matchesDepartment;
  });

  // Calculate semester range from selected courses
  const calculateSemesterRange = (selectedCourseIds: number[]) => {
    const selectedCourseObjects = courses.filter(course => selectedCourseIds.includes(course.id));
    const semesters = [...new Set(selectedCourseObjects.map(course => course.semester))].sort((a, b) => a - b);
    return semesters.join(', ');
  };

  // Check if a course is already in another group
  const isCourseInOtherGroup = (courseId: number, currentGroupId?: number) => {
    return courseGroups.some(group => 
      group.courses?.some(course => course.id === courseId) && 
      (!currentGroupId || group.id !== currentGroupId)
    );
  };

  // Get the name of the group that contains a specific course
  const getGroupNameForCourse = (courseId: number) => {
    const group = courseGroups.find(group => 
      group.courses?.some(course => course.id === courseId)
    );
    return group ? group.name : '';
  };

  // Function to get department name by ID
  const getDepartmentName = (departmentId?: number | string) => {
    if (!departmentId) return "-";
    
    const department = departments.find(
      dept => dept.id === departmentId || dept.id.toString() === departmentId.toString()
    );
    
    return department ? department.name : `ID: ${departmentId}`;
  };

  // Handler for department filter to normalize comparison and provide debugging
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
      
      // Check if any course groups will match this filter
      const matchingGroups = courseGroups.filter(group => 
        normalizeString(group.department?.name) === normalizedValue || 
        normalizeString(group.department_name) === normalizedValue ||
        (group.department_id && departments.find(d => d.id === group.department_id && normalizeString(d.name) === normalizedValue))
      );
      
      console.log(`This filter will match ${matchingGroups.length} course groups`);
      
      // Set the filter
      setDepartmentFilter(value);
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Layers className="mr-2 h-6 w-6 text-[#0687C9]" />
                Kelompok Mata Kuliah
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola pengelompokan mata kuliah untuk kurikulum
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Kelompok
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kelompok mata kuliah..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select 
                onValueChange={handleDepartmentFilter}
                value={departmentFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Program Studi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Program Studi</SelectItem>
                  {uniqueDepartments.length > 0 ? (
                    uniqueDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[120px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Kelompok</TableHead>
                  <TableHead className="font-bold text-black">Program Studi</TableHead>
                  <TableHead className="text-center font-bold text-black">Semester</TableHead>
                  <TableHead className="text-center font-bold text-black">Jml MK</TableHead>
                  <TableHead className="text-center font-bold text-black">Total SKS</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourseGroups.length > 0 ? (
                  filteredCourseGroups.map((group, index) => (
                    <TableRow key={group.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{group.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {group.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.department?.name || 
                         group.department_name || 
                         getDepartmentName(group.department_id) || 
                         "-"}
                      </TableCell>
                      <TableCell className="text-center">{group.semester_range}</TableCell>
                      <TableCell className="text-center">{group.course_count}</TableCell>
                      <TableCell className="text-center">{group.total_credits}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setupEditCourseGroup(group)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setupDeleteCourseGroup(group)}
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
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      Tidak ada kelompok mata kuliah yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog untuk menambah Kelompok Mata Kuliah baru */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Kelompok Mata Kuliah Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail kelompok mata kuliah baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddCourseGroup)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Kode</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Contoh: KMK-TI-CORE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Nama</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Nama kelompok mata kuliah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Program Studi</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select 
                          onValueChange={(value) => {
                            console.log("Add form - Selected department ID:", value);
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih program studi" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.length === 0 ? (
                              <SelectItem value="no-data" disabled>Tidak ada data program studi</SelectItem>
                            ) : (
                              departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">Semester</FormLabel>
                    <div className="col-span-3">
                  <div className="p-2 border rounded-md bg-muted text-foreground h-10 flex items-center text-sm">
                    {calculateSemesterRange(addForm.watch("selected_courses")) || "Ditentukan otomatis"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    Diisi otomatis berdasarkan mata kuliah yang dipilih
                  </div>
                </div>
                    </div>
              
              <FormField
                control={addForm.control}
                name="selected_courses"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-start gap-4">
                    <FormLabel className="text-right pt-2">Mata Kuliah</FormLabel>
                    <div className="col-span-3 space-y-2">
                      <div className="border rounded-md p-2">
                        <div className="mb-2 text-sm font-medium">Pilih mata kuliah yang akan dimasukkan dalam kelompok:</div>
                        <ScrollArea className="h-60 rounded-md">
                          {courses
                            .filter(course => {
                              // If no department selected, show all courses
                              if (!addForm.watch("department_id")) return true;
                              
                              // If department selected, match courses with that department ID
                              // or show courses that don't have proper department data
                              const selectedDeptId = addForm.watch("department_id");
                              return course.department?.id.toString() === selectedDeptId || 
                                     !course.department?.id; // Show courses with missing department data
                            })
                            .map((course) => {
                              const inOtherGroup = isCourseInOtherGroup(course.id);
                              return (
                                <div 
                                  key={course.id} 
                                  className={cn(
                                    "flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md",
                                    inOtherGroup && "bg-amber-50"
                                  )}
                                >
                                  <Checkbox
                                    checked={field.value.includes(course.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, course.id]);
                                      } else {
                                        field.onChange(field.value.filter(id => id !== course.id));
                                      }
                                    }}
                                    disabled={inOtherGroup}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{course.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {course.code} • {course.credits} SKS • Semester {course.semester}
                                    </div>
                                  </div>
                                  {inOtherGroup && (
                                    <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-200">
                                      Digunakan di "{getGroupNameForCourse(course.id)}"
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                        </ScrollArea>
                        <div className="mt-2 text-xs text-gray-500">
                          {field.value.length} mata kuliah dipilih
                        </div>
                      </div>
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

      {/* Dialog untuk mengedit Kelompok Mata Kuliah */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Kelompok Mata Kuliah</DialogTitle>
            <DialogDescription>
              Edit informasi kelompok mata kuliah yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentCourseGroup && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditCourseGroup)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Kode</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Contoh: KMK-TI-CORE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nama</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Nama kelompok mata kuliah" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Program Studi</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select 
                            onValueChange={(value) => {
                              console.log("Edit form - Selected department ID:", value);
                              field.onChange(value);
                            }} 
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih program studi" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.length === 0 ? (
                                <SelectItem value="no-data" disabled>Tidak ada data program studi</SelectItem>
                              ) : (
                                departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Semester</FormLabel>
                      <div className="col-span-3">
                    <div className="p-2 border rounded-md bg-muted text-foreground h-10 flex items-center text-sm">
                      {calculateSemesterRange(editForm.watch("selected_courses")) || "Ditentukan otomatis"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      Diisi otomatis berdasarkan mata kuliah yang dipilih
                    </div>
                  </div>
                      </div>
                
                <FormField
                  control={editForm.control}
                  name="selected_courses"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-start gap-4">
                      <FormLabel className="text-right pt-2">Mata Kuliah</FormLabel>
                      <div className="col-span-3 space-y-2">
                        <div className="border rounded-md p-2">
                          <div className="mb-2 text-sm font-medium">Pilih mata kuliah yang akan dimasukkan dalam kelompok:</div>
                          <ScrollArea className="h-60 rounded-md">
                            {courses
                              .filter(course => {
                                // If no department selected, show all courses
                                if (!editForm.watch("department_id")) return true;
                                
                                // If department selected, match courses with that department ID
                                // or show courses that don't have proper department data
                                const selectedDeptId = editForm.watch("department_id");
                                return course.department?.id.toString() === selectedDeptId || 
                                       !course.department?.id; // Show courses with missing department data
                              })
                              .map((course) => {
                                const inOtherGroup = isCourseInOtherGroup(course.id, currentCourseGroup?.id);
                                return (
                                  <div 
                                    key={course.id} 
                                    className={cn(
                                      "flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md",
                                      inOtherGroup && "bg-amber-50"
                                    )}
                                  >
                                    <Checkbox
                                      checked={field.value.includes(course.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, course.id]);
                                        } else {
                                          field.onChange(field.value.filter(id => id !== course.id));
                                        }
                                      }}
                                      disabled={inOtherGroup}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{course.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {course.code} • {course.credits} SKS • Semester {course.semester}
                                      </div>
                                    </div>
                                    {inOtherGroup && (
                                      <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-700 border-amber-200">
                                        Digunakan di "{getGroupNameForCourse(course.id)}"
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                          </ScrollArea>
                          <div className="mt-2 text-xs text-gray-500">
                            {field.value.length} mata kuliah dipilih
                          </div>
                        </div>
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

      {/* Dialog untuk menghapus Kelompok Mata Kuliah */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Hapus Kelompok Mata Kuliah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelompok mata kuliah ini?
            </DialogDescription>
          </DialogHeader>
          
          {currentCourseGroup && (
            <div className="space-y-4">
              <p>Kode: <span className="font-medium">{currentCourseGroup.code}</span></p>
              <p>Nama: <span className="font-medium">{currentCourseGroup.name}</span></p>
              <p>Program Studi: <span className="text-gray-600">
                {currentCourseGroup.department?.name || 
                 currentCourseGroup.department_name || 
                 getDepartmentName(currentCourseGroup.department_id) || 
                 "-"}
              </span></p>
              <p>Semester: {currentCourseGroup.semester_range}</p>
              <p>Jumlah Mata Kuliah: {currentCourseGroup.course_count}</p>
              <p>Total SKS: {currentCourseGroup.total_credits}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button 
              type="submit"
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              onClick={handleDeleteCourseGroup}
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
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, UserCog, Calendar, Trash2, User, AlertCircle, Loader2, UserMinus, MoreHorizontal } from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { api } from "@/utils/api";
import { toast } from "sonner";
import axios from "axios";
import { API_URL } from "@/utils/env";

interface Course {
  id: number;
  uuid: string;
  code: string;
  name: string;
  semester: number;
}

interface Schedule {
  id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  day: string;
  time: string;
  room: string;
  assigned: boolean;
  assistant_id?: number;
  assistant_name?: string;
}

interface Employee {
  id: number;
  employee_id: number;
  user_id: number;
  full_name: string;
  nip: string;
  email: string;
  position: string;
  department: string;
  employment_type: string;
}

interface TeachingAssistantAssignment {
  id: number;
  user_id: number;
  course_id: number;
  academic_year_id: number;
  assigned_by_id: number;
  created_at: string;
  updated_at: string;
  
  // Nested objects (from response)
  employee?: Employee;
  course?: Course;
  
  // Response fields
  employee_name?: string;
  employee_nip?: string;
  employee_email?: string;
  employee_position?: string;
  course_name?: string;
  course_code?: string;
  course_semester?: number;
}

export default function AssistantsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssistantAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [5, 10, 20, 50];
  
  // Token for API requests
  const token = typeof window !== 'undefined' ? 
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token') : null;

  // Reset pagination when dialog opens, search term changes, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [isDialogOpen, searchTerm, pageSize]);

  // Fetch all lecturer's courses
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/lecturer/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.status === "success") {
          setCourses(response.data.data.map((assignment: any) => assignment.course));
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Gagal memuat data mata kuliah");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [token]);
  
  // Fetch teaching assistant assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/lecturer/ta-assignments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.status === "success") {
          setAssignments(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast.error("Gagal memuat data penugasan asisten dosen");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssignments();
  }, [token]);
  
  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (employee) =>
          employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => {
    const matchesSearch = courseSearchTerm === "" || 
      course.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(courseSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get paginated employees
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Calculate total pages
  const totalPages = useMemo(() => 
    Math.ceil(filteredEmployees.length / pageSize), 
    [filteredEmployees, pageSize]
  );

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of list when changing pages
      if (typeof document !== 'undefined') {
        const listContainer = document.querySelector('.max-h-\\[300px\\]');
        if (listContainer) {
          listContainer.scrollTop = 0;
        }
      }
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of list when changing pages
      if (typeof document !== 'undefined') {
        const listContainer = document.querySelector('.max-h-\\[300px\\]');
        if (listContainer) {
          listContainer.scrollTop = 0;
        }
      }
    }
  };

  // Function to open assignment dialog
  const openAssignmentDialog = async (course: Course) => {
    setSelectedCourse(course);
    setIsDialogOpen(true);
    setIsLoadingEmployees(true);
    
    try {
      // Fetch available teaching assistants for this course
      const response = await axios.get(`${API_URL}/api/lecturer/courses/${course.id}/available-teaching-assistants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        setEmployees(response.data.data);
        setFilteredEmployees(response.data.data);
      } else {
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching available teaching assistants:", error);
      toast.error("Gagal memuat data asisten dosen yang tersedia");
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Function to assign teaching assistant to course
  const assignAssistant = async (employeeId: number) => {
    if (!selectedCourse) return;
    
    setIsAssigning(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/lecturer/ta-assignments`, 
        { 
          employee_id: employeeId,
          course_id: selectedCourse.id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === "success") {
        // Refresh assignments list
        const assignmentsResponse = await axios.get(`${API_URL}/api/lecturer/ta-assignments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (assignmentsResponse.data.status === "success") {
          setAssignments(assignmentsResponse.data.data);
        }
        
        toast.success(`Asisten berhasil ditugaskan ke mata kuliah ${selectedCourse.code}`);
      } else {
        toast.error("Gagal menugaskan asisten dosen");
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error assigning assistant:", error);
      
      // Show specific error message if available
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
      toast.error("Gagal menugaskan asisten dosen");
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Function to remove assistant from course
  const removeAssistant = async (assignmentId: number) => {
    try {
      const response = await axios.delete(`${API_URL}/api/lecturer/ta-assignments/${assignmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === "success") {
        // Update assignments state
        setAssignments(assignments.filter(assignment => assignment.id !== assignmentId));
        toast.success("Asisten dosen berhasil dihapus dari mata kuliah");
      } else {
        toast.error("Gagal menghapus asisten dosen");
      }
    } catch (error) {
      console.error("Error removing assistant:", error);
      toast.error("Gagal menghapus asisten dosen");
    }
  };

  // Map assignments to courses for display
  const coursesWithAssignments = filteredCourses.map(course => {
    const assignment = assignments.find(a => a.course_id === course.id);
    return {
      ...course,
      assigned: !!assignment && assignment.user_id !== 0,
      has_assignment: !!assignment, // Track if there's any assignment record
      assignment_id: assignment?.id,
      assistant_id: assignment?.user_id,
      assistant_name: assignment?.employee_name || assignment?.employee?.full_name,
      is_released: !!assignment && assignment.user_id === 0
    };
  });

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Kelola Asisten Dosen</h3>
                  <p className="text-sm text-muted-foreground mt-1">Kelola penugasan asisten dosen untuk mata kuliah yang Anda ampu</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                <div className="relative w-full sm:w-[40%]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari mata kuliah..."
                    className="pl-10"
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                  />
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
                        <TableHead className="font-bold text-black">Semester</TableHead>
                        <TableHead className="font-bold text-black">Asisten Dosen</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursesWithAssignments.map((course, index) => (
                        <TableRow key={course.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>{course.semester}</TableCell>
                          <TableCell>
                            {course.assigned ? (
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-blue-800" />
                                </div>
                                <div>
                                  <span className="font-medium">{course.assistant_name}</span>
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                    Ditugaskan
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="text-muted-foreground">Belum ditugaskan</span>
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                  Perlu Asisten
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {course.has_assignment ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeAssistant(course.assignment_id!)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Penugasan
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-[#0687C9] hover:bg-[#0572aa]"
                                onClick={() => openAssignmentDialog(course)}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Tugaskan
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {coursesWithAssignments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                              <p>{courses.length === 0 ? 
                                "Tidak ada mata kuliah yang tersedia" : 
                                "Tidak ada mata kuliah yang sesuai dengan filter"}
                              </p>
                              <p className="text-sm">Mata kuliah akan muncul di sini saat tersedia</p>
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

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Pilih Asisten Dosen</DialogTitle>
            <DialogDescription>
              Pilih asisten dosen untuk mata kuliah ini
            </DialogDescription>
            {selectedCourse && (
              <div className="mt-2">
                <p className="font-medium">{selectedCourse.code}: {selectedCourse.name}</p>
                <p className="text-sm text-muted-foreground mt-1">Semester {selectedCourse.semester}</p>
              </div>
            )}
          </DialogHeader>
          
          <div className="relative w-full mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari asisten dosen..."
              className="pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {isLoadingEmployees ? (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0687C9] mb-2" />
                  <span className="text-sm text-muted-foreground">Memuat data asisten dosen...</span>
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                <p>Tidak ada asisten dosen yang tersedia</p>
                {searchTerm ? (
                  <p className="text-sm mt-1">Tidak ada hasil untuk pencarian "{searchTerm}"</p>
                ) : (
                  <p className="text-sm mt-1">Asisten dosen harus disinkronkan terlebih dahulu oleh admin</p>
                )}
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  Menampilkan {paginatedEmployees.length} dari {filteredEmployees.length} asisten dosen
                </div>
              <div className="space-y-2">
                  {paginatedEmployees.map((employee) => (
                  <div 
                      key={employee.id}
                    className="flex items-center p-3 border border-gray-100 hover:bg-[#E6F3FB] rounded-lg cursor-pointer transition-colors"
                      onClick={() => assignAssistant(employee.id)}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#E6F3FB] flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-[#0687C9]" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{employee.full_name}</p>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                          <span>{employee.nip || "NIP: -"}</span>
                          {employee.position && (
                            <>
                              <span className="mx-1.5">•</span>
                              <span>{employee.position}</span>
                            </>
                          )}
                          {employee.department && (
                            <>
                              <span className="mx-1.5">•</span>
                              <span>{employee.department}</span>
                            </>
                          )}
                        <span className="mx-1.5">•</span>
                          <span className="text-xs text-blue-600">User ID: {employee.user_id}</span>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
          
          {/* Pagination controls - only show if there are multiple pages */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex justify-between items-center w-full">
                <Button 
                  variant="outline" 
                  className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" 
                  disabled={currentPage === 1 || isAssigning}
                  onClick={goToPreviousPage}
                >
                  <span className="mr-1">←</span> Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" 
                  disabled={currentPage === totalPages || isAssigning}
                  onClick={goToNextPage}
                >
                  Selanjutnya <span className="ml-1">→</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Tampilkan:
                </span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map(size => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]" 
                disabled={isAssigning}
              >
                Batal
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
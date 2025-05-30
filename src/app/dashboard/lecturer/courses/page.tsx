"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Loader2,
  CalendarDays,
  Book,
  GraduationCap,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { API_URL } from "@/utils/env";
import React from "react";

// Interface for academic year
interface AcademicYear {
  id: number;
  name: string;
  semester: string;
  start_date: string;
  end_date: string;
}

// Interface for course
interface Course {
  id: number;
  code: string;
  name: string;
  semester: number;
  academic_year?: AcademicYear;
  academic_year_name?: string;
  academic_year_semester?: string;
  // Additional properties that might come from API
  course_id?: number;
  course_code?: string;
  course_name?: string;
  course_semester?: number;
}

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/lecturer/academic-years`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        const academicYearsData = response.data.data || [];
        setAcademicYears(academicYearsData);
        
        // If we have academic years and none is selected, select the first one
        if (academicYearsData.length > 0 && !selectedAcademicYearId) {
          // Just use the first academic year
          setSelectedAcademicYearId(academicYearsData[0].id.toString());
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

  // Fetch lecturer's assigned courses
  const fetchMyCourses = async () => {
    setIsLoading(true);
    
    try {
      // Use the lecturer's courses endpoint
      const response = await axios.get(
        `${API_URL}/api/lecturer/courses${selectedAcademicYearId ? `?academic_year_id=${selectedAcademicYearId}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data.status === "success") {
        // Less restrictive check - allow non-array data as a fallback
        let responseData = response.data.data;
        if (!responseData) {
          console.log("No data in response");
          setCourses([]);
          return;
        }
        
        // Ensure responseData is an array
        if (!Array.isArray(responseData)) {
          console.log("Response data is not an array, attempting to convert:", responseData);
          // Try to convert to array if it's an object
          if (typeof responseData === 'object') {
            responseData = [responseData];
          } else {
            responseData = [];
          }
        }
        
        // Transform assignment data to course-centric format with improved field extraction
        const assignedCourses = responseData
          .filter((assignment: any) => assignment !== null && assignment !== undefined)
          .map((assignment: any) => {
            console.log("Processing assignment:", assignment);
            
            // Basic object check
            if (typeof assignment !== 'object') {
              console.log("Assignment is not an object:", assignment);
              return null;
            }
            
            // Extract course data, prioritizing direct fields then nested objects
            const courseData: Course = {
              id: 0,
              code: '',
              name: '',
              semester: 0
            };
            
            // Try to extract course ID
            if (assignment.course_id !== undefined) {
              courseData.id = assignment.course_id;
            } else if (assignment.CourseID !== undefined) {
              courseData.id = assignment.CourseID;
            } else if (assignment.course?.id !== undefined) {
              courseData.id = assignment.course.id;
            }
            
            // Try to extract course code
            if (assignment.course_code !== undefined) {
              courseData.code = assignment.course_code;
            } else if (assignment.CourseCode !== undefined) {
              courseData.code = assignment.CourseCode;
            } else if (assignment.course?.code !== undefined) {
              courseData.code = assignment.course.code;
            }
            
            // Try to extract course name
            if (assignment.course_name !== undefined) {
              courseData.name = assignment.course_name;
            } else if (assignment.CourseName !== undefined) {
              courseData.name = assignment.CourseName;
            } else if (assignment.course?.name !== undefined) {
              courseData.name = assignment.course.name;
            }
            
            // Try to extract course semester
            if (assignment.course_semester !== undefined) {
              courseData.semester = assignment.course_semester;
            } else if (assignment.CourseSemester !== undefined) {
              courseData.semester = assignment.CourseSemester;
            } else if (assignment.course?.semester !== undefined) {
              courseData.semester = assignment.course.semester;
            }
            
            // Try to extract academic year information
            if (assignment.academic_year_name !== undefined) {
              courseData.academic_year_name = assignment.academic_year_name;
            } else if (assignment.AcademicYearName !== undefined) {
              courseData.academic_year_name = assignment.AcademicYearName;
            } else if (assignment.academic_year?.name !== undefined) {
              courseData.academic_year_name = assignment.academic_year.name;
            }
            
            if (assignment.academic_year_semester !== undefined) {
              courseData.academic_year_semester = assignment.academic_year_semester;
            } else if (assignment.AcademicYearSemester !== undefined) {
              courseData.academic_year_semester = assignment.AcademicYearSemester;
            } else if (assignment.academic_year?.semester !== undefined) {
              courseData.academic_year_semester = assignment.academic_year.semester;
            }
            
            console.log("Extracted course data:", courseData);
            
            // Only return courses with at least an ID
            if (courseData.id) {
              return courseData;
            }
            
            return null;
          })
          .filter((course: any) => course !== null);
        
        console.log("Processed courses:", assignedCourses);
        setCourses(assignedCourses);
      } else {
        console.log("API returned error status:", response.data.status);
        toast.error("Gagal memuat data mata kuliah");
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching assigned courses:", error);
      toast.error("Gagal memuat data mata kuliah");
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch courses when academic year changes
  useEffect(() => {
    if (selectedAcademicYearId) {
      fetchMyCourses();
      // Reset semester filter when academic year changes
      setSemesterFilter("all");
    }
  }, [selectedAcademicYearId]);

  // Get unique semesters for the filter - properly extracted from actual data
  const uniqueSemesters = React.useMemo(() => {
    const semesterValues = courses
      .filter(course => course.semester !== undefined && course.semester !== null)
      .map(course => course.semester);
    
    // Use Set to get unique values and sort them numerically
    return [...new Set(semesterValues)].sort((a, b) => a - b);
  }, [courses]);

  // Filter courses based on search query and semester filter
  const filteredCourses = courses
    .filter((course) => {
      // Only filter out completely empty courses
      if (course === null || course === undefined) return false;
      
      // Then filter by search query
      if (searchQuery) {
        const courseCode = (course.code || '').toLowerCase();
        const courseName = (course.name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
      
        if (!courseCode.includes(query) && !courseName.includes(query)) {
          return false;
        }
      }
      
      // Filter by semester if applicable
      if (semesterFilter !== 'all') {
        return course.semester?.toString() === semesterFilter;
      }
      
      return true;
    });

  // Get selected academic year name for display
  const getSelectedAcademicYearName = () => {
    if (!selectedAcademicYearId) return "";
    const academicYear = academicYears.find(year => year.id.toString() === selectedAcademicYearId);
    return academicYear ? `${academicYear.name} - ${academicYear.semester}` : "";
  };

  // View course details
  const viewCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowDetails(true);
  };

  // Get background color by semester
  const getSemesterColor = (semester: number) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200', 
      'bg-green-50 text-green-700 border-green-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200'
    ];
    return colors[(semester - 1) % colors.length];
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Mata Kuliah Saya</h3>
                  <p className="text-sm text-muted-foreground mt-1">Daftar mata kuliah yang Anda ampu pada tahun akademik {getSelectedAcademicYearName()}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
                <div className="relative w-full sm:w-[40%]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari mata kuliah..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <Select value={selectedAcademicYearId} onValueChange={setSelectedAcademicYearId}>
                    <SelectTrigger className="w-[240px] h-10">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tahun Akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {`${year.name} - ${year.semester}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger className="w-[200px] h-10">
                      <Filter className="h-4 w-4 mr-2" />
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

              {/* Courses list */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-[#0687C9] animate-spin" />
                  <span className="ml-2 text-muted-foreground">Memuat data mata kuliah...</span>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                        <TableHead className="w-[80px] font-bold text-black">Kode MK</TableHead>
                        <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                        <TableHead className="font-bold text-black">Semester</TableHead>
                        <TableHead className="font-bold text-black">Tahun Akademik</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course, index) => (
                        <TableRow key={course.id} className="hover:bg-[#F9FBFC]">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{course.code || "-"}</TableCell>
                          <TableCell>{course.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getSemesterColor(course.semester)}>
                              Semester {course.semester}
                              </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-[#0687C9]" />
                              {`${course.academic_year_name || "Tahun Akademik"} - ${course.academic_year_semester || "-"}`}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB] hover:text-[#0687C9]"
                              onClick={() => viewCourseDetails(course)}
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
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                        <TableHead className="w-[80px] font-bold text-black">Kode MK</TableHead>
                        <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                        <TableHead className="font-bold text-black">Semester</TableHead>
                        <TableHead className="font-bold text-black">Tahun Akademik</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="h-10 w-10 text-gray-300 mb-2" />
                            <p>Belum ada mata kuliah</p>
                            <p className="text-sm">
                              {academicYears.length > 0
                                ? "Anda belum memiliki mata kuliah yang ditugaskan pada tahun akademik ini"
                                : "Tidak ada data tahun akademik yang tersedia"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Course Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Detail Mata Kuliah</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai mata kuliah
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              <div className="bg-[#F9FBFC] p-4 rounded-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-black mb-2">
                  {selectedCourse.name}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-2 text-[#0687C9]" />
                  <span>{selectedCourse.code || "-"}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Informasi Akademik</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>{`${selectedCourse.academic_year_name || "Tahun Akademik"} - ${selectedCourse.academic_year_semester || "-"}`}</span>
                    </div>
                    <div className="flex items-center">
                      <Book className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Semester {selectedCourse.semester}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Pengajar</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-[#0687C9]" />
                      <span>Dosen Pengampu</span>
                    </div>
                  </div>
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
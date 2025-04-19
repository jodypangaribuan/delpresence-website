"use client";

import { useState } from "react";
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

// Type untuk data Mata Kuliah
interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
  department_name: string;
  faculty_name: string;
  status: "active" | "inactive";
  course_type: "theory" | "practice" | "mixed";
  weekly_hours: number;
  active_classes: number;
}

// Dummy data Mata Kuliah
const dummyCourses: Course[] = [
  {
    id: 1,
    code: "IF2001",
    name: "Algoritma dan Pemrograman",
    credits: 4,
    semester: 1,
    department_name: "Teknik Informatika",
    faculty_name: "Fakultas Ilmu Komputer",
    status: "active",
    course_type: "mixed",
    weekly_hours: 4,
    active_classes: 3
  },
  {
    id: 2,
    code: "IF2002",
    name: "Matematika Diskrit",
    credits: 3,
    semester: 1,
    department_name: "Teknik Informatika",
    faculty_name: "Fakultas Ilmu Komputer",
    status: "active",
    course_type: "theory",
    weekly_hours: 3,
    active_classes: 2
  },
  {
    id: 3,
    code: "IF2003",
    name: "Basis Data",
    credits: 4,
    semester: 3,
    department_name: "Teknik Informatika",
    faculty_name: "Fakultas Ilmu Komputer",
    status: "active",
    course_type: "mixed",
    weekly_hours: 4,
    active_classes: 4
  },
  {
    id: 4,
    code: "IF2004",
    name: "Pemrograman Web",
    credits: 3,
    semester: 4,
    department_name: "Teknik Informatika",
    faculty_name: "Fakultas Ilmu Komputer",
    status: "active",
    course_type: "mixed",
    weekly_hours: 3,
    active_classes: 3
  },
  {
    id: 5,
    code: "IF2005",
    name: "Jaringan Komputer",
    credits: 3,
    semester: 4,
    department_name: "Teknik Informatika",
    faculty_name: "Fakultas Ilmu Komputer",
    status: "inactive",
    course_type: "mixed",
    weekly_hours: 3,
    active_classes: 0
  },
];

// Dummy data Fakultas dan Program Studi
const departments = [
  { id: 1, name: "Teknik Informatika", faculty: "Fakultas Ilmu Komputer" },
  { id: 2, name: "Sistem Informasi", faculty: "Fakultas Ilmu Komputer" },
  { id: 3, name: "Teknik Elektro", faculty: "Fakultas Teknik" },
  { id: 4, name: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis" },
  { id: 5, name: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis" },
];

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>(dummyCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  // Filter courses based on search query, department, status, and semester
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      !departmentFilter || 
      course.department_name === departmentFilter;
    
    const matchesSemester = 
      !semesterFilter || 
      course.semester === semesterFilter;
    
    const matchesStatus = 
      !statusFilter || 
      course.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesSemester && matchesStatus;
  });

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setCurrentCourse(course);
    setShowEditDialog(true);
  };

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
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari mata kuliah berdasarkan nama atau kode..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select 
                onValueChange={(value) => setDepartmentFilter(value === "all" ? null : value)}
                value={departmentFilter || "all"}
              >
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value as any)}
                value={statusFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Nama Mata Kuliah</TableHead>
                  <TableHead className="text-center">SKS</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Jam/Minggu
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-1" />
                      Kelas Aktif
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-[#0687C9]" />
                            {course.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {course.department_name}
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
                      <TableCell className="text-center">{course.weekly_hours}</TableCell>
                      <TableCell className="text-center">{course.active_classes}</TableCell>
                      <TableCell>
                        {course.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-800">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-200 text-red-700">
                            Tidak Aktif
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
                              onClick={() => handleEditCourse(course)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: IF2001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama mata kuliah"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Program Studi</label>
              <div className="col-span-3">
                <Select>
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
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">SKS</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Jumlah SKS"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Semester</label>
              <div className="col-span-3">
                <Select>
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
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Tipe</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Teori</SelectItem>
                    <SelectItem value="practice">Praktikum</SelectItem>
                    <SelectItem value="mixed">Teori & Praktikum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Jam/Minggu</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Jumlah jam per minggu"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Status</label>
              <div className="col-span-3">
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button 
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              onClick={() => setShowAddDialog(false)}
            >
              Simpan
            </Button>
          </DialogFooter>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentCourse.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentCourse.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Program Studi</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourse.department_name}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">SKS</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentCourse.credits}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Semester</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourse.semester.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                        <SelectItem key={semester} value={semester.toString()}>
                          Semester {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Tipe</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourse.course_type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theory">Teori</SelectItem>
                      <SelectItem value="practice">Praktikum</SelectItem>
                      <SelectItem value="mixed">Teori & Praktikum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Jam/Minggu</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentCourse.weekly_hours}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourse.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button 
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              onClick={() => setShowEditDialog(false)}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
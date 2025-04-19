"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Presentation, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  UserSquare,
  BookOpen,
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

// Interface for class data
interface CourseClass {
  id: number;
  class_code: string;
  class_group: string;
  course_code: string;
  course_name: string;
  lecturer_name: string;
  max_students: number;
  enrolled_students: number;
  semester: number;
  academic_year: string;
  status: "active" | "inactive";
}

// Sample data
const sampleClasses: CourseClass[] = [
  {
    id: 1,
    class_code: "CS101-A",
    class_group: "A",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    lecturer_name: "Dr. John Smith",
    max_students: 30,
    enrolled_students: 28,
    semester: 1,
    academic_year: "2023/2024",
    status: "active"
  },
  {
    id: 2,
    class_code: "CS101-B",
    class_group: "B",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    lecturer_name: "Dr. Jane Doe",
    max_students: 30,
    enrolled_students: 25,
    semester: 1,
    academic_year: "2023/2024",
    status: "active"
  },
  {
    id: 3,
    class_code: "CS201-A",
    class_group: "A",
    course_code: "CS201",
    course_name: "Data Structures",
    lecturer_name: "Prof. Robert Johnson",
    max_students: 25,
    enrolled_students: 23,
    semester: 3,
    academic_year: "2023/2024",
    status: "active"
  },
  {
    id: 4,
    class_code: "CS301-A",
    class_group: "A",
    course_code: "CS301",
    course_name: "Database Systems",
    lecturer_name: "Dr. Sarah Williams",
    max_students: 20,
    enrolled_students: 18,
    semester: 5,
    academic_year: "2023/2024",
    status: "active"
  },
  {
    id: 5,
    class_code: "CS401-A",
    class_group: "A",
    course_code: "CS401",
    course_name: "Artificial Intelligence",
    lecturer_name: "Dr. Michael Brown",
    max_students: 20,
    enrolled_students: 15,
    semester: 7,
    academic_year: "2023/2024",
    status: "active"
  }
];

// Sample lecturers for dropdown
const sampleLecturers = [
  { id: 1, name: "Dr. John Smith" },
  { id: 2, name: "Dr. Jane Doe" },
  { id: 3, name: "Prof. Robert Johnson" },
  { id: 4, name: "Dr. Sarah Williams" },
  { id: 5, name: "Dr. Michael Brown" }
];

// Sample courses for dropdown
const sampleCourses = [
  { code: "CS101", name: "Introduction to Computer Science" },
  { code: "CS201", name: "Data Structures" },
  { code: "CS301", name: "Database Systems" },
  { code: "CS401", name: "Artificial Intelligence" },
  { code: "CS501", name: "Software Engineering" }
];

export default function CourseClassesPage() {
  const [classes, setClasses] = useState<CourseClass[]>(sampleClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string | null>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentClass, setCurrentClass] = useState<CourseClass | null>(null);

  // Filter classes based on search query and semester filter
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = 
      classItem.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSemester = 
      semesterFilter === "all" || 
      (semesterFilter && classItem.semester === parseInt(semesterFilter));
    
    return matchesSearch && matchesSemester;
  });

  // Handle edit class
  const handleEditClass = (classItem: CourseClass) => {
    setCurrentClass(classItem);
    setShowEditDialog(true);
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Presentation className="mr-2 h-6 w-6 text-[#0687C9]" />
                Kelas Perkuliahan
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola kelas perkuliahan yang aktif dalam semester ini
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Kelas
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kode kelas, mata kuliah, atau dosen..."
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
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Kelas</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center">
                      <Users className="h-4 w-4 mr-1" />
                      Mahasiswa
                    </div>
                  </TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <Presentation className="mr-2 h-4 w-4 text-[#0687C9]" />
                          {classItem.class_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                          <div>
                            <div>{classItem.course_name}</div>
                            <div className="text-xs text-gray-500">{classItem.course_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UserSquare className="mr-2 h-4 w-4 text-gray-500" />
                          {classItem.lecturer_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{classItem.semester}</TableCell>
                      <TableCell className="text-center">
                        {classItem.enrolled_students}/{classItem.max_students}
                      </TableCell>
                      <TableCell>{classItem.academic_year}</TableCell>
                      <TableCell>
                        {classItem.status === 'active' ? (
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
                              onClick={() => handleEditClass(classItem)}
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
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      Tidak ada kelas yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog untuk Tambah Kelas */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Kelas Baru</DialogTitle>
            <DialogDescription>
              Tambahkan kelas baru untuk mata kuliah yang ditawarkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Mata Kuliah</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleCourses.map((course) => (
                      <SelectItem key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kelas</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: A, B, C"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Dosen</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dosen pengajar" />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleLecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kuota Mahasiswa</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Masukkan kapasitas maksimum"
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
              <label className="text-sm font-medium text-right">Tahun Akademik</label>
              <div className="col-span-3">
                <Select defaultValue="2023/2024">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023/2024">2023/2024</SelectItem>
                    <SelectItem value="2022/2023">2022/2023</SelectItem>
                    <SelectItem value="2021/2022">2021/2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Dialog untuk Edit Kelas */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
            <DialogDescription>
              Ubah informasi kelas yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentClass && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode Kelas</label>
                <Input
                  className="col-span-3"
                  value={currentClass.class_code}
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Mata Kuliah</label>
                <div className="col-span-3">
                  <Select defaultValue={currentClass.course_code}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleCourses.map((course) => (
                        <SelectItem key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kelas</label>
                <Input
                  className="col-span-3"
                  value={currentClass.class_group}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Dosen</label>
                <div className="col-span-3">
                  <Select defaultValue={currentClass.lecturer_name}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleLecturers.map((lecturer) => (
                        <SelectItem key={lecturer.id} value={lecturer.name}>
                          {lecturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kuota Mahasiswa</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentClass.max_students}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Semester</label>
                <div className="col-span-3">
                  <Select defaultValue={currentClass.semester.toString()}>
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
                <label className="text-sm font-medium text-right">Tahun Akademik</label>
                <div className="col-span-3">
                  <Select defaultValue={currentClass.academic_year}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                      <SelectItem value="2022/2023">2022/2023</SelectItem>
                      <SelectItem value="2021/2022">2021/2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentClass.status}>
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
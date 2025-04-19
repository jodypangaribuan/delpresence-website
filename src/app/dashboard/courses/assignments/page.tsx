"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserCog, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Briefcase,
  GraduationCap
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

// Interface for lecturer assignment
interface Assignment {
  id: number;
  lecturer_name: string;
  lecturer_role: "coordinator" | "instructor";
  course_code: string;
  course_name: string;
  semester: number;
  academic_year: string;
  class_group: string;
  status: "active" | "inactive";
}

// Sample data
const sampleAssignments: Assignment[] = [
  {
    id: 1,
    lecturer_name: "Dr. John Smith",
    lecturer_role: "coordinator",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    semester: 1,
    academic_year: "2023/2024",
    class_group: "A",
    status: "active"
  },
  {
    id: 2,
    lecturer_name: "Dr. Jane Doe",
    lecturer_role: "instructor",
    course_code: "CS101",
    course_name: "Introduction to Computer Science",
    semester: 1,
    academic_year: "2023/2024",
    class_group: "B",
    status: "active"
  },
  {
    id: 3,
    lecturer_name: "Prof. Robert Johnson",
    lecturer_role: "coordinator",
    course_code: "CS201",
    course_name: "Data Structures",
    semester: 3,
    academic_year: "2023/2024",
    class_group: "A",
    status: "active"
  },
  {
    id: 4,
    lecturer_name: "Dr. Sarah Williams",
    lecturer_role: "instructor",
    course_code: "CS301",
    course_name: "Database Systems",
    semester: 5,
    academic_year: "2023/2024",
    class_group: "A",
    status: "active"
  },
  {
    id: 5,
    lecturer_name: "Dr. Michael Brown",
    lecturer_role: "instructor",
    course_code: "CS401",
    course_name: "Artificial Intelligence",
    semester: 7,
    academic_year: "2023/2024",
    class_group: "A",
    status: "active"
  }
];

// Sample lecturers for dropdown
const sampleLecturers = [
  { id: 1, name: "Dr. John Smith" },
  { id: 2, name: "Dr. Jane Doe" },
  { id: 3, name: "Prof. Robert Johnson" },
  { id: 4, name: "Dr. Sarah Williams" },
  { id: 5, name: "Dr. Michael Brown" },
  { id: 6, name: "Dr. Emily Davis" },
  { id: 7, name: "Prof. Thomas Wilson" }
];

// Sample courses for dropdown
const sampleCourses = [
  { code: "CS101", name: "Introduction to Computer Science" },
  { code: "CS201", name: "Data Structures" },
  { code: "CS301", name: "Database Systems" },
  { code: "CS401", name: "Artificial Intelligence" },
  { code: "CS501", name: "Software Engineering" }
];

export default function LecturerAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(sampleAssignments);
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string | null>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

  // Filter assignments based on search query and semester filter
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = 
      assignment.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSemester = 
      semesterFilter === "all" || 
      (semesterFilter && assignment.semester === parseInt(semesterFilter));
    
    return matchesSearch && matchesSemester;
  });

  // Handle edit assignment
  const handleEditAssignment = (assignment: Assignment) => {
    setCurrentAssignment(assignment);
    setShowEditDialog(true);
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'coordinator':
        return "Koordinator";
      case 'instructor':
        return "Pengajar";
      default:
        return role;
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
              onClick={() => setShowAddDialog(true)}
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
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Kode MK</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <Briefcase className="mr-2 h-4 w-4 text-[#0687C9]" />
                          {assignment.lecturer_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={assignment.lecturer_role === 'coordinator' 
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-purple-50 border-purple-200 text-purple-700"
                          }
                        >
                          {getRoleLabel(assignment.lecturer_role)}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.course_code}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                          {assignment.course_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{assignment.semester}</TableCell>
                      <TableCell>{assignment.class_group}</TableCell>
                      <TableCell>{assignment.academic_year}</TableCell>
                      <TableCell>
                        {assignment.status === 'active' ? (
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
                              onClick={() => handleEditAssignment(assignment)}
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dosen" />
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
              <label className="text-sm font-medium text-right">Peran</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinator">Koordinator</SelectItem>
                    <SelectItem value="instructor">Pengajar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              <label className="text-sm font-medium text-right">Kelas</label>
              <Input
                className="col-span-3"
                placeholder="Masukkan kelas (A, B, C, dst)"
              />
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
                  <Select defaultValue={currentAssignment.lecturer_name}>
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
                <label className="text-sm font-medium text-right">Peran</label>
                <div className="col-span-3">
                  <Select defaultValue={currentAssignment.lecturer_role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coordinator">Koordinator</SelectItem>
                      <SelectItem value="instructor">Pengajar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Mata Kuliah</label>
                <div className="col-span-3">
                  <Select defaultValue={currentAssignment.course_code}>
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
                <label className="text-sm font-medium text-right">Semester</label>
                <div className="col-span-3">
                  <Select defaultValue={currentAssignment.semester.toString()}>
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
                <label className="text-sm font-medium text-right">Kelas</label>
                <Input
                  className="col-span-3"
                  value={currentAssignment.class_group}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Tahun Akademik</label>
                <div className="col-span-3">
                  <Select defaultValue={currentAssignment.academic_year}>
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
                  <Select defaultValue={currentAssignment.status}>
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
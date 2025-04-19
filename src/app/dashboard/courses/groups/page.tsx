"use client";

import { useState } from "react";
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

// Type untuk data Kelompok Mata Kuliah
interface CourseGroup {
  id: number;
  code: string;
  name: string;
  type: "required" | "elective" | "general";
  faculty_name: string;
  department_name: string;
  course_count: number;
  semester_range: string; // e.g., "1-4" or "5-8"
  total_credits: number;
  status: "active" | "inactive";
}

// Dummy data Kelompok Mata Kuliah
const dummyCourseGroups: CourseGroup[] = [
  {
    id: 1,
    code: "KMK-TI-CORE",
    name: "Mata Kuliah Inti Teknik Informatika",
    type: "required",
    faculty_name: "Fakultas Ilmu Komputer",
    department_name: "Teknik Informatika",
    course_count: 12,
    semester_range: "1-4",
    total_credits: 48,
    status: "active"
  },
  {
    id: 2,
    code: "KMK-TI-SPEC",
    name: "Mata Kuliah Keahlian Teknik Informatika",
    type: "required",
    faculty_name: "Fakultas Ilmu Komputer",
    department_name: "Teknik Informatika",
    course_count: 10,
    semester_range: "5-8",
    total_credits: 40,
    status: "active"
  },
  {
    id: 3,
    code: "KMK-TI-ELEC",
    name: "Mata Kuliah Pilihan Teknik Informatika",
    type: "elective",
    faculty_name: "Fakultas Ilmu Komputer",
    department_name: "Teknik Informatika",
    course_count: 8,
    semester_range: "5-8",
    total_credits: 24,
    status: "active"
  },
  {
    id: 4,
    code: "KMK-MPU",
    name: "Mata Kuliah Pengembangan Umum",
    type: "general",
    faculty_name: "Universitas",
    department_name: "Semua Program Studi",
    course_count: 6,
    semester_range: "1-8",
    total_credits: 12,
    status: "active"
  },
  {
    id: 5,
    code: "KMK-SI-CORE",
    name: "Mata Kuliah Inti Sistem Informasi",
    type: "required",
    faculty_name: "Fakultas Ilmu Komputer",
    department_name: "Sistem Informasi",
    course_count: 14,
    semester_range: "1-4",
    total_credits: 56,
    status: "active"
  },
];

// Dummy data Fakultas dan Program Studi
const departments = [
  { id: 1, name: "Teknik Informatika", faculty: "Fakultas Ilmu Komputer" },
  { id: 2, name: "Sistem Informasi", faculty: "Fakultas Ilmu Komputer" },
  { id: 3, name: "Teknik Elektro", faculty: "Fakultas Teknik" },
  { id: 4, name: "Manajemen", faculty: "Fakultas Ekonomi dan Bisnis" },
  { id: 5, name: "Akuntansi", faculty: "Fakultas Ekonomi dan Bisnis" },
  { id: 6, name: "Semua Program Studi", faculty: "Universitas" },
];

export default function CourseGroupsPage() {
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>(dummyCourseGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentCourseGroup, setCurrentCourseGroup] = useState<CourseGroup | null>(null);

  // Filter course groups based on search query, department, and type
  const filteredCourseGroups = courseGroups.filter((group) => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = 
      !departmentFilter || 
      group.department_name === departmentFilter;
    
    const matchesType = 
      !typeFilter || 
      group.type === typeFilter;
    
    return matchesSearch && matchesDepartment && matchesType;
  });

  // Handle edit course group
  const handleEditCourseGroup = (group: CourseGroup) => {
    setCurrentCourseGroup(group);
    setShowEditDialog(true);
  };

  // Get course group type label
  const getGroupTypeLabel = (type: string) => {
    switch(type) {
      case 'required':
        return "Wajib";
      case 'elective':
        return "Pilihan";
      case 'general':
        return "Umum";
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
                <FolderKanban className="mr-2 h-6 w-6 text-[#0687C9]" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}
                value={typeFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipe Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="required">Wajib</SelectItem>
                  <SelectItem value="elective">Pilihan</SelectItem>
                  <SelectItem value="general">Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode</TableHead>
                  <TableHead>Nama Kelompok</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      Jml MK
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center">
                      <Layers className="h-4 w-4 mr-1" />
                      Total SKS
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourseGroups.length > 0 ? (
                  filteredCourseGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.code}</TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <FolderKanban className="h-4 w-4 mr-2 text-[#0687C9]" />
                          {group.name}
                        </div>
                      </TableCell>
                      <TableCell>{group.department_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            group.type === 'required' 
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : group.type === 'elective'
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : "bg-green-50 border-green-200 text-green-700"
                          }
                        >
                          {getGroupTypeLabel(group.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{group.semester_range}</TableCell>
                      <TableCell className="text-center">{group.course_count}</TableCell>
                      <TableCell className="text-center">{group.total_credits}</TableCell>
                      <TableCell>
                        {group.status === 'active' ? (
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
                              onClick={() => handleEditCourseGroup(group)}
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: KMK-TI-CORE"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama kelompok mata kuliah"
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
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
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
                    <SelectValue placeholder="Pilih tipe kelompok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Wajib</SelectItem>
                    <SelectItem value="elective">Pilihan</SelectItem>
                    <SelectItem value="general">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Rentang Semester</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: 1-4"
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentCourseGroup.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentCourseGroup.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Program Studi</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourseGroup.department_name}>
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
                <label className="text-sm font-medium text-right">Tipe</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourseGroup.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Wajib</SelectItem>
                      <SelectItem value="elective">Pilihan</SelectItem>
                      <SelectItem value="general">Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Rentang Semester</label>
                <Input
                  className="col-span-3"
                  value={currentCourseGroup.semester_range}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentCourseGroup.status}>
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
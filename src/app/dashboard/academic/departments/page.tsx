"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  School, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  Building,
  MoreHorizontal
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
  DialogTrigger,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type untuk data Program Studi
interface Department {
  id: number;
  code: string;
  name: string;
  faculty_id: number;
  faculty_name: string;
  degree: string;
  status: "active" | "inactive";
  accreditation: string;
  head_of_department: string;
  student_count: number;
}

// Dummy data fakultas untuk dropdown
const faculties = [
  { id: 1, name: "Fakultas Teknik" },
  { id: 2, name: "Fakultas Ekonomi dan Bisnis" },
  { id: 3, name: "Fakultas Ilmu Komputer" },
  { id: 4, name: "Fakultas Kedokteran" },
  { id: 5, name: "Fakultas Hukum" },
];

// Dummy data Program Studi
const dummyDepartments: Department[] = [
  {
    id: 1,
    code: "TI",
    name: "Teknik Informatika",
    faculty_id: 3,
    faculty_name: "Fakultas Ilmu Komputer",
    degree: "S1",
    status: "active",
    accreditation: "A",
    head_of_department: "Dr. Budi Santoso, M.Kom",
    student_count: 450
  },
  {
    id: 2,
    code: "SI",
    name: "Sistem Informasi",
    faculty_id: 3,
    faculty_name: "Fakultas Ilmu Komputer",
    degree: "S1",
    status: "active",
    accreditation: "A",
    head_of_department: "Dr. Siti Aminah, M.Cs",
    student_count: 380
  },
  {
    id: 3,
    code: "TE",
    name: "Teknik Elektro",
    faculty_id: 1,
    faculty_name: "Fakultas Teknik",
    degree: "S1",
    status: "active",
    accreditation: "B",
    head_of_department: "Dr. Ahmad Fauzi, M.T",
    student_count: 320
  },
  {
    id: 4,
    code: "AK",
    name: "Akuntansi",
    faculty_id: 2,
    faculty_name: "Fakultas Ekonomi dan Bisnis",
    degree: "S1",
    status: "active",
    accreditation: "A",
    head_of_department: "Dr. Maya Putri, M.Ak",
    student_count: 400
  },
  {
    id: 5,
    code: "MJ",
    name: "Manajemen",
    faculty_id: 2,
    faculty_name: "Fakultas Ekonomi dan Bisnis",
    degree: "S1",
    status: "active",
    accreditation: "A",
    head_of_department: "Dr. Rendra Wijaya, M.M",
    student_count: 420
  },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(dummyDepartments);
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);

  // Filter departments based on search query and faculty filter
  const filteredDepartments = departments.filter(department => {
    const matchesSearch = 
      department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFaculty = 
      !facultyFilter || 
      facultyFilter === "all" || 
      department.faculty_id.toString() === facultyFilter;
    
    return matchesSearch && matchesFaculty;
  });

  // Handle dialog open for editing
  const handleEditDepartment = (department: Department) => {
    setCurrentDepartment(department);
    setShowEditDialog(true);
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <School className="mr-2 h-6 w-6 text-[#0687C9]" />
                Program Studi
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar program studi di universitas
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Program Studi
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari program studi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-72">
              <Select 
                onValueChange={(value) => setFacultyFilter(value)}
                value={facultyFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Fakultas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Semua Fakultas</SelectItem>
                    {faculties.map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Nama Program Studi</TableHead>
                  <TableHead>Fakultas</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Akreditasi</TableHead>
                  <TableHead>Ketua Prodi</TableHead>
                  <TableHead className="text-center">Jml Mahasiswa</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.code}</TableCell>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {department.faculty_name}
                        </div>
                      </TableCell>
                      <TableCell>{department.degree}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            department.accreditation === 'A' 
                              ? 'bg-green-100 text-green-800' 
                              : department.accreditation === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {department.accreditation}
                        </Badge>
                      </TableCell>
                      <TableCell>{department.head_of_department}</TableCell>
                      <TableCell className="text-center">{department.student_count}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            department.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {department.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
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
                              onClick={() => handleEditDepartment(department)}
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
                      Tidak ada program studi yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Department */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Program Studi Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail program studi baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: TI, SI"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama program studi"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Fakultas</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Jenjang</label>
              <div className="col-span-3">
                <Select defaultValue="S1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D3">D3 (Diploma)</SelectItem>
                    <SelectItem value="S1">S1 (Sarjana)</SelectItem>
                    <SelectItem value="S2">S2 (Magister)</SelectItem>
                    <SelectItem value="S3">S3 (Doktor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Akreditasi</label>
              <div className="col-span-3">
                <Select defaultValue="B">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="Unggul">Unggul</SelectItem>
                    <SelectItem value="Baik">Baik Sekali</SelectItem>
                    <SelectItem value="Baik">Baik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Ketua Prodi</label>
              <Input
                className="col-span-3"
                placeholder="Nama lengkap dengan gelar"
              />
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

      {/* Dialog for editing Department */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Program Studi</DialogTitle>
            <DialogDescription>
              Edit informasi program studi yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentDepartment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentDepartment.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentDepartment.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Fakultas</label>
                <div className="col-span-3">
                  <Select defaultValue={currentDepartment.faculty_id.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map(faculty => (
                        <SelectItem key={faculty.id} value={faculty.id.toString()}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Jenjang</label>
                <div className="col-span-3">
                  <Select defaultValue={currentDepartment.degree}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D3">D3 (Diploma)</SelectItem>
                      <SelectItem value="S1">S1 (Sarjana)</SelectItem>
                      <SelectItem value="S2">S2 (Magister)</SelectItem>
                      <SelectItem value="S3">S3 (Doktor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Akreditasi</label>
                <div className="col-span-3">
                  <Select defaultValue={currentDepartment.accreditation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="Unggul">Unggul</SelectItem>
                      <SelectItem value="Baik">Baik Sekali</SelectItem>
                      <SelectItem value="Baik">Baik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Ketua Prodi</label>
                <Input
                  className="col-span-3"
                  value={currentDepartment.head_of_department}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentDepartment.status}>
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
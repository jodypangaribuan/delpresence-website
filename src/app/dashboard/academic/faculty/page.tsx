"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  Users,
  BarChart2,
  School,
  BookOpen,
  CircleUser,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Type untuk data Fakultas
interface Faculty {
  id: number;
  code: string;
  name: string;
  dean: string;
  establishment_year: number;
  status: "active" | "inactive";
  departmentCount: number;
  studentCount: number;
  lecturerCount: number;
}

// Dummy data Fakultas
const dummyFaculties: Faculty[] = [
  {
    id: 1,
    code: "FT",
    name: "Fakultas Teknik",
    dean: "Prof. Dr. Ir. Agus Priyanto, M.T",
    establishment_year: 1985,
    status: "active",
    departmentCount: 6,
    studentCount: 1250,
    lecturerCount: 78
  },
  {
    id: 2,
    code: "FEB",
    name: "Fakultas Ekonomi dan Bisnis",
    dean: "Prof. Dr. Hendra Wijaya, M.M., Ph.D",
    establishment_year: 1980,
    status: "active",
    departmentCount: 5,
    studentCount: 1480,
    lecturerCount: 65
  },
  {
    id: 3,
    code: "FILKOM",
    name: "Fakultas Ilmu Komputer",
    dean: "Prof. Dr. Satria Aditama, S.Kom., M.Cs",
    establishment_year: 1995,
    status: "active",
    departmentCount: 4,
    studentCount: 1320,
    lecturerCount: 54
  },
  {
    id: 4,
    code: "FK",
    name: "Fakultas Kedokteran",
    dean: "Prof. Dr. dr. Dewi Ratna, Sp.A(K)",
    establishment_year: 1970,
    status: "active",
    departmentCount: 3,
    studentCount: 890,
    lecturerCount: 92
  },
  {
    id: 5,
    code: "FH",
    name: "Fakultas Hukum",
    dean: "Prof. Dr. Ahmad Sofyan, S.H., M.H",
    establishment_year: 1975,
    status: "active",
    departmentCount: 2,
    studentCount: 750,
    lecturerCount: 45
  },
];

export default function FacultyPage() {
  const [faculties, setFaculties] = useState<Faculty[]>(dummyFaculties);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);

  // Filter faculties based on search query
  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faculty.dean.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle edit faculty dialog
  const handleEditFaculty = (faculty: Faculty) => {
    setCurrentFaculty(faculty);
    setShowEditDialog(true);
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Building2 className="mr-2 h-6 w-6 text-[#0687C9]" />
                Fakultas
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar fakultas di universitas
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Fakultas
            </Button>
          </div>
          
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari fakultas berdasarkan nama, kode, atau dekan..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Nama Fakultas</TableHead>
                  <TableHead>Dekan</TableHead>
                  <TableHead>Tahun Berdiri</TableHead>
                  <TableHead className="text-center">Jumlah Prodi</TableHead>
                  <TableHead className="text-center">Jumlah Mahasiswa</TableHead>
                  <TableHead className="text-center">Jumlah Dosen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculties.length > 0 ? (
                  filteredFaculties.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell className="font-medium">{faculty.code}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-[#0687C9]" />
                          {faculty.name}
                        </div>
                      </TableCell>
                      <TableCell>{faculty.dean}</TableCell>
                      <TableCell>{faculty.establishment_year}</TableCell>
                      <TableCell className="text-center">{faculty.departmentCount}</TableCell>
                      <TableCell className="text-center">{faculty.studentCount}</TableCell>
                      <TableCell className="text-center">{faculty.lecturerCount}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            faculty.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {faculty.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
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
                              onClick={() => handleEditFaculty(faculty)}
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
                      Tidak ada fakultas yang sesuai dengan pencarian
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Faculty */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Fakultas Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail fakultas baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: FT, FILKOM"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama fakultas"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Dekan</label>
              <Input
                className="col-span-3"
                placeholder="Nama lengkap dengan gelar"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Tahun Berdiri</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Contoh: 1980"
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

      {/* Dialog for editing Faculty */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Fakultas</DialogTitle>
            <DialogDescription>
              Edit informasi fakultas yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentFaculty && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentFaculty.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentFaculty.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Dekan</label>
                <Input
                  className="col-span-3"
                  value={currentFaculty.dean}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Tahun Berdiri</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentFaculty.establishment_year}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3 flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={currentFaculty.status === 'active'}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Aktif</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={currentFaculty.status === 'inactive'}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Tidak Aktif</span>
                  </label>
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
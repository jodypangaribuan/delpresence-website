"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  File
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type untuk data Permission/Izin
interface StudentPermission {
  id: number;
  student_name: string;
  student_nim: string;
  course_name: string;
  date: string;
  reason: "sick" | "family" | "organization" | "other";
  status: "pending" | "approved" | "rejected";
  documentation: string; // URL to documentation
  notes: string;
  submission_date: string;
  lecturer_name: string;
}

const reasons = {
  sick: "Sakit",
  family: "Keperluan Keluarga",
  organization: "Kegiatan Organisasi",
  other: "Lainnya"
};

// Dummy data izin mahasiswa
const dummyPermissions: StudentPermission[] = [
  {
    id: 1,
    student_name: "Ahmad Farhan",
    student_nim: "12345678",
    course_name: "Pemrograman Web",
    date: "2023-10-12",
    reason: "sick",
    status: "approved",
    documentation: "/dummy/surat-dokter-1.pdf",
    notes: "Surat dokter terlampir. Mohon izin tidak mengikuti perkuliahan.",
    submission_date: "2023-10-11",
    lecturer_name: "Dr. Budi Santoso, M.Kom"
  },
  {
    id: 2,
    student_name: "Siti Rahma",
    student_nim: "12345679",
    course_name: "Basis Data",
    date: "2023-10-15",
    reason: "family",
    status: "rejected",
    documentation: "/dummy/surat-keluarga-1.pdf",
    notes: "Acara keluarga besar di luar kota.",
    submission_date: "2023-10-13",
    lecturer_name: "Dr. Siti Aminah, M.Cs"
  },
  {
    id: 3,
    student_name: "Deni Prasetyo",
    student_nim: "12345680",
    course_name: "Algoritma dan Pemrograman",
    date: "2023-10-18",
    reason: "organization",
    status: "pending",
    documentation: "/dummy/surat-organisasi-1.pdf",
    notes: "Mengikuti kegiatan BEM sebagai panitia acara kampus.",
    submission_date: "2023-10-17",
    lecturer_name: "Dr. Ahmad Fauzi, M.T"
  },
  {
    id: 4,
    student_name: "Dewi Lestari",
    student_nim: "12345681",
    course_name: "Struktur Data",
    date: "2023-10-20",
    reason: "sick",
    status: "pending",
    documentation: "/dummy/surat-dokter-2.pdf",
    notes: "Demam tinggi, butuh istirahat menurut dokter.",
    submission_date: "2023-10-19",
    lecturer_name: "Dr. Maya Putri, M.Ak"
  },
  {
    id: 5,
    student_name: "Rendi Wijaya",
    student_nim: "12345682",
    course_name: "Jaringan Komputer",
    date: "2023-10-22",
    reason: "other",
    status: "approved",
    documentation: "/dummy/surat-izin-1.pdf",
    notes: "Mengikuti kompetisi programming di tingkat nasional sebagai perwakilan kampus.",
    submission_date: "2023-10-20",
    lecturer_name: "Dr. Rendra Wijaya, M.M"
  },
];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<StudentPermission[]>(dummyPermissions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<StudentPermission | null>(null);

  // Filter permissions based on search query, status and reason
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = 
      permission.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.student_nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.course_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter 
      ? statusFilter === "all" ? true : permission.status === statusFilter
      : true;

    const matchesReason = reasonFilter 
      ? reasonFilter === "all" ? true : permission.reason === reasonFilter
      : true;
    
    return matchesSearch && matchesStatus && matchesReason;
  });

  // Handle view permission detail
  const handleViewPermission = (permission: StudentPermission) => {
    setCurrentPermission(permission);
    setShowDetailDialog(true);
  };

  // Handle approve permission
  const handleApprovePermission = (id: number) => {
    setPermissions(
      permissions.map(permission => 
        permission.id === id 
          ? { ...permission, status: "approved" } 
          : permission
      )
    );
    // Close dialog if open
    if (showDetailDialog) {
      setShowDetailDialog(false);
    }
  };

  // Handle reject permission
  const handleRejectPermission = (id: number) => {
    setPermissions(
      permissions.map(permission => 
        permission.id === id 
          ? { ...permission, status: "rejected" } 
          : permission
      )
    );
    // Close dialog if open
    if (showDetailDialog) {
      setShowDetailDialog(false);
    }
  };

  // Get status badge based on permission status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Disetujui
        </Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Ditolak
        </Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Menunggu
        </Badge>;
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <FileCheck className="mr-2 h-6 w-6 text-[#0687C9]" />
                Verifikasi Izin Mahasiswa
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola dan verifikasi permohonan izin ketidakhadiran mahasiswa
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan nama, NIM, atau mata kuliah..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select 
                onValueChange={(value) => setStatusFilter(value || null)}
                value={statusFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-60">
              <Select 
                onValueChange={(value) => setReasonFilter(value || null)}
                value={reasonFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Alasan</SelectItem>
                  <SelectItem value="sick">Sakit</SelectItem>
                  <SelectItem value="family">Keperluan Keluarga</SelectItem>
                  <SelectItem value="organization">Kegiatan Organisasi</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Tanggal Izin</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length > 0 ? (
                  filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.student_name}</div>
                          <div className="text-sm text-gray-500">{permission.student_nim}</div>
                        </div>
                      </TableCell>
                      <TableCell>{permission.course_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(permission.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{reasons[permission.reason]}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[#0687C9]">
                          <File className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(permission.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {permission.status === 'pending' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleApprovePermission(permission.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Setujui
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleRejectPermission(permission.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleViewPermission(permission)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      Tidak ada permohonan izin yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Statistics Cards */}
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-yellow-800">Menunggu Verifikasi</h3>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-900">
                  {permissions.filter(p => p.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-700 mt-1">Perlu ditinjau</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-green-800">Izin Disetujui</h3>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {permissions.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-sm text-green-700 mt-1">Minggu ini</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-red-800">Izin Ditolak</h3>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-red-900">
                  {permissions.filter(p => p.status === 'rejected').length}
                </div>
                <div className="text-sm text-red-700 mt-1">Minggu ini</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for viewing permission details */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Permohonan Izin</DialogTitle>
            <DialogDescription>
              Informasi lengkap permohonan izin mahasiswa
            </DialogDescription>
          </DialogHeader>
          
          {currentPermission && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(currentPermission.status)}
              </div>
              
              {/* Student Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Informasi Mahasiswa</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Nama:</div>
                  <div className="font-medium">{currentPermission.student_name}</div>
                  <div className="text-gray-600">NIM:</div>
                  <div className="font-medium">{currentPermission.student_nim}</div>
                </div>
              </div>
              
              {/* Permission Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Detail Izin</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Mata Kuliah:</div>
                  <div className="font-medium">{currentPermission.course_name}</div>
                  <div className="text-gray-600">Dosen:</div>
                  <div className="font-medium">{currentPermission.lecturer_name}</div>
                  <div className="text-gray-600">Tanggal Izin:</div>
                  <div className="font-medium">{new Date(currentPermission.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</div>
                  <div className="text-gray-600">Diajukan pada:</div>
                  <div className="font-medium">{new Date(currentPermission.submission_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</div>
                  <div className="text-gray-600">Alasan:</div>
                  <div className="font-medium">{reasons[currentPermission.reason]}</div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Keterangan</h3>
                <p className="text-sm text-gray-800">{currentPermission.notes}</p>
              </div>
              
              {/* Document */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Dokumen Pendukung</h3>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-[#0687C9]">
                    <FileText className="h-5 w-5 mr-2" />
                    <span className="text-sm">Dokumen Izin</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <Download className="h-4 w-4 mr-1" />
                    Unduh
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {currentPermission && currentPermission.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleRejectPermission(currentPermission.id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Tolak Permohonan
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprovePermission(currentPermission.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Setujui Permohonan
                </Button>
              </>
            )}
            {currentPermission && currentPermission.status !== 'pending' && (
              <Button onClick={() => setShowDetailDialog(false)}>
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
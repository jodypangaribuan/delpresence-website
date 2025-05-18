"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  CalendarDays, 
  Pencil,
  Trash2,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import axios from "axios";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { academicYearFormSchema, AcademicYear, AcademicYearWithStats } from "@/lib/validators/academic-year";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { API_URL } from "@/utils/env";

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYearWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);

  // Forms
  const addForm = useForm({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      name: "",
      start_date: new Date(),
      end_date: new Date(),
      semester: "Ganjil" as const,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: {
      name: "",
      start_date: new Date(),
      end_date: new Date(),
      semester: "Ganjil" as const,
    },
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Fetch academic years from API
  const fetchAcademicYears = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/academic-years?stats=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setAcademicYears(response.data.data);
      } else {
        toast.error("Gagal memuat tahun akademik");
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
      toast.error("Gagal memuat tahun akademik");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new academic year
  const handleAddAcademicYear = async (data: any) => {
    try {
      const response = await axios.post(`${API_URL}/api/admin/academic-years`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Tahun akademik berhasil ditambahkan");
        setShowAddDialog(false);
        addForm.reset();
        fetchAcademicYears();
      } else {
        toast.error(response.data.message || "Gagal menambahkan tahun akademik");
      }
    } catch (error: any) {
      console.error("Error adding academic year:", error);
      toast.error(error.response?.data?.message || "Gagal menambahkan tahun akademik");
    }
  };

  // Edit academic year
  const handleEditAcademicYear = async (data: any) => {
    if (!currentAcademicYear) return;
    
    try {
      const response = await axios.put(`${API_URL}/api/admin/academic-years/${currentAcademicYear.id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Tahun akademik berhasil diperbarui");
        setShowEditDialog(false);
        setCurrentAcademicYear(null);
        fetchAcademicYears();
      } else {
        toast.error(response.data.message || "Gagal memperbarui tahun akademik");
      }
    } catch (error: any) {
      console.error("Error updating academic year:", error);
      toast.error(error.response?.data?.message || "Gagal memperbarui tahun akademik");
    }
  };

  // Delete academic year
  const handleDeleteAcademicYear = async () => {
    if (!currentAcademicYear) return;
    
    try {
      const response = await axios.delete(`${API_URL}/api/admin/academic-years/${currentAcademicYear.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        toast.success("Tahun akademik berhasil dihapus");
        setShowDeleteDialog(false);
        setCurrentAcademicYear(null);
        fetchAcademicYears();
      } else {
        toast.error(response.data.message || "Gagal menghapus tahun akademik");
      }
    } catch (error: any) {
      console.error("Error deleting academic year:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus tahun akademik");
    }
  };

  // Setup edit academic year
  const setupEditAcademicYear = (year: AcademicYearWithStats) => {
    const academicYear = year.academic_year;
    setCurrentAcademicYear(academicYear);
    editForm.reset({
      name: academicYear.name,
      start_date: new Date(academicYear.start_date),
      end_date: new Date(academicYear.end_date),
      semester: academicYear.semester,
    });
    setShowEditDialog(true);
  };

  // Filter academic years based on search and semester
  const filteredYears = academicYears.filter((year) => {
    const matchesSearch = year.academic_year.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester =
      semesterFilter === "all" ||
      (semesterFilter === "ganjil" && year.academic_year.semester === "Ganjil") ||
      (semesterFilter === "genap" && year.academic_year.semester === "Genap");
    
    return matchesSearch && matchesSemester;
  });

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <CalendarDays className="mr-2 h-6 w-6 text-[#0687C9]" />
                Tahun Akademik
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola data tahun akademik dan semester di universitas
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                addForm.reset();
                setShowAddDialog(true);
              }}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Tahun Akademik
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari tahun akademik..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-full md:w-48">
                <Select 
                  onValueChange={setSemesterFilter}
                  value={semesterFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Semester</SelectItem>
                    <SelectItem value="ganjil">Ganjil</SelectItem>
                    <SelectItem value="genap">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] font-semibold text-gray-700">No</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tahun Akademik</TableHead>
                  <TableHead className="font-semibold text-gray-700">Semester</TableHead>
                  <TableHead className="font-semibold text-gray-700">Periode</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Mata Kuliah</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">Jadwal</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-gray-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-[#0687C9] border-opacity-50 border-t-[#0687C9] rounded-full"></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Memuat data tahun akademik...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredYears.length > 0 ? (
                  filteredYears.map((year, index) => (
                    <TableRow key={year.academic_year.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {year.academic_year.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 font-normal">
                          {year.academic_year.semester}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {format(new Date(year.academic_year.start_date), "dd MMM yyyy")} - {format(new Date(year.academic_year.end_date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {year.stats?.total_courses || 0}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {year.stats?.total_schedules || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Aksi</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setupEditAcademicYear(year)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setCurrentAcademicYear(year.academic_year);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Tidak ada data yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Academic Year Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Tahun Akademik Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail tahun akademik baru yang ingin ditambahkan.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddAcademicYear)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Tahun Akademik</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh: 2023/2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ganjil">Ganjil</SelectItem>
                        <SelectItem value="Genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <DatePicker
                      label="Tanggal Mulai"
                      value={field.value}
                      onChange={field.onChange}
                      fieldError={addForm.formState.errors.start_date?.message?.toString()}
                    />
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker
                      label="Tanggal Selesai"
                      value={field.value}
                      onChange={field.onChange}
                      fieldError={addForm.formState.errors.end_date?.message?.toString()}
                    />
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
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

      {/* Edit Academic Year Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tahun Akademik</DialogTitle>
            <DialogDescription>
              Edit informasi tahun akademik.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditAcademicYear)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Tahun Akademik</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh: 2023/2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ganjil">Ganjil</SelectItem>
                        <SelectItem value="Genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <DatePicker
                      label="Tanggal Mulai"
                      value={field.value}
                      onChange={field.onChange}
                      fieldError={editForm.formState.errors.start_date?.message?.toString()}
                    />
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker
                      label="Tanggal Selesai"
                      value={field.value}
                      onChange={field.onChange}
                      fieldError={editForm.formState.errors.end_date?.message?.toString()}
                    />
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAcademicYear}
        title="Hapus Tahun Akademik"
        description={`Apakah Anda yakin ingin menghapus tahun akademik "${currentAcademicYear?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
} 
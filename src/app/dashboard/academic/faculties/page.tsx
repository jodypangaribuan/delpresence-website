"use client";

import { useState, useEffect } from "react";
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
  MoreHorizontal,
  Loader2
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
import { toast } from "sonner";
import axios from "axios";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { facultyFormSchema } from "@/lib/validators/faculty";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type untuk data Fakultas
interface Faculty {
  id: number;
  code: string;
  name: string;
  dean: string;
  establishment_year?: number;
  lecturer_count?: number;
}

// Type for faculty with stats
interface FacultyWithStats {
  faculty: Faculty;
  program_count: number;
  lecturer_count: number;
}

export default function FacultyPage() {
  const [faculties, setFaculties] = useState<FacultyWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<{id: number, name: string} | null>(null);
  
  // Add lecturer search state
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [searchLecturerQuery, setSearchLecturerQuery] = useState("");
  const [isSearchingLecturers, setIsSearchingLecturers] = useState(false);
  const [showLecturerResults, setShowLecturerResults] = useState(false);
  
  // Form for adding a new faculty
  const addForm = useForm({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      dean: "",
      establishment_year: new Date().getFullYear(),
      lecturer_count: undefined
    }
  });

  // Form for editing a faculty
  const editForm = useForm({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      dean: "",
      establishment_year: undefined,
      lecturer_count: undefined
    }
  });
  
  // Load faculties on initial render
  useEffect(() => {
    fetchFaculties();
  }, []);
  
  // Fetch all faculties from the API
  const fetchFaculties = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/faculties?stats=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setFaculties(response.data.data);
      } else {
        toast.error("Gagal memuat fakultas");
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      toast.error("Gagal memuat fakultas");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lecturers for dean selection
  const fetchLecturers = async (searchQuery: string) => {
    setIsSearchingLecturers(true);
    try {
      // Don't send request if search query is too short
      if (searchQuery.length < 2) {
        setLecturers([]);
        setIsSearchingLecturers(false);
        return;
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/lecturers/search?q=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data && response.data.status === "success" && response.data.data) {
        setLecturers(response.data.data);
        console.log("Fetched lecturers:", response.data.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setLecturers([]);
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
      setLecturers([]);
    } finally {
      setIsSearchingLecturers(false);
    }
  };

  // Search lecturers
  const searchLecturers = (query: string) => {
    setSearchLecturerQuery(query);
    setShowLecturerResults(query.length > 0);
    
    // Only fetch if query is at least 2 characters
    if (query.length >= 2) {
      fetchLecturers(query);
    } else if (query.length === 0) {
      setLecturers([]);
    }
  };

  // Select lecturer as dean
  const selectLecturer = (lecturer: any) => {
    console.log("Selected lecturer:", lecturer);
    addForm.setValue("dean", lecturer.full_name);
    setShowLecturerResults(false);
    setSearchLecturerQuery("");
  };

  // Filter faculties based on search query
  const filteredFaculties = faculties.filter(item =>
    item.faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.faculty.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.faculty.dean.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission for adding a new faculty
  const onAddSubmit = async (data: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/faculties`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Fakultas berhasil ditambahkan");
        fetchFaculties();
        setShowAddDialog(false);
        addForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menyimpan fakultas");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error saving faculty:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menyimpan fakultas");
      toast.error(errorMsg);
    }
  };

  // Handle editing a faculty
  const handleEditFaculty = (facultyData: FacultyWithStats) => {
    setCurrentFaculty(facultyData.faculty);
    
    // Set form data from current faculty
    editForm.reset({
      code: facultyData.faculty.code,
      name: facultyData.faculty.name,
      dean: facultyData.faculty.dean,
      establishment_year: facultyData.faculty.establishment_year,
      lecturer_count: facultyData.lecturer_count
    });
    
    setShowEditDialog(true);
  };

  // Handle form submission for editing a faculty
  const onEditSubmit = async (data: any) => {
    if (!currentFaculty) return;
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/faculties/${currentFaculty.id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Fakultas berhasil diperbarui");
        fetchFaculties();
        setShowEditDialog(false);
        editForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal memperbarui fakultas");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error updating faculty:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal memperbarui fakultas");
      toast.error(errorMsg);
    }
  };

  // Format error message
  const formatErrorMessage = (message: string) => {
    // Translate common error messages
    if (message.includes("not found")) {
      return "Data tidak ditemukan";
    }
    if (message.includes("record not found")) {
      return "Data tidak ditemukan";
    }
    if (message.includes("already exists")) {
      return "Data dengan kode tersebut sudah ada";
    }
    
    // Return original message if no translation found
    return message;
  };

  // Handle delete faculty
  const confirmDeleteFaculty = (faculty: FacultyWithStats) => {
    setFacultyToDelete({ id: faculty.faculty.id, name: faculty.faculty.name });
    setShowDeleteModal(true);
  };
  
  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/faculties/${facultyToDelete.id}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Fakultas berhasil dihapus");
        fetchFaculties();
        setShowDeleteModal(false);
        setFacultyToDelete(null);
      } else {
        toast.error(response.data.error || "Gagal menghapus fakultas");
      }
    } catch (error: any) {
      console.error("Error deleting faculty:", error);
      toast.error(error.response?.data?.error || "Gagal menghapus fakultas");
    } finally {
      setIsDeleting(false);
    }
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
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[80px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Fakultas</TableHead>
                  <TableHead className="font-bold text-black">Dekan</TableHead>
                  <TableHead className="text-center font-bold text-black">Tahun Pendirian</TableHead>
                  <TableHead className="text-center font-bold text-black">Jumlah Prodi</TableHead>
                  <TableHead className="text-center font-bold text-black">Jumlah Dosen</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-[#0687C9] border-opacity-50 border-t-[#0687C9] rounded-full"></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Memuat data fakultas...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredFaculties.length > 0 ? (
                  filteredFaculties.map((item, index) => (
                    <TableRow key={item.faculty.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.faculty.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {item.faculty.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.faculty.dean}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.faculty.establishment_year || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.program_count}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.lecturer_count}
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
                              onClick={() => handleEditFaculty(item)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteFaculty(item)}
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
                      Tidak ada fakultas yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Faculty */}
      <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
        setShowAddDialog(isOpen);
        if (!isOpen) addForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Fakultas Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail fakultas baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-2">
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Kode</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Contoh: FTI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Nama</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Nama fakultas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="dean"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Dekan</FormLabel>
                    <div className="col-span-3 relative">
                      <FormControl>
                        <Input 
                          placeholder="Nama dekan" 
                          {...field} 
                          value={field.value || ""} 
                          onChange={(e) => {
                            field.onChange(e);
                            searchLecturers(e.target.value);
                          }}
                        />
                      </FormControl>
                      {showLecturerResults && (
                        <div className="absolute z-50 mt-1 w-full border rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                          {isSearchingLecturers ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Mencari...</div>
                          ) : lecturers && lecturers.length > 0 ? (
                            <ul className="py-1">
                              {lecturers.map(lecturer => (
                                <li 
                                  key={lecturer.id}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                  onClick={() => {
                                    field.onChange(lecturer.full_name);
                                    setShowLecturerResults(false);
                                  }}
                                >
                                  <div className="font-medium">{lecturer.full_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {lecturer.nip && `NIP: ${lecturer.nip}`}
                                    {!lecturer.nip && lecturer.nidn && ` NIDN: ${lecturer.nidn}`}
                                    {lecturer.program && ` - ${lecturer.program}`}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : searchLecturerQuery.length >= 2 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Tidak ada dosen yang ditemukan</div>
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Ketik minimal 2 karakter untuk mencari</div>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="establishment_year"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Tahun Pendirian</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Contoh: 1990" 
                          min="1900"
                          max={new Date().getFullYear()}
                          {...field}
                          value={field.value || ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="lecturer_count"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Jumlah Dosen</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Jumlah dosen" 
                          min="0"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || value === null) {
                              field.onChange(undefined);
                            } else {
                              field.onChange(parseInt(value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  addForm.reset();
                }}>
                  Batal
                </Button>
                <Button type="submit" className="bg-[#0687C9] hover:bg-[#0670a8]">
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing Faculty */}
      <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
        setShowEditDialog(isOpen);
        if (!isOpen) editForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Fakultas</DialogTitle>
            <DialogDescription>
              Edit informasi fakultas yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentFaculty && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Kode</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Contoh: FTI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nama</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Nama fakultas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="dean"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Dekan</FormLabel>
                      <div className="col-span-3 relative">
                        <FormControl>
                          <Input 
                            placeholder="Nama dekan" 
                            {...field} 
                            value={field.value || ""} 
                            onChange={(e) => {
                              field.onChange(e);
                              searchLecturers(e.target.value);
                            }}
                          />
                        </FormControl>
                        {showLecturerResults && (
                          <div className="absolute z-50 mt-1 w-full border rounded-md bg-white shadow-lg max-h-60 overflow-auto">
                            {isSearchingLecturers ? (
                              <div className="px-4 py-2 text-sm text-gray-500">Mencari...</div>
                            ) : lecturers && lecturers.length > 0 ? (
                              <ul className="py-1">
                                {lecturers.map(lecturer => (
                                  <li 
                                    key={lecturer.id}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                    onClick={() => {
                                      field.onChange(lecturer.full_name);
                                      setShowLecturerResults(false);
                                    }}
                                  >
                                    <div className="font-medium">{lecturer.full_name}</div>
                                    <div className="text-xs text-gray-500">
                                      {lecturer.nip && `NIP: ${lecturer.nip}`}
                                      {!lecturer.nip && lecturer.nidn && ` NIDN: ${lecturer.nidn}`}
                                      {lecturer.program && ` - ${lecturer.program}`}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : searchLecturerQuery.length >= 2 ? (
                              <div className="px-4 py-2 text-sm text-gray-500">Tidak ada dosen yang ditemukan</div>
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">Ketik minimal 2 karakter untuk mencari</div>
                            )}
                          </div>
                        )}
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="establishment_year"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tahun Pendirian</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 1990" 
                            min="1900"
                            max={new Date().getFullYear()}
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="lecturer_count"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Jumlah Dosen</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Jumlah dosen" 
                            min="0"
                            {...field}
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || value === null) {
                                field.onChange(undefined);
                              } else {
                                field.onChange(parseInt(value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowEditDialog(false);
                    editForm.reset();
                  }}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-[#0687C9] hover:bg-[#0670a8]">
                    Perbarui
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFaculty}
        title="Hapus Fakultas"
        description="Apakah Anda yakin ingin menghapus fakultas"
        itemName={facultyToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  School, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  Building,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { studyProgramFormSchema, StudyProgramFormValues } from "@/lib/validators/study-program";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { API_URL } from "@/utils/env";

// Type for Faculty
interface Faculty {
  id: number;
  uuid: string;
  code: string;
  name: string;
}

// Type for Lecturer
interface Lecturer {
  id: number;
  uuid: string;
  full_name: string;
  nip?: string;
  nidn?: string;
  program?: string;
}

// Type for StudyProgram
interface StudyProgram {
  id: number;
  code: string;
  name: string;
  faculty_id: number;
  faculty: Faculty;
  degree: string;
  accreditation: string;
  head_of_department: string;
  lecturer_count?: number;
  student_count?: number;
  establishment_year?: number;
}

// Type for StudyProgram with stats
interface StudyProgramWithStats {
  study_program: StudyProgram;
  lecturer_count: number;
  student_count: number;
}

export default function DepartmentsPage() {
  const [studyPrograms, setStudyPrograms] = useState<StudyProgramWithStats[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchLecturerQuery, setSearchLecturerQuery] = useState("");
  const [isSearchingLecturers, setIsSearchingLecturers] = useState(false);
  const [showLecturerResults, setShowLecturerResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<StudyProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFacultiesLoading, setIsFacultiesLoading] = useState(true);
  
  type FormValues = {
    code: string;
    name: string;
    faculty_id: string;
    degree: "D3" | "D4" | "S1";
    accreditation: "Unggul" | "Baik Sekali" | "Baik" | "Tidak Terakreditasi";
    head_of_department: string;
    establishment_year?: number;
    lecturer_count?: number;
    student_count?: number;
  };

  // Form for adding a new study program
  const addForm = useForm<FormValues>({
    resolver: zodResolver(studyProgramFormSchema) as any,
    defaultValues: {
    code: "",
    name: "",
      faculty_id: "",  // Use string initially since Select returns string
    degree: "D3",
    accreditation: "Unggul",
    head_of_department: "",
      establishment_year: undefined,
      lecturer_count: undefined,
      student_count: undefined
    }
  });

  // Form for editing a study program
  const editForm = useForm<FormValues>({
    resolver: zodResolver(studyProgramFormSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      faculty_id: "",  // Use string initially since Select returns string
      degree: "D3",
      accreditation: "Unggul",
      head_of_department: "",
      establishment_year: undefined,
      lecturer_count: undefined,
      student_count: undefined
    }
  });
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<{id: number, name: string} | null>(null);
  
  // Load study programs and faculties on initial render
  useEffect(() => {
    fetchStudyPrograms();
    fetchFaculties();
    fetchLecturers("");
  }, []);
  
  // Fetch all study programs from the API
  const fetchStudyPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/study-programs?stats=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setStudyPrograms(response.data.data);
      } else {
        toast.error("Gagal memuat data program studi");
      }
    } catch (error) {
      console.error("Error fetching study programs:", error);
      toast.error("Gagal memuat data program studi");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch all faculties for dropdown
  const fetchFaculties = async () => {
    setIsFacultiesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/faculties`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setFaculties(response.data.data.map((item: any) => item.faculty || item));
        
        // Check if faculties are available and show notification if empty
        if (response.data.data.length === 0) {
          toast.warning("Tidak ada fakultas tersedia", {
            description: "Silakan tambahkan fakultas terlebih dahulu sebelum membuat program studi"
          });
        }
      } else {
        toast.error("Gagal memuat data fakultas");
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      toast.error("Gagal memuat data fakultas");
    } finally {
      setIsFacultiesLoading(false);
    }
  };

  // Fetch lecturers
  const fetchLecturers = async (searchQuery: string) => {
    setIsSearchingLecturers(true);
    try {
      // Don't send request if search query is too short
      if (searchQuery.length < 2) {
        setLecturers([]);
        setIsSearchingLecturers(false);
        return;
      }
      
      // Use the new 'query' parameter name to match the updated backend API
      const response = await axios.get(`${API_URL}/api/admin/lecturers/search?query=${encodeURIComponent(searchQuery)}`, {
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

  // Filtered lecturers based on search
  const filteredLecturers = lecturers.filter(lecturer => 
    lecturer.full_name.toLowerCase().includes(searchLecturerQuery.toLowerCase()) ||
    (lecturer.nidn && lecturer.nidn.includes(searchLecturerQuery))
  ).slice(0, 5); // Limit to 5 results for performance

  // Select lecturer as head of department
  const selectLecturer = (lecturer: Lecturer) => {
    console.log("Selected lecturer:", lecturer);
    // If the add dialog is open, update the add form
    if (showAddDialog) {
      addForm.setValue("head_of_department", lecturer.full_name);
    } 
    // If the edit dialog is open, update the edit form
    else if (showEditDialog) {
      editForm.setValue("head_of_department", lecturer.full_name);
    }
    setShowLecturerResults(false);
    setSearchLecturerQuery("");
  };

  // Filter study programs based on search query and faculty filter
  const filteredPrograms = studyPrograms.filter(program => {
    const matchesSearch = 
      program.study_program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.study_program.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.study_program.faculty && program.study_program.faculty.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFaculty = !facultyFilter || facultyFilter === 'all' || 
      program.study_program.faculty.id.toString() === facultyFilter;
    
    return matchesSearch && matchesFaculty;
  });

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
    if (message.includes("cannot delete") || message.includes("has associated records") || message.includes("memiliki data terkait")) {
      return "Tidak dapat menghapus program studi yang masih memiliki data terkait. Harap hapus semua data terkait terlebih dahulu.";
    }
    
    // Return original message if no translation found
    return message;
  };

  // Handle edit study program dialog
  const handleEditStudyProgram = (program: StudyProgram) => {
    setCurrentProgram(program);
    
    // Reset form with current program data
    editForm.reset({
      code: program.code,
      name: program.name,
      faculty_id: program.faculty_id.toString(),
      degree: program.degree as any,
      accreditation: program.accreditation as any,
      head_of_department: program.head_of_department,
      establishment_year: program.establishment_year,
      lecturer_count: program.lecturer_count,
      student_count: program.student_count
    } as any);
    
    setShowEditDialog(true);
  };

  // Function to handle delete confirmation
  const confirmDeleteStudyProgram = (program: StudyProgramWithStats) => {
    setProgramToDelete({ id: program.study_program.id, name: program.study_program.name });
    setShowDeleteModal(true);
  };

  // Handle delete study program
  const handleDeleteStudyProgram = async () => {
    if (!programToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/study-programs/${programToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Program studi berhasil dihapus");
        fetchStudyPrograms();
        setShowDeleteModal(false);
        setProgramToDelete(null);
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menghapus program studi");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error deleting study program:", error);
      
      // Handle different error status codes
      if (error.response) {
        if (error.response.status === 409) {
          toast.error(formatErrorMessage(error.response.data.error) || "Tidak dapat menghapus program studi yang memiliki data terkait");
        } else if (error.response.status === 404) {
          toast.error("Program studi tidak ditemukan");
        } else {
          toast.error(formatErrorMessage(error.response.data.error) || "Gagal menghapus program studi");
        }
      } else {
        toast.error("Gagal menghapus program studi: Koneksi terputus");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submission for adding a new study program
  const onAddSubmit = async (data: any) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/admin/study-programs`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Program studi berhasil ditambahkan");
        fetchStudyPrograms();
        setShowAddDialog(false);
        addForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menyimpan program studi");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error saving study program:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menyimpan program studi");
      toast.error(errorMsg);
    }
  };

  // Handle form submission for editing a study program
  const onEditSubmit = async (data: any) => {
    if (!currentProgram) return;
    
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/study-programs/${currentProgram.id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Program studi berhasil diperbarui");
        fetchStudyPrograms();
        setShowEditDialog(false);
        setCurrentProgram(null);
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal memperbarui program studi");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error updating study program:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal memperbarui program studi");
      toast.error(errorMsg);
    }
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
                Kelola daftar program studi di Institut Teknologi Del
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
            <div className="w-full md:w-48">
              <Select 
                onValueChange={(value) => setFacultyFilter(value)}
                value={facultyFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter berdasarkan fakultas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Fakultas</SelectItem>
                  {!isFacultiesLoading && faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id.toString()}>
                      {faculty.name}
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
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[80px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Program Studi</TableHead>
                  <TableHead className="font-bold text-black">Fakultas</TableHead>
                  <TableHead className="font-bold text-black">Jenjang</TableHead>
                  <TableHead className="font-bold text-black">Akreditasi</TableHead>
                  <TableHead className="font-bold text-black">Ketua Program Studi</TableHead>
                  <TableHead className="text-center font-bold text-black">Jumlah Dosen</TableHead>
                  <TableHead className="text-center font-bold text-black">Jumlah Mahasiswa</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPrograms.length > 0 ? (
                  filteredPrograms.map((program, index) => (
                    <TableRow key={program.study_program.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{program.study_program.code}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {program.study_program.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {program.study_program.faculty?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{program.study_program.degree}</TableCell>
                      <TableCell>
                        <Badge className={`
                          ${program.study_program.accreditation === 'Unggul' ? 'bg-green-100 text-green-800' : 
                            program.study_program.accreditation === 'Baik Sekali' ? 'bg-blue-100 text-blue-800' :
                            program.study_program.accreditation === 'Baik' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {program.study_program.accreditation}
                        </Badge>
                      </TableCell>
                      <TableCell>{program.study_program.head_of_department}</TableCell>
                      <TableCell className="text-center">{program.lecturer_count}</TableCell>
                      <TableCell className="text-center">{program.student_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditStudyProgram(program.study_program)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteStudyProgram(program)}
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
                      Tidak ada program studi yang sesuai dengan pencarian
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Study Program */}
      <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
        setShowAddDialog(isOpen);
        if (!isOpen) addForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Program Studi Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail program studi baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-3 py-2">
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Kode</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Contoh: IF" {...field} />
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
                        <Input placeholder="Nama program studi" {...field} />
                      </FormControl>
                      <FormMessage />
            </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="faculty_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Fakultas</FormLabel>
              <div className="col-span-3">
                      <FormControl>
                <Select 
                          value={field.value.toString()}
                          onValueChange={field.onChange}
                >
                          <SelectTrigger>
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                            {isFacultiesLoading ? (
                              <SelectItem value="loading" disabled>
                                Memuat data fakultas...
                              </SelectItem>
                            ) : (
                              faculties.map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.name}
                      </SelectItem>
                              ))
                            )}
                  </SelectContent>
                </Select>
                      </FormControl>
                      <FormMessage />
              </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="degree"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Jenjang</FormLabel>
              <div className="col-span-3">
                      <FormControl>
                <Select 
                          value={field.value}
                          onValueChange={field.onChange}
                >
                          <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="D4">D4</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                  </SelectContent>
                </Select>
                      </FormControl>
                      <FormMessage />
              </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="accreditation"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Akreditasi</FormLabel>
              <div className="col-span-3">
                      <FormControl>
                <Select 
                          value={field.value}
                          onValueChange={field.onChange}
                >
                          <SelectTrigger>
                    <SelectValue placeholder="Pilih akreditasi" />
                  </SelectTrigger>
                  <SelectContent>
                            <SelectItem value="Unggul">Unggul</SelectItem>
                    <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                    <SelectItem value="Baik">Baik</SelectItem>
                    <SelectItem value="Tidak Terakreditasi">Tidak Terakreditasi</SelectItem>
                  </SelectContent>
                </Select>
                      </FormControl>
                      <FormMessage />
              </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                  name="head_of_department"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right text-nowrap">Ketua Prodi</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Nama ketua program studi" 
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              searchLecturers(e.target.value);
                            }}
                            onFocus={() => setShowLecturerResults(searchLecturerQuery.length > 0)}
                            onBlur={() => {
                              // Delayed hide to allow for click on results
                              setTimeout(() => setShowLecturerResults(false), 150);
                            }}
                />
                {showLecturerResults && (
                            <div className="absolute top-full left-0 z-50 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-lg max-h-60 overflow-auto">
                              {isSearchingLecturers ? (
                                <div className="p-2 text-sm text-gray-500 flex items-center">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Mencari dosen...
                                </div>
                              ) : (
                                filteredLecturers.length > 0 ? (
                                  filteredLecturers.map(lecturer => (
                                    <div
                            key={lecturer.id}
                                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                                      onMouseDown={() => {
                                        selectLecturer(lecturer);
                                        field.onChange(lecturer.full_name);
                                      }}
                          >
                            <div className="font-medium">{lecturer.full_name}</div>
                            <div className="text-xs text-gray-500">
                                        {lecturer.nidn ? `NIDN: ${lecturer.nidn}` : ''}
                                        {lecturer.nip ? (lecturer.nidn ? ' | ' : '') + `NIP: ${lecturer.nip}` : ''}
                            </div>
                                    </div>
                                  ))
                                ) : searchLecturerQuery.length >= 2 ? (
                                  <div className="p-2 text-sm text-gray-500">
                                    Tidak ada dosen yang sesuai
                                  </div>
                                ) : (
                                  <div className="p-2 text-sm text-gray-500">
                                    Ketikkan minimal 2 karakter untuk mencari
                  </div>
                                )
                              )}
                  </div>
                )}
              </div>
                      </FormControl>
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
                    <FormLabel className="text-right text-nowrap">Tahun Pendirian</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
              <Input
                          type="number" 
                          placeholder="Contoh: 2005" 
                          min="1900"
                          max={new Date().getFullYear()}
                          {...field}
                          value={field.value === undefined ? "" : field.value}
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
                    <FormLabel className="text-right text-nowrap">Jumlah Dosen</FormLabel>
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
              
              <FormField
                control={addForm.control}
                name="student_count"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right text-nowrap">Jumlah Mahasiswa</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                type="number"
                          placeholder="Jumlah mahasiswa" 
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

      {/* Dialog for editing Study Program */}
      <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
        setShowEditDialog(isOpen);
        if (!isOpen) editForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Program Studi</DialogTitle>
            <DialogDescription>
              Edit informasi program studi yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentProgram && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3 py-2">
                <FormField
                  control={editForm.control}
                name="code"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Kode</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Contoh: IF" {...field} />
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
                          <Input placeholder="Nama program studi" {...field} />
                        </FormControl>
                        <FormMessage />
            </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="faculty_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Fakultas</FormLabel>
              <div className="col-span-3">
                        <FormControl>
                <Select 
                            value={field.value.toString()}
                            onValueChange={field.onChange}
                >
                            <SelectTrigger>
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>
                  <SelectContent>
                              {isFacultiesLoading ? (
                                <SelectItem value="loading" disabled>
                                  Memuat data fakultas...
                                </SelectItem>
                              ) : (
                                faculties.map(faculty => (
                      <SelectItem key={faculty.id} value={faculty.id.toString()}>
                        {faculty.name}
                      </SelectItem>
                                ))
                              )}
                  </SelectContent>
                </Select>
                        </FormControl>
                        <FormMessage />
              </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Jenjang</FormLabel>
              <div className="col-span-3">
                        <FormControl>
                <Select 
                            value={field.value}
                            onValueChange={field.onChange}
                >
                            <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D3">D3</SelectItem>
                    <SelectItem value="D4">D4</SelectItem>
                    <SelectItem value="S1">S1</SelectItem>
                  </SelectContent>
                </Select>
                        </FormControl>
                        <FormMessage />
              </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="accreditation"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Akreditasi</FormLabel>
              <div className="col-span-3">
                        <FormControl>
                <Select 
                            value={field.value}
                            onValueChange={field.onChange}
                >
                            <SelectTrigger>
                    <SelectValue placeholder="Pilih akreditasi" />
                  </SelectTrigger>
                  <SelectContent>
                              <SelectItem value="Unggul">Unggul</SelectItem>
                    <SelectItem value="Baik Sekali">Baik Sekali</SelectItem>
                    <SelectItem value="Baik">Baik</SelectItem>
                    <SelectItem value="Tidak Terakreditasi">Tidak Terakreditasi</SelectItem>
                  </SelectContent>
                </Select>
                        </FormControl>
                        <FormMessage />
              </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="head_of_department"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right text-nowrap">Ketua Prodi</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <div className="relative">
                <Input
                              placeholder="Nama ketua program studi" 
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                searchLecturers(e.target.value);
                              }}
                              onFocus={() => setShowLecturerResults(searchLecturerQuery.length > 0)}
                              onBlur={() => {
                                // Delayed hide to allow for click on results
                                setTimeout(() => setShowLecturerResults(false), 150);
                              }}
                />
                {showLecturerResults && (
                              <div className="absolute top-full left-0 z-50 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-lg max-h-60 overflow-auto">
                                {isSearchingLecturers ? (
                                  <div className="p-2 text-sm text-gray-500 flex items-center">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Mencari dosen...
                                  </div>
                                ) : (
                                  filteredLecturers.length > 0 ? (
                                    filteredLecturers.map(lecturer => (
                                      <div
                            key={lecturer.id}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                                        onMouseDown={() => {
                                          selectLecturer(lecturer);
                                          field.onChange(lecturer.full_name);
                                        }}
                          >
                            <div className="font-medium">{lecturer.full_name}</div>
                            <div className="text-xs text-gray-500">
                                          {lecturer.nidn ? `NIDN: ${lecturer.nidn}` : ''}
                                          {lecturer.nip ? (lecturer.nidn ? ' | ' : '') + `NIP: ${lecturer.nip}` : ''}
                            </div>
                                      </div>
                                    ))
                                  ) : searchLecturerQuery.length >= 2 ? (
                                    <div className="p-2 text-sm text-gray-500">
                                      Tidak ada dosen yang sesuai
                                    </div>
                                  ) : (
                                    <div className="p-2 text-sm text-gray-500">
                                      Ketikkan minimal 2 karakter untuk mencari
                  </div>
                                  )
                                )}
                  </div>
                )}
              </div>
                        </FormControl>
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
                      <FormLabel className="text-right text-nowrap">Tahun Pendirian</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
              <Input
                            type="number" 
                            placeholder="Contoh: 2005" 
                            min="1900"
                            max={new Date().getFullYear()}
                            {...field}
                            value={field.value === undefined ? "" : field.value}
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
                      <FormLabel className="text-right text-nowrap">Jumlah Dosen</FormLabel>
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
                
                <FormField
                  control={editForm.control}
                name="student_count"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right text-nowrap">Jumlah Mahasiswa</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                type="number"
                            placeholder="Jumlah mahasiswa" 
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
                    Simpan
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
        onConfirm={handleDeleteStudyProgram}
        title="Hapus Program Studi"
        description="Apakah Anda yakin ingin menghapus program studi"
        itemName={programToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
} 
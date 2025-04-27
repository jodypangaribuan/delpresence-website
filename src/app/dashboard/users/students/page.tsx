"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  RefreshCw, 
  Loader2,
  ArrowUpDown,
  Mail,
  Search,
  School,
  Building
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type untuk data mahasiswa
interface Student {
  id: number;
  dim_id: number;
  user_id: number;
  user_name: string;
  nim: string;
  full_name: string;
  email: string;
  study_program_id: number;
  study_program: string;
  faculty: string;
  year_enrolled: number;
  status: string;
  dormitory: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [studyPrograms, setStudyPrograms] = useState<string[]>([]);
  const [enrollmentYears, setEnrollmentYears] = useState<number[]>([]);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch student data from API
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Make the API request
      const response = await fetch(`${apiUrl}/api/admin/students`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        
        // Clone the response before attempting to read it as JSON
        const clonedResponse = response.clone();
        
        try {
          // Try to parse as JSON first
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, try to get the response as text
          try {
            const errorText = await clonedResponse.text();
            console.error(`API error (${response.status}): ${errorText.substring(0, 200)}...`);
          } catch (textError) {
            console.error(`Could not read error response: ${textError}`);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setStudents(data.data);
        
        // Extract unique study programs and years for filters
        const programs = [...new Set(data.data.map((s: Student) => s.study_program))];
        const years = [...new Set(data.data.map((s: Student) => s.year_enrolled))];
        
        // Sort years in descending order
        const sortedYears = [...years].sort((a, b) => {
          return Number(b) - Number(a);
        });
        
        setStudyPrograms(programs as string[]);
        setEnrollmentYears(sortedYears as number[]);
      } else {
        console.error("API returned error status:", data);
        toast.error(`Gagal memuat data mahasiswa: ${data.message || 'Kesalahan tidak diketahui'}`);
      }
    } catch (err: any) {
      console.error("Error fetching students:", err);
      
      // Check for timeout or network errors
      if (err.message && (
          err.message.includes("timeout") || 
          err.message.includes("network") || 
          err.message.includes("exceeded") ||
          err.message.includes("fetch")
        )) {
        toast.error("Koneksi Timeout", {
          description: "Gagal terhubung ke server. Coba muat ulang halaman ini.",
        });
      } else {
        toast.error("Gagal memuat data mahasiswa", {
          description: err.message || "Terjadi kesalahan saat memuat data mahasiswa"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sync students with campus API
  const syncStudents = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast.info("Memulai sinkronisasi data mahasiswa...");
    
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Make the API request with a longer timeout warning
      const timeoutWarning = setTimeout(() => {
        toast.info("Sinkronisasi masih berlangsung...", {
          description: "Proses ini mungkin membutuhkan waktu hingga 2 menit. Harap tunggu.",
          duration: 10000
        });
      }, 15000); // Show a message if it takes more than 15 seconds
      
      // Make the API request
      const response = await fetch(`${apiUrl}/api/admin/students/sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      
      // Clear the timeout warning
      clearTimeout(timeoutWarning);
      
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`;
        
        // Clone the response before attempting to read it as JSON
        const clonedResponse = response.clone();
        
        try {
          // Try to parse as JSON first
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, try to get the response as text
          try {
            const errorText = await clonedResponse.text();
            console.error(`API error (${response.status}): ${errorText.substring(0, 200)}...`);
          } catch (textError) {
            console.error(`Could not read error response: ${textError}`);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success("Sinkronisasi Berhasil", {
          description: `${data.data.count || 0} data mahasiswa telah berhasil disinkronkan dengan sistem akademik kampus.`
        });
        fetchStudents(); // Refresh the student list
      } else {
        console.error("API returned error status:", data);
        toast.error(`Gagal sinkronisasi: ${data.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Error syncing students:", err);
      
      // Check for timeout or network errors
      if (err.message && (
          err.message.includes("timeout") || 
          err.message.includes("network") || 
          err.message.includes("exceeded") ||
          err.message.includes("fetch")
        )) {
        toast.error("Koneksi Timeout", {
          description: "Server akademik tidak merespon dalam waktu yang ditentukan. Coba lagi nanti.",
        });
      } else {
        toast.error("Gagal sinkronisasi", {
          description: err.message || "Terjadi kesalahan saat sinkronisasi data mahasiswa"
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter students based on search query and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search query filter
      const matchesSearch = searchQuery === "" || 
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Program filter
      const matchesProgram = programFilter === null || student.study_program === programFilter;
      
      // Year filter
      const matchesYear = yearFilter === null || student.year_enrolled.toString() === yearFilter;
      
      return matchesSearch && matchesProgram && matchesYear;
    });
  }, [students, searchQuery, programFilter, yearFilter]);

  // Define columns for the data table
  const columns = useMemo<ColumnDef<Student>[]>(() => [
    {
      accessorKey: "id",
      header: "No",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Mahasiswa
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("full_name") || "-"}</div>
      ),
    },
    {
      accessorKey: "nim",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NIM
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("nim") || "-",
    },
    {
      accessorKey: "study_program",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Program Studi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
          {row.getValue("study_program") || "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "faculty",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fakultas
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => (
        <div>
          {row.getValue("faculty") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "year_enrolled",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Angkatan
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("year_enrolled") || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return status === "Aktif" ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300">
            Aktif
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-300">
            {status || "-"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <a 
            href={`mailto:${email}`} 
            className="text-blue-600 hover:underline flex items-center"
          >
            <Mail className="h-4 w-4 mr-1" />
            {email}
          </a>
        ) : "-";
      },
    },
  ], []);

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <GraduationCap className="mr-2 h-6 w-6 text-[#0687C9]" /> 
                Daftar Mahasiswa
              </CardTitle>
              <CardDescription className="mt-1">
                Daftar mahasiswa Institut Teknologi Del yang tersinkronisasi dengan sistem akademik kampus.
              </CardDescription>
            </div>
            
            <Button 
              onClick={syncStudents} 
              disabled={isSyncing}
              variant="default"
              className="bg-[#0687C9] hover:bg-[#0078B5]"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sinkronisasi...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sinkronisasi Data Mahasiswa
                </>
              )}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Memuat data mahasiswa...</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Total count display */}
              <div className="flex justify-end mb-2">
                <div className="text-sm font-medium text-gray-800">
                  Total: <span>{filteredStudents.length}</span> mahasiswa
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
                {/* Search */}
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Cari nama mahasiswa..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Program study filter */}
                  <Select
                    value={programFilter || "all"}
                    onValueChange={(value: string) => setProgramFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Program Studi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Program Studi</SelectLabel>
                        <SelectItem value="all">Semua Program Studi</SelectItem>
                        {studyPrograms.map((program) => (
                          <SelectItem key={program} value={program}>
                            {program}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* Year filter */}
                  <Select
                    value={yearFilter || "all"}
                    onValueChange={(value: string) => setYearFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Angkatan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Angkatan</SelectLabel>
                        <SelectItem value="all">Semua Angkatan</SelectItem>
                        {enrollmentYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                columns={columns}
                data={filteredStudents}
                pageSize={10}
                dataType="mahasiswa"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
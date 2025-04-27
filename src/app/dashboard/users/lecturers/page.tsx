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
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

// Type untuk data dosen
interface Lecturer {
  id: number;
  full_name: string;
  nip: string;
  study_program: string;
  academic_rank_desc: string;
  email: string;
  nidn: string;
}

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [filteredLecturers, setFilteredLecturers] = useState<Lecturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("");
  
  // Fungsi untuk memuat data dosen
  const fetchLecturers = async () => {
    setIsLoading(true);
    
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Panggil API untuk mendapatkan daftar dosen
      const response = await fetch(`${apiUrl}/api/admin/lecturers`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memuat data dosen");
      }
      
      const data = await response.json();
      setLecturers(data.data || []);
    } catch (err: any) {
      toast.error("Kesalahan", {
        description: err.message || "Terjadi kesalahan saat memuat data dosen",
      });
      console.error("Error fetching lecturers:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk sinkronisasi data dosen dari API kampus
  const syncLecturers = async () => {
    setIsSyncing(true);
    
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Panggil API untuk sinkronisasi dosen
      const response = await fetch(`${apiUrl}/api/admin/lecturers/sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal sinkronisasi data dosen");
      }
      
      const result = await response.json();
      toast.success("Sinkronisasi Berhasil", {
        description: `${result.count || 0} data dosen telah berhasil disinkronkan dengan sistem akademik kampus.`,
      });
      
      // Reload data dosen setelah sinkronisasi
      await fetchLecturers();
    } catch (err: any) {
      toast.error("Kesalahan", {
        description: err.message || "Terjadi kesalahan saat sinkronisasi data dosen",
      });
      console.error("Error syncing lecturers:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Dapatkan unique study programs untuk filter
  const studyPrograms = useMemo(() => {
    const programs = new Set<string>();
    lecturers.forEach(lecturer => {
      if (lecturer.study_program) {
        programs.add(lecturer.study_program);
      }
    });
    return Array.from(programs).sort();
  }, [lecturers]);

  // Filter the lecturers based on search query and program filter
  useEffect(() => {
    let result = [...lecturers];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lecturer => 
        (lecturer.full_name && lecturer.full_name.toLowerCase().includes(query)) ||
        (lecturer.nip && lecturer.nip.toLowerCase().includes(query)) ||
        (lecturer.nidn && lecturer.nidn.toLowerCase().includes(query))
      );
    }
    
    // Filter by program
    if (programFilter) {
      result = result.filter(lecturer => 
        lecturer.study_program === programFilter
      );
    }
    
    setFilteredLecturers(result);
  }, [lecturers, searchQuery, programFilter]);

  // Columns definition for DataTable
  const columns: ColumnDef<Lecturer>[] = useMemo(() => [
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
            Nama Dosen
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("full_name") || "-"}</div>
      ),
    },
    {
      accessorKey: "nip",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NIP
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("nip") || "-",
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
        <Badge variant="outline" className="bg-[#E6F2FF] text-[#0687C9] hover:bg-[#E6F2FF] border-[#A6D2F2]">
          {row.getValue("study_program") || "-"}
        </Badge>
      ),
    },
    {
      accessorKey: "academic_rank_desc",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Jabatan Akademik
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("academic_rank_desc") || "-",
    },
    {
      accessorKey: "nidn",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NIDN
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("nidn") || "-",
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

  // Memuat data dosen saat halaman dimuat
  useEffect(() => {
    fetchLecturers();
  }, []);

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <GraduationCap className="mr-2 h-6 w-6 text-[#0687C9]" /> 
                Daftar Dosen
              </CardTitle>
              <CardDescription className="mt-1">
                Daftar dosen Institut Teknologi Del yang tersinkronisasi dengan sistem akademik kampus.
              </CardDescription>
            </div>
            
            <Button 
              onClick={syncLecturers} 
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
                  Sinkronisasi Data Dosen
                </>
              )}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Memuat data dosen...</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Total count display */}
              <div className="flex justify-end mb-2">
                <div className="text-sm font-medium text-gray-800">
                  Total: <span>{filteredLecturers.length}</span> dosen
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
                {/* Search */}
                <div className="relative w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Cari nama dosen..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Study program filter */}
                <div className="flex items-center gap-2">
                  <select
                    className="h-10 rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0687C9] focus-visible:ring-offset-2"
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                  >
                    <option value="">Semua Program Studi</option>
                    {studyPrograms.map(program => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                  
                  {(searchQuery || programFilter) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchQuery("");
                        setProgramFilter("");
                      }}
                      className="h-8 px-2 text-[#0687C9]"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
              
              <DataTable 
                columns={columns} 
                data={filteredLecturers}
                pageSize={10}
                dataType="dosen"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
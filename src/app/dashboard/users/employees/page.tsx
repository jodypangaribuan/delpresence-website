"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  RefreshCw,
  Loader2,
  Search,
  Mail,
  ArrowUpDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

// Interface untuk data pegawai
interface Employee {
  id: number;
  uuid: string;
  employee_id: number;
  user_id: number;
  nip: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  employment_type: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fungsi untuk memuat data pegawai
  const fetchEmployees = async () => {
    setIsLoading(true);
    
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Panggil API untuk mendapatkan daftar pegawai
      const response = await fetch(`${apiUrl}/api/admin/employees`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memuat data pegawai");
      }
      
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err: any) {
      toast.error("Kesalahan", {
        description: err.message || "Terjadi kesalahan saat memuat data pegawai",
      });
      console.error("Error fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk sinkronisasi data pegawai dari API kampus
  const syncEmployees = async () => {
    setIsSyncing(true);
    
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }
      
      // API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Panggil API untuk sinkronisasi pegawai
      const response = await fetch(`${apiUrl}/api/admin/employees/sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      // Clone the response so we can use it twice if needed
      const responseClone = response.clone();
      
      if (!response.ok) {
        let errorMessage = "Gagal sinkronisasi data pegawai";
        try {
          const errorData = await responseClone.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse JSON, just use the default message
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      toast.success("Sinkronisasi Berhasil", {
        description: `${result.data?.count || result.count || 0} data pegawai telah berhasil disinkronkan dengan sistem kepegawaian kampus.`,
      });
      
      // Reload data pegawai setelah sinkronisasi
      await fetchEmployees();
    } catch (err: any) {
      if (err.message && err.message.includes("timeout")) {
        toast.error("Koneksi Timeout", {
          description: "Koneksi ke API kampus timeout. Silakan coba lagi nanti atau periksa koneksi internet Anda.",
        });
      } else if (err.message && err.message.includes("API service unavailable")) {
        toast.error("Layanan API Tidak Tersedia", {
          description: "Layanan API kampus sedang tidak tersedia. Silakan coba lagi nanti.",
        });
      } else {
        toast.error("Kesalahan", {
          description: err.message || "Terjadi kesalahan saat sinkronisasi data pegawai",
        });
      }
      console.error("Error syncing employees:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Memuat data pegawai saat halaman dimuat
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on search query
  useEffect(() => {
    let result = [...employees];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(employee => 
        (employee.full_name && employee.full_name.toLowerCase().includes(query)) ||
        (employee.nip && employee.nip.toLowerCase().includes(query)) ||
        (employee.email && employee.email.toLowerCase().includes(query)) ||
        (employee.position && employee.position.toLowerCase().includes(query))
      );
    }
    
    setFilteredEmployees(result);
  }, [employees, searchQuery]);

  // Columns definition for DataTable
  const columns: ColumnDef<Employee>[] = useMemo(() => [
    {
      accessorKey: "id",
      header: "No",
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
      enableHiding: false,
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
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("nip") || "-"}</div>
      ),
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Pegawai
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("full_name") || "-",
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
    {
      accessorKey: "position",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Posisi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        )
      },
      cell: ({ row }) => row.getValue("position") || "-",
    }
  ], []);

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Users className="mr-2 h-6 w-6 text-[#0687C9]" />
                Daftar Pegawai
              </CardTitle>
              <CardDescription className="mt-1">
                Daftar pegawai Institut Teknologi Del yang tersinkronisasi dengan sistem kepegawaian kampus.
              </CardDescription>
            </div>
            
            <Button
              onClick={syncEmployees}
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
                  Sinkronisasi Data Pegawai
                </>
              )}
            </Button>
          </div>
          
          {/* Total count display */}
          <div className="flex justify-end mb-2">
            <div className="text-sm font-medium text-gray-800">
              Total: <span>{filteredEmployees.length}</span> pegawai
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pegawai..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                }}
                className="h-8 px-2 text-[#0687C9]"
              >
                Reset
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Memuat data pegawai...</p>
              </div>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredEmployees}
              pageSize={10}
              dataType="pegawai"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
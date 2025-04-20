"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
import { PlusCircleIcon, SearchIcon, CalendarDays, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AcademicYearsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Mock data for academic years
  const academicYears = [
    { id: 1, name: "2023/2024", isActive: true },
    { id: 2, name: "2022/2023", isActive: false },
    { id: 3, name: "2021/2022", isActive: false },
    { id: 4, name: "2020/2021", isActive: false },
    { id: 5, name: "2019/2020", isActive: false },
  ];

  const filteredYears = academicYears.filter((year) => {
    const matchesSearch = year.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === null || 
      (statusFilter === "active" && year.isActive) || 
      (statusFilter === "inactive" && !year.isActive);
    
    return matchesSearch && matchesStatus;
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
                Kelola data tahun akademik di universitas
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Tambah Tahun Akademik
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Tahun Akademik Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan detail tahun akademik baru yang ingin ditambahkan.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="yearName" className="text-right">
                      Nama
                    </Label>
                    <Input
                      id="yearName"
                      placeholder="contoh: 2023/2024"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="isActive" className="text-right">
                      Status Aktif
                    </Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Switch id="isActive" />
                      <Label htmlFor="isActive">Tahun Akademik Aktif</Label>
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
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari tahun akademik..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select 
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value as any)}
                value={statusFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredYears.length > 0 ? (
                  filteredYears.map((year) => (
                    <TableRow key={year.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <CalendarDays className="mr-2 h-4 w-4 text-[#0687C9]" />
                          {year.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {year.isActive ? (
                          <Badge className="bg-green-100 text-green-800 flex w-fit items-center">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center">
                            <XCircle className="mr-1 h-3 w-3" />
                            Tidak Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Tidak ada data yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  MapPin,
  Home,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type untuk data Gedung
interface Building {
  id: number;
  code: string;
  name: string;
  floors: number;
  address: string;
  year_built: number;
  status: "active" | "maintenance" | "inactive";
  roomCount: number;
  type: "academic" | "administrative" | "laboratory" | "mixed";
}

// Dummy data Gedung
const dummyBuildings: Building[] = [
  {
    id: 1,
    code: "GD-A",
    name: "Gedung Rektorat",
    floors: 4,
    address: "Jl. Kampus Utama No. 1",
    year_built: 1995,
    status: "active",
    roomCount: 25,
    type: "administrative"
  },
  {
    id: 2,
    code: "GD-B",
    name: "Gedung Kuliah Bersama",
    floors: 6,
    address: "Jl. Kampus Utama No. 2",
    year_built: 2005,
    status: "active",
    roomCount: 45,
    type: "academic"
  },
  {
    id: 3,
    code: "GD-C",
    name: "Gedung Laboratorium Teknik",
    floors: 3,
    address: "Jl. Kampus Utama No. 3",
    year_built: 2010,
    status: "active",
    roomCount: 18,
    type: "laboratory"
  },
  {
    id: 4,
    code: "GD-D",
    name: "Gedung Fakultas Ilmu Komputer",
    floors: 5,
    address: "Jl. Kampus Utama No. 4",
    year_built: 2015,
    status: "active",
    roomCount: 32,
    type: "mixed"
  },
  {
    id: 5,
    code: "GD-E",
    name: "Gedung Fakultas Ekonomi",
    floors: 4,
    address: "Jl. Kampus Timur No. 1",
    year_built: 2012,
    status: "maintenance",
    roomCount: 28,
    type: "academic"
  },
];

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>(dummyBuildings);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);

  // Filter buildings based on search query and type filter
  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = 
      building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter 
      ? building.type === typeFilter
      : true;
    
    return matchesSearch && matchesType;
  });

  // Handle edit building dialog
  const handleEditBuilding = (building: Building) => {
    setCurrentBuilding(building);
    setShowEditDialog(true);
  };

  // Get status badge based on building status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Dalam Perbaikan</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Tidak Aktif</Badge>;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'academic':
        return "Akademik";
      case 'administrative':
        return "Administratif";
      case 'laboratory':
        return "Laboratorium";
      default:
        return "Campuran";
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Building className="mr-2 h-6 w-6 text-[#0687C9]" />
                Gedung
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar gedung di kampus
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Gedung
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari gedung berdasarkan nama, kode, atau alamat..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select 
                onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}
                value={typeFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Jenis Gedung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="academic">Akademik</SelectItem>
                  <SelectItem value="administrative">Administratif</SelectItem>
                  <SelectItem value="laboratory">Laboratorium</SelectItem>
                  <SelectItem value="mixed">Campuran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Nama Gedung</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-center">Lantai</TableHead>
                  <TableHead className="text-center">Jumlah Ruangan</TableHead>
                  <TableHead>Tahun Dibangun</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell className="font-medium">{building.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{building.name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {building.address}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeLabel(building.type)}</TableCell>
                      <TableCell className="text-center">{building.floors}</TableCell>
                      <TableCell className="text-center">{building.roomCount}</TableCell>
                      <TableCell>{building.year_built}</TableCell>
                      <TableCell>{getStatusBadge(building.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditBuilding(building)}
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
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      Tidak ada gedung yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Building */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Gedung Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail gedung baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: GD-F"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama gedung"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Jenis</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Akademik</SelectItem>
                    <SelectItem value="administrative">Administratif</SelectItem>
                    <SelectItem value="laboratory">Laboratorium</SelectItem>
                    <SelectItem value="mixed">Campuran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Alamat</label>
              <Input
                className="col-span-3"
                placeholder="Alamat gedung"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Jumlah Lantai</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Contoh: 4"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Tahun Dibangun</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Contoh: 2015"
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

      {/* Dialog for editing Building */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Gedung</DialogTitle>
            <DialogDescription>
              Edit informasi gedung yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentBuilding && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentBuilding.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentBuilding.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Jenis</label>
                <div className="col-span-3">
                  <Select defaultValue={currentBuilding.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Akademik</SelectItem>
                      <SelectItem value="administrative">Administratif</SelectItem>
                      <SelectItem value="laboratory">Laboratorium</SelectItem>
                      <SelectItem value="mixed">Campuran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Alamat</label>
                <Input
                  className="col-span-3"
                  value={currentBuilding.address}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Jumlah Lantai</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentBuilding.floors}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Tahun Dibangun</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentBuilding.year_built}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentBuilding.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="maintenance">Dalam Perbaikan</SelectItem>
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
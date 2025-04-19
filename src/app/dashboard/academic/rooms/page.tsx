"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DoorClosed, 
  Plus, 
  Pencil,
  Trash2,
  Search,
  Building,
  Users,
  LayoutGrid,
  Wifi,
  Monitor,
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
import { Checkbox } from "@/components/ui/checkbox";

// Type untuk data Ruangan
interface Room {
  id: number;
  code: string;
  name: string;
  building_id: number;
  building_name: string;
  floor: number;
  capacity: number;
  type: "classroom" | "laboratory" | "office" | "meeting" | "other";
  status: "available" | "maintenance" | "occupied";
  has_ac: boolean;
  has_projector: boolean;
  has_internet: boolean;
}

// Dummy data Gedung untuk dropdown
const buildings = [
  { id: 1, name: "Gedung Rektorat" },
  { id: 2, name: "Gedung Kuliah Bersama" },
  { id: 3, name: "Gedung Laboratorium Teknik" },
  { id: 4, name: "Gedung Fakultas Ilmu Komputer" },
  { id: 5, name: "Gedung Fakultas Ekonomi" },
];

// Dummy data Ruangan
const dummyRooms: Room[] = [
  {
    id: 1,
    code: "R101",
    name: "Ruang Kuliah 101",
    building_id: 2,
    building_name: "Gedung Kuliah Bersama",
    floor: 1,
    capacity: 40,
    type: "classroom",
    status: "available",
    has_ac: true,
    has_projector: true,
    has_internet: true
  },
  {
    id: 2,
    code: "R102",
    name: "Ruang Kuliah 102",
    building_id: 2,
    building_name: "Gedung Kuliah Bersama",
    floor: 1,
    capacity: 30,
    type: "classroom",
    status: "available",
    has_ac: true,
    has_projector: true,
    has_internet: true
  },
  {
    id: 3,
    code: "LAB01",
    name: "Laboratorium Komputer 1",
    building_id: 4,
    building_name: "Gedung Fakultas Ilmu Komputer",
    floor: 2,
    capacity: 25,
    type: "laboratory",
    status: "maintenance",
    has_ac: true,
    has_projector: true,
    has_internet: true
  },
  {
    id: 4,
    code: "MTG01",
    name: "Ruang Rapat Utama",
    building_id: 1,
    building_name: "Gedung Rektorat",
    floor: 3,
    capacity: 15,
    type: "meeting",
    status: "occupied",
    has_ac: true,
    has_projector: true,
    has_internet: true
  },
  {
    id: 5,
    code: "OFF01",
    name: "Ruang Dosen FEB",
    building_id: 5,
    building_name: "Gedung Fakultas Ekonomi",
    floor: 2,
    capacity: 10,
    type: "office",
    status: "available",
    has_ac: true,
    has_projector: false,
    has_internet: true
  },
  {
    id: 6,
    code: "LAB02",
    name: "Laboratorium Elektro",
    building_id: 3,
    building_name: "Gedung Laboratorium Teknik",
    floor: 1,
    capacity: 20,
    type: "laboratory",
    status: "available",
    has_ac: true,
    has_projector: true,
    has_internet: false
  },
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(dummyRooms);
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // Filter rooms based on search query, building and type filters
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBuilding = 
      !buildingFilter || 
      buildingFilter === "all" || 
      room.building_id.toString() === buildingFilter;
      
    const matchesType = 
      !typeFilter || 
      typeFilter === "all" || 
      room.type === typeFilter;
    
    return matchesSearch && matchesBuilding && matchesType;
  });

  // Handle edit room dialog
  const handleEditRoom = (room: Room) => {
    setCurrentRoom(room);
    setShowEditDialog(true);
  };

  // Get status badge based on room status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Tersedia</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Dalam Perbaikan</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800">Terpakai</Badge>;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'classroom':
        return "Ruang Kelas";
      case 'laboratory':
        return "Laboratorium";
      case 'office':
        return "Ruang Kantor";
      case 'meeting':
        return "Ruang Rapat";
      default:
        return "Lainnya";
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <DoorClosed className="mr-2 h-6 w-6 text-[#0687C9]" />
                Ruangan
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar ruangan di seluruh gedung kampus
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Ruangan
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari ruangan berdasarkan nama atau kode..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <Select 
                onValueChange={(value) => setBuildingFilter(value || null)}
                value={buildingFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Gedung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gedung</SelectItem>
                  {buildings.map(building => (
                    <SelectItem key={building.id} value={building.id.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-56">
              <Select 
                onValueChange={(value) => setTypeFilter(value || null)}
                value={typeFilter || "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Jenis Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="classroom">Ruang Kelas</SelectItem>
                  <SelectItem value="laboratory">Laboratorium</SelectItem>
                  <SelectItem value="office">Ruang Kantor</SelectItem>
                  <SelectItem value="meeting">Ruang Rapat</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Kode</TableHead>
                  <TableHead>Nama Ruangan</TableHead>
                  <TableHead>Gedung</TableHead>
                  <TableHead className="text-center">Lantai</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-center">Kapasitas</TableHead>
                  <TableHead>Fasilitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.code}</TableCell>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {room.building_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{room.floor}</TableCell>
                      <TableCell>{getTypeLabel(room.type)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          {room.capacity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {room.has_ac && (
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              AC
                            </Badge>
                          )}
                          {room.has_projector && (
                            <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                              <Monitor className="h-3 w-3 mr-1" />
                              Proyektor
                            </Badge>
                          )}
                          {room.has_internet && (
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              <Wifi className="h-3 w-3 mr-1" />
                              Internet
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(room.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditRoom(room)}
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
                      Tidak ada ruangan yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for adding new Room */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Ruangan Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail ruangan baru yang akan ditambahkan ke sistem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kode</label>
              <Input
                className="col-span-3"
                placeholder="Contoh: R201, LAB03"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Nama</label>
              <Input
                className="col-span-3"
                placeholder="Nama ruangan"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Gedung</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(building => (
                      <SelectItem key={building.id} value={building.id.toString()}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Lantai</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Contoh: 2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Jenis</label>
              <div className="col-span-3">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Ruang Kelas</SelectItem>
                    <SelectItem value="laboratory">Laboratorium</SelectItem>
                    <SelectItem value="office">Ruang Kantor</SelectItem>
                    <SelectItem value="meeting">Ruang Rapat</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Kapasitas</label>
              <Input
                className="col-span-3"
                type="number"
                placeholder="Jumlah orang"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Fasilitas</label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="ac-new" />
                  <label htmlFor="ac-new" className="text-sm">Air Conditioner (AC)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="projector-new" />
                  <label htmlFor="projector-new" className="text-sm">Proyektor</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="internet-new" />
                  <label htmlFor="internet-new" className="text-sm">Koneksi Internet</label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">Status</label>
              <div className="col-span-3">
                <Select defaultValue="available">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Tersedia</SelectItem>
                    <SelectItem value="maintenance">Dalam Perbaikan</SelectItem>
                    <SelectItem value="occupied">Terpakai</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Dialog for editing Room */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Ruangan</DialogTitle>
            <DialogDescription>
              Edit informasi ruangan yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentRoom && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kode</label>
                <Input
                  className="col-span-3"
                  value={currentRoom.code}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Nama</label>
                <Input
                  className="col-span-3"
                  value={currentRoom.name}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Gedung</label>
                <div className="col-span-3">
                  <Select defaultValue={currentRoom.building_id.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map(building => (
                        <SelectItem key={building.id} value={building.id.toString()}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Lantai</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentRoom.floor}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Jenis</label>
                <div className="col-span-3">
                  <Select defaultValue={currentRoom.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">Ruang Kelas</SelectItem>
                      <SelectItem value="laboratory">Laboratorium</SelectItem>
                      <SelectItem value="office">Ruang Kantor</SelectItem>
                      <SelectItem value="meeting">Ruang Rapat</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Kapasitas</label>
                <Input
                  className="col-span-3"
                  type="number"
                  value={currentRoom.capacity}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Fasilitas</label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ac-edit" checked={currentRoom.has_ac} />
                    <label htmlFor="ac-edit" className="text-sm">Air Conditioner (AC)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="projector-edit" checked={currentRoom.has_projector} />
                    <label htmlFor="projector-edit" className="text-sm">Proyektor</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="internet-edit" checked={currentRoom.has_internet} />
                    <label htmlFor="internet-edit" className="text-sm">Koneksi Internet</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-sm font-medium text-right">Status</label>
                <div className="col-span-3">
                  <Select defaultValue={currentRoom.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="maintenance">Dalam Perbaikan</SelectItem>
                      <SelectItem value="occupied">Terpakai</SelectItem>
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
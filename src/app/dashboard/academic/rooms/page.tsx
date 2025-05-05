"use client";

import { useState, useEffect } from "react";
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
import axios from "axios";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { roomFormSchema } from "@/lib/validators/room";
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

// Type untuk data Ruangan
interface Room {
  id: number;
  code: string;
  name: string;
  building_id: number;
  building: {
    id: number;
    name: string;
  };
  floor: number | string;
  capacity: number | string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<{id: number, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{id: number, name: string} | null>(null);

  // Form for adding a new room
  const addForm = useForm({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      code: "",
      name: "",
      building_id: 0,
      floor: 0,
      capacity: 0
    }
  });

  // Form for editing a room
  const editForm = useForm({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      code: "",
      name: "",
      building_id: 0,
      floor: 0,
      capacity: 0
    }
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
    if (message.includes("cannot delete")) {
      return "Tidak dapat menghapus ruangan yang masih digunakan";
    }
    
    // Return original message if no translation found
    return message;
  };

  // Load rooms and buildings on initial render
  useEffect(() => {
    fetchRooms();
    fetchBuildings();
  }, []);

  // Fetch all rooms from the API
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setRooms(response.data.data);
      } else {
        toast.error("Gagal memuat ruangan");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Gagal memuat ruangan");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all buildings for dropdown
  const fetchBuildings = async () => {
    setIsBuildingsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/buildings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        // Handle both formats - with or without the BuildingWithStats structure
        const buildingsData = response.data.data.map((item: any) => {
          // Check if the response has the BuildingWithStats structure or direct Building structure
          const building = item.building || item;
          return {
            id: building.id,
            name: building.name
          };
        });
        setBuildings(buildingsData);
        
        // Check if buildings are available and show notification if empty
        if (buildingsData.length === 0) {
          toast.warning("Tidak ada gedung tersedia", {
            description: "Silakan tambahkan gedung terlebih dahulu sebelum membuat ruangan"
          });
        }
      } else {
        toast.error("Gagal memuat gedung");
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Gagal memuat gedung");
    } finally {
      setIsBuildingsLoading(false);
    }
  };

  // Filter rooms based on search query and building filter
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBuilding = 
      !buildingFilter || 
      buildingFilter === "all" || 
      room.building_id.toString() === buildingFilter;
      
    return matchesSearch && matchesBuilding;
  });

  // Handle edit room
  const handleEditRoom = (room: Room) => {
    setCurrentRoom(room);
    
    // Reset form with current room data
    editForm.reset({
      code: room.code,
      name: room.name,
      building_id: room.building_id.toString(), // Convert to string for the select input
      floor: room.floor.toString(), // Convert to string in case it's a number
      capacity: room.capacity.toString() // Convert to string in case it's a number
    } as any);
    
    setShowEditDialog(true);
  };

  // Function to handle delete confirmation
  const confirmDeleteRoom = (room: Room) => {
    setRoomToDelete({ id: room.id, name: room.name });
    setShowDeleteModal(true);
  };

  // Function to execute delete
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms/${roomToDelete.id}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Ruangan berhasil dihapus");
        fetchRooms();
        setShowDeleteModal(false);
        setRoomToDelete(null);
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menghapus ruangan");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error deleting room:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menghapus ruangan");
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submission for adding a new room
  const onAddSubmit = async (data: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Ruangan berhasil ditambahkan");
        fetchRooms();
        setShowAddDialog(false);
        addForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menyimpan ruangan");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error saving room:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menyimpan ruangan");
      toast.error(errorMsg);
    }
  };

  // Handle form submission for editing a room
  const onEditSubmit = async (data: any) => {
    if (!currentRoom) return;
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rooms/${currentRoom.id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Ruangan berhasil diperbarui");
        fetchRooms();
        setShowEditDialog(false);
        editForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal memperbarui ruangan");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error updating room:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal memperbarui ruangan");
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
                <DoorClosed className="mr-2 h-6 w-6 text-[#0687C9]" />
                Ruangan
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar ruangan di seluruh gedung kampus
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                addForm.reset();
                setShowAddDialog(true);
              }}
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
                disabled={isBuildingsLoading}
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
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[80px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Ruangan</TableHead>
                  <TableHead className="font-bold text-black">Gedung</TableHead>
                  <TableHead className="text-center font-bold text-black">Lantai</TableHead>
                  <TableHead className="text-center font-bold text-black">Kapasitas</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-[#0687C9] border-opacity-50 border-t-[#0687C9] rounded-full"></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Memuat data ruangan...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredRooms.length > 0 ? (
                  filteredRooms.map((room, index) => (
                    <TableRow key={room.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{room.code}</TableCell>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          {room.building.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{room.floor}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          {room.capacity}
                        </div>
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
                              onClick={() => handleEditRoom(room)}
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDeleteRoom(room)}
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
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
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
      <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
        setShowAddDialog(isOpen);
        if (!isOpen) addForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Ruangan Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail ruangan baru yang akan ditambahkan ke sistem.
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
                        <Input placeholder="Contoh: R-101" {...field} />
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
                        <Input placeholder="Nama ruangan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="building_id"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Gedung</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gedung" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem key={building.id} value={building.id.toString()}>
                                {building.name}
                              </SelectItem>
                            ))}
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
                name="floor"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Lantai</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Contoh: 1" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Kapasitas</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Contoh: 40" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
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

      {/* Dialog for editing Room */}
      <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
        setShowEditDialog(isOpen);
        if (!isOpen) editForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Ruangan</DialogTitle>
            <DialogDescription>
              Edit informasi ruangan yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentRoom && (
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
                          <Input placeholder="Contoh: R-101" {...field} />
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
                          <Input placeholder="Nama ruangan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="building_id"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Gedung</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih gedung" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map((building) => (
                                <SelectItem key={building.id} value={building.id.toString()}>
                                  {building.name}
                                </SelectItem>
                              ))}
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
                  name="floor"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Lantai</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 1" 
                            min="0"
                            {...field}
                            onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Kapasitas</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 40" 
                            min="0"
                            {...field}
                            onChange={e => field.onChange(e.target.value === "" ? "" : parseInt(e.target.value))}
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

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        isLoading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteRoom}
        title="Hapus Ruangan"
        description={roomToDelete ? `Apakah Anda yakin ingin menghapus ruangan "${roomToDelete.name}"?` : ""}
      />
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Plus, 
  Pencil,
  Trash2,
  Search,
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
import axios from "axios";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { Building as BuildingType } from "@/shared/types";
import { buildingFormSchema, BuildingFormValues } from "@/lib/validators/building";
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

// Type untuk building dengan stats
interface BuildingWithStats {
  building: BuildingType;
  room_count: number;
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentBuilding, setCurrentBuilding] = useState<BuildingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<{id: number, name: string} | null>(null);

  // Form for adding a new building
  const addForm = useForm({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      code: "",
      name: "",
      floors: 1,
      description: ""
    }
  });

  // Form for editing a building
  const editForm = useForm({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      code: "",
      name: "",
      floors: 1,
      description: ""
    }
  });

  // Load buildings on initial render
  useEffect(() => {
    fetchBuildings();
  }, []);

  // Fetch all buildings from the API
  const fetchBuildings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/buildings?stats=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
        }
      });
      
      if (response.data.status === "success") {
        setBuildings(response.data.data);
      } else {
        toast.error("Gagal memuat data gedung");
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Gagal memuat data gedung");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter buildings based on search query
  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = 
      building.building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      building.building.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Handle edit building dialog
  const handleEditBuilding = (buildingData: BuildingWithStats) => {
    setCurrentBuilding(buildingData.building);
    
    // Reset form with current building data
    editForm.reset({
      id: buildingData.building.id,
      code: buildingData.building.code,
      name: buildingData.building.name,
      floors: buildingData.building.floors as number,
      description: buildingData.building.description || ""
    });
    
    setShowEditDialog(true);
  };

  // Function to handle delete confirmation
  const confirmDeleteBuilding = (building: BuildingWithStats) => {
    setBuildingToDelete({ id: building.building.id, name: building.building.name });
    setShowDeleteModal(true);
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
    if (message.includes("cannot delete")) {
      return "Tidak dapat menghapus gedung yang masih memiliki ruangan";
    }
    
    // Return original message if no translation found
    return message;
  };

  // Handle delete building
  const handleDeleteBuilding = async () => {
    if (!buildingToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/buildings/${buildingToDelete.id}`, 
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Gedung berhasil dihapus");
        fetchBuildings();
        setShowDeleteModal(false);
        setBuildingToDelete(null);
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menghapus gedung");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error deleting building:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menghapus gedung");
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle form submission for adding a new building
  const onAddSubmit = async (data: any) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/buildings`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Gedung berhasil ditambahkan");
        fetchBuildings();
        setShowAddDialog(false);
        addForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal menyimpan gedung");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error saving building:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal menyimpan gedung");
      toast.error(errorMsg);
    }
  };

  // Handle form submission for editing a building
  const onEditSubmit = async (data: any) => {
    if (!currentBuilding) return;
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/buildings/${currentBuilding.id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || sessionStorage.getItem('access_token')}`
          }
        }
      );
      
      if (response.data.status === "success") {
        toast.success("Gedung berhasil diperbarui");
        fetchBuildings();
        setShowEditDialog(false);
        editForm.reset();
      } else {
        const errorMsg = formatErrorMessage(response.data.error || "Gagal memperbarui gedung");
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error updating building:", error);
      const errorMsg = formatErrorMessage(error.response?.data?.error || "Gagal memperbarui gedung");
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
                <Building className="mr-2 h-6 w-6 text-[#0687C9]" />
                Gedung
              </CardTitle>
              <CardDescription className="mt-1">
                Kelola daftar gedung di kampus
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                addForm.reset();
                setShowAddDialog(true);
              }}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Gedung
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari gedung berdasarkan nama atau kode..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                  <TableHead className="w-[80px] font-bold text-black">Kode</TableHead>
                  <TableHead className="font-bold text-black">Nama Gedung</TableHead>
                  <TableHead className="text-center font-bold text-black">Lantai</TableHead>
                  <TableHead className="text-center font-bold text-black">Jumlah Ruangan</TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-[#0687C9] border-opacity-50 border-t-[#0687C9] rounded-full"></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Memuat data gedung...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building, index) => (
                    <TableRow key={building.building.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{building.building.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{building.building.name}</div>
                      </TableCell>
                      <TableCell className="text-center">{building.building.floors}</TableCell>
                      <TableCell className="text-center">{building.room_count}</TableCell>
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
                              onClick={() => confirmDeleteBuilding(building)}
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
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
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
      <Dialog open={showAddDialog} onOpenChange={(isOpen) => {
        setShowAddDialog(isOpen);
        if (!isOpen) addForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Tambah Gedung Baru</DialogTitle>
            <DialogDescription>
              Masukkan detail gedung baru yang akan ditambahkan ke sistem.
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
                        <Input placeholder="Contoh: GD-F" {...field} />
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
                        <Input placeholder="Nama gedung" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="floors"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Jumlah Lantai</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Contoh: 4" 
                          min="1"
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
                name="description"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Deskripsi</FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Deskripsi gedung (opsional)" {...field} value={field.value || ""} />
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

      {/* Dialog for editing Building */}
      <Dialog open={showEditDialog} onOpenChange={(isOpen) => {
        setShowEditDialog(isOpen);
        if (!isOpen) editForm.reset();
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Gedung</DialogTitle>
            <DialogDescription>
              Edit informasi gedung yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          
          {currentBuilding && (
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
                          <Input placeholder="Contoh: GD-F" {...field} />
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
                          <Input placeholder="Nama gedung" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="floors"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Jumlah Lantai</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Contoh: 4" 
                            min="1"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Deskripsi</FormLabel>
                      <div className="col-span-3">
                        <FormControl>
                          <Input placeholder="Deskripsi gedung (opsional)" {...field} value={field.value || ""} />
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

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        isLoading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteBuilding}
        title="Hapus Gedung"
        description={buildingToDelete ? `Apakah Anda yakin ingin menghapus gedung "${buildingToDelete.name}"?` : ""}
      />
    </div>
  );
} 
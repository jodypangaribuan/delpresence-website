"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, UserCog, Calendar, Trash2, User, AlertCircle } from "lucide-react";
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";
import { toast } from "sonner";

interface Schedule {
  id: number;
  courseCode: string;
  courseName: string;
  day: string;
  time: string;
  room: string;
  assigned: boolean;
  assistantId?: number;
  assistantName?: string;
}

interface Assistant {
  id: number;
  name: string;
  nim: string;
  email: string;
  program: string;
  semester: number;
}

export default function AssistantsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [filteredAssistants, setFilteredAssistants] = useState<Assistant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data for development
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSchedules([
        {
          id: 1,
          courseCode: "IF210",
          courseName: "Algoritma & Pemrograman",
          day: "Senin",
          time: "08:00 - 10:30",
          room: "Ruang Lab 3",
          assigned: true,
          assistantId: 101,
          assistantName: "Alexander Manurung"
        },
        {
          id: 2,
          courseCode: "IF310",
          courseName: "Basis Data",
          day: "Selasa",
          time: "13:00 - 15:30",
          room: "Ruang Lab 1",
          assigned: false
        },
        {
          id: 3,
          courseCode: "IF402",
          courseName: "Pemrograman Mobile",
          day: "Rabu",
          time: "10:00 - 12:30",
          room: "Ruang Lab 2",
          assigned: false
        },
        {
          id: 4,
          courseCode: "IF240",
          courseName: "Struktur Data",
          day: "Kamis",
          time: "09:00 - 11:30",
          room: "Ruang Lab 4",
          assigned: true,
          assistantId: 102,
          assistantName: "Jessica Sitanggang"
        }
      ]);

      setAssistants([
        {
          id: 101,
          name: "Alexander Manurung",
          nim: "12S20001",
          email: "alexander@del.ac.id",
          program: "S1 Informatika",
          semester: 7
        },
        {
          id: 102,
          name: "Jessica Sitanggang",
          nim: "12S20002",
          email: "jessica@del.ac.id",
          program: "S1 Informatika",
          semester: 7
        },
        {
          id: 103,
          name: "David Hutapea",
          nim: "12S20003",
          email: "david@del.ac.id",
          program: "S1 Sistem Informasi",
          semester: 5
        },
        {
          id: 104,
          name: "Sarah Sibuea",
          nim: "12S20004",
          email: "sarah@del.ac.id",
          program: "S1 Informatika",
          semester: 5
        },
        {
          id: 105,
          name: "Jonathan Simanjuntak",
          nim: "12S20005",
          email: "jonathan@del.ac.id",
          program: "S1 Informatika",
          semester: 7
        }
      ]);

      setFilteredAssistants([...assistants]);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter assistants based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredAssistants(assistants);
    } else {
      const filtered = assistants.filter(
        (assistant) =>
          assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assistant.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assistant.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAssistants(filtered);
    }
  }, [searchTerm, assistants]);

  // Filter schedules based on search term and day filter
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = scheduleSearchTerm === "" || 
      schedule.courseName.toLowerCase().includes(scheduleSearchTerm.toLowerCase()) ||
      schedule.courseCode.toLowerCase().includes(scheduleSearchTerm.toLowerCase());
    
    const matchesDay = dayFilter === "all" || schedule.day.toLowerCase() === dayFilter.toLowerCase();
    
    return matchesSearch && matchesDay;
  });

  // Function to open assignment dialog
  const openAssignmentDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };

  // Function to assign assistant to schedule
  const assignAssistant = async (assistantId: number) => {
    if (!selectedSchedule) return;
    
    setIsAssigning(true);
    try {
      // In a real implementation, you would call the API to assign the assistant
      // await api(`/lecturer/schedules/${selectedSchedule.id}/assign`, {
      //   method: 'POST',
      //   body: { assistantId }
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find assistant info
      const assistant = assistants.find(a => a.id === assistantId);
      
      // Update schedules state
      setSchedules(schedules.map(schedule => 
        schedule.id === selectedSchedule.id 
          ? { 
              ...schedule, 
              assigned: true, 
              assistantId: assistantId,
              assistantName: assistant?.name || "Unknown"
            } 
          : schedule
      ));
      
      toast.success(`Asisten berhasil ditugaskan ke mata kuliah ${selectedSchedule.courseCode}`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error assigning assistant:", error);
      toast.error("Gagal menugaskan asisten dosen");
    } finally {
      setIsAssigning(false);
    }
  };

  // Function to remove assistant from schedule
  const removeAssistant = async (scheduleId: number) => {
    try {
      // In a real implementation, you would call the API to remove the assistant
      // await api(`/lecturer/schedules/${scheduleId}/remove-assistant`, {
      //   method: 'POST'
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update schedules state
      setSchedules(schedules.map(schedule => 
        schedule.id === scheduleId 
          ? { 
              ...schedule, 
              assigned: false,
              assistantId: undefined,
              assistantName: undefined
            } 
          : schedule
      ));
      
      toast.success("Asisten dosen berhasil dihapus dari mata kuliah");
    } catch (error) {
      console.error("Error removing assistant:", error);
      toast.error("Gagal menghapus asisten dosen");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6">
          {/* Schedule Table with Assistant Assignments */}
          <div className="bg-white rounded-md border border-gray-100 shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-black">Kelola Asisten Dosen</h3>
                  <p className="text-sm text-muted-foreground mt-1">Kelola penugasan asisten dosen untuk mata kuliah yang Anda ampu</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mata kuliah..."
                      className="pl-8"
                      value={scheduleSearchTerm}
                      onChange={(e) => setScheduleSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter Hari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Hari</SelectItem>
                      <SelectItem value="Senin">Senin</SelectItem>
                      <SelectItem value="Selasa">Selasa</SelectItem>
                      <SelectItem value="Rabu">Rabu</SelectItem>
                      <SelectItem value="Kamis">Kamis</SelectItem>
                      <SelectItem value="Jumat">Jumat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                  
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] font-bold text-black">No</TableHead>
                        <TableHead className="w-[80px] font-bold text-black">Kode MK</TableHead>
                        <TableHead className="font-bold text-black">Mata Kuliah</TableHead>
                        <TableHead className="font-bold text-black">Hari</TableHead>
                        <TableHead className="font-bold text-black">Jam</TableHead>
                        <TableHead className="font-bold text-black">Ruangan</TableHead>
                        <TableHead className="font-bold text-black">Asisten Dosen</TableHead>
                        <TableHead className="w-[80px] text-right font-bold text-black">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule, index) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{schedule.courseCode}</TableCell>
                          <TableCell>{schedule.courseName}</TableCell>
                          <TableCell>{schedule.day}</TableCell>
                          <TableCell>{schedule.time}</TableCell>
                          <TableCell>{schedule.room}</TableCell>
                          <TableCell>
                            {schedule.assigned ? (
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-blue-800" />
                                </div>
                                <div>
                                  <span className="font-medium">{schedule.assistantName}</span>
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                    Ditugaskan
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="text-muted-foreground">Belum ditugaskan</span>
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                  Perlu Asisten
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {schedule.assigned ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeAssistant(schedule.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-[#0687C9] hover:bg-[#0572aa]"
                                onClick={() => openAssignmentDialog(schedule)}
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                Tugaskan
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSchedules.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Calendar className="h-10 w-10 text-gray-300 mb-2" />
                              <p>{schedules.length === 0 ? 
                                "Tidak ada jadwal yang tersedia" : 
                                "Tidak ada jadwal yang sesuai dengan filter"}
                              </p>
                              <p className="text-sm">Jadwal akan muncul di sini saat tersedia</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Pilih Asisten Dosen</DialogTitle>
            <DialogDescription>
              {selectedSchedule && (
                <div className="mt-2">
                  <p className="font-medium">{selectedSchedule.courseCode}: {selectedSchedule.courseName}</p>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{selectedSchedule.day}, {selectedSchedule.time}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari asisten dosen..."
              className="pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {filteredAssistants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                <p>Tidak ada asisten dosen yang sesuai dengan pencarian</p>
                <p className="text-sm mt-1">Coba dengan kata kunci lain</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssistants.map((assistant) => (
                  <div 
                    key={assistant.id}
                    className="flex items-center p-3 border border-gray-100 hover:bg-[#E6F3FB] rounded-lg cursor-pointer transition-colors"
                    onClick={() => assignAssistant(assistant.id)}
                  >
                    <div className="h-10 w-10 rounded-full bg-[#E6F3FB] flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-[#0687C9]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{assistant.name}</p>
                      <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                        <span>{assistant.nim}</span>
                        <span className="mx-1.5">•</span>
                        <span>{assistant.program}</span>
                        <Badge className="ml-2 bg-[#E6F3FB] text-[#0687C9] border-[#0687C9]/20">Semester {assistant.semester}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-[#0687C9] text-[#0687C9] hover:bg-[#E6F3FB]">Batal</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
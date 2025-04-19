"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { CalendarDays, Clock, Building, Users, Pencil, Trash, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface CourseSchedule {
  id: string;
  courseCode: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
  lecturer: string;
  studentGroup: string;
  semester: number;
  academicYear: string;
  capacity: number;
  enrolled: number;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const SAMPLE_SCHEDULES: CourseSchedule[] = [
  {
    id: "SCH-001",
    courseCode: "MK101",
    courseName: "Pengantar Teknologi Informasi",
    day: "Senin",
    startTime: "08:00",
    endTime: "10:30",
    room: "Ruang 101",
    building: "Gedung Teknik",
    lecturer: "Dr. Ahmad Wijaya",
    studentGroup: "Informatika 2023",
    semester: 1,
    academicYear: "2023/2024",
    capacity: 50,
    enrolled: 45
  },
  {
    id: "SCH-002",
    courseCode: "MK201",
    courseName: "Struktur Data dan Algoritma",
    day: "Selasa",
    startTime: "13:00",
    endTime: "15:30",
    room: "Ruang 203",
    building: "Gedung Teknik",
    lecturer: "Prof. Siti Rahayu",
    studentGroup: "Informatika 2022",
    semester: 3,
    academicYear: "2023/2024",
    capacity: 40,
    enrolled: 38
  },
  {
    id: "SCH-003",
    courseCode: "MK301",
    courseName: "Basis Data Lanjut",
    day: "Rabu",
    startTime: "10:00",
    endTime: "12:30",
    room: "Lab Database",
    building: "Gedung Informatika",
    lecturer: "Dr. Budi Santoso",
    studentGroup: "Sistem Informasi 2022",
    semester: 3,
    academicYear: "2023/2024",
    capacity: 35,
    enrolled: 35
  },
  {
    id: "SCH-004",
    courseCode: "MK401",
    courseName: "Kecerdasan Buatan dan Machine Learning",
    day: "Kamis",
    startTime: "15:00",
    endTime: "17:30",
    room: "Lab AI",
    building: "Gedung Riset",
    lecturer: "Dr. Dewi Pratiwi",
    studentGroup: "Informatika 2021",
    semester: 5,
    academicYear: "2023/2024",
    capacity: 30,
    enrolled: 24
  },
  {
    id: "SCH-005",
    courseCode: "MK501",
    courseName: "Pengembangan Aplikasi Web",
    day: "Jumat",
    startTime: "08:00",
    endTime: "10:30",
    room: "Lab Komputer 3",
    building: "Gedung Teknik",
    lecturer: "Prof. Rudi Hartono",
    studentGroup: "Sistem Informasi 2021",
    semester: 5,
    academicYear: "2023/2024",
    capacity: 30,
    enrolled: 28
  },
  {
    id: "SCH-006",
    courseCode: "MK102",
    courseName: "Matematika Diskrit",
    day: "Senin",
    startTime: "13:00",
    endTime: "15:30",
    room: "Ruang 105",
    building: "Gedung MIPA",
    lecturer: "Dr. Hendra Gunawan",
    studentGroup: "Informatika 2023",
    semester: 1,
    academicYear: "2023/2024",
    capacity: 45,
    enrolled: 42
  },
  {
    id: "SCH-007",
    courseCode: "MK202",
    courseName: "Jaringan Komputer",
    day: "Rabu",
    startTime: "13:00",
    endTime: "15:30",
    room: "Lab Jaringan",
    building: "Gedung Informatika",
    lecturer: "Prof. Agus Setiawan",
    studentGroup: "Informatika 2022",
    semester: 3,
    academicYear: "2023/2024",
    capacity: 35,
    enrolled: 30
  },
  {
    id: "SCH-008",
    courseCode: "MK302",
    courseName: "Pemrograman Mobile",
    day: "Kamis",
    startTime: "10:00",
    endTime: "12:30",
    room: "Lab Mobile",
    building: "Gedung Informatika",
    lecturer: "Dr. Maya Anggraini",
    studentGroup: "Informatika 2021",
    semester: 5,
    academicYear: "2023/2024",
    capacity: 30,
    enrolled: 29
  },
  {
    id: "SCH-009",
    courseCode: "MK601",
    courseName: "Praktikum Komputasi Awan",
    day: "Senin",
    startTime: "08:00",
    endTime: "11:30",
    room: "Lab Cloud",
    building: "Gedung Riset",
    lecturer: "Dr. Rini Wulandari",
    studentGroup: "Informatika 2021",
    semester: 5,
    academicYear: "2023/2024",
    capacity: 25,
    enrolled: 20
  },
  {
    id: "SCH-010",
    courseCode: "MK602",
    courseName: "Workshop Internet of Things",
    day: "Senin",
    startTime: "13:00",
    endTime: "16:30",
    room: "Lab IoT",
    building: "Gedung Riset",
    lecturer: "Prof. Bambang Supriyanto",
    studentGroup: "Sistem Informasi 2021",
    semester: 5,
    academicYear: "2023/2024",
    capacity: 25,
    enrolled: 23
  },
  {
    id: "SCH-011",
    courseCode: "MK103",
    courseName: "Praktikum Pemrograman Dasar",
    day: "Sabtu",
    startTime: "08:00",
    endTime: "10:30",
    room: "Lab Komputer 1",
    building: "Gedung Teknik",
    lecturer: "Dr. Anita Permatasari",
    studentGroup: "Informatika 2023",
    semester: 1,
    academicYear: "2023/2024",
    capacity: 40,
    enrolled: 40
  },
  {
    id: "SCH-012",
    courseCode: "MK203",
    courseName: "Workshop Desain UI/UX",
    day: "Sabtu",
    startTime: "13:00",
    endTime: "16:30",
    room: "Studio Desain",
    building: "Gedung Multimedia",
    lecturer: "Dr. Ratna Kusuma",
    studentGroup: "Sistem Informasi 2022",
    semester: 3,
    academicYear: "2023/2024",
    capacity: 30,
    enrolled: 28
  },
  {
    id: "SCH-013",
    courseCode: "MK104",
    courseName: "Bahasa Inggris untuk IT",
    day: "Sabtu",
    startTime: "10:30",
    endTime: "12:30",
    room: "Ruang 201",
    building: "Gedung Bahasa",
    lecturer: "Dr. Sarah Johnson",
    studentGroup: "Informatika 2023",
    semester: 1,
    academicYear: "2023/2024",
    capacity: 45,
    enrolled: 40
  },
  {
    id: "SCH-014",
    courseCode: "MK303",
    courseName: "Seminar Teknologi Terkini",
    day: "Minggu",
    startTime: "09:00",
    endTime: "12:00",
    room: "Auditorium",
    building: "Gedung Multimedia",
    lecturer: "Prof. Darmawan Pratama",
    studentGroup: "Informatika 2022",
    semester: 3,
    academicYear: "2023/2024",
    capacity: 60,
    enrolled: 55
  }
];

export default function ScheduleManagePage() {
  const [schedules, setSchedules] = useState<CourseSchedule[]>(SAMPLE_SCHEDULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState<string | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const buildings = Array.from(new Set(schedules.map(s => s.building)));
  const semesters = Array.from(new Set(schedules.map(s => s.semester))).sort((a, b) => a - b);

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.lecturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDay = !dayFilter || dayFilter === "all" || schedule.day === dayFilter;
    const matchesBuilding = !buildingFilter || buildingFilter === "all" || schedule.building === buildingFilter;
    const matchesSemester = !semesterFilter || schedule.semester === semesterFilter;
    
    return matchesSearch && matchesDay && matchesBuilding && matchesSemester;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Jadwal Perkuliahan</h2>
          <p className="text-muted-foreground mt-1">
            Kelola jadwal perkuliahan untuk semester aktif
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tambah Jadwal Perkuliahan</DialogTitle>
              <DialogDescription>
                Masukkan detail jadwal baru yang ingin ditambahkan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="courseCode">Kode Mata Kuliah</Label>
                <Input id="courseCode" placeholder="Contoh: CS101" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="courseName">Nama Mata Kuliah</Label>
                <Input id="courseName" placeholder="Masukkan nama mata kuliah" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="day">Hari</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Jam Mulai</Label>
                  <Input id="startTime" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Jam Selesai</Label>
                  <Input id="endTime" type="time" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="building">Gedung</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building} value={building}>{building}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room">Ruangan</Label>
                <Input id="room" placeholder="Masukkan nama ruangan" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lecturer">Dosen</Label>
                <Input id="lecturer" placeholder="Masukkan nama dosen" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="studentGroup">Kelompok Mahasiswa</Label>
                <Input id="studentGroup" placeholder="Masukkan kelompok mahasiswa" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>Semester {semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYear">Tahun Akademik</Label>
                <Input id="academicYear" placeholder="Contoh: 2023/2024" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasitas</Label>
                <Input id="capacity" type="number" min="1" placeholder="Masukkan kapasitas ruangan" />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button className="bg-[#0687C9] hover:bg-[#0670a8]" onClick={() => setShowAddDialog(false)}>
                Simpan Jadwal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Jadwal</TabsTrigger>
          <TabsTrigger value="calendar">Tampilan Kalender</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filter Jadwal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari jadwal..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={dayFilter || "all"}
                  onValueChange={(value) => setDayFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Hari</SelectItem>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={buildingFilter || "all"}
                  onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Gedung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gedung</SelectItem>
                    {buildings.map((building) => (
                      <SelectItem key={building} value={building}>{building}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={semesterFilter?.toString() || "all"}
                  onValueChange={(value) => setSemesterFilter(value === "all" ? null : parseInt(value, 10))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Semester</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester} value={semester.toString()}>Semester {semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Kode</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Kapasitas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada jadwal yang ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.courseCode}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{schedule.courseName}</p>
                            <p className="text-xs text-muted-foreground">
                              Semester {schedule.semester} - {schedule.academicYear}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{schedule.day}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <Building className="mr-1 h-4 w-4 text-muted-foreground" />
                              <span>{schedule.building}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {schedule.room}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{schedule.lecturer}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                            <span>{schedule.studentGroup}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={schedule.enrolled >= schedule.capacity ? "destructive" : "default"}>
                            {schedule.enrolled}/{schedule.capacity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
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
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Dalam Tampilan Kalender</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-2">
                    <Select
                      value={buildingFilter || "all"}
                      onValueChange={(value) => setBuildingFilter(value === "all" ? null : value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter Gedung" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Gedung</SelectItem>
                        {buildings.map((building) => (
                          <SelectItem key={building} value={building}>{building}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={semesterFilter?.toString() || "all"}
                      onValueChange={(value) => setSemesterFilter(value === "all" ? null : parseInt(value, 10))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Semester</SelectItem>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester.toString()}>Semester {semester}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm">
                      Hari Ini
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6"></path></svg>
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg>
                      </Button>
                    </div>
                    <div className="text-sm font-medium">
                      30 Oktober - 5 November 2023
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                  {DAYS.map((day, index) => (
                    <div 
                      key={day} 
                      className={`text-center p-2 font-medium rounded-t-md ${index === 0 ? 'bg-[#0687C9]/10 text-[#0687C9]' : 'bg-gray-100'}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-4 h-[650px]">
                  {DAYS.map((day, index) => (
                    <div 
                      key={`schedule-${day}`} 
                      className={`border rounded-md p-2 ${index === 0 ? 'bg-[#0687C9]/5 border-[#0687C9]/30' : 'bg-white'} overflow-y-auto relative`}
                    >
                      <div className="absolute inset-0 overflow-y-auto p-2">
                        <div className="space-y-2">
                          {filteredSchedules
                            .filter(schedule => schedule.day === day)
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => (
                              <div 
                                key={schedule.id}
                                className="p-2 rounded-md border-l-4 border-[#0687C9] bg-white shadow-sm hover:shadow transition-shadow cursor-pointer"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-semibold">{schedule.startTime} - {schedule.endTime}</span>
                                  <Badge variant={schedule.enrolled >= schedule.capacity ? "destructive" : "default"} className="text-xs">
                                    {schedule.enrolled}/{schedule.capacity}
                                  </Badge>
                                </div>
                                <div className="font-medium text-sm mb-1 truncate">{schedule.courseName}</div>
                                <div className="text-xs text-muted-foreground mb-1 truncate">{schedule.courseCode}</div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Users className="h-3 w-3 mr-1" /> 
                                  <span className="truncate">{schedule.lecturer}</span>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Building className="h-3 w-3 mr-1" /> 
                                  <span className="truncate">{schedule.room}, {schedule.building}</span>
                                </div>
                              </div>
                            ))}
                            
                          {filteredSchedules.filter(schedule => schedule.day === day).length === 0 && (
                            <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-sm text-neutral-400">
                              Tidak ada jadwal
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
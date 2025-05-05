"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Clock,
  School,
  Building,
  Users,
  CalendarDays
} from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ExportSchedulePage() {
  const [semester, setSemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [fileFormat, setFileFormat] = useState<string>("xlsx");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [exportType, setExportType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileReady, setFileReady] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Sample data
  const buildings = ["Gedung Teknik", "Gedung Informatika", "Gedung Riset"];
  
  const studentGroups = [
    { id: "1", name: "Ilmu Komputer 2023", department: "Ilmu Komputer" },
    { id: "2", name: "Teknik Informatika 2023", department: "Teknik Informatika" },
    { id: "3", name: "Sistem Informasi 2023", department: "Sistem Informasi" }
  ];
  
  const lecturers = [
    { id: "1", name: "Dr. Ahmad Wijaya", department: "Ilmu Komputer" },
    { id: "2", name: "Prof. Siti Rahayu", department: "Teknik Informatika" },
    { id: "3", name: "Dr. Budi Santoso", department: "Sistem Informasi" }
  ];
  
  const toggleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };
  
  const toggleBuildingSelection = (building: string) => {
    if (selectedBuildings.includes(building)) {
      setSelectedBuildings(selectedBuildings.filter(b => b !== building));
    } else {
      setSelectedBuildings([...selectedBuildings, building]);
    }
  };
  
  const handleExport = () => {
    if (!semester || !academicYear) {
      alert("Harap pilih semester dan tahun akademik.");
      return;
    }
    
    setIsLoading(true);
    
    // Simulasi export
    setTimeout(() => {
      setIsLoading(false);
      setFileReady(true);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").substring(0, 15);
      setFileName(`jadwal_${academicYear.replace("/", "_")}_${semester}_${timestamp}.${fileFormat}`);
      
      // Set preview data
      setPreviewData([
        {
          id: "1",
          courseCode: "CS101",
          courseName: "Pengantar Ilmu Komputer",
          day: "Senin",
          time: "08:00 - 10:30",
          room: "Ruang 101",
          building: "Gedung Teknik",
          lecturer: "Dr. Ahmad Wijaya",
          studentGroup: "Ilmu Komputer 2023"
        },
        {
          id: "2",
          courseCode: "CS201",
          courseName: "Algoritma dan Struktur Data",
          day: "Selasa",
          time: "13:00 - 15:30",
          room: "Ruang 203",
          building: "Gedung Teknik",
          lecturer: "Prof. Siti Rahayu",
          studentGroup: "Ilmu Komputer 2022"
        },
        {
          id: "3",
          courseCode: "CS301",
          courseName: "Basis Data",
          day: "Rabu",
          time: "10:00 - 12:30",
          room: "Lab Database",
          building: "Gedung Informatika",
          lecturer: "Dr. Budi Santoso",
          studentGroup: "Ilmu Komputer 2022"
        }
      ]);
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Export Jadwal</h2>
          <p className="text-muted-foreground mt-1">
            Generate dan unduh jadwal perkuliahan dalam format Excel atau CSV
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted">
          <TabsTrigger value="general" className="rounded-sm h-9">Export Umum</TabsTrigger>
          <TabsTrigger value="specific" className="rounded-sm h-9">Export Spesifik</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle>Export Jadwal Perkuliahan</CardTitle>
              <CardDescription>
                Export semua jadwal perkuliahan sesuai filter yang dipilih.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-sm font-medium">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ganjil">Ganjil</SelectItem>
                      <SelectItem value="genap">Genap</SelectItem>
                      <SelectItem value="pendek">Semester Pendek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="academicYear" className="text-sm font-medium">Tahun Akademik</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                      <SelectItem value="2022/2023">2022/2023</SelectItem>
                      <SelectItem value="2021/2022">2021/2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="p-4 bg-[#0687C9]/5 border border-[#0687C9]/10 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 inline-block">Format File</Label>
                    <RadioGroup 
                      className="flex space-x-4" 
                      defaultValue="xlsx" 
                      value={fileFormat} 
                      onValueChange={setFileFormat}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="xlsx" id="xlsx" />
                        <Label htmlFor="xlsx" className="flex items-center gap-1.5">
                          <FileSpreadsheet className="h-4 w-4 text-[#0687C9]" />
                          Excel (.xlsx)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" className="h-4 w-4 text-[#0687C9]">
                            <path d="M2.5 1H12.5C13.3284 1 14 1.67157 14 2.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V2.5C1 1.67157 1.67157 1 2.5 1ZM2.5 2C2.22386 2 2 2.22386 2 2.5V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V2.5C13 2.22386 12.7761 2 12.5 2H2.5ZM3 5.5C3 5.22386 3.22386 5 3.5 5H11.5C11.7761 5 12 5.22386 12 5.5C12 5.77614 11.7761 6 11.5 6H3.5C3.22386 6 3 5.77614 3 5.5ZM3 8.5C3 8.22386 3.22386 8 3.5 8H11.5C11.7761 8 12 8.22386 12 8.5C12 8.77614 11.7761 9 11.5 9H3.5C3.22386 9 3 8.77614 3 8.5ZM3 11.5C3 11.2239 3.22386 11 3.5 11H11.5C11.7761 11 12 11.2239 12 11.5C12 11.7761 11.7761 12 11.5 12H3.5C3.22386 12 3 11.7761 3 11.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                          </svg>
                          CSV (.csv)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-3 inline-block">Filter Hari</Label>
                    <div className="flex flex-wrap gap-3">
                      {DAYS.map((day) => (
                        <div key={day} 
                          className={`px-3 py-1.5 rounded text-sm cursor-pointer transition-colors border flex items-center gap-1.5 
                            ${selectedDays.includes(day) 
                              ? 'bg-[#0687C9] text-white border-[#0687C9]' 
                              : 'bg-transparent text-gray-600 border-gray-200 hover:border-[#0687C9]/50'}`}
                          onClick={() => toggleDaySelection(day)}
                        >
                          <CalendarDays className="h-3.5 w-3.5" /> {day}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-3 inline-block">Filter Gedung</Label>
                    <div className="flex flex-wrap gap-3">
                      {buildings.map((building) => (
                        <div key={building} 
                          className={`px-3 py-1.5 rounded text-sm cursor-pointer transition-colors border flex items-center gap-1.5 
                            ${selectedBuildings.includes(building) 
                              ? 'bg-[#0687C9] text-white border-[#0687C9]' 
                              : 'bg-transparent text-gray-600 border-gray-200 hover:border-[#0687C9]/50'}`}
                          onClick={() => toggleBuildingSelection(building)}
                        >
                          <Building className="h-3.5 w-3.5" /> {building}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-6">
              <Button 
                onClick={handleExport} 
                disabled={isLoading}
                className="bg-[#0687C9] hover:bg-[#0670a8]"
              >
                {isLoading 
                  ? <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </div>
                  : <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Generate Export
                    </div>
                }
              </Button>
            </CardFooter>
          </Card>
          
          {fileReady && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>File Siap Diunduh</CardTitle>
                <CardDescription>
                  File export telah berhasil dibuat. Klik tombol di bawah untuk mengunduh.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-md bg-muted">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-10 w-10 text-[#0687C9] mr-4" />
                    <div>
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {previewData.length} jadwal | {fileFormat.toUpperCase()} | Dibuat pada {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh File
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Preview Data ({previewData.length} baris)</h3>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode MK</TableHead>
                          <TableHead>Nama MK</TableHead>
                          <TableHead>Hari</TableHead>
                          <TableHead>Jam</TableHead>
                          <TableHead>Ruangan</TableHead>
                          <TableHead className="text-left">Dosen</TableHead>
                          <TableHead className="text-left">Kelompok Mahasiswa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.courseCode}</TableCell>
                            <TableCell>{item.courseName}</TableCell>
                            <TableCell>{item.day}</TableCell>
                            <TableCell>{item.time}</TableCell>
                            <TableCell>{item.room}, {item.building}</TableCell>
                            <TableCell>{item.lecturer}</TableCell>
                            <TableCell>{item.studentGroup}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="specific">
          <Card>
            <CardHeader>
              <CardTitle>Export Jadwal Spesifik</CardTitle>
              <CardDescription>
                Export jadwal berdasarkan dosen, kelas, atau ruangan tertentu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ganjil">Ganjil</SelectItem>
                      <SelectItem value="genap">Genap</SelectItem>
                      <SelectItem value="pendek">Semester Pendek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Tahun Akademik</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023/2024">2023/2024</SelectItem>
                      <SelectItem value="2022/2023">2022/2023</SelectItem>
                      <SelectItem value="2021/2022">2021/2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipe Export</Label>
                <RadioGroup 
                  className="space-y-2" 
                  defaultValue="all" 
                  value={exportType} 
                  onValueChange={setExportType}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lecturer" id="lecturer" />
                    <Label htmlFor="lecturer" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Jadwal Dosen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="class" id="class" />
                    <Label htmlFor="class" className="flex items-center">
                      <School className="h-4 w-4 mr-2" />
                      Jadwal Kelas/Mahasiswa
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="room" id="room" />
                    <Label htmlFor="room" className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Jadwal Ruangan
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {exportType === "lecturer" && (
                <div className="space-y-2">
                  <Label htmlFor="lecturer">Pilih Dosen</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih dosen" />
                    </SelectTrigger>
                    <SelectContent>
                      {lecturers.map((lecturer) => (
                        <SelectItem key={lecturer.id} value={lecturer.id}>
                          {lecturer.name} - {lecturer.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {exportType === "class" && (
                <div className="space-y-2">
                  <Label htmlFor="class">Pilih Kelas</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} - {group.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {exportType === "room" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="building">Pilih Gedung</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih gedung" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building} value={building}>
                            {building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="room">Pilih Ruangan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="101">Ruangan 101</SelectItem>
                        <SelectItem value="102">Ruangan 102</SelectItem>
                        <SelectItem value="203">Ruangan 203</SelectItem>
                        <SelectItem value="lab-database">Lab Database</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Format File</Label>
                <RadioGroup 
                  className="flex space-x-4" 
                  defaultValue="xlsx" 
                  value={fileFormat} 
                  onValueChange={setFileFormat}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="xlsx" id="xlsx-specific" />
                    <Label htmlFor="xlsx-specific">Excel (.xlsx)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv-specific" />
                    <Label htmlFor="csv-specific">CSV (.csv)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleExport} 
                disabled={isLoading}
                className="bg-[#0687C9] hover:bg-[#0670a8]"
              >
                {isLoading ? "Memproses..." : "Generate Export"}
              </Button>
            </CardFooter>
          </Card>
          
          {fileReady && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>File Siap Diunduh</CardTitle>
                <CardDescription>
                  File export telah berhasil dibuat. Klik tombol di bawah untuk mengunduh.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-md bg-muted">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-10 w-10 text-[#0687C9] mr-4" />
                    <div>
                      <p className="font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {previewData.length} jadwal | {fileFormat.toUpperCase()} | Dibuat pada {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
                    <Download className="mr-2 h-4 w-4" />
                    Unduh File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 
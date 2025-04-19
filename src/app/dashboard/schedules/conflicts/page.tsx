"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  Dialog as AlertDialog, 
  DialogContent as AlertDialogContent, 
  DialogDescription as AlertDialogDescription, 
  DialogFooter as AlertDialogFooter, 
  DialogHeader as AlertDialogHeader, 
  DialogTitle as AlertDialogTitle,
  DialogClose as AlertDialogCancel,
  DialogClose as AlertDialogAction
} from "@/components/ui/dialog";
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from "@radix-ui/react-icons";

interface Conflict {
  id: string;
  type: "room" | "lecturer" | "student";
  description: string;
  courses: string[];
  day: string;
  time: string;
  severity: "high" | "medium" | "low";
  status: "new" | "in-progress" | "resolved";
}

const SAMPLE_CONFLICTS: Conflict[] = [
  {
    id: "conf-001",
    type: "room",
    description: "Room 101 double-booked for two classes",
    courses: ["Database Systems CS301", "Web Programming CS302"],
    day: "Senin",
    time: "10:00 - 12:00",
    severity: "high",
    status: "new"
  },
  {
    id: "conf-002",
    type: "lecturer",
    description: "Dr. Smith scheduled for two classes simultaneously",
    courses: ["Algorithms CS401", "Data Structures CS201"],
    day: "Rabu",
    time: "14:00 - 16:00",
    severity: "high",
    status: "in-progress"
  },
  {
    id: "conf-003",
    type: "student",
    description: "Student group has overlapping mandatory courses",
    courses: ["Computer Networks CS304", "Operating Systems CS303"],
    day: "Selasa",
    time: "08:00 - 10:00",
    severity: "medium",
    status: "new"
  },
  {
    id: "conf-004",
    type: "room",
    description: "Lab 202 equipment conflict between courses",
    courses: ["Physics Lab PH201", "Electronics EE301"],
    day: "Kamis", 
    time: "13:00 - 15:00",
    severity: "low",
    status: "resolved"
  }
];

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>(SAMPLE_CONFLICTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);

  const filteredConflicts = conflicts.filter(conflict => {
    const matchesSearch = 
      conflict.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conflict.courses.some(course => course.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !typeFilter || typeFilter === "all" || conflict.type === typeFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || conflict.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleResolve = (conflict: Conflict) => {
    setSelectedConflict(conflict);
    setIsDialogOpen(true);
  };

  const confirmResolve = () => {
    if (selectedConflict) {
      setConflicts(prevConflicts =>
        prevConflicts.map(c =>
          c.id === selectedConflict.id ? { ...c, status: "resolved" } : c
        )
      );
    }
    setIsDialogOpen(false);
    setSelectedConflict(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": 
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <ExclamationTriangleIcon className="size-3.5" />
            Tinggi
          </Badge>
        );
      case "medium": 
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" className="size-3.5">
              <path d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.55509 0.608766L0.161178 11.3368C-0.275824 12.07 0.252503 13 1.10608 13H13.8939C14.7475 13 15.2758 12.07 14.8388 11.3368L8.4449 0.608765ZM7.4141 1.12073C7.45288 1.05566 7.54712 1.05566 7.5859 1.12073L13.9798 11.8488C14.0196 11.9159 13.9715 12 13.8939 12H1.10608C1.02849 12 0.980454 11.9159 1.02018 11.8488L7.4141 1.12073ZM6.8269 4.48611C6.81221 4.10423 7.11783 3.78663 7.5 3.78663C7.88217 3.78663 8.18778 4.10423 8.1731 4.48612L8.01921 8.48701C8.00848 8.766 7.7792 8.98664 7.5 8.98664C7.2208 8.98664 6.99151 8.766 6.98078 8.48701L6.8269 4.48611ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08567 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0618 7.08567 9.72599 7.49989 9.72599C7.9141 9.72599 8.24989 10.0618 8.24989 10.476Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Sedang
          </Badge>
        );
      case "low": 
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none" className="size-3.5">
              <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50005 4.69644C7.22391 4.69644 7.00005 4.9203 7.00005 5.19644V7.9687L8.93933 9.90798C9.13459 10.1032 9.45118 10.1032 9.64644 9.90798C9.8417 9.71272 9.8417 9.39613 9.64644 9.20087L7.85356 7.40799V5.19644C7.85356 4.9203 7.6297 4.69644 7.35356 4.69644H7.50005Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Rendah
          </Badge>
        );
      default: 
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": 
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V4.70711L9.29289 2H3.5ZM2 2.5C2 1.67157 2.67157 1 3.5 1H9.5C9.63261 1 9.75979 1.05268 9.85355 1.14645L12.7803 4.07322C12.921 4.21388 13 4.40464 13 4.60355V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5ZM4.75 7.5C4.75 7.22386 4.97386 7 5.25 7H9.75C10.0261 7 10.25 7.22386 10.25 7.5C10.25 7.77614 10.0261 8 9.75 8H5.25C4.97386 8 4.75 7.77614 4.75 7.5ZM5.25 9.5C4.97386 9.5 4.75 9.72386 4.75 10C4.75 10.2761 4.97386 10.5 5.25 10.5H9.75C10.0261 10.5 10.25 10.2761 10.25 10C10.25 9.72386 10.0261 9.5 9.75 9.5H5.25Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Baru
          </Badge>
        );
      case "in-progress": 
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M5.49998 0.5C5.49998 0.223858 5.72383 0 5.99998 0H7.49998H8.99998C9.27612 0 9.49998 0.223858 9.49998 0.5C9.49998 0.776142 9.27612 1 8.99998 1H7.99998V2.11922C9.09832 2.20409 10.119 2.56622 10.992 3.13572C11.0116 3.10851 11.0336 3.08252 11.058 3.05806L12.058 2.05806C12.3021 1.81398 12.6978 1.81398 12.942 2.05806C13.186 2.30214 13.186 2.69786 12.942 2.94194L11.967 3.91694C13.1595 5.07029 13.9 6.69395 13.9 8.49998C13.9 12.0346 11.0346 14.9 7.49998 14.9C3.96535 14.9 1.09998 12.0346 1.09998 8.49998C1.09998 5.13362 3.69919 2.3809 6.99998 2.11922V1H5.99998C5.72383 1 5.49998 0.776142 5.49998 0.5ZM2.09998 8.49998C2.09998 5.51764 4.51764 3.09998 7.49998 3.09998C10.4823 3.09998 12.9 5.51764 12.9 8.49998C12.9 11.4823 10.4823 13.9 7.49998 13.9C4.51764 13.9 2.09998 11.4823 2.09998 8.49998ZM7.99998 4.5C7.99998 4.22386 7.77612 4 7.49998 4C7.22383 4 6.99998 4.22386 6.99998 4.5V8.5C6.99998 8.77614 7.22383 9 7.49998 9C7.77612 9 7.99998 8.77614 7.99998 8.5V4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Dalam Proses
          </Badge>
        );
      case "resolved": 
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 11.1575 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1576 0.877045 7.49991 0.877045ZM1.82708 7.49988C1.82708 4.36686 4.36689 1.82704 7.49991 1.82704C10.6329 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49988ZM10.1589 5.53774C10.3178 5.31191 10.2636 5.00001 10.0378 4.84109C9.81194 4.68217 9.50004 4.73642 9.34112 4.96225L6.51977 8.97154L5.35681 7.78706C5.16334 7.59002 4.84677 7.58711 4.64973 7.78058C4.45268 7.97404 4.44978 8.29061 4.64325 8.48765L6.22658 10.1003C6.33054 10.2062 6.47617 10.2604 6.62407 10.2483C6.77197 10.2363 6.90686 10.1591 6.99226 10.0377L10.1589 5.53774Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Terselesaikan
          </Badge>
        );
      default: 
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pengecekan Konflik</h2>
          <p className="text-muted-foreground mt-1">
            Identifikasi dan selesaikan konflik pada jadwal perkuliahan
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div>
              <CardTitle className="text-xl font-bold">Daftar Konflik</CardTitle>
              <CardDescription>
                Konflik yang terdeteksi dalam jadwal perkuliahan
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm bg-[#0687C9]/10 text-[#0687C9] border-[#0687C9]/20">
              {filteredConflicts.length} konflik ditemukan
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari konflik..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={typeFilter || "all"}
                  onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="room">Ruangan</SelectItem>
                    <SelectItem value="lecturer">Dosen</SelectItem>
                    <SelectItem value="student">Mahasiswa</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="new">Baru</SelectItem>
                    <SelectItem value="in-progress">Dalam Proses</SelectItem>
                    <SelectItem value="resolved">Terselesaikan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="w-[300px]">Deskripsi</TableHead>
                      <TableHead>Hari/Waktu</TableHead>
                      <TableHead>Tingkat</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConflicts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          Tidak ada konflik yang ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConflicts.map((conflict) => (
                        <TableRow key={conflict.id}>
                          <TableCell className="font-medium capitalize">
                            {conflict.type === "room" && "Ruangan"}
                            {conflict.type === "lecturer" && "Dosen"}
                            {conflict.type === "student" && "Mahasiswa"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{conflict.description}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Mata Kuliah: {conflict.courses.join(", ")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <CalendarIcon className="mr-1 h-4 w-4" />
                                <span>{conflict.day}</span>
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <ClockIcon className="mr-1 h-4 w-4" />
                                <span>{conflict.time}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getSeverityColor(conflict.severity)}
                          </TableCell>
                          <TableCell>
                            {getStatusColor(conflict.status)}
                          </TableCell>
                          <TableCell>
                            {conflict.status !== "resolved" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[#0687C9] border-[#0687C9] hover:bg-[#0687C9]/10"
                                onClick={() => handleResolve(conflict)}
                              >
                                Selesaikan
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Terselesaikan
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ringkasan Konflik</CardTitle>
            <CardDescription>
              Statistik dan informasi mengenai konflik penjadwalan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">Berdasarkan Tipe</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ruangan</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.type === "room").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dosen</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.type === "lecturer").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mahasiswa</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.type === "student").length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 text-sm font-medium">Berdasarkan Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Baru</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.status === "new").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dalam Proses</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.status === "in-progress").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Terselesaikan</span>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.status === "resolved").length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 text-sm font-medium">Berdasarkan Tingkat Keparahan</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">
                        Tinggi
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.severity === "high").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        Sedang
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.severity === "medium").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        Rendah
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {conflicts.filter(c => c.severity === "low").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-muted-foreground mr-2" />
              Konfirmasi Penyelesaian
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menandai konflik ini sebagai terselesaikan?
              {selectedConflict && (
                <div className="mt-2 p-3 border rounded-md bg-muted">
                  <p className="font-medium">{selectedConflict.description}</p>
                  <p className="text-sm mt-1">{selectedConflict.courses.join(", ")}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResolve} className="bg-[#0687C9] hover:bg-[#0670a8]">
              Selesaikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
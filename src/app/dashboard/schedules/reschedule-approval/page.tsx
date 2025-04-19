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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon,
  CheckIcon,
  Cross2Icon
} from "@radix-ui/react-icons";

interface RescheduleRequest {
  id: string;
  courseCode: string;
  courseName: string;
  lecturer: string;
  originalDate: string;
  originalTime: string;
  proposedDate: string;
  proposedTime: string;
  room: string;
  reason: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  requestDate: string;
}

const SAMPLE_REQUESTS: RescheduleRequest[] = [
  {
    id: "req-001",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    lecturer: "Dr. Jane Smith",
    originalDate: "2023-11-15",
    originalTime: "10:00 - 12:00",
    proposedDate: "2023-11-17",
    proposedTime: "14:00 - 16:00",
    room: "Room 101",
    reason: "Lecturer has an academic conference on the original date",
    requestedBy: "Dr. Jane Smith",
    status: "pending",
    requestDate: "2023-11-08"
  },
  {
    id: "req-002",
    courseCode: "MATH201",
    courseName: "Calculus II",
    lecturer: "Prof. Robert Johnson",
    originalDate: "2023-11-16",
    originalTime: "08:00 - 10:00",
    proposedDate: "2023-11-18",
    proposedTime: "08:00 - 10:00",
    room: "Room 203",
    reason: "Room maintenance scheduled for the original date",
    requestedBy: "Admin Staff",
    status: "pending",
    requestDate: "2023-11-09"
  },
  {
    id: "req-003",
    courseCode: "ENG105",
    courseName: "Academic Writing",
    lecturer: "Dr. Emily Chen",
    originalDate: "2023-11-14",
    originalTime: "13:00 - 15:00",
    proposedDate: "2023-11-21",
    proposedTime: "13:00 - 15:00",
    room: "Room 105",
    reason: "Lecturer medical emergency",
    requestedBy: "Dr. Emily Chen",
    status: "approved",
    requestDate: "2023-11-07"
  },
  {
    id: "req-004",
    courseCode: "PHY202",
    courseName: "Physics II",
    lecturer: "Prof. David Lee",
    originalDate: "2023-11-17",
    originalTime: "15:00 - 17:00",
    proposedDate: "2023-11-24",
    proposedTime: "15:00 - 17:00",
    room: "Lab 302",
    reason: "Equipment failure in the lab",
    requestedBy: "Lab Technician",
    status: "rejected",
    requestDate: "2023-11-10"
  }
];

export default function RescheduleApprovalPage() {
  const [requests, setRequests] = useState<RescheduleRequest[]>(SAMPLE_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [currentRequest, setCurrentRequest] = useState<RescheduleRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.lecturer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (request: RescheduleRequest) => {
    setCurrentRequest(request);
    setIsDialogOpen(true);
  };

  const handleApprove = (request: RescheduleRequest) => {
    setRequests(prevRequests =>
      prevRequests.map(r =>
        r.id === request.id ? { ...r, status: "approved" } : r
      )
    );
  };

  const handleRejectClick = (request: RescheduleRequest) => {
    setCurrentRequest(request);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (currentRequest) {
      setRequests(prevRequests =>
        prevRequests.map(r =>
          r.id === currentRequest.id ? { ...r, status: "rejected" } : r
        )
      );
      setIsRejectDialogOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V8.5C8.00003 8.77614 7.77617 9 7.50003 9C7.22389 9 7.00003 8.77614 7.00003 8.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4ZM7.5 10C7.77614 10 8 10.2239 8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Menunggu
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 11.1575 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1576 0.877045 7.49991 0.877045ZM1.82708 7.49988C1.82708 4.36686 4.36689 1.82704 7.49991 1.82704C10.6329 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49988ZM10.1589 5.53774C10.3178 5.31191 10.2636 5.00001 10.0378 4.84109C9.81194 4.68217 9.50004 4.73642 9.34112 4.96225L6.51977 8.97154L5.35681 7.78706C5.16334 7.59002 4.84677 7.58711 4.64973 7.78058C4.45268 7.97404 4.44978 8.29061 4.64325 8.48765L6.22658 10.1003C6.33054 10.2062 6.47617 10.2604 6.62407 10.2483C6.77197 10.2363 6.90686 10.1591 6.99226 10.0377L10.1589 5.53774Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Disetujui
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">Unknown</Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Penjadwalan Ulang</h2>
          <p className="text-muted-foreground mt-1">
            Kelola permintaan perubahan jadwal dari dosen dan mahasiswa
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="pending" onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="pending">Menunggu Persetujuan</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="approved" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          <RequestsTable 
            requests={filteredRequests} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Permohonan Penjadwalan Ulang</DialogTitle>
            <DialogDescription>
              Informasi lengkap mengenai permohonan penjadwalan ulang.
            </DialogDescription>
          </DialogHeader>
          
          {currentRequest && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Mata Kuliah</h3>
                  <p>{currentRequest.courseCode} - {currentRequest.courseName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Dosen</h3>
                  <p>{currentRequest.lecturer}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Ruangan</h3>
                  <p>{currentRequest.room}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Diminta Oleh</h3>
                  <p>{currentRequest.requestedBy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Tanggal Permintaan</h3>
                  <p>{formatDate(currentRequest.requestDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="mt-1">{getStatusBadge(currentRequest.status)}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted">
                  <h3 className="text-sm font-medium mb-2">Jadwal Asli</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal:</p>
                      <p className="font-medium">{formatDate(currentRequest.originalDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu:</p>
                      <p className="font-medium">{currentRequest.originalTime}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-sm font-medium mb-2">Jadwal yang Diusulkan</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal:</p>
                      <p className="font-medium">{formatDate(currentRequest.proposedDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu:</p>
                      <p className="font-medium">{currentRequest.proposedTime}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Alasan</h3>
                  <p className="mt-1 whitespace-pre-wrap">{currentRequest.reason}</p>
                </div>
              </div>
              
              {currentRequest.status === "pending" && (
                <div className="col-span-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleRejectClick(currentRequest);
                    }}
                  >
                    Tolak
                  </Button>
                  <Button
                    onClick={() => {
                      handleApprove(currentRequest);
                      setIsDialogOpen(false);
                    }}
                  >
                    Setujui
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Permohonan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan permohonan penjadwalan ulang.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Mata Kuliah</h4>
              <p className="text-sm">
                {currentRequest?.courseCode} - {currentRequest?.courseName}
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Alasan Penolakan
              </label>
              <textarea
                id="reason"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Berikan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button 
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RequestsTableProps {
  requests: RescheduleRequest[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewDetails: (request: RescheduleRequest) => void;
  onApprove: (request: RescheduleRequest) => void;
  onReject: (request: RescheduleRequest) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function RequestsTable({
  requests,
  searchQuery,
  setSearchQuery,
  onViewDetails,
  onApprove,
  onReject,
  getStatusBadge
}: RequestsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari permohonan..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead>Dosen</TableHead>
                <TableHead>Jadwal Asli</TableHead>
                <TableHead>Jadwal Usulan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    Tidak ada permohonan yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.courseCode}
                    </TableCell>
                    <TableCell>{request.courseName}</TableCell>
                    <TableCell>{request.lecturer}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>{new Date(request.originalDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>{request.originalTime}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>{new Date(request.proposedDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>{request.proposedTime}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                        >
                          Detail
                        </Button>
                        
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onApprove(request)}
                              className="text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600"
                            >
                              <CheckIcon className="mr-1 h-4 w-4" />
                              Setujui
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReject(request)}
                              className="text-destructive border-red-200 hover:bg-red-50"
                            >
                              <Cross2Icon className="mr-1 h-4 w-4" />
                              Tolak
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 
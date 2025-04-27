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
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Upload,
  XCircle,
  Info,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";

// Type definitions
interface ImportRow {
  id: number;
  courseCode: string;
  courseName: string;
  day: string;
  time: string;
  room: string;
  building: string;
  lecturer: string;
  studentGroup: string;
  isValid: boolean;
  errors: string[];
}

export default function ImportSchedulePage() {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "validating" | "importing" | "success" | "error">("idle");
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importErrors, setImportErrors] = useState<ImportRow[]>([]);
  const [semester, setSemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simulate parsing file
      simulateParseExcel(file);
    }
  };

  const simulateParseExcel = (file: File) => {
    setImportStatus("parsing");
    setImportProgress(20);
    setIsLoading(true);
    
    // Use FormData to upload the file
    const formData = new FormData();
    formData.append('file', file);
    
    // In a real implementation, you would send this to your API endpoint
    // For demo purposes, we'll simulate the process
    setTimeout(() => {
      // Mock data that would come from the API
      const mockData: ImportRow[] = [
        {
          id: 1,
          courseCode: "CS101",
          courseName: "Pengantar Ilmu Komputer",
          day: "Senin",
          time: "08:00 - 10:30",
          room: "Ruang 101",
          building: "Gedung Teknik",
          lecturer: "Dr. Ahmad Wijaya",
          studentGroup: "Ilmu Komputer 2023",
          isValid: true,
          errors: []
        },
        {
          id: 2,
          courseCode: "CS201",
          courseName: "Algoritma dan Struktur Data",
          day: "Selasa",
          time: "13:00 - 15:30",
          room: "Ruang 203",
          building: "Gedung Teknik",
          lecturer: "Prof. Siti Rahayu",
          studentGroup: "Ilmu Komputer 2022",
          isValid: true,
          errors: []
        },
        {
          id: 3,
          courseCode: "CS301",
          courseName: "Basis Data",
          day: "Rabu",
          time: "10:00 - 12:30",
          room: "Lab Database",
          building: "Gedung Informatika",
          lecturer: "Dr. Budi Santoso",
          studentGroup: "Ilmu Komputer 2022",
          isValid: true,
          errors: []
        },
        {
          id: 4,
          courseCode: "CS401",
          courseName: "Kecerdasan Buatan",
          day: "ERROR",
          time: "15:00 - 17:30",
          room: "Lab AI",
          building: "Gedung Riset",
          lecturer: "Dr. Dewi Pratiwi",
          studentGroup: "Ilmu Komputer 2021",
          isValid: false,
          errors: ["Format hari tidak valid"]
        },
        {
          id: 5,
          courseCode: "CS501",
          courseName: "Pemrograman Web Lanjut",
          day: "Jumat",
          time: "08:00",
          room: "",
          building: "Gedung Teknik",
          lecturer: "Prof. Rudi Hartono",
          studentGroup: "Ilmu Komputer 2021",
          isValid: false,
          errors: ["Format waktu tidak valid", "Ruangan tidak boleh kosong"]
        }
      ];
      
      setPreviewData(mockData);
      setImportStatus("validating");
      setImportProgress(50);
      
      // Simulate validation
      setTimeout(() => {
        const errors = mockData.filter(row => !row.isValid);
        setImportErrors(errors);
        setActiveTab("preview");
        setImportStatus("idle");
        setImportProgress(70);
        setIsLoading(false);
        toast.success("File berhasil diproses");
      }, 1500);
    }, 1500);
  };

  const handleImport = () => {
    if (importErrors.length > 0) {
      toast.error("Harap perbaiki semua kesalahan sebelum melanjutkan import.");
      return;
    }
    
    if (!semester || !academicYear) {
      toast.error("Harap pilih semester dan tahun akademik.");
      return;
    }
    
    setImportStatus("importing");
    setImportProgress(80);
    setIsLoading(true);
    
    // Simulate import process
    setTimeout(() => {
      setImportStatus("success");
      setImportProgress(100);
      setIsLoading(false);
      toast.success("Data jadwal berhasil diimpor");
    }, 2000);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportStatus("idle");
    setImportProgress(0);
    setImportErrors([]);
    setActiveTab("upload");
    setSemester("");
    setAcademicYear("");
    toast.info("Import data direset");
  };

  const renderStatus = () => {
    switch (importStatus) {
      case "parsing":
        return (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Memproses File</AlertTitle>
            <AlertDescription>
              Sedang membaca data dari file Excel. Harap tunggu...
            </AlertDescription>
          </Alert>
        );
      case "validating":
        return (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Memvalidasi Data</AlertTitle>
            <AlertDescription>
              Sedang memeriksa kevalidan data. Harap tunggu...
            </AlertDescription>
          </Alert>
        );
      case "importing":
        return (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Mengimpor Data</AlertTitle>
            <AlertDescription>
              Sedang menyimpan data jadwal. Harap tunggu...
            </AlertDescription>
          </Alert>
        );
      case "success":
        return (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">Import Berhasil</AlertTitle>
            <AlertDescription className="text-green-700">
              Data jadwal berhasil diimpor ke dalam sistem.
            </AlertDescription>
          </Alert>
        );
      case "error":
        return (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-600">Import Gagal</AlertTitle>
            <AlertDescription className="text-red-700">
              Terjadi kesalahan saat mengimpor data. Harap coba lagi.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import Jadwal</h2>
          <p className="text-muted-foreground mt-1">
            Upload dan proses jadwal perkuliahan dari file Excel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {importStatus === "success" && (
            <Button 
              variant="outline" 
              onClick={resetImport}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Import
            </Button>
          )}
          {previewData.length > 0 && importStatus !== "success" && (
            <Button 
              onClick={handleImport}
              className="bg-[#0687C9] hover:bg-[#0670a8]"
              disabled={isLoading || importErrors.length > 0}
            >
              {isLoading && importStatus === "importing" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">
                    <RefreshCw className="h-4 w-4" />
                  </span>
                  Mengimpor...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Import Data
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <Progress value={importProgress} className={importStatus === "idle" ? "invisible" : "visible"} />
        {renderStatus()}
      </div>
      
      {importStatus !== "idle" && importStatus !== "success" && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div>Proses Import</div>
                <div>{importProgress}%</div>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {importStatus === "success" ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center justify-center p-10">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Selesai!</h3>
            <p className="text-center text-muted-foreground mb-6">
              Semua data telah berhasil diimpor ke dalam sistem.
            </p>
            <div className="flex space-x-4">
              <Button onClick={resetImport}>
                Import File Baru
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/dashboard/schedules/manage"}>
                Kembali ke Jadwal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="upload" className="flex items-center gap-1.5 py-2">
              <Upload className="h-3.5 w-3.5" /> 
              <span>1. Upload File</span>
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={previewData.length === 0} className="flex items-center gap-1.5 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>2. Preview & Validasi</span>
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={previewData.length === 0} className="flex items-center gap-1.5 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>3. Pengaturan</span>
            </TabsTrigger>
            <TabsTrigger value="import" disabled={previewData.length === 0 || importErrors.length > 0} className="flex items-center gap-1.5 py-2">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>4. Import</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0687C9]" />
                  Upload File Excel
                </CardTitle>
                <CardDescription>
                  Upload file Excel (.xlsx) yang berisi data jadwal perkuliahan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0687C9]/5 border-2 border-dashed border-[#0687C9]/20 rounded-lg p-8 mb-6 flex flex-col items-center justify-center transition-all hover:bg-[#0687C9]/10 cursor-pointer">
                  {!selectedFile ? (
                    <>
                      <div className="bg-[#0687C9]/10 rounded-full p-3 mb-4">
                        <FileSpreadsheet className="h-10 w-10 text-[#0687C9]" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Drag & Drop File Excel
                      </h3>
                      <p className="text-center text-muted-foreground mb-6 max-w-md">
                        Tarik file Excel dan letakkan di sini, atau klik tombol di bawah untuk memilih file
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-green-100 rounded-full p-3 mb-4">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        File Dipilih
                      </h3>
                      <div className="flex items-center bg-white px-4 py-2 rounded-md border mb-4 w-full max-w-md">
                        <FileSpreadsheet className="h-5 w-5 text-[#0687C9] mr-2 shrink-0" />
                        <span className="font-medium truncate">{selectedFile.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground shrink-0">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".xlsx, .xls"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                      <Button className="relative bg-[#0687C9] hover:bg-[#0670a8]">
                        <Upload className="mr-2 h-4 w-4" />
                        {selectedFile ? "Ganti File" : "Pilih File Excel"}
                      </Button>
                    </div>
                    <Button variant="outline" className="border-[#0687C9] text-[#0687C9] hover:bg-[#0687C9]/10">
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
                
                {selectedFile && isLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Memproses file...</span>
                      <span className="text-sm text-muted-foreground">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Petunjuk Format Excel</h4>
                      <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                        <li>Gunakan format Excel (.xlsx) dengan template yang disediakan</li>
                        <li>Pastikan kolom Hari menggunakan format: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu</li>
                        <li>Format jam menggunakan format 24 jam: HH:MM - HH:MM (contoh: 08:00 - 10:30)</li>
                        <li>Semua kolom harus diisi dengan lengkap</li>
                        <li>Pastikan kode mata kuliah, nama dosen, dan ruangan sudah terdaftar di sistem</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#0687C9]">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Preview Data
                </CardTitle>
                <CardDescription>
                  Periksa data jadwal yang akan diimpor dan validasi sebelum melanjutkan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importErrors.length > 0 && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertTitle className="text-red-600">Ditemukan {importErrors.length} Kesalahan</AlertTitle>
                    <AlertDescription className="text-red-700">
                      Silakan perbaiki kesalahan berikut sebelum melanjutkan import.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="rounded-md border overflow-hidden mb-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[60px] font-medium">Baris</TableHead>
                          <TableHead className="font-medium">Kode MK</TableHead>
                          <TableHead className="font-medium">Nama MK</TableHead>
                          <TableHead className="font-medium">Hari</TableHead>
                          <TableHead className="font-medium">Jam</TableHead>
                          <TableHead className="font-medium">Ruangan</TableHead>
                          <TableHead className="font-medium">Gedung</TableHead>
                          <TableHead className="font-medium">Dosen</TableHead>
                          <TableHead className="font-medium">Kelas</TableHead>
                          <TableHead className="w-[100px] font-medium">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row) => (
                          <TableRow key={row.id} className={!row.isValid ? "bg-red-50" : ""}>
                            <TableCell className="font-medium">{row.id}</TableCell>
                            <TableCell>{row.courseCode}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{row.courseName}</TableCell>
                            <TableCell className={row.day === "ERROR" ? "text-red-500 font-medium" : ""}>
                              {row.day}
                            </TableCell>
                            <TableCell className={!row.time.includes("-") ? "text-red-500 font-medium" : ""}>
                              {row.time}
                            </TableCell>
                            <TableCell className={!row.room ? "text-red-500 font-medium" : ""}>
                              {row.room || "—"}
                            </TableCell>
                            <TableCell>{row.building}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{row.lecturer}</TableCell>
                            <TableCell>{row.studentGroup}</TableCell>
                            <TableCell>
                              {row.isValid ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Error
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {importErrors.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Detail Kesalahan</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {importErrors.map((error) => (
                        <div key={error.id} className="p-3 border border-red-200 rounded-md bg-red-50">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-red-700">Baris #{error.id}</span>
                            <span className="text-sm text-red-600">{error.courseCode} - {error.courseName}</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                            {error.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Total data: <span className="font-medium">{previewData.length}</span> {" "}
                    (<span className="text-green-600 font-medium">{previewData.filter(row => row.isValid).length} valid</span>, {" "}
                    <span className="text-red-600 font-medium">{importErrors.length} error</span>)
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setActiveTab("upload")} 
                      variant="outline"
                    >
                      Kembali
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("settings")} 
                      className="bg-[#0687C9] hover:bg-[#0670a8]"
                      disabled={importErrors.length > 0}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#0687C9]">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Pengaturan Import
                </CardTitle>
                <CardDescription>
                  Tentukan semester dan tahun akademik untuk data yang akan diimport.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-base">Semester</Label>
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ganjil">Ganjil</SelectItem>
                        <SelectItem value="genap">Genap</SelectItem>
                        <SelectItem value="pendek">Semester Pendek</SelectItem>
                      </SelectContent>
                    </Select>
                    {!semester && (
                      <p className="text-sm text-red-500">Semester harus dipilih</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="academicYear" className="text-base">Tahun Akademik</Label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Pilih tahun akademik" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023/2024">2023/2024</SelectItem>
                        <SelectItem value="2022/2023">2022/2023</SelectItem>
                        <SelectItem value="2021/2022">2021/2022</SelectItem>
                      </SelectContent>
                    </Select>
                    {!academicYear && (
                      <p className="text-sm text-red-500">Tahun akademik harus dipilih</p>
                    )}
                  </div>
                </div>
                
                <div className="rounded-md border overflow-hidden">
                  <div className="bg-muted/30 px-4 py-3 border-b">
                    <h3 className="font-medium">Opsi Tambahan</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-start space-x-2">
                      <input type="checkbox" id="overwrite" className="mt-1" />
                      <div>
                        <Label htmlFor="overwrite" className="font-medium">
                          Timpa data yang sudah ada
                        </Label>
                        <p className="text-sm text-muted-foreground">Jadwal dengan kode mata kuliah yang sama akan ditimpa dengan data baru</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      <input type="checkbox" id="skipErrors" className="mt-1" />
                      <div>
                        <Label htmlFor="skipErrors" className="font-medium">
                          Lanjutkan meskipun ada kesalahan
                        </Label>
                        <p className="text-sm text-muted-foreground">Data yang valid akan tetap diimpor meskipun ada data dengan kesalahan</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Perhatian</h4>
                      <p className="text-sm text-amber-700">
                        Pastikan semester dan tahun akademik sudah benar. Data yang diimpor akan menggunakan pengaturan ini.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <Button 
                    onClick={() => setActiveTab("preview")} 
                    variant="outline"
                  >
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("import")} 
                    className="bg-[#0687C9] hover:bg-[#0670a8]"
                    disabled={!semester || !academicYear}
                  >
                    Lanjutkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0687C9]" />
                  Konfirmasi Import
                </CardTitle>
                <CardDescription>
                  Tinjau data sebelum melakukan import ke dalam sistem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {importStatus === "importing" ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                    <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-1">Import Berhasil</h3>
                    <p className="text-green-700 mb-6">
                      {previewData.filter(row => row.isValid).length} data jadwal telah berhasil diimpor ke dalam sistem.
                    </p>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={resetImport}
                        className="bg-white border-green-300 text-green-700 hover:bg-green-50 mr-3"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Import Baru
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Lihat Jadwal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/40">
                      <div>
                        <p className="text-sm font-semibold mb-1">File Excel:</p>
                        <p className="text-sm">{selectedFile?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Ukuran File:</p>
                        <p className="text-sm">{selectedFile ? (selectedFile.size / 1024).toFixed(2) + " KB" : "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Jumlah Data:</p>
                        <p className="text-sm">{previewData.filter(row => row.isValid).length} jadwal valid dari total {previewData.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Tahun Akademik:</p>
                        <p className="text-sm">{academicYear || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Semester:</p>
                        <p className="text-sm capitalize">{semester || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Status:</p>
                        <p className="text-sm text-green-600 font-medium">Siap untuk diimport</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-medium">Ringkasan Data</h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-medium">Kategori</TableHead>
                              <TableHead className="font-medium">Jumlah</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Mata Kuliah</TableCell>
                              <TableCell>{new Set(previewData.map(row => row.courseCode)).size}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Dosen</TableCell>
                              <TableCell>{new Set(previewData.map(row => row.lecturer)).size}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Ruangan</TableCell>
                              <TableCell>{new Set(previewData.map(row => row.room)).size}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Kelas/Kelompok</TableCell>
                              <TableCell>{new Set(previewData.map(row => row.studentGroup)).size}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800">Peringatan</h4>
                          <p className="text-sm text-amber-700">
                            Proses import tidak dapat dibatalkan. Pastikan data dan pengaturan sudah benar sebelum melanjutkan.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <Button 
                        onClick={() => setActiveTab("settings")} 
                        variant="outline"
                      >
                        Kembali
                      </Button>
                      <Button 
                        onClick={handleImport} 
                        className="bg-[#0687C9] hover:bg-[#0670a8]"
                        disabled={isLoading || importStatus === "parsing" || importStatus === "validating"}
                      >
                        {isLoading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin">
                              <RefreshCw className="h-4 w-4" />
                            </span>
                            Mengimpor...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Import Sekarang
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                {importStatus === "importing" && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Proses import sedang berjalan...</span>
                      <span className="text-sm text-muted-foreground">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 
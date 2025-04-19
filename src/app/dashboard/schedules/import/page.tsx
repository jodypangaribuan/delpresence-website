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
  Info
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ImportSchedulePage() {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "validating" | "importing" | "success" | "error">("idle");
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const [semester, setSemester] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simulasi parsing file
      setTimeout(() => {
        simulateParseExcel();
      }, 1000);
    }
  };

  const simulateParseExcel = () => {
    setImportStatus("parsing");
    setImportProgress(20);
    
    // Simulasi data yang diparse dari Excel
    setTimeout(() => {
      setPreviewData([
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
      ]);
      
      setImportStatus("validating");
      setImportProgress(50);
      
      // Simulasi validasi
      setTimeout(() => {
        const errors = previewData.filter(row => !row.isValid);
        setImportErrors(errors);
        setActiveTab("preview");
        setImportStatus("idle");
        setImportProgress(70);
      }, 1500);
    }, 1500);
  };

  const handleImport = () => {
    if (importErrors.length > 0) {
      alert("Harap perbaiki semua kesalahan sebelum melanjutkan import.");
      return;
    }
    
    if (!semester || !academicYear) {
      alert("Harap pilih semester dan tahun akademik.");
      return;
    }
    
    setImportStatus("importing");
    setImportProgress(80);
    
    // Simulasi proses import
    setTimeout(() => {
      setImportStatus("success");
      setImportProgress(100);
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
          <TabsList>
            <TabsTrigger value="upload" className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> 
              <span>1. Upload File</span>
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={previewData.length === 0} className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>2. Preview & Validasi</span>
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={previewData.length === 0} className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>3. Pengaturan</span>
            </TabsTrigger>
            <TabsTrigger value="import" disabled={previewData.length === 0 || importErrors.length > 0} className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>4. Import</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0687C9]" />
                  Upload File Excel
                </CardTitle>
                <CardDescription>
                  Upload file Excel (.xlsx) yang berisi data jadwal perkuliahan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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
                      <div className="flex items-center bg-white px-4 py-2 rounded-md border mb-4">
                        <FileSpreadsheet className="h-5 w-5 text-[#0687C9] mr-2" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
                
                <div className="bg-muted rounded-lg p-6">
                  <h4 className="text-sm font-semibold mb-3 flex items-center text-[#0687C9]">
                    <Info className="mr-2 h-4 w-4" />
                    Petunjuk Format File
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Gunakan template yang disediakan
                    </li>
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Format hari: Senin, Selasa, Rabu, dsb
                    </li>
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Pastikan semua kolom wajib terisi
                    </li>
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Format jam: HH:MM - HH:MM
                    </li>
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Kode MK tidak boleh duplikat
                    </li>
                    <li className="flex items-start text-sm text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 mt-0.5 text-green-600">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Jangan ubah struktur atau nama sheet
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preview & Validasi Data</CardTitle>
                <CardDescription>
                  Periksa data jadwal yang akan diimpor dan perbaiki kesalahan jika ada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importErrors.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ditemukan {importErrors.length} kesalahan</AlertTitle>
                    <AlertDescription>
                      Terdapat beberapa kesalahan dalam data. Harap perbaiki sebelum melanjutkan.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="rounded-md border overflow-hidden mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Baris</TableHead>
                        <TableHead>Kode MK</TableHead>
                        <TableHead>Nama MK</TableHead>
                        <TableHead>Hari</TableHead>
                        <TableHead>Jam</TableHead>
                        <TableHead>Ruangan</TableHead>
                        <TableHead>Gedung</TableHead>
                        <TableHead>Dosen</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row) => (
                        <TableRow key={row.id} className={!row.isValid ? "bg-red-50" : ""}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.courseCode}</TableCell>
                          <TableCell>{row.courseName}</TableCell>
                          <TableCell className={row.errors?.includes("Format hari tidak valid") ? "text-red-500 font-medium" : ""}>
                            {row.day}
                          </TableCell>
                          <TableCell className={row.errors?.includes("Format waktu tidak valid") ? "text-red-500 font-medium" : ""}>
                            {row.time}
                          </TableCell>
                          <TableCell className={row.errors?.includes("Ruangan tidak boleh kosong") ? "text-red-500 font-medium" : ""}>
                            {row.room || "-"}
                          </TableCell>
                          <TableCell>{row.building}</TableCell>
                          <TableCell>{row.lecturer}</TableCell>
                          <TableCell>{row.studentGroup}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
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
                
                {importErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Detail Kesalahan:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {importErrors.map((error, index) => (
                        <li key={index}>
                          Baris {error.id}: {error.errors.join(", ")}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-red-700 mt-2">
                      Harap perbaiki file Excel Anda dan upload kembali.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("settings")}
                    disabled={importErrors.length > 0}
                  >
                    Lanjutkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Import</CardTitle>
                <CardDescription>
                  Tentukan semester dan tahun akademik untuk data yang akan diimport.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
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
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-6">
                  <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Penting!
                  </h4>
                  <p className="text-sm text-amber-700 mb-2">
                    Perhatikan hal-hal berikut sebelum melakukan import:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                    <li>Pastikan data yang akan diimport tidak duplikat dengan data yang sudah ada.</li>
                    <li>Proses import akan menambahkan data baru, bukan menggantikan data yang sudah ada.</li>
                    <li>Jika Anda ingin menggantikan data yang sudah ada, hapus data tersebut terlebih dahulu.</li>
                  </ul>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setActiveTab("preview")}>
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("import")}
                    disabled={!semester || !academicYear}
                  >
                    Lanjutkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Konfirmasi Import</CardTitle>
                <CardDescription>
                  Tinjau data sebelum melakukan import ke dalam sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted">
                    <div>
                      <p className="text-sm font-semibold">File Excel:</p>
                      <p className="text-sm">{selectedFile?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Ukuran File:</p>
                      <p className="text-sm">{selectedFile ? (selectedFile.size / 1024).toFixed(2) + " KB" : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Jumlah Data:</p>
                      <p className="text-sm">{previewData.length} jadwal</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Tahun Akademik:</p>
                      <p className="text-sm">{academicYear || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Semester:</p>
                      <p className="text-sm capitalize">{semester || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Status:</p>
                      <p className="text-sm text-green-600">Siap untuk diimport</p>
                    </div>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Konfirmasi Import</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      Anda akan mengimport {previewData.length} jadwal ke dalam sistem. Proses ini tidak dapat dibatalkan.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("settings")}>
                      Kembali
                    </Button>
                    <Button onClick={handleImport}>
                      Import Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  Printer,
  Search,
  FileSpreadsheet,
  File,
} from "lucide-react";

// Sample data for attendance reports
interface AttendanceReport {
  id: number;
  title: string;
  course_name: string;
  class_code: string;
  academic_year: string;
  semester: string;
  generated_date: string;
  type: "daily" | "weekly" | "monthly" | "semester";
  format: "pdf" | "excel" | "csv";
  status: "ready" | "processing";
}

const sampleReports: AttendanceReport[] = [
  {
    id: 1,
    title: "Laporan Kehadiran Harian Algoritma dan Pemrograman",
    course_name: "Algoritma dan Pemrograman",
    class_code: "IF-101-A",
    academic_year: "2023/2024",
    semester: "Ganjil",
    generated_date: "2023-04-15",
    type: "daily",
    format: "pdf",
    status: "ready",
  },
  {
    id: 2,
    title: "Laporan Kehadiran Mingguan Basis Data",
    course_name: "Basis Data",
    class_code: "IF-201-B",
    academic_year: "2023/2024",
    semester: "Ganjil",
    generated_date: "2023-04-16",
    type: "weekly",
    format: "excel",
    status: "ready",
  },
  {
    id: 3,
    title: "Laporan Kehadiran Bulanan Pemrograman Web",
    course_name: "Pemrograman Web",
    class_code: "IF-302-A",
    academic_year: "2023/2024",
    semester: "Ganjil",
    generated_date: "2023-04-17",
    type: "monthly",
    format: "pdf",
    status: "ready",
  },
  {
    id: 4,
    title: "Laporan Kehadiran Semester Kecerdasan Buatan",
    course_name: "Kecerdasan Buatan",
    class_code: "IF-401-C",
    academic_year: "2023/2024",
    semester: "Ganjil",
    generated_date: "2023-04-18",
    type: "semester",
    format: "excel",
    status: "processing",
  },
  {
    id: 5,
    title: "Laporan Kehadiran Harian Jaringan Komputer",
    course_name: "Jaringan Komputer",
    class_code: "IF-301-B",
    academic_year: "2023/2024",
    semester: "Ganjil",
    generated_date: "2023-04-19",
    type: "daily",
    format: "csv",
    status: "ready",
  },
];

export default function AttendanceReportsPage() {
  const [reports, setReports] = useState<AttendanceReport[]>(sampleReports);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

  // Filter reports based on search query and filters
  const filteredReports = reports.filter((report) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.class_code.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by report type
    const matchesType = !typeFilter || typeFilter === "all" || report.type === typeFilter;

    // Filter by file format
    const matchesFormat = !formatFilter || formatFilter === "all" || report.format === formatFilter;

    return matchesSearch && matchesType && matchesFormat;
  });

  // Get format badge based on report format
  const getFormatBadge = (format: string) => {
    switch (format) {
      case "pdf":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <File className="h-3 w-3" /> PDF
          </Badge>
        );
      case "excel":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-[#0687C9] flex items-center gap-1">
            <FileText className="h-3 w-3" /> CSV
          </Badge>
        );
    }
  };

  // Get status badge based on report status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-100 text-green-800">
            Siap Diunduh
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Sedang Diproses
          </Badge>
        );
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <FileText className="mr-2 h-6 w-6 text-[#0687C9]" />
                Laporan Kehadiran
              </CardTitle>
              <CardDescription className="mt-1">
                Unduh dan kelola laporan rekap kehadiran mahasiswa
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Printer className="h-4 w-4 mr-1" />
                Cetak
              </Button>
              <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
                <FileText className="h-4 w-4 mr-1" />
                Buat Laporan Baru
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan judul, mata kuliah, atau kelas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                onValueChange={(value) => setTypeFilter(value || null)}
                value={typeFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Jenis Laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select
                onValueChange={(value) => setFormatFilter(value || null)}
                value={formatFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Format File" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Format</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Laporan</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-sm text-gray-500">{report.course_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{report.class_code}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(report.generated_date).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getFormatBadge(report.format)}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {report.status === "ready" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-[#0687C9] border-[#0687C9]/20 hover:bg-[#0687C9]/10"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Unduh
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-gray-500 border-gray-200 cursor-not-allowed opacity-70"
                              disabled
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Unduh
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-gray-500"
                    >
                      Tidak ada laporan yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-1">
                  Ekspor Laporan Kehadiran
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Laporan dapat diekspor dalam berbagai format sesuai kebutuhan.
                  Pilih jenis laporan, rentang tanggal, dan format yang
                  diinginkan.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-blue-200 text-blue-700"
                  >
                    <File className="h-4 w-4 mr-1" />
                    Ekspor ke PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-green-200 text-green-700"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Ekspor ke Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-blue-200 text-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Ekspor ke CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
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
  BarChart3,
  Calendar,
  Download,
  FileText,
  Search,
  Users,
} from "lucide-react";

// Sample data for attendance summary
interface AttendanceSummary {
  id: number;
  course_name: string;
  class_code: string;
  lecturer: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  permission_count: number;
  date: string;
  semester: string;
}

const sampleAttendanceSummaries: AttendanceSummary[] = [
  {
    id: 1,
    course_name: "Algoritma dan Pemrograman",
    class_code: "IF-101-A",
    lecturer: "Dr. Budi Santoso",
    total_students: 35,
    present_count: 32,
    absent_count: 2,
    permission_count: 1,
    date: "2023-04-15",
    semester: "Ganjil 2023/2024",
  },
  {
    id: 2,
    course_name: "Basis Data",
    class_code: "IF-201-B",
    lecturer: "Dr. Siti Aminah",
    total_students: 40,
    present_count: 35,
    absent_count: 3,
    permission_count: 2,
    date: "2023-04-16",
    semester: "Ganjil 2023/2024",
  },
  {
    id: 3,
    course_name: "Pemrograman Web",
    class_code: "IF-302-A",
    lecturer: "Dr. Ahmad Fauzi",
    total_students: 30,
    present_count: 28,
    absent_count: 1,
    permission_count: 1,
    date: "2023-04-17",
    semester: "Ganjil 2023/2024",
  },
  {
    id: 4,
    course_name: "Kecerdasan Buatan",
    class_code: "IF-401-C",
    lecturer: "Dr. Maya Putri",
    total_students: 25,
    present_count: 22,
    absent_count: 3,
    permission_count: 0,
    date: "2023-04-18",
    semester: "Ganjil 2023/2024",
  },
  {
    id: 5,
    course_name: "Jaringan Komputer",
    class_code: "IF-301-B",
    lecturer: "Dr. Hendra Wijaya",
    total_students: 38,
    present_count: 34,
    absent_count: 2,
    permission_count: 2,
    date: "2023-04-19",
    semester: "Ganjil 2023/2024",
  },
];

export default function AttendanceSummaryPage() {
  const [summaries, setSummaries] = useState<AttendanceSummary[]>(sampleAttendanceSummaries);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [semesterFilter, setSemesterFilter] = useState<string | null>(null);

  // Filter summaries based on search query and filters
  const filteredSummaries = summaries.filter((summary) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      summary.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.class_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.lecturer.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by semester
    const matchesSemester =
      !semesterFilter || semesterFilter === "all" || summary.semester === semesterFilter;

    return matchesSearch && matchesSemester;
  });

  // Calculate attendance percentage
  const calculateAttendancePercentage = (present: number, total: number) => {
    return ((present / total) * 100).toFixed(1);
  };

  return (
    <div className="container p-4 mx-auto">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <BarChart3 className="mr-2 h-6 w-6 text-[#0687C9]" />
                Rekap Kehadiran
              </CardTitle>
              <CardDescription className="mt-1">
                Ringkasan kehadiran mahasiswa per kelas
              </CardDescription>
            </div>
            <Button className="bg-[#0687C9] hover:bg-[#0670a8]">
              <Download className="h-4 w-4 mr-1" />
              Unduh Laporan
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan mata kuliah, kelas, atau dosen..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-60">
              <Select
                onValueChange={(value) => setSemesterFilter(value || null)}
                value={semesterFilter || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  <SelectItem value="Ganjil 2023/2024">Ganjil 2023/2024</SelectItem>
                  <SelectItem value="Genap 2022/2023">Genap 2022/2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Dosen</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kehadiran</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map((summary) => (
                    <TableRow key={summary.id}>
                      <TableCell>{summary.course_name}</TableCell>
                      <TableCell>{summary.class_code}</TableCell>
                      <TableCell>{summary.lecturer}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(summary.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-green-600 font-medium">{summary.present_count}</span>
                          <span className="text-gray-400">/</span>
                          <span>{summary.total_students}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            parseInt(
                              calculateAttendancePercentage(
                                summary.present_count,
                                summary.total_students
                              )
                            ) >= 80
                              ? "bg-green-100 text-green-800"
                              : parseInt(
                                  calculateAttendancePercentage(
                                    summary.present_count,
                                    summary.total_students
                                  )
                                ) >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {calculateAttendancePercentage(
                            summary.present_count,
                            summary.total_students
                          )}
                          %
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[#0687C9]"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      Tidak ada data rekap kehadiran yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary Statistics Cards */}
            <Card className="bg-gradient-to-br from-[#0687C9]/10 to-[#0687C9]/20 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-[#0687C9]">Total Kelas</h3>
                  <FileText className="h-5 w-5 text-[#0687C9]" />
                </div>
                <div className="text-3xl font-bold text-[#0687C9]/90">
                  {filteredSummaries.length}
                </div>
                <div className="text-sm text-[#0687C9]/80 mt-1">Rekap kehadiran</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-green-800">Rata-rata Kehadiran</h3>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {(
                    filteredSummaries.reduce(
                      (sum, summary) =>
                        sum +
                        parseFloat(
                          calculateAttendancePercentage(
                            summary.present_count,
                            summary.total_students
                          )
                        ),
                      0
                    ) / (filteredSummaries.length || 1)
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-green-700 mt-1">Tingkat kehadiran</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-purple-800">Total Mahasiswa</h3>
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-900">
                  {filteredSummaries.reduce(
                    (sum, summary) => sum + summary.total_students,
                    0
                  )}
                </div>
                <div className="text-sm text-purple-700 mt-1">Terdaftar dalam kelas</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
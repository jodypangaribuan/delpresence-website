"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/utils/env";
import {
  Users,
  GraduationCap,
  ClipboardList,
  BarChart4,
  CalendarDays,
  Blocks,
  Building2,
  Settings,
  BookOpen,
  LucideIcon,
  Bell,
  UserPlus,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  BarChart2,
  School,
  Building,
  FileCheck,
  Clock,
  FileSpreadsheet,
  BookCopy,
  UserCheck,
  ScanFace,
  Layers,
  Library,
  FileText,
  UserCog,
  FileOutput,
  Loader2,
  UserCircle,
  UsersRound,
  DoorClosed
} from "lucide-react";
import Link from "next/link";

// Interfaces for API responses
interface StudyProgramWithStats {
  study_program: {
    id: number;
    name: string;
    code: string;
  };
  lecturer_count: number;
  student_count: number;
}

interface FacultyWithStats {
  faculty: {
    id: number;
    name: string;
    code: string;
  };
  program_count: number;
  lecturer_count: number;
}

interface BuildingWithStats {
  building: {
    id: number;
    name: string;
    code: string;
  };
  room_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProgramStudi: 0,
    totalFaculties: 0,
    totalBuildings: 0,
    totalRooms: 0,
    totalLecturers: 0,
    totalEmployees: 0,
    totalStudents: 0,
    totalStudentGroups: 0,
    totalCourses: 0,
    totalSchedules: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: 'Admin',
    role: 'Administrator'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchUserInfo();
  }, []);

  // Function to fetch user info
  const fetchUserInfo = async () => {
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!token) return;

      // Configuration for API requests
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/api/auth/me`, config);
      
      if (response.data && response.data.status === "success") {
        setUserInfo({
          name: response.data.data.name || 'Admin',
          role: response.data.data.role || 'Administrator'
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Function to fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!token) {
        toast.error("Anda harus login terlebih dahulu");
        return;
      }
      
      // Configuration for API requests
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Fetch all data in parallel
      const [
        studyProgramsResponse, 
        facultiesResponse, 
        buildingsResponse, 
        roomsResponse,
        lecturersResponse,
        employeesResponse,
        studentsResponse,
        studentGroupsResponse,
        coursesResponse,
        schedulesResponse
      ] = await Promise.all([
        axios.get(`${API_URL}/api/admin/study-programs?stats=true`, config),
        axios.get(`${API_URL}/api/admin/faculties?stats=true`, config),
        axios.get(`${API_URL}/api/admin/buildings?stats=true`, config),
        axios.get(`${API_URL}/api/admin/rooms`, config),
        axios.get(`${API_URL}/api/admin/lecturers?stats=true`, config),
        axios.get(`${API_URL}/api/admin/employees`, config),
        axios.get(`${API_URL}/api/admin/students`, config),
        axios.get(`${API_URL}/api/admin/student-groups`, config),
        axios.get(`${API_URL}/api/admin/courses`, config),
        axios.get(`${API_URL}/api/admin/schedules`, config)
      ]);
      
      // Helper function to extract count from API response
      const getCount = (response: any) => {
        if (!response || !response.data) return 0;
        
        // Case 1: API returns a data array directly
        if (response.data.status === "success" && Array.isArray(response.data.data)) {
          return response.data.data.length;
        }
        
        // Case 2: API returns a count property
        if (response.data.status === "success" && response.data.data && response.data.data.count !== undefined) {
          return response.data.data.count;
        }
        
        // Case 3: API returns a total property
        if (response.data.status === "success" && response.data.data && response.data.data.total !== undefined) {
          return response.data.data.total;
        }
        
        // Case 4: API returns the count in a meta object
        if (response.data.status === "success" && response.data.meta && response.data.meta.count !== undefined) {
          return response.data.meta.count;
        }
        
        // Case 5: Special case for lecturers endpoint
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data.length;
        }
        
        // Fallback to zero if no recognizable format
        return 0;
      };
      
      // Special handling for lecturers endpoint which might return data in a different format
      let lecturerCount = getCount(lecturersResponse);
      
      // If the count is still 0, try alternative ways to get the lecturer count
      if (lecturerCount === 0 && lecturersResponse && lecturersResponse.data) {
        // Try to access the data directly if it's an array
        if (Array.isArray(lecturersResponse.data)) {
          lecturerCount = lecturersResponse.data.length;
        }
        // Try to access nested data if it's in a different format
        else if (lecturersResponse.data.data && Array.isArray(lecturersResponse.data.data)) {
          lecturerCount = lecturersResponse.data.data.length;
        }
      }
      
      // Update statistics
      setStats({
        totalProgramStudi: getCount(studyProgramsResponse),
        totalFaculties: getCount(facultiesResponse),
        totalBuildings: getCount(buildingsResponse),
        totalRooms: getCount(roomsResponse),
        totalLecturers: lecturerCount,
        totalEmployees: getCount(employeesResponse),
        totalStudents: getCount(studentsResponse),
        totalStudentGroups: getCount(studentGroupsResponse),
        totalCourses: getCount(coursesResponse),
        totalSchedules: getCount(schedulesResponse)
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-[#002A5C] mb-2">Selamat Datang, {userInfo.name}</h1>
        <p className="text-gray-600">Kelola program studi, fakultas, dan data akademik dengan mudah di satu tempat.</p>
      </div>

      {/* Main Statistics */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-2 text-neutral-600">Memuat data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Program Studi" 
            value={stats.totalProgramStudi} 
            icon={<School className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Dosen" 
            value={stats.totalLecturers} 
            icon={<Users className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Mahasiswa" 
            value={stats.totalStudents} 
            icon={<GraduationCap className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Mata Kuliah" 
            value={stats.totalCourses} 
            icon={<BookOpen className="h-6 w-6 text-[#0687C9]" />} 
          />
        </div>
      )}
      
      {/* Second Row Statistics */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Fakultas" 
            value={stats.totalFaculties} 
            icon={<Building2 className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Gedung" 
            value={stats.totalBuildings} 
            icon={<Building className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Ruangan" 
            value={stats.totalRooms} 
            icon={<DoorClosed className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Jadwal" 
            value={stats.totalSchedules} 
            icon={<CalendarDays className="h-6 w-6 text-[#0687C9]" />} 
          />
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#002A5C] mb-4 border-b pb-2">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Management Card */}
          <QuickActionCard 
            title="Administrasi Akademik"
            icon={<School className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Kelola Program Studi", 
                icon: <School className="h-4 w-4" />, 
                href: "/dashboard/academic/study-programs" 
              },
              { 
                title: "Kelola Fakultas", 
                icon: <Building2 className="h-4 w-4" />, 
                href: "/dashboard/academic/faculties" 
              },
              { 
                title: "Kelola Tahun Akademik", 
                icon: <Calendar className="h-4 w-4" />, 
                href: "/dashboard/academic/academic-years" 
              }
            ]}
          />

          {/* Facilities Management Card */}
          <QuickActionCard 
            title="Fasilitas" 
            icon={<Building className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Kelola Gedung", 
                icon: <Building className="h-4 w-4" />, 
                href: "/dashboard/academic/buildings" 
              },
              { 
                title: "Kelola Ruangan", 
                icon: <DoorClosed className="h-4 w-4" />, 
                href: "/dashboard/academic/rooms" 
              }
            ]}
          />

          {/* Course Management Card */}
          <QuickActionCard 
            title="Manajemen Mata Kuliah" 
            icon={<BookOpen className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Kelola Mata Kuliah", 
                icon: <BookOpen className="h-4 w-4" />, 
                href: "/dashboard/courses/manage" 
              },
              { 
                title: "Penugasan Dosen", 
                icon: <UserCog className="h-4 w-4" />, 
                href: "/dashboard/courses/assignments" 
              }
            ]}
          />

          {/* Schedule Management Card */}
          <QuickActionCard 
            title="Manajemen Jadwal" 
            icon={<CalendarDays className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Jadwal Perkuliahan", 
                icon: <CalendarDays className="h-4 w-4" />, 
                href: "/dashboard/schedules/manage" 
              }
            ]}
          />

          {/* User Management - Lecturers and Employees */}
          <QuickActionCard 
            title="Manajemen Staf" 
            icon={<Users className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Daftar Dosen", 
                icon: <Users className="h-4 w-4" />, 
                href: "/dashboard/users/lecturers" 
              },
              { 
                title: "Daftar Pegawai", 
                icon: <UserCog className="h-4 w-4" />, 
                href: "/dashboard/users/employees" 
              }
            ]}
          />

          {/* User Management - Students */}
          <QuickActionCard 
            title="Manajemen Mahasiswa" 
            icon={<GraduationCap className="h-5 w-5 text-[#0687C9]" />}
            actions={[
              { 
                title: "Daftar Mahasiswa", 
                icon: <GraduationCap className="h-4 w-4" />, 
                href: "/dashboard/users/students" 
              },
              { 
                title: "Kelompok Mahasiswa", 
                icon: <Users className="h-4 w-4" />, 
                href: "/dashboard/users/student-groups" 
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="p-3">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-xl font-bold text-[#0687C9]">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  icon,
  actions
}: {
  title: string;
  icon: React.ReactNode;
  actions: {
    title: string;
    icon: React.ReactNode;
    href: string;
  }[];
}) {
  return (
    <Card className="p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center mb-3">
        <div className="mr-2">
          {icon}
        </div>
        <h3 className="font-medium text-[#002A5C]">{title}</h3>
      </div>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div className="flex items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors">
              <div className="p-1.5 rounded-md mr-3 text-[#0687C9]">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-neutral-700">{action.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
} 
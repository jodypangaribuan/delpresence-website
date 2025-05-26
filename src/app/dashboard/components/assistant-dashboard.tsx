"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/utils/env";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Users,
  CalendarDays,
  FileCheck,
  Loader2,
  UserCog,
  GraduationCap
} from "lucide-react";

export default function AssistantDashboard() {
  const [stats, setStats] = useState({
    upcomingClasses: 0,
    pendingAttendance: 0,
    totalStudents: 0,
    classesThisWeek: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: 'Asisten Dosen',
    role: 'Asisten Dosen'
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
          name: response.data.data.name || 'Asisten Dosen',
          role: response.data.data.role || 'Asisten Dosen'
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you would fetch actual data from API
      // For now, we'll use dummy data
      setTimeout(() => {
        setStats({
          upcomingClasses: 2,
          pendingAttendance: 3,
          totalStudents: 75,
          classesThisWeek: 5
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-black mb-2">Selamat Datang, {userInfo.name}</h1>
        <p className="text-gray-600">Kelola kehadiran dan bantuan perkuliahan dengan mudah di satu tempat.</p>
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
            title="Kelas Hari Ini" 
            value={stats.upcomingClasses} 
            icon={<Clock className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Absensi Belum Diproses" 
            value={stats.pendingAttendance} 
            icon={<ClipboardList className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Total Mahasiswa" 
            value={stats.totalStudents} 
            icon={<Users className="h-6 w-6 text-[#0687C9]" />} 
          />
          <StatCard 
            title="Kelas Minggu Ini" 
            value={stats.classesThisWeek} 
            icon={<CalendarDays className="h-6 w-6 text-[#0687C9]" />} 
          />
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-black mb-4 border-b pb-2">Manajemen Pengajaran</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <QuickActionCard
            title="Jadwal Mengajar"
            description="Lihat jadwal kelas yang Anda bantu"
            icon={<CalendarDays className="h-5 w-5" />}
            href="/dashboard/assistant/schedules"
          />
          <QuickActionCard
            title="Kelola Presensi"
            description="Kelola presensi mahasiswa"
            icon={<ClipboardList className="h-5 w-5" />}
            href="/dashboard/assistant/attendance"
          />
          <QuickActionCard
            title="Daftar Mahasiswa"
            description="Lihat daftar mahasiswa di kelas Anda"
            icon={<GraduationCap className="h-5 w-5" />}
            href="/dashboard/assistant/students"
          />
          <QuickActionCard
            title="Laporan Kehadiran"
            description="Lihat laporan kehadiran mahasiswa"
            icon={<FileCheck className="h-5 w-5" />}
            href="/dashboard/assistant/reports"
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
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const QuickActionCard = ({ title, description, icon, href }: QuickActionCardProps) => {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="bg-[#0687C9]/10 p-3 rounded-lg w-fit mb-3">
              <div className="text-[#0687C9]">{icon}</div>
            </div>
            <h3 className="font-semibold text-lg mb-1 text-black">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}; 
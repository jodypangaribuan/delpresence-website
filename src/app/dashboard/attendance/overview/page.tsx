"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  BarChart2,
  Users,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  Building2,
  School,
  ArrowUpRight,
  FileCheck,
} from "lucide-react";

export default function AttendanceOverviewPage() {
  const [stats] = useState({
    totalAttendanceToday: 486,
    totalAbsentToday: 32,
    totalPermissionToday: 18,
    attendanceRate: "94.2%",
    totalClasses: 24,
    currentActiveClasses: 5,
  });

  const [activeClasses] = useState([
    {
      id: 1,
      courseName: "Algoritma dan Pemrograman",
      lecturer: "Dr. Budi Santoso",
      time: "09:00 - 10:40",
      room: "R.301",
      totalStudents: 42,
      attendedStudents: 38,
      absents: 2,
      permissions: 2,
    },
    {
      id: 2,
      courseName: "Basis Data Lanjut",
      lecturer: "Dr. Siti Aminah",
      time: "10:50 - 12:30",
      room: "Lab Komputer 2",
      totalStudents: 36,
      attendedStudents: 34,
      absents: 1,
      permissions: 1,
    },
    {
      id: 3,
      courseName: "Jaringan Komputer",
      lecturer: "Prof. Andi Wijaya",
      time: "13:00 - 14:40",
      room: "R.401",
      totalStudents: 38,
      attendedStudents: 35,
      absents: 2,
      permissions: 1,
    },
    {
      id: 4,
      courseName: "Kecerdasan Buatan",
      lecturer: "Dr. Rina Mardiana",
      time: "15:00 - 16:40",
      room: "R.302",
      totalStudents: 45,
      attendedStudents: 42,
      absents: 2,
      permissions: 1,
    },
    {
      id: 5,
      courseName: "Pemrograman Web",
      lecturer: "Dr. Ahmad Fadli",
      time: "16:50 - 18:30",
      room: "Lab Komputer 1",
      totalStudents: 40,
      attendedStudents: 38,
      absents: 1,
      permissions: 1,
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#002A5C]">Tinjauan Kehadiran</h1>
        <p className="text-neutral-600">
          Pantau kehadiran mahasiswa secara real-time dan lihat status kehadiran per kelas.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard 
          title="Total Hadir"
          value={stats.totalAttendanceToday}
          icon={<CheckSquare className="h-5 w-5 text-green-600" />}
          color="green"
          className="md:col-span-2"
        />
        <StatCard 
          title="Absen"
          value={stats.totalAbsentToday}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="red"
        />
        <StatCard 
          title="Izin"
          value={stats.totalPermissionToday}
          icon={<FileCheck className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <StatCard 
          title="Tingkat Kehadiran"
          value={stats.attendanceRate}
          icon={<BarChart2 className="h-5 w-5 text-[#0687C9]" />}
          color="blue"
        />
        <StatCard 
          title="Kelas Aktif"
          value={stats.currentActiveClasses}
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Active Classes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#002A5C]">Kelas yang Sedang Berlangsung</h2>
          <div className="text-sm font-medium text-neutral-500">
            <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {activeClasses.map((classInfo) => (
            <ActiveClassCard key={classInfo.id} classInfo={classInfo} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickActionCard
            title="Lihat Rekap Kehadiran"
            description="Rekap kehadiran per mata kuliah"
            href="/dashboard/attendance/summary"
            icon={<BarChart2 className="h-5 w-5 text-[#0687C9]" />}
          />
          <QuickActionCard
            title="Verifikasi Izin"
            description="Kelola permohonan izin mahasiswa"
            href="/dashboard/attendance/permissions"
            icon={<FileCheck className="h-5 w-5 text-[#0687C9]" />}
          />
          <QuickActionCard
            title="Laporan Kehadiran"
            description="Generate laporan kehadiran"
            href="/dashboard/attendance/reports"
            icon={<FileCheck className="h-5 w-5 text-[#0687C9]" />}
          />
          <QuickActionCard
            title="Face Recognition"
            description="Kelola sistem pengenalan wajah"
            href="/dashboard/attendance/face-recognition"
            icon={<User className="h-5 w-5 text-[#0687C9]" />}
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
  icon,
  color = "blue",
  className = ""
}: { 
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "rose";
  className?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-[#0687C9]/20",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    purple: "bg-purple-50 border-purple-200",
    rose: "bg-rose-50 border-rose-200",
  };

  return (
    <Card className={`border p-4 ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}

// Active Class Card Component
function ActiveClassCard({ classInfo }: { classInfo: any }) {
  const attendancePercentage = Math.round((classInfo.attendedStudents / classInfo.totalStudents) * 100);
  
  return (
    <Card className="p-4 border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-grow">
          <div className="flex items-center mb-2">
            <BookOpen className="h-5 w-5 text-[#0687C9] mr-2" />
            <h3 className="font-medium text-neutral-800">{classInfo.courseName}</h3>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-8">
            <div className="flex items-center text-neutral-600 text-sm">
              <User className="h-4 w-4 mr-1" />
              <span>{classInfo.lecturer}</span>
            </div>
            <div className="flex items-center text-neutral-600 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>{classInfo.time}</span>
            </div>
            <div className="flex items-center text-neutral-600 text-sm">
              <Building2 className="h-4 w-4 mr-1" />
              <span>{classInfo.room}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4 md:space-x-6">
          <AttendanceStatus
            label="Hadir"
            value={classInfo.attendedStudents}
            total={classInfo.totalStudents}
            color="bg-green-500"
          />
          <AttendanceStatus
            label="Absen"
            value={classInfo.absents}
            total={classInfo.totalStudents}
            color="bg-red-500"
          />
          <AttendanceStatus
            label="Izin"
            value={classInfo.permissions}
            total={classInfo.totalStudents}
            color="bg-amber-500"
          />
          
          <Link
            href={`/dashboard/attendance/summary?class=${classInfo.id}`}
            className="flex items-center text-[#0687C9] text-sm font-medium hover:underline ml-2"
          >
            <span>Detail</span>
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

// Attendance Status Component
function AttendanceStatus({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number;
  color: string;
}) {
  const percentage = Math.round((value / total) * 100);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-medium text-neutral-600 mb-1">
        {label}
      </div>
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${color} mr-1`}></div>
        <span className="text-sm font-semibold">{value}/{total}</span>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all h-full">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-[#F5F7FA] mr-3">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-neutral-800">{title}</h3>
            <p className="text-xs text-neutral-600">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
} 
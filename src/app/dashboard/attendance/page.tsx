"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  BarChart2,
  BarChart4,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileOutput,
  ScanFace,
  SearchCheck,
  Users,
  ListChecks,
  Filter,
  LayoutDashboard,
  Clock,
  CalendarDays,
  PieChart,
  LineChart,
  UserRound,
  Building2,
  School,
  BookOpen,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function AttendancePage() {
  const [stats] = useState({
    totalAttendanceToday: 486,
    totalAbsentToday: 32,
    totalPermissionToday: 18,
    pendingVerifications: 7,
    totalClasses: 24,
    currentActiveClasses: 5,
    attendanceRate: "94.2%",
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#002A5C]">Manajemen Kehadiran</h1>
        <p className="text-neutral-600">
          Kelola dan pantau kehadiran mahasiswa, verifikasi izin, dan lihat laporan kehadiran.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Kehadiran Hari Ini"
          value={stats.totalAttendanceToday}
          icon={<CheckSquare className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard 
          title="Absensi Hari Ini"
          value={stats.totalAbsentToday}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="red"
        />
        <StatCard 
          title="Izin Belum Diverifikasi"
          value={stats.pendingVerifications}
          icon={<FileCheck className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <StatCard 
          title="Kelas Aktif"
          value={stats.currentActiveClasses}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          title="Tinjauan Kehadiran"
          description="Pantau kehadiran secara real-time, lihat status kehadiran per kelas dan mahasiswa"
          icon={<BarChart4 className="h-12 w-12 text-blue-600" />}
          href="/dashboard/attendance/overview"
          features={[
            "Dashboard real-time kehadiran",
            "Statistik mingguan & bulanan",
            "Status kehadiran per kelas"
          ]}
          color="blue"
        />

        <FeatureCard 
          title="Rekap Kehadiran"
          description="Lihat rekap kehadiran mahasiswa per mata kuliah, program studi, dan periode tertentu"
          icon={<BarChart2 className="h-12 w-12 text-purple-600" />}
          href="/dashboard/attendance/summary"
          features={[
            "Rekap per mata kuliah",
            "Rekap per program studi",
            "Filter berdasarkan periode"
          ]}
          color="purple"
        />

        <FeatureCard 
          title="Verifikasi Izin"
          description="Kelola dan verifikasi permohonan izin dari mahasiswa"
          icon={<FileCheck className="h-12 w-12 text-amber-600" />}
          href="/dashboard/attendance/permissions"
          features={[
            "Daftar izin yang menunggu",
            "Verifikasi dokumen pendukung",
            "Riwayat persetujuan izin"
          ]}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard 
          title="Laporan Kehadiran"
          description="Generate dan export laporan kehadiran dalam berbagai format"
          icon={<FileOutput className="h-12 w-12 text-green-600" />}
          href="/dashboard/attendance/reports"
          features={[
            "Laporan per semester",
            "Export ke Excel/PDF",
            "Laporan statistik kehadiran"
          ]}
          color="green"
        />

        <FeatureCard 
          title="Face Recognition"
          description="Kelola sistem pengenalan wajah untuk verifikasi kehadiran"
          icon={<ScanFace className="h-12 w-12 text-rose-600" />}
          href="/dashboard/attendance/face-recognition"
          features={[
            "Setup model pengenalan wajah",
            "Verifikasi gambar wajah",
            "Log kehadiran berbasis biometrik"
          ]}
          color="rose"
        />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLinkCard
            title="Persetujuan Izin"
            description={`${stats.pendingVerifications} permohonan menunggu`}
            href="/dashboard/attendance/permissions"
            icon={<FileCheck className="h-5 w-5 text-amber-600" />}
          />
          <QuickLinkCard
            title="Rekap Hari Ini"
            description="Lihat kehadiran hari ini"
            href="/dashboard/attendance/summary?filter=today"
            icon={<CalendarDays className="h-5 w-5 text-purple-600" />}
          />
          <QuickLinkCard
            title="Mata Kuliah Terendah"
            description="Mata kuliah dengan tingkat kehadiran terendah"
            href="/dashboard/attendance/summary?sort=lowest"
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          />
          <QuickLinkCard
            title="Export Laporan Bulanan"
            description="Generate laporan bulan ini"
            href="/dashboard/attendance/reports?period=month"
            icon={<FileOutput className="h-5 w-5 text-green-600" />}
          />
        </div>
      </div>

      {/* Related Features */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">
          Fitur Terkait
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RelatedFeatureCard
            title="Jadwal Perkuliahan"
            href="/dashboard/schedules/manage"
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
          />
          <RelatedFeatureCard
            title="Kelas Kuliah"
            href="/dashboard/courses/classes"
            icon={<Users className="h-5 w-5 text-green-600" />}
          />
          <RelatedFeatureCard
            title="Daftar Mahasiswa"
            href="/dashboard/users/students"
            icon={<UserRound className="h-5 w-5 text-amber-600" />}
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
  color = "blue" 
}: { 
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "rose";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    purple: "bg-purple-50 border-purple-200",
    rose: "bg-rose-50 border-rose-200",
  };

  return (
    <Card className={`p-6 border ${colorClasses[color]} rounded-lg shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-neutral-600">
            {title}
          </h3>
          <div className="mt-2">
            <span className="text-3xl font-bold text-neutral-800">
              {value}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-full bg-white`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Feature Card Component
function FeatureCard({
  title,
  description,
  icon,
  href,
  features,
  color = "blue"
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  features: string[];
  color?: "blue" | "green" | "red" | "amber" | "purple" | "rose";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    green: "bg-green-50 border-green-200 hover:bg-green-100",
    red: "bg-red-50 border-red-200 hover:bg-red-100",
    amber: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    rose: "bg-rose-50 border-rose-200 hover:bg-rose-100",
  };

  return (
    <Link href={href}>
      <Card className={`p-6 border ${colorClasses[color]} rounded-lg shadow-sm hover:shadow-md transition-all h-full`}>
        <div className="flex flex-col h-full">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-white mr-4 mb-4">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-1">{title}</h3>
              <p className="text-sm text-neutral-600 mb-4">{description}</p>
            </div>
          </div>
          
          <div className="mt-auto">
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Quick Link Card Component
function QuickLinkCard({
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
      <Card className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all">
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

// Related Feature Card Component
function RelatedFeatureCard({
  title,
  icon,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-[#F5F7FA] mr-3">
              {icon}
            </div>
            <h3 className="font-medium text-neutral-800">{title}</h3>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </div>
      </Card>
    </Link>
  );
} 
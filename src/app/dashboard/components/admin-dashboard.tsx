"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats] = useState({
    totalStudents: 1245,
    totalLecturers: 68,
    totalAssistants: 32,
    totalCourses: 96,
    totalRooms: 24,
    pendingRequests: 8,
    totalDepartments: 10,
    totalBuildings: 5,
    classesTodayActive: 24,
    pendingAttendance: 12,
    pendingPermissions: 5,
  });

  const [recentActivity] = useState([
    {
      id: 1,
      title: "Pengajuan Reschedule",
      description: "Dosen Algoritma meminta perubahan jadwal",
      time: "15 menit yang lalu",
      status: "pending",
    },
    {
      id: 2,
      title: "Tambahan Asisten",
      description: "Permintaan asisten baru Mata Kuliah Basis Data",
      time: "2 jam yang lalu",
      status: "approved",
    },
    {
      id: 3,
      title: "Perubahan Kurikulum",
      description: "Update Mata Kuliah Algoritma dan Pemrograman",
      time: "Kemarin, 10:24",
      status: "completed",
    },
  ]);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-l-4 border-l-primary border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-600">
                Total Mahasiswa
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neutral-800">
                  {stats.totalStudents}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-primary border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-600">
                Total Dosen
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neutral-800">
                  {stats.totalLecturers}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-green-500 border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-600">
                Kelas Aktif Hari Ini
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neutral-800">
                  {stats.classesTodayActive}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-green-500/10">
              <CalendarDays className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-amber-500 border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-neutral-600">
                Persetujuan Pending
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-neutral-800">
                  {stats.pendingPermissions}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-amber-500/10">
              <FileCheck className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Academic Overview & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-[#002A5C] mb-4">
            Aktivitas Terbaru
          </h2>
          <Card className="p-6 bg-white border border-neutral-100 rounded-lg">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        activity.status === "pending"
                          ? "bg-amber-100"
                          : activity.status === "approved"
                          ? "bg-blue-100"
                          : "bg-green-100"
                      }`}
                    >
                      {activity.status === "pending" ? (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      ) : activity.status === "approved" ? (
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Calendar className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {activity.description}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <div>
                    <button className="text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <Link
                href="/dashboard/activities"
                className="text-sm text-primary hover:underline font-medium"
              >
                Lihat semua aktivitas
              </Link>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#002A5C] mb-4">Akses Cepat</h2>
          <Card className="p-6 bg-white border border-neutral-100 rounded-lg">
            <div className="space-y-4">
              <QuickMenuItem
                title="Kelola Dosen"
                href="/dashboard/users/lecturers"
                icon={<GraduationCap className="h-4 w-4 text-primary" />}
              />
              <QuickMenuItem
                title="Kelola Mahasiswa"
                href="/dashboard/users/students"
                icon={<Users className="h-4 w-4 text-green-600" />}
              />
              <QuickMenuItem
                title="Jadwal Perkuliahan"
                href="/dashboard/schedules/manage"
                icon={<Calendar className="h-4 w-4 text-blue-600" />}
              />
              <QuickMenuItem
                title="Kelola Mata Kuliah"
                href="/dashboard/courses/manage"
                icon={<BookOpen className="h-4 w-4 text-amber-600" />}
              />
              <QuickMenuItem
                title="Verifikasi Izin"
                href="/dashboard/attendance/permissions"
                icon={<FileCheck className="h-4 w-4 text-red-600" />}
              />
              <QuickMenuItem
                title="Face Recognition"
                href="/dashboard/attendance/face-recognition"
                icon={<ScanFace className="h-4 w-4 text-purple-600" />}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Function Areas */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">
          Area Fungsi Utama
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <FeatureCard
            title="Manajemen Pengguna"
            description="Kelola dosen, pegawai dan mahasiswa"
            icon={<Users className="h-5 w-5 text-blue-600" />}
            href="/dashboard/users"
            textColor="text-blue-600"
          />
          <FeatureCard
            title="Manajemen Akademik"
            description="Program studi, kurikulum, fakultas"
            icon={<School className="h-5 w-5 text-green-600" />}
            href="/dashboard/academic"
            textColor="text-green-600"
          />
          <FeatureCard
            title="Manajemen Mata Kuliah"
            description="Mata kuliah, kelas, penugasan"
            icon={<BookOpen className="h-5 w-5 text-amber-600" />}
            href="/dashboard/courses"
            textColor="text-amber-600"
          />
          <FeatureCard
            title="Manajemen Jadwal"
            description="Jadwal, konflik, persetujuan reschedule"
            icon={<Calendar className="h-5 w-5 text-indigo-600" />}
            href="/dashboard/schedules"
            textColor="text-indigo-600"
          />
          <FeatureCard
            title="Manajemen Kehadiran"
            description="Presensi, izin, face recognition"
            icon={<ClipboardList className="h-5 w-5 text-red-600" />}
            href="/dashboard/attendance"
            textColor="text-red-600"
          />
        </div>
      </div>
      
      {/* Common Tasks */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">
          Tugas Umum
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CommonTaskCard 
            title="Akademik"
            tasks={[
              { name: "Program Studi", icon: <School className="h-4 w-4" />, href: "/dashboard/academic/departments" },
              { name: "Kurikulum", icon: <BookCopy className="h-4 w-4" />, href: "/dashboard/academic/curriculum" },
              { name: "Fakultas", icon: <Building className="h-4 w-4" />, href: "/dashboard/academic/faculty" },
              { name: "Tahun Akademik", icon: <Calendar className="h-4 w-4" />, href: "/dashboard/academic/years" },
            ]}
          />
          
          <CommonTaskCard 
            title="Jadwal & Kelas"
            tasks={[
              { name: "Mata Kuliah", icon: <BookOpen className="h-4 w-4" />, href: "/dashboard/courses/manage" },
              { name: "Jadwal Perkuliahan", icon: <Calendar className="h-4 w-4" />, href: "/dashboard/schedules/manage" },
              { name: "Kelas Kuliah", icon: <Users className="h-4 w-4" />, href: "/dashboard/courses/classes" },
              { name: "Penugasan Dosen", icon: <UserCog className="h-4 w-4" />, href: "/dashboard/courses/assignments" },
            ]}
          />
          
          <CommonTaskCard 
            title="Presensi"
            tasks={[
              { name: "Rekap Kehadiran", icon: <BarChart2 className="h-4 w-4" />, href: "/dashboard/attendance/summary" },
              { name: "Verifikasi Izin", icon: <FileCheck className="h-4 w-4" />, href: "/dashboard/attendance/permissions" },
              { name: "Laporan Kehadiran", icon: <FileOutput className="h-4 w-4" />, href: "/dashboard/attendance/reports" },
              { name: "Face Recognition", icon: <ScanFace className="h-4 w-4" />, href: "/dashboard/attendance/face-recognition" },
            ]}
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">
          Statistik Akademik
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Program Studi"
            value={stats.totalDepartments}
            icon={<School className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Total Mata Kuliah"
            value={stats.totalCourses}
            icon={<BookOpen className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Total Gedung"
            value={stats.totalBuildings}
            icon={<Building className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Total Ruangan"
            value={stats.totalRooms}
            icon={<Building2 className="h-5 w-5 text-primary" />}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  href,
  textColor,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  textColor: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 bg-white border border-neutral-100 hover:shadow-md transition-all rounded-lg h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center">
            <div className={`p-2 rounded-full bg-[#E6F3FB]`}>{icon}</div>
            <h3 className={`ml-3 font-medium ${textColor}`}>{title}</h3>
          </div>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
        </div>
      </Card>
    </Link>
  );
}

function QuickMenuItem({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors">
        <div className="p-1.5 rounded-md bg-[#E6F3FB] mr-3">{icon}</div>
        <span className="text-sm font-medium text-neutral-700">{title}</span>
      </div>
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon,
  isText = false,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isText?: boolean;
}) {
  return (
    <Card className="p-5 bg-white border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
          <p className={`text-lg font-bold text-neutral-800 ${isText ? "" : ""}`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function CommonTaskCard({
  title,
  tasks,
}: {
  title: string;
  tasks: { name: string; icon: React.ReactNode; href: string }[];
}) {
  return (
    <Card className="p-5 bg-white border border-neutral-100 hover:shadow-sm transition-all rounded-lg">
      <h3 className="font-medium text-[#002A5C] mb-3">{title}</h3>
      <div className="space-y-2">
        {tasks.map((task, index) => (
          <Link href={task.href} key={index}>
            <div className="flex items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors">
              <div className="p-1.5 rounded-md bg-[#E6F3FB] mr-3">{task.icon}</div>
              <span className="text-sm font-medium text-neutral-700">{task.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
} 
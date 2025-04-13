"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  ClipboardList,
  BarChart2,
  UserCog,
  Building,
  FileOutput,
  FileSpreadsheet,
  AlertTriangle,
  GraduationCap,
  School,
  Layers,
  BookCopy,
  LibrarySquare,
  Building2,
  Settings,
  QrCode,
  CalendarDays,
  BarChart4,
  Microscope,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { getUserRole, UserRole } from "@/app/dashboard/page";
import { useEffect, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const isLinkActive = (path: string) => {
    if (
      path === "/dashboard" &&
      (pathname === "/" || pathname === "/dashboard")
    ) {
      return true;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const isDashboardActive = () => {
    return pathname === "/dashboard" || pathname === "/";
  };

  return (
    <aside className="h-full w-[240px] bg-white border-r border-neutral-200 fixed left-0 top-0 z-20 overflow-y-auto" data-pathname={pathname}>
      <div className="flex h-16 items-center justify-center bg-white">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={90}
            height={10}
            className="object-contain"
          />
        </Link>
      </div>

      <nav className="px-3 py-4">
        {/* Dashboard Menu */}
        <div className="mb-2">
          <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
            Menu Utama
          </p>
        </div>
        <ul className="space-y-1 mb-6">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                isDashboardActive()
                  ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                  : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
              }`}
            >
              <LayoutDashboard
                className={`mr-3 h-5 w-5 ${
                  isDashboardActive()
                    ? "text-[#0687C9]"
                    : "text-neutral-600 group-hover:text-[#0687C9]"
                }`}
              />
              Dashboard
            </Link>
          </li>
        </ul>

        {/* Academic Management */}
        <div className="mb-2">
          <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
            Manajemen Akademik
          </p>
        </div>
        <ul className="space-y-1 mb-6">
          <li>
            <Link
              href="/dashboard/courses"
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                isLinkActive("/dashboard/courses")
                  ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                  : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
              }`}
            >
              <BookOpen
                className={`mr-3 h-5 w-5 ${
                  isLinkActive("/dashboard/courses")
                    ? "text-[#0687C9]"
                    : "text-neutral-600 group-hover:text-[#0687C9]"
                }`}
              />
              Mata Kuliah
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/schedules"
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                isLinkActive("/dashboard/schedules")
                  ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                  : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
              }`}
            >
              <Calendar
                className={`mr-3 h-5 w-5 ${
                  isLinkActive("/dashboard/schedules")
                    ? "text-[#0687C9]"
                    : "text-neutral-600 group-hover:text-[#0687C9]"
                }`}
              />
              Jadwal
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/attendance"
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                isLinkActive("/dashboard/attendance")
                  ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                  : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
              }`}
            >
              <ClipboardList
                className={`mr-3 h-5 w-5 ${
                  isLinkActive("/dashboard/attendance")
                    ? "text-[#0687C9]"
                    : "text-neutral-600 group-hover:text-[#0687C9]"
                }`}
              />
              Kehadiran
            </Link>
          </li>
        </ul>

        {/* Admin-specific menu items */}
        {userRole === UserRole.ADMIN && (
          <>
            {/* Academic Administration */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Administrasi Akademik
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/academic/departments"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/departments")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <School
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/departments")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Program Studi
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/academic/buildings"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/buildings")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Building
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/buildings")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Gedung
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/academic/semesters"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/semesters")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Calendar
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/semesters")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Tahun Akademik
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/academic/curriculum"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/curriculum")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <BookCopy
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/curriculum")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Kurikulum
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/courses/groups"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/courses/groups")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Layers
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/courses/groups")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Kelompok Matakuliah
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/rooms"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/rooms")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <LibrarySquare
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/rooms")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Ruangan
                </Link>
              </li>
            </ul>

            {/* Schedule Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Jadwal
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/schedules/manage"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/schedules/manage")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Calendar
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/schedules/manage")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Jadwal Perkuliahan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/schedules/import"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/schedules/import")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <FileSpreadsheet
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/schedules/import")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Import Excel
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/schedules/rooms"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/schedules/rooms")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Building
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/schedules/rooms")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Penjadwalan Ruangan
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/schedules/conflicts"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/schedules/conflicts")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <AlertTriangle
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/schedules/conflicts")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Pengecekan Konflik
                </Link>
              </li>
            </ul>

            {/* Attendance Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Kehadiran
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/attendance/summary"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/attendance/summary")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <BarChart2
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/attendance/summary")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Rekap Kehadiran
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/attendance/reports"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/attendance/reports")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <FileOutput
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/attendance/reports")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Laporan Kehadiran
                </Link>
              </li>
            </ul>

            {/* User Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Pengguna
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/academic/lecturers"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/lecturers")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Users
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/lecturers")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Daftar Dosen
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/academic/assistants"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/assistants")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <UserCog
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/assistants")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Daftar Asisten Dosen
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/academic/students"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/academic/students")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <GraduationCap
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/academic/students")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Daftar Mahasiswa
                </Link>
              </li>
            </ul>
          </>
        )}

        {/* Lecturer-specific menu items */}
        {userRole === UserRole.LECTURER && (
          <>
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Menu Dosen
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/lecturer/schedules"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/schedules")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Calendar
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/schedules")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Jadwal Pribadi
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/attendance"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/attendance")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <ClipboardList
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/attendance")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Daftar Hadir Mahasiswa
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/manual-attendance"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/manual-attendance")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <UserCheck
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/manual-attendance")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Input Kehadiran Manual
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/attendance-summary"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/attendance-summary")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <BarChart2
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/attendance-summary")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Rekap Kehadiran
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/reschedule"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/reschedule")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <CalendarDays
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/reschedule")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Pengajuan Kelas Pengganti
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/announcements"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/announcements")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <MessageSquare
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/announcements")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Pengumuman Kelas
                </Link>
              </li>
            </ul>

            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Tools Tambahan
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/lecturer/qr-generate"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/qr-generate")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <QrCode
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/qr-generate")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Generate QR Code
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/lecturer/export"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/lecturer/export")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <FileOutput
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/lecturer/export")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Export Kehadiran
                </Link>
              </li>
            </ul>
          </>
        )}

        {/* Assistant-specific menu items */}
        {userRole === UserRole.ASSISTANT && (
          <>
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Menu Asisten
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/assistant/schedules"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/schedules")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Calendar
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/schedules")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Jadwal Asistensi
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/assistant/attendance"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/attendance")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <ClipboardList
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/attendance")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Kehadiran Praktikum
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/assistant/attendance-summary"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/attendance-summary")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <BarChart2
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/attendance-summary")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Rekap Kehadiran
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/assistant/collaboration"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/collaboration")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <Users
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/collaboration")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Kolaborasi Dosen
                </Link>
              </li>
            </ul>

            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Tools Tambahan
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <li>
                <Link
                  href="/dashboard/assistant/qr-generate"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/qr-generate")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <QrCode
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/qr-generate")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Generate QR Code
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/assistant/export"
                  className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
                    isLinkActive("/dashboard/assistant/export")
                      ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
                      : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
                  }`}
                >
                  <FileOutput
                    className={`mr-3 h-5 w-5 ${
                      isLinkActive("/dashboard/assistant/export")
                        ? "text-[#0687C9]"
                        : "text-neutral-600 group-hover:text-[#0687C9]"
                    }`}
                  />
                  Export Kehadiran
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
} 
"use client";

import React from "react";
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
  ScanFace,
  UserCheck,
  MessageSquare,
  Smartphone,
  FileCheck,
  LucideProps,
  DoorClosed
} from "lucide-react";
import { getUserRole, UserRole } from "@/app/dashboard/page";
import { useEffect, useState } from "react";
import LoadingLink from "@/components/ui/LoadingLink";

// Create customized icons with consistent size
const createSidebarIcon = (Icon: React.ComponentType<LucideProps>) => {
  return (props: LucideProps) => <Icon size={20} strokeWidth={2} {...props} />;
};

// Create sized variants of all icons
const SidebarIcons = {
  LayoutDashboard: createSidebarIcon(LayoutDashboard),
  BookOpen: createSidebarIcon(BookOpen),
  Calendar: createSidebarIcon(Calendar),
  Users: createSidebarIcon(Users),
  ClipboardList: createSidebarIcon(ClipboardList),
  BarChart2: createSidebarIcon(BarChart2),
  UserCog: createSidebarIcon(UserCog),
  Building: createSidebarIcon(Building),
  FileOutput: createSidebarIcon(FileOutput),
  FileSpreadsheet: createSidebarIcon(FileSpreadsheet),
  AlertTriangle: createSidebarIcon(AlertTriangle),
  GraduationCap: createSidebarIcon(GraduationCap),
  School: createSidebarIcon(School),
  Layers: createSidebarIcon(Layers),
  BookCopy: createSidebarIcon(BookCopy),
  LibrarySquare: createSidebarIcon(LibrarySquare),
  Building2: createSidebarIcon(Building2),
  Settings: createSidebarIcon(Settings),
  QrCode: createSidebarIcon(QrCode),
  CalendarDays: createSidebarIcon(CalendarDays),
  BarChart4: createSidebarIcon(BarChart4),
  Microscope: createSidebarIcon(Microscope),
  ScanFace: createSidebarIcon(ScanFace),
  UserCheck: createSidebarIcon(UserCheck),
  MessageSquare: createSidebarIcon(MessageSquare),
  Smartphone: createSidebarIcon(Smartphone),
  FileCheck: createSidebarIcon(FileCheck),
  DoorClosed: createSidebarIcon(DoorClosed),
};

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Add dependency on pathname to re-validate role when pathname changes
  useEffect(() => {
    const fetchUserRole = () => {
      const role = getUserRole();
      setUserRole(role);
      console.log("[Sidebar] Current user role:", role);
    };
    
    // Re-fetch user role on pathname changes to ensure fresh data
    fetchUserRole();
  }, [pathname]);

  const isLinkActive = (path: string) => {
    if (path === "/dashboard") {
      // Only consider dashboard active if we're exactly at /dashboard or /
      return pathname === "/dashboard" || pathname === "/";
    }
    // For all other paths, check if the current pathname starts with the path
    return pathname.startsWith(`${path}`);
  };

  const isDashboardActive = () => {
    // Only return true for exact matches to avoid double selection
    return pathname === "/dashboard" || pathname === "/";
  };

  // Helper function to create menu links with loading animation
  const MenuLink = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const active = isLinkActive(href);
    
    return (
      <li>
        <LoadingLink
          href={href}
          className={`flex items-center rounded-lg px-3 py-2 text-sm transition-all group ${
            active
              ? "bg-[#0687C9]/10 text-[#0687C9] font-medium"
              : "text-neutral-600 hover:bg-[#0687C9]/10 hover:text-[#0687C9]"
          }`}
          isActive={active}
        >
          <div className={`mr-3 h-6 w-6 flex items-center justify-center ${
            active
              ? "text-[#0687C9]"
              : "text-neutral-600 group-hover:text-[#0687C9]"
          }`}>
            {icon}
          </div>
          {children}
        </LoadingLink>
      </li>
    );
  };

  return (
    <aside className="h-full w-[260px] bg-white border-r border-neutral-200 fixed left-0 top-0 z-20 overflow-y-auto" data-pathname={pathname}>
      <div className="flex h-16 items-center justify-center bg-white">
        <LoadingLink href="/dashboard" className="hover:opacity-80 transition-opacity">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={90}
            height={10}
            className="object-contain"
          />
        </LoadingLink>
      </div>

      <nav className="px-3 py-4">
        {/* Dashboard Menu */}
        <div className="mb-2">
          <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
            Menu Utama
          </p>
        </div>
        <ul className="space-y-1 mb-6">
          <MenuLink 
            href="/dashboard"
            icon={<SidebarIcons.LayoutDashboard />}
          >
            Dashboard
          </MenuLink>
        </ul>

        {/* Only show the general Academic Management section if NOT an admin */}
        {userRole !== UserRole.ADMIN && userRole !== UserRole.LECTURER && userRole !== UserRole.ASSISTANT && (
          <>
            {/* Academic Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Akademik
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/courses"
                icon={<SidebarIcons.BookOpen />}
              >
                Mata Kuliah
              </MenuLink>
              <MenuLink
                href="/dashboard/schedules"
                icon={<SidebarIcons.Calendar />}
              >
                Jadwal
              </MenuLink>
              <MenuLink
                href="/dashboard/attendance"
                icon={<SidebarIcons.ClipboardList />}
              >
                Kehadiran
              </MenuLink>
            </ul>
          </>
        )}

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
              <MenuLink
                href="/dashboard/academic/study-programs"
                icon={<SidebarIcons.School />}
              >
                Program Studi
              </MenuLink>
              <MenuLink
                href="/dashboard/academic/faculties"
                icon={<SidebarIcons.Building2 />}
              >
                Fakultas
              </MenuLink>
              <MenuLink
                href="/dashboard/academic/buildings"
                icon={<SidebarIcons.Building />}
              >
                Gedung
              </MenuLink>
              <MenuLink
                href="/dashboard/academic/rooms"
                icon={<SidebarIcons.DoorClosed />}
              >
                Ruangan
              </MenuLink>
              <MenuLink
                href="/dashboard/academic/academic-years"
                icon={<SidebarIcons.Calendar />}
              >
                Tahun Akademik
              </MenuLink>
            </ul>

            {/* Course Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Mata Kuliah
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/courses/manage"
                icon={<SidebarIcons.BookOpen />}
              >
                Mata Kuliah
              </MenuLink>
              <MenuLink
                href="/dashboard/courses/groups"
                icon={<SidebarIcons.Layers />}
              >
                Kelompok Mata Kuliah
              </MenuLink>
              <MenuLink
                href="/dashboard/courses/assignments"
                icon={<SidebarIcons.UserCog />}
              >
                Penugasan Dosen
              </MenuLink>
            </ul>

            {/* Schedule Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Jadwal
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/schedules/manage"
                icon={<SidebarIcons.Calendar />}
              >
                Jadwal Perkuliahan
              </MenuLink>
              <MenuLink
                href="/dashboard/schedules/import"
                icon={<SidebarIcons.FileSpreadsheet />}
              >
                Import Excel
              </MenuLink>
              <MenuLink
                href="/dashboard/schedules/export"
                icon={<SidebarIcons.FileOutput />}
              >
                Export Excel
              </MenuLink>
            </ul>

            {/* User Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Pengguna
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/users/lecturers"
                icon={<SidebarIcons.Users />}
              >
                Daftar Dosen
              </MenuLink>
              <MenuLink
                href="/dashboard/users/employees"
                icon={<SidebarIcons.UserCog />}
              >
                Daftar Pegawai
              </MenuLink>
              <MenuLink
                href="/dashboard/users/students"
                icon={<SidebarIcons.GraduationCap />}
              >
                Daftar Mahasiswa
              </MenuLink>
              <MenuLink
                href="/dashboard/users/student-groups"
                icon={<SidebarIcons.Users />}
              >
                Kelompok Mahasiswa
              </MenuLink>
            </ul>
          </>
        )}

        {/* Lecturer-specific menu items */}
        {userRole === UserRole.LECTURER && (
          <>
            {/* Course Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Mata Kuliah
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/lecturer/courses"
                icon={<SidebarIcons.BookOpen />}
              >
                Mata Kuliah Saya
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/classes"
                icon={<SidebarIcons.Users />}
              >
                Kelas Saya
              </MenuLink>
            </ul>

            {/* Schedule Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Jadwal
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/lecturer/schedules"
                icon={<SidebarIcons.Calendar />}
              >
                Jadwal Mengajar
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/reschedule"
                icon={<SidebarIcons.CalendarDays />}
              >
                Pengajuan Kelas Pengganti
              </MenuLink>
            </ul>

            {/* Attendance Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Kehadiran
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/lecturer/attendance/manage"
                icon={<SidebarIcons.ClipboardList />}
              >
                Kelola Presensi
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/attendance/qr"
                icon={<SidebarIcons.QrCode />}
              >
                Generate QR Presensi
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/attendance/face"
                icon={<SidebarIcons.ScanFace />}
              >
                Aktivasi Face Recognition
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/attendance/summary"
                icon={<SidebarIcons.BarChart2 />}
              >
                Rekap Kehadiran
              </MenuLink>
              <MenuLink
                href="/dashboard/lecturer/attendance/permissions"
                icon={<SidebarIcons.FileCheck />}
              >
                Izin Mahasiswa
              </MenuLink>
            </ul>

            {/* Communication */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Komunikasi
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/lecturer/announcements"
                icon={<SidebarIcons.MessageSquare />}
              >
                Pengumuman Kelas
              </MenuLink>
            </ul>
          </>
        )}

        {/* Assistant-specific menu items */}
        {userRole === UserRole.ASSISTANT && (
          <>
            {/* Course Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Mata Kuliah
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/assistant/courses"
                icon={<SidebarIcons.BookOpen />}
              >
                Mata Kuliah Asisten
              </MenuLink>
              <MenuLink
                href="/dashboard/assistant/classes"
                icon={<SidebarIcons.Users />}
              >
                Kelas Asisten
              </MenuLink>
            </ul>

            {/* Schedule Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Jadwal
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/assistant/schedules"
                icon={<SidebarIcons.Calendar />}
              >
                Jadwal Asistensi
              </MenuLink>
            </ul>

            {/* Attendance Management */}
            <div className="mb-2">
              <p className="px-3 py-2 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                Manajemen Kehadiran
              </p>
            </div>
            <ul className="space-y-1 mb-6">
              <MenuLink
                href="/dashboard/assistant/attendance/manage"
                icon={<SidebarIcons.ClipboardList />}
              >
                Kelola Presensi
              </MenuLink>
              <MenuLink
                href="/dashboard/assistant/attendance/qr"
                icon={<SidebarIcons.QrCode />}
              >
                Generate QR Presensi
              </MenuLink>
              <MenuLink
                href="/dashboard/assistant/attendance/summary"
                icon={<SidebarIcons.BarChart2 />}
              >
                Rekap Kehadiran
              </MenuLink>
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
} 
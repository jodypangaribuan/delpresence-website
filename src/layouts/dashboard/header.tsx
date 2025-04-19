"use client";

import { 
  Bell, 
  Menu, 
  Search,
  Calendar as CalendarIcon,
  HelpCircle,
  User as UserIcon,
  ChevronDown,
  LogOut, 
  Settings,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/authContext";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DayProps } from "react-day-picker";

interface HeaderProps {
  onMenuClick: () => void;
}

// Holiday interface for Nager.Date API
interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

// Memisahkan komponen CalendarDisplay menjadi komponen terpisah untuk mencegah render ulang
const CalendarDisplay = memo(function CalendarDisplay() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={calendarRef}>
      <button
        className="rounded-full p-2 hover:bg-[#E6F3FB] hidden md:flex items-center"
        title="Lihat Kalender"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <CalendarIcon className="h-5 w-5 text-[#0687C9]" />
      </button>
      {isCalendarOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg p-4 border border-neutral-100 z-50 min-w-[280px]">
          <div className="text-sm font-medium mb-3">Kalender</div>
          <div className="p-2 text-center text-sm border rounded-md bg-neutral-50">
            <div className="font-medium text-neutral-800">{format(new Date(), "MMMM yyyy", { locale: id })}</div>
            <div className="mt-1 text-xs text-neutral-600">Kalender lengkap akan tersedia segera</div>
          </div>
          <div className="mt-2 text-xs text-primary text-center">
            Hari ini: {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </div>
        </div>
      )}
    </div>
  );
});

// Memisahkan komponen ProfileMenu menjadi komponen terpisah untuk mencegah render ulang
const ProfileMenu = memo(function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userRole = user?.role || "";

  const getFullName = () => {
    return user?.name || user?.username || "Pengguna";
  };

  const getRoleText = () => {
    switch (userRole) {
      case "Admin":
        return "Administrator";
      case "Dosen":
        return "Dosen";
      case "Asisten Dosen":
        return "Asisten Dosen";
      case "Pegawai":
        return "Pegawai";
      case "Mahasiswa":
        return "Mahasiswa";
      default:
        return "Pengguna";
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200 hover:bg-[#E6F3FB] rounded-lg p-1.5 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="hidden md:block text-right min-w-[120px]">
          <div className="text-sm font-medium text-neutral-800">{getFullName()}</div>
          <div className="text-xs text-neutral-600">{getRoleText()}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E6F3FB] text-[#0687C9]">
          <UserIcon className="h-5 w-5" />
        </div>
        <ChevronDown className="h-4 w-4 text-neutral-500 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-md bg-white shadow-lg border border-neutral-100 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-800">{getFullName()}</p>
              <p className="text-xs text-neutral-600">{getRoleText()}</p>
            </div>
            <Link
              href="/dashboard/settings/profile"
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-[#E6F3FB] w-full text-left flex items-center block"
            >
              <Settings className="mr-2 h-4 w-4 text-neutral-500" />
              Pengaturan Akun
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-neutral-700 hover:bg-[#E6F3FB] w-full text-left flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4 text-neutral-500" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// Notifications component
const NotificationsMenu = memo(function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState([
    {
      id: 1,
      title: "Jadwal Diubah",
      message: "Kelas Algoritma dipindahkan ke Ruang 2.3",
      time: "Baru saja",
      read: false,
    },
    {
      id: 2,
      title: "Pengumuman Sistem",
      message: "Sistem akan diperbarui pada tanggal 15 Agustus 2023",
      time: "2 jam yang lalu",
      read: true,
    },
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={menuRef}>
          <button
        className="relative rounded-full p-2 hover:bg-[#E6F3FB]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-[#0687C9]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500"></span>
              )}
            </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg border border-neutral-100 z-50">
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">
                      Notifikasi
                    </h3>
              <button className="text-xs text-primary hover:text-primary/80">
                      Tandai semua dibaca
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start rounded-md p-2 ${
                    notification.read ? "" : "bg-[#E6F3FB]"
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                          ? "text-neutral-700"
                          : "text-neutral-900"
                            }`}
                          >
                            {notification.title}
                          </p>
                    <p className="text-xs text-neutral-600">
                            {notification.message}
                          </p>
                    <p className="mt-1 text-xs text-neutral-500">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-center border-t border-gray-100 pt-3">
                    <Link
                      href="/dashboard/notifications"
                className="text-xs text-[#0687C9] hover:text-[#056ba0]"
                    >
                      Lihat Semua Notifikasi
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
  );
});

export function Header({ onMenuClick }: HeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update current date time every second
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatDate = (date: Date): string => {
    return format(date, "EEEE, d MMMM yyyy", { locale: id });
  };

  const formatTime = (date: Date): string => {
    return format(date, "HH:mm:ss", { locale: id });
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side: Menu button (mobile), Campus Logo and DateTime */}
        <div className="flex items-center gap-2">
          {/* Menu button - only on mobile */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-[#E6F3FB] md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo - only on mobile */}
          <div className="mr-6 md:hidden">
            <Image
              src="/images/logo2.png"
              alt="Logo"
              width={130}
              height={32}
              className="h-8 w-auto"
            />
          </div>

          {/* Date & Time Information */}
          <div className="hidden md:block">
            <Link href="/dashboard" className="group cursor-pointer">
              <h2 className="text-lg font-medium text-[#002A5C] group-hover:text-primary transition-colors">
                Selamat datang di DelPresence Management System
              </h2>
              <p className="text-sm text-neutral-600">
                {formatDate(currentDateTime)} {formatTime(currentDateTime)}
              </p>
            </Link>
          </div>
        </div>

        {/* Right side: Search, Tools and Profile Menu */}
        <div className="flex items-center">
          {/* Search Box - only on larger screens */}
          <div className="hidden lg:flex items-center relative mx-4 w-80">
            <Search className="absolute left-3 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari mata kuliah, mahasiswa, dosen..."
              className="w-full rounded-md border border-neutral-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0687C9] focus:ring-1 focus:ring-[#0687C9] transition-all placeholder:text-neutral-500"
            />
          </div>

          {/* Calendar Tool */}
          <CalendarDisplay />

          {/* Notifications */}
          <NotificationsMenu />

          {/* Help Button */}
          <div className="hidden md:block">
            <button
              className="rounded-full p-2 hover:bg-[#E6F3FB]"
              title="Bantuan"
            >
              <HelpCircle className="h-5 w-5 text-[#0687C9]" />
            </button>
          </div>

          {/* Profile Menu */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
} 
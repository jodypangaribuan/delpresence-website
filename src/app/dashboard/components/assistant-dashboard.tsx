"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart2,
  FileCheck,
  Clock,
  Users,
  QrCode,
  FileOutput,
  UserCog
} from "lucide-react";

export default function AssistantDashboard() {
  const [stats] = useState({
    upcomingClasses: 2,
    pendingAttendance: 3,
    totalStudents: 75,
    classesThisWeek: 5
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-[#002A5C] mb-2">Selamat Datang, Asisten Dosen</h1>
        <p className="text-gray-600">Kelola kehadiran dan bantuan perkuliahan dengan mudah di satu tempat.</p>
      </div>

      {/* Stats Dashboard */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">Ringkasan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Kelas Hari Ini</p>
                <p className="text-2xl font-bold text-[#0687C9] mt-1">{stats.upcomingClasses}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Absensi Belum Diproses</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pendingAttendance}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <ClipboardList className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Mahasiswa</p>
                <p className="text-2xl font-bold text-green-500 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Kelas Minggu Ini</p>
                <p className="text-2xl font-bold text-purple-500 mt-1">{stats.classesThisWeek}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 bg-white border border-gray-100">
            <h3 className="font-medium text-[#002A5C] mb-3">Kehadiran</h3>
            <div className="space-y-2">
              <QuickMenuItem
                title="Kelola Presensi"
                href="/dashboard/assistant/qrcode"
                icon={<ClipboardList className="h-4 w-4 text-blue-600" />}
              />
            </div>
          </Card>

          <Card className="p-5 bg-white border border-gray-100">
            <h3 className="font-medium text-[#002A5C] mb-3">Jadwal & Akademik</h3>
            <div className="space-y-2">
              <QuickMenuItem
                title="Jadwal Mengajar"
                href="/dashboard/assistant/schedules"
                icon={<Calendar className="h-4 w-4 text-green-600" />}
              />
              <QuickMenuItem
                title="Penugasan Saya"
                href="/dashboard/assistant/assignments"
                icon={<UserCog className="h-4 w-4 text-green-600" />}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            title="Kelola Presensi"
            description="Kelola presensi mahasiswa dalam perkuliahan"
            icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
            href="/dashboard/assistant/qrcode"
            textColor="text-amber-600"
          />
          <FeatureCard
            title="Penugasan Saya"
            description="Lihat status penugasan anda sebagai asisten dosen"
            icon={<UserCog className="h-5 w-5 text-purple-600" />}
            href="/dashboard/assistant/assignments"
            textColor="text-purple-600"
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
      <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-all rounded-lg h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center">
            <div className={`p-2 rounded-full bg-gray-50`}>{icon}</div>
            <h3 className={`ml-3 font-medium ${textColor}`}>{title}</h3>
          </div>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
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
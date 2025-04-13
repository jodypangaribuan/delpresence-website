"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  CheckCircle,
  ClipboardCheck,
  BarChart,
  Users,
  QrCode,
  FileOutput,
  UserCog,
  Microscope,
} from "lucide-react";
import Link from "next/link";

export default function AssistantDashboard() {
  const [stats] = useState({
    totalClasses: 4,
    upcomingClasses: 1,
    totalStudents: 124,
    attendanceRate: 89,
    attendanceToday: 28,
    completedPracticums: 6,
    pendingPracticums: 2,
  });

  const [practiceToday] = useState([
    {
      id: 1,
      course: "Praktikum Algoritma dan Pemrograman",
      time: "08:00 - 10:30",
      room: "Lab Komputer 2",
      studentCount: 32,
      attendedCount: 28,
    },
    {
      id: 2,
      course: "Praktikum Basis Data",
      time: "13:00 - 15:30",
      room: "Lab Komputer 1",
      studentCount: 30,
      attendedCount: 0,
      status: "upcoming",
    },
  ]);

  const [schedule] = useState([
    { day: "Senin", classes: 2 },
    { day: "Selasa", classes: 0 },
    { day: "Rabu", classes: 1 },
    { day: "Kamis", classes: 1 },
    { day: "Jumat", classes: 0 },
  ]);

  return (
    <div className="space-y-8">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-l-4 border-l-primary border border-gray-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500">
              Sesi Praktikum Hari Ini
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-800">
                {practiceToday.length}
              </span>
              <span className="ml-1 text-sm text-gray-500">sesi</span>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <div className="text-xs font-medium text-green-600">
                {practiceToday.filter((l) => l.status !== "upcoming").length}{" "}
                selesai
              </div>
              <span className="text-gray-300">•</span>
              <div className="text-xs font-medium text-blue-600">
                {practiceToday.filter((l) => l.status === "upcoming").length}{" "}
                akan datang
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-primary border border-gray-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500">
              Tingkat Kehadiran Praktikan
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-800">
                {stats.attendanceRate}%
              </span>
            </div>
            <div className="mt-3 flex items-center">
              <div className="text-xs font-medium text-green-600">
                {stats.attendanceToday} mahasiswa hadir hari ini
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-primary border border-gray-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500">
              Total Praktikan
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-800">
                {stats.totalStudents}
              </span>
              <span className="ml-1 text-sm text-gray-500">orang</span>
            </div>
            <div className="mt-3 flex items-center">
              <div className="text-xs font-medium text-blue-600">
                {stats.totalClasses} kelas
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Practicum Today */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Jadwal Praktikum Hari Ini
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {practiceToday.map((practice) => (
            <Card
              key={practice.id}
              className={`p-4 bg-white border ${
                practice.status === "upcoming"
                  ? "border-blue-200"
                  : "border-green-200"
              } hover:shadow-md transition-all rounded-lg`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      practice.status === "upcoming"
                        ? "bg-blue-100"
                        : "bg-green-100"
                    }`}
                  >
                    {practice.status === "upcoming" ? (
                      <Clock className="h-6 w-6 text-blue-600" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {practice.course}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {practice.time} • {practice.room}
                    </p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {practice.attendedCount}
                    </span>
                    /{practice.studentCount} hadir
                  </div>
                  {practice.status === "upcoming" ? (
                    <Link
                      href={`/dashboard/assistant/attendance/${practice.id}`}
                      className="px-3 py-1.5 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Mulai Praktikum
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/assistant/attendance/${practice.id}`}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md font-medium hover:bg-gray-200 transition-colors"
                    >
                      Detail
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Jadwal Mingguan
        </h2>
        <Card className="p-6 bg-white border border-gray-100 rounded-lg">
          <div className="grid grid-cols-5 gap-4">
            {schedule.map((day) => (
              <div
                key={day.day}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50"
              >
                <p className="font-medium text-gray-700">{day.day}</p>
                <div className="mt-2 h-20 w-full flex items-center justify-center">
                  {day.classes > 0 ? (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {day.classes}
                      </p>
                      <p className="text-xs text-gray-500">praktikum</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Tidak ada praktikum</p>
                  )}
                </div>
                {day.classes > 0 && (
                  <Link
                    href={`/dashboard/assistant/schedules?day=${day.day}`}
                    className="mt-2 text-xs text-primary font-medium hover:underline"
                  >
                    Lihat Detail
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Progress Praktikum
        </h2>
        <Card className="p-6 bg-white border border-gray-100 rounded-lg">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Praktikum Selesai
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {stats.completedPracticums}/
                  {stats.completedPracticums + stats.pendingPracticums}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{
                    width: `${
                      (stats.completedPracticums /
                        (stats.completedPracticums + stats.pendingPracticums)) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu Utama Asisten */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Asisten</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Jadwal Asisten"
            description="Lihat jadwal mengajar praktikum"
            icon={<Calendar className="h-5 w-5 text-green-600" />}
            href="/dashboard/assistant/schedules"
            textColor="text-green-600"
          />
          <FeatureCard
            title="Data Kehadiran"
            description="Pantau kehadiran praktikum"
            icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />}
            href="/dashboard/assistant/attendance"
            textColor="text-blue-600"
          />
          <FeatureCard
            title="QR Code Generator"
            description="Buat QR untuk absensi praktikum"
            icon={<QrCode className="h-5 w-5 text-purple-600" />}
            href="/dashboard/qr-generate"
            textColor="text-purple-600"
          />
          <FeatureCard
            title="Laporan Praktikum"
            description="Laporan dan evaluasi praktikum"
            icon={<FileOutput className="h-5 w-5 text-orange-600" />}
            href="/dashboard/assistant/reports"
            textColor="text-orange-600"
          />
          <FeatureCard
            title="Data Praktikan"
            description="Lihat daftar praktikan"
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            href="/dashboard/assistant/students"
            textColor="text-indigo-600"
          />
          <FeatureCard
            title="Laboratorium"
            description="Kelola peminjaman laboratorium"
            icon={<Microscope className="h-5 w-5 text-teal-600" />}
            href="/dashboard/rooms"
            textColor="text-teal-600"
          />
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Notifikasi Terbaru
        </h2>
        <Card className="p-6 bg-white border border-gray-100 rounded-lg">
          <div className="space-y-4">
            <NotificationItem
              title="Jadwal Praktikum Diubah"
              description="Praktikum Algoritma dan Struktur Data dipindahkan ke Rabu, 14:00."
              time="Hari ini, 10:23"
              icon={<Calendar className="h-5 w-5 text-blue-500" />}
              href="/dashboard/assistant/schedules"
            />
            <NotificationItem
              title="Tugas Baru Ditambahkan"
              description="Dosen menambahkan tugas baru untuk Praktikum Basis Data."
              time="Kemarin, 16:45"
              icon={<FileOutput className="h-5 w-5 text-green-500" />}
              href="/dashboard/assistant/tasks"
            />
            <NotificationItem
              title="Pembagian Tugas"
              description="Anda ditugaskan untuk mengawasi UTS Algoritma dan Pemrograman."
              time="3 hari yang lalu"
              icon={<ClipboardCheck className="h-5 w-5 text-orange-500" />}
              href="/dashboard/assistant/tasks"
            />
          </div>
        </Card>
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

function NotificationItem({
  title,
  description,
  time,
  icon,
  href,
}: {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="p-2 rounded-full bg-gray-100">{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    </Link>
  );
} 
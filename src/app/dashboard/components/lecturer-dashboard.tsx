"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ClipboardCheck,
  Clock,
  UserCheck,
  CheckCircle,
  QrCode,
  FileOutput,
  BarChart,
  Calendar,
  CalendarClock,
  AlertTriangle,
  BellRing,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function LecturerDashboard() {
  const [stats] = useState({
    totalClasses: 8,
    upcomingClasses: 3,
    totalStudents: 242,
    attendanceRate: 91,
    attendanceToday: 56,
    totalCourseMaterials: 16,
    pendingReschedules: 1,
  });

  const [lectureToday] = useState([
    {
      id: 1,
      course: "Algoritma dan Pemrograman",
      time: "08:00 - 09:40",
      room: "Lab Komputer 3",
      studentCount: 32,
      attendedCount: 30,
    },
    {
      id: 2,
      course: "Basis Data",
      time: "10:00 - 11:40",
      room: "Ruang 2.3",
      studentCount: 28,
      attendedCount: 26,
    },
    {
      id: 3,
      course: "Konsep Pemrograman",
      time: "13:00 - 14:40",
      room: "Ruang 3.1",
      studentCount: 34,
      attendedCount: 0,
      status: "upcoming",
    },
  ]);

  const [schedule] = useState([
    { day: "Senin", classes: 3 },
    { day: "Selasa", classes: 2 },
    { day: "Rabu", classes: 1 },
    { day: "Kamis", classes: 2 },
    { day: "Jumat", classes: 0 },
  ]);

  return (
    <div className="space-y-8">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-l-4 border-l-primary border border-gray-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500">
              Kelas Hari Ini
            </h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-800">
                {lectureToday.length}
              </span>
              <span className="ml-1 text-sm text-gray-500">kelas</span>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <div className="text-xs font-medium text-green-600">
                {lectureToday.filter((l) => l.status !== "upcoming").length}{" "}
                selesai
              </div>
              <span className="text-gray-300">•</span>
              <div className="text-xs font-medium text-blue-600">
                {lectureToday.filter((l) => l.status === "upcoming").length}{" "}
                akan datang
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-l-primary border border-gray-100 hover:shadow-sm transition-all rounded-lg">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-500">
              Tingkat Kehadiran
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
              Total Mahasiswa
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

      {/* Class Today */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Jadwal Hari Ini
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {lectureToday.map((lecture) => (
            <Card
              key={lecture.id}
              className={`p-4 bg-white border ${
                lecture.status === "upcoming"
                  ? "border-blue-200"
                  : "border-green-200"
              } hover:shadow-md transition-all rounded-lg`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      lecture.status === "upcoming"
                        ? "bg-blue-100"
                        : "bg-green-100"
                    }`}
                  >
                    {lecture.status === "upcoming" ? (
                      <Clock className="h-6 w-6 text-blue-600" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {lecture.course}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {lecture.time} • {lecture.room}
                    </p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{lecture.attendedCount}</span>
                    /{lecture.studentCount} hadir
                  </div>
                  {lecture.status === "upcoming" ? (
                    <Link
                      href={`/dashboard/lecturer/attendance/${lecture.id}`}
                      className="px-3 py-1.5 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Mulai Kelas
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/lecturer/attendance/${lecture.id}`}
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
                      <p className="text-xs text-gray-500">kelas</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Tidak ada kelas</p>
                  )}
                </div>
                {day.classes > 0 && (
                  <Link
                    href={`/dashboard/lecturer/schedules?day=${day.day}`}
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

      {/* Menu Utama Dosen */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Dosen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Jadwal Pribadi"
            description="Lihat jadwal mengajar semester ini"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/schedules"
            textColor="text-primary"
          />
          <FeatureCard
            title="Daftar Hadir Mahasiswa"
            description="Lihat kehadiran mahasiswa per sesi"
            icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/attendance"
            textColor="text-primary"
          />
          <FeatureCard
            title="Input Kehadiran Manual"
            description="Catat kehadiran saat lupa scan QR/Face"
            icon={<UserCheck className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/manual-attendance"
            textColor="text-primary"
          />
          <FeatureCard
            title="Rekap Kehadiran"
            description="Lihat statistik kehadiran per kelas"
            icon={<BarChart className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/attendance-summary"
            textColor="text-primary"
          />
          <FeatureCard
            title="Pengajuan Kelas Pengganti"
            description="Ajukan jadwal pengganti saat berhalangan"
            icon={<CalendarClock className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/reschedule"
            textColor="text-primary"
          />
          <FeatureCard
            title="Pengumuman Kelas"
            description="Kirim pengumuman penting ke kelas"
            icon={<MessageSquare className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/announcements"
            textColor="text-primary"
          />
        </div>
      </div>

      {/* Tools Tambahan */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tools Tambahan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Generate QR Code"
            description="Buat QR Code untuk absensi kelas"
            icon={<QrCode className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/qr-generate"
            textColor="text-primary"
          />
          <FeatureCard
            title="Export Kehadiran"
            description="Unduh data kehadiran mahasiswa"
            icon={<FileOutput className="h-5 w-5 text-primary" />}
            href="/dashboard/lecturer/export"
            textColor="text-primary"
          />
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Pemberitahuan</h2>
        <Card className="p-6 bg-white border border-gray-100 rounded-lg">
          <div className="space-y-4">
            <NotificationItem
              title="Pengajuan Kelas Pengganti"
              description="Pengajuan untuk Algoritma dan Pemrograman (16 April) telah disetujui"
              time="10 menit yang lalu"
              icon={<CalendarClock className="h-5 w-5 text-primary" />}
              href="/dashboard/lecturer/reschedule"
            />
            <NotificationItem
              title="Konflik Jadwal"
              description="Terdeteksi bentrok jadwal pada tanggal 20 April"
              time="1 jam yang lalu"
              icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
              href="/dashboard/lecturer/schedules"
            />
            <NotificationItem
              title="Pengumuman Admin"
              description="Jadwal UTS telah dipublish, mohon periksa dan konfirmasi"
              time="2 jam yang lalu"
              icon={<BellRing className="h-5 w-5 text-primary" />}
              href="/dashboard/lecturer/announcements"
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
      <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-all h-full rounded-lg">
        <div className="flex flex-col h-full">
          <div className="flex items-start">
            <div className="p-2 rounded-full bg-primary/10">{icon}</div>
          </div>
          <div className="mt-2">
            <h3 className={`text-base font-semibold ${textColor}`}>{title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          </div>
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
      <div className="flex items-start space-x-4 hover:bg-gray-50 p-3 rounded-lg transition-colors">
        <div className="p-2 rounded-full bg-gray-100">{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-800">{title}</h4>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    </Link>
  );
} 
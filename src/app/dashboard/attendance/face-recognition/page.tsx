"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  ScanFace,
  Settings,
  UserCheck,
  Users,
  Database,
  Activity,
  RefreshCw,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Search,
  Camera,
  User,
  Filter,
  Sliders,
  PlayCircle,
  Clock,
  Shield,
  HelpCircle,
  ChevronRight,
  BarChart2
} from "lucide-react";

export default function FaceRecognitionPage() {
  const [systemStatus] = useState({
    isActive: true,
    lastSynced: "Hari ini, 08:45",
    recognitionAccuracy: "97.2%",
    totalStudentsRegistered: 894,
    pendingRegistrations: 12,
    todayRecognitions: 238,
  });

  const [students] = useState([
    {
      id: "S001",
      name: "Ahmad Rizky",
      nim: "20210001",
      department: "Teknik Informatika",
      status: "verified",
      lastUpdated: "2 hari lalu",
      imageQuality: "Baik",
    },
    {
      id: "S002",
      name: "Dewi Susanti",
      nim: "20210002",
      department: "Teknik Informatika",
      status: "pending",
      lastUpdated: "1 jam lalu",
      imageQuality: "Kurang",
    },
    {
      id: "S003",
      name: "Muhammad Fadli",
      nim: "20210003",
      department: "Sistem Informasi",
      status: "verified",
      lastUpdated: "1 minggu lalu",
      imageQuality: "Baik",
    },
    {
      id: "S004",
      name: "Sinta Dewi",
      nim: "20210004", 
      department: "Teknik Elektro",
      status: "failed",
      lastUpdated: "3 hari lalu",
      imageQuality: "Sangat Buruk",
    },
    {
      id: "S005",
      name: "Budi Santoso",
      nim: "20210005",
      department: "Teknik Informatika",
      status: "verified",
      lastUpdated: "2 minggu lalu",
      imageQuality: "Baik",
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#002A5C]">Manajemen Face Recognition</h1>
        <p className="text-neutral-600">
          Kelola sistem pengenalan wajah untuk verifikasi kehadiran mahasiswa secara otomatis.
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-neutral-100 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#002A5C] flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#0687C9]" />
              Status Sistem
            </h2>
            <StatusBadge isActive={systemStatus.isActive} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusItem 
              label="Terakhir Sinkronisasi" 
              value={systemStatus.lastSynced}
              icon={<RefreshCw className="h-4 w-4 text-[#0687C9]" />}
            />
            <StatusItem 
              label="Akurasi Pengenalan" 
              value={systemStatus.recognitionAccuracy}
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
            />
            <StatusItem 
              label="Total Mahasiswa Terdaftar" 
              value={systemStatus.totalStudentsRegistered}
              icon={<Database className="h-4 w-4 text-purple-600" />}
            />
            <StatusItem 
              label="Pendaftaran Pending" 
              value={systemStatus.pendingRegistrations}
              icon={<Clock className="h-4 w-4 text-amber-600" />}
            />
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionButton 
              label="Konfigurasi" 
              icon={<Settings className="h-4 w-4" />} 
              href="/dashboard/attendance/face-recognition/settings" 
            />
            <ActionButton 
              label="Kelola Data" 
              icon={<Database className="h-4 w-4" />} 
              href="/dashboard/attendance/face-recognition/data" 
            />
            <ActionButton 
              label="Pantau Aktivitas" 
              icon={<Activity className="h-4 w-4" />} 
              href="/dashboard/attendance/face-recognition/activity" 
            />
          </div>
        </Card>
        
        <Card className="p-6 border border-neutral-100 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#002A5C] flex items-center">
              <Camera className="h-5 w-5 mr-2 text-[#0687C9]" />
              Pengambilan Data Wajah
            </h2>
            <ActionButton 
              label="Tambah Data" 
              icon={<Upload className="h-4 w-4" />}
              href="/dashboard/attendance/face-recognition/add" 
              variant="primary"
            />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-[#0687C9]/5 border border-[#0687C9]/20 rounded-lg">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-[#0687C9] mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-neutral-800 mb-1">Tips Pengambilan Gambar</h3>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    <li className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mr-2"></div>
                      Pastikan pencahayaan baik dan merata
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mr-2"></div>
                      Wajah menghadap langsung ke kamera
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mr-2"></div>
                      Tidak ada penghalang seperti masker atau kacamata hitam
                    </li>
                    <li className="flex items-center">
                      <div className="w-1 h-1 rounded-full bg-neutral-400 mr-2"></div>
                      Ambil beberapa angle untuk akurasi lebih baik
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                Pengenalan hari ini: <span className="font-semibold text-neutral-800">{systemStatus.todayRecognitions}</span>
              </div>
              <Link href="/dashboard/attendance/face-recognition/logs" className="text-sm text-[#0687C9] hover:underline flex items-center">
                Lihat log aktivitas
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-[#002A5C] mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Validasi Wajah Baru"
            description="Konfirmasi data wajah yang baru ditambahkan"
            href="/dashboard/attendance/face-recognition/validate"
            icon={<UserCheck className="h-5 w-5 text-green-600" />}
            badge={systemStatus.pendingRegistrations}
          />
          <QuickActionCard
            title="Lihat Statistik"
            description="Statistik penggunaan dan akurasi system"
            href="/dashboard/attendance/face-recognition/stats"
            icon={<BarChart2 className="h-5 w-5 text-[#0687C9]" />}
          />
          <QuickActionCard
            title="Cek Keamanan"
            description="Audit log dan sistem keamanan"
            href="/dashboard/attendance/face-recognition/security"
            icon={<Shield className="h-5 w-5 text-purple-600" />}
          />
        </div>
      </div>

      {/* Recent Data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#002A5C]">Data Wajah Mahasiswa</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Cari mahasiswa..."
                className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50">
              <Filter className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        </div>
        
        <Card className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">NIM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Program Studi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Kualitas Gambar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Terakhir Diperbarui</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">{student.nim}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{student.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill status={student.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{student.imageQuality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{student.lastUpdated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="p-1 text-[#0687C9] hover:text-[#0670a8]">
                          <User className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-amber-600 hover:text-amber-800">
                          <Camera className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-neutral-600 hover:text-neutral-800">
                          <History className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 flex items-center justify-between border-t border-neutral-200 bg-neutral-50">
            <div className="text-sm text-neutral-500">
              Menampilkan <span className="font-medium">5</span> dari <span className="font-medium">894</span> data
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-neutral-300 rounded-md text-sm text-neutral-600 hover:bg-neutral-100">
                Sebelumnya
              </button>
              <button className="px-3 py-1 border border-[#0687C9] bg-[#0687C9] rounded-md text-sm text-white hover:bg-[#0670a8]">
                Selanjutnya
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isActive ? 'Aktif' : 'Tidak Aktif'}
    </div>
  );
}

// Status Item Component
function StatusItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center">
      <div className="p-2 rounded-full bg-[#F5F7FA] mr-3">
        {icon}
      </div>
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className="font-semibold text-neutral-800">{value}</div>
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({ 
  label, 
  icon, 
  href,
  variant = "default" 
}: { 
  label: string; 
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "primary";
}) {
  const variantClasses = {
    default: "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50",
    primary: "bg-[#0687C9] text-white border-[#0687C9] hover:bg-[#0670a8]",
  };

  return (
    <Link href={href}>
      <button className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${variantClasses[variant]}`}>
        {icon}
        <span className="ml-2">{label}</span>
      </button>
    </Link>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  icon,
  href,
  badge,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-all h-full">
        <div className="flex items-start">
          <div className="p-2 rounded-full bg-[#F5F7FA] mr-3">
            {icon}
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="font-medium text-neutral-800">{title}</h3>
              {badge && (
                <div className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  {badge}
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-600 mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Status Pill Component
function StatusPill({ status }: { status: string }) {
  const statusConfig = {
    verified: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      text: "Terverifikasi"
    },
    pending: {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <Clock className="h-3 w-3 mr-1" />,
      text: "Menunggu"
    },
    failed: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="h-3 w-3 mr-1" />,
      text: "Gagal"
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      {config.text}
    </div>
  );
} 
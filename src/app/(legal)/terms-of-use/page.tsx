"use client";

import { useMemo } from "react";
import { BsFileEarmarkText, BsArrowLeft } from "react-icons/bs";
import { LegalSection } from "@/shared/types/legal";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteConfig } from "@/shared/utils/siteConfig";
import LegalListItem from "@/components/legal/LegalListItem";
import LegalContentCard from "@/components/legal/LegalContentCard";

export default function TermsOfUsePage() {
  // Use useMemo to prevent recreating sections on each render
  const sections: LegalSection[] = useMemo(() => [
    {
      id: "intro",
      title: "Pengantar",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          DelPresence adalah sistem manajemen kehadiran digital yang
          dikembangkan oleh Institut Teknologi Del. Penggunaan layanan ini
          tunduk pada ketentuan yang diuraikan dalam dokumen ini.
        </p>
      ),
    },
    {
      id: "account-terms",
      title: "Ketentuan Akun",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            Dengan menggunakan DelPresence, Anda menyetujui bahwa:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun
              Anda
            </LegalListItem>
            <LegalListItem>
              Anda tidak akan membagikan akun Anda dengan orang lain
            </LegalListItem>
            <LegalListItem>
              Anda akan segera memberitahu administrator jika terjadi
              pelanggaran keamanan akun
            </LegalListItem>
            <LegalListItem>
              Anda akan menggunakan sistem sesuai dengan tujuannya untuk
              pengelolaan kehadiran akademik
            </LegalListItem>
            <LegalListItem>
              Upaya memanipulasi sistem presensi merupakan pelanggaran dan
              dapat dikenakan sanksi akademik
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "prohibited-use",
      title: "Penggunaan yang Dilarang",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            Sebagai pengguna DelPresence, Anda dilarang untuk:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Menggunakan sistem untuk melakukan presensi palsu atau
              memanipulasi kehadiran
            </LegalListItem>
            <LegalListItem>
              Mengembangkan atau menggunakan metode otomatis untuk mengakses,
              mencari, atau mengumpulkan data dari sistem
            </LegalListItem>
            <LegalListItem>
              Mencoba untuk mendekripsi, merusak, atau menembus keamanan
              sistem
            </LegalListItem>
            <LegalListItem>
              Menggunakan sistem dengan cara yang dapat menyebabkan gangguan
              atau kerusakan
            </LegalListItem>
            <LegalListItem>
              Melanggar hak kekayaan intelektual terkait dengan sistem
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "data-accuracy",
      title: "Keakuratan Data",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">Anda bertanggung jawab untuk:</p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Memastikan data profil Anda akurat dan terkini
            </LegalListItem>
            <LegalListItem>
              Memverifikasi kehadiran Anda dicatat dengan benar
            </LegalListItem>
            <LegalListItem>
              Segera melaporkan ketidakakuratan data kepada administrator
            </LegalListItem>
            <LegalListItem>
              Menyimpan bukti presensi jika terjadi perselisihan
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "institution-rights",
      title: "Hak Institut Teknologi Del",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            Institut Teknologi Del berhak untuk:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Mengubah, menambah, atau menghapus fitur sistem tanpa
              pemberitahuan
            </LegalListItem>
            <LegalListItem>
              Menghentikan akses pengguna jika terjadi pelanggaran ketentuan
            </LegalListItem>
            <LegalListItem>
              Memantau penggunaan sistem untuk memastikan kepatuhan
            </LegalListItem>
            <LegalListItem>
              Mengumpulkan dan menganalisis data untuk peningkatan sistem
            </LegalListItem>
            <LegalListItem>
              Memperbarui Ketentuan Penggunaan ini sewaktu-waktu
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "liability",
      title: "Batasan Tanggung Jawab",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          DelPresence disediakan "sebagaimana adanya" tanpa jaminan apa pun.
          Institut Teknologi Del tidak bertanggung jawab atas kerugian atau
          kerusakan yang timbul dari penggunaan atau ketidakmampuan menggunakan
          layanan ini. Dalam setiap keadaan, tanggung jawab Institut Teknologi
          Del kepada Anda atau pihak ketiga dalam hal apa pun tidak akan
          melebihi biaya yang Anda bayarkan, jika ada, untuk menggunakan
          layanan.
        </p>
      ),
    },
    {
      id: "intellectual-property",
      title: "Hak Kekayaan Intelektual",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          Semua hak kekayaan intelektual terkait DelPresence, termasuk tetapi
          tidak terbatas pada hak cipta, merek dagang, kode, gambar, logo, dan
          konten, adalah milik Institut Teknologi Del atau pihak ketiga yang
          telah memberikan lisensi. Anda tidak boleh mereproduksi,
          mendistribusikan, memodifikasi, atau membuat karya turunan dari
          konten sistem tanpa izin tertulis.
        </p>
      ),
    },
    {
      id: "termination",
      title: "Penghentian",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          Institut Teknologi Del dapat menghentikan atau menangguhkan akses Anda
          ke DelPresence dengan atau tanpa pemberitahuan, segera dan tanpa
          tanggung jawab, untuk alasan apa pun, termasuk, tanpa batasan, jika
          Anda melanggar Ketentuan Penggunaan ini atau tidak lagi terdaftar
          sebagai mahasiswa, dosen, atau staf IT Del.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Perubahan Ketentuan",
      icon: <BsFileEarmarkText className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          Institut Teknologi Del berhak untuk memodifikasi Ketentuan Penggunaan
          ini kapan saja. Perubahan akan berlaku segera setelah diposting di
          platform. Penggunaan berkelanjutan Anda terhadap DelPresence setelah
          perubahan tersebut merupakan penerimaan Anda terhadap ketentuan yang
          diubah.
        </p>
      ),
    },
  ], []);

  const { colors } = siteConfig;
  const lastUpdated = "15 Mei 2024";

  return (
    <div 
      className="max-w-4xl mx-auto px-4 py-8" 
      style={{ 
        colorScheme: 'light',
        backgroundColor: '#ffffff',
        color: '#334155', // slate-700
        forcedColorAdjust: 'none'
      }}
      data-theme="light"
    >
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-[#0687C9] mb-6 transition-colors"
        >
          <BsArrowLeft className="mr-2" /> Kembali ke Beranda
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center mb-4"
        >
          <div className="mr-3 p-2 rounded-full" style={{ backgroundColor: `${colors.primary}15` }}>
            <BsFileEarmarkText className="text-2xl" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Ketentuan Penggunaan
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-slate-600 mb-2 max-w-3xl">
            Ketentuan penggunaan berikut mengatur penggunaan Anda atas layanan DelPresence. Dengan mengakses atau menggunakan layanan ini, Anda menyetujui untuk terikat oleh ketentuan berikut.
          </p>
          <p className="text-slate-500 text-sm">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </motion.div>
      </div>

      {/* Content with modern design */}
      <LegalContentCard sections={sections} defaultOpen="intro" />

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-8 text-center text-sm text-slate-500"
      >
        <p>
          Jika Anda memiliki pertanyaan, silakan hubungi{" "}
          <a
            href="mailto:delpresence@del.ac.id"
            style={{ color: colors.primary }}
            className="hover:underline"
          >
            delpresence@del.ac.id
          </a>
        </p>
        <p className="mt-2">
          {siteConfig.copyright}. Semua hak dilindungi.
        </p>
      </motion.div>
    </div>
  );
} 
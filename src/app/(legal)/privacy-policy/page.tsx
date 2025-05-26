"use client";

import { useState, useMemo, Suspense } from "react";
import { BsShieldLock, BsArrowLeft } from "react-icons/bs";
import { LegalSection } from "@/shared/types/legal";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteConfig } from "@/shared/utils/siteConfig";
import LegalListItem from "@/components/legal/LegalListItem";
import LegalContentCard from "@/components/legal/LegalContentCard";
import { Loader2 } from "lucide-react";

// Loader component
function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
    </div>
  );
}

// The main content component
function PrivacyPolicyContent() {
  // Use useMemo to prevent recreating sections on each render
  const sections: LegalSection[] = useMemo(() => [
    {
      id: "info-collected",
      title: "Informasi yang Kami Kumpulkan",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            DelPresence mengumpulkan informasi yang diperlukan untuk menjalankan
            sistem manajemen kehadiran digital, termasuk:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Informasi identitas seperti nama, NIM/NIP, dan email
            </LegalListItem>
            <LegalListItem>
              Data fakultas dan program studi untuk mahasiswa
            </LegalListItem>
            <LegalListItem>
              Data jabatan untuk dosen
            </LegalListItem>
            <LegalListItem>
              Data kehadiran seperti waktu, tanggal, dan lokasi presensi
            </LegalListItem>
            <LegalListItem>
              Informasi perangkat dan log aktivitas sistem
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "info-usage",
      title: "Penggunaan Informasi",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            Informasi yang dikumpulkan digunakan untuk:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Mengelola dan memverifikasi kehadiran perkuliahan
            </LegalListItem>
            <LegalListItem>
              Membuat dan menampilkan laporan kehadiran
            </LegalListItem>
            <LegalListItem>
              Mengirimkan notifikasi terkait kehadiran dan perkuliahan
            </LegalListItem>
            <LegalListItem>
              Memelihara dan meningkatkan layanan DelPresence
            </LegalListItem>
            <LegalListItem>
              Melindungi keamanan dan integritas sistem
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "data-protection",
      title: "Perlindungan Data",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            DelPresence berkomitmen untuk melindungi data pribadi Anda dengan:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Mengimplementasikan praktik keamanan data yang ketat
            </LegalListItem>
            <LegalListItem>
              Membatasi akses ke informasi pribadi hanya kepada personel yang
              berwenang
            </LegalListItem>
            <LegalListItem>
              Menggunakan enkripsi untuk data sensitif
            </LegalListItem>
            <LegalListItem>
              Secara teratur meninjau dan meningkatkan praktik keamanan
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "info-sharing",
      title: "Pembagian Informasi",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            DelPresence tidak akan menjual, memperdagangkan, atau menyewakan
            informasi pribadi pengguna. Informasi pribadi hanya dibagikan dalam
            lingkungan akademik Institut Teknologi Del dengan:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Dosen pengampu mata kuliah terkait data kehadiran mahasiswa
            </LegalListItem>
            <LegalListItem>
              Staf IT Del yang memerlukan akses untuk tujuan administratif
            </LegalListItem>
            <LegalListItem>
              Departemen akademik untuk tujuan pengarsipan dan evaluasi
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "data-retention",
      title: "Penyimpanan dan Retensi Data",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          Data kehadiran akan disimpan selama periode yang diperlukan untuk
          tujuan akademik dan administratif IT Del, biasanya selama masa studi
          atau masa kerja pengguna di institusi ditambah periode tambahan yang
          diperlukan untuk kepatuhan terhadap kebijakan arsip institusi.
        </p>
      ),
    },
    {
      id: "user-rights",
      title: "Hak Pengguna",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <>
          <p className="text-slate-600 mb-3">
            Sebagai pengguna DelPresence, Anda memiliki hak untuk:
          </p>
          <ul className="space-y-2 text-slate-600">
            <LegalListItem>
              Mengakses data personal Anda yang tersimpan dalam sistem
            </LegalListItem>
            <LegalListItem>
              Meminta koreksi data yang tidak akurat
            </LegalListItem>
            <LegalListItem>
              Menerima notifikasi tentang penggunaan data Anda
            </LegalListItem>
            <LegalListItem>
              Meminta penjelasan tentang praktik privasi kami
            </LegalListItem>
          </ul>
        </>
      ),
    },
    {
      id: "policy-changes",
      title: "Perubahan Kebijakan",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          DelPresence dapat memperbarui kebijakan privasi ini dari waktu ke
          waktu untuk mencerminkan perubahan dalam praktik informasi kami.
          Perubahan signifikan akan diinformasikan melalui pemberitahuan yang
          jelas di platform atau melalui email ke pengguna terdaftar.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Kontak",
      icon: <BsShieldLock className="text-[#0687C9]/70" />,
      content: (
        <p className="text-slate-600">
          Jika Anda memiliki pertanyaan atau kekhawatiran tentang kebijakan
          privasi ini atau praktik data kami, silakan hubungi tim administrasi
          DelPresence di{" "}
          <a
            href="mailto:delpresence@del.ac.id"
            className="text-[#0687C9] hover:underline"
          >
            delpresence@del.ac.id
          </a>{" "}
          atau kunjungi kantor PPTIK di Gedung 9 lantai 1, Institut Teknologi
          Del.
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
        color: '#334155'
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
            <BsShieldLock className="text-2xl" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Kebijakan Privasi
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-slate-600 mb-2 max-w-3xl">
            Kebijakan privasi ini menjelaskan bagaimana informasi Anda dikumpulkan, digunakan, dan dibagikan saat Anda menggunakan layanan DelPresence.
          </p>
          <p className="text-slate-500 text-sm">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </motion.div>
      </div>

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8"
      >
        <LegalContentCard 
          title="Daftar Isi" 
          className="shadow-sm bg-white/80 backdrop-blur border border-slate-200"
        >
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center text-slate-600 hover:text-[#0687C9] py-1 px-2 rounded-md hover:bg-[#0687C9]/5 transition-colors"
                >
                  <span className="mr-2 opacity-70">{section.icon}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </LegalContentCard>
      </motion.div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            id={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <LegalContentCard 
              title={
                <div className="flex items-center">
                  <span className="mr-2 opacity-80">{section.icon}</span>
                  {section.title}
                </div>
              }
              className="shadow-sm hover:shadow-md transition-shadow bg-white border border-slate-200"
            >
              {section.content}
            </LegalContentCard>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
        <p>© 2024 {siteConfig.shortName}. Semua hak dilindungi.</p>
      </div>
    </div>
  );
}

// Export the page with Suspense boundary
export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PrivacyPolicyContent />
    </Suspense>
  );
} 
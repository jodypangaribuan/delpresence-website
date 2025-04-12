import { ReactNode } from 'react';
import { BsShieldLock, BsFileEarmarkText } from 'react-icons/bs';
import { LegalSection } from '@/shared/types/legal';
import LegalListItem from '@/components/legal/LegalListItem';

/**
 * Data untuk halaman kebijakan privasi
 */
export function getPrivacyPolicySections(): LegalSection[] {
  return [
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
  ];
}

/**
 * Data untuk halaman ketentuan penggunaan
 */
export function getTermsOfUseSections(): LegalSection[] {
  return [
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
  ];
} 
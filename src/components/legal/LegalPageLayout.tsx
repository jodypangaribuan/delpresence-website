"use client";

import Link from "next/link";
import { ReactNode, memo } from "react";
import { BsArrowLeft, BsChevronDown, BsChevronUp } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { LegalSection } from "@/shared/types/legal";
import { siteConfig } from "@/shared/utils/siteConfig";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  sections: LegalSection[];
  activeSection: string | null;
  toggleSection: (id: string) => void;
  lastUpdated?: string;
}

// Memoisasi komponen Section untuk mencegah render ulang yang tidak perlu
const Section = memo(({ 
  section, 
  activeSection, 
  toggleSection 
}: { 
  section: LegalSection; 
  activeSection: string | null; 
  toggleSection: (id: string) => void;
}) => {
  return (
    <div key={section.id} className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center">
          <div className="mr-3">{section.icon}</div>
          <h3 className="font-medium text-slate-800">{section.title}</h3>
        </div>
        <div>
          {activeSection === section.id ? (
            <BsChevronUp className="text-slate-400" />
          ) : (
            <BsChevronDown className="text-slate-400" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {activeSection === section.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-50">{section.content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Section.displayName = 'Section';

function LegalPageLayout({
  title,
  description,
  icon,
  sections,
  activeSection,
  toggleSection,
  lastUpdated = "1 November 2023"
}: LegalPageLayoutProps) {
  const { colors } = siteConfig;
  
  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #f8fafc, #f1f5f9, #f8fafc)",
        backgroundColor: "#f8fafc", // slate-50 fallback
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 hover:text-[#0687C9] mb-6"
          >
            <BsArrowLeft className="mr-2" /> Kembali ke Beranda
          </Link>
          <div className="flex items-center mb-2">
            <div className="text-3xl mr-3" style={{ color: colors.primary }}>{icon}</div>
            <h1 className="text-3xl font-bold text-slate-800">
              {title}
            </h1>
          </div>
          <p className="text-slate-600">
            {description}
          </p>
          <p className="text-slate-600 mt-2">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {sections.map((section) => (
            <Section 
              key={section.id}
              section={section} 
              activeSection={activeSection} 
              toggleSection={toggleSection} 
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
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
        </div>
      </div>
    </div>
  );
}

export default memo(LegalPageLayout); 
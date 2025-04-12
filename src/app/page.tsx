"use client";

import Link from "next/link";
import Image from "next/image";
import { BsDownload } from "react-icons/bs";

import Stack from "@/components/ui/Stack/Stack";
import { useClientSide } from "@/shared/hooks/useClientSide";
import { siteConfig, homepageImages } from "@/shared/utils/siteConfig";

export default function Home() {
  const isClient = useClientSide();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #dbeafe, #e0f2fe, #dbeafe)",
        backgroundColor: "#dbeafe", // blue-100 fallback
      }}
    >
      {/* Hero Section with animated gradient background */}
      <main className="flex-grow">
        <div className="relative overflow-hidden">
          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 lg:py-32 xl:py-36">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 xl:gap-20">
                <div className="md:w-1/2 text-center md:text-left max-w-xl mx-auto md:mx-0">
                  <Image
                    src="/images/logo2.png"
                    alt={`${siteConfig.name} Logo`}
                    width={220}
                    height={70}
                    className="h-auto w-auto max-w-[180px] md:max-w-[200px] lg:max-w-[220px] object-contain mx-auto md:mx-0 mb-4 md:mb-6"
                  />
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-slate-800 mb-4 sm:mb-6 leading-tight">
                    Sistem Kehadiran Digital{" "}
                    <span className="text-[#0687C9]">
                      Institut Teknologi Del
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-xl">
                    {siteConfig.description}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-6 sm:mb-8">
                    <Link
                      href={siteConfig.links.download}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#0687C9] hover:bg-[#0078B5] text-white font-medium rounded-xl shadow-lg transition-colors flex items-center justify-center group"
                    >
                      <BsDownload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Download Sekarang</span>
                    </Link>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500">
                    <Link
                      href={siteConfig.links.privacyPolicy}
                      className="hover:text-[#0687C9] transition-colors"
                    >
                      Kebijakan Privasi
                    </Link>
                    <Link
                      href={siteConfig.links.termsOfUse}
                      className="hover:text-[#0687C9] transition-colors"
                    >
                      Ketentuan Penggunaan
                    </Link>
                    <Link
                      href={siteConfig.links.institution}
                      className="hover:text-[#0687C9] transition-colors"
                    >
                      Website IT Del
                    </Link>
                    <p className="w-full md:w-auto mt-4 md:mt-0">
                      {siteConfig.copyright}
                    </p>
                  </div>
                </div>
                <div className="md:w-1/2 lg:w-1/2 xl:w-3/5 hidden md:block">
                  <div className="relative max-w-[650px] mx-auto">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#0687C9]/10 to-[#00A3FF]/10 opacity-80 blur-xl"></div>
                    <div className="relative rounded-2xl overflow-visible flex items-center justify-center py-10 px-6 lg:p-10">
                      {/* Image Stack - Only render on client to avoid hydration issues */}
                      {isClient && (
                        <Stack
                          randomRotation={false}
                          cardDimensions={{
                            width: Math.min(500, window.innerWidth * 0.9),
                            height: Math.min(350, window.innerWidth * 0.6),
                          }}
                          sensitivity={60}
                          sendToBackOnClick={true}
                          animationConfig={{ stiffness: 300, damping: 25 }}
                          cardsData={homepageImages}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

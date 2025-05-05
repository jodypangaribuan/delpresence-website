"use client";

import Link from "next/link";
import Image from "next/image";
import { BsDownload } from "react-icons/bs";
import { useRef } from "react";

import Stack from "@/components/ui/Stack/Stack";
import VariableProximity from "@/components/ui/VariableProximity/VariableProximity";
import { useClientSide } from "@/shared/hooks/useClientSide";
import { siteConfig, homepageImages } from "@/shared/utils/siteConfig";

export default function Home() {
  const isClient = useClientSide();
  const containerRef = useRef<HTMLDivElement>(null);

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
                <div 
                  ref={containerRef}
                  className="md:w-1/2 text-center md:text-left max-w-xl mx-auto md:mx-0"
                >
                  <div className="mb-2">
                    <Link href="/" className="inline-block cursor-pointer">
                      <Image
                        src="/images/logo2.png"
                        alt={`${siteConfig.name} Logo`}
                        width={220}
                        height={70}
                        className="h-auto w-auto max-w-[180px] md:max-w-[200px] lg:max-w-[220px] object-contain mx-auto md:mx-0 mb-0"
                      />
                    </Link>
                  </div>
                  
                  <h1 className="sr-only">Sistem Kehadiran Digital Institut Teknologi Del</h1>
                  <div className="mb-6 sm:mb-8">
                    <div className="cursor-pointer">
                      <VariableProximity
                        label="Sistem Kehadiran Digital"
                        fromFontVariationSettings="'wght' 500"
                        toFontVariationSettings="'wght' 800"
                        containerRef={containerRef as React.RefObject<HTMLElement>}
                        radius={250}
                        falloff="exponential"
                        style={{ 
                          fontSize: "clamp(2rem, 5vw, 3rem)",
                          lineHeight: "1.15",
                          display: "block",
                          marginBottom: "0.3rem",
                          color: "#1e293b" /* slate-800 */
                        }}
                      />
                    </div>
                    <div style={{ whiteSpace: "nowrap" }} className="cursor-pointer">
                      <VariableProximity
                        label="Institut Teknologi Del"
                        fromFontVariationSettings="'wght' 500"
                        toFontVariationSettings="'wght' 800"
                        containerRef={containerRef as React.RefObject<HTMLElement>}
                        radius={50}
                        falloff="exponential"
                        style={{ 
                          fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)",
                          lineHeight: "1.15",
                          color: "#0687C9",
                          display: "block"
                        }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-xl">
                    {siteConfig.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-8 sm:mb-10">
                    <Link
                      href={siteConfig.links.download}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#0687C9] hover:bg-[#0078B5] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                    >
                      <BsDownload className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span>Download Sekarang</span>
                    </Link>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-5 sm:gap-6 text-sm text-slate-500">
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

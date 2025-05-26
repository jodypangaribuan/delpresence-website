"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  BsArrowRight,
  BsLock,
  BsCheck,
  BsPerson,
  BsEyeSlash,
  BsEye,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { TOKEN_EXPIRY_MS } from "@/utils/env";

// Minimum delay between redirects to prevent loops (2 seconds)
const REDIRECT_DELAY = 2000;

// Define UserRole enum directly since we can't import from backend in client components
enum UserRole {
  ADMIN = "Admin",
  LECTURER = "Dosen",
  ASSISTANT = "Asisten Dosen",
  STUDENT = "Mahasiswa",
  UNKNOWN = "Unknown",
}

// Define user interface
interface User {
  id: string | number;
  username: string;
  name?: string;
  email?: string;
  role: string;
  photo?: string;
}

// API response interfaces
interface LoginResponse {
  token: string;
  refresh_token: string;
  user: User;
}

// Save auth data to localStorage (cookies would be better but this is simpler for demo)
function saveAuthData(data: LoginResponse) {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("access_token", data.token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("token_expiry", (Date.now() + TOKEN_EXPIRY_MS).toString());
}

// Loader component for Suspense
function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#0687C9]" />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Animation setup
  useEffect(() => {
    // Add the keyframes animation to the document if it doesn't exist
    if (typeof document !== 'undefined' && !document.getElementById('loading-pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'loading-pulse-keyframes';
      style.innerHTML = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(6, 135, 201, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(6, 135, 201, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 135, 201, 0); }
        }
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .btn-loading-pulse {
          animation: pulse 1.5s infinite;
        }
        .btn-loading-shine {
          background: linear-gradient(110deg,
            #0687C9 20%,
            #0466a2 30%,
            #0687C9 40%
          );
          background-size: 200% auto;
          animation: shine 3s linear infinite;
          background-clip: text;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Handle redirect to dashboard if already authenticated
  useEffect(() => {
    setMounted(true);
    
    const handleRedirect = () => {
      if (!isAuthenticated || isRedirecting) return;
      
      // Get the last redirect time
      const lastRedirectTime = sessionStorage.getItem('lastLoginRedirect')
        ? parseInt(sessionStorage.getItem('lastLoginRedirect') || '0')
        : 0;
      
      // Check if we're within the cooldown period
      if (Date.now() - lastRedirectTime < REDIRECT_DELAY) {
        console.log("[LoginPage] Redirect cooldown active, skipping redirect");
        return;
      }
      
      console.log("[LoginPage] User already authenticated, redirecting to dashboard");
      setIsRedirecting(true);
      sessionStorage.setItem('lastLoginRedirect', Date.now().toString());
      
      // Check if there's a redirect path saved
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      console.log(`[LoginPage] Redirecting to: ${redirectPath}`);
      
      // Use window.location for a full page reload to reset any potentially bad state
      window.location.href = redirectPath;
    };
    
    if (mounted) {
      handleRedirect();
    }
  }, [isAuthenticated, mounted, isRedirecting]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");

    try {
      console.log("[LoginPage] Attempting login for:", username);
      // Call the login function
      await login(username, password);
      
      // If we get here, login was successful
      console.log("[LoginPage] Login successful");
      
      // Wait briefly to avoid immediate redirect
      setTimeout(() => {
        setIsRedirecting(true);
        sessionStorage.setItem('lastLoginRedirect', Date.now().toString());
        
        // Get redirect path if any
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
        console.log(`[LoginPage] Redirecting to: ${redirectPath}`);
        
        // Use window.location for a clean redirect
        window.location.href = redirectPath;
      }, 300);
      
    } catch (err: unknown) {
      console.error("[LoginPage] Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null; // Avoid hydration issues
  }

  return (
    <div className="login-page min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 relative" style={{ fontFamily: "'Geist', Arial, sans-serif" }}>
      {/* Subtle color overlay */}
      <div className="absolute inset-0 bg-[#0687C9]/[0.02] pointer-events-none"></div>

      <div
        className="z-10 mb-8 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/images/logo2.png"
          alt="DelPresence Logo"
          width={180}
          height={60}
          className="h-auto w-auto object-contain"
        />
      </div>

      <Card className="w-full max-w-md bg-white border-0 shadow-xl shadow-[#0687C9]/10 rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0687C9] to-[#00A3FF]"></div>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#1A202C]">
              Selamat Datang di DelPresence
            </h2>
            <p className="mt-1 text-[#64748B] text-sm">
              Login untuk mengakses sistem manajemen akademik
            </p>
          </div>

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                <p className="font-medium">Login Gagal</p>
                <p className="text-red-600/80 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-[#334155] font-medium text-sm"
              >
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className="pl-10 border-[#E5E7EB] bg-white h-11 focus:border-[#0687C9] focus:ring-1 focus:ring-[#0687C9]/20"
                  disabled={isLoading}
                />
                <BsPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[#334155] font-medium text-sm"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="pl-10 pr-10 border-[#E5E7EB] bg-white h-11 focus:border-[#0687C9] focus:ring-1 focus:ring-[#0687C9]/20"
                  disabled={isLoading}
                />
                <BsLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={16} />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0687C9] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-4 h-4 border ${
                    remember
                      ? "bg-[#0687C9] border-[#0687C9]"
                      : "border-[#CBD5E1] bg-white"
                  } rounded flex items-center justify-center cursor-pointer transition-colors`}
                  onClick={() => setRemember(!remember)}
                >
                  {remember && <BsCheck className="text-white" size={14} />}
                </div>
                <label
                  htmlFor="remember"
                  className="text-[#475569] text-sm cursor-pointer"
                  onClick={() => setRemember(!remember)}
                >
                  Ingat saya
                </label>
              </div>
              <a
                href="#"
                className="text-[#0687C9] hover:text-[#046293] text-sm font-medium transition-colors"
              >
                Lupa password?
              </a>
            </div>

            <Button
              type="submit"
              className={`w-full h-11 text-white font-medium bg-[#0687C9] hover:bg-[#046293] transition-colors ${
                isLoading ? "btn-loading-pulse opacity-90" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Masuk
                  <BsArrowRight className="ml-2" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-[#64748B] text-sm">
            <p>
              Dengan login, Anda menyetujui{" "}
              <a
                href="/terms-of-use"
                className="text-[#0687C9] hover:text-[#046293] font-medium"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="/privacy-policy"
                className="text-[#0687C9] hover:text-[#046293] font-medium"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent />
    </Suspense>
  );
} 
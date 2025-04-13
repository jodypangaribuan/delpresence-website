"use client";

import { useState, useEffect } from "react";
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
  localStorage.setItem("token_expiry", (Date.now() + 12 * 60 * 60 * 1000).toString()); // 12 hours
}

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  // Add CSS animation for loading effect
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

  useEffect(() => {
    setMounted(true);
    
    // Check if user is already logged in
    const token = localStorage.getItem("access_token");
    const expiry = localStorage.getItem("token_expiry");
    
    if (token && expiry && parseInt(expiry) > Date.now()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Backend API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // Try campus login first for lecturers and assistants
      try {
        // Create FormData for campus login
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        
        // Call the campus login API 
        const campusResponse = await fetch(`${apiUrl}/api/auth/campus/login`, {
          method: "POST",
          body: formData,
        });

        // Parse response
        const campusData = await campusResponse.json();

        // Only proceed if login was successful
        if (campusResponse.ok && campusData.result && 
            (campusData.user.role === "Dosen" || campusData.user.role === "Asisten Dosen")) {
          
          // Create login data for local storage
          const loginData = {
            token: campusData.token,
            refresh_token: campusData.refresh_token,
            user: {
              id: campusData.user.user_id,
              username: campusData.user.username,
              name: "", // Not provided in campus response
              email: campusData.user.email,
              role: campusData.user.role,
              photo: "", // Not provided in campus response
            }
          };

          // Save auth data
          saveAuthData(loginData);
          
          // Redirect to dashboard
          router.push("/dashboard");
          return;
        }
      } catch (campusError) {
        // If campus login fails, we will try admin login below
        console.log("Campus login failed, trying admin login");
      }
      
      // If campus login failed or returned invalid role, try admin login
      const adminResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      // Parse response
      const adminData = await adminResponse.json();

      if (!adminResponse.ok) {
        throw new Error(adminData.error || "Login gagal");
      }

      // Save auth data
      saveAuthData(adminData);
      
      // Redirect to dashboard
      router.push("/dashboard");
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null; // Avoid hydration issues
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-6 relative" style={{ fontFamily: "'Geist', Arial, sans-serif" }}>
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsPerson className="h-4 w-4 text-[#0687C9]" />
                </div>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 py-2 h-11 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg focus:ring-[#0687C9] focus:border-[#0687C9] placeholder:text-[#64748B] text-[#1A202C]"
                  placeholder="Masukkan username anda"
                  required
                />
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsLock className="h-4 w-4 text-[#0687C9]" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 py-2 h-11 bg-[#F8FAFC] border-[#E2E8F0] rounded-lg focus:ring-[#0687C9] focus:border-[#0687C9] placeholder:text-[#64748B] text-[#1A202C]"
                  placeholder="Masukkan password anda"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showPassword ? (
                    <BsEyeSlash className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <BsEye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="flex items-center focus:outline-none"
              >
                <div
                  className={`w-4 h-4 flex items-center justify-center rounded-sm border transition-colors duration-200 ${
                    remember
                      ? "bg-[#0687C9] border-[#0687C9]"
                      : "border-[#CBD5E1] bg-white"
                  }`}
                >
                  {remember && <BsCheck className="w-3 h-3 text-white" />}
                </div>
                <span className="ml-2 text-sm text-[#475569]">Ingat saya</span>
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 bg-[#0687C9] hover:bg-[#0466a2] text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-[#0687C9] focus:ring-offset-2 disabled:opacity-70 ${isLoading ? 'btn-loading-pulse' : ''}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative w-5 h-5">
                      <div className="absolute inset-0 animate-ping rounded-full bg-white opacity-10 duration-700"></div>
                      <Loader2 className="h-5 w-5 animate-spin text-white relative" />
                    </div>
                    <span className="ml-2 text-white opacity-90">Memproses...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Masuk</span>
                    <BsArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-[#F8FAFC] p-6 border-t border-[#E2E8F0]">
          <div className="text-center">
            <p className="text-xs text-[#64748B]">
              © {new Date().getFullYear()} Institut Teknologi Del • Sistem
              Manajemen Akademik
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 
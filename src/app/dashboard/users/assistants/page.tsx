"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserCog, 
  RefreshCw, 
  Loader2,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AssistantsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[#002A5C] flex items-center gap-2">
          <UserCog className="h-6 w-6" /> 
          Daftar Asisten Dosen
        </h1>
        
        <Button 
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sinkronisasi...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sinkronisasi Data Asisten
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Data Asisten Dosen</CardTitle>
          <CardDescription>
            Daftar asisten dosen Institut Teknologi Del yang tersinkronisasi dengan sistem akademik kampus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Cari asisten..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={courseFilter || "all"}
                onValueChange={(value: string) => setCourseFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Mata Kuliah</SelectLabel>
                    <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                    <SelectItem value="Algoritma & Pemrograman">Algoritma & Pemrograman</SelectItem>
                    <SelectItem value="Basis Data">Basis Data</SelectItem>
                    <SelectItem value="Struktur Data">Struktur Data</SelectItem>
                    <SelectItem value="Jaringan Komputer">Jaringan Komputer</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <p className="mt-2 text-lg text-gray-500">Halaman Daftar Asisten Dosen sedang dalam pengembangan.</p>
              <p className="text-sm text-gray-400">Fitur ini akan segera tersedia.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
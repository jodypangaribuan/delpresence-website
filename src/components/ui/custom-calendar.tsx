"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

interface CalendarProps {
  month?: Date;
  selected?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function CustomCalendar({
  month,
  selected,
  onDateChange,
  className,
  disabled
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month || new Date());
  
  // Atur tanggal ke 1 hari dari bulan ini untuk navigasi yang mudah
  React.useEffect(() => {
    const newDate = new Date(currentMonth);
    newDate.setDate(1);
    setCurrentMonth(newDate);
  }, []);

  // Format bulan dan tahun
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const monthYear = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  // Fungsi untuk mendapatkan tanggal dalam sebulan
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  
  // Mendapatkan hari pertama dalam bulan (0-6 dimana 0=Minggu)
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  // Buat array hari untuk ditampilkan
  const days = [];
  
  // Tambahkan hari kosong sebelum hari pertama bulan
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Tambahkan semua hari dalam bulan
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Fungsi untuk mengubah bulan
  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // Cek apakah tanggal sama dengan yang dipilih
  const isSelectedDate = (day: number) => {
    if (!selected || !day) return false;
    
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    );
  };
  
  // Cek apakah tanggal hari ini
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };
  
  // Cek apakah tanggal dinonaktifkan
  const isDisabled = (day: number) => {
    if (!disabled || !day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return disabled(date);
  };

  // Fungsi untuk memilih tanggal
  const handleDateClick = (day: number | null) => {
    if (!onDateChange || !day || isDisabled(day)) return;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateChange(date);
  };

  return (
    <div className={cn("p-4 w-[286px] bg-white rounded-md shadow-md", className)}>
      {/* Header bulan & navigasi */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          className="h-7 w-7 p-0 text-[#0687C9] opacity-70 hover:opacity-100 hover:bg-[#0687C9]/10"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Bulan sebelumnya</span>
        </Button>
        
        <h2 className="text-sm font-medium text-black">{monthYear}</h2>
        
        <Button 
          variant="ghost" 
          className="h-7 w-7 p-0 text-[#0687C9] opacity-70 hover:opacity-100 hover:bg-[#0687C9]/10"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Bulan berikutnya</span>
        </Button>
      </div>
      
      {/* Header hari */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"].map((day, index) => (
          <div key={index} className="text-center text-xs text-[#0687C9] font-medium h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      
      {/* Kalender */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index}>
            {day ? (
              <Button
                variant="ghost"
                className={cn(
                  "h-8 w-8 p-0 font-normal rounded-md flex items-center justify-center", 
                  isSelectedDate(day) && "bg-[#0687C9] text-white hover:bg-[#0670a8] hover:text-white",
                  isToday(day) && !isSelectedDate(day) && "bg-neutral-100 text-neutral-900",
                  isDisabled(day) && "opacity-30 cursor-not-allowed"
                )}
                disabled={isDisabled(day)}
                onClick={() => handleDateClick(day)}
              >
                {day}
              </Button>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
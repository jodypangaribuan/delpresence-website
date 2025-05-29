"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  disabled?: boolean
}

export function TimePicker({
  value,
  onChange,
  className,
  disabled = false,
}: TimePickerProps) {
  // Parse the initial time value (format: "HH:MM")
  const [hours, minutes] = value ? value.split(":").map(Number) : [8, 0]
  
  // State for the internal selection
  const [selectedHour, setSelectedHour] = React.useState<number>(hours || 0)
  const [selectedMinute, setSelectedMinute] = React.useState<number>(minutes || 0)
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Format number to 2 digits (e.g., 1 -> "01")
  const formatNumber = (num: number) => num.toString().padStart(2, "0")
  
  // Common class times
  const commonTimes = [
    { label: "07:30", hour: 7, minute: 30 },
    { label: "08:00", hour: 8, minute: 0 },
    { label: "09:30", hour: 9, minute: 30 },
    { label: "10:00", hour: 10, minute: 0 },
    { label: "13:00", hour: 13, minute: 0 },
    { label: "14:30", hour: 14, minute: 30 },
    { label: "15:00", hour: 15, minute: 0 },
    { label: "16:30", hour: 16, minute: 30 },
  ]

  // Update the time when hour or minute changes
  React.useEffect(() => {
    const formattedTime = `${formatNumber(selectedHour)}:${formatNumber(selectedMinute)}`
    onChange(formattedTime)
  }, [selectedHour, selectedMinute, onChange])

  // Update internal state when value changes externally
  React.useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(":").map(Number)
      setSelectedHour(hours || 0)
      setSelectedMinute(minutes || 0)
    }
  }, [value])

  // Function to handle quick time presets
  const setQuickTime = (hour: number, minute: number) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? `${formatNumber(selectedHour)}:${formatNumber(selectedMinute)}` : "Pilih Waktu"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-3 bg-background" align="start">
        <div className="grid grid-cols-4 gap-2">
          {commonTimes.map(({ label, hour, minute }) => (
            <Button
              key={label}
              variant={hour === selectedHour && minute === selectedMinute ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickTime(hour, minute)}
              className={cn(
                "text-xs h-8",
                hour === selectedHour && minute === selectedMinute 
                  ? "bg-[#0687C9] hover:bg-[#0687C9]/90" 
                  : ""
              )}
            >
              {label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="text-xs font-medium text-gray-500">Waktu Kustom</div>
          <div className="flex border rounded overflow-hidden">
            <select 
              className="bg-transparent text-center py-0.5 px-1 text-sm appearance-none cursor-pointer hover:bg-gray-50 border-r w-12"
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatNumber(i)}</option>
              ))}
            </select>
            <span className="flex items-center px-0.5 text-sm">:</span>
            <select 
              className="bg-transparent text-center py-0.5 px-1 text-sm appearance-none cursor-pointer hover:bg-gray-50 w-12"
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                <option key={minute} value={minute}>{formatNumber(minute)}</option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 
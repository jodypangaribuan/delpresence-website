"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl, FormItem, FormLabel, FormMessage } from "./form";
import { CustomCalendar } from "./custom-calendar";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  fieldError?: string;
  disabledDates?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Pilih tanggal",
  disabled = false,
  fieldError,
  disabledDates
}: DatePickerProps) {
  return (
    <FormItem className="flex flex-col">
      {label && <FormLabel>{label}</FormLabel>}
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className={`w-full pl-3 text-left font-normal flex items-center ${!value && "text-neutral-500"}`}
              disabled={disabled}
            >
              {value ? format(value, "dd MMMM yyyy") : placeholder}
              <Calendar className="ml-auto h-4 w-4 text-[#0687C9]" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CustomCalendar
            selected={value}
            onDateChange={onChange}
            disabled={disabledDates}
          />
        </PopoverContent>
      </Popover>
      {fieldError && <FormMessage>{fieldError}</FormMessage>}
    </FormItem>
  );
} 
import { z } from "zod";

// Schema for Academic Year form
export const academicYearFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Nama tahun akademik harus diisi" })
    .regex(/^\d{4}\/\d{4}$/, {
      message: "Format tahun akademik harus YYYY/YYYY (contoh: 2023/2024)",
    }),
  start_date: z.date({
    required_error: "Tanggal mulai harus diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
  end_date: z.date({
    required_error: "Tanggal selesai harus diisi",
    invalid_type_error: "Format tanggal tidak valid",
  }),
  semester: z.enum(["Ganjil", "Genap"], {
    required_error: "Semester harus dipilih",
  }),
}).refine((data) => {
  return data.start_date < data.end_date;
}, {
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["end_date"],
});

// Type for Academic Year
export interface AcademicYear {
  id: number;
  name: string;
  start_date: Date | string;
  end_date: Date | string;
  semester: "Ganjil" | "Genap";
  created_at?: string;
  updated_at?: string;
}

// Type for Academic Year with stats
export interface AcademicYearWithStats {
  academic_year: AcademicYear;
  is_current: boolean;
  days_remaining: number;
  stats?: {
    total_courses?: number;
    total_schedules?: number;
  };
}

// Type for form values
export type AcademicYearFormValues = z.infer<typeof academicYearFormSchema>; 
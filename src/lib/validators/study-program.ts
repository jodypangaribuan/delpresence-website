import * as z from "zod";

/**
 * Schema validasi untuk Study Program
 */
export const studyProgramSchema = z.object({
  id: z.number().optional(),
  code: z.string()
    .min(2, { message: "Kode program studi harus minimal 2 karakter" })
    .max(10, { message: "Kode program studi maksimal 10 karakter" })
    .regex(/^[a-zA-Z0-9\-]+$/, { 
      message: "Kode program studi hanya boleh berisi huruf, angka, dan tanda hubung" 
    }),
  name: z.string()
    .min(3, { message: "Nama program studi harus minimal 3 karakter" })
    .max(100, { message: "Nama program studi maksimal 100 karakter" }),
  faculty_id: z.number()
    .min(1, { message: "Fakultas harus dipilih" }),
  faculty: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
  }).optional(),
  degree: z.enum(["D3", "D4", "S1"], {
    errorMap: () => ({ message: "Jenjang pendidikan tidak valid" })
  }),
  accreditation: z.enum(["Unggul", "Baik Sekali", "Baik", "Tidak Terakreditasi"], {
    errorMap: () => ({ message: "Akreditasi tidak valid" })
  }),
  head_of_department: z.string()
    .min(3, { message: "Nama ketua program studi harus minimal 3 karakter" })
    .max(100, { message: "Nama ketua program studi maksimal 100 karakter" }),
  lecturer_count: z.coerce.number()
    .min(0, { message: "Jumlah dosen minimal 0" })
    .max(1000, { message: "Jumlah dosen maksimal 1000" })
    .int({ message: "Jumlah dosen harus berupa bilangan bulat" })
    .optional(),
  student_count: z.coerce.number()
    .min(0, { message: "Jumlah mahasiswa minimal 0" })
    .max(10000, { message: "Jumlah mahasiswa maksimal 10000" })
    .int({ message: "Jumlah mahasiswa harus berupa bilangan bulat" })
    .optional(),
  establishment_year: z.coerce.number()
    .min(1900, { message: "Tahun pendirian tidak valid" })
    .max(new Date().getFullYear(), { message: "Tahun pendirian tidak boleh lebih dari tahun sekarang" })
    .int({ message: "Tahun pendirian harus berupa bilangan bulat" })
    .optional(),
});

export type StudyProgramValues = z.infer<typeof studyProgramSchema>;

/**
 * Schema validasi untuk Study Program pada form
 */
export const studyProgramFormSchema = studyProgramSchema.extend({
  // Field yang mungkin dikirmkan sebagai string dari form
  faculty_id: z.union([
    z.string().min(1, { message: "Fakultas harus dipilih" }).transform(val => parseInt(val)),
    z.number().min(1, { message: "Fakultas harus dipilih" })
  ]),
  establishment_year: z.union([
    z.string().refine(val => val === "" || !isNaN(parseInt(val)), {
      message: "Tahun pendirian harus berupa angka"
    }).transform(val => val === "" ? undefined : parseInt(val)),
    z.number().int().min(1900).max(new Date().getFullYear()),
    z.undefined()
  ]).optional(),
  lecturer_count: z.union([
    z.string().transform(val => val === "" ? undefined : parseInt(val)),
    z.number().min(0).int(),
    z.undefined()
  ]).optional(),
  student_count: z.union([
    z.string().transform(val => val === "" ? undefined : parseInt(val)),
    z.number().min(0).int(),
    z.undefined()
  ]).optional(),
});

export type StudyProgramFormValues = z.infer<typeof studyProgramFormSchema>; 
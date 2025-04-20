import * as z from "zod";

/**
 * Schema validasi untuk Building
 */
export const buildingSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  code: z.string()
    .min(2, { message: "Kode gedung harus minimal 2 karakter" })
    .max(10, { message: "Kode gedung maksimal 10 karakter" })
    .regex(/^[a-zA-Z0-9\-]+$/, { 
      message: "Kode gedung hanya boleh berisi huruf, angka, dan tanda hubung" 
    }),
  name: z.string()
    .min(3, { message: "Nama gedung harus minimal 3 karakter" })
    .max(100, { message: "Nama gedung maksimal 100 karakter" }),
  floors: z.coerce.number()
    .min(1, { message: "Jumlah lantai minimal 1" })
    .max(200, { message: "Jumlah lantai maksimal 200" })
    .int({ message: "Jumlah lantai harus berupa bilangan bulat" }),
  description: z.string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional(),
});

export type BuildingValues = z.infer<typeof buildingSchema>;

/**
 * Schema validasi untuk Building pada form
 */
export const buildingFormSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  code: z.string()
    .min(2, { message: "Kode gedung harus minimal 2 karakter" })
    .max(10, { message: "Kode gedung maksimal 10 karakter" })
    .regex(/^[a-zA-Z0-9\-]+$/, { 
      message: "Kode gedung hanya boleh berisi huruf, angka, dan tanda hubung" 
    }),
  name: z.string()
    .min(3, { message: "Nama gedung harus minimal 3 karakter" })
    .max(100, { message: "Nama gedung maksimal 100 karakter" }),
  floors: z.union([
    z.string().min(1, { message: "Jumlah lantai harus diisi" }).transform(val => parseInt(val)),
    z.number().min(1, { message: "Jumlah lantai minimal 1" })
  ]).refine(val => Number.isInteger(val), {
    message: "Jumlah lantai harus berupa bilangan bulat"
  }),
  description: z.string()
    .max(500, { message: "Deskripsi maksimal 500 karakter" })
    .optional()
    .nullable()
    .transform(val => val === null ? undefined : val),
});

export type BuildingFormValues = z.infer<typeof buildingFormSchema>; 
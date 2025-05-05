import * as z from "zod";

/**
 * Schema validasi untuk Room
 */
export const roomSchema = z.object({
  id: z.number().optional(),
  uuid: z.string().optional(),
  code: z.string()
    .min(2, { message: "Kode ruangan harus minimal 2 karakter" })
    .max(10, { message: "Kode ruangan maksimal 10 karakter" })
    .regex(/^[a-zA-Z0-9\-]+$/, { 
      message: "Kode ruangan hanya boleh berisi huruf, angka, dan tanda hubung" 
    }),
  name: z.string()
    .min(3, { message: "Nama ruangan harus minimal 3 karakter" })
    .max(100, { message: "Nama ruangan maksimal 100 karakter" }),
  building_id: z.number()
    .min(1, { message: "Gedung harus dipilih" }),
  building: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
  floor: z.coerce.number()
    .min(0, { message: "Lantai minimal 0 (ground floor)" })
    .max(200, { message: "Lantai maksimal 200" })
    .int({ message: "Lantai harus berupa bilangan bulat" }),
  capacity: z.coerce.number()
    .min(0, { message: "Kapasitas minimal 0" })
    .max(1000, { message: "Kapasitas maksimal 1000" })
    .int({ message: "Kapasitas harus berupa bilangan bulat" }),
});

export type RoomValues = z.infer<typeof roomSchema>;

/**
 * Schema validasi untuk Room pada form
 */
export const roomFormSchema = roomSchema.extend({
  // Field yang mungkin dikirmkan sebagai string dari form
  floor: z.union([
    z.string().min(1, { message: "Lantai harus diisi" }).transform(val => parseInt(val)),
    z.number().min(0, { message: "Lantai minimal 0 (ground floor)" })
  ]).refine(val => Number.isInteger(val), {
    message: "Lantai harus berupa bilangan bulat"
  }),
  capacity: z.union([
    z.string().min(1, { message: "Kapasitas harus diisi" }).transform(val => parseInt(val)),
    z.number().min(0, { message: "Kapasitas minimal 0" })
  ]).refine(val => Number.isInteger(val), {
    message: "Kapasitas harus berupa bilangan bulat"
  }),
  building_id: z.union([
    z.string().min(1, { message: "Gedung harus dipilih" }).transform(val => parseInt(val)),
    z.number().min(1, { message: "Gedung harus dipilih" })
  ]),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>; 
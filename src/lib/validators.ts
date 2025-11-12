import { z } from "zod";

// Authentication validation
export const loginSchema = z.object({
  pseudo: z.string()
    .min(2, "Le pseudo doit contenir au moins 2 caractères")
    .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Le pseudo ne peut contenir que des lettres, chiffres, - et _"),
  code: z.string()
    .min(4, "Le code doit contenir au moins 4 caractères")
    .max(50, "Le code ne peut pas dépasser 50 caractères"),
});

// Profile validation
export const profileUpdateSchema = z.object({
  pseudo: z.string()
    .min(2, "Le pseudo doit contenir au moins 2 caractères")
    .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
    .regex(/^[a-zA-Z0-9_-]+$/, "Le pseudo ne peut contenir que des lettres, chiffres, - et _")
    .optional(),
  bio: z.string()
    .max(200, "La bio ne peut pas dépasser 200 caractères")
    .optional(),
});

// Post validation
export const postCreateSchema = z.object({
  content: z.string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(1000, "Le post ne peut pas dépasser 1000 caractères")
    .trim(),
});

// Comment validation
export const commentCreateSchema = z.object({
  content: z.string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .trim(),
});

// Story validation
export const storyCreateSchema = z.object({
  content: z.string()
    .min(1, "Le contenu ne peut pas être vide")
    .max(280, "La story ne peut pas dépasser 280 caractères")
    .trim(),
  type: z.enum(["text", "image"]),
});

// Message validation
export const messageCreateSchema = z.object({
  content: z.string()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères")
    .trim(),
  receiverId: z.string().min(1, "Destinataire requis"),
});

// Event validation
export const eventCreateSchema = z.object({
  title: z.string()
    .min(1, "Le titre ne peut pas être vide")
    .max(100, "Le titre ne peut pas dépasser 100 caractères")
    .trim(),
  description: z.string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .trim()
    .optional(),
  date: z.string().refine((date) => {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, "La date doit être dans le futur"),
  time: z.string().optional(),
  location: z.string()
    .max(200, "Le lieu ne peut pas dépasser 200 caractères")
    .trim()
    .optional(),
});

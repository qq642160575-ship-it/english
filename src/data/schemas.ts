import { z } from "zod";

export const WordItemSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
  ipa: z.string().min(1),
  ib: z.array(z.number().int().positive()),
  category: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const SentenceWordIpaSchema = z.object({
  ipa: z.string().min(1),
  ib: z.array(z.number().int().positive()),
});

export const SentenceItemSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
  iw: z.array(SentenceWordIpaSchema).min(1),
  category: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const DataCategoryMetaSchema = z.object({
  id: z.string().min(1),
  type: z.union([z.literal("word"), z.literal("sentence")]),
  title: z.string().min(1),
  description: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()),
  itemCount: z.number().int().positive(),
  isBuiltin: z.boolean(),
});

export const DataPackSchema = z.object({
  meta: DataCategoryMetaSchema,
  items: z.array(z.union([WordItemSchema, SentenceItemSchema])),
});

import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['freelancer', 'contractor', 'driver', 'other']).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().default('USD'),
  date: z.string().datetime(),
  categoryId: z.string().uuid().optional(),
  merchant: z.string().optional(),
  description: z.string().optional(),
  receiptId: z.string().uuid().optional(),
  isBusiness: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
});

export const ReceiptParseSchema = z.object({
  merchantName: z.string().optional(),
  date: z.string().optional(),
  totalAmount: z.number().optional(),
  taxAmount: z.number().optional(),
  items: z.array(z.object({
    description: z.string(),
    amount: z.number(),
  })).optional(),
  confidence: z.number().min(0).max(100),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type ReceiptParse = z.infer<typeof ReceiptParseSchema>;

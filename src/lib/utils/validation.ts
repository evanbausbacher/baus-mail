import { z } from 'zod';

// Domain validation schemas
export const createDomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required').regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  apiKey: z.string().min(1, 'API key is required').startsWith('re_', 'Invalid Resend API key format'),
  aliases: z.array(z.string().email()).max(20).optional(),
});

export const updateDomainSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  apiKey: z.string().min(1).startsWith('re_').optional(),
  isActive: z.boolean().optional(),
  aliases: z.array(z.string().email()).max(20).optional(),
});

// Email validation schemas
export const sendEmailSchema = z.object({
  domainId: z.string().uuid(),
  from: z.string().email(),
  to: z.array(z.string().email()).min(1, 'At least one recipient is required').max(50),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.array(z.string().email()).optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
});

export const emailActionSchema = z.object({
  emailIds: z.array(z.string()).min(1),
  action: z.enum(['delete', 'star', 'unstar', 'markRead', 'markUnread', 'spam', 'notSpam']),
});

export const searchEmailsSchema = z.object({
  domainId: z.string().uuid(),
  query: z.string().min(1),
  filters: z.object({
    type: z.enum(['sent', 'received']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }).optional(),
});

// Type exports
export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type EmailActionInput = z.infer<typeof emailActionSchema>;
export type SearchEmailsInput = z.infer<typeof searchEmailsSchema>;

import { z } from 'zod';
import { isValidSenderAddress } from './email-helpers';

const senderAddressSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidSenderAddress, 'Invalid email address');

// Domain validation schemas
export const createDomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required').regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
});

export const updateDomainSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  iconUrl: z
    .string()
    .max(350_000)
    .regex(/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/)
    .nullable()
    .optional(),
  fromAddresses: z.array(senderAddressSchema).max(20).optional(),
});

// Email validation schemas
export const sendEmailSchema = z.object({
  domainId: z.string().min(1),
  from: senderAddressSchema,
  to: z.array(z.string().email()).min(1, 'At least one recipient is required').max(50),
  subject: z.string().min(1, 'Subject is required'),
  text: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.array(z.string().email()).optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string().min(1).max(255),
    content: z.string().min(1),
  })).max(10).optional(),
});

export const emailActionSchema = z.object({
  emailIds: z.array(z.string()).min(1),
  action: z.enum([
    'delete',
    'star',
    'unstar',
    'markRead',
    'markUnread',
    'spam',
    'notSpam',
    'archive',
    'unarchive',
    'moveToFolder',
    'moveToInbox',
  ]),
  folderId: z.string().uuid().optional(),
});

export const createFolderSchema = z.object({
  domainId: z.string().min(1),
  name: z.string().trim().min(1, 'Folder name is required').max(80),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(80),
});

export const searchEmailsSchema = z.object({
  domainId: z.string().min(1),
  query: z.string().min(1),
  view: z.string().optional(),
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
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

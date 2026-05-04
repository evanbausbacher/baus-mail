import { NextRequest, NextResponse } from 'next/server';
import { sendEmailSchema } from '@/lib/utils/validation';
import { getDomainById, upsertEmailRemote } from '@/lib/db/queries';
import { getResendClientForDomain } from '@/lib/resend/api-keys';
import { mapResendAttachmentsToEmailAttachments } from '@/lib/resend/client';
import type { Email } from '@/types/email';

export const dynamic = 'force-dynamic';

const MAX_ATTACHMENT_COUNT = 10;
const MAX_RAW_ATTACHMENT_BYTES = 25 * 1024 * 1024;

class BadRequestError extends Error {}

function safeDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : new Date();
  return Number.isFinite(d.getTime()) ? d : new Date();
}

function formString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function formJsonArray(formData: FormData, key: string): string[] | undefined {
  const value = formString(formData, key);
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : undefined;
  } catch {
    return undefined;
  }
}

async function parseMultipartRequest(request: NextRequest) {
  const formData = await request.formData();
  const files = formData
    .getAll('attachments')
    .filter((value): value is File => value instanceof File && value.name.length > 0);

  if (files.length > MAX_ATTACHMENT_COUNT) {
    throw new BadRequestError(`You can attach up to ${MAX_ATTACHMENT_COUNT} files.`);
  }

  let totalBytes = 0;
  const attachments = [];

  for (const file of files) {
    if (file.size <= 0) throw new BadRequestError('Attachments cannot be empty.');
    if (file.name.length > 255) throw new BadRequestError('Attachment filenames must be 255 characters or fewer.');
    totalBytes += file.size;
    if (totalBytes > MAX_RAW_ATTACHMENT_BYTES) {
      throw new BadRequestError('Attachments must total 25 MB or less.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: file.name,
      content: buffer.toString('base64'),
    });
  }

  return {
    domainId: formString(formData, 'domainId'),
    from: formString(formData, 'from'),
    to: formJsonArray(formData, 'to'),
    cc: formJsonArray(formData, 'cc'),
    bcc: formJsonArray(formData, 'bcc'),
    subject: formString(formData, 'subject'),
    text: formString(formData, 'text'),
    inReplyTo: formString(formData, 'inReplyTo'),
    references: formString(formData, 'references'),
    attachments: attachments.length ? attachments : undefined,
  };
}

async function parseSendRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('multipart/form-data')) {
    return parseMultipartRequest(request);
  }

  return request.json();
}

// POST /api/emails/send - Send an email via Resend and store it in Postgres
export async function POST(request: NextRequest) {
  try {
    const body = await parseSendRequest(request);
    const parsed = sendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const domain = await getDomainById(input.domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const client = getResendClientForDomain(domain);

    const result = await client.sendEmail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      cc: input.cc,
      bcc: input.bcc,
      reply_to: input.replyTo,
      attachments: input.attachments,
      headers: {
        ...(input.inReplyTo ? { 'In-Reply-To': input.inReplyTo } : {}),
        ...(input.references ? { References: input.references } : {}),
      },
    });

    let attachmentMetadata = null;
    if (input.attachments?.length) {
      try {
        const response = await client.listSentEmailAttachments(result.id);
        attachmentMetadata = mapResendAttachmentsToEmailAttachments(response.data);
      } catch {
        attachmentMetadata = input.attachments.map((attachment, index) => ({
          id: `pending-${result.id}-${index}`,
          filename: attachment.filename,
          contentType: 'application/octet-stream',
          size: Math.ceil((attachment.content.length * 3) / 4),
          contentId: null,
          contentDisposition: 'attachment',
        }));
      }
    }

    const sent: Omit<Email, 'syncedAt'> = {
      id: result.id,
      domainId: input.domainId,
      type: 'sent',
      messageId: null,
      from: input.from,
      to: input.to,
      cc: input.cc ?? null,
      bcc: input.bcc ?? null,
      replyTo: input.replyTo ?? null,
      subject: input.subject,
      html: null,
      text: input.text ?? null,
      headers: null,
      attachments: attachmentMetadata,
      inReplyTo: input.inReplyTo ?? null,
      references: input.references ?? null,
      threadId: null,
      createdAt: safeDate(result.created_at),
      isRead: true,
      isStarred: false,
      isSpam: false,
      isDeleted: false,
      isArchived: false,
      folderId: null,
      labels: null,
    };

    await upsertEmailRemote(sent);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

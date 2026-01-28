import { NextRequest, NextResponse } from 'next/server';
import { sendEmailSchema } from '@/lib/utils/validation';
import { getDomainById, upsertEmailRemote } from '@/lib/db/queries';
import { ResendClient } from '@/lib/resend/client';
import type { Email } from '@/types/email';

export const dynamic = 'force-dynamic';

// POST /api/emails/send - Send an email via Resend and store it in SQLite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    const client = new ResendClient(domain.apiKey);

    const result = await client.sendEmail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      cc: input.cc,
      bcc: input.bcc,
      reply_to: input.replyTo,
      headers: {
        ...(input.inReplyTo ? { 'In-Reply-To': input.inReplyTo } : {}),
        ...(input.references ? { References: input.references } : {}),
      },
    });

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
      html: input.html ?? null,
      text: input.text ?? null,
      headers: null,
      attachments: null,
      inReplyTo: input.inReplyTo ?? null,
      references: input.references ?? null,
      threadId: null,
      createdAt: new Date(result.created_at),
      isRead: true,
      isStarred: false,
      isSpam: false,
      isDeleted: false,
      labels: null,
    };

    await upsertEmailRemote(sent);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


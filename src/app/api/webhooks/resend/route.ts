import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getDomainByRecipientAddresses, updateDomainLastSynced, updateSyncState, upsertEmailRemote } from '@/lib/db/queries';
import { mapResendReceivedEmailToEmail, ResendClient } from '@/lib/resend/client';
import { getResendApiKeyForDomain } from '@/lib/resend/api-keys';

export const dynamic = 'force-dynamic';

type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
  };
};

function getRequiredHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function verifyWebhook(payload: string, request: NextRequest): ResendWebhookEvent {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('RESEND_WEBHOOK_SECRET is required');
  }

  const webhook = new Webhook(secret);
  const verified = webhook.verify(payload, {
    'svix-id': getRequiredHeader(request, 'svix-id'),
    'svix-timestamp': getRequiredHeader(request, 'svix-timestamp'),
    'svix-signature': getRequiredHeader(request, 'svix-signature'),
  });

  return typeof verified === 'string'
    ? JSON.parse(verified)
    : (verified as ResendWebhookEvent);
}

// POST /api/webhooks/resend - Resend inbound webhook receiver
export async function POST(request: NextRequest) {
  let event: ResendWebhookEvent;

  try {
    const payload = await request.text();
    event = verifyWebhook(payload, request);
  } catch (error) {
    console.error('Invalid Resend webhook:', error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ ignored: true });
  }

  const emailId = event.data?.email_id;
  const recipients = event.data?.to ?? [];

  if (!emailId || recipients.length === 0) {
    return NextResponse.json({ error: 'Invalid email.received payload' }, { status: 400 });
  }

  try {
    const domain = await getDomainByRecipientAddresses(recipients);
    if (!domain) {
      console.warn('Resend webhook ignored: no matching domain for recipients', recipients);
      return NextResponse.json({ ignored: true });
    }

    const client = new ResendClient(getResendApiKeyForDomain(domain.name));
    const received = await client.getReceivedEmail(emailId);
    const email = mapResendReceivedEmailToEmail(received, domain.id);

    await upsertEmailRemote(email);
    await updateSyncState(domain.id, 'received', email.id);
    await updateDomainLastSynced(domain.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

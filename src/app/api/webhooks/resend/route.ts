import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import {
  getDomainByRecipientAddresses,
  getDomainBySenderAddress,
  updateDomainLastSynced,
  updateSyncState,
  upsertEmailRemote,
} from '@/lib/db/queries';
import { mapResendReceivedEmailToEmail, mapResendSentEmailToEmail, ResendClient } from '@/lib/resend/client';
import { getResendApiKeyForDomain } from '@/lib/resend/api-keys';

export const dynamic = 'force-dynamic';

type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
  };
};

function getRequiredHeader(request: NextRequest, name: string) {
  const value = request.headers.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getWebhookSecrets() {
  const secrets = [
    ...(process.env.RESEND_WEBHOOK_SECRETS ?? '').split(','),
    process.env.RESEND_WEBHOOK_SECRET,
  ]
    .map((secret) => secret?.trim())
    .filter((secret): secret is string => Boolean(secret));

  if (secrets.length === 0) {
    throw new Error('RESEND_WEBHOOK_SECRET or RESEND_WEBHOOK_SECRETS is required');
  }

  return [...new Set(secrets)];
}

function verifyWebhook(payload: string, request: NextRequest): ResendWebhookEvent {
  const headers = {
    'svix-id': getRequiredHeader(request, 'svix-id'),
    'svix-timestamp': getRequiredHeader(request, 'svix-timestamp'),
    'svix-signature': getRequiredHeader(request, 'svix-signature'),
  };

  for (const secret of getWebhookSecrets()) {
    try {
      const webhook = new Webhook(secret);
      const verified = webhook.verify(payload, headers);

      return typeof verified === 'string'
        ? JSON.parse(verified)
        : (verified as ResendWebhookEvent);
    } catch {
      // Try the next configured webhook secret.
    }
  }

  throw new Error('No configured Resend webhook secret matched the request signature');
}

async function processReceivedEmail(event: ResendWebhookEvent) {
  const emailId = event.data?.email_id;
  const recipients = event.data?.to ?? [];

  if (!emailId || recipients.length === 0) {
    return NextResponse.json({ error: 'Invalid email.received payload' }, { status: 400 });
  }

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
}

async function processSentEmail(event: ResendWebhookEvent) {
  const emailId = event.data?.email_id;
  const sender = event.data?.from;

  if (!emailId || !sender) {
    return NextResponse.json({ error: 'Invalid email.sent payload' }, { status: 400 });
  }

  const domain = await getDomainBySenderAddress(sender);
  if (!domain) {
    console.warn('Resend webhook ignored: no matching domain for sender', sender);
    return NextResponse.json({ ignored: true });
  }

  const client = new ResendClient(getResendApiKeyForDomain(domain.name));
  const sent = await client.getSentEmail(emailId);
  const email = mapResendSentEmailToEmail(sent, domain.id);

  await upsertEmailRemote(email);
  await updateSyncState(domain.id, 'sent', email.id);
  await updateDomainLastSynced(domain.id);

  return NextResponse.json({ success: true });
}

// POST /api/webhooks/resend - Resend webhook receiver
export async function POST(request: NextRequest) {
  let event: ResendWebhookEvent;

  try {
    const payload = await request.text();
    event = verifyWebhook(payload, request);
  } catch (error) {
    console.error('Invalid Resend webhook:', error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
  }

  if (event.type !== 'email.received' && event.type !== 'email.sent') {
    return NextResponse.json({ ignored: true });
  }

  try {
    return event.type === 'email.received'
      ? processReceivedEmail(event)
      : processSentEmail(event);
  } catch (error) {
    console.error('Error processing Resend webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

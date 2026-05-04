import { NextRequest, NextResponse } from 'next/server';
import { getDomainById, getEmailById } from '@/lib/db/queries';
import { getResendClientForDomain } from '@/lib/resend/api-keys';

export const dynamic = 'force-dynamic';

const INLINE_TYPES = [
  /^image\//,
  /^text\//,
  /^application\/pdf$/,
];

function isInlinePreviewable(contentType: string) {
  return INLINE_TYPES.some((pattern) => pattern.test(contentType.toLowerCase()));
}

function contentDisposition(filename: string, download: boolean, contentType: string) {
  const disposition = download || !isInlinePreviewable(contentType) ? 'attachment' : 'inline';
  const safeFallback = filename.replace(/[^\w.!#$&+^`{}~-]+/g, '_') || 'attachment';
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
}

async function streamFromDownloadUrl(url: string, attachment: { filename: string; contentType: string }, download: boolean) {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: 'Failed to fetch attachment content' }, { status: 502 });
  }

  const headers = new Headers({
    'Content-Type': attachment.contentType || response.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': contentDisposition(attachment.filename, download, attachment.contentType),
    'Cache-Control': 'private, no-store',
  });
  const contentLength = response.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new NextResponse(response.body, {
    status: 200,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string; attachmentId: string }> }
) {
  try {
    const { emailId, attachmentId } = await params;
    const email = await getEmailById(emailId);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const attachment = email.attachments?.find((item) => item.id === attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    if (attachment.id.startsWith('pending-')) {
      return NextResponse.json({ error: 'Attachment is still syncing from Resend' }, { status: 409 });
    }

    const domain = await getDomainById(email.domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const client = getResendClientForDomain(domain);
    const resendAttachment = email.type === 'sent'
      ? await client.getSentEmailAttachment(email.id, attachment.id)
      : await client.getReceivedEmailAttachment(email.id, attachment.id);

    const download = request.nextUrl.searchParams.get('download') === '1';
    return streamFromDownloadUrl(resendAttachment.download_url, attachment, download);
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}

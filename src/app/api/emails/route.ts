import { NextRequest, NextResponse } from 'next/server';
import { getMailboxEmailSummaries, type MailboxView } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

function parseMailboxView(value: string | null): MailboxView | null {
  if (!value) return 'inbox';
  if (
    value === 'inbox' ||
    value === 'sent' ||
    value === 'spam' ||
    value === 'starred' ||
    value === 'trash' ||
    value === 'archive' ||
    value.startsWith('folder:')
  ) {
    return value as MailboxView;
  }
  return null;
}

// GET /api/emails - Get lightweight email summaries for a mailbox view
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');
    const view = parseMailboxView(searchParams.get('view'));
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100'), 1), 100);
    const cursorParam = searchParams.get('cursor');
    const cursor = cursorParam ? new Date(cursorParam) : undefined;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    if (!view) {
      return NextResponse.json({ error: 'Invalid mailbox view' }, { status: 400 });
    }

    const emails = await getMailboxEmailSummaries(domainId, view, {
      limit: limit + 1,
      cursor,
    });

    const hasMore = emails.length > limit;
    const page = hasMore ? emails.slice(0, limit) : emails;
    const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;

    return NextResponse.json({ emails: page, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching email summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email summaries' },
      { status: 500 }
    );
  }
}

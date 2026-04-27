import { NextRequest, NextResponse } from 'next/server';
import { getEmailsByDomain } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/emails/received - Get received emails from cache
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const cursorParam = searchParams.get('cursor');
    const cursor = cursorParam ? new Date(cursorParam) : undefined;
    const includeDeleted = searchParams.get('includeDeleted') === 'true' || searchParams.get('includeDeleted') === '1';

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const emails = await getEmailsByDomain(domainId, 'received', {
      limit: limit + 1,
      offset,
      cursor,
      includeDeleted,
    });

    const hasMore = emails.length > limit;
    const page = hasMore ? emails.slice(0, limit) : emails;
    const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;

    return NextResponse.json({ emails: page, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching received emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch received emails' },
      { status: 500 }
    );
  }
}

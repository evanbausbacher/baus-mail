import { NextRequest, NextResponse } from 'next/server';
import { getEmailsByDomain } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/emails/sent - Get sent emails from cache
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDeleted = searchParams.get('includeDeleted') === 'true' || searchParams.get('includeDeleted') === '1';

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const emails = await getEmailsByDomain(domainId, 'sent', {
      limit,
      offset,
      includeDeleted,
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sent emails' },
      { status: 500 }
    );
  }
}

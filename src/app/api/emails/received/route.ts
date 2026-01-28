import { NextRequest, NextResponse } from 'next/server';
import { getEmailsByDomain } from '@/lib/db/queries';

// GET /api/emails/received - Get received emails from cache
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domainId = searchParams.get('domainId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const emails = await getEmailsByDomain(domainId, 'received', {
      limit,
      offset,
      includeDeleted: false,
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching received emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch received emails' },
      { status: 500 }
    );
  }
}

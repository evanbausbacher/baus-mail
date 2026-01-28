import { NextRequest, NextResponse } from 'next/server';
import { searchEmailsSchema } from '@/lib/utils/validation';
import { searchEmails } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// POST /api/search - Search cached emails in SQLite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = searchEmailsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { domainId, query, filters } = parsed.data;

    const emails = await searchEmails({
      domainId,
      query,
      limit: 200,
      offset: 0,
      filters: {
        type: filters?.type,
        from: filters?.from,
        to: filters?.to,
        subject: filters?.subject,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
      },
    });

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error searching emails:', error);
    return NextResponse.json(
      { error: 'Failed to search emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getEmailThreadById } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emails = await getEmailThreadById(id);

    if (emails.length === 0) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching email thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email thread' },
      { status: 500 }
    );
  }
}

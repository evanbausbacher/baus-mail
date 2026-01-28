import { NextRequest, NextResponse } from 'next/server';
import { getEmailById } from '@/lib/db/queries';

// GET /api/emails/sent/[id] - Get a specific sent email
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = await getEmailById(params.id);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (email.type !== 'sent') {
      return NextResponse.json({ error: 'Email is not a sent email' }, { status: 400 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
}

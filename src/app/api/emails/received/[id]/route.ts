import { NextRequest, NextResponse } from 'next/server';
import { getEmailById } from '@/lib/db/queries';

// GET /api/emails/received/[id] - Get a specific received email
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = await getEmailById(params.id);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (email.type !== 'received') {
      return NextResponse.json({ error: 'Email is not a received email' }, { status: 400 });
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

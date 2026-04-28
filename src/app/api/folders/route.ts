import { NextRequest, NextResponse } from 'next/server';
import { createFolderSchema } from '@/lib/utils/validation';
import { createFolder, getDomainById, getFoldersByDomain } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const domainId = request.nextUrl.searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    const folders = await getFoldersByDomain(domainId);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const domain = await getDomainById(parsed.data.domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const folder = await createFolder(parsed.data);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

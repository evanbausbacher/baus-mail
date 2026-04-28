import { NextRequest, NextResponse } from 'next/server';
import { updateDomainSchema } from '@/lib/utils/validation';
import { getDomainById, updateDomain, deleteDomain } from '@/lib/db/queries';

// GET /api/domains/[id] - Get a specific domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domain = await getDomainById(id);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain' },
      { status: 500 }
    );
  }
}

// PUT /api/domains/[id] - Update a domain
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = updateDomainSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Check if domain exists
    const existing = await getDomainById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Update domain
    const domain = await updateDomain(id, updates);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ domain });
  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { error: 'Failed to update domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/domains/[id] - Delete a domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if domain exists
    const existing = await getDomainById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Delete domain (cascade deletes emails and sync state)
    await deleteDomain(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

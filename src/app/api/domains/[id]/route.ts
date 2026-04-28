import { NextRequest, NextResponse } from 'next/server';
import { updateDomainSchema } from '@/lib/utils/validation';
import { getDomainById, updateDomain, deleteDomain } from '@/lib/db/queries';

// GET /api/domains/[id] - Get a specific domain
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const domain = await getDomainById(params.id);

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
  { params }: { params: { id: string } }
) {
  try {
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
    const existing = await getDomainById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Update domain
    const domain = await updateDomain(params.id, updates);

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
  { params }: { params: { id: string } }
) {
  try {
    // Check if domain exists
    const existing = await getDomainById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Delete domain (cascade deletes emails and sync state)
    await deleteDomain(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
}

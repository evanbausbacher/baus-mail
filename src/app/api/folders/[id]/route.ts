import { NextRequest, NextResponse } from 'next/server';
import { updateFolderSchema } from '@/lib/utils/validation';
import { deleteFolder, getFolderById, updateFolder } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getFolderById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const folder = await updateFolder(id, parsed.data);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getFolderById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    await deleteFolder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

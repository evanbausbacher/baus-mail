import { NextRequest, NextResponse } from 'next/server';
import { emailActionSchema } from '@/lib/utils/validation';
import { updateEmailFlags } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// POST /api/emails/actions - Perform email actions (single/bulk)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = emailActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { emailIds, action, folderId } = parsed.data;

    if (action === 'delete') {
      await updateEmailFlags(emailIds, { isDeleted: true, isArchived: false, folderId: null });
    } else if (action === 'star') {
      await updateEmailFlags(emailIds, { isStarred: true });
    } else if (action === 'unstar') {
      await updateEmailFlags(emailIds, { isStarred: false });
    } else if (action === 'markRead') {
      await updateEmailFlags(emailIds, { isRead: true });
    } else if (action === 'markUnread') {
      await updateEmailFlags(emailIds, { isRead: false });
    } else if (action === 'spam') {
      await updateEmailFlags(emailIds, { isSpam: true, isArchived: false, isDeleted: false, folderId: null });
    } else if (action === 'notSpam') {
      await updateEmailFlags(emailIds, { isSpam: false });
    } else if (action === 'archive') {
      await updateEmailFlags(emailIds, {
        isArchived: true,
        isSpam: false,
        isDeleted: false,
        folderId: null,
      });
    } else if (action === 'unarchive') {
      await updateEmailFlags(emailIds, { isArchived: false });
    } else if (action === 'moveToFolder') {
      if (!folderId) {
        return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
      }
      await updateEmailFlags(emailIds, {
        folderId,
        isArchived: false,
        isSpam: false,
        isDeleted: false,
      });
    } else if (action === 'moveToInbox') {
      await updateEmailFlags(emailIds, {
        folderId: null,
        isArchived: false,
        isSpam: false,
        isDeleted: false,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing email action:', error);
    return NextResponse.json(
      { error: 'Failed to perform email action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

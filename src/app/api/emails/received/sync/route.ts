import { NextRequest, NextResponse } from 'next/server';
import { getDomainById, updateDomainLastSynced, upsertEmailRemote, getSyncState, updateSyncState } from '@/lib/db/queries';
import { syncReceivedEmails } from '@/lib/resend/client';

// POST /api/emails/received/sync - Sync received emails from Resend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    // Get domain
    const domain = await getDomainById(domainId);
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get last sync state
    const syncStateData = await getSyncState(domainId, 'received');
    const lastCursor = syncStateData?.lastCursor || null;

    // Sync emails from Resend
    const { emails, nextCursor, hasMore } = await syncReceivedEmails(
      domain.apiKey,
      domainId,
      lastCursor
    );

    // Store (or update) emails in database. This also backfills missing body content on duplicates.
    for (const email of emails) {
      await upsertEmailRemote(email);
    }

    // Update sync state
    await updateSyncState(domainId, 'received', nextCursor);

    // Update domain last synced timestamp
    await updateDomainLastSynced(domainId);

    return NextResponse.json({
      success: true,
      synced: emails.length,
      total: emails.length,
      hasMore,
    });
  } catch (error) {
    console.error('Error syncing received emails:', error);
    return NextResponse.json(
      { error: 'Failed to sync received emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

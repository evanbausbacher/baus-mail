import { NextResponse } from 'next/server';
import { syncDomainsFromConfig } from '@/lib/db/queries';
import { getConfiguredDomainNames, ResendApiKeyConfigError } from '@/lib/resend/api-keys';

// GET /api/domains - List all domains
export async function GET() {
  try {
    const domains = await syncDomainsFromConfig(getConfiguredDomainNames());
    return NextResponse.json({ domains });
  } catch (error) {
    if (error instanceof ResendApiKeyConfigError) {
      return NextResponse.json({ domains: [], configError: error.message });
    }

    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Domains are configured with RESEND_DOMAIN_API_KEYS' },
    { status: 405 }
  );
}

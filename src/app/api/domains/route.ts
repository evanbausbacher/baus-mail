import { NextRequest, NextResponse } from 'next/server';
import { createDomainSchema } from '@/lib/utils/validation';
import { getAllDomains, createDomain, getDomainByName } from '@/lib/db/queries';
import { ResendClient } from '@/lib/resend/client';

// GET /api/domains - List all domains
export async function GET() {
  try {
    const domains = await getAllDomains();
    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

// POST /api/domains - Create a new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createDomainSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, apiKey } = validation.data;

    // Check if domain already exists
    const existing = await getDomainByName(name);
    if (existing) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Validate API key by attempting to connect to Resend
    const client = new ResendClient(apiKey);
    const isValid = await client.validateApiKey();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Resend API key' },
        { status: 400 }
      );
    }

    // Create domain
    const domain = await createDomain({ name, apiKey });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}

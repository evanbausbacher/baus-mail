import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { Plain } from '@/lib/email-templates/Plain';
import { Reply } from '@/lib/email-templates/Reply';
import { z } from 'zod';
import { createElement } from 'react';

const previewSchema = z.object({
  mode: z.enum(['plain', 'reply']),
  body: z.string().optional(),
  quotedHeader: z.string().optional(),
  quotedBody: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { body, mode, quotedBody, quotedHeader } = parsed.data;
    const Component = mode === 'reply' ? Reply : Plain;
    const merged = mode === 'reply'
      ? { body: body ?? '', quotedBody: quotedBody ?? '', quotedHeader: quotedHeader ?? '' }
      : { body: body ?? '' };

    const html = await render(createElement(Component, merged), { pretty: false });

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error rendering email template preview:', error);
    return NextResponse.json(
      { error: 'Failed to render preview' },
      { status: 500 }
    );
  }
}

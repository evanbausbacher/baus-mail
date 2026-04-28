import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { getTemplate, type TemplateId } from '@/lib/email-templates';
import { z } from 'zod';

const previewSchema = z.object({
  templateId: z.enum(['plain', 'marketing', 'transactional', 'reply']),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: z.record(z.any()).optional(),
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

    const { templateId, props } = parsed.data;
    const def = getTemplate(templateId as TemplateId);
    const Component = def.Component;
    const merged = { ...def.defaultProps, ...(props ?? {}) };

    const html = await render(<Component {...merged} />, { pretty: false });

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

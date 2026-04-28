import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Preview,
} from '@react-email/components';

export interface TransactionalProps {
  preheader?: string;
  brandName?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export const TransactionalDefaults: TransactionalProps = {
  preheader: '',
  brandName: 'Your Brand',
  title: 'Confirm your action',
  body:
    "Here's the information you requested. If you didn't ask for this, you can safely ignore this email.",
  ctaLabel: '',
  ctaUrl: '',
};

export function Transactional({
  preheader,
  brandName,
  title,
  body,
  ctaLabel,
  ctaUrl,
}: TransactionalProps) {
  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>{brandName ?? TransactionalDefaults.brandName}</Text>
          </Section>

          <Heading as="h1" style={heading}>
            {title ?? TransactionalDefaults.title}
          </Heading>
          <Text style={paragraph}>{body ?? TransactionalDefaults.body}</Text>

          {ctaLabel && ctaUrl ? (
            <Section style={{ marginTop: 24 }}>
              <Button href={ctaUrl} style={cta}>
                {ctaLabel}
              </Button>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footerText}>
            This is an automated message from {brandName ?? TransactionalDefaults.brandName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#F2F2F7',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Text', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  margin: '24px auto',
  padding: '32px 24px',
  borderRadius: 16,
  maxWidth: 560,
};

const brand: React.CSSProperties = {
  paddingBottom: 16,
  borderBottom: '1px solid #E2E8F0',
  marginBottom: 24,
};

const brandText: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  color: '#475569',
  margin: 0,
};

const heading: React.CSSProperties = {
  color: '#0F172A',
  fontSize: 22,
  lineHeight: '28px',
  fontWeight: 700,
  margin: '0 0 12px',
};

const paragraph: React.CSSProperties = {
  color: '#334155',
  fontSize: 15,
  lineHeight: '22px',
  margin: '0 0 12px',
};

const cta: React.CSSProperties = {
  backgroundColor: '#0F172A',
  color: '#FFFFFF',
  padding: '12px 22px',
  borderRadius: 10,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  display: 'inline-block',
};

const hr: React.CSSProperties = {
  borderColor: '#E2E8F0',
  margin: '24px 0 12px',
};

const footerText: React.CSSProperties = {
  color: '#94A3B8',
  fontSize: 12,
  lineHeight: '18px',
  margin: 0,
};

export default Transactional;

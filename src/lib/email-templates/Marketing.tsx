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

export interface MarketingProps {
  preheader?: string;
  brandName?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}

export const MarketingDefaults: MarketingProps = {
  preheader: '',
  brandName: 'Your Brand',
  headline: 'A great new thing has arrived',
  body:
    "We've been working on something we think you'll love. Take a look and let us know what you think.",
  ctaLabel: 'Take a look',
  ctaUrl: 'https://example.com',
  footer: 'You are receiving this email because you subscribed to updates.',
};

export function Marketing({
  preheader,
  brandName,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  footer,
}: MarketingProps) {
  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body style={main}>
        <Container style={container}>
          <Section style={brand}>
            <Text style={brandText}>{brandName ?? MarketingDefaults.brandName}</Text>
          </Section>

          <Section style={hero}>
            <Heading as="h1" style={heading}>
              {headline ?? MarketingDefaults.headline}
            </Heading>
            <Text style={paragraph}>{body ?? MarketingDefaults.body}</Text>
            {ctaLabel && ctaUrl ? (
              <Section style={{ textAlign: 'center' as const, marginTop: 24 }}>
                <Button href={ctaUrl} style={cta}>
                  {ctaLabel}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footerText}>
              {footer ?? MarketingDefaults.footer}
            </Text>
          </Section>
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
  maxWidth: 600,
};

const brand: React.CSSProperties = {
  textAlign: 'center' as const,
  paddingBottom: 16,
  borderBottom: '1px solid #E2E8F0',
  marginBottom: 24,
};

const brandText: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  color: '#475569',
  margin: 0,
};

const hero: React.CSSProperties = {
  paddingBottom: 16,
};

const heading: React.CSSProperties = {
  color: '#0F172A',
  fontSize: 28,
  lineHeight: '34px',
  fontWeight: 700,
  margin: '8px 0 16px',
};

const paragraph: React.CSSProperties = {
  color: '#334155',
  fontSize: 16,
  lineHeight: '24px',
  margin: '0 0 16px',
};

const cta: React.CSSProperties = {
  backgroundColor: '#007AFF',
  color: '#FFFFFF',
  padding: '14px 24px',
  borderRadius: 12,
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 600,
  display: 'inline-block',
};

const hr: React.CSSProperties = {
  borderColor: '#E2E8F0',
  margin: '24px 0',
};

const footerText: React.CSSProperties = {
  color: '#94A3B8',
  fontSize: 12,
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: 0,
};

export default Marketing;

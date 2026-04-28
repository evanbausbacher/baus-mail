import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from '@react-email/components';

export interface ReplyProps {
  preheader?: string;
  body?: string;
  quotedHeader?: string;
  quotedBody?: string;
}

export const ReplyDefaults: ReplyProps = {
  preheader: '',
  body: '',
  quotedHeader: '',
  quotedBody: '',
};

export function Reply({ preheader, body, quotedHeader, quotedBody }: ReplyProps) {
  const paragraphs = (body ?? '').split(/\n{2,}/g);
  const quotedLines = (quotedBody ?? '').split('\n');

  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body style={main}>
        <Container style={container}>
          <Section>
            {paragraphs.map((p, i) => (
              <Text key={i} style={paragraph}>
                {p.split('\n').map((line, j, arr) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < arr.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))}
              </Text>
            ))}
          </Section>

          {(quotedHeader || quotedBody) && (
            <>
              <Hr style={hr} />
              {quotedHeader ? <Text style={quotedHeaderText}>{quotedHeader}</Text> : null}
              <Section style={quote}>
                {quotedLines.map((line, i) => (
                  <Text key={i} style={quotedLine}>
                    {line || '\u00A0'}
                  </Text>
                ))}
              </Section>
            </>
          )}
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
  padding: '24px 20px',
  borderRadius: 16,
  maxWidth: 560,
};

const paragraph: React.CSSProperties = {
  color: '#0F172A',
  fontSize: 16,
  lineHeight: '24px',
  margin: '0 0 14px',
};

const hr: React.CSSProperties = {
  borderColor: '#E2E8F0',
  margin: '20px 0 12px',
};

const quotedHeaderText: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  margin: '0 0 8px',
};

const quote: React.CSSProperties = {
  borderLeft: '3px solid #E2E8F0',
  paddingLeft: 12,
  marginLeft: 4,
};

const quotedLine: React.CSSProperties = {
  color: '#64748B',
  fontSize: 14,
  lineHeight: '20px',
  margin: 0,
};

export default Reply;

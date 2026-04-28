import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Preview } from '@react-email/components';

export interface PlainProps {
  preheader?: string;
  body?: string;
}

export const PlainDefaults: PlainProps = {
  preheader: '',
  body: 'Hello,\n\nWrite your message here.\n\nBest,',
};

export function Plain({ preheader, body }: PlainProps) {
  const content = body ?? PlainDefaults.body!;
  const paragraphs = content.split(/\n{2,}/g);

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

const paragraph: React.CSSProperties = {
  color: '#0F172A',
  fontSize: 16,
  lineHeight: '24px',
  margin: '0 0 16px',
};

export default Plain;

import type { Domain } from '@/types/domain';
import { ResendClient } from './client';

export class ResendApiKeyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResendApiKeyConfigError';
  }
}

function normalizeDomain(domainName: string) {
  return domainName.trim().toLowerCase();
}

function parseDomainApiKeys() {
  const raw = process.env.RESEND_DOMAIN_API_KEYS;

  if (!raw?.trim()) {
    throw new ResendApiKeyConfigError('RESEND_DOMAIN_API_KEYS is not configured');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ResendApiKeyConfigError('RESEND_DOMAIN_API_KEYS must be valid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ResendApiKeyConfigError('RESEND_DOMAIN_API_KEYS must be a JSON object mapping domains to API keys');
  }

  const map = new Map<string, string>();
  for (const [domain, apiKey] of Object.entries(parsed)) {
    if (typeof apiKey !== 'string' || !apiKey.startsWith('re_')) {
      throw new ResendApiKeyConfigError(`Invalid Resend API key configured for ${domain}`);
    }

    map.set(normalizeDomain(domain), apiKey);
  }

  return map;
}

export function getResendApiKeyForDomain(domainName: string) {
  const normalized = normalizeDomain(domainName);
  const apiKey = parseDomainApiKeys().get(normalized);

  if (!apiKey) {
    throw new ResendApiKeyConfigError(
      `No Resend API key configured for ${normalized}. Add it to RESEND_DOMAIN_API_KEYS.`
    );
  }

  return apiKey;
}

export function getResendClientForDomain(domain: Pick<Domain, 'name'>) {
  return new ResendClient(getResendApiKeyForDomain(domain.name));
}

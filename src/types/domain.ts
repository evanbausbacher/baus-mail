export interface Domain {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
  isActive: boolean;
  lastSyncedAt?: Date | null;
  /**
   * Saved "from" addresses for this domain (e.g. "evan@trainingdojo.app",
   * "support@trainingdojo.app"). The first alias is the default in the
   * compose Send-As picker. Empty array if none configured yet — the
   * compose UI falls back to `no-reply@{name}` in that case.
   */
  aliases: string[];
}

export interface CreateDomainInput {
  name: string;
  apiKey: string;
  aliases?: string[];
}

export interface UpdateDomainInput {
  name?: string;
  apiKey?: string;
  isActive?: boolean;
  aliases?: string[];
}

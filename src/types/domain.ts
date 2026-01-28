export interface Domain {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
  isActive: boolean;
  lastSyncedAt?: Date | null;
}

export interface CreateDomainInput {
  name: string;
  apiKey: string;
}

export interface UpdateDomainInput {
  name?: string;
  apiKey?: string;
  isActive?: boolean;
}

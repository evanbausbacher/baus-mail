export interface Domain {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  lastSyncedAt?: Date | null;
  iconUrl?: string | null;
}

export interface CreateDomainInput {
  name: string;
}

export interface UpdateDomainInput {
  name?: string;
  isActive?: boolean;
  iconUrl?: string | null;
}

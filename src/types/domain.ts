export interface Domain {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  isDefault: boolean;
  lastSyncedAt?: Date | null;
  iconUrl?: string | null;
  fromAddresses: string[];
}

export interface CreateDomainInput {
  name: string;
}

export interface UpdateDomainInput {
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
  iconUrl?: string | null;
  fromAddresses?: string[];
}

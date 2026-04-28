export interface MailFolder {
  id: string;
  domainId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderInput {
  domainId: string;
  name: string;
}

export interface UpdateFolderInput {
  name: string;
}

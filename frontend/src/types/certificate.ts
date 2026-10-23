export interface CertificateRecord {
  id: string;
  portfolioId: string;
  name: string;
  issuer: string | null;
  credentialCode: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateListResponse {
  certificates: CertificateRecord[];
}

export interface CertificateInput {
  name: string;
  issuer: string;
  credentialCode: string;
  issueDate: string;
  expiryDate: string;
  credentialUrl: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
}

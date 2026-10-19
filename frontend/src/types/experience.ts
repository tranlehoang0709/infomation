export interface ExperienceRecord {
  id: string;
  companyName: string;
  position: string;
  employmentType: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  achievements: string[];
  sortOrder: number;
  isVisible: boolean;
  companyLogo: { id: string; altText: string | null; filePath: string } | null;
}

export interface ExperienceInput {
  companyName: string;
  position: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  achievements: string;
  sortOrder: number;
  isVisible: boolean;
  companyLogoMediaId: string | null;
}

export interface ExperienceListResponse {
  experiences: ExperienceRecord[];
}

export interface MediaUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: string;
  adminFilePath: string;
}

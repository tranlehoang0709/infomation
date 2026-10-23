export interface EducationRecord {
  id: string;
  portfolioId: string;
  schoolName: string;
  degree: string | null;
  major: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EducationListResponse {
  educations: EducationRecord[];
}

export interface EducationInput {
  schoolName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  sortOrder: number;
  isVisible: boolean;
}

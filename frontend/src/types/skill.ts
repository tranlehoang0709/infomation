export interface SkillRecord {
  id: string;
  portfolioId: string;
  name: string;
  category: string | null;
  proficiency: number | null;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillInput {
  name: string;
  category: string;
  proficiency: number | null;
  description: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface SkillListResponse { skills: SkillRecord[] }

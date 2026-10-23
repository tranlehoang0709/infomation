export interface SharedPortfolioResponse {
  title: string;
  visibility: Record<string, boolean>;
  profile: { fullName: string; headline: string | null; phone: string | null; contactEmail: string | null; location: string | null; bio: string | null; avatarUrl: string | null; cvUrl: string | null } | null;
  educations: Array<{ id: string; schoolName: string; degree: string | null; major: string | null; description: string | null; startDate: string | null; endDate: string | null; isCurrent: boolean }>;
  certificates: Array<{ id: string; name: string; issuer: string | null; credentialCode: string | null; issueDate: string | null; expiryDate: string | null; description: string | null; credentialUrl: string | null }>;
  experiences: Array<{ id: string; companyName: string; position: string; employmentType: string | null; location: string | null; description: string | null; achievements: unknown; startDate: string | null; endDate: string | null; isCurrent: boolean }>;
  skills: Array<{ id: string; name: string; category: string | null; proficiency: number | null; description: string | null }>;
  projects: Array<{ id: string; name: string; summary: string | null; description: string | null; role: string | null; technologies: unknown; githubUrl: string | null; demoUrl: string | null; isFeatured?: boolean }>;
  interests: Array<{ id: string; title: string; description: string | null }>;
}

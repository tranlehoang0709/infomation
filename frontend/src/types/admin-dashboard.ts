export interface AdminDashboardSummary {
  portfolio: { title: string; isPublished: boolean };
  sections: {
    profile: { total: number; visible: number };
    educations: { total: number; visible: number };
    certificates: { total: number; visible: number };
    experiences: { total: number; visible: number };
    skills: { total: number; visible: number };
    projects: { total: number; visible: number };
    interests: { total: number; visible: number };
    media: { total: number };
  };
  system: { database: 'connected' };
}

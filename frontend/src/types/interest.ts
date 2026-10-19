export interface InterestRecord {
  id: string;
  portfolioId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  icon: { id: string; altText: string | null; filePath: string } | null;
}

export interface InterestListResponse { interests: InterestRecord[] }

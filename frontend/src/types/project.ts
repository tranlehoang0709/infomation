export interface ProjectMedia { id: string; altText: string | null; filePath: string }

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  role: string | null;
  technologies: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isFeatured: boolean;
  sortOrder: number;
  isVisible: boolean;
  thumbnail: ProjectMedia | null;
  gallery: ProjectMedia[];
}

export interface ProjectListResponse { projects: ProjectRecord[] }
export interface ProjectDetailResponse { project: ProjectRecord }
export interface ProjectInput {
  title: string; slug: string; shortDescription: string; description: string; role: string;
  technologies: string; githubUrl: string; demoUrl: string; startDate: string; endDate: string;
  isFeatured: boolean; sortOrder: number; isVisible: boolean;
  thumbnailMediaId: string | null; galleryMediaIds: string[];
}

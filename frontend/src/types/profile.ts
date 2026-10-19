export interface Profile {
  id: string;
  fullName: string;
  headline: string | null;
  phone: string | null;
  contactEmail: string | null;
  location: string | null;
  bio: string | null;
  avatarMediaId: string | null;
  cvMediaId: string | null;
  coverMediaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfileResponse {
  profile: Profile | null;
  portfolio: { title: string; slug: string };
}

export interface PublicProfileResponse {
  title: string;
  profile: Pick<Profile, 'fullName' | 'headline' | 'phone' | 'contactEmail' | 'location' | 'bio'> & {
    avatarUrl: string | null; cvUrl: string | null; coverUrl: string | null;
  };
}

export interface ProfileInput {
  fullName: string;
  headline: string | null;
  phone: string | null;
  contactEmail: string | null;
  location: string | null;
  bio: string | null;
  avatarMediaId: string | null;
  cvMediaId: string | null;
  coverMediaId: string | null;
}

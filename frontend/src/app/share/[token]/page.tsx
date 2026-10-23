import { notFound } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { SharedPortfolioView } from '@/components/profile/shared-portfolio-view';
import type { SharedPortfolioResponse } from '@/types/shared-portfolio';

export const dynamic = 'force-dynamic';
export default async function SharedPortfolioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try { return <SharedPortfolioView data={await apiRequest<SharedPortfolioResponse>(`/share-links/public/${encodeURIComponent(token)}`)} />; }
  catch { notFound(); }
}

import { lazy, Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import HeroSection from '@/components/home/HeroSection';
import LastOrderStrip from '@/components/home/LastOrderStrip';
import { Skeleton } from '@/components/ui/skeleton';

const NearYouSection = lazy(() => import('@/components/home/NearYouSection'));
const PopularTodaySection = lazy(() => import('@/components/home/PopularTodaySection'));
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const TopRatedSection = lazy(() => import('@/components/home/TopRatedSection'));

function SectionSkeleton() {
  return (
    <div className="px-4 py-8">
      <Skeleton className="h-5 w-28 mb-5" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="min-w-[160px] h-[220px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen pb-22 bg-background">
      <TopBar />
      <main>
        <HeroSection />
        <LastOrderStrip />
        <Suspense fallback={<SectionSkeleton />}>
          <NearYouSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <PopularTodaySection />
        </Suspense>
        <Suspense fallback={<div className="h-32" />}>
          <StatsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <TopRatedSection />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

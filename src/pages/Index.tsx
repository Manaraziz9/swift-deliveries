import { lazy, Suspense } from 'react';
import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import HeroSection from '@/components/home/HeroSection';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load non-critical sections
const DomainTiles = lazy(() => import('@/components/home/DomainTiles'));
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const TopRatedSection = lazy(() => import('@/components/home/TopRatedSection'));

function SectionSkeleton() {
  return (
    <div className="container py-10">
      <Skeleton className="h-6 w-32 mx-auto mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-ya-md" />
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
        <Suspense fallback={<SectionSkeleton />}>
          <DomainTiles />
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

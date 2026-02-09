import TopBar from '@/components/layout/TopBar';
import BottomNav from '@/components/layout/BottomNav';
import HeroSection from '@/components/home/HeroSection';
import DomainTiles from '@/components/home/DomainTiles';
import TopRatedSection from '@/components/home/TopRatedSection';

export default function Index() {
  return (
    <div className="min-h-screen pb-22 bg-background">
      <TopBar />
      <main>
        <HeroSection />
        <DomainTiles />
        <TopRatedSection />
      </main>
      <BottomNav />
    </div>
  );
}

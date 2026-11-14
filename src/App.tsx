import { useEffect, useState } from 'react';
import { AdhkarSection } from '@/src/components/AdhkarSection';
import { Header } from '@/src/components/Header';
import { MenuSection } from '@/src/components/MenuSection';
import { ReadSection } from '@/src/components/ReadSection';
import { RecitationSection } from '@/src/components/RecitationSection';
import { VisualSection } from '@/src/components/VisualSection';
import type { AppSection } from '@/src/hooks/useSurahText';
import {
  loadLearnerProgress,
  type LearnerProgress,
} from '@/src/utils/memorizationProgress';
import {
  loadSelectedReciterId,
  saveSelectedReciterId,
} from '@/src/data/reciters';

function getInitialSurah(): number {
  try {
    const saved = Number(localStorage.getItem('surah'));
    if (saved >= 1 && saved <= 114) return saved;
  } catch {
    // Ignore storage errors
  }
  return 1;
}

function getInitialDark(): boolean {
  try {
    return localStorage.getItem('dark') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('menu');
  const [currentSurah, setCurrentSurah] = useState<number>(getInitialSurah);
  const [isDark, setIsDark] = useState<boolean>(getInitialDark);
  const [learnerProgress, setLearnerProgress] = useState<LearnerProgress>(loadLearnerProgress);
  const [selectedReciterId, setSelectedReciterId] = useState<string>(loadSelectedReciterId);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('dark', isDark ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  const handleSelectSurah = (surahNum: number) => {
    const clamped = Math.max(1, Math.min(114, surahNum));
    setCurrentSurah(clamped);
    try {
      localStorage.setItem('surah', String(clamped));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectReciter = (reciterId: string) => {
    setSelectedReciterId(reciterId);
    saveSelectedReciterId(reciterId);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F4EE] dark:bg-[#0D1110] text-[#171C19] dark:text-[#EEF2EF]">
      <Header
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {activeSection === 'menu' && (
          <MenuSection
            currentSurah={currentSurah}
            onSelectSurah={handleSelectSurah}
            onNavigate={setActiveSection}
            learnerProgress={learnerProgress}
          />
        )}

        {activeSection === 'read' && (
          <ReadSection
            currentSurah={currentSurah}
            onSelectSurah={handleSelectSurah}
            selectedReciterId={selectedReciterId}
            onSelectReciter={handleSelectReciter}
          />
        )}

        {activeSection === 'visual' && (
          <VisualSection
            currentSurah={currentSurah}
            onSelectSurah={handleSelectSurah}
            learnerProgress={learnerProgress}
            onProgressChange={setLearnerProgress}
            selectedReciterId={selectedReciterId}
            onSelectReciter={handleSelectReciter}
          />
        )}

        {activeSection === 'recitation' && (
          <RecitationSection
            currentSurah={currentSurah}
            onSelectSurah={handleSelectSurah}
            learnerProgress={learnerProgress}
            onProgressChange={setLearnerProgress}
            selectedReciterId={selectedReciterId}
            onSelectReciter={handleSelectReciter}
          />
        )}

        {activeSection === 'adhkar' && <AdhkarSection />}
      </main>
    </div>
  );
}

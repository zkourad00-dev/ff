import { FULL_QURAN } from '@/src/data/quranData';

export type AppSection = 'menu' | 'read' | 'visual' | 'recitation' | 'adhkar';

interface SurahFetchState {
  ayahs: string[] | null;
  loading: boolean;
  error: string | null;
  source: 'local';
}

export function useSurahText(surahNum: number): SurahFetchState {
  const ayahs = FULL_QURAN[String(surahNum)] || null;
  return {
    ayahs,
    loading: false,
    error: ayahs ? null : 'تعذر العثور على السورة في البيانات المحلية.',
    source: 'local',
  };
}

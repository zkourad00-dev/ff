import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus, Play, Plus, Square, Volume2 } from 'lucide-react';
import { ReciterSelector } from '@/src/components/ReciterSelector';
import { SurahIndex } from '@/src/components/SurahIndex';
import { AYAH_COUNTS, SURAH_NAMES } from '@/src/data/quranData';
import { useSurahText } from '@/src/hooks/useSurahText';
import { OfflineReciter, type OfflinePlaybackMode } from '@/src/utils/offlineReciter';

interface ReadSectionProps {
  currentSurah: number;
  onSelectSurah: (surahNum: number) => void;
  selectedReciterId: string;
  onSelectReciter: (reciterId: string) => void;
}

export function ReadSection({
  currentSurah,
  onSelectSurah,
  selectedReciterId,
  onSelectReciter,
}: ReadSectionProps) {
  const { ayahs, error } = useSurahText(currentSurah);
  const [fontSize, setFontSize] = useState<number>(28);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<OfflinePlaybackMode>('auto');

  const reciterRef = useRef<OfflineReciter | null>(null);
  const ayahRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  if (!reciterRef.current) {
    reciterRef.current = new OfflineReciter();
  }

  const surahName = SURAH_NAMES[currentSurah - 1];
  const totalAyahCount = AYAH_COUNTS[currentSurah - 1];

  const stopAudio = useCallback(() => {
    reciterRef.current?.stop();
    setIsPlaying(false);
    setActiveAyah(null);
    setPlaybackNotice(null);
  }, []);

  useEffect(() => {
    stopAudio();
  }, [currentSurah, stopAudio]);

  useEffect(() => {
    return () => {
      reciterRef.current?.stop();
    };
  }, []);

  const playFromAyah = useCallback(
    (startIndex: number) => {
      if (!ayahs || ayahs.length === 0) return;

      setIsPlaying(true);
      reciterRef.current?.playFrom(
        currentSurah,
        ayahs,
        startIndex,
        {
          mode: playbackMode,
          repeatSingle: false,
          delayBetweenMs: 450,
          reciterId: selectedReciterId,
        },
        {
          onAyahStart: (idx) => {
            setActiveAyah(idx);
            const el = ayahRefs.current[idx];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          },
          onModeInfo: (msg) => {
            setPlaybackNotice(msg);
          },
          onComplete: () => {
            setIsPlaying(false);
            setActiveAyah(null);
            setPlaybackNotice('تم إتمام تلاوة السورة كاملة.');
          },
        }
      );
    },
    [ayahs, currentSurah, playbackMode, selectedReciterId]
  );

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    playFromAyah(activeAyah ?? 0);
  };

  const progressPercent = useMemo(() => {
    if (activeAyah === null || !ayahs || ayahs.length === 0) return 0;
    return Math.min(100, Math.round(((activeAyah + 1) / ayahs.length) * 100));
  }, [activeAyah, ayahs]);

  const showOpeningBismillah = currentSurah !== 1 && currentSurah !== 9;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4">
        <SurahIndex currentSurah={currentSurah} onSelectSurah={onSelectSurah} />
      </div>

      <section className="lg:col-span-8 rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-5 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EFECE4] dark:border-[#242E2A]">
          <div>
            <h1 className="font-quran text-2xl sm:text-3xl font-bold text-[#14532D] dark:text-[#4ADE80]">
              سورة {surahName}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C6660] dark:text-[#9CA8A1] mt-1 tabular-nums">
              السورة رقم {currentSurah} · {totalAyahCount} آيات · متوفرة بدون إنترنت
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5C6660] dark:text-[#9CA8A1] hidden sm:inline">حجم الخط</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(20, s - 2))}
              aria-label="تصغير الخط"
              className="min-h-[40px] min-w-[40px] rounded-lg border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#1A221F] flex items-center justify-center text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#EFECE4] dark:hover:bg-[#232D29] cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium tabular-nums w-8 text-center">{fontSize}</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(40, s + 2))}
              aria-label="تكبير الخط"
              className="min-h-[40px] min-w-[40px] rounded-lg border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#1A221F] flex items-center justify-center text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#EFECE4] dark:hover:bg-[#232D29] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ReciterSelector
          selectedReciterId={selectedReciterId}
          onSelectReciter={(id) => {
            stopAudio();
            onSelectReciter(id);
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePlayToggle}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              isPlaying
                ? 'bg-[#B45309] hover:bg-[#92400E] text-white'
                : 'bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'إيقاف القراءة' : 'بدء القراءة حتى آخر السورة'}</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2EFE8] dark:bg-[#1B2320]">
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setPlaybackMode('auto');
              }}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                playbackMode === 'auto'
                  ? 'bg-white dark:bg-[#27332E] text-[#14532D] dark:text-[#4ADE80]'
                  : 'text-[#525E57] dark:text-[#9CA8A1]'
              }`}
            >
              قراءة صوتية
            </button>
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setPlaybackMode('timer');
              }}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                playbackMode === 'timer'
                  ? 'bg-white dark:bg-[#27332E] text-[#14532D] dark:text-[#4ADE80]'
                  : 'text-[#525E57] dark:text-[#9CA8A1]'
              }`}
            >
              تمرير تلقائي
            </button>
          </div>

          <button
            type="button"
            onClick={() => currentSurah > 1 && onSelectSurah(currentSurah - 1)}
            disabled={currentSurah <= 1}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-sm font-medium text-[#171C19] dark:text-[#EEF2EF] disabled:opacity-40 hover:bg-[#EFECE4] dark:hover:bg-[#232D29] inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابقة</span>
          </button>

          <button
            type="button"
            onClick={() => currentSurah < 114 && onSelectSurah(currentSurah + 1)}
            disabled={currentSurah >= 114}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-sm font-medium text-[#171C19] dark:text-[#EEF2EF] disabled:opacity-40 hover:bg-[#EFECE4] dark:hover:bg-[#232D29] inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span>التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          {activeAyah !== null && ayahs && (
            <span className="text-xs font-medium text-[#14532D] dark:text-[#4ADE80] inline-flex items-center gap-1.5 mr-auto tabular-nums">
              <Volume2 className="w-4 h-4" />
              الآية {activeAyah + 1} من {ayahs.length}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-[#EAE6DC] dark:bg-[#232D29] overflow-hidden">
            <div
              className="h-full bg-[#14532D] dark:bg-[#4ADE80] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {playbackNotice && (
            <p className="text-xs text-[#525E57] dark:text-[#A3B0A8]">{playbackNotice}</p>
          )}
        </div>

        <div className="rounded-xl border border-[#EFECE4] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-5 sm:p-8 min-h-[260px] max-h-[540px] overflow-y-auto">
          {error || !ayahs ? (
            <div className="py-14 text-center space-y-3">
              <p className="font-quran text-2xl font-bold text-[#14532D] dark:text-[#4ADE80]">
                سورة {surahName}
              </p>
              <p className="text-xs text-[#92400E] dark:text-[#FBBF24] max-w-md mx-auto leading-relaxed">
                {error || 'بيانات الآيات غير متوفرة حالياً.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {showOpeningBismillah && (
                <div className="font-quran text-center text-2xl text-[#14532D] dark:text-[#4ADE80] pb-4 border-b border-dashed border-[#D8D1C5] dark:border-[#2A3631]">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              <div
                className="font-quran text-justify text-[#171C19] dark:text-[#F1F5F2] leading-[2.45]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {ayahs.map((text, idx) => {
                  const isCurrent = activeAyah === idx;
                  return (
                    <span
                      key={idx}
                      ref={(el) => {
                        ayahRefs.current[idx] = el;
                      }}
                      onClick={() => playFromAyah(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          playFromAyah(idx);
                        }
                      }}
                      className={`inline px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#D1FAE5] dark:bg-[#14532D] text-[#064E3B] dark:text-white underline decoration-[#14532D] dark:decoration-[#4ADE80] decoration-2 underline-offset-8'
                          : 'hover:bg-[#EFECE4] dark:hover:bg-[#1C2421]'
                      }`}
                    >
                      {text}
                      <span className="inline-flex items-center justify-center mx-1.5 text-[0.52em] font-ui font-bold w-7 h-7 rounded-full border border-[#14532D]/40 dark:border-[#4ADE80]/40 bg-white dark:bg-[#19211E] text-[#14532D] dark:text-[#4ADE80] align-middle tabular-nums">
                        {idx + 1}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[#5C6660] dark:text-[#9CA8A1]">
          اضغط على أي آية لتبدأ القراءة المتواصلة منها حتى آخر السورة (بدون إنترنت).
        </p>
      </section>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  Lock,
  Play,
  Repeat,
  Square,
  Unlock,
} from 'lucide-react';
import { ReciterSelector } from '@/src/components/ReciterSelector';
import { SurahIndex } from '@/src/components/SurahIndex';
import {
  AYAH_COUNTS,
  AYAH_MEANINGS,
  SURAH_NAMES,
  VISUAL_ARTWORKS,
} from '@/src/data/quranData';
import { useSurahText } from '@/src/hooks/useSurahText';
import {
  getMemorizedStats,
  isSurahUnlockedForMemorization,
  sealMemorizedSurah,
  type LearnerProgress,
} from '@/src/utils/memorizationProgress';
import { OfflineReciter } from '@/src/utils/offlineReciter';
import {
  MINUTES_PER_AYAH,
  clearSurahTimer,
  formatTimerDuration,
  getActiveSurahTimer,
  getSurahTimerMinutes,
  getSurahTimerSeconds,
  loadSurahTimers,
  startSurahTimer,
  type SurahTimerEntry,
} from '@/src/utils/surahTimers';

interface VisualSectionProps {
  currentSurah: number;
  onSelectSurah: (surahNum: number) => void;
  learnerProgress: LearnerProgress;
  onProgressChange: (next: LearnerProgress) => void;
  selectedReciterId: string;
  onSelectReciter: (reciterId: string) => void;
}

export function VisualSection({
  currentSurah,
  onSelectSurah,
  learnerProgress,
  onProgressChange,
  selectedReciterId,
  onSelectReciter,
}: VisualSectionProps) {
  const [surahTimers, setSurahTimers] = useState<Record<number, SurahTimerEntry>>(loadSurahTimers);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [unlockedNotice, setUnlockedNotice] = useState<string | null>(null);

  const activeTimer = getActiveSurahTimer(surahTimers, nowMs);
  const activeSurah = activeTimer ? activeTimer.surahNum : currentSurah;
  const { ayahs, error } = useSurahText(activeSurah);

  const [ayahIndex, setAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number>(0);
  const [customImageSrc, setCustomImageSrc] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reciterRef = useRef<OfflineReciter | null>(null);
  if (!reciterRef.current) {
    reciterRef.current = new OfflineReciter();
  }

  const levelAccess = isSurahUnlockedForMemorization(activeSurah, learnerProgress);
  const stats = getMemorizedStats(learnerProgress);

  const stopPlayback = useCallback(() => {
    reciterRef.current?.stop();
    setIsPlaying(false);
    setNotice(null);
  }, []);

  useEffect(() => {
    if (!activeTimer) return;
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      if (now >= activeTimer.expiresAt) {
        const finishedSurah = activeTimer.surahNum;
        setSurahTimers((prev) => clearSurahTimer(prev, finishedSurah));
        const updatedProgress = sealMemorizedSurah(learnerProgress, finishedSurah, 'visual');
        onProgressChange(updatedProgress);
        setUnlockedNotice(
          `انقضى مؤقت سورة ${SURAH_NAMES[finishedSurah - 1]} (${activeTimer.durationMinutes} دقيقة) وتم ختم وحفظ آياتها في سجلك! يمكنك الآن اختيار سورة جديدة.`
        );
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTimer, learnerProgress, onProgressChange]);

  useEffect(() => {
    stopPlayback();
    setAyahIndex(0);
  }, [activeSurah, stopPlayback]);

  useEffect(() => {
    setImageError(false);
  }, [ayahIndex, activeSurah, selectedArtworkIndex, customImageSrc]);

  useEffect(() => {
    return () => {
      reciterRef.current?.stop();
    };
  }, []);

  const handleSelectDeviceImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) return;

      const img = new window.Image();
      img.onload = () => {
        const maxDim = 480;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setCustomImageSrc(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          setCustomImageSrc(result);
        }
        setImageError(false);
      };
      img.onerror = () => {
        setCustomImageSrc(result);
        setImageError(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleStartLockedSession = () => {
    if (!levelAccess.unlocked) return;
    const { timers, entry } = startSurahTimer(
      surahTimers,
      currentSurah,
      selectedArtworkIndex,
      customImageSrc
    );
    setSurahTimers(timers);
    setNowMs(entry.startedAt);
    setUnlockedNotice(null);
    setAyahIndex(0);
  };

  const startFromAyah = useCallback(
    (startIdx: number, repeat: boolean) => {
      if (!ayahs || ayahs.length === 0) return;
      setIsPlaying(true);
      reciterRef.current?.playFrom(
        activeSurah,
        ayahs,
        startIdx,
        {
          mode: 'auto',
          repeatSingle: repeat,
          delayBetweenMs: 1200,
          reciterId: selectedReciterId,
        },
        {
          onAyahStart: (idx) => {
            setAyahIndex(idx);
          },
          onModeInfo: (msg) => {
            setNotice(msg);
          },
          onComplete: () => {
            setIsPlaying(false);
            setNotice('تم إتمام العرض التحفيظي للسورة.');
          },
        }
      );
    },
    [ayahs, activeSurah, selectedReciterId]
  );

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    startFromAyah(ayahIndex, repeatAyah);
  };

  const handleToggleRepeat = () => {
    const nextRepeat = !repeatAyah;
    setRepeatAyah(nextRepeat);
    if (isPlaying) {
      startFromAyah(ayahIndex, nextRepeat);
    }
  };

  const selectedAyahCount = ayahs?.length || AYAH_COUNTS[activeSurah - 1];
  const totalMinutesRequired = getSurahTimerMinutes(activeSurah);
  const totalDurationSeconds = getSurahTimerSeconds(activeSurah);

  const totalRemainingSeconds = activeTimer
    ? Math.max(0, Math.ceil((activeTimer.expiresAt - nowMs) / 1000))
    : totalDurationSeconds;

  const surahTimerProgress = activeTimer
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((totalDurationSeconds - totalRemainingSeconds) / totalDurationSeconds) * 100)
        )
      )
    : 0;

  const activeArtworkIndex = activeTimer?.artworkIndex ?? selectedArtworkIndex;
  const activeCustomSrc = activeTimer ? activeTimer.customImageSrc : customImageSrc;
  const baseArtwork = VISUAL_ARTWORKS[activeArtworkIndex] || VISUAL_ARTWORKS[0];
  const artwork = activeCustomSrc
    ? {
        src: activeCustomSrc,
        alt: 'الصورة المختارة للحفظ',
        caption: 'الصورة المختارة لحفظ السورة',
        cropTop: false,
      }
    : baseArtwork;
  const currentAyahText = ayahs?.[ayahIndex] || '';
  const meaningKey = `${activeSurah}:${ayahIndex + 1}`;
  const meaningText =
    AYAH_MEANINGS[meaningKey] ||
    `تدبر الآية رقم ${ayahIndex + 1} من سورة ${SURAH_NAMES[activeSurah - 1]} مع ربطها بالمشهد البصري: ${artwork.caption}.`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4">
        <SurahIndex
          currentSurah={activeSurah}
          onSelectSurah={(num) => {
            if (!activeTimer) {
              onSelectSurah(num);
            }
          }}
          title={activeTimer ? 'السورة مقفلة حتى انتهاء مؤقتها' : 'اختر السورة (لكل سورة مؤقت خاص)'}
          disabled={Boolean(activeTimer)}
          disabledMessage={
            activeTimer
              ? `مؤقت سورة ${SURAH_NAMES[activeSurah - 1]} يعمل الآن. المتبقي: ${formatTimerDuration(totalRemainingSeconds)}`
              : undefined
          }
          learnerProgress={learnerProgress}
          enforceLevelLock={true}
          showSurahTimers={true}
        />
      </div>

      <section className="lg:col-span-8 space-y-6">
        {!activeTimer && !levelAccess.unlocked ? (
          <div className="rounded-2xl border border-[#FDE68A] dark:border-[#92400E] bg-white dark:bg-[#151B19] p-6 sm:p-10 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2]">
                سورة {SURAH_NAMES[activeSurah - 1]} مقفلة في مستواك الحالي
              </h1>
              <p className="text-sm text-[#525E57] dark:text-[#A3B0A8] leading-relaxed">
                هذه السورة ضمن المستوى {levelAccess.requiredLevel}، بينما مستواك المفتوح حالياً هو المستوى {stats.unlockedLevel} ({stats.currentLevelDef.title}). أكمل حفظ سور مستواك الحالي أولاً لفتحها.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectSurah(stats.nextTargetSurah)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] text-white text-sm font-semibold cursor-pointer"
            >
              الانتقال إلى سورة {stats.nextTargetSurahName} في مستواك
            </button>
          </div>
        ) : !activeTimer ? (
          <div className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#EFECE4] dark:border-[#242E2A]">
              <div className="text-right">
                <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2]">
                  مؤقت التحفيظ بالصور · سورة {SURAH_NAMES[activeSurah - 1]}
                </h1>
                <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] mt-0.5">
                  لكل سورة مؤقت خاص يُحسب حسب عدد آياتها ({MINUTES_PER_AYAH} دقائق لكل آية) وهذا فقط.
                </p>
              </div>
              <span className="text-xs font-medium text-[#14532D] dark:text-[#4ADE80] inline-flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                <span>المستوى {stats.unlockedLevel} متاح</span>
              </span>
            </div>

            {unlockedNotice && (
              <div className="w-full rounded-xl border border-[#16A34A]/40 bg-[#ECFDF3] dark:bg-[#14532D]/30 p-3.5 text-xs font-semibold text-[#14532D] dark:text-[#4ADE80]">
                {unlockedNotice}
              </div>
            )}

            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#14532D]/20 dark:border-[#4ADE80]/25 bg-[#F2EFE8] dark:bg-[#1A221F] shrink-0">
              {!imageError ? (
                <img
                  src={artwork.src}
                  alt={artwork.alt}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className={`w-full h-full object-cover ${
                    artwork.cropTop ? 'object-top scale-125 origin-top' : 'object-center'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-xs text-[#525E57] dark:text-[#A3B0A8]">
                  <span>{artwork.caption}</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-right">
                <span className="text-xs font-bold text-[#171C19] dark:text-[#EEF2EF]">
                  1. اختر الصورة التي تريد الحفظ عليها قبل بدء المؤقت:
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] hover:border-[#14532D] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" />
                  <span>اختر صورة من جهازك</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectDeviceImage}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VISUAL_ARTWORKS.map((item, idx) => {
                  const isChosen = !customImageSrc && selectedArtworkIndex === idx;
                  return (
                    <button
                      key={item.alt}
                      type="button"
                      onClick={() => {
                        setCustomImageSrc(undefined);
                        setSelectedArtworkIndex(idx);
                        setImageError(false);
                      }}
                      className={`rounded-xl border p-2 text-right transition-colors cursor-pointer space-y-1.5 ${
                        isChosen
                          ? 'border-2 border-[#14532D] dark:border-[#4ADE80] bg-[#ECFDF3] dark:bg-[#14532D]/25'
                          : 'border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] hover:border-[#14532D]/60'
                      }`}
                    >
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#EAE6DC] dark:bg-[#1A221F]">
                        <img
                          src={item.src}
                          alt={item.alt}
                          className={`w-full h-full object-cover ${
                            item.cropTop ? 'object-top scale-125 origin-top' : 'object-center'
                          }`}
                        />
                        {isChosen && (
                          <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#14532D] dark:bg-[#16A34A] text-white flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-[#171C19] dark:text-[#EEF2EF] line-clamp-2 leading-snug">
                        {item.caption}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 max-w-md w-full">
              <h2 className="font-quran text-3xl font-bold text-[#14532D] dark:text-[#4ADE80]">
                سورة {SURAH_NAMES[activeSurah - 1]}
              </h2>
              <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 space-y-1.5">
                <div className="text-xs font-semibold text-[#525E57] dark:text-[#9CA8A1]">
                  المؤقت الخاص بسورة {SURAH_NAMES[activeSurah - 1]}
                </div>
                <div className="text-2xl font-bold text-[#14532D] dark:text-[#4ADE80] tabular-nums">
                  {totalMinutesRequired} دقيقة ({formatTimerDuration(totalDurationSeconds)})
                </div>
                <div className="text-xs text-[#5C6660] dark:text-[#9CA8A1] tabular-nums">
                  {selectedAyahCount} آيات × {MINUTES_PER_AYAH} دقائق = {totalMinutesRequired} دقيقة
                </div>
              </div>
              <p className="text-xs text-[#5C6660] dark:text-[#9CA8A1] leading-relaxed">
                بعد اختيار السورة والصورة، اضغط لبدء المؤقت؛ وتبقى الصورة والسورة مقفلتين حتى ينتهي الوقت وتُحفظ في سجلك.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartLockedSession}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>تثبيت الصورة وبدء المؤقت ({totalMinutesRequired} دقيقة)</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE4] dark:border-[#242E2A]">
              <div className="text-right">
                <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24]" />
                  <span>التحفيظ بالصور · سورة {SURAH_NAMES[activeSurah - 1]}</span>
                </h1>
                <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] mt-0.5 tabular-nums">
                  الآية {ayahIndex + 1} من {ayahs?.length || selectedAyahCount}
                </p>
              </div>

              <div className="text-left">
                <div className="text-[11px] text-[#5C6660] dark:text-[#9CA8A1]">
                  مؤقت سورة {SURAH_NAMES[activeSurah - 1]} ({totalMinutesRequired} دقيقة)
                </div>
                <div className="text-base font-bold text-[#B45309] dark:text-[#FBBF24] tabular-nums inline-flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimerDuration(totalRemainingSeconds)}</span>
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl border border-[#EFECE4] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171C19] dark:text-[#EEF2EF] tabular-nums">
                  مؤقت السورة: {selectedAyahCount} آيات × {MINUTES_PER_AYAH} دقائق = {totalMinutesRequired} دقيقة
                </span>
                <span className="font-bold text-[#14532D] dark:text-[#4ADE80] tabular-nums">
                  {formatTimerDuration(totalRemainingSeconds)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#EAE6DC] dark:bg-[#232D29] overflow-hidden">
                <div
                  className="h-full bg-[#14532D] dark:bg-[#4ADE80] transition-all duration-300"
                  style={{ width: `${surahTimerProgress}%` }}
                />
              </div>
            </div>

            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden border-4 border-[#14532D]/20 dark:border-[#4ADE80]/25 bg-[#F2EFE8] dark:bg-[#1A221F] shrink-0">
              {!imageError ? (
                <img
                  src={artwork.src}
                  alt={artwork.alt}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className={`w-full h-full object-cover ${
                    artwork.cropTop ? 'object-top scale-125 origin-top' : 'object-center'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-xs text-[#525E57] dark:text-[#A3B0A8]">
                  <span>{artwork.caption}</span>
                </div>
              )}
            </div>

            {error || !ayahs ? (
              <p className="text-sm text-[#92400E] dark:text-[#FBBF24] py-6">
                {error || 'تعذر تحميل الآيات لهذه السورة.'}
              </p>
            ) : (
              <div className="space-y-4 w-full">
                <p className="font-quran text-2xl sm:text-3xl font-bold text-[#14532D] dark:text-[#4ADE80] leading-[2] text-balance">
                  {currentAyahText}
                </p>
                <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 text-right space-y-1">
                  <div className="text-xs font-bold text-[#14532D] dark:text-[#4ADE80]">
                    المعنى والتدبر
                  </div>
                  <p className="text-sm text-[#37413B] dark:text-[#C5D0CA] leading-relaxed">
                    {meaningText}
                  </p>
                </div>
              </div>
            )}

            <div className="w-full pt-2 border-t border-[#EFECE4] dark:border-[#242E2A] space-y-3">
              <ReciterSelector
                selectedReciterId={selectedReciterId}
                onSelectReciter={(id) => {
                  stopPlayback();
                  onSelectReciter(id);
                }}
                compact
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`min-h-[48px] px-5 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                    isPlaying
                      ? 'bg-[#B45309] hover:bg-[#92400E] text-white'
                      : 'bg-[#0369A1] hover:bg-[#075985] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white'
                  }`}
                >
                  {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'إيقاف الصوت' : 'تشغيل التلاوة'}</span>
                </button>

                <button
                  type="button"
                  disabled={!ayahs || ayahIndex <= 0}
                  onClick={() => {
                    const nextIdx = Math.max(0, ayahIndex - 1);
                    if (isPlaying) {
                      startFromAyah(nextIdx, repeatAyah);
                    } else {
                      setAyahIndex(nextIdx);
                    }
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] disabled:opacity-40 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الآية السابقة</span>
                </button>

                <button
                  type="button"
                  disabled={!ayahs || ayahIndex >= ayahs.length - 1}
                  onClick={() => {
                    const nextIdx = ayahs ? Math.min(ayahs.length - 1, ayahIndex + 1) : ayahIndex;
                    if (isPlaying) {
                      startFromAyah(nextIdx, repeatAyah);
                    } else {
                      setAyahIndex(nextIdx);
                    }
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] disabled:opacity-40 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <span>الآية التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleRepeat}
                className={`w-full min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  repeatAyah
                    ? 'border-[#14532D] dark:border-[#4ADE80] bg-[#ECFDF3] dark:bg-[#14532D]/35 text-[#14532D] dark:text-[#4ADE80]'
                    : 'border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-[#525E57] dark:text-[#9CA8A1]'
                }`}
              >
                <Repeat className="w-4 h-4" />
                <span>{repeatAyah ? 'تكرار الآية الحالية: مفعّل' : 'تكرار الآية الحالية: متوقف'}</span>
              </button>

              {notice && (
                <p className="text-xs text-right text-[#525E57] dark:text-[#A3B0A8] bg-[#FAF8F4] dark:bg-[#111614] border border-[#E5E0D5] dark:border-[#242E2A] rounded-xl p-3">
                  {notice}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

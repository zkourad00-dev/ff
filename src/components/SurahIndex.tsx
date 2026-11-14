import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Lock, Search, X } from 'lucide-react';
import {
  AYAH_COUNTS,
  SURAH_NAMES,
  normalizeArabic,
} from '@/src/data/quranData';
import {
  isSurahUnlockedForMemorization,
  type LearnerProgress,
} from '@/src/utils/memorizationProgress';

interface SurahIndexProps {
  currentSurah: number;
  onSelectSurah: (surahNum: number) => void;
  title?: string;
  disabled?: boolean;
  disabledMessage?: string;
  learnerProgress?: LearnerProgress;
  enforceLevelLock?: boolean;
  showSurahTimers?: boolean;
}

export function SurahIndex({
  currentSurah,
  onSelectSurah,
  title = 'فهرس السور',
  disabled = false,
  disabledMessage,
  learnerProgress,
  enforceLevelLock = false,
  showSurahTimers = false,
}: SurahIndexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'juz30'>('all');
  const [mobileExpanded, setMobileExpanded] = useState(true);

  const filteredSurahs = useMemo(() => {
    const trimmed = searchQuery.trim();
    const q = normalizeArabic(trimmed);
    return SURAH_NAMES.map((name, idx) => {
      const num = idx + 1;
      const lockInfo =
        enforceLevelLock && learnerProgress
          ? isSurahUnlockedForMemorization(num, learnerProgress)
          : { unlocked: true, requiredLevel: 1 };
      const isMemorized = Boolean(learnerProgress?.memorizedSurahs[num]);
      return {
        num,
        name,
        ayahCount: AYAH_COUNTS[idx],
        unlocked: lockInfo.unlocked,
        requiredLevel: lockInfo.requiredLevel,
        isMemorized,
      };
    }).filter((s) => {
      if (filterMode === 'juz30' && s.num < 78) return false;
      if (!q) return true;
      return normalizeArabic(s.name).includes(q) || String(s.num) === trimmed;
    });
  }, [searchQuery, filterMode, enforceLevelLock, learnerProgress]);

  const currentName = SURAH_NAMES[currentSurah - 1];

  return (
    <aside className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#171C19] dark:text-[#F1F5F2] flex items-center gap-1.5">
            {disabled && <Lock className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24]" />}
            <span>{title}</span>
          </h2>
          <p className="text-xs text-[#5C6660] dark:text-[#9CA8A1] tabular-nums">
            المحددة: سورة {currentName} · {filteredSurahs.length} من 114
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileExpanded((prev) => !prev)}
          aria-expanded={mobileExpanded}
          className="lg:hidden min-h-[40px] px-3 py-1.5 rounded-lg border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-medium text-[#171C19] dark:text-[#EEF2EF] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <span>{mobileExpanded ? 'طي الفهرس' : 'عرض السور'}</span>
          {mobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {disabled && disabledMessage && (
        <div className="rounded-xl border border-[#FDE68A] dark:border-[#92400E] bg-[#FFFBEB] dark:bg-[#78350F]/30 p-3 text-xs font-medium text-[#92400E] dark:text-[#FBBF24] leading-relaxed">
          {disabledMessage}
        </div>
      )}

      <div className={`${mobileExpanded ? 'block' : 'hidden'} lg:block space-y-3`}>
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7670] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            disabled={disabled}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم السورة أو رقمها..."
            aria-label="ابحث باسم السورة أو رقمها"
            className="w-full min-h-[44px] pr-9 pl-9 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-sm text-[#171C19] dark:text-[#EEF2EF] placeholder:text-[#78827C] disabled:opacity-50 focus:outline-2 focus:outline-[#14532D]"
          />
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="مسح البحث"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[#6B7670] hover:text-[#171C19] dark:hover:text-[#EEF2EF] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F2EFE8] dark:bg-[#1B2320]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setFilterMode('all')}
            className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white dark:bg-[#27332E] text-[#14532D] dark:text-[#4ADE80]'
                : 'text-[#525E57] dark:text-[#9CA8A1]'
            }`}
          >
            جميع السور (114)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setFilterMode('juz30')}
            className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
              filterMode === 'juz30'
                ? 'bg-white dark:bg-[#27332E] text-[#14532D] dark:text-[#4ADE80]'
                : 'text-[#525E57] dark:text-[#9CA8A1]'
            }`}
          >
            جزء عمّ (78–114)
          </button>
        </div>

        <div
          role="listbox"
          aria-label="قائمة السور"
          className="max-h-[260px] lg:max-h-[500px] overflow-y-auto divide-y divide-[#EFECE4] dark:divide-[#212A26] pl-1"
        >
          {filteredSurahs.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#5C6660] dark:text-[#9CA8A1]">
              لا توجد سورة مطابقة للبحث.
            </p>
          ) : (
            filteredSurahs.map((surah) => {
              const selected = surah.num === currentSurah;
              const isItemDisabled = disabled || !surah.unlocked;
              return (
                <button
                  key={surah.num}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={isItemDisabled}
                  onClick={() => {
                    if (!isItemDisabled) onSelectSurah(surah.num);
                  }}
                  className={`w-full min-h-[48px] px-3 py-2.5 text-right flex items-center justify-between gap-3 transition-colors rounded-lg ${
                    selected
                      ? 'bg-[#ECFDF3] dark:bg-[#14532D]/35 text-[#14532D] dark:text-[#4ADE80] font-semibold'
                      : isItemDisabled
                        ? 'opacity-50 text-[#171C19] dark:text-[#EEF2EF] cursor-not-allowed'
                        : 'text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#FAF8F4] dark:hover:bg-[#1A221F] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-semibold tabular-nums flex items-center justify-center shrink-0 ${
                        selected
                          ? 'bg-[#14532D] dark:bg-[#16A34A] text-white'
                          : 'bg-[#F2EFE8] dark:bg-[#222B27] text-[#37413B] dark:text-[#C5D0CA]'
                      }`}
                    >
                      {surah.num}
                    </span>
                    <span className="font-quran text-lg truncate">سورة {surah.name}</span>
                  </div>
                  <span className="text-xs text-[#5C6660] dark:text-[#9CA8A1] tabular-nums whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                    {!surah.unlocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24]" />
                        <span>مقفول · م{surah.requiredLevel}</span>
                      </>
                    ) : surah.isMemorized ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" />
                        <span>
                          {showSurahTimers ? `محفوظة · ${surah.ayahCount * 5} د` : 'محفوظة'}
                        </span>
                      </>
                    ) : (
                      <span>
                        {showSurahTimers
                          ? `${surah.ayahCount} آية · ${surah.ayahCount * 5} د`
                          : `${surah.ayahCount} آية`}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}

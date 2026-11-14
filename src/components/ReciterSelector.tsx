import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Search, Volume2 } from 'lucide-react';
import { RECITERS, getReciterById } from '@/src/data/reciters';
import { normalizeArabic } from '@/src/data/quranData';

interface ReciterSelectorProps {
  selectedReciterId: string;
  onSelectReciter: (reciterId: string) => void;
  compact?: boolean;
}

export function ReciterSelector({
  selectedReciterId,
  onSelectReciter,
  compact = false,
}: ReciterSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentReciter = getReciterById(selectedReciterId);

  const filteredReciters = useMemo(() => {
    const q = normalizeArabic(searchQuery.trim());
    if (!q) return RECITERS;
    return RECITERS.filter(
      (r) =>
        normalizeArabic(r.name).includes(q) ||
        normalizeArabic(r.style).includes(q) ||
        normalizeArabic(r.country).includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#171C19] dark:text-[#EEF2EF]">
          <Volume2 className="w-4 h-4 text-[#14532D] dark:text-[#4ADE80] shrink-0" />
          <span>القارئ ({RECITERS.length} شيخاً من أجمل القراءات)</span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="text-xs font-semibold text-[#14532D] dark:text-[#4ADE80] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{expanded ? 'إخفاء القائمة' : `استعراض الـ ${RECITERS.length} شيخاً`}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className={`flex flex-col ${compact ? '' : 'sm:flex-row sm:items-center'} gap-2`}>
        <select
          aria-label="اختر القارئ"
          value={selectedReciterId}
          onChange={(e) => onSelectReciter(e.target.value)}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-white dark:bg-[#151B19] text-sm font-semibold text-[#171C19] dark:text-[#EEF2EF] cursor-pointer"
        >
          {RECITERS.map((reciter, idx) => (
            <option key={reciter.id} value={reciter.id}>
              {idx + 1}. الشيخ {reciter.name} — {reciter.style}
            </option>
          ))}
        </select>

        {!compact && (
          <div className="text-xs text-[#525E57] dark:text-[#9CA8A1] whitespace-nowrap">
            {currentReciter.offlineLocal
              ? 'يعمل بدون إنترنت بالكامل'
              : `${currentReciter.country} · ${currentReciter.style}`}
          </div>
        )}
      </div>

      {expanded && (
        <div className="pt-2 border-t border-[#E5E0D5] dark:border-[#242E2A] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6B7670] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الشيخ أو البلد..."
              aria-label="ابحث عن قارئ"
              className="w-full min-h-[40px] pr-9 pl-3 py-1.5 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-white dark:bg-[#151B19] text-xs text-[#171C19] dark:text-[#EEF2EF] placeholder:text-[#78827C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pl-1">
            {filteredReciters.map((reciter) => {
              const isSelected = reciter.id === selectedReciterId;
              return (
                <button
                  key={reciter.id}
                  type="button"
                  onClick={() => {
                    onSelectReciter(reciter.id);
                    setExpanded(false);
                  }}
                  className={`min-h-[48px] px-3 py-2 rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#14532D] dark:border-[#4ADE80] bg-[#ECFDF3] dark:bg-[#14532D]/30 text-[#14532D] dark:text-[#4ADE80]'
                      : 'border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] text-[#171C19] dark:text-[#EEF2EF] hover:border-[#14532D]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">الشيخ {reciter.name}</div>
                    <div className="text-[11px] text-[#5C6660] dark:text-[#9CA8A1] truncate">
                      {reciter.country} · {reciter.style}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#14532D] dark:text-[#4ADE80] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

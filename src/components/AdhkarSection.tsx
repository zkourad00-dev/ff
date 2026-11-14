import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { ADHKAR_DATA } from '@/src/data/quranData';

const STORAGE_KEY = 'mushaf_adhkar_counts_v1';

function buildInitialCounts(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const item of ADHKAR_DATA) {
    defaults[item.id] = item.count;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      for (const item of ADHKAR_DATA) {
        if (typeof parsed[item.id] === 'number' && parsed[item.id] >= 0) {
          defaults[item.id] = Math.min(item.count, parsed[item.id]);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return defaults;
}

export function AdhkarSection() {
  const [filter, setFilter] = useState<'all' | 'morning' | 'tasbih'>('all');
  const [remaining, setRemaining] = useState<Record<string, number>>(buildInitialCounts);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch {
      // Ignore storage write errors
    }
  }, [remaining]);

  const handleDecrement = (id: string) => {
    setRemaining((prev) => {
      const current = prev[id] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  };

  const handleResetOne = (id: string, defaultCount: number) => {
    setRemaining((prev) => ({ ...prev, [id]: defaultCount }));
  };

  const handleResetAll = () => {
    const fresh: Record<string, number> = {};
    for (const item of ADHKAR_DATA) {
      fresh[item.id] = item.count;
    }
    setRemaining(fresh);
  };

  const visibleItems = ADHKAR_DATA.filter((item) =>
    filter === 'all' ? true : item.category === filter
  );

  const completedCount = ADHKAR_DATA.filter((item) => (remaining[item.id] ?? item.count) === 0).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2]">الأذكار والتسبيح</h1>
          <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] tabular-nums">
            المكتمل: {completedCount} من {ADHKAR_DATA.length} أذكار
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2EFE8] dark:bg-[#1B2320]">
            {[
              { id: 'all' as const, label: 'الكل' },
              { id: 'morning' as const, label: 'أذكار الصباح' },
              { id: 'tasbih' as const, label: 'تسابيح' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-white dark:bg-[#27332E] text-[#14532D] dark:text-[#4ADE80]'
                    : 'text-[#525E57] dark:text-[#9CA8A1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetAll}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#EFECE4] dark:hover:bg-[#232D29] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الكل</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleItems.map((item) => {
          const left = remaining[item.id] ?? item.count;
          const isDone = left === 0;
          const progress = Math.round(((item.count - left) / item.count) * 100);

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#5C6660] dark:text-[#9CA8A1]">
                  <span>{item.category === 'morning' ? 'أذكار الصباح' : 'تسابيح واستغفار'}</span>
                  <button
                    type="button"
                    onClick={() => handleResetOne(item.id, item.count)}
                    aria-label="إعادة ضبط هذا الذكر"
                    className="text-xs text-[#5C6660] hover:text-[#14532D] dark:hover:text-[#4ADE80] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إعادة</span>
                  </button>
                </div>

                <p className="font-quran text-2xl font-bold text-[#171C19] dark:text-[#F1F5F2] leading-[2] text-center py-2">
                  {item.text}
                </p>

                <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] text-center leading-relaxed">
                  {item.benefit}
                </p>
              </div>

              <div className="space-y-3">
                <div className="h-1.5 w-full rounded-full bg-[#EAE6DC] dark:bg-[#232D29] overflow-hidden">
                  <div
                    className="h-full bg-[#14532D] dark:bg-[#4ADE80] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDecrement(item.id)}
                  disabled={isDone}
                  className={`w-full min-h-[48px] px-5 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors tabular-nums cursor-pointer disabled:cursor-default ${
                    isDone
                      ? 'bg-[#EAE6DC] dark:bg-[#222B27] text-[#525E57] dark:text-[#9CA8A1]'
                      : 'bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white active:scale-[0.99]'
                  }`}
                >
                  {isDone ? (
                    <>
                      <Check className="w-4 h-4 text-[#14532D] dark:text-[#4ADE80]" />
                      <span>تم الذكر ({item.count})</span>
                    </>
                  ) : (
                    <span>التكرار المتبقي: {left}</span>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

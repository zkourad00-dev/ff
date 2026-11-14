import { ArrowLeft, BookOpen, CheckCircle2, Image, Lock, Mic, Sparkles } from 'lucide-react';
import { AYAH_COUNTS, SURAH_NAMES } from '@/src/data/quranData';
import type { AppSection } from '@/src/hooks/useSurahText';
import {
  MEMORIZATION_LEVELS,
  getMemorizedStats,
  type LearnerProgress,
} from '@/src/utils/memorizationProgress';

interface MenuSectionProps {
  currentSurah: number;
  onSelectSurah: (surahNum: number) => void;
  onNavigate: (section: AppSection) => void;
  learnerProgress: LearnerProgress;
}

const QUICK_SURAHS = [1, 93, 97, 103, 108, 112, 113, 114];

export function MenuSection({
  currentSurah,
  onSelectSurah,
  onNavigate,
  learnerProgress,
}: MenuSectionProps) {
  const currentName = SURAH_NAMES[currentSurah - 1];
  const currentCount = AYAH_COUNTS[currentSurah - 1];
  const stats = getMemorizedStats(learnerProgress);

  const handleQuickJump = (num: number) => {
    onSelectSurah(num);
    onNavigate('read');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-medium text-[#14532D] dark:text-[#4ADE80]">
              يعمل بالكامل بدون إنترنت · حفظ محلي على الجهاز فقط
            </p>
            <h1 className="font-quran text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171C19] dark:text-[#F1F5F2] leading-snug text-balance">
              المصحف الشريف للقراءة والتدبر والحفظ
            </h1>
            <p className="text-sm sm:text-base text-[#525E57] dark:text-[#A3B0A8] leading-relaxed max-w-xl">
              جميع سور القرآن الكريم الـ 114 مدمجة نصاً وتسجيلاً صوتياً للعمل بدون نت، مع إغلاق مستوى الحفظ والآيات المحفوظة للمتعلم وتدرّجها عبر التسميع والتحفيظ.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('read')}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>متابعة قراءة سورة {currentName}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectSurah(stats.nextTargetSurah);
                  onNavigate('visual');
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1C2421] text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#EFECE4] dark:hover:bg-[#232D29] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                متابعة التحفيظ ({stats.nextTargetSurahName})
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#19211E] p-6 space-y-5">
            <div className="flex items-center justify-between text-xs text-[#5C6660] dark:text-[#9CA8A1]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#171C19] dark:text-[#EEF2EF]">
                <Lock className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" />
                <span>مستوى الحفظ والآيات المحفوظة</span>
              </span>
              <span className="tabular-nums">مُغلق ومُثبّت</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-3.5 space-y-1">
                <div className="text-[11px] text-[#5C6660] dark:text-[#9CA8A1]">المستوى المفتوح</div>
                <div className="text-lg font-bold text-[#14532D] dark:text-[#4ADE80] tabular-nums">
                  {stats.unlockedLevel} من 5
                </div>
                <div className="text-[11px] text-[#525E57] dark:text-[#A3B0A8] truncate">
                  {stats.currentLevelDef.title}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-3.5 space-y-1">
                <div className="text-[11px] text-[#5C6660] dark:text-[#9CA8A1]">الآيات المحفوظة</div>
                <div className="text-lg font-bold text-[#171C19] dark:text-[#F1F5F2] tabular-nums">
                  {stats.memorizedAyahsCount} / 6236
                </div>
                <div className="text-[11px] text-[#525E57] dark:text-[#A3B0A8] tabular-nums">
                  {stats.memorizedSurahsCount} سورة مختومة
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] dark:border-[#242E2A] flex items-center justify-between text-xs text-[#525E57] dark:text-[#9CA8A1]">
              <span>آخر سورة مفتوحة: {currentName} ({currentCount} آية)</span>
              <span className="font-medium text-[#14532D] dark:text-[#4ADE80]">محفوظ محلياً</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="الأقسام الرئيسية">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('read')}
            className="text-right rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 hover:border-[#14532D] dark:hover:border-[#4ADE80] transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF3] dark:bg-[#14532D]/40 text-[#14532D] dark:text-[#4ADE80] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">قراءة المصحف</h2>
              <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] leading-relaxed">
                فهرس الـ 114 سورة بالكامل مع القراءة المتواصلة من أي آية حتى آخر السورة.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('visual')}
            className="text-right rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 hover:border-[#0369A1] dark:hover:border-[#38BDF8] transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F0F9FF] dark:bg-[#0C4A6E]/40 text-[#0369A1] dark:text-[#38BDF8] flex items-center justify-center">
              <Image className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">التحفيظ بالصور</h2>
              <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] leading-relaxed">
                مؤقت خاص لكل سورة حسب آياتها (5 دقائق لكل آية، مثل الفاتحة 35 دقيقة) ضمن مستواك المفتوح.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('recitation')}
            className="text-right rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 hover:border-[#B45309] dark:hover:border-[#FBBF24] transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">التسميع الذكي</h2>
              <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] leading-relaxed">
                تصحيح فوري للخطأ وإعادة السورة، وختم الآيات المحفوظة لفتح المستوى التالي.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('adhkar')}
            className="text-right rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 hover:border-[#14532D] dark:hover:border-[#4ADE80] transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#ECFDF3] dark:bg-[#14532D]/40 text-[#14532D] dark:text-[#4ADE80] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">الأذكار اليومية</h2>
              <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] leading-relaxed">
                عداد تسبيح وأذكار الصباح مع حفظ التقدم محلياً.
              </p>
            </div>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">
              مستويات الحفظ المقفلة للمتعلم
            </h2>
            <p className="text-xs text-[#5C6660] dark:text-[#9CA8A1] mt-0.5">
              المستوى والآيات المحفوظة مقفلة ومُثبّتة ولا تتغير إلا بإتمام التسميع أو مدة التحفيظ.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#14532D] dark:text-[#4ADE80] tabular-nums">
            المستوى الحالي: {stats.unlockedLevel} / 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MEMORIZATION_LEVELS.map((lvl) => {
            const isLocked = lvl.level > stats.unlockedLevel;
            const passedCount = lvl.surahs.filter(
              (s) => Boolean(learnerProgress.memorizedSurahs[s])
            ).length;
            const isCompleted = passedCount === lvl.surahs.length;

            return (
              <div
                key={lvl.level}
                className={`rounded-xl border p-4 space-y-2 ${
                  isLocked
                    ? 'border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] opacity-70'
                    : isCompleted
                      ? 'border-[#16A34A]/50 bg-[#ECFDF3] dark:bg-[#14532D]/25'
                      : 'border-[#14532D] dark:border-[#4ADE80] bg-[#FAF8F4] dark:bg-[#19211E]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isLocked ? 'text-[#5C6660] dark:text-[#9CA8A1]' : 'text-[#14532D] dark:text-[#4ADE80]'}>
                    {lvl.title}
                  </span>
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-[#B45309] dark:text-[#FBBF24]" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" />
                  ) : null}
                </div>
                <p className="text-xs text-[#525E57] dark:text-[#A3B0A8] leading-relaxed">
                  {lvl.subtitle}
                </p>
                <div className="text-[11px] font-medium text-[#5C6660] dark:text-[#9CA8A1] tabular-nums pt-1">
                  {isLocked ? 'مقفول حتى إتمام السابق' : `${passedCount} من ${lvl.surahs.length} سورة`}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#171C19] dark:text-[#F1F5F2]">
            سور مختارة سريعة القراءة (بدون إنترنت)
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('read')}
            className="text-xs font-medium text-[#14532D] dark:text-[#4ADE80] hover:underline cursor-pointer"
          >
            عرض جميع السور (114)
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_SURAHS.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleQuickJump(num)}
              className={`min-h-[48px] px-4 py-3 rounded-xl border text-right transition-colors cursor-pointer flex items-center justify-between ${
                currentSurah === num
                  ? 'border-[#14532D] dark:border-[#4ADE80] bg-[#ECFDF3] dark:bg-[#14532D]/30 text-[#14532D] dark:text-[#4ADE80]'
                  : 'border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#1A221F] text-[#171C19] dark:text-[#EEF2EF] hover:border-[#14532D]/50'
              }`}
            >
              <span className="font-quran text-lg font-bold">سورة {SURAH_NAMES[num - 1]}</span>
              <span className="text-xs text-[#5C6660] dark:text-[#9CA8A1] tabular-nums">{AYAH_COUNTS[num - 1]} آيات</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

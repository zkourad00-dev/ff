import { BookOpen, Home, Image, Mic, Moon, Sparkles, Sun } from 'lucide-react';
import type { AppSection } from '@/src/hooks/useSurahText';

interface HeaderProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string; shortLabel: string }> = [
  { id: 'menu', label: 'الرئيسية', shortLabel: 'الرئيسية' },
  { id: 'read', label: 'قراءة المصحف', shortLabel: 'القراءة' },
  { id: 'visual', label: 'التحفيظ بالصور', shortLabel: 'التحفيظ' },
  { id: 'recitation', label: 'التسميع', shortLabel: 'التسميع' },
  { id: 'adhkar', label: 'الأذكار', shortLabel: 'الأذكار' },
];

export function Header({ activeSection, onNavigate, isDark, onToggleDark }: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4]/90 dark:bg-[#111614]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => onNavigate('menu')}
            className="font-quran text-xl font-bold text-[#14532D] dark:text-[#4ADE80] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534] cursor-pointer"
          >
            المصحف الشريف
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="التنقل الرئيسي">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534] ${
                    isActive
                      ? 'text-[#14532D] dark:text-[#4ADE80] font-semibold'
                      : 'text-[#525E57] dark:text-[#9CA8A1] hover:text-[#171C19] dark:hover:text-[#EEF2EF]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#14532D] dark:bg-[#4ADE80] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            className="min-h-[44px] min-w-[44px] px-3 flex items-center justify-center gap-2 rounded-lg border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#18201D] text-[#171C19] dark:text-[#EEF2EF] hover:bg-[#F0ECE3] dark:hover:bg-[#202A26] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534]"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#14532D]" />}
            <span className="hidden sm:inline text-xs font-medium">
              {isDark ? 'نهاري' : 'ليلي'}
            </span>
          </button>
        </div>
      </header>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4]/95 dark:bg-[#111614]/95 backdrop-blur-md grid grid-cols-5 items-center"
        aria-label="شريط التنقل السفلي"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const Icon =
            item.id === 'menu'
              ? Home
              : item.id === 'read'
                ? BookOpen
                : item.id === 'visual'
                  ? Image
                  : item.id === 'recitation'
                    ? Mic
                    : Sparkles;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#14532D] dark:text-[#4ADE80] font-semibold'
                  : 'text-[#5C6660] dark:text-[#9CA8A1]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-none whitespace-nowrap">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

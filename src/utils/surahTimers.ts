import { AYAH_COUNTS } from '@/src/data/quranData';

export const MINUTES_PER_AYAH = 5;
export const SECONDS_PER_AYAH = MINUTES_PER_AYAH * 60;

export interface SurahTimerEntry {
  surahNum: number;
  totalAyahs: number;
  durationMinutes: number;
  startedAt: number;
  expiresAt: number;
  artworkIndex?: number;
  customImageSrc?: string;
}

const SURAH_TIMERS_STORAGE_KEY = 'mushaf_surah_timers_v1';
const LEGACY_VISUAL_LOCK_KEY = 'mushaf_visual_lock_v1';

export function getSurahTimerMinutes(surahNum: number): number {
  const count = AYAH_COUNTS[surahNum - 1] || 1;
  return count * MINUTES_PER_AYAH;
}

export function getSurahTimerSeconds(surahNum: number): number {
  return getSurahTimerMinutes(surahNum) * 60;
}

export function formatTimerDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function loadSurahTimers(): Record<number, SurahTimerEntry> {
  const timers: Record<number, SurahTimerEntry> = {};
  const now = Date.now();

  try {
    const raw = localStorage.getItem(SURAH_TIMERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, SurahTimerEntry>;
      for (const [key, entry] of Object.entries(parsed)) {
        if (
          entry &&
          typeof entry.surahNum === 'number' &&
          typeof entry.expiresAt === 'number' &&
          entry.expiresAt > now
        ) {
          timers[Number(key)] = entry;
        }
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_VISUAL_LOCK_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        surahNum?: number;
        totalAyahs?: number;
        startedAt?: number;
        expiresAt?: number;
      };
      if (
        legacy &&
        typeof legacy.surahNum === 'number' &&
        typeof legacy.expiresAt === 'number' &&
        legacy.expiresAt > now &&
        !timers[legacy.surahNum]
      ) {
        const totalAyahs = legacy.totalAyahs || AYAH_COUNTS[legacy.surahNum - 1] || 1;
        timers[legacy.surahNum] = {
          surahNum: legacy.surahNum,
          totalAyahs,
          durationMinutes: totalAyahs * MINUTES_PER_AYAH,
          startedAt: legacy.startedAt || now,
          expiresAt: legacy.expiresAt,
          artworkIndex: 0,
        };
      }
      localStorage.removeItem(LEGACY_VISUAL_LOCK_KEY);
    }

    localStorage.setItem(SURAH_TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch {
    // Ignore storage errors
  }

  return timers;
}

function saveSurahTimers(timers: Record<number, SurahTimerEntry>): Record<number, SurahTimerEntry> {
  try {
    localStorage.setItem(SURAH_TIMERS_STORAGE_KEY, JSON.stringify(timers));
  } catch {
    // Ignore storage errors
  }
  return timers;
}

export function getActiveSurahTimer(
  timers: Record<number, SurahTimerEntry>,
  nowMs: number = Date.now()
): SurahTimerEntry | null {
  for (const entry of Object.values(timers)) {
    if (entry && entry.expiresAt > nowMs) {
      return entry;
    }
  }
  return null;
}

export function startSurahTimer(
  currentTimers: Record<number, SurahTimerEntry>,
  surahNum: number,
  artworkIndex = 0,
  customImageSrc?: string
): { timers: Record<number, SurahTimerEntry>; entry: SurahTimerEntry } {
  const totalAyahs = AYAH_COUNTS[surahNum - 1] || 1;
  const durationMinutes = totalAyahs * MINUTES_PER_AYAH;
  const startedAt = Date.now();
  const expiresAt = startedAt + durationMinutes * 60 * 1000;

  const entry: SurahTimerEntry = {
    surahNum,
    totalAyahs,
    durationMinutes,
    startedAt,
    expiresAt,
    artworkIndex,
    customImageSrc,
  };

  const nextTimers = saveSurahTimers({
    ...currentTimers,
    [surahNum]: entry,
  });

  return { timers: nextTimers, entry };
}

export function clearSurahTimer(
  currentTimers: Record<number, SurahTimerEntry>,
  surahNum: number
): Record<number, SurahTimerEntry> {
  const next = { ...currentTimers };
  delete next[surahNum];
  return saveSurahTimers(next);
}

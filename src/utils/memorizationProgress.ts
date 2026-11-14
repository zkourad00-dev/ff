import { AYAH_COUNTS, SURAH_NAMES } from '@/src/data/quranData';

export interface MemorizedSurahRecord {
  passedAt: number;
  method: 'recitation' | 'visual';
  ayahCount: number;
}

export interface LearnerProgress {
  unlockedLevel: number; // 1..5
  memorizedSurahs: Record<number, MemorizedSurahRecord>;
  memorizedAyahs: Record<number, number>; // surahNum -> count of sealed ayahs
  memorizedAyahNumbers: Record<number, number[]>; // surahNum -> sorted unique 1-based ayah numbers
  levelLocked: true;
}

export interface MemorizationLevelDef {
  level: number;
  title: string;
  subtitle: string;
  surahs: number[];
}

const STORAGE_KEY = 'mushaf_learner_progress_v1';

export const MEMORIZATION_LEVELS: MemorizationLevelDef[] = [
  {
    level: 1,
    title: 'المستوى الأول',
    subtitle: 'الفاتحة وقصار السور (الكوثر إلى الناس)',
    surahs: [1, 114, 113, 112, 111, 110, 109, 108],
  },
  {
    level: 2,
    title: 'المستوى الثاني',
    subtitle: 'من سورة الماعون إلى سورة الضحى',
    surahs: [107, 106, 105, 104, 103, 102, 101, 100, 99, 98, 97, 96, 95, 94, 93],
  },
  {
    level: 3,
    title: 'المستوى الثالث',
    subtitle: 'من سورة الليل إلى سورة النبأ (بقية جزء عمّ)',
    surahs: [92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78],
  },
  {
    level: 4,
    title: 'المستوى الرابع',
    subtitle: 'سورة الملك وتبارك إلى الأحقاف',
    surahs: Array.from({ length: 32 }, (_, i) => 77 - i),
  },
  {
    level: 5,
    title: 'المستوى الخامس',
    subtitle: 'السور الطوال (من سورة الجاثية إلى البقرة)',
    surahs: Array.from({ length: 44 }, (_, i) => 45 - i),
  },
];

export function getSurahLevel(surahNum: number): number {
  const found = MEMORIZATION_LEVELS.find((lvl) => lvl.surahs.includes(surahNum));
  return found ? found.level : 5;
}

function buildRangeArray(start: number, end: number): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
}

function normalizeAyahNumbersMap(
  memorizedSurahs: Record<number, MemorizedSurahRecord>,
  memorizedAyahs: Record<number, number>,
  rawNumbers?: Record<number, number[]>
): { numbersMap: Record<number, number[]>; countsMap: Record<number, number> } {
  const numbersMap: Record<number, number[]> = {};
  const countsMap: Record<number, number> = {};

  for (let surahNum = 1; surahNum <= 114; surahNum++) {
    const maxAyahs = AYAH_COUNTS[surahNum - 1] || 0;
    if (memorizedSurahs[surahNum]) {
      numbersMap[surahNum] = buildRangeArray(1, maxAyahs);
      countsMap[surahNum] = maxAyahs;
      continue;
    }

    const fromRaw = rawNumbers?.[surahNum];
    if (Array.isArray(fromRaw) && fromRaw.length > 0) {
      const cleaned = Array.from(
        new Set(fromRaw.filter((n) => typeof n === 'number' && n >= 1 && n <= maxAyahs))
      ).sort((a, b) => a - b);
      if (cleaned.length > 0) {
        numbersMap[surahNum] = cleaned;
        countsMap[surahNum] = cleaned.length;
      }
      continue;
    }

    const legacyCount = memorizedAyahs[surahNum];
    if (typeof legacyCount === 'number' && legacyCount > 0) {
      const clamped = Math.min(maxAyahs, Math.floor(legacyCount));
      numbersMap[surahNum] = buildRangeArray(1, clamped);
      countsMap[surahNum] = clamped;
    }
  }

  return { numbersMap, countsMap };
}

export function loadLearnerProgress(): LearnerProgress {
  const fallback: LearnerProgress = {
    unlockedLevel: 1,
    memorizedSurahs: {},
    memorizedAyahs: {},
    memorizedAyahNumbers: {},
    levelLocked: true,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LearnerProgress>;
    const memorizedSurahs =
      parsed.memorizedSurahs && typeof parsed.memorizedSurahs === 'object'
        ? parsed.memorizedSurahs
        : {};
    const legacyAyahs =
      parsed.memorizedAyahs && typeof parsed.memorizedAyahs === 'object'
        ? parsed.memorizedAyahs
        : {};
    const rawNumbers =
      parsed.memorizedAyahNumbers && typeof parsed.memorizedAyahNumbers === 'object'
        ? parsed.memorizedAyahNumbers
        : undefined;

    const { numbersMap, countsMap } = normalizeAyahNumbersMap(
      memorizedSurahs,
      legacyAyahs,
      rawNumbers
    );

    return {
      unlockedLevel:
        typeof parsed.unlockedLevel === 'number' && parsed.unlockedLevel >= 1 && parsed.unlockedLevel <= 5
          ? parsed.unlockedLevel
          : 1,
      memorizedSurahs,
      memorizedAyahs: countsMap,
      memorizedAyahNumbers: numbersMap,
      levelLocked: true,
    };
  } catch {
    return fallback;
  }
}

function saveLearnerProgress(progress: LearnerProgress): LearnerProgress {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors
  }
  return progress;
}

function recalculateUnlockedLevel(memorizedSurahs: Record<number, MemorizedSurahRecord>): number {
  let unlocked = 1;
  for (const lvl of MEMORIZATION_LEVELS) {
    const allPassed = lvl.surahs.every((s) => Boolean(memorizedSurahs[s]));
    if (allPassed && lvl.level < 5) {
      unlocked = lvl.level + 1;
    } else {
      break;
    }
  }
  return unlocked;
}

export function isSurahUnlockedForMemorization(
  surahNum: number,
  progress: LearnerProgress
): { unlocked: boolean; requiredLevel: number } {
  const requiredLevel = getSurahLevel(surahNum);
  const unlocked = requiredLevel <= progress.unlockedLevel || Boolean(progress.memorizedSurahs[surahNum]);
  return { unlocked, requiredLevel };
}

export function getMemorizedAyahSet(progress: LearnerProgress, surahNum: number): Set<number> {
  const maxAyahs = AYAH_COUNTS[surahNum - 1] || 0;
  if (progress.memorizedSurahs[surahNum]) {
    return new Set(buildRangeArray(1, maxAyahs));
  }
  const nums = progress.memorizedAyahNumbers?.[surahNum];
  if (Array.isArray(nums) && nums.length > 0) {
    return new Set(nums);
  }
  const count = progress.memorizedAyahs[surahNum] || 0;
  return new Set(buildRangeArray(1, Math.min(maxAyahs, count)));
}

export function sealMemorizedAyahRange(
  progress: LearnerProgress,
  surahNum: number,
  fromAyah: number,
  toAyah: number,
  method: 'recitation' | 'visual' = 'recitation'
): LearnerProgress {
  const totalAyahs = AYAH_COUNTS[surahNum - 1] || 0;
  if (totalAyahs <= 0) return progress;

  const start = Math.max(1, Math.min(totalAyahs, fromAyah));
  const end = Math.max(start, Math.min(totalAyahs, toAyah));
  if (end < start) return progress;

  const existingSet = getMemorizedAyahSet(progress, surahNum);
  let changed = false;
  for (let a = start; a <= end; a++) {
    if (!existingSet.has(a)) {
      existingSet.add(a);
      changed = true;
    }
  }

  if (!changed) return progress;

  const updatedList = Array.from(existingSet).sort((a, b) => a - b);
  const completedWholeSurah = updatedList.length >= totalAyahs;

  const nextSurahs: Record<number, MemorizedSurahRecord> = {
    ...progress.memorizedSurahs,
  };
  if (completedWholeSurah && !nextSurahs[surahNum]) {
    nextSurahs[surahNum] = {
      passedAt: Date.now(),
      method,
      ayahCount: totalAyahs,
    };
  }

  const nextLevel = Math.max(progress.unlockedLevel, recalculateUnlockedLevel(nextSurahs));

  return saveLearnerProgress({
    unlockedLevel: nextLevel,
    memorizedSurahs: nextSurahs,
    memorizedAyahs: {
      ...progress.memorizedAyahs,
      [surahNum]: updatedList.length,
    },
    memorizedAyahNumbers: {
      ...progress.memorizedAyahNumbers,
      [surahNum]: updatedList,
    },
    levelLocked: true,
  });
}

export function sealMemorizedAyahs(
  progress: LearnerProgress,
  surahNum: number,
  ayahCountPassed: number
): LearnerProgress {
  if (ayahCountPassed <= 0) return progress;
  return sealMemorizedAyahRange(progress, surahNum, 1, ayahCountPassed, 'recitation');
}

export function sealMemorizedSurah(
  progress: LearnerProgress,
  surahNum: number,
  method: 'recitation' | 'visual'
): LearnerProgress {
  const totalAyahs = AYAH_COUNTS[surahNum - 1] || 0;
  const fullRange = buildRangeArray(1, totalAyahs);
  const nextSurahs: Record<number, MemorizedSurahRecord> = {
    ...progress.memorizedSurahs,
    [surahNum]: progress.memorizedSurahs[surahNum] || {
      passedAt: Date.now(),
      method,
      ayahCount: totalAyahs,
    },
  };
  const nextAyahs: Record<number, number> = {
    ...progress.memorizedAyahs,
    [surahNum]: totalAyahs,
  };
  const nextNumbers: Record<number, number[]> = {
    ...progress.memorizedAyahNumbers,
    [surahNum]: fullRange,
  };
  const nextLevel = Math.max(progress.unlockedLevel, recalculateUnlockedLevel(nextSurahs));

  return saveLearnerProgress({
    unlockedLevel: nextLevel,
    memorizedSurahs: nextSurahs,
    memorizedAyahs: nextAyahs,
    memorizedAyahNumbers: nextNumbers,
    levelLocked: true,
  });
}

export function getMemorizedStats(progress: LearnerProgress) {
  const totalQuranAyahs = 6236;
  const memorizedAyahsCount = Object.values(progress.memorizedAyahs).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0
  );
  const memorizedSurahsList = Object.keys(progress.memorizedSurahs)
    .map(Number)
    .sort((a, b) => a - b);

  const currentLevelDef =
    MEMORIZATION_LEVELS.find((l) => l.level === progress.unlockedLevel) || MEMORIZATION_LEVELS[0];

  const remainingInLevel = currentLevelDef.surahs.filter(
    (s) => !progress.memorizedSurahs[s]
  );
  const nextTargetSurah = remainingInLevel[0] ?? currentLevelDef.surahs[0];

  return {
    unlockedLevel: progress.unlockedLevel,
    currentLevelDef,
    memorizedAyahsCount,
    totalQuranAyahs,
    memorizedSurahsCount: memorizedSurahsList.length,
    memorizedSurahsList,
    remainingInLevelCount: remainingInLevel.length,
    nextTargetSurah,
    nextTargetSurahName: SURAH_NAMES[nextTargetSurah - 1],
  };
}

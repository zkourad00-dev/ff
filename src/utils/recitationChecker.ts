import { normalizeArabic } from '@/src/data/quranData';

export interface RecitationError {
  ayahIndex: number;
  ayahNumber: number;
  wordIndex: number;
  expectedWord: string;
  spokenWord: string;
  expectedAyah: string;
}

export interface RecitationCheckResult {
  isCompleteMatch: boolean;
  matchedWordsCount: number;
  totalTargetWords: number;
  passedFullAyahsCount: number;
  error: RecitationError | null;
}

function stripUthmaniAlifs(norm: string): string {
  // Keep leading "ال" if present, strip internal alifs used differently in Uthmani vs Imla'i
  const prefix = norm.startsWith('ال') ? 'ال' : '';
  const body = prefix ? norm.slice(2) : norm;
  return prefix + body.replace(/ا/g, '');
}

function isEditDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else {
      edits++;
      if (edits > 1) return false;
      if (a.length > b.length) {
        i++;
      } else if (b.length > a.length) {
        j++;
      } else {
        i++;
        j++;
      }
    }
  }
  if (i < a.length || j < b.length) edits++;
  return edits <= 1;
}

export function wordsMatchArabic(spokenRaw: string, targetRaw: string): boolean {
  const spoken = normalizeArabic(spokenRaw);
  const target = normalizeArabic(targetRaw);
  if (!spoken || !target) return false;
  if (spoken === target) return true;

  // Handle Uthmani omitted alifs (e.g., ملك / مالك, الصرط / الصراط, العلمين / العالمين, السماوات / السموت)
  if (stripUthmaniAlifs(spoken) === stripUthmaniAlifs(target)) {
    return true;
  }

  // Handle minor hamza/carrier variations in long words from speech recognition
  if (target.length >= 5 && isEditDistanceAtMostOne(spoken, target)) {
    return true;
  }

  return false;
}

interface TargetToken {
  localAyahIndex: number;
  ayahIndex: number; // 0-based in Surah
  ayahNumber: number; // 1-based in Surah
  wordIndex: number;
  originalWord: string;
  normalizedWord: string;
}

export function evaluateRecitation(
  ayahs: string[],
  spokenText: string,
  allowLeadingBismillah = false,
  startAyahNumber = 1
): RecitationCheckResult {
  const safeStartAyah = Math.max(1, startAyahNumber);
  const targetTokens: TargetToken[] = [];
  ayahs.forEach((ayah, localAyahIndex) => {
    const surahAyahNumber = safeStartAyah + localAyahIndex;
    const surahAyahIndex = surahAyahNumber - 1;
    const words = ayah.split(/\s+/).filter(Boolean);
    words.forEach((word, wordIndex) => {
      const normalizedWord = normalizeArabic(word);
      if (normalizedWord) {
        targetTokens.push({
          localAyahIndex,
          ayahIndex: surahAyahIndex,
          ayahNumber: surahAyahNumber,
          wordIndex,
          originalWord: word,
          normalizedWord,
        });
      }
    });
  });

  let spokenWords = spokenText
    .split(/\s+/)
    .map((w) => normalizeArabic(w))
    .filter(Boolean);

  if (
    allowLeadingBismillah &&
    spokenWords.length >= 4 &&
    spokenWords[0] === 'بسم' &&
    spokenWords[1] === 'الله' &&
    spokenWords[2] === 'الرحمن' &&
    spokenWords[3] === 'الرحيم'
  ) {
    spokenWords = spokenWords.slice(4);
  }

  if (spokenWords.length === 0) {
    return {
      isCompleteMatch: false,
      matchedWordsCount: 0,
      totalTargetWords: targetTokens.length,
      passedFullAyahsCount: 0,
      error: null,
    };
  }

  let tIdx = 0;
  let sIdx = 0;

  while (sIdx < spokenWords.length && tIdx < targetTokens.length) {
    const spoken = spokenWords[sIdx];
    const target = targetTokens[tIdx];

    if (wordsMatchArabic(spoken, target.originalWord)) {
      tIdx++;
      sIdx++;
      continue;
    }

    // Check if speech recognition split "و" + word into two tokens
    if (
      spoken === 'و' &&
      sIdx + 1 < spokenWords.length &&
      wordsMatchArabic('و' + spokenWords[sIdx + 1], target.originalWord)
    ) {
      tIdx++;
      sIdx += 2;
      continue;
    }

    // Check if speech recognition merged two consecutive target words
    if (
      tIdx + 1 < targetTokens.length &&
      wordsMatchArabic(spoken, target.originalWord + targetTokens[tIdx + 1].originalWord)
    ) {
      tIdx += 2;
      sIdx++;
      continue;
    }

    // Mismatch found!
    return {
      isCompleteMatch: false,
      matchedWordsCount: tIdx,
      totalTargetWords: targetTokens.length,
      passedFullAyahsCount: target.localAyahIndex,
      error: {
        ayahIndex: target.ayahIndex,
        ayahNumber: target.ayahNumber,
        wordIndex: target.wordIndex,
        expectedWord: target.originalWord,
        spokenWord: spoken,
        expectedAyah: ayahs[target.localAyahIndex],
      },
    };
  }

  const isComplete = tIdx >= targetTokens.length && spokenWords.length > 0;
  const passedFullAyahsCount = isComplete
    ? ayahs.length
    : tIdx < targetTokens.length
      ? targetTokens[tIdx].localAyahIndex
      : ayahs.length;

  return {
    isCompleteMatch: isComplete,
    matchedWordsCount: tIdx,
    totalTargetWords: targetTokens.length,
    passedFullAyahsCount,
    error: null,
  };
}

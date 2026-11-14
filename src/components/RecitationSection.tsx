import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Volume2,
} from 'lucide-react';
import { ReciterSelector } from '@/src/components/ReciterSelector';
import { SurahIndex } from '@/src/components/SurahIndex';
import { AYAH_COUNTS, SURAH_NAMES } from '@/src/data/quranData';
import { useSurahText } from '@/src/hooks/useSurahText';
import {
  getMemorizedAyahSet,
  getMemorizedStats,
  isSurahUnlockedForMemorization,
  sealMemorizedAyahRange,
  type LearnerProgress,
} from '@/src/utils/memorizationProgress';
import { OfflineReciter } from '@/src/utils/offlineReciter';
import {
  evaluateRecitation,
  type RecitationError,
} from '@/src/utils/recitationChecker';

interface RecitationSectionProps {
  currentSurah: number;
  onSelectSurah: (surahNum: number) => void;
  learnerProgress: LearnerProgress;
  onProgressChange: (next: LearnerProgress) => void;
  selectedReciterId: string;
  onSelectReciter: (reciterId: string) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function RecitationSection({
  currentSurah,
  onSelectSurah,
  learnerProgress,
  onProgressChange,
  selectedReciterId,
  onSelectReciter,
}: RecitationSectionProps) {
  const { ayahs } = useSurahText(currentSurah);
  const [isListening, setIsListening] = useState(false);
  const [hideText, setHideText] = useState(true);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');

  const [statusMessage, setStatusMessage] = useState('اضغط على تشغيل الميكروفون وابدأ التسميع.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  const [correction, setCorrection] = useState<RecitationError | null>(null);
  const [isReReciting, setIsReReciting] = useState(false);
  const [reReciteAyah, setReReciteAyah] = useState<number | null>(null);
  const [isCompleteSuccess, setIsCompleteSuccess] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const reciterRef = useRef<OfflineReciter | null>(null);
  const correctionTimerRef = useRef<number | null>(null);
  const hadMicErrorRef = useRef(false);
  const correctedOnceRef = useRef(false);

  if (!reciterRef.current) {
    reciterRef.current = new OfflineReciter();
  }

  const totalAyahsForSurah = AYAH_COUNTS[currentSurah - 1] || 1;
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(totalAyahsForSurah);

  const surahName = SURAH_NAMES[currentSurah - 1];
  const levelAccess = isSurahUnlockedForMemorization(currentSurah, learnerProgress);
  const stats = getMemorizedStats(learnerProgress);
  const memorizedAyahSet = useMemo(
    () => getMemorizedAyahSet(learnerProgress, currentSurah),
    [learnerProgress, currentSurah]
  );
  const sealedAyahsForSurah = memorizedAyahSet.size;

  const targetAyahs = useMemo(() => {
    if (!ayahs) return [];
    return ayahs.slice(fromAyah - 1, toAyah);
  }, [ayahs, fromAyah, toAyah]);

  const isPartialRange = fromAyah > 1 || toAyah < totalAyahsForSurah;
  const rangeCount = Math.max(1, toAyah - fromAyah + 1);

  const stopReRecitation = useCallback(() => {
    if (correctionTimerRef.current !== null) {
      window.clearTimeout(correctionTimerRef.current);
      correctionTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }
    }
    reciterRef.current?.stop();
    setIsReReciting(false);
    setReReciteAyah(null);
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    stopRecognition();
    stopReRecitation();
    setFromAyah(1);
    setToAyah(AYAH_COUNTS[currentSurah - 1] || 1);
    setFinalTranscript('');
    setInterimTranscript('');
    setManualInput('');
    setCorrection(null);
    setIsCompleteSuccess(false);
    setErrorMessage(null);
    setStatusMessage('اضغط على تشغيل الميكروفون وابدأ التسميع.');
    correctedOnceRef.current = false;
  }, [currentSurah, stopRecognition, stopReRecitation]);

  const resetAttemptState = useCallback(
    (nextFrom: number, nextTo: number) => {
      stopRecognition();
      stopReRecitation();
      correctedOnceRef.current = false;
      setFinalTranscript('');
      setInterimTranscript('');
      setManualInput('');
      setCorrection(null);
      setIsCompleteSuccess(false);
      setErrorMessage(null);
      setStatusMessage(
        `اضغط على تشغيل الميكروفون وابدأ التسميع من الآية ${nextFrom} إلى الآية ${nextTo}.`
      );
    },
    [stopRecognition, stopReRecitation]
  );

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      return;
    }
    let mounted = true;
    let permStatus: PermissionStatus | null = null;
    const handlePermChange = () => {
      if (!mounted || !permStatus) return;
      if (permStatus.state === 'granted' || permStatus.state === 'denied' || permStatus.state === 'prompt') {
        setMicPermission(permStatus.state);
      }
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (!mounted) return;
          permStatus = status;
          handlePermChange();
          status.onchange = handlePermChange;
        })
        .catch(() => {
          // Permissions API for microphone is optional on some browsers
        });
    }

    return () => {
      mounted = false;
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      stopRecognition();
      stopReRecitation();
    };
  }, [stopRecognition, stopReRecitation]);

  const startSurahReRecitation = useCallback(() => {
    if (!ayahs || ayahs.length === 0) return;
    const boundedSlice = ayahs.slice(0, toAyah);
    const startIdx = Math.max(0, Math.min(boundedSlice.length - 1, fromAyah - 1));
    setIsReReciting(true);
    reciterRef.current?.playFrom(
      currentSurah,
      boundedSlice,
      startIdx,
      {
        mode: 'auto',
        repeatSingle: false,
        delayBetweenMs: 450,
        reciterId: selectedReciterId,
      },
      {
        onAyahStart: (idx) => {
          setReReciteAyah(idx);
        },
        onComplete: () => {
          setIsReReciting(false);
          setReReciteAyah(null);
        },
      }
    );
  }, [ayahs, currentSurah, fromAyah, toAyah, selectedReciterId]);

  const triggerCorrectionAndReRecite = useCallback(
    (mistake: RecitationError) => {
      if (correctedOnceRef.current) return;
      correctedOnceRef.current = true;

      stopRecognition();
      stopReRecitation();
      setCorrection(mistake);
      setIsCompleteSuccess(false);
      setStatusMessage('توقف يا أخي، إنك قد أخطأت. استمع إلى التصحيح وإعادة التلاوة.');

      const rangePhrase = isPartialRange
        ? `الآيات من ${fromAyah} إلى ${toAyah} من سورة ${surahName}`
        : `سورة ${surahName}`;
      const spokenCorrection = `توقف يا أخي، إنك قد أخطأت. أخطأت في الآية رقم ${mistake.ayahNumber}، والصواب: ${mistake.expectedWord}. والآن أعيد لك قراءة ${rangePhrase}.`;

      let startedReplay = false;
      const beginReplayOnce = () => {
        if (startedReplay) return;
        startedReplay = true;
        if (correctionTimerRef.current !== null) {
          window.clearTimeout(correctionTimerRef.current);
          correctionTimerRef.current = null;
        }
        startSurahReRecitation();
      };

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const voices = window.speechSynthesis.getVoices();
          const arabicVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
          if (arabicVoice) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(spokenCorrection);
            utter.lang = 'ar-SA';
            utter.voice = arabicVoice;
            utter.rate = 0.95;
            utter.onend = beginReplayOnce;
            utter.onerror = beginReplayOnce;
            correctionTimerRef.current = window.setTimeout(beginReplayOnce, 9000);
            window.speechSynthesis.speak(utter);
            return;
          }
        } catch {
          // Fall through to timed start
        }
      }

      setIsReReciting(true);
      correctionTimerRef.current = window.setTimeout(beginReplayOnce, 1800);
    },
    [
      stopRecognition,
      stopReRecitation,
      isPartialRange,
      fromAyah,
      toAyah,
      surahName,
      startSurahReRecitation,
    ]
  );

  const checkSpokenText = useCallback(
    (textToEvaluate: string) => {
      if (!targetAyahs.length || !textToEvaluate.trim() || !levelAccess.unlocked) return;
      const result = evaluateRecitation(
        targetAyahs,
        textToEvaluate,
        currentSurah !== 1 && currentSurah !== 9,
        fromAyah
      );

      let latestProgress = learnerProgress;
      if (result.passedFullAyahsCount > 0) {
        const passEnd = Math.min(toAyah, fromAyah + result.passedFullAyahsCount - 1);
        const updatedAyahsProgress = sealMemorizedAyahRange(
          latestProgress,
          currentSurah,
          fromAyah,
          passEnd,
          'recitation'
        );
        if (updatedAyahsProgress !== latestProgress) {
          latestProgress = updatedAyahsProgress;
          onProgressChange(updatedAyahsProgress);
        }
      }

      if (result.error) {
        triggerCorrectionAndReRecite(result.error);
      } else if (result.isCompleteMatch) {
        stopRecognition();
        setCorrection(null);
        setIsCompleteSuccess(true);
        const sealed = sealMemorizedAyahRange(
          latestProgress,
          currentSurah,
          fromAyah,
          toAyah,
          'recitation'
        );
        onProgressChange(sealed);
        const levelUpText =
          sealed.unlockedLevel > latestProgress.unlockedLevel
            ? ` وتم فتح المستوى ${sealed.unlockedLevel}!`
            : '';
        const completedEntireSurah = Boolean(sealed.memorizedSurahs[currentSurah]);
        if (completedEntireSurah) {
          setStatusMessage(
            `أحسنت! أتممت تسميع المقطع وتم ختم وحفظ سورة ${surahName} كاملة في سجلك.${levelUpText}`
          );
        } else {
          setStatusMessage(
            `أحسنت! أتممت تسميع وحفظ الآيات من ${fromAyah} إلى ${toAyah} من سورة ${surahName} بدون أخطاء وتم تثبيتها في سجلك.`
          );
        }
      }
    },
    [
      targetAyahs,
      currentSurah,
      fromAyah,
      toAyah,
      levelAccess.unlocked,
      learnerProgress,
      onProgressChange,
      surahName,
      stopRecognition,
      triggerCorrectionAndReRecite,
    ]
  );

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      setErrorMessage(
        'هذا المتصفح لا يدعم واجهة طلب ترخيص الميكروفون (getUserMedia). تأكد من فتح التطبيق عبر HTTPS أو متصفح حديث.'
      );
      return false;
    }

    setIsRequestingMic(true);
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      setStatusMessage('تم تفعيل ترخيص الميكروفون بنجاح! يمكنك الآن بدء التسميع.');
      return true;
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setMicPermission('unsupported');
        setErrorMessage('لم يتم العثور على ميكروفون متصل بهذا الجهاز.');
      } else {
        setMicPermission('denied');
        setErrorMessage(
          'تم رفض ترخيص الميكروفون. يرجى السماح بالوصول للميكروفون من أيقونة القفل بجانب رابط الصفحة ثم إعادة المحاولة.'
        );
      }
      return false;
    } finally {
      setIsRequestingMic(false);
    }
  };

  const startRecognition = async () => {
    if (!levelAccess.unlocked) return;

    if (micPermission !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'تم تفعيل ترخيص الميكروفون، لكن المتصفح الحالي لا يدعم محرك التعرف الصوتي العربي (Web Speech API). استخدم متصفح Chrome/Edge أو اختبر التلاوة بالكتابة بالأسفل.'
      );
      return;
    }

    stopRecognition();
    stopReRecitation();
    hadMicErrorRef.current = false;
    correctedOnceRef.current = false;
    setCorrection(null);
    setIsCompleteSuccess(false);
    setErrorMessage(null);
    setFinalTranscript('');
    setInterimTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatusMessage(
        `الميكروفون يعمل الآن... ابدأ التسميع من الآية ${fromAyah} إلى الآية ${toAyah}.`
      );
    };

    recognition.onresult = (event) => {
      let finalized = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const part = res[0].transcript;
        if (res.isFinal) {
          finalized += part + ' ';
        } else {
          interim += part + ' ';
        }
      }
      const cleanFinal = finalized.trim();
      setFinalTranscript(cleanFinal);
      setInterimTranscript(interim.trim());

      if (cleanFinal) {
        checkSpokenText(cleanFinal);
      }
    };

    recognition.onerror = (event) => {
      hadMicErrorRef.current = true;
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicPermission('denied');
        setErrorMessage(
          'تم حظر إذن الميكروفون. اضغط على «طلب ترخيص الميكروفون» واسمح بالوصول من إعدادات المتصفح.'
        );
      } else if (event.error === 'audio-capture') {
        setErrorMessage('تعذر التقاط الصوت من الميكروفون. تأكد من توصيل الميكروفون وعدم استخدامه في تطبيق آخر.');
      } else if (event.error === 'network') {
        setErrorMessage(
          'محرك التعرف الصوتي في المتصفح يحتاج إلى اتصال لتفريغ الصوت؛ يمكنك فحص التلاوة بالكتابة بالأسفل بدون إنترنت.'
        );
      } else if (event.error === 'no-speech') {
        setErrorMessage('لم يتم سماع صوت واضح، اقترب من الميكروفون ثم اضغط «بدء التسميع بالميكروفون».');
      } else {
        setErrorMessage(`تعذر تشغيل الميكروفون (${event.error}).`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!hadMicErrorRef.current && !correctedOnceRef.current) {
        setStatusMessage('تم إيقاف التسميع.');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setErrorMessage('تعذر بدء التسجيل الصوتي. حاول مرة أخرى.');
    }
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || !levelAccess.unlocked) return;
    stopRecognition();
    stopReRecitation();
    correctedOnceRef.current = false;
    setCorrection(null);
    setIsCompleteSuccess(false);
    setFinalTranscript(manualInput.trim());
    setInterimTranscript('');
    checkSpokenText(manualInput.trim());
  };

  const combinedTranscript = [finalTranscript, interimTranscript].filter(Boolean).join(' ');

  const liveProgress = useMemo(() => {
    if (!targetAyahs.length || !combinedTranscript.trim()) {
      return { matchedWordsCount: 0, totalTargetWords: 0, percent: 0 };
    }
    const res = evaluateRecitation(
      targetAyahs,
      combinedTranscript,
      currentSurah !== 1 && currentSurah !== 9,
      fromAyah
    );
    const percent =
      res.totalTargetWords > 0
        ? Math.min(100, Math.round((res.matchedWordsCount / res.totalTargetWords) * 100))
        : 0;
    return {
      matchedWordsCount: res.matchedWordsCount,
      totalTargetWords: res.totalTargetWords,
      percent,
    };
  }, [targetAyahs, combinedTranscript, currentSurah, fromAyah]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4">
        <SurahIndex
          currentSurah={currentSurah}
          onSelectSurah={onSelectSurah}
          title="اختر سورة للتسميع"
          learnerProgress={learnerProgress}
          enforceLevelLock={true}
        />
      </div>

      <div className="lg:col-span-8 space-y-6">
        {!levelAccess.unlocked ? (
          <section className="rounded-2xl border border-[#FDE68A] dark:border-[#92400E] bg-white dark:bg-[#151B19] p-6 sm:p-10 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] dark:bg-[#78350F]/40 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2]">
                سورة {surahName} مقفلة في مستواك الحالي
              </h1>
              <p className="text-sm text-[#525E57] dark:text-[#A3B0A8] leading-relaxed">
                مستواك المفتوح ومستوى حفظك مُغلقان على المستوى {stats.unlockedLevel} ({stats.currentLevelDef.title}). أتمم تسميع سور مستواك لفتح المستوى {levelAccess.requiredLevel}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectSurah(stats.nextTargetSurah)}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] text-white text-sm font-semibold cursor-pointer"
            >
              الانتقال إلى سورة {stats.nextTargetSurahName}
            </button>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE4] dark:border-[#242E2A]">
                <div>
                  <h1 className="text-xl font-bold text-[#171C19] dark:text-[#F1F5F2]">
                    التسميع الذكي · سورة {surahName}
                  </h1>
                  <p className="text-xs text-[#525E57] dark:text-[#9CA8A1] mt-1 tabular-nums inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#14532D] dark:text-[#4ADE80]" />
                    <span>
                      مستوى الحفظ: {stats.unlockedLevel} / 5 · الآيات المحفوظة والمُغلقة في السورة: {sealedAyahsForSurah} من {totalAyahsForSurah}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setHideText((h) => !h)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {hideText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{hideText ? 'إظهار النص' : 'إخفاء النص'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#171C19] dark:text-[#EEF2EF]">
                    تحديد نطاق الحفظ والتسميع (من آية إلى آية)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#14532D] dark:text-[#4ADE80] font-semibold tabular-nums">
                      من الآية {fromAyah} إلى الآية {toAyah} ({rangeCount} {rangeCount === 1 ? 'آية' : 'آيات'})
                    </span>
                    {isPartialRange && (
                      <button
                        type="button"
                        onClick={() => {
                          setFromAyah(1);
                          setToAyah(totalAyahsForSurah);
                          resetAttemptState(1, totalAyahsForSurah);
                        }}
                        className="text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline cursor-pointer"
                      >
                        كامل السورة
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="block text-xs font-medium text-[#525E57] dark:text-[#9CA8A1]">
                      البداية (من الآية):
                    </span>
                    <select
                      aria-label="البداية من الآية"
                      value={fromAyah}
                      onChange={(e) => {
                        const nextFrom = Number(e.target.value);
                        const nextTo = Math.max(nextFrom, toAyah);
                        setFromAyah(nextFrom);
                        setToAyah(nextTo);
                        resetAttemptState(nextFrom, nextTo);
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-white dark:bg-[#151B19] text-sm font-semibold text-[#171C19] dark:text-[#EEF2EF] tabular-nums cursor-pointer"
                    >
                      {Array.from({ length: totalAyahsForSurah }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          الآية {num}{memorizedAyahSet.has(num) ? ' (محفوظة)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="block text-xs font-medium text-[#525E57] dark:text-[#9CA8A1]">
                      النهاية (إلى الآية):
                    </span>
                    <select
                      aria-label="النهاية إلى الآية"
                      value={toAyah}
                      onChange={(e) => {
                        const nextTo = Number(e.target.value);
                        const nextFrom = Math.min(fromAyah, nextTo);
                        setFromAyah(nextFrom);
                        setToAyah(nextTo);
                        resetAttemptState(nextFrom, nextTo);
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-white dark:bg-[#151B19] text-sm font-semibold text-[#171C19] dark:text-[#EEF2EF] tabular-nums cursor-pointer"
                    >
                      {Array.from(
                        { length: Math.max(1, totalAyahsForSurah - fromAyah + 1) },
                        (_, i) => fromAyah + i
                      ).map((num) => (
                        <option key={num} value={num}>
                          الآية {num}{memorizedAyahSet.has(num) ? ' (محفوظة)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <ReciterSelector
                selectedReciterId={selectedReciterId}
                onSelectReciter={(id) => {
                  stopReRecitation();
                  onSelectReciter(id);
                }}
                compact
              />

              <div
                className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                  micPermission === 'granted'
                    ? 'border-[#16A34A]/40 bg-[#ECFDF3] dark:bg-[#14532D]/25'
                    : micPermission === 'denied'
                      ? 'border-[#FCA5A5] dark:border-[#7F1D1D] bg-[#FEF2F2] dark:bg-[#450A0A]/30'
                      : 'border-[#FDE68A] dark:border-[#92400E] bg-[#FFFBEB] dark:bg-[#78350F]/25'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      micPermission === 'granted'
                        ? 'text-[#14532D] dark:text-[#4ADE80]'
                        : micPermission === 'denied'
                          ? 'text-[#DC2626] dark:text-[#F87171]'
                          : 'text-[#B45309] dark:text-[#FBBF24]'
                    }`}
                  />
                  <span
                    className={
                      micPermission === 'granted'
                        ? 'text-[#14532D] dark:text-[#4ADE80]'
                        : micPermission === 'denied'
                          ? 'text-[#991B1B] dark:text-[#FCA5A5]'
                          : 'text-[#92400E] dark:text-[#FBBF24]'
                    }
                  >
                    {micPermission === 'granted'
                      ? 'ترخيص الميكروفون مفعّل وجاهز للتسميع'
                      : micPermission === 'denied'
                        ? 'ترخيص الميكروفون مرفوض — يلزم السماح بالوصول للميكروفون ليعمل التسميع'
                        : micPermission === 'unsupported'
                          ? 'لم يتم اكتشاف دعم الميكروفون في هذا المتصفح'
                          : 'يلزم طلب ترخيص الميكروفون قبل بدء التسميع الصوتي'}
                  </span>
                </div>

                {micPermission !== 'granted' && (
                  <button
                    type="button"
                    disabled={isRequestingMic}
                    onClick={() => void requestMicrophonePermission()}
                    className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{isRequestingMic ? 'جاري طلب الترخيص...' : 'طلب ترخيص الميكروفون'}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startRecognition}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] dark:hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Mic className="w-4 h-4" />
                    <span>بدء التسميع بالميكروفون</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecognition}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>إيقاف الميكروفون</span>
                  </button>
                )}

                {isReReciting && (
                  <button
                    type="button"
                    onClick={stopReRecitation}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Square className="w-4 h-4" />
                    <span>إيقاف إعادة السورة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => resetAttemptState(fromAyah, toAyah)}
                  className="min-h-[48px] px-4 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-xs font-semibold text-[#171C19] dark:text-[#EEF2EF] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>محاولة جديدة</span>
                </button>
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-[#FCA5A5] dark:border-[#7F1D1D] bg-[#FEF2F2] dark:bg-[#450A0A]/40 p-4 text-xs font-medium text-[#991B1B] dark:text-[#FCA5A5] leading-relaxed">
                  {errorMessage}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5E0D5] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 text-xs font-medium text-[#37413B] dark:text-[#C5D0CA] leading-relaxed">
                  {statusMessage}
                </div>
              )}

              {correction && (
                <div
                  role="alert"
                  className="rounded-2xl border border-[#DC2626] dark:border-[#EF4444] bg-[#FEF2F2] dark:bg-[#450A0A]/30 p-5 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-[#DC2626] dark:text-[#F87171] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-[#991B1B] dark:text-[#FCA5A5]">
                        توقف يا أخي، إنك قد أخطأت
                      </h2>
                      <p className="text-sm text-[#7F1D1D] dark:text-[#FECACA]">
                        موضع الخطأ: <strong className="font-bold">الآية رقم {correction.ayahNumber}</strong> من سورة {surahName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-[#FECACA] dark:border-[#7F1D1D] bg-white dark:bg-[#1C1212] p-3.5 space-y-1">
                      <div className="text-xs font-semibold text-[#991B1B] dark:text-[#FCA5A5]">ما قرأته</div>
                      <div className="font-quran text-xl font-bold text-[#DC2626] dark:text-[#F87171]">
                        {correction.spokenWord}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#BBF7D0] dark:border-[#14532D] bg-white dark:bg-[#101C15] p-3.5 space-y-1">
                      <div className="text-xs font-semibold text-[#14532D] dark:text-[#4ADE80]">التصحيح الصواب</div>
                      <div className="font-quran text-xl font-bold text-[#14532D] dark:text-[#4ADE80]">
                        {correction.expectedWord}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E0D5] dark:border-[#2A3631] bg-white dark:bg-[#151B19] p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-[#525E57] dark:text-[#9CA8A1]">
                      الآية الصحيحة كاملة:
                    </div>
                    <p className="font-quran text-2xl leading-relaxed text-[#171C19] dark:text-[#F1F5F2]">
                      {correction.expectedAyah}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-xs font-medium text-[#14532D] dark:text-[#4ADE80] inline-flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" />
                      {isReReciting && reReciteAyah !== null
                        ? `جاري إعادة قراءة سورة ${surahName} — الآية ${reReciteAyah + 1}`
                        : isReReciting
                          ? `جاري التحضير لإعادة قراءة سورة ${surahName}...`
                          : `انتهت إعادة قراءة سورة ${surahName}`}
                    </span>

                    {!isReReciting && (
                      <button
                        type="button"
                        onClick={startSurahReRecitation}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#14532D] dark:bg-[#16A34A] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isPartialRange
                            ? `إعادة قراءة الآيات (${fromAyah}–${toAyah})`
                            : 'إعادة قراءة السورة'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isCompleteSuccess && !correction && (
                <div className="rounded-2xl border border-[#16A34A] bg-[#ECFDF3] dark:bg-[#14532D]/30 p-5 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#14532D] dark:text-[#4ADE80] shrink-0" />
                  <div>
                    <h2 className="text-base font-bold text-[#14532D] dark:text-[#4ADE80]">
                      ما شاء الله، تسميع صحيح وموفق
                    </h2>
                    <p className="text-xs text-[#37413B] dark:text-[#C5D0CA] mt-0.5 tabular-nums">
                      {learnerProgress.memorizedSurahs[currentSurah]
                        ? `أتممت قراءة المقطع وتم ختم وحفظ سورة ${surahName} كاملة في سجلك.`
                        : `أتممت تسميع الآيات من ${fromAyah} إلى ${toAyah} من سورة ${surahName} بدون أخطاء وتم حفظها وإغلاقها في سجلك.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-[#5C6660] dark:text-[#9CA8A1]">
                  <span>ما تم سماعه / تلاوته</span>
                  {ayahs && combinedTranscript && (
                    <span className="tabular-nums font-semibold text-[#14532D] dark:text-[#4ADE80]">
                      التقدم الصحيح: {liveProgress.matchedWordsCount} من {liveProgress.totalTargetWords} كلمة ({liveProgress.percent}%)
                    </span>
                  )}
                </div>
                <div className="min-h-[96px] rounded-xl border border-[#EFECE4] dark:border-[#242E2A] bg-[#FAF8F4] dark:bg-[#111614] p-4 font-quran text-xl leading-relaxed text-[#171C19] dark:text-[#F1F5F2]">
                  {combinedTranscript ? (
                    combinedTranscript
                  ) : (
                    <span className="font-ui text-sm text-[#78827C]">
                      سيظهر هنا النص أثناء التسميع...
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleManualCheck} className="pt-2 border-t border-[#EFECE4] dark:border-[#242E2A] space-y-2">
                <label htmlFor="manualReciteInput" className="block text-xs font-semibold text-[#525E57] dark:text-[#9CA8A1]">
                  أو اختبر التصحيح بكتابة التلاوة (مفيد عند عدم توفر الميكروفون):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="manualReciteInput"
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={`اكتب التلاوة بدءاً من الآية ${fromAyah} إلى الآية ${toAyah}...`}
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#1A221F] text-sm text-[#171C19] dark:text-[#EEF2EF] placeholder:text-[#78827C]"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#14532D] hover:bg-[#166534] dark:bg-[#16A34A] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    فحص التلاوة
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-[#E5E0D5] dark:border-[#242E2A] bg-white dark:bg-[#151B19] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#171C19] dark:text-[#F1F5F2]">
                  نص سورة {surahName} {isReReciting ? '(جاري الإعادة الآن)' : 'للمراجعة'}
                </h2>
                <span className="text-xs text-[#5C6660] dark:text-[#9CA8A1]">
                  {hideText && !isReReciting ? 'مخفي للاختبار' : 'ظاهر'}
                </span>
              </div>

              {hideText && !isReReciting ? (
                <div className="py-8 text-center rounded-xl border border-dashed border-[#D8D1C5] dark:border-[#2A3631] bg-[#FAF8F4] dark:bg-[#111614] space-y-2">
                  <p className="text-sm font-medium text-[#525E57] dark:text-[#9CA8A1]">
                    تم إخفاء نص الآيات لاختبار الحفظ.
                  </p>
                  <button
                    type="button"
                    onClick={() => setHideText(false)}
                    className="text-xs font-semibold text-[#14532D] dark:text-[#4ADE80] hover:underline cursor-pointer"
                  >
                    إظهار النص الآن
                  </button>
                </div>
              ) : !ayahs ? (
                <p className="text-xs text-[#5C6660] dark:text-[#9CA8A1]">نص السورة غير متوفر.</p>
              ) : (
                <div className="font-quran text-2xl leading-[2.35] text-[#171C19] dark:text-[#F1F5F2] text-justify">
                  {ayahs.map((ayah, idx) => {
                    const ayahNum = idx + 1;
                    const isInRange = ayahNum >= fromAyah && ayahNum <= toAyah;
                    const isReplayingThis = isReReciting && reReciteAyah === idx;
                    const isErrorAyah = correction?.ayahIndex === idx;
                    const isSealedAyah = memorizedAyahSet.has(ayahNum);
                    return (
                      <span
                        key={idx}
                        className={`inline px-1.5 py-0.5 rounded-lg transition-colors ${
                          isReplayingThis
                            ? 'bg-[#D1FAE5] dark:bg-[#14532D] text-[#064E3B] dark:text-white'
                            : isErrorAyah
                              ? 'bg-[#FEE2E2] dark:bg-[#7F1D1D]/40'
                              : isSealedAyah
                                ? 'bg-[#F0FDF4] dark:bg-[#14532D]/20'
                                : ''
                        } ${!isInRange && !isReplayingThis && !isErrorAyah ? 'opacity-45' : ''}`}
                      >
                        {ayah}
                        <span className="inline-flex items-center justify-center mx-1.5 text-xs font-ui font-bold w-6 h-6 rounded-full border border-[#D8D1C5] dark:border-[#2A3631] text-[#5C6660] dark:text-[#9CA8A1] tabular-nums">
                          {ayahNum}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

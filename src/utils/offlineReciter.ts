import {
  DEFAULT_RECITER_ID,
  getAyahAudioUrl,
  getReciterById,
} from '@/src/data/reciters';

export type OfflinePlaybackMode = 'auto' | 'tts' | 'timer';

export interface ReciterCallbacks {
  onAyahStart: (index: number) => void;
  onComplete: () => void;
  onModeInfo?: (message: string | null) => void;
}

export class OfflineReciter {
  private sessionId = 0;
  private audio: HTMLAudioElement | null = null;
  private timerId: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isRunning = false;

  public stop(): void {
    this.sessionId += 1;
    this.isRunning = false;

    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      try {
        this.audio.currentTime = 0;
      } catch {
        // Ignore seek errors when no media is loaded
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }
    }
    this.currentUtterance = null;
  }

  public playFrom(
    surahNum: number,
    ayahs: string[],
    startIndex: number,
    options: {
      mode?: OfflinePlaybackMode;
      repeatSingle?: boolean;
      delayBetweenMs?: number;
      reciterId?: string;
    },
    callbacks: ReciterCallbacks
  ): void {
    this.stop();
    if (!ayahs.length || startIndex < 0 || startIndex >= ayahs.length) {
      callbacks.onComplete();
      return;
    }

    const activeSession = this.sessionId;
    this.isRunning = true;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
    }

    const reciter = getReciterById(options.reciterId || DEFAULT_RECITER_ID);

    const step = (idx: number) => {
      if (!this.isRunning || this.sessionId !== activeSession) return;
      if (idx >= ayahs.length) {
        this.stop();
        callbacks.onComplete();
        return;
      }

      callbacks.onAyahStart(idx);

      const ayahText = ayahs[idx];
      const nextIndex = options.repeatSingle ? idx : idx + 1;
      const delayMs = options.delayBetweenMs ?? 450;
      const mode = options.mode ?? 'auto';

      const scheduleNext = (waitMs: number) => {
        if (!this.isRunning || this.sessionId !== activeSession) return;
        this.timerId = window.setTimeout(() => {
          if (this.isRunning && this.sessionId === activeSession) {
            step(nextIndex);
          }
        }, waitMs);
      };

      if (mode === 'timer') {
        callbacks.onModeInfo?.('وضع التمرير الهادئ (بدون صوت وبدون إنترنت).');
        const words = ayahText.trim().split(/\s+/).length;
        scheduleNext(Math.max(2600, Math.min(7500, words * 550)));
        return;
      }

      const speakOfflineFallback = (note: string) => {
        if (!this.isRunning || this.sessionId !== activeSession) return;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const voices = window.speechSynthesis.getVoices();
            const arabicVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
            if (arabicVoice) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(ayahText);
              utterance.lang = 'ar-SA';
              utterance.voice = arabicVoice;
              utterance.rate = 0.92;

              let finished = false;
              const words = ayahText.trim().split(/\s+/).length;
              const safetyTimeoutMs = Math.max(4500, words * 950);

              const finishOnce = (waitMs: number) => {
                if (finished || !this.isRunning || this.sessionId !== activeSession) return;
                finished = true;
                if (this.timerId !== null) {
                  window.clearTimeout(this.timerId);
                  this.timerId = null;
                }
                scheduleNext(waitMs);
              };

              utterance.onend = () => finishOnce(delayMs);
              utterance.onerror = () => finishOnce(Math.max(2600, Math.min(7000, words * 520)));

              this.currentUtterance = utterance;
              callbacks.onModeInfo?.('قراءة صوتية عبر الجهاز (بدون إنترنت).');

              this.timerId = window.setTimeout(() => {
                if (!finished && this.isRunning && this.sessionId === activeSession) {
                  finishOnce(delayMs);
                }
              }, safetyTimeoutMs);

              window.speechSynthesis.speak(utterance);
              return;
            }
          } catch {
            // Fall through to timed reading
          }
        }

        callbacks.onModeInfo?.(note);
        const words = ayahText.trim().split(/\s+/).length;
        scheduleNext(Math.max(2600, Math.min(7500, words * 550)));
      };

      if (mode === 'tts') {
        speakOfflineFallback('وضع التمرير التلقائي (بدون إنترنت) — يستمر حتى آخر السورة.');
        return;
      }

      if (this.audio) {
        const audio = this.audio;
        let handled = false;
        let triedLocalFallback = Boolean(reciter.offlineLocal);

        const handleAudioFail = () => {
          if (!this.isRunning || this.sessionId !== activeSession) return;

          if (!triedLocalFallback) {
            triedLocalFallback = true;
            audio.src = `/assets/audio/${surahNum}/${idx + 1}.mp3`;
            callbacks.onModeInfo?.(
              `تعذر تحميل صوت الشيخ ${reciter.name}؛ تم الانتقال للتسجيل المدمج بدون إنترنت.`
            );
            const fallbackPromise = audio.play();
            if (fallbackPromise && typeof fallbackPromise.catch === 'function') {
              fallbackPromise.catch(() => {
                if (!handled) {
                  handled = true;
                  audio.onended = null;
                  audio.onerror = null;
                  speakOfflineFallback('تعذر تشغيل الصوت في المتصفح؛ يستمر التمرير التلقائي.');
                }
              });
            }
            return;
          }

          if (handled) return;
          handled = true;
          audio.onended = null;
          audio.onerror = null;
          speakOfflineFallback('تعذر تشغيل الصوت في المتصفح؛ يستمر التمرير التلقائي.');
        };

        audio.onended = () => {
          if (handled || !this.isRunning || this.sessionId !== activeSession) return;
          handled = true;
          scheduleNext(delayMs);
        };

        audio.onerror = handleAudioFail;
        audio.src = getAyahAudioUrl(reciter.id, surahNum, idx + 1);
        callbacks.onModeInfo?.(
          reciter.offlineLocal
            ? `تلاوة الشيخ ${reciter.name} (تسجيل مدمج بدون إنترنت).`
            : `تلاوة الشيخ ${reciter.name} (${reciter.style}).`
        );
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(handleAudioFail);
        }
      }
    };

    step(startIndex);
  }
}

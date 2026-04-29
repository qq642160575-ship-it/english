"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SPEECH_RATE_KEY, DEFAULT_SPEECH_RATE } from "@/lib/constants";

function loadSpeechRate(): number {
  if (typeof window === "undefined") return DEFAULT_SPEECH_RATE;
  try {
    const stored = localStorage.getItem(SPEECH_RATE_KEY);
    if (stored !== null) {
      const rate = parseFloat(stored);
      if (rate >= 0.3 && rate <= 2.0) return rate;
    }
  } catch {}
  return DEFAULT_SPEECH_RATE;
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_SPEECH_RATE);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSpeechRate(loadSpeechRate());
    const load = () => {
      setVoices(
        speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"))
      );
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => {
      speechSynthesis.onvoiceschanged = null;
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    };
  }, []);

  const handleRateChange = useCallback((rate: number) => {
    setSpeechRate(rate);
    try {
      localStorage.setItem(SPEECH_RATE_KEY, String(rate));
    } catch {}
  }, []);

  const speak = useCallback(
    (text: string, options?: { rate?: number; onend?: () => void; immediate?: boolean }) => {
      if (!text || typeof speechSynthesis === "undefined") return;

      const currentRate = loadSpeechRate();

      const doSpeak = () => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = options?.rate ?? currentRate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (selectedVoice) {
          const match = voices.find((v) => v.name === selectedVoice);
          if (match) utterance.voice = match;
        }
        utterance.onerror = (e) => {
          if (e.error !== "canceled") {
            console.warn("TTS error:", e.error);
          }
        };
        if (options?.onend) utterance.onend = options.onend;
        speechSynthesis.speak(utterance);
      };

      if (options?.immediate) {
        // 切换词时立即打断旧音频，无 debounce
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        doSpeak();
      } else {
        // 打字过程中：防抖 100ms
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        speakTimerRef.current = setTimeout(doSpeak, 100);
      }
    },
    [voices, selectedVoice]
  );

  const cancel = useCallback(() => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    speechSynthesis.cancel();
  }, []);

  return { voices, selectedVoice, setSelectedVoice, speechRate, setSpeechRate: handleRateChange, speak, cancel };
}

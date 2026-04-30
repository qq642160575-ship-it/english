"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { useSpeech } from "@/hooks/use-speech";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useProgress } from "@/hooks/use-progress";
import { useIpaDisplay } from "@/hooks/use-ipa-display";
import { useTheme } from "@/hooks/use-theme";
import { useHistoryStats } from "@/hooks/use-history-stats";
import { useStreak } from "@/hooks/use-streak";
import { useLearningPath } from "@/hooks/use-learning-path";
import { useSRS } from "@/hooks/use-srs";
import { useDailyGoal } from "@/hooks/use-daily-goal";
import { useWordbook } from "@/hooks/use-wordbook";
import { useGlobalErrors } from "@/hooks/use-global-errors";
import { registerSW } from "@/app/sw-register";

import { dataRegistry } from "@/data/registry";
import { AUTO_ADVANCE_DELAY, INITIAL_SPEAK_DELAY, COMPLETE_RATE, DEFAULT_SPEECH_RATE, SPEECH_RATE_KEY, LEARNING_PATH, STORAGE_KEY } from "@/lib/constants";
import { LearningMode, WordItem, SentenceItem, ChapterMeta, StoredProgress, DailyGoalData } from "@/data/types";
import type { LearningPathResult } from "@/hooks/use-learning-path";
import type { DayStats } from "@/hooks/use-history-stats";
import type { WordBookEntry } from "@/hooks/use-wordbook";
import type { GlobalErrorEntry } from "@/hooks/use-global-errors";
import { cn } from "@/lib/utils";
import { RotateCcw, SkipForward, Play, Keyboard, Volume2, VolumeX, Eye, EyeOff, ChevronLeft, ChevronRight, Settings, ListCollapse, Lightbulb, BookA, MessageSquare, Sun, Moon, Star, PenLine } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingOverlay, isOnboardingDone } from "@/components/onboarding/onboarding-overlay";

import { TypingArea } from "@/components/game/typing-area";
import { DataManager } from "@/components/data/data-manager";
import { VirtualKeyboard } from "@/components/game/virtual-keyboard";

// Icons for modes
const modeIcons = { word: BookA, sentence: MessageSquare };

export default function Home() {
  const game = useGameState();
  const { state, handleCharInput, handleBackspace, loadItem, completeItem, skipItem, addSkipped, clearSkipped, switchMode, restoreIndices, setCategory, setChapter, reset, clearWrong, revealLetter } = game;
  const { speak, cancel, speechRate, setSpeechRate } = useSpeech();
  const { save, load } = useProgress();
  const { recordCompletion, getLast7Days, totalCompleted } = useHistoryStats();
  const { streak, markActive } = useStreak();
  const srs = useSRS();
  const dailyGoal = useDailyGoal();
  const wordbook = useWordbook();
  const globalErrors = useGlobalErrors();

  // Register service worker for PWA
  useEffect(() => { registerSW(); }, []);

  // Load full progress for learning path
  const [storedProgress, setStoredProgress] = useState<StoredProgress | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStoredProgress(JSON.parse(raw));
    } catch {}
  }, [state.index, state.completedIndices.length]);
  const lp = useLearningPath(storedProgress);

  // UI State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [showDataManager, setShowDataManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [categoryItems, setCategoryItems] = useState<(WordItem | SentenceItem)[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewItems, setReviewItems] = useState<(WordItem | SentenceItem)[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [backspaceFeedback, setBackspaceFeedback] = useState<string | null>(null);
  const [stuckGuidance, setStuckGuidance] = useState<string | null>(null);
  const [isSRSReview, setIsSRSReview] = useState(false);
  const [errorFlash, setErrorFlash] = useState<"none" | "shake">("none");
  const [showIpa, setShowIpa] = useState(true);
  const [milestone, setMilestone] = useState<string | null>(null);
  const showBottomStats = true;
  const [completedWordFeedback, setCompletedWordFeedback] = useState<{ en: string; zh: string; isSrs?: boolean } | null>(null);
  const [srsSessionCorrect, setSrsSessionCorrect] = useState(0);
  const [srsSessionTotal, setSrsSessionTotal] = useState(0);
  const [srsSessionComplete, setSrsSessionComplete] = useState(false);
  const [goalCelebration, setGoalCelebration] = useState(false);
  const [dictationToast, setDictationToast] = useState<string | null>(null);
  const [bookmarkBounce, setBookmarkBounce] = useState(false);

  // Detect daily goal completion and show celebration
  const prevAllDoneRef = useRef(dailyGoal.isAllDone);
  useEffect(() => {
    if (dailyGoal.isAllDone && !prevAllDoneRef.current) {
      setGoalCelebration(true);
      setTimeout(() => setGoalCelebration(false), 3000);
    }
    prevAllDoneRef.current = dailyGoal.isAllDone;
  }, [dailyGoal.isAllDone]);
  const [isDictationMode, setIsDictationMode] = useState(false);
  const [showLearnedWords, setShowLearnedWords] = useState(false);
  const [showWordbookPanel, setShowWordbookPanel] = useState(false);
  const [showErrorsPanel, setShowErrorsPanel] = useState(false);
  const [skipCompletedMode, setSkipCompletedMode] = useState(false);
  const prevSkipCompletedRef = useRef(skipCompletedMode);

  // Refs
  const stateRef = useRef(state);
  stateRef.current = state;
  const itemsRef = useRef(categoryItems);
  itemsRef.current = categoryItems;
  const speakRef = useRef(speak);
  speakRef.current = speak;
  const handleCharInputRef = useRef(handleCharInput);
  handleCharInputRef.current = handleCharInput;
  const completeItemRef = useRef(completeItem);
  completeItemRef.current = completeItem;
  const handleBackspaceRef = useRef(handleBackspace);
  handleBackspaceRef.current = handleBackspace;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reviewItemsRef = useRef(reviewItems);
  reviewItemsRef.current = reviewItems;
  const isReviewModeRef = useRef(isReviewMode);
  isReviewModeRef.current = isReviewMode;
  const advanceRef = useRef<() => void>(() => {});
  const isSRSReviewRef = useRef(isSRSReview);
  isSRSReviewRef.current = isSRSReview;
  const srsReviewIdsRef = useRef<{ id: string; en: string }[]>([]);
  const srsAnswerCorrectRef = useRef(srs.answerCorrect);
  srsAnswerCorrectRef.current = srs.answerCorrect;
  const dailyIncrementNewRef = useRef(dailyGoal.incrementNew);
  dailyIncrementNewRef.current = dailyGoal.incrementNew;
  const dailyIncrementReviewRef = useRef(dailyGoal.incrementReview);
  dailyIncrementReviewRef.current = dailyGoal.incrementReview;
  const isDictationModeRef = useRef(isDictationMode);
  isDictationModeRef.current = isDictationMode;
  const recordGlobalErrorRef = useRef(globalErrors.recordError);
  recordGlobalErrorRef.current = globalErrors.recordError;
  const prevCompletedRef = useRef<number[]>([]);

  // When "隐藏已学" is toggled ON, jump from current completed word to next uncompleted
  useEffect(() => {
    if (!skipCompletedMode || prevSkipCompletedRef.current) return;
    prevSkipCompletedRef.current = true;
    const items = categoryItems;
    if (items.length === 0 || isReviewMode) return;
    if (state.completedIndices.includes(state.index) && !state.isComplete) {
      let ni = state.index + 1;
      while (ni < items.length && state.completedIndices.includes(ni)) {
        ni++;
      }
      if (ni < items.length) {
        loadItem(ni, items[ni].en);
        cancel();
      }
    }
  }, [skipCompletedMode]);
  // Sync ref
  useEffect(() => { prevSkipCompletedRef.current = skipCompletedMode; }, [skipCompletedMode]);

  const currentItem = (isReviewMode ? reviewItems : categoryItems)[state.index] ?? null;
  const currentTarget = currentItem?.en ?? "";
  const currentErrorEntry = isReviewMode && !isSRSReview ? globalErrors.errorItems.find((e) => e.en === currentTarget) : null;
  const fullIpa = currentItem
    ? "ipa" in currentItem
      ? currentItem.ipa
      : currentItem.iw.map((w) => w.ipa).join(" ")
    : "";

  const ipaResult = useIpaDisplay(state.mode, currentItem, state.input, state.isComplete);
  const chapters: ChapterMeta[] = dataRegistry.getChapters(state.category);
  const chapterItems = dataRegistry.getItemsByChapter(state.category, state.chapter);

  // Timer
  useEffect(() => {
    if (state.isComplete && state.index >= chapterItems.length - 1) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [state.isComplete, state.index, chapterItems.length]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const loadChapterItems = useCallback((category: string, chapter: number) => {
    const items = dataRegistry.getItemsByChapter(category, chapter);
    setCategoryItems(items);
    return items;
  }, []);

  // Client-side only initializations
  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setShowKeyboard(true);
    }
    if (!isOnboardingDone()) {
      setShowOnboarding(true);
    }
  }, []);

  // Initialize
  useEffect(() => {
    dataRegistry.init();
    const cat = state.category;
    const ch = state.chapter;
    const mode = state.mode;
    let items = loadChapterItems(cat, ch);

    // If current category has no items, fall back to first available pack
    if (items.length === 0) {
      const available = dataRegistry.getAvailablePacks(mode);
      if (available.length > 0) {
        const firstPack = available[0].id;
        setCategory(firstPack);
        const firstCh = dataRegistry.getDefaultChapter(firstPack);
        items = loadChapterItems(firstPack, firstCh);
        const saved = load(mode, firstPack, firstCh);
        if (saved && items[saved.index]) {
          restoreIndices(saved.index, saved.completedIndices);
          loadItem(saved.index, items[saved.index].en);
        } else if (items[0]) {
          loadItem(0, items[0].en);
        }
        return;
      }
    }

    const saved = load(mode, cat, ch);
    if (saved && items[saved.index]) {
      restoreIndices(saved.index, saved.completedIndices);
      loadItem(saved.index, items[saved.index].en);
    } else if (items[0]) {
      loadItem(0, items[0].en);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-speak — immediate: true 确保切换词时打断旧音频
  useEffect(() => {
    if (!currentTarget || state.isComplete || !soundEnabled || isDictationModeRef.current) return;
    const timer = setTimeout(() => speakRef.current(currentTarget, { immediate: true }), INITIAL_SPEAK_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.mode, state.category, state.chapter, currentTarget, soundEnabled]);

  // On complete — immediate 确保完成时打断打字过程中的 TTS
  useEffect(() => {
    if (!state.isComplete || !currentTarget) return;

    // 🛑 Skip all side-effects if this word was already completed (re-completion)
    if (prevCompletedRef.current.includes(state.index)) {
      if (soundEnabled) speakRef.current(currentTarget, { rate: COMPLETE_RATE, immediate: true });
      save(stateRef.current);
      return;
    }

    // Record word-level stats for history
    const hadErrors = state.wrongIndices.includes(state.index);
    recordCompletion(hadErrors);
    if (!isReviewModeRef.current) markActive();

    // Show completion feedback
    if (isSRSReviewRef.current) {
      setCompletedWordFeedback({ en: currentTarget, zh: "", isSrs: true });
      setSrsSessionCorrect((c) => c + 1);
    } else {
      const zh = currentItem && "zh" in currentItem ? (currentItem as WordItem).zh : "";
      setCompletedWordFeedback({ en: currentTarget, zh });
    }
    setTimeout(() => setCompletedWordFeedback(null), 1500);

    // Milestone check (non-review mode only)
    if (!isReviewModeRef.current) {
      const done = state.completedIndices.length;
      if ([5, 10, 15, 25, 50, 100].includes(done) && done > 0) {
        setMilestone(`🎉 已完成 ${done} 个词！`);
        setTimeout(() => setMilestone(null), 4000);
      }
    }

    // Add to SRS
    if (!isReviewModeRef.current && currentItem) {
      const zhSrs = "zh" in currentItem ? currentItem.zh : "";
      srs.addItem(currentTarget, zhSrs, state.category, `${state.category}/${state.chapter}/${state.index}`);
    }

    // Record global errors (non-review, non-SRS)
    if (!isReviewModeRef.current && hadErrors && currentItem) {
      const ipa = "ipa" in currentItem ? currentItem.ipa : "";
      recordGlobalErrorRef.current(currentTarget, currentItem.zh, ipa, state.category);
    }

    // Daily goal tracking
    if (!isReviewModeRef.current) {
      dailyIncrementNewRef.current();
    } else if (!isSRSReviewRef.current) {
      // Manual review mode counts as review (SRS review handled separately in auto-advance)
      dailyIncrementReviewRef.current();
    }

    if (soundEnabled) speakRef.current(currentTarget, { rate: COMPLETE_RATE, immediate: true });
    save(stateRef.current);

    // Store advance logic so Space/Enter can trigger it immediately
    advanceRef.current = () => {
      const s = stateRef.current;
      const items = isReviewModeRef.current ? reviewItemsRef.current : itemsRef.current;

      // SRS review: mark current word as correct + daily goal
      if (isSRSReviewRef.current && items[s.index]) {
        const currentEn = items[s.index].en;
        const srsEntry = srsReviewIdsRef.current.find((entry) => entry.en === currentEn);
        if (srsEntry) srsAnswerCorrectRef.current(srsEntry.id);
        dailyIncrementReviewRef.current();
      }

      const nextIndex = s.index + 1;
      if (nextIndex < items.length) {
        loadItem(nextIndex, items[nextIndex].en);
      } else if (isReviewModeRef.current) {
        if (isSRSReviewRef.current) {
          // SRS review complete — show summary
          setIsReviewMode(false);
          setIsSRSReview(false);
          setReviewItems([]);
          setSrsSessionComplete(true);
          clearWrong();
        } else {
          // Manual review complete — return to normal mode
          setIsReviewMode(false);
          setReviewItems([]);
          clearWrong();
        }
        const origItems = loadChapterItems(s.category, s.chapter);
        if (origItems.length > 0) loadItem(0, origItems[0].en);
      }
    };

    const timer = setTimeout(() => {
      advanceTimerRef.current = null;
      advanceRef.current();
    }, AUTO_ADVANCE_DELAY);
    advanceTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      if (advanceTimerRef.current === timer) advanceTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isComplete, currentTarget, soundEnabled, save, clearWrong, recordCompletion, markActive]);

  const onChar = useCallback((char: string) => {
    const s = stateRef.current;
    if (s.isComplete || s.input.length >= s.target.length) return;
    const newLen = s.input.length + 1;
    const prefix = s.target.slice(0, newLen);

    const targetChar = s.target[s.input.length].toLowerCase();
    const thisCharCorrect = char === targetChar;

    setActiveKey(char);
    setTimeout(() => setActiveKey(null), 100);

    if (thisCharCorrect) {
      handleCharInputRef.current(char);
      if (soundEnabledRef.current && char !== " " && !isDictationModeRef.current) speakRef.current(prefix);
      // Only complete when ALL letters typed AND all correct
      if (newLen >= s.target.length) {
        const allCorrect = s.input.every(c => c.correct);
        if (allCorrect) {
          prevCompletedRef.current = stateRef.current.completedIndices;
          completeItemRef.current();
        } else {
          // Previous char is wrong — don't complete, show guidance
          setStuckGuidance("前面有打错的字母，按退格键修正");
          setTimeout(() => setStuckGuidance(null), 2500);
        }
      }
      return;
    }

    // --- Wrong character ---
    // Show error character in red, DON'T complete — force user to backspace
    handleCharInputRef.current(char);
    if (soundEnabledRef.current && !isDictationModeRef.current) speakRef.current(prefix);
    setErrorFlash("shake");
    setTimeout(() => setErrorFlash("none"), 350);

    if (newLen >= s.target.length) {
      // Reached end with error — show gentle guidance
      setStuckGuidance("按 Backspace 修正，或按 Ctrl+Shift+K 跳过");
      setTimeout(() => {
        setStuckGuidance(null);
      }, 4000);
    }
  }, []);

  const onSpace = useCallback(() => {
    const s = stateRef.current;
    if (s.isComplete) {
      // Immediately advance to next word
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      advanceRef.current();
      return;
    }
    if (s.input.length >= s.target.length) return;
    const newLen = s.input.length + 1;
    const prefix = s.target.slice(0, newLen);
    handleCharInputRef.current(" ");
    if (soundEnabledRef.current) speakRef.current(prefix);
    setActiveKey("space");
    setTimeout(() => setActiveKey(null), 100);
  }, []);

  const onBackspace = useCallback(() => {
    const s = stateRef.current;
    // Check if last character was an error — positive feedback on correction
    const lastChar = s.input[s.input.length - 1];
    const wasError = lastChar && !lastChar.correct;
    handleBackspace();
    setStuckGuidance(null); // dismiss error guidance on backspace
    if (wasError) {
      setBackspaceFeedback("继续！");
      setTimeout(() => setBackspaceFeedback(null), 1200);
    }
    setActiveKey("backspace");
    setTimeout(() => setActiveKey(null), 100);
  }, [handleBackspace]);

  const onEnter = useCallback(() => {
    const s = stateRef.current;
    if (s.isComplete) {
      // Immediately advance to next word
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
      advanceRef.current();
      return;
    }
    const items = itemsRef.current;
    cancel();
    const ci = s.index;
    const nextIndex = s.index + 1;
    const isAlreadyCompleted = !isReviewModeRef.current && s.completedIndices.includes(ci);
    if (nextIndex < items.length) {
      if (isAlreadyCompleted) {
        loadItem(nextIndex, items[nextIndex].en);
      } else {
        skipItem(ci, nextIndex, items[nextIndex].en);
      }
    } else if (!isAlreadyCompleted) {
      addSkipped(ci);
    }
  }, [cancel, skipItem, addSkipped, loadItem]);

  useKeyboard({ onChar, onSpace, onBackspace, onEnter, enabled: !state.isComplete && currentItem !== null });

  // Handlers
  // Find first uncompleted index from a starting point, respecting skipCompletedMode
  const skipCompleted = useCallback((items: (WordItem | SentenceItem)[], fromIndex: number, completed: number[]): number => {
    if (!skipCompletedMode || isReviewMode) return fromIndex;
    let ni = fromIndex;
    while (ni < items.length && completed.includes(ni)) {
      ni++;
    }
    return ni < items.length ? ni : fromIndex;
  }, [skipCompletedMode, isReviewMode]);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setCategory(categoryId);
    cancel();
    setElapsedSeconds(0);
    const ch = dataRegistry.getDefaultChapter(categoryId);
    const items = loadChapterItems(categoryId, ch);
    const saved = load(stateRef.current.mode, categoryId, ch);
    let targetIndex = 0;
    if (saved && items[saved.index]) {
      restoreIndices(saved.index, saved.completedIndices);
      targetIndex = saved.index;
    }
    targetIndex = skipCompleted(items, targetIndex, saved?.completedIndices ?? []);
    loadItem(targetIndex, items[targetIndex]?.en ?? "");
  }, [cancel, setCategory, load, restoreIndices, loadItem, loadChapterItems, skipCompleted]);

  const handleChapterChange = useCallback((chapter: number) => {
    setChapter(chapter);
    cancel();
    setElapsedSeconds(0);
    const items = loadChapterItems(stateRef.current.category, chapter);
    const saved = load(stateRef.current.mode, stateRef.current.category, chapter);
    let targetIndex = 0;
    if (saved && items[saved.index]) {
      restoreIndices(saved.index, saved.completedIndices);
      targetIndex = saved.index;
    }
    targetIndex = skipCompleted(items, targetIndex, saved?.completedIndices ?? []);
    loadItem(targetIndex, items[targetIndex]?.en ?? "");
  }, [cancel, setChapter, load, restoreIndices, loadItem, loadChapterItems, skipCompleted]);

  const handleModeChange = useCallback((mode: LearningMode) => {
    setIsReviewMode(false);
    setIsSRSReview(false);
    setSrsSessionComplete(false);
    setReviewItems([]);
    const available = dataRegistry.getAvailablePacks(mode);
    const catId = available[0]?.id ?? (mode === "word" ? "basic-words" : "basic-sentences");
    const items = dataRegistry.getItems(catId) as (WordItem | SentenceItem)[];
    switchMode(mode, 0, items[0]?.en ?? "");
    setCategoryItems(items);
    setElapsedSeconds(0);
    cancel();
  }, [switchMode, cancel]);

  const handlePacksChanged = useCallback(() => {
    const s = stateRef.current;
    const items = loadChapterItems(s.category, s.chapter);
    if (items.length > 0) loadItem(Math.min(s.index, items.length - 1), items[Math.min(s.index, items.length - 1)].en);
  }, [loadItem, loadChapterItems]);

  const handleReviewWrongWords = useCallback(() => {
    const wrongItems = state.wrongIndices
      .map((i) => categoryItems[i])
      .filter(Boolean);
    if (wrongItems.length === 0) return;
    setIsReviewMode(true);
    setReviewItems(wrongItems);
    loadItem(0, wrongItems[0].en);
    cancel();
  }, [state.wrongIndices, categoryItems, loadItem, cancel]);

  const handleReviewAll = useCallback(() => {
    const items = [...categoryItems];
    // Fisher-Yates shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setIsReviewMode(true);
    setReviewItems(items);
    loadItem(0, items[0].en);
    cancel();
  }, [categoryItems, loadItem, cancel]);

  const handleReviewChapter = useCallback((chapter: number) => {
    const items = dataRegistry.getItemsByChapter(state.category, chapter);
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    if (shuffled.length === 0) return;
    setIsReviewMode(true);
    setReviewItems(shuffled);
    loadItem(0, shuffled[0].en);
    cancel();
  }, [state.category, loadItem, cancel]);

  const handleSRSReview = useCallback(() => {
    if (srs.dueItems.length === 0) return;
    srsReviewIdsRef.current = srs.dueItems.map((item) => ({ id: item.id, en: item.en }));
    const items = srs.dueItems.map((item) => ({
      en: item.en,
      zh: item.zh,
      ipa: "",
      ib: [],
    }));
    setSrsSessionCorrect(0);
    setSrsSessionTotal(items.length);
    setSrsSessionComplete(false);
    setIsReviewMode(true);
    setIsSRSReview(true);
    setReviewItems(items);
    loadItem(0, items[0].en);
    cancel();
  }, [srs.dueItems, loadItem, cancel]);

  const handleBookmarkToggle = useCallback(() => {
    if (!currentItem) return;
    wordbook.toggleEntry({
      en: currentItem.en,
      zh: "zh" in currentItem ? currentItem.zh : "",
      ipa: "ipa" in currentItem ? currentItem.ipa : "",
      packId: state.category,
      addedAt: Date.now(),
    });
    setBookmarkBounce(true);
    setTimeout(() => setBookmarkBounce(false), 400);
  }, [currentItem, wordbook, state.category]);

  const startWordbookReview = useCallback((items?: (WordItem | SentenceItem)[]) => {
    const reviewWords = items ?? wordbook.entries.map((entry) => ({
      en: entry.en,
      zh: entry.zh,
      ipa: entry.ipa ?? "",
      ib: [] as number[],
    }));
    if (reviewWords.length === 0) return;
    setIsReviewMode(true);
    setIsSRSReview(false);
    setReviewItems(reviewWords);
    loadItem(0, reviewWords[0].en);
    cancel();
  }, [wordbook.entries, loadItem, cancel]);

  const handleWordbookPanel = useCallback(() => {
    if (wordbook.entries.length === 0) return;
    setShowWordbookPanel(true);
  }, [wordbook.entries]);

  const getChapterStatus = useCallback((ch: number): "done" | "partial" | "fresh" => {
    const items = dataRegistry.getItemsByChapter(stateRef.current.category, ch);
    if (items.length === 0) return "fresh";
    if (ch === stateRef.current.chapter) {
      if (stateRef.current.completedIndices.length >= items.length) return "done";
      if (stateRef.current.completedIndices.length > 0) return "partial";
      return "fresh";
    }
    const saved = load(stateRef.current.mode, stateRef.current.category, ch);
    if (!saved) return "fresh";
    const count = saved.completedIndices?.length ?? 0;
    if (count >= items.length) return "done";
    if (count > 0) return "partial";
    return "fresh";
  }, [load]);

  const handleReset = useCallback(() => {
    cancel();
    reset();
    setElapsedSeconds(0);
    const startIndex = skipCompleted(categoryItems, 0, []);
    loadItem(startIndex, categoryItems[startIndex]?.en ?? "");
  }, [cancel, reset, loadItem, categoryItems, skipCompleted]);
  const handleListen = useCallback(() => { if (currentTarget) speak(currentTarget); }, [currentTarget, speak]);
  const handleSkip = useCallback(() => {
    if (state.isComplete) return;
    cancel();
    const items = isReviewMode ? reviewItems : categoryItems;
    const ci = state.index;
    const ni = state.index + 1;
    // Don't track skip if word was already completed
    const isAlreadyCompleted = !isReviewMode && state.completedIndices.includes(ci);
    if (ni < items.length) {
      if (isAlreadyCompleted) {
        loadItem(ni, items[ni].en);
      } else {
        skipItem(ci, ni, items[ni].en);
      }
    } else if (ni >= items.length && !isReviewMode && !isAlreadyCompleted) {
      addSkipped(ci);
    }
  }, [cancel, skipItem, addSkipped, loadItem, state.index, state.isComplete, state.completedIndices, categoryItems, reviewItems, isReviewMode]);
  const handlePrevWord = useCallback(() => {
    const items = isReviewMode ? reviewItems : categoryItems;
    let ni = state.index - 1;
    if (!isReviewMode && skipCompletedMode) {
      while (ni >= 0 && state.completedIndices.includes(ni)) {
        ni--;
      }
    }
    if (ni >= 0) {
      loadItem(ni, items[ni].en);
      cancel();
      clearWrong();
    }
  }, [isReviewMode, skipCompletedMode, reviewItems, categoryItems, state.index, state.completedIndices, loadItem, cancel, clearWrong]);
  const handleNextWord = useCallback(() => {
    const items = isReviewMode ? reviewItems : categoryItems;
    let ni = state.index + 1;
    // Skip completed words in skipCompletedMode
    if (!isReviewMode && skipCompletedMode) {
      while (ni < items.length && state.completedIndices.includes(ni)) {
        ni++;
      }
    }
    if (ni < items.length) {
      loadItem(ni, items[ni].en);
      cancel();
      clearWrong();
    }
  }, [isReviewMode, skipCompletedMode, reviewItems, categoryItems, state.index, state.completedIndices, loadItem, cancel, clearWrong]);
  const handleKeyPress = useCallback((key: string) => {
    if (key === "backspace") onBackspace();
    else if (key === "space") onSpace();
    else onChar(key);
  }, [onBackspace, onSpace, onChar]);
  const handleSoundToggle = useCallback(() => setSoundEnabled((p) => !p), []);
  const handleDictationModeToggle = useCallback(() => {
    setIsDictationMode((p) => {
      const next = !p;
      setDictationToast(next ? "已切换到听写模式：只看中文拼写英文" : "已退出听写模式");
      setTimeout(() => setDictationToast(null), 2500);
      return next;
    });
  }, []);
  const startErrorsReview = useCallback((items?: (WordItem | SentenceItem)[]) => {
    const reviewWords = items ?? globalErrors.errorItems.map((entry) => ({
      en: entry.en,
      zh: entry.zh,
      ipa: entry.ipa,
      ib: [] as number[],
    }));
    if (reviewWords.length === 0) return;
    setIsReviewMode(true);
    setIsSRSReview(false);
    setReviewItems(reviewWords);
    loadItem(0, reviewWords[0].en);
    cancel();
  }, [globalErrors.errorItems, loadItem, cancel]);

  const handleErrorsPanel = useCallback(() => {
    if (globalErrors.errorItems.length === 0) return;
    setShowErrorsPanel(true);
  }, [globalErrors.errorItems]);
  const handleReveal = useCallback(() => {
    const s = stateRef.current;
    if (s.isComplete || s.revealedCount >= 2) return;
    for (let i = s.input.length; i < s.target.length; i++) {
      if (!s.revealedLetters[i]) {
        revealLetter(i);
        break;
      }
    }
  }, [revealLetter]);

  const handleExitReview = useCallback(() => {
    setIsReviewMode(false);
    setIsSRSReview(false);
    setSrsSessionComplete(false);
    setReviewItems([]);
    clearWrong();
    const origItems = loadChapterItems(stateRef.current.category, stateRef.current.chapter);
    if (origItems.length > 0) loadItem(0, origItems[0].en);
    cancel();
  }, [clearWrong, loadItem, loadChapterItems, cancel]);

  const handleReviewSkipped = useCallback(() => {
    const skippedItems = state.skippedIndices
      .map((i) => categoryItems[i])
      .filter(Boolean);
    if (skippedItems.length === 0) return;
    setIsReviewMode(true);
    setReviewItems(skippedItems);
    clearSkipped();
    loadItem(0, skippedItems[0].en);
    cancel();
  }, [state.skippedIndices, categoryItems, clearSkipped, loadItem, cancel]);

  const handleShowLearnedWords = useCallback(() => {
    setShowLearnedWords(true);
  }, []);

  const handleShare = useCallback(() => {
    const chapterTitle = chapters.find((c) => c.chapter === state.chapter)?.title ?? `Chapter ${state.chapter}`;
    const totalLetters = state.stats.letters;
    const acc = totalLetters > 0 ? Math.round((state.stats.correct / totalLetters) * 100) : 0;
    const shareText = `在 背单词 上完成了「${chapterTitle}」的练习！正确率 ${acc}%，共 ${totalLetters} 个字母。你也来试试？`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "背单词 - 英语学习", text: shareText, url: "https://english.angrach.top" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
  }, [chapters, state.chapter, state.stats]);

  // Keyboard shortcuts for action buttons
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === "Escape" && !ctrl) { e.preventDefault(); handleReset(); return; }
      if (ctrl && e.shiftKey && e.key === "P") { e.preventDefault(); handleListen(); return; }
      if (ctrl && e.shiftKey && e.key === "K") { e.preventDefault(); handleSkip(); return; }
      if (ctrl && e.shiftKey && e.key === "V") { e.preventDefault(); setShowHint((p) => !p); return; }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleReset, handleListen, handleSkip, setShowHint]);

  const completedCount = state.completedIndices.length;
  const totalCount = chapterItems.length;
  const isChapterComplete = totalCount > 0 && completedCount >= totalCount && !isReviewMode;
  const categories = state.mode === "word" ? dataRegistry.getAvailablePacks("word") : dataRegistry.getAvailablePacks("sentence");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <AppleSidebar
        collapsed={sidebarCollapsed}
        currentMode={state.mode}
        onModeChange={handleModeChange}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onShowStats={() => setShowStats(true)}
        streak={streak}
        currentCategory={state.category}
        onCategoryChange={handleCategoryChange}
        learningPath={lp}
        srsDueCount={srs.dueCount}
        onSRSReview={handleSRSReview}
        dailyGoal={dailyGoal}
        wordbookCount={wordbook.count}
        onWordbookReview={handleWordbookPanel}
        globalErrorCount={globalErrors.errorCount}
        onGlobalErrorReview={handleErrorsPanel}
      />

      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-action-blue)]/[0.02] pointer-events-none" />

        {/* Top frosted nav bar */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between h-12 px-5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200/40 dark:border-zinc-800/40">
          {/* Review mode indicator */}
          {isReviewMode && (
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center h-full pointer-events-none">
              <span className={cn(
                "px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wide flex items-center gap-1",
                isSRSReview
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                  : currentErrorEntry
                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              )}>
                {currentErrorEntry ? (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                )}
                {currentErrorEntry ? "错词复习" : "复习模式"}
                {isSRSReview && <span className="opacity-60">{srsSessionCorrect}/{srsSessionTotal}</span>}
                {currentErrorEntry && (
                  <span className="opacity-70">· 错 {currentErrorEntry.errorCount} 次</span>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
            {/* Category selector */}
            {categories.length > 1 && (
              <>
                <Select value={state.category} onValueChange={(v) => v && handleCategoryChange(v)}>
                  <SelectTrigger className="h-7 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-xs font-semibold focus:ring-0 w-auto px-2 shadow-none text-zinc-800 dark:text-zinc-200 gap-1 [&>svg]:w-3 [&>svg]:h-3">
                    <SelectValue placeholder="选择词库" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs">
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
              </>
            )}
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold tracking-tight">
              {chapters.find((c) => c.chapter === state.chapter)?.title ?? `第 ${state.chapter} 章`}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600 mx-1">·</span>
            <span>{state.index + 1} / {chapterItems.length}</span>
            {completedCount > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600 mx-1">·</span>
                <span className="text-[var(--color-success)]">{completedCount} 完成</span>
              </>
            )}
            {/* Skip completed mode toggle */}
            {!isReviewMode && completedCount > 0 && completedCount < totalCount && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600 mx-1">·</span>
                <button
                  onClick={() => setSkipCompletedMode((v) => !v)}
                  className={cn(
                    "text-[11px] font-medium rounded-md px-1.5 py-0.5 transition-all active:scale-95",
                    skipCompletedMode
                      ? "text-[var(--color-action-blue)] bg-[var(--color-action-blue)]/10"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
                  )}
                >
                  {skipCompletedMode ? "隐藏已学" : "显示已学"}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Skipped words count */}
            {!isReviewMode && state.skippedIndices.length > 0 && (
              <button
                onClick={handleReviewSkipped}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-95"
                title="复习跳过的词"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
                <span>{state.skippedIndices.length}</span>
              </button>
            )}
            {/* Learned words */}
            {!isReviewMode && completedCount > 0 && (
              <button
                onClick={handleShowLearnedWords}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all active:scale-95"
                title="查看已学单词"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{completedCount}</span>
              </button>
            )}
            <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            {/* Sound */}
            <button onClick={handleSoundToggle} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all active:scale-95">
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Hint (show/hide untyped letters) */}
            <button onClick={() => setShowHint((p) => !p)} className={cn("p-1.5 rounded-md transition-all active:scale-95", showHint ? "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200" : "text-[var(--color-action-blue)]")} title={showHint ? "隐藏未输入字母 (Ctrl+Shift+V)" : "显示未输入字母 (Ctrl+Shift+V)"}>
              {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {/* Dictation mode toggle */}
            <button onClick={handleDictationModeToggle} className={cn("p-1.5 rounded-md transition-all active:scale-95", isDictationMode ? "text-[var(--color-action-blue)]" : "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5")} title={isDictationMode ? "退出听写模式" : "听写模式：只看中文，默写英文"}>
              <PenLine className="w-3.5 h-3.5" />
            </button>

            {/* Keyboard */}
            <button onClick={() => setShowKeyboard((p) => !p)} className={cn("p-1.5 rounded-md transition-all active:scale-95", showKeyboard ? "text-[var(--color-action-blue)]" : "text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5")}>
              <Keyboard className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

            {/* Chapter nav */}
            {chapters.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const idx = chapters.findIndex((c) => c.chapter === state.chapter);
                    if (idx > 0) handleChapterChange(chapters[idx - 1].chapter);
                  }}
                  disabled={chapters.findIndex((c) => c.chapter === state.chapter) <= 0}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums min-w-[28px] text-center">
                  {chapters.findIndex((c) => c.chapter === state.chapter) + 1}/{chapters.length}
                </span>
                <button
                  onClick={() => {
                    const idx = chapters.findIndex((c) => c.chapter === state.chapter);
                    if (idx < chapters.length - 1) handleChapterChange(chapters[idx + 1].chapter);
                  }}
                  disabled={chapters.findIndex((c) => c.chapter === state.chapter) >= chapters.length - 1}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
              </>
            )}

            {/* Settings */}
            <button onClick={() => setShowDataManager(true)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all active:scale-95">
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Exit review mode */}
            {isReviewMode && (
              <button
                onClick={handleExitReview}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all active:scale-95 flex items-center gap-1"
                title="退出复习模式"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                退出
              </button>
            )}

            {/* Reset (compact, secondary) */}
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-400 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all active:scale-95"
              title="重置本章进度 (Esc)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </nav>

        {/* Progress line */}
        {totalCount > 0 && (
          <div className="absolute top-12 left-0 right-0 h-[3px] bg-zinc-200/50 dark:bg-zinc-800/50 z-10">
            <div className="h-full bg-[var(--color-action-blue)] transition-all duration-500 ease-out rounded-r-full" style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }} />
          </div>
        )}

        {/* Daily goal celebration toast */}
        {goalCelebration && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
            <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              今日目标完成！已连续学习 {streak.currentStreak} 天 🔥
            </div>
          </div>
        )}

        {/* Prev / Next word previews */}
        {(() => {
          const items = isReviewMode ? reviewItems : categoryItems;
          if (items.length === 0) return null;
          const prevDisabled = state.index <= 0;
          const nextDisabled = state.index >= items.length - 1;
          const prevItem = !prevDisabled ? items[state.index - 1] : null;
          const nextItem = !nextDisabled ? items[state.index + 1] : null;
          return (
            <>
              {prevItem && (
                <div className="absolute top-[60px] left-5 z-10 flex items-center gap-1.5 max-w-[30vw] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl shadow-sm px-3 py-1.5">
                  <button
                    onClick={handlePrevWord}
                    disabled={prevDisabled}
                    className={cn("p-2 rounded-md transition-all active:scale-95 text-zinc-500 dark:text-zinc-400 hover:text-[var(--color-action-blue)] dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800", prevDisabled && "opacity-30 cursor-not-allowed")}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">上一词</span>
                  <span className={cn("text-xs font-medium tracking-tight truncate text-zinc-500 dark:text-zinc-400", prevDisabled && "opacity-30")}>
                    {showHint ? prevItem.en : prevItem.en.split("").map((c) => c === " " ? "·" : "_").join("")}
                  </span>
                </div>
              )}
              {nextItem && (
                <div className="absolute top-[60px] right-5 z-10 flex items-center gap-1.5 max-w-[30vw] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl shadow-sm px-3 py-1.5">
                  <span className={cn("text-xs font-medium tracking-tight truncate text-zinc-500 dark:text-zinc-400", nextDisabled && "opacity-30")}>
                    {showHint ? nextItem.en : nextItem.en.split("").map((c) => c === " " ? "·" : "_").join("")}
                  </span>
                  <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">下一词</span>
                  <button
                    onClick={handleNextWord}
                    disabled={nextDisabled}
                    className={cn("p-2 rounded-md transition-all active:scale-95 text-zinc-500 dark:text-zinc-400 hover:text-[var(--color-action-blue)] dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800", nextDisabled && "opacity-30 cursor-not-allowed")}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {/* Center Content */}
        {currentItem ? (
          <div key={state.index} className="flex flex-col items-center justify-center w-full max-w-4xl px-8 select-none -mt-12 animate-in fade-in duration-300">
            {/* Backspace correction feedback */}
            {backspaceFeedback && (
              <div className="mb-3 text-sm text-green-500 dark:text-green-400 font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
                {backspaceFeedback}
              </div>
            )}
            {/* Stuck guidance — force user to backspace */}
            {stuckGuidance && (
              <div className="mb-3 text-sm text-amber-500 dark:text-amber-400 font-semibold animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {stuckGuidance}
              </div>
            )}
            {/* Dictation mode toast */}
            {dictationToast && (
              <div className="mb-4 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-semibold border border-amber-200/50 dark:border-amber-700/30 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" />
                {dictationToast}
              </div>
            )}
            {/* Milestone badge — hide when completedWordFeedback is showing */}
            {milestone && !completedWordFeedback && (
              <div className="mb-5 px-6 py-2.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 text-sm font-semibold shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 animate-in fade-in zoom-in-105 duration-300">
                {milestone}
              </div>
            )}

            {/* Completed word feedback "✓ en = zh" (or SRS "✓ 已掌握！") */}
            {completedWordFeedback && (
              <div className={cn(
                "mb-5 px-5 py-2 rounded-full shadow-sm border animate-in fade-in zoom-in-105 duration-300 flex items-center gap-1.5",
                completedWordFeedback.isSrs
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/30"
                  : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-700/30"
              )}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {completedWordFeedback.isSrs ? (
                  <span>{completedWordFeedback.en} ✓ 已掌握！</span>
                ) : (
                  <>
                    <span>{completedWordFeedback.en}</span>
                    <span className="text-green-400 dark:text-green-500/60">=</span>
                    <span>{completedWordFeedback.zh || "—"}</span>
                  </>
                )}
              </div>
            )}

            {/* Already-completed word badge */}
            {!isReviewMode && state.completedIndices.includes(state.index) && (
              <div className="mb-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-semibold tracking-wide border border-green-200/50 dark:border-green-700/30">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                已掌握 · 按下一词跳过
              </div>
            )}

            {/* Dictation mode indicator */}
            {isDictationMode && !state.isComplete && (
              <div className="mb-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-semibold tracking-wide border border-amber-200/50 dark:border-amber-700/30">
                <PenLine className="w-3 h-3" />
                听写模式 · 根据中文默写英文
              </div>
            )}

            {/* Initial typing hint — only show when no other feedback is active */}
            {!state.isComplete && state.input.length === 0 && !backspaceFeedback && !stuckGuidance && !completedWordFeedback && (
              <div className="mb-6 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-sm font-semibold tracking-wide">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01"/>
                  </svg>
                  {isDictationMode ? "输入单词的英文拼写" : "按下键盘开始打字"}
                </div>
                <span className="text-xs text-zinc-300 dark:text-zinc-600 font-medium">
                  {isDictationMode ? "完成后会显示正确答案" : "每敲一个字母都会听到发音"}
                </span>
              </div>
            )}

            <TypingArea
              target={currentTarget}
              input={state.input}
              isComplete={state.isComplete}
              showHint={showHint}
              revealedLetters={state.revealedLetters}
              errorFlash={errorFlash}
              onEmojiClick={() => speak(currentTarget)}
              dictationMode={isDictationMode}
            />

            {/* IPA / Translation */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="text-xl md:text-2xl font-[var(--font-display)] font-medium tracking-tight transition-opacity flex items-center justify-center gap-2">
                {state.isComplete ? (
                  <span className="text-[var(--color-success)]/70 font-mono text-base">/{fullIpa}/</span>
                ) : (
                  <>
                    <span className="text-zinc-500 dark:text-zinc-400 text-base font-sans">{currentItem.zh || fullIpa}</span>
                    <button
                      onClick={() => setShowIpa(!showIpa)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded font-mono transition-all border border-zinc-200/50 dark:border-zinc-700/50",
                        showIpa
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                          : "bg-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-400"
                      )}
                    >
                      {showIpa ? "IPA" : "/pa/"}
                    </button>
                  </>
                )}
              </div>
              {showIpa && ipaResult.ipa && (
                <div className="flex items-center gap-2 text-base md:text-lg text-zinc-500 dark:text-zinc-400 font-mono tracking-tight">
                  <span className="font-light text-zinc-300 dark:text-zinc-600">&rarr;</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-mono">/{ipaResult.ipa}/</span>
                </div>
              )}
            </div>

            {/* Bookmark star — always visible */}
            {currentItem && (
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={handleBookmarkToggle}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-all active:scale-95 px-2 py-1 rounded-full",
                    wordbook.isBookmarked(currentTarget)
                      ? "text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                      : "text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                  )}
                  title={wordbook.isBookmarked(currentTarget) ? '从生词本移除' : '添加到生词本'}
                >
                  <Star className={cn("w-3.5 h-3.5 transition-all duration-200", wordbook.isBookmarked(currentTarget) && "fill-amber-500 text-amber-500", bookmarkBounce && "scale-125")} />
                  <span>{wordbook.isBookmarked(currentTarget) ? '已收藏' : '收藏'}</span>
                </button>
              </div>
            )}

            {/* Daily goal mini progress (always visible, not sidebar-dependent) */}
            {!state.isComplete && (
              <div className="mt-3 flex items-center justify-center gap-3">
                {/* New words bar */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">
                    今日 {dailyGoal.goal.todayNewCount + dailyGoal.goal.todayReviewCount}/{dailyGoal.goal.newWordsPerDay + dailyGoal.goal.reviewPerDay}
                  </span>
                  <div className="w-16 h-1 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-action-blue)] transition-all duration-500"
                      style={{ width: `${Math.min(100, dailyGoal.newPercent + dailyGoal.reviewPercent)}%` }}
                    />
                  </div>
                  {dailyGoal.isAllDone && (
                    <span className="text-[10px] text-green-500 font-semibold">✓</span>
                  )}
                </div>
              </div>
            )}

            {/* Error auto-prompt */}
            {!state.isComplete && state.wordErrorCount >= 3 && !stuckGuidance && (
              <div className="mt-3 text-xs text-amber-500 dark:text-amber-400 font-medium animate-in fade-in duration-300 flex items-center gap-1.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                卡住了？按 <kbd className="px-1 py-[1px] text-[10px] leading-none rounded-[3px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 font-mono border border-amber-300/50 dark:border-amber-700/50">Enter</kbd> 跳过这个词
              </div>
            )}

            {/* Action Buttons */}
            {!state.isComplete && (
              <div className="mt-10 flex items-center gap-3">
                <AppleActionButton onClick={handleListen} variant="secondary">
                  <Play className="w-3.5 h-3.5" />
                  听发音
                </AppleActionButton>
                <AppleActionButton onClick={handleReveal} variant="secondary" disabled={state.revealedCount >= 2}>
                  <Lightbulb className="w-3.5 h-3.5" />
                  {state.revealedCount >= 2 ? (
                    <span className="text-zinc-400 dark:text-zinc-500">提示已用完</span>
                  ) : (
                    <>提示 {Array(2 - state.revealedCount).fill("?").join("")}</>
                  )}
                </AppleActionButton>
                <AppleActionButton onClick={handleSkip} variant="primary" disabled={false}>
                  跳过
                  <SkipForward className="w-3.5 h-3.5" />
                </AppleActionButton>
              </div>
            )}

            {/* Virtual Keyboard */}
            {showKeyboard && (
              <div className="mt-10 w-full max-w-3xl">
                <VirtualKeyboard activeKey={activeKey} onKeyPress={handleKeyPress} input={state.input} isComplete={state.isComplete} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 text-zinc-400 font-medium">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-zinc-300 dark:text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">当前词库没有内容</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">您可以导入自己的词库文件，或恢复默认词库</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDataManager(true)} className="px-5 py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95">
                导入词库
              </button>
              <button
                onClick={() => {
                  try { localStorage.removeItem(STORAGE_KEY); } catch {}
                  const defaultPack = dataRegistry.getDefaultPackId(state.mode);
                  const defaultChapter = dataRegistry.getDefaultChapter(defaultPack);
                  handleCategoryChange(defaultPack);
                }}
                className="px-5 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm font-medium rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                恢复默认词库
              </button>
            </div>
          </div>
        )}

        {/* Chapter indicators at bottom */}
        {chapters.length > 1 && (
          <div className="absolute bottom-16 md:bottom-8 flex items-center gap-2 z-10">
            {chapters.map((ch) => {
              const status = getChapterStatus(ch.chapter);
              const isActive = ch.chapter === state.chapter;
              const preview = dataRegistry.getItemsByChapter(state.category, ch.chapter).slice(0, 5).map((i) => i.en).join(" · ");
              return (
                <div key={ch.chapter} className="flex items-center gap-1">
                  <button
                    onClick={() => handleChapterChange(ch.chapter)}
                    title={preview}
                    className={cn(
                      "transition-all rounded-full text-[11px] font-medium active:scale-95 flex items-center gap-1.5",
                      isActive
                        ? "bg-[var(--color-action-blue)] text-white px-4 py-1.5"
                        : status === "done"
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 px-4 py-1.5"
                          : "bg-white/60 dark:bg-zinc-900/60 text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-3 py-1.5"
                    )}
                  >
                    {status === "done" && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                      </svg>
                    )}
                    {ch.title}
                  </button>
                  {status === "done" && !isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReviewChapter(ch.chapter); }}
                      className="text-[10px] px-2 py-1 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-[var(--color-action-blue)] hover:bg-[var(--color-action-blue)]/5 transition-all active:scale-95"
                      title="复习本章"
                    >
                      复习
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Chapter Complete overlay — simplified primary + foldable extras */}
        {isChapterComplete && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl px-10 py-10 text-center max-w-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] animate-in zoom-in duration-500 delay-200">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                章节完成
              </h2>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-7">
                {chapters.find((c) => c.chapter === state.chapter)?.title}
              </p>

              {/* PRIMARY ACTION only */}
              {(() => {
                const isLastChapter = chapters.findIndex((c) => c.chapter === state.chapter) >= chapters.length - 1;
                const nextPack = isLastChapter ? lp.nextPack : null;

                if (!isLastChapter) {
                  return (
                    <button
                      onClick={() => handleChapterChange(state.chapter + 1)}
                      className="w-full py-3 bg-[var(--color-action-blue)] text-white text-sm font-semibold rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      继续下一章
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </button>
                  );
                }

                if (nextPack) {
                  return (
                    <button
                      onClick={() => handleCategoryChange(nextPack.packId)}
                      className="w-full py-3 bg-[var(--color-action-blue)] text-white text-sm font-semibold rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      开始学习 {nextPack.name}
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </button>
                  );
                }

                // All packs complete
                return (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-lg leading-none animate-in zoom-in duration-500 delay-300">🎉</span>
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">已学完所有词包！</p>
                  </div>
                );
              })()}

              {/* Foldable more actions */}
              <div className="mt-6 pt-4 border-t border-zinc-200/30 dark:border-zinc-800/30">
                {/* Review skipped words — show before other actions */}
                {state.skippedIndices.length > 0 && (
                  <button
                    onClick={handleReviewSkipped}
                    className="w-full mb-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                    </svg>
                    复习跳过的词 ({state.skippedIndices.length})
                  </button>
                )}
                <MoreActionsButton
                  hasErrors={state.wrongIndices.length > 0}
                  errorCount={state.wrongIndices.length}
                  onReviewWrong={handleReviewWrongWords}
                  onReviewAll={handleReviewAll}
                  onReset={handleReset}
                  onShare={handleShare}
                />
              </div>
            </div>
          </div>
        )}

        {/* SRS Review Complete summary */}
        {srsSessionComplete && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl px-10 py-10 text-center max-w-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 animate-in zoom-in duration-500 delay-200">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
                复习完成
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                本次复习 <span className="font-semibold text-emerald-500">{srsSessionCorrect}</span> / <span className="font-semibold">{srsSessionTotal}</span> 个词已掌握 ✓
              </p>
              {srsSessionTotal > 0 && (
                <div className="mb-6">
                  <div className="text-3xl font-bold text-emerald-500 dark:text-emerald-400 tabular-nums">
                    {Math.round((srsSessionCorrect / srsSessionTotal) * 100)}%
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest mt-0.5">正确率</p>
                </div>
              )}
              <button
                onClick={() => setSrsSessionComplete(false)}
                className="w-full py-3 bg-[var(--color-action-blue)] text-white text-sm font-semibold rounded-full hover:brightness-110 transition-all active:scale-95"
              >
                继续学习
              </button>
            </div>
          </div>
        )}

        {/* Stats bar (bottom frosted) */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10 transition-all duration-500",
          isChapterComplete ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"
        )}>
          <div className="flex items-center justify-center gap-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-t border-zinc-200/40 dark:border-zinc-800/40 px-4 py-3">
            <StatItem value={formatTime(elapsedSeconds)} label="耗时" />
            <StatItem value={`${completedCount}/${totalCount}`} label="本章进度" />
            <StatItem value={String(wordbook.count)} label="已收藏" />
            <StatItem value={`${dailyGoal.goal.todayNewCount}/${dailyGoal.goal.newWordsPerDay}`} label="今日新词" />
            {streak.currentStreak > 0 && (
              <div className="flex flex-col items-center gap-0">
                <span className="text-base font-semibold tracking-tight text-amber-500 tabular-nums">
                  🔥 {streak.currentStreak}
                </span>
                <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">连续</span>
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts hint (bottom-right) */}
        <div className={cn(
          "absolute bottom-14 right-5 z-10 transition-all duration-300",
          isChapterComplete ? "opacity-0" : "opacity-100"
        )}>
          <div className="flex items-center gap-2 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-zinc-200/30 dark:border-zinc-800/30">
            <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">快捷键</span>
            <ShortcutHint keys={["Esc"]} label="重置本章" />
            <span className="text-zinc-200 dark:text-zinc-700 text-[9px]">|</span>
            <ShortcutHint keys={["Space"]} label="加速" />
            <span className="text-zinc-200 dark:text-zinc-700 text-[9px]">|</span>
            <ShortcutHint keys={["Ctrl", "Shift", "P"]} label="发音" />
            <span className="text-zinc-200 dark:text-zinc-700 text-[9px]">|</span>
            <ShortcutHint keys={["Ctrl", "Shift", "K"]} label="跳过" />
            <span className="text-zinc-200 dark:text-zinc-700 text-[9px]">|</span>
            <ShortcutHint keys={["Ctrl", "Shift", "V"]} label="提示" />
          </div>
        </div>
      </main>

      <DataManager open={showDataManager} onOpenChange={setShowDataManager} onPacksChanged={handlePacksChanged} />

      {showLearnedWords && (
        <LearnedWordsPanel
          items={chapterItems}
          completedIndices={state.completedIndices}
          onClose={() => setShowLearnedWords(false)}
        />
      )}

      {showWordbookPanel && (
        <WordbookPanel
          entries={wordbook.entries}
          onStartReview={startWordbookReview}
          onRemove={(en) => wordbook.removeEntry(en)}
          onClose={() => setShowWordbookPanel(false)}
        />
      )}

      {showErrorsPanel && (
        <ErrorsPanel
          errorItems={globalErrors.errorItems}
          onStartReview={startErrorsReview}
          onClear={(en, packId) => globalErrors.clearError(en, packId)}
          onClearAll={() => globalErrors.clearAll()}
          onClose={() => setShowErrorsPanel(false)}
        />
      )}

      {showStats && (
        <StatsPanel
          last7Days={getLast7Days()}
          totalCompleted={totalCompleted}
          onClose={() => setShowStats(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingOverlay onDone={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

// -- Apple-style components --

function AppleSidebar({ collapsed, currentMode, onModeChange, onToggleCollapse, onShowStats, streak, currentCategory, onCategoryChange, learningPath, srsDueCount, onSRSReview, dailyGoal, wordbookCount, onWordbookReview, globalErrorCount, onGlobalErrorReview }: {
  collapsed: boolean; currentMode: LearningMode; onModeChange: (m: LearningMode) => void; onToggleCollapse: () => void; onShowStats: () => void; streak: { currentStreak: number; longestStreak: number }; currentCategory: string; onCategoryChange: (catId: string) => void; learningPath: LearningPathResult; srsDueCount: number; onSRSReview: () => void; dailyGoal: ReturnType<typeof useDailyGoal>; wordbookCount: number; onWordbookReview: () => void; globalErrorCount: number; onGlobalErrorReview: () => void;
}) {
  const { isDark, toggle: toggleTheme } = useTheme();
  const ModeIcon = modeIcons[currentMode];
  const [showGoalSettings, setShowGoalSettings] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-full bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-r border-zinc-200/30 dark:border-zinc-800/30 transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] z-20 absolute lg:relative shadow-[1px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[1px_0_8px_rgba(0,0,0,0.2)]",
      collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[72px]" : "translate-x-0 w-[220px]"
    )}>
      {/* Logo area */}
      <div className="flex items-center h-12 px-4 border-b border-zinc-200/30 dark:border-zinc-800/30 shrink-0">
        {!collapsed && <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">背单词</span>}
      </div>

      {/* Mode switches */}
      <div className="shrink-0 px-2.5 pt-4 animate-stagger-in" style={{ animationDelay: '0ms' }}>
        {(["word", "sentence"] as LearningMode[]).map((mode) => {
          const Icon = modeIcons[mode];
          const active = mode === currentMode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={cn(
                "flex items-center w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.97]",
                active
                  ? "bg-[var(--color-action-blue)]/10 text-[var(--color-action-blue)] font-semibold shadow-[inset_0_0_0_1px_rgba(0,102,204,0.12)] dark:shadow-[inset_0_0_0_1px_rgba(41,151,255,0.15)]"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5",
                collapsed ? "justify-center" : "justify-start gap-2.5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{mode === "word" ? "单词练习" : "句子练习"}</span>}
            </button>
          );
        })}
      </div>

      {/* SRS Review badge */}
      {!collapsed && srsDueCount > 0 && (
        <div className="shrink-0 px-2.5 pt-3">
          <button
            onClick={onSRSReview}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200 active:scale-[0.97] animate-pulse-subtle"
          >
            <span>📝 待复习</span>
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {srsDueCount > 99 ? "99+" : srsDueCount}
            </span>
          </button>
        </div>
      )}

      {/* Daily Goal progress */}
      {!collapsed && (
        <div className="shrink-0 px-2.5 pt-3 animate-stagger-in" style={{ animationDelay: '0ms' }}>
          <div className="px-2 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">今日目标</span>
              <div className="flex items-center gap-1">
                <span className={cn("text-[10px] font-medium", dailyGoal.isAllDone ? "text-green-500" : "text-zinc-400")}>
                  {dailyGoal.isAllDone ? "已完成 ✓" : `${dailyGoal.goal.todayNewCount}/${dailyGoal.goal.newWordsPerDay + dailyGoal.goal.reviewPerDay}`}
                </span>
                <button
                  onClick={() => setShowGoalSettings(!showGoalSettings)}
                  className="p-0.5 rounded text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-all"
                >
                  <Settings className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
            {/* New words progress */}
            <div className="mb-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>新词</span>
                <span>{dailyGoal.goal.todayNewCount}/{dailyGoal.goal.newWordsPerDay}</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-action-blue)] transition-all duration-500"
                  style={{ width: `${dailyGoal.newPercent}%` }}
                />
              </div>
            </div>
            {/* Review progress */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                <span>复习</span>
                <span>{dailyGoal.goal.todayReviewCount}/{dailyGoal.goal.reviewPerDay}</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400 dark:bg-green-500 transition-all duration-500"
                  style={{ width: `${dailyGoal.reviewPercent}%` }}
                />
              </div>
            </div>
            {/* Goal settings */}
            {showGoalSettings && (
              <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                    <span>每日新词</span>
                    <span className="font-medium text-zinc-500">{dailyGoal.goal.newWordsPerDay}</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    value={dailyGoal.goal.newWordsPerDay}
                    onChange={(e) => dailyGoal.updateSettings(Number(e.target.value), dailyGoal.goal.reviewPerDay)}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-[var(--color-action-blue)]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                    <span>每日复习</span>
                    <span className="font-medium text-zinc-500">{dailyGoal.goal.reviewPerDay}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={dailyGoal.goal.reviewPerDay}
                    onChange={(e) => dailyGoal.updateSettings(dailyGoal.goal.newWordsPerDay, Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-green-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning path */}
      {!collapsed && currentMode === "word" && (
        <div className="flex-1 overflow-y-auto px-2.5 pt-4 min-h-0">
          <h4 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 px-1">
            学习路径
          </h4>
          <div className="space-y-0.5">
            {learningPath.path.map((entry, i) => (
              <button
                key={entry.packId}
                onClick={() => onCategoryChange(entry.packId)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200 text-left animate-stagger-in",
                  entry.packId === currentCategory
                    ? "bg-[var(--color-action-blue)]/10 text-[var(--color-action-blue)] font-medium"
                    : entry.allDone
                      ? "text-zinc-400 dark:text-zinc-500"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  entry.allDone
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : entry.packId === currentCategory
                      ? "bg-[var(--color-action-blue)] text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                )}>
                  {entry.allDone ? "✓" : entry.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate">{entry.name}</div>
                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    {entry.completed}/{entry.total}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed mode: compact icons */}
      {collapsed && currentMode === "word" && (
        <div className="flex-1 flex flex-col items-center gap-1 px-1 pt-4 overflow-y-auto min-h-0">
          {learningPath.path.map((entry, i) => (
            <button
              key={entry.packId}
              onClick={() => onCategoryChange(entry.packId)}
              style={{ animationDelay: `${i * 30}ms` }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0 animate-stagger-in",
                entry.allDone
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : entry.packId === currentCategory
                    ? "bg-[var(--color-action-blue)] text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-600 hover:scale-110 active:scale-95"
              )}
              title={`${entry.name} (${entry.completed}/${entry.total})`}
            >
              {entry.allDone ? "✓" : entry.order}
            </button>
          ))}
        </div>
      )}

      {/* Wordbook */}
      {!collapsed && (
        <div className="shrink-0 px-2.5 pt-2 animate-stagger-in" style={{ animationDelay: '30ms' }}>
          <button
            onClick={onWordbookReview}
            disabled={wordbookCount === 0}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.97] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <BookA className="w-3.5 h-3.5" />
              <span>生词本</span>
            </span>
            {wordbookCount > 0 && (
              <span className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {wordbookCount > 99 ? "99+" : wordbookCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Global Errors */}
      {!collapsed && (
        <div className="shrink-0 px-2.5 pt-1 animate-stagger-in" style={{ animationDelay: '60ms' }}>
          <button
            onClick={onGlobalErrorReview}
            disabled={globalErrorCount === 0}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.97] text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>常错词</span>
            </span>
            {globalErrorCount > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {globalErrorCount > 99 ? "99+" : globalErrorCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Streak */}
      {!collapsed && streak.currentStreak > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-zinc-200/30 dark:border-zinc-800/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-500">🔥</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              连续 <strong className="text-zinc-800 dark:text-zinc-200">{streak.currentStreak}</strong> 天
            </span>
          </div>
        </div>
      )}

      {/* Collapsed streak */}
      {collapsed && streak.currentStreak > 0 && (
        <div className="shrink-0 flex justify-center py-2 border-t border-zinc-200/30 dark:border-zinc-800/30">
          <span className="text-amber-500 text-sm" title={`连续学习 ${streak.currentStreak} 天`}>🔥</span>
        </div>
      )}

      {/* Bottom controls */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-zinc-200/30 dark:border-zinc-800/30 flex flex-col gap-1 animate-stagger-in" style={{ animationDelay: '90ms' }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center py-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all duration-200 active:scale-95 gap-2"
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {!collapsed && <span className="text-xs">{isDark ? "浅色模式" : "深色模式"}</span>}
        </button>
        <button onClick={onShowStats} className="w-full flex items-center justify-center py-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all duration-200 active:scale-95 gap-2">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {!collapsed && <span className="text-xs">学习统计</span>}
        </button>
        <button onClick={onToggleCollapse} className="w-full flex items-center justify-center py-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all duration-200 active:scale-95">
          <ListCollapse className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function AppleActionButton({ children, onClick, variant = "secondary", disabled }: {
  children: React.ReactNode; onClick: () => void; variant?: "primary" | "secondary"; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-[var(--color-action-blue)] text-white hover:brightness-110"
          : "bg-white/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
      )}
    >
      {children}
    </button>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <span className="text-base font-semibold tracking-tight text-zinc-800 dark:text-zinc-200 tabular-nums">{value}</span>
      <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-0.5 text-[9px] text-zinc-400 dark:text-zinc-500 font-medium">
      {keys.map((k, i) => (
        <kbd key={i} className="px-1 py-[1px] text-[8px] leading-none rounded-[3px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">{k}</kbd>
      ))}
      <span className="ml-0.5">{label}</span>
    </span>
  );
}

// -- More Actions (foldable) --
function MoreActionsButton({ hasErrors, errorCount, onReviewWrong, onReviewAll, onReset, onShare }: {
  hasErrors: boolean; errorCount: number; onReviewWrong: () => void; onReviewAll: () => void; onReset: () => void; onShare: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        <svg className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
        更多操作
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-1.5 w-full animate-in fade-in slide-in-from-top-2 duration-200">
          {hasErrors ? (
            <button onClick={onReviewWrong} className="w-full px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              复习错词 ({errorCount})
            </button>
          ) : (
            <div className="w-full px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[11px] font-semibold rounded-full flex items-center justify-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              本次无错词，完美通过！
            </div>
          )}
          <button onClick={onReviewAll} className="w-full px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold rounded-full hover:brightness-110 transition-all active:scale-95">
            复习全章（打乱顺序）
          </button>
          <div className="flex items-center justify-center gap-4 pt-1">
            <button onClick={onReset} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">重新练习</button>
            <span className="text-zinc-200 dark:text-zinc-700 text-[11px]">·</span>
            <button onClick={onShare} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              分享
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Stats Panel --

function StatsPanel({ last7Days, totalCompleted, onClose }: { last7Days: DayStats[]; totalCompleted: number; onClose: () => void }) {
  const maxCompleted = Math.max(...last7Days.map((d) => d.completed), 1);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl px-8 py-8 text-center max-w-sm w-full mx-4 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
          学习统计
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
          累计完成 {totalCompleted} 项练习
        </p>

        {/* 7-day bar chart */}
        {last7Days.every((d) => d.completed === 0) ? (
          <div className="flex items-center justify-center h-32 mb-2 text-zinc-300 dark:text-zinc-600">
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span className="text-[11px] font-medium">尚无数据</span>
            </div>
          </div>
        ) : (
        <div className="flex items-end justify-between gap-2 h-32 mb-2 px-1">
          {last7Days.map((day) => {
            const pct = maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0;
            const label = day.date.slice(5); // "MM-DD"
            return (
              <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">{day.completed}</span>
                <div className="w-full rounded-full bg-zinc-100 dark:bg-zinc-800 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-[var(--color-action-blue)] transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 tabular-nums">{label}</span>
              </div>
            );
          })}
        </div>
        )}

        {/* Word-level summary */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40">
          <div className="text-center">
            <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {last7Days.reduce((s, d) => s + d.completed, 0)}
            </span>
            <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">本周完成</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {last7Days.reduce((s, d) => s + d.errorWords, 0)}
            </span>
            <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">出过错</p>
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {(() => {
                const total = last7Days.reduce((s, d) => s + d.completed, 0);
                const errors = last7Days.reduce((s, d) => s + d.errorWords, 0);
                return total > 0 ? `${Math.round(((total - errors) / total) * 100)}%` : "—";
              })()}
            </span>
            <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">通过率</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

// -- Learned Words Panel --

function LearnedWordsPanel({ items, completedIndices, onClose }: {
  items: (WordItem | SentenceItem)[]; completedIndices: number[]; onClose: () => void;
}) {
  const learnedItems = completedIndices
    .map((i) => ({ index: i, item: items[i] }))
    .filter((e) => e.item);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl px-6 py-6 max-w-md w-full mx-4 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            已学单词
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {learnedItems.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">还没有已学的单词</p>
        ) : (
          <div className="overflow-y-auto space-y-1 flex-1 min-h-0">
            {learnedItems.map(({ index, item }) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
              >
                <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.en}
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    {"zh" in item ? item.zh : ""}
                    {"ipa" in item && item.ipa ? ` /${item.ipa}/` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95 shrink-0"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

// -- Wordbook Panel --

function WordbookPanel({ entries, onStartReview, onRemove, onClose }: {
  entries: WordBookEntry[]; onStartReview: (items?: (WordItem | SentenceItem)[]) => void; onRemove: (en: string) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (en: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(en)) next.delete(en); else next.add(en);
      return next;
    });
  };

  const handleReviewSelected = () => {
    const items = entries
      .filter((e) => selected.has(e.en))
      .map((e) => ({ en: e.en, zh: e.zh, ipa: e.ipa ?? "", ib: [] as number[] }));
    if (items.length === 0) onStartReview();
    else onStartReview(items);
    onClose();
  };

  const handleReviewAll = () => { onStartReview(); onClose(); };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl px-6 py-6 max-w-md w-full mx-4 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            生词本
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3">{entries.length} 个词 · 点击可选择指定词复习</p>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">生词本为空，点击收藏按钮添加单词</p>
        ) : (
          <div className="overflow-y-auto space-y-1 flex-1 min-h-0">
            {entries.map((entry) => (
              <div
                key={entry.en}
                onClick={() => toggleSelected(entry.en)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer",
                  selected.has(entry.en)
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/30"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                  selected.has(entry.en)
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "border-zinc-300 dark:border-zinc-600"
                )}>
                  {selected.has(entry.en) && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{entry.en}</div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                    {entry.zh}{entry.ipa ? ` /${entry.ipa}/` : ""}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(entry.en); }}
                  className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                  title="移除"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 shrink-0 flex items-center gap-2">
          <button
            onClick={handleReviewAll}
            disabled={entries.length === 0}
            className="flex-1 py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            复习全部
          </button>
          {selected.size > 0 && (
            <button
              onClick={handleReviewSelected}
              className="flex-1 py-2 bg-amber-500 text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
            >
              复习已选 ({selected.size})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Global Errors Panel --

function ErrorsPanel({ errorItems, onStartReview, onClear, onClearAll, onClose }: {
  errorItems: GlobalErrorEntry[]; onStartReview: (items?: (WordItem | SentenceItem)[]) => void; onClear: (en: string, packId: string) => void; onClearAll: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl px-6 py-6 max-w-md w-full mx-4 shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-base font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            常错词
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3">按出错次数排序 · 可逐条清除</p>

        {errorItems.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-8">暂无出错记录</p>
        ) : (
          <div className="overflow-y-auto space-y-1 flex-1 min-h-0">
            {errorItems.map((entry, i) => {
              const id = `${entry.packId}::${entry.en}`;
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                >
                  <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    {entry.errorCount}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-2">
                      {entry.en}
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal">#{i + 1}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                      {entry.zh}{entry.ipa ? ` /${entry.ipa}/` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => onClear(entry.en, entry.packId)}
                    className="p-1 rounded text-zinc-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all shrink-0"
                    title="清除此条"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 shrink-0 flex items-center gap-2">
          <button
            onClick={() => { onStartReview(); onClose(); }}
            disabled={errorItems.length === 0}
            className="flex-1 py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            复习全部
          </button>
          {errorItems.length > 0 && (
            <button
              onClick={() => { onClearAll(); }}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
            >
              清空全部
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

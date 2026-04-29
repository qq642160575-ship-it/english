"use client";

import { useState, useCallback, useEffect } from "react";
import type { DailyGoalData } from "@/data/types";
import { getTodayStr } from "@/data/types";

const DAILY_GOAL_KEY = "keykey_daily_goal";
const DEFAULT_GOAL: DailyGoalData = {
  newWordsPerDay: 10,
  reviewPerDay: 5,
  todayNewCount: 0,
  todayReviewCount: 0,
  date: getTodayStr(),
};

function loadGoal(): DailyGoalData {
  if (typeof window === "undefined") return { ...DEFAULT_GOAL, date: getTodayStr() };
  try {
    const raw = localStorage.getItem(DAILY_GOAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyGoalData;
      if (parsed.date !== getTodayStr()) {
        const reset: DailyGoalData = {
          newWordsPerDay: parsed.newWordsPerDay,
          reviewPerDay: parsed.reviewPerDay,
          todayNewCount: 0,
          todayReviewCount: 0,
          date: getTodayStr(),
        };
        localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(reset));
        return reset;
      }
      return parsed;
    }
  } catch {}
  return { ...DEFAULT_GOAL, date: getTodayStr() };
}

function saveGoal(goal: DailyGoalData): void {
  try {
    localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(goal));
  } catch {}
}

export function useDailyGoal() {
  const [goal, setGoal] = useState<DailyGoalData>({ ...DEFAULT_GOAL, date: getTodayStr() });

  useEffect(() => {
    setGoal(loadGoal());
  }, []);

  const incrementNew = useCallback(() => {
    setGoal((prev) => {
      const next = { ...prev, todayNewCount: prev.todayNewCount + 1 };
      saveGoal(next);
      return next;
    });
  }, []);

  const incrementReview = useCallback(() => {
    setGoal((prev) => {
      const next = { ...prev, todayReviewCount: prev.todayReviewCount + 1 };
      saveGoal(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((newWordsPerDay: number, reviewPerDay: number) => {
    setGoal((prev) => {
      const next = { ...prev, newWordsPerDay, reviewPerDay };
      saveGoal(next);
      return next;
    });
  }, []);

  const isNewDone = goal.newWordsPerDay <= 0 || goal.todayNewCount >= goal.newWordsPerDay;
  const isReviewDone = goal.reviewPerDay <= 0 || goal.todayReviewCount >= goal.reviewPerDay;
  const isAllDone = isNewDone && isReviewDone;
  const newPercent = goal.newWordsPerDay > 0 ? Math.min((goal.todayNewCount / goal.newWordsPerDay) * 100, 100) : 0;
  const reviewPercent = goal.reviewPerDay > 0 ? Math.min((goal.todayReviewCount / goal.reviewPerDay) * 100, 100) : 0;

  return {
    goal,
    incrementNew,
    incrementReview,
    updateSettings,
    isNewDone,
    isReviewDone,
    isAllDone,
    newPercent,
    reviewPercent,
  };
}

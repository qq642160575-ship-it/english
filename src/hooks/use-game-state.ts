"use client";

import { useReducer, useCallback } from "react";
import { GameState, LearningMode } from "@/data/types";

type GameAction =
  | { type: "CHAR_INPUT"; char: string }
  | { type: "BACKSPACE" }
  | { type: "LOAD_ITEM"; index: number; target: string }
  | { type: "COMPLETE_ITEM" }
  | { type: "SET_MODE"; mode: LearningMode; index: number; target: string }
  | { type: "RESTORE_INDICES"; index: number; completedIndices: number[] }
  | { type: "SET_CATEGORY"; category: string }
  | { type: "SET_CHAPTER"; chapter: number }
  | { type: "RESET" }
  | { type: "CLEAR_WRONG" }
  | { type: "REVEAL_LETTER"; pos: number }
  | { type: "ADD_SKIPPED"; index: number }
  | { type: "CLEAR_SKIPPED" }
  | { type: "REMOVE_SKIPPED"; index: number };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CHAR_INPUT": {
      if (state.isComplete) return state;
      const pos = state.input.length;
      if (pos >= state.target.length) return state;
      const ch = action.char;
      const targetChar = state.target[pos].toLowerCase();
      const correct = ch === targetChar;

      if (correct) {
        return {
          ...state,
          input: [...state.input, { char: ch, correct: true }],
          stats: {
            letters: state.stats.letters + 1,
            correct: state.stats.correct + 1,
            errors: state.stats.errors,
          },
        };
      }

      // Wrong character — don't reset, just mark wrong and let user continue
      return {
        ...state,
        input: [...state.input, { char: ch, correct: false }],
        wordErrorCount: state.wordErrorCount + 1,
        wrongIndices: state.wrongIndices.includes(state.index)
          ? state.wrongIndices
          : [...state.wrongIndices, state.index],
        stats: {
          letters: state.stats.letters + 1,
          correct: state.stats.correct,
          errors: state.stats.errors + 1,
        },
      };
    }
    case "BACKSPACE": {
      if (state.isComplete || state.input.length === 0) return state;
      const removed = state.input[state.input.length - 1];
      return {
        ...state,
        input: state.input.slice(0, -1),
        stats: {
          letters: state.stats.letters - 1,
          correct: state.stats.correct - (removed.correct ? 1 : 0),
          errors: state.stats.errors - (removed.correct ? 0 : 1),
        },
      };
    }
    case "LOAD_ITEM":
      return {
        ...state,
        index: action.index,
        target: action.target,
        input: [],
        isComplete: false,
        revealedCount: 0,
        revealedLetters: [],
        wordErrorCount: 0,
      };
    case "REVEAL_LETTER": {
      if (state.revealedCount >= 2) return state;
      const newRevealed = [...state.revealedLetters];
      newRevealed[action.pos] = true;
      return {
        ...state,
        revealedLetters: newRevealed,
        revealedCount: state.revealedCount + 1,
      };
    }
    case "COMPLETE_ITEM": {
      const newCompleted = Array.from(new Set([...state.completedIndices, state.index]));
      return { ...state, isComplete: true, completedIndices: newCompleted };
    }
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        index: action.index,
        target: action.target,
        input: [],
        isComplete: false,
        stats: { letters: 0, correct: 0, errors: 0 },
        completedIndices: [],
        chapter: 1,
        wordErrorCount: 0,
      };
    case "RESTORE_INDICES":
      return {
        ...state,
        index: action.index,
        completedIndices: action.completedIndices,
        skippedIndices: state.skippedIndices,
      };
    case "SET_CATEGORY":
      return { ...state, category: action.category, chapter: 1, index: 0, input: [], isComplete: false, completedIndices: [], stats: { letters: 0, correct: 0, errors: 0 }, wordErrorCount: 0 };
    case "SET_CHAPTER":
      return { ...state, chapter: action.chapter, index: 0, input: [], isComplete: false, completedIndices: [], stats: { letters: 0, correct: 0, errors: 0 }, wordErrorCount: 0 };
    case "ADD_SKIPPED": {
      const newSkipped = state.skippedIndices.includes(action.index)
        ? state.skippedIndices
        : [...state.skippedIndices, action.index];
      return { ...state, skippedIndices: newSkipped };
    }
    case "CLEAR_SKIPPED":
      return { ...state, skippedIndices: [] };
    case "REMOVE_SKIPPED": {
      const filteredSkipped = state.skippedIndices.filter((i) => i !== action.index);
      return { ...state, skippedIndices: filteredSkipped };
    }
    case "CLEAR_WRONG":
      return { ...state, wrongIndices: [] };
    case "RESET":
      return {
        ...state,
        index: 0,
        input: [],
        isComplete: false,
        stats: { letters: 0, correct: 0, errors: 0 },
        completedIndices: [],
        skippedIndices: [],
        wrongIndices: [],
        wordErrorCount: 0,
      };
    default:
      return state;
  }
}

const initialState: GameState = {
  mode: "word",
  index: 0,
  chapter: 1,
  input: [],
  target: "",
  isComplete: false,
  stats: { letters: 0, correct: 0, errors: 0 },
  completedIndices: [],
  skippedIndices: [],
  category: "basic-words",
  wrongIndices: [],
  revealedCount: 0,
  revealedLetters: [],
  wordErrorCount: 0,
};

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const handleCharInput = useCallback((char: string) => {
    dispatch({ type: "CHAR_INPUT", char });
  }, []);

  const handleBackspace = useCallback(() => {
    dispatch({ type: "BACKSPACE" });
  }, []);

  const loadItem = useCallback((index: number, target: string) => {
    dispatch({ type: "LOAD_ITEM", index, target });
  }, []);

  const completeItem = useCallback(() => {
    dispatch({ type: "COMPLETE_ITEM" });
  }, []);

  const skipItem = useCallback((skippedIndex: number, nextIndex: number, nextTarget: string) => {
    dispatch({ type: "ADD_SKIPPED", index: skippedIndex });
    dispatch({ type: "LOAD_ITEM", index: nextIndex, target: nextTarget });
  }, []);

  const addSkipped = useCallback((index: number) => {
    dispatch({ type: "ADD_SKIPPED", index });
  }, []);

  const clearSkipped = useCallback(() => {
    dispatch({ type: "CLEAR_SKIPPED" });
  }, []);

  const removeSkipped = useCallback((index: number) => {
    dispatch({ type: "REMOVE_SKIPPED", index });
  }, []);

  const switchMode = useCallback(
    (mode: LearningMode, index: number, target: string) => {
      dispatch({ type: "SET_MODE", mode, index, target });
    },
    []
  );

  const restoreIndices = useCallback(
    (index: number, completedIndices: number[]) => {
      dispatch({ type: "RESTORE_INDICES", index, completedIndices });
    },
    []
  );

  const setCategory = useCallback((category: string) => {
    dispatch({ type: "SET_CATEGORY", category });
  }, []);

  const setChapter = useCallback((chapter: number) => {
    dispatch({ type: "SET_CHAPTER", chapter });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const clearWrong = useCallback(() => {
    dispatch({ type: "CLEAR_WRONG" });
  }, []);

  const revealLetter = useCallback((pos: number) => {
    dispatch({ type: "REVEAL_LETTER", pos });
  }, []);

  return {
    state,
    handleCharInput,
    handleBackspace,
    loadItem,
    completeItem,
    skipItem,
    addSkipped,
    clearSkipped,
    removeSkipped,
    switchMode,
    restoreIndices,
    setCategory,
    setChapter,
    reset,
    clearWrong,
    revealLetter,
  };
}

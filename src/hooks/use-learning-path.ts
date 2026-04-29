"use client";

import { useMemo } from "react";
import { LEARNING_PATH } from "@/lib/constants";
import { dataRegistry } from "@/data/registry";
import { StoredProgress } from "@/data/types";

export interface LearningPathEntry {
  packId: string;
  order: number;
  name: string;
  description: string;
  total: number;
  completed: number;
  allDone: boolean;
  percent: number;
}

export interface LearningPathResult {
  path: LearningPathEntry[];
  nextPack: LearningPathEntry | undefined;
  allPacksDone: boolean;
  totalProgress: { completed: number; total: number };
}

export function useLearningPath(progress: StoredProgress | null): LearningPathResult {
  return useMemo(() => {
    const path = LEARNING_PATH.map((entry) => {
      const packProgress = progress?.word?.[entry.packId];
      let completed = 0;
      let total = 0;

      // Sum up all chapters
      if (packProgress) {
        for (const chKey of Object.keys(packProgress)) {
          const ch = packProgress[chKey];
          if (ch?.completed) {
            completed += ch.completed.length;
          }
        }
      }

      // Get total items for the pack
      const pack = dataRegistry.getPack(entry.packId);
      if (pack) {
        total = pack.items.length;
      }

      const allDone = total > 0 && completed >= total;

      return {
        ...entry,
        total,
        completed,
        allDone,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const next = path.find((p) => !p.allDone);

    return {
      path,
      nextPack: next,
      allPacksDone: !next,
      totalProgress: {
        completed: path.reduce((sum, p) => sum + p.completed, 0),
        total: path.reduce((sum, p) => sum + p.total, 0),
      },
    };
  }, [progress]);
}

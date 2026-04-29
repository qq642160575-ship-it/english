"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, EyeOff, Eye, CheckCircle2, Type, Keyboard, Settings, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChapterMeta } from "@/data/types";

interface FloatingHeaderProps {
  categories: { id: string; title: string }[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  onOpenSettings: () => void;
  onStart?: () => void;
  // Functional toggles
  soundEnabled: boolean;
  onSoundToggle: () => void;
  showKeyboard: boolean;
  onKeyboardToggle: () => void;
  showHint: boolean;
  onHintToggle: () => void;
  // Chapter support
  chapters: ChapterMeta[];
  currentChapter: number;
  onChapterChange: (chapter: number) => void;
}

export function FloatingHeader({
  categories,
  selectedCategory,
  onCategoryChange,
  onOpenSettings,
  onStart,
  soundEnabled,
  onSoundToggle,
  showKeyboard,
  onKeyboardToggle,
  showHint,
  onHintToggle,
  chapters,
  currentChapter,
  onChapterChange,
}: FloatingHeaderProps) {
  return (
    <div className="flex items-center gap-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-full p-2 pr-3">
      {/* Category selector */}
      <Select value={selectedCategory} onValueChange={(v) => v && onCategoryChange(v)}>
        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-xs font-semibold focus:ring-0 w-auto px-4 shadow-none">
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

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

      {/* Chapter Selector */}
      {chapters.length > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const idx = chapters.findIndex((c) => c.chapter === currentChapter);
              if (idx > 0) onChapterChange(chapters[idx - 1].chapter);
            }}
            disabled={chapters.findIndex((c) => c.chapter === currentChapter) <= 0}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <Select
            value={String(currentChapter)}
            onValueChange={(v) => onChapterChange(Number(v))}
          >
            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-xs font-medium focus:ring-0 shadow-none w-auto px-3">
              <SelectValue placeholder="章节" />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((ch) => {
                const completedCount = 0; // Will be shown by parent
                return (
                  <SelectItem key={ch.chapter} value={String(ch.chapter)} className="text-xs">
                    {ch.title} ({ch.count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <button
            onClick={() => {
              const idx = chapters.findIndex((c) => c.chapter === currentChapter);
              if (idx < chapters.length - 1) onChapterChange(chapters[idx + 1].chapter);
            }}
            disabled={chapters.findIndex((c) => c.chapter === currentChapter) >= chapters.length - 1}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* IPA / Pinyin toggle (mock — just visually indicates state) */}
      <span
        onClick={onHintToggle}
        className={cn(
          "text-xs font-medium ml-1 mr-2 cursor-pointer transition-colors",
          showHint
            ? "text-zinc-900 dark:text-zinc-100"
            : "text-zinc-400 dark:text-zinc-500"
        )}
      >
        音标
      </span>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

      {/* Icon Toggles */}
      <div className="flex items-center gap-1.5 px-1">
        {/* Sound toggle */}
        <button
          onClick={onSoundToggle}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            soundEnabled
              ? "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              : "text-zinc-300 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Hint toggle (show/hide translation/ipa) */}
        <button
          onClick={onHintToggle}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            showHint
              ? "text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              : "text-zinc-300 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          {showHint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Check completed toggle — visual indicator only for now */}
        <button className="p-1.5 text-zinc-900 dark:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <CheckCircle2 className="w-4 h-4" />
        </button>

        {/* Font/Type toggle — cycles display style (placeholder) */}
        <button className="p-1.5 text-zinc-600 dark:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Type className="w-4 h-4" />
        </button>

        {/* Keyboard toggle */}
        <button
          onClick={onKeyboardToggle}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            showKeyboard
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <Keyboard className="w-4 h-4 shrink-0" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-zinc-900 dark:text-zinc-100 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-1"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Start / Replay Button */}
      <button
        onClick={onStart}
        className="ml-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold px-5 py-2.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5"
      >
        <Play className="w-3 h-3" />
        朗读
      </button>
    </div>
  );
}

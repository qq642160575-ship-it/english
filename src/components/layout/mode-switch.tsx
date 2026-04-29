"use client";

import { cn } from "@/lib/utils";
import { LearningMode, DataCategoryMeta } from "@/data/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModeSwitchProps {
  currentMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  wordCategories: DataCategoryMeta[];
  sentenceCategories: DataCategoryMeta[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onOpenDataManager: () => void;
}

export function ModeSwitch({
  currentMode,
  onModeChange,
  wordCategories,
  sentenceCategories,
  selectedCategory,
  onCategoryChange,
  onOpenDataManager,
}: ModeSwitchProps) {
  const categories = currentMode === "word" ? wordCategories : sentenceCategories;

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex gap-1 bg-card border border-border rounded-[10px] p-1">
        <button
          className={cn(
            "flex-1 py-[10px] px-4 border-none rounded-[7px] text-sm font-semibold cursor-pointer transition-all duration-200",
            currentMode === "word"
              ? "bg-foreground text-background"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onModeChange("word")}
        >
          单词
        </button>
        <button
          className={cn(
            "flex-1 py-[10px] px-4 border-none rounded-[7px] text-sm font-semibold cursor-pointer transition-all duration-200",
            currentMode === "sentence"
              ? "bg-foreground text-background"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onModeChange("sentence")}
        >
          句子
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedCategory} onValueChange={(v) => v && onCategoryChange(v)}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder="选择词库" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  {cat.title}
                  {!cat.isBuiltin && (
                    <span className="text-[10px] px-1 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      自定义
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={onOpenDataManager}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
          title="管理词库"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

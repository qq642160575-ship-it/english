"use client";

import { ThemeToggle } from "./theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  isDark: boolean;
  mounted: boolean;
  onToggleTheme: () => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

export function Header({
  isDark,
  mounted,
  onToggleTheme,
  voices,
  selectedVoice,
  onVoiceChange,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-[-0.3px] text-foreground">
          Typing Learner
        </span>
        <span className="text-[10px] font-semibold tracking-[0.5px] px-2 py-[2px] rounded bg-card text-muted-foreground border border-border uppercase">
          Phonetic
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedVoice} onValueChange={(v) => v && onVoiceChange(v)}>
          <SelectTrigger className="h-9 text-xs w-auto max-w-[120px] max-md:max-w-[80px]">
            <SelectValue placeholder="语音" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">默认语音</SelectItem>
            {voices.map((v) => (
              <SelectItem key={v.name} value={v.name}>
                {v.lang.startsWith("en-US") ? "\U0001f1fa\U0001f1f8" : v.lang.startsWith("en-GB") ? "\U0001f1ec\U0001f1e7" : "\U0001f310"} {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} mounted={mounted} />
      </div>
    </div>
  );
}

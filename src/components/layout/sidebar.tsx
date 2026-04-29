"use client";

import React from "react";
import {
  BookA,
  MessageSquare,
  Sun,
  Moon,
  Keyboard,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { LearningMode } from "@/data/types";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  currentMode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
}

export function Sidebar({ collapsed, setCollapsed, currentMode, onModeChange }: SidebarProps) {
  const { isDark, toggle: toggleTheme, mounted } = useTheme();

  const navigation = [
    { name: "单词练习", icon: BookA, mode: "word" as LearningMode },
    { name: "句子练习", icon: MessageSquare, mode: "sentence" as LearningMode },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-r border-zinc-200/60 dark:border-zinc-800/50 transition-[width,transform] duration-300 z-20 absolute lg:relative shadow-lg shadow-zinc-200/20 dark:shadow-black/20",
        collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[80px]" : "translate-x-0 w-[240px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-5 font-semibold pt-5">
        {!collapsed && (
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-[5px] flex items-center justify-center rotate-2 group-hover:rotate-6 transition-all duration-300 shadow-sm">
              <Keyboard className="w-4 h-4 text-white dark:text-zinc-900" />
            </div>
            <span className="text-base tracking-tight text-zinc-800 dark:text-zinc-200">keykey.cc</span>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full mt-2 cursor-pointer group">
            <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-100 rounded-[5px] flex items-center justify-center -rotate-2 group-hover:rotate-0 transition-all duration-300 shadow-sm">
              <Keyboard className="w-5 h-5 text-white dark:text-zinc-900" />
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 flex flex-col justify-center px-3 gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.mode === currentMode;
          return (
            <button
              key={item.name}
              onClick={() => onModeChange(item.mode)}
              className={cn(
                "flex items-center w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-zinc-900/10 dark:bg-zinc-100/10 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5",
                collapsed ? "justify-center" : "justify-start gap-3"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0 transition-all duration-200",
                isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
              )} />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 flex items-center justify-center py-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all duration-200"
      >
        {collapsed ? (
          <PanelRightOpen className="w-4 h-4" />
        ) : (
          <PanelRightClose className="w-4 h-4" />
        )}
      </button>

      {/* Bottom Settings */}
      <div className="p-4 space-y-2 border-t border-zinc-200/50 dark:border-zinc-800/40">
        <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 px-1.5 py-1.5">
          {!collapsed && <span className="font-mono tracking-tight">v0.1.0</span>}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-200",
              collapsed ? "mx-auto" : ""
            )}
          >
            {mounted && isDark ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
            {!collapsed && <span>{mounted && isDark ? "深色模式" : "浅色模式"}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

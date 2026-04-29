"use client";

import { useState, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataCategoryMeta, DataPack } from "@/data/types";
import { dataRegistry } from "@/data/registry";
import { uploadPack, downloadPack, downloadProgress, uploadProgress } from "@/lib/data-io";

interface DataManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPacksChanged: () => void;
}

export function DataManager({ open, onOpenChange, onPacksChanged }: DataManagerProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressInputRef = useRef<HTMLInputElement>(null);

  const allPacks = [
    ...dataRegistry.getAvailablePacks("word"),
    ...dataRegistry.getAvailablePacks("sentence"),
  ];

  const showStatus = useCallback((msg: string, type: "success" | "error") => {
    setStatus(msg);
    setStatusType(type);
    setTimeout(() => setStatus(null), 3000);
  }, []);

  const handleImport = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await uploadPack(file);
      if (result.success && result.pack) {
        const importResult = dataRegistry.importPack(result.pack);
        if (importResult.success) {
          showStatus("词库导入成功！", "success");
          onPacksChanged();
        } else {
          showStatus(importResult.error ?? "导入失败", "error");
        }
      } else {
        showStatus(result.error ?? "导入失败", "error");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onPacksChanged, showStatus]
  );

  const handleExportProgress = useCallback(() => {
    downloadProgress();
    showStatus("进度已导出", "success");
  }, [showStatus]);

  const handleImportProgressClick = useCallback(() => {
    progressInputRef.current?.click();
  }, []);

  const handleProgressFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = await uploadProgress(file);
      if (result.success) {
        showStatus("进度已恢复", "success");
        // 通知页面刷新进度
        window.dispatchEvent(new CustomEvent("progress-restored"));
      } else {
        showStatus(result.error ?? "导入失败", "error");
      }
      if (progressInputRef.current) progressInputRef.current.value = "";
    },
    [showStatus]
  );

  const handleExport = useCallback((packId: string) => {
    const pack = dataRegistry.exportPack(packId);
    if (pack) {
      downloadPack(pack);
    }
  }, []);

  const handleDelete = useCallback(
    (packId: string) => {
      dataRegistry.removePack(packId);
      setStatus("词库已删除");
      setStatusType("success");
      onPacksChanged();
    },
    [onPacksChanged]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>管理词库</SheetTitle>
          <SheetDescription>导入、导出和管理你的学习词库</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <Button variant="outline" onClick={handleImport} className="w-full">
            导入 JSON 词库
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Hidden file input for progress import */}
          <input
            ref={progressInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleProgressFileChange}
          />

          {status && (
            <div
              className={`text-xs p-2 rounded ${
                statusType === "success"
                  ? "bg-[var(--correct-bg)] text-[var(--correct-text)]"
                  : "bg-[var(--error-bg)] text-[var(--error-text)]"
              }`}
            >
              {status}
            </div>
          )}

          <Separator className="my-2" />

          <div className="text-sm font-semibold text-foreground">已安装词库</div>

          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {allPacks.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">
                暂无词库
              </div>
            )}
            {allPacks.map((meta) => (
              <div
                key={`${meta.id}--${meta.type}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {meta.title}
                    </span>
                    {!meta.isBuiltin && (
                      <Badge variant="secondary" className="text-[10px] px-1">
                        自定义
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{meta.itemCount} 项</span>
                    <span>·</span>
                    <span>
                      {meta.type === "word" ? "单词" : "句子"}
                    </span>
                    <span>·</span>
                    <span>
                      Lv.{meta.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleExport(meta.id)}
                    title="导出"
                  >
                    ↓
                  </Button>
                  {!meta.isBuiltin && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleDelete(meta.id)}
                      title="删除"
                      className="text-[var(--error-text)]"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="text-sm font-semibold text-foreground">进度管理</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportProgress} className="flex-1">
              导出进度
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportProgressClick} className="flex-1">
              恢复进度
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

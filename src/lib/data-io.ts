import { DataPack } from "@/data/types";
import { DataPackSchema } from "@/data/schemas";
import { STORAGE_KEY } from "./constants";

function triggerDownload(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPack(pack: DataPack): void {
  triggerDownload(pack, `${pack.meta.id}.json`);
}

export async function uploadPack(
  file: File
): Promise<{ success: boolean; error?: string; pack?: DataPack }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const result = DataPackSchema.safeParse(parsed);
    if (!result.success) {
      return { success: false, error: result.error.issues.map(i=>i.message).join("; ") };
    }
    return { success: true, pack: result.data as unknown as DataPack };
  } catch (e) {
    return { success: false, error: "Invalid JSON file" };
  }
}

export function downloadProgress(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(JSON.parse(raw), `keykey-progress-${date}.json`);
  } catch {}
}

export async function uploadProgress(
  file: File
): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) {
      return { success: false, error: "无效的进度文件" };
    }
    // 验证基本结构
    for (const mode of ["word", "sentence"] as const) {
      if (parsed[mode] && typeof parsed[mode] === "object") {
        for (const key of Object.keys(parsed[mode])) {
          const chapters = parsed[mode][key];
          if (typeof chapters !== "object") {
            return { success: false, error: "进度数据格式错误" };
          }
          for (const chKey of Object.keys(chapters)) {
            const ch = chapters[chKey];
            if (!ch || typeof ch.index !== "number" || !Array.isArray(ch.completed)) {
              return { success: false, error: "进度数据格式错误" };
            }
          }
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return { success: true };
  } catch {
    return { success: false, error: "无效的 JSON 文件" };
  }
}

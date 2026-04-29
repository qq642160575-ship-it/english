import { DataPack, DataCategoryMeta, WordItem, SentenceItem, ChapterMeta } from "./types";
import { DataPackSchema, WordItemSchema, SentenceItemSchema, DataCategoryMetaSchema } from "./schemas";
import { z } from "zod";
import { USER_PACKS_KEY } from "@/lib/constants";

import basicWords from "./words/basic.json";
import basicWordsMeta from "./words/basic.meta.json";
import basicSentences from "./sentences/basic.json";
import basicSentencesMeta from "./sentences/basic.meta.json";
import colorsWords from "./words/colors.json";
import colorsWordsMeta from "./words/colors.meta.json";
import animalsWords from "./words/animals.json";
import animalsWordsMeta from "./words/animals.meta.json";
import dailyWords from "./words/daily.json";
import dailyWordsMeta from "./words/daily.meta.json";
import foodWords from "./words/food.json";
import foodWordsMeta from "./words/food.meta.json";
import bodyWords from "./words/body.json";
import bodyWordsMeta from "./words/body.meta.json";
import socialCoreWords from "./words/social-core.json";
import socialCoreMeta from "./words/social-core.meta.json";
import lifeBasicsWords from "./words/life-basics.json";
import lifeBasicsMeta from "./words/life-basics.meta.json";
import dailyNecessitiesWords from "./words/daily-necessities.json";
import dailyNecessitiesMeta from "./words/daily-necessities.meta.json";
import actionBeyondWords from "./words/action-beyond.json";
import actionBeyondMeta from "./words/action-beyond.meta.json";

const PACK_KEY_PREFIX = "etl_pack_";

function validateBuiltinPack(
  meta: unknown,
  items: unknown,
  schema: z.ZodTypeAny
): { meta: DataCategoryMeta; items: (WordItem | SentenceItem)[] } | null {
  const metaResult = DataCategoryMetaSchema.safeParse(meta);
  const itemsResult = z.array(schema).safeParse(items);
  if (!metaResult.success || !itemsResult.success) {
    console.warn("内置词库验证失败:", metaResult.error?.issues ?? itemsResult.error?.issues);
    return null;
  }
  return {
    meta: metaResult.data as DataCategoryMeta,
    items: itemsResult.data as (WordItem | SentenceItem)[],
  };
}

class DataRegistry {
  private builtinPacks: Map<string, DataPack> = new Map();
  private userPacks: Map<string, DataPack> = new Map();
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const words = validateBuiltinPack(basicWordsMeta, basicWords, WordItemSchema);
    if (words) {
      this.builtinPacks.set("basic-words", words as DataPack);
    }

    const sentences = validateBuiltinPack(basicSentencesMeta, basicSentences, SentenceItemSchema);
    if (sentences) {
      this.builtinPacks.set("basic-sentences", sentences as DataPack);
    }

    const colors = validateBuiltinPack(colorsWordsMeta, colorsWords, WordItemSchema);
    if (colors) {
      this.builtinPacks.set("colors", colors as DataPack);
    }

    const animals = validateBuiltinPack(animalsWordsMeta, animalsWords, WordItemSchema);
    if (animals) {
      this.builtinPacks.set("animals", animals as DataPack);
    }

    const daily = validateBuiltinPack(dailyWordsMeta, dailyWords, WordItemSchema);
    if (daily) {
      this.builtinPacks.set("daily", daily as DataPack);
    }

    const food = validateBuiltinPack(foodWordsMeta, foodWords, WordItemSchema);
    if (food) {
      this.builtinPacks.set("food", food as DataPack);
    }

    const body = validateBuiltinPack(bodyWordsMeta, bodyWords, WordItemSchema);
    if (body) {
      this.builtinPacks.set("body", body as DataPack);
    }

    const socialCore = validateBuiltinPack(socialCoreMeta, socialCoreWords, WordItemSchema);
    if (socialCore) {
      this.builtinPacks.set("social-core", socialCore as DataPack);
    }

    const lifeBasics = validateBuiltinPack(lifeBasicsMeta, lifeBasicsWords, WordItemSchema);
    if (lifeBasics) {
      this.builtinPacks.set("life-basics", lifeBasics as DataPack);
    }

    const dailyNecessities = validateBuiltinPack(dailyNecessitiesMeta, dailyNecessitiesWords, WordItemSchema);
    if (dailyNecessities) {
      this.builtinPacks.set("daily-necessities", dailyNecessities as DataPack);
    }

    const actionBeyond = validateBuiltinPack(actionBeyondMeta, actionBeyondWords, WordItemSchema);
    if (actionBeyond) {
      this.builtinPacks.set("action-beyond", actionBeyond as DataPack);
    }

    this.loadUserPacks();
  }

  getAvailablePacks(type: "word" | "sentence"): DataCategoryMeta[] {
    const all = [...this.builtinPacks.values(), ...this.userPacks.values()];
    return all.filter((p) => p.meta.type === type).map((p) => p.meta);
  }

  getDefaultPackId(type: "word" | "sentence"): string {
    if (type === "word") return "basic-words";
    return "basic-sentences";
  }

  getPack(packId: string): DataPack | undefined {
    return this.builtinPacks.get(packId) ?? this.userPacks.get(packId);
  }

  getItems(packId: string): (WordItem | SentenceItem)[] {
    return this.getPack(packId)?.items ?? [];
  }

  importPack(pack: unknown): { success: boolean; error?: string; id?: string } {
    const result = DataPackSchema.safeParse(pack);
    if (!result.success) {
      return { success: false, error: result.error.issues.map((i) => i.message).join("; ") };
    }
    const validated = result.data;
    const userId = `user_${validated.meta.id}_${Date.now()}`;
    validated.meta.id = userId;
    validated.meta.isBuiltin = false;
    this.userPacks.set(userId, validated as unknown as DataPack);
    this.persistUserPack(userId, validated as unknown as DataPack);
    return { success: true, id: userId };
  }

  getChapters(packId: string): ChapterMeta[] {
    const pack = this.getPack(packId);
    if (!pack) return [];
    const chapterMap = new Map<number, { title: string; count: number }>();
    for (const item of pack.items) {
      const ch = (item as WordItem).chapter ?? 1;
      if (!chapterMap.has(ch)) {
        chapterMap.set(ch, { title: `第 ${ch} 章`, count: 0 });
      }
      chapterMap.get(ch)!.count++;
    }
    return Array.from(chapterMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([chapter, meta]) => ({ chapter, title: meta.title, count: meta.count }));
  }

  getItemsByChapter(packId: string, chapter: number): (WordItem | SentenceItem)[] {
    const pack = this.getPack(packId);
    if (!pack) return [];
    return pack.items.filter((item) => (item as WordItem).chapter === chapter || (item as WordItem).chapter === undefined);
  }

  getDefaultChapter(packId: string): number {
    const chapters = this.getChapters(packId);
    return chapters[0]?.chapter ?? 1;
  }

  exportPack(packId: string): DataPack | null {
    return this.getPack(packId) ?? null;
  }

  removePack(packId: string): boolean {
    if (!packId.startsWith("user_")) return false;
    const removed = this.userPacks.delete(packId);
    if (removed) {
      try {
        localStorage.removeItem(PACK_KEY_PREFIX + packId);
      } catch {}
    }
    return removed;
  }

  private persistUserPack(id: string, pack: DataPack): void {
    try {
      localStorage.setItem(PACK_KEY_PREFIX + id, JSON.stringify(pack));
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        console.warn(`词库 ${id} 存储空间不足，请清理后重试`);
      }
    }
  }

  private persistUserPacks(): void {
    for (const [id, pack] of this.userPacks) {
      this.persistUserPack(id, pack);
    }
  }

  private loadUserPacks(): void {
    // 迁移旧数据（etl_user_packs → 分 key 存储）
    this.migrateOldPacks();

    // 从分 key 存储恢复
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PACK_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const pack = JSON.parse(raw) as DataPack;
          this.userPacks.set(pack.meta.id, pack);
        } catch {}
      }
    }
  }

  private migrateOldPacks(): void {
    try {
      const raw = localStorage.getItem(USER_PACKS_KEY);
      if (!raw) return;
      const packs = JSON.parse(raw) as DataPack[];
      for (const pack of packs) {
        this.persistUserPack(pack.meta.id, pack);
      }
      localStorage.removeItem(USER_PACKS_KEY);
    } catch {}
  }
}

export const dataRegistry = new DataRegistry();

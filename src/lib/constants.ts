export const STORAGE_KEY = "etl_progress_v2";
export const DARK_KEY = "etl_dark";
export const USER_PACKS_KEY = "etl_user_packs";
export const ONBOARDING_KEY = "keykey_onboarding_done";
export const DEFAULT_CATEGORY = "basic";
export const DEFAULT_RATE = 0.75;
export const COMPLETE_RATE = 0.7;
export const AUTO_ADVANCE_DELAY = 2000;
export const INITIAL_SPEAK_DELAY = 300;
export const SPEECH_RATE_KEY = "keykey_speech_rate";
export const DEFAULT_SPEECH_RATE = 0.8;

// 学习路径 - 词包学习顺序
export const LEARNING_PATH: { packId: string; order: number; name: string; description: string }[] = [
  { packId: "basic-words",   order: 1, name: "基础入门",    description: "最常用的基础单词" },
  { packId: "colors",        order: 2, name: "颜色形状",    description: "颜色和形状" },
  { packId: "animals",       order: 3, name: "动物王国",    description: "常见动物名称" },
  { packId: "daily",         order: 4, name: "日常生活",    description: "家居日常用品" },
  { packId: "food",          order: 5, name: "美食天地",    description: "食物和饮料" },
  { packId: "body",          order: 6, name: "身体部位",    description: "人体各部位" },
];

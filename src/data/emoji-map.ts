/**
 * 英文单词 → Emoji 映射
 * 覆盖所有内置词包中的名词性词汇
 */
export const EMOJI_MAP: Record<string, string> = {
  // basic-words
  cat: "🐱",
  dog: "🐶",
  book: "📖",
  apple: "🍎",
  sun: "☀️",
  moon: "🌙",
  star: "⭐",
  fish: "🐟",
  bird: "🐦",
  tree: "🌳",
  flower: "🌸",
  house: "🏠",
  car: "🚗",
  ball: "⚽",
  hat: "🧢",
  shoe: "👟",
  milk: "🥛",
  bread: "🍞",
  egg: "🥚",
  rice: "🍚",
  water: "💧",
  hand: "✋",
  eye: "👁️",
  ear: "👂",
  nose: "👃",
  mouth: "👄",
  baby: "👶",
  school: "🏫",

  // colors
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
  black: "⚫",
  white: "⚪",
  circle: "⭕",
  square: "🟦",
  triangle: "🔺",
  heart: "❤️",
  rainbow: "🌈",

  // animals
  lion: "🦁",
  tiger: "🐯",
  elephant: "🐘",
  monkey: "🐵",
  panda: "🐼",
  bear: "🐻",
  fox: "🦊",
  rabbit: "🐰",
  horse: "🐴",
  cow: "🐮",
  pig: "🐷",
  sheep: "🐑",
  chicken: "🐔",
  duck: "🦆",
  frog: "🐸",
  turtle: "🐢",
  whale: "🐳",
  dolphin: "🐬",
  penguin: "🐧",
  owl: "🦉",
  eagle: "🦅",
  butterfly: "🦋",
  snail: "🐌",
  bee: "🐝",
  ant: "🐜",
  spider: "🕷️",
  mouse: "🐭",
  snake: "🐍",

  // daily
  table: "🪑",
  chair: "🪑",
  door: "🚪",
  window: "🪟",
  bed: "🛏️",
  lamp: "💡",
  clock: "🕐",
  phone: "📱",
  computer: "💻",
  tv: "📺",
  key: "🔑",
  pen: "🖊️",
  paper: "📄",
  bag: "👜",
  cup: "☕",
  plate: "🍽️",
  knife: "🔪",
  spoon: "🥄",
  fork: "🍴",
  soap: "🧼",
  towel: "🧴",
  brush: "🖌️",
  mirror: "🪞",
  comb: "🪮",

  // food
  pizza: "🍕",
  hamburger: "🍔",
  hotdog: "🌭",
  sandwich: "🥪",
  fries: "🍟",
  cake: "🎂",
  cookie: "🍪",
  candy: "🍬",
  chocolate: "🍫",
  icecream: "🍦",
  donut: "🍩",
  juice: "🧃",
  coffee: "☕",
  tea: "🫖",
  beer: "🍺",
  wine: "🍷",
  banana: "🍌",
  orange: "🍊",
  grape: "🍇",
  strawberry: "🍓",
  watermelon: "🍉",
  lemon: "🍋",
  cherry: "🍒",
  peach: "🍑",
  corn: "🌽",
  carrot: "🥕",
  tomato: "🍅",
  potato: "🥔",
  onion: "🧅",
  garlic: "🧄",

  // body
  head: "👤",
  hair: "💇",
  face: "😊",
  tooth: "🦷",
  tongue: "👅",
  arm: "💪",
  leg: "🦵",
  foot: "🦶",
  finger: "👆",
  knee: "🦶",
  back: "🔙",
  neck: "🧣",
  shoulder: "🦾",
  stomach: "🤰",
  bone: "🦴",
};

/**
 * Get emoji for a target word or sentence.
 * For single words, looks up the emoji map directly.
 * For sentences, returns emojis for words that have mappings.
 */
export function getWordEmoji(target: string): string | null {
  const lower = target.toLowerCase().trim();
  if (EMOJI_MAP[lower]) return EMOJI_MAP[lower];
  return null;
}

export function getSentenceEmojis(target: string): string[] {
  return target
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ""))
    .filter((w) => EMOJI_MAP[w])
    .map((w) => EMOJI_MAP[w]);
}

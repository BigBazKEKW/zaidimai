import { SONGS, type Song, type Genre } from "@/data/songs";

// Lithuanian time = GMT+3 (no DST handling for simplicity, matching prompt requirement)
const LT_OFFSET_MS = 3 * 60 * 60 * 1000;

export function getLtDayIndex(date: Date = new Date()): number {
  const ltMs = date.getTime() + LT_OFFSET_MS;
  return Math.floor(ltMs / (24 * 60 * 60 * 1000));
}

export function msUntilNextLtMidnight(date: Date = new Date()): number {
  const ltMs = date.getTime() + LT_OFFSET_MS;
  const dayMs = 24 * 60 * 60 * 1000;
  const nextLtMidnight = (Math.floor(ltMs / dayMs) + 1) * dayMs;
  return nextLtMidnight - ltMs;
}

export const DAILY_GENRES: Genre[] = ["all", "rock", "hiphop"];

export const GENRE_LABEL: Record<Genre, string> = {
  all: "Visi žanrai",
  rock: "Rokas",
  hiphop: "Hip-hop",
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HISTORY_KEY = "heardle_lt_history_v2"; // {dayIndex: {all,rock,hiphop}: songId}
const BLOCKED_KEY = "heardle_lt_blocked_v1";
const STATS_KEY = "heardle_lt_stats_v2";
const PROGRESS_KEY = "heardle_lt_progress_v2"; // per day per genre

export interface DayProgress {
  dayIndex: number;
  genre: Genre;
  attempts: number;
  finished: boolean;
  won: boolean;
  guesses: (string | null)[];
}

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
}

const safeStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

export function getBlockedIds(): number[] {
  return safeStorage.get<number[]>(BLOCKED_KEY, []);
}
export function setBlockedIds(ids: number[]) {
  safeStorage.set(BLOCKED_KEY, ids);
}
export function toggleBlocked(id: number): number[] {
  const cur = getBlockedIds();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  setBlockedIds(next);
  return next;
}

type HistoryMap = Record<number, Partial<Record<Genre, number>>>;
export function getHistory(): HistoryMap {
  return safeStorage.get<HistoryMap>(HISTORY_KEY, {});
}
function setHistory(h: HistoryMap) {
  safeStorage.set(HISTORY_KEY, h);
}

export function getStats(): Stats {
  return safeStorage.get<Stats>(STATS_KEY, {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
  });
}
export function setStats(s: Stats) {
  safeStorage.set(STATS_KEY, s);
}

function progressKey(dayIndex: number, genre: Genre) {
  return `${PROGRESS_KEY}:${dayIndex}:${genre}`;
}
export function getProgress(dayIndex: number, genre: Genre): DayProgress {
  const p = safeStorage.get<DayProgress | null>(progressKey(dayIndex, genre), null);
  if (p && p.dayIndex === dayIndex && p.genre === genre) return p;
  return {
    dayIndex,
    genre,
    attempts: 0,
    finished: false,
    won: false,
    guesses: [],
  };
}
export function saveProgress(p: DayProgress) {
  safeStorage.set(progressKey(p.dayIndex, p.genre), p);
}

// Pick the daily song for a specific genre. Persists choice in history.
export function getDailySong(dayIndex: number, genre: Genre): Song | null {
  const history = getHistory();
  const existing = history[dayIndex]?.[genre];
  if (existing != null) {
    const s = SONGS.find((x) => x.id === existing);
    if (s) return s;
  }

  const blocked = new Set(getBlockedIds());
  const matches = (s: Song) => (genre === "all" ? true : s.genre === genre);

  // Songs played in last 100 days (any genre slot)
  const recent = new Set<number>();
  for (let d = dayIndex - 1; d >= dayIndex - 100 && d >= 0; d--) {
    const slots = history[d];
    if (slots) {
      for (const id of Object.values(slots)) if (id != null) recent.add(id);
    }
  }
  // Also exclude songs picked earlier today for other genres
  const todaySlots = history[dayIndex] ?? {};
  for (const id of Object.values(todaySlots)) if (id != null) recent.add(id);

  const eligible = SONGS.filter((s) => !blocked.has(s.id) && matches(s));
  if (eligible.length === 0) return null;

  let pool = eligible.filter((s) => !recent.has(s.id));
  if (pool.length === 0) pool = eligible;

  // Seed includes genre so each genre gets a different song
  const genreSeed = genre === "all" ? 1 : genre === "rock" ? 2 : 3;
  const rng = mulberry32(dayIndex * 2654435761 + genreSeed * 1013904223);
  const pick = pool[Math.floor(rng() * pool.length)];

  history[dayIndex] = { ...todaySlots, [genre]: pick.id };
  setHistory(history);
  return pick;
}

// Unlimited mode: songs not played in last 100 days of main rotation
export function getUnlimitedPool(): Song[] {
  const history = getHistory();
  const today = getLtDayIndex();
  const recent = new Set<number>();
  for (let d = today; d >= today - 100; d--) {
    const slots = history[d];
    if (slots) {
      for (const id of Object.values(slots)) if (id != null) recent.add(id);
    }
  }
  const blocked = new Set(getBlockedIds());
  const pool = SONGS.filter((s) => !recent.has(s.id) && !blocked.has(s.id));
  return pool.length > 0 ? pool : SONGS.filter((s) => !blocked.has(s.id));
}

export function pickRandomFromPool(pool: Song[]): Song | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const ATTEMPT_DURATIONS = [0.1, 0.5, 2, 5, 10, 16];
export const MAX_ATTEMPTS = ATTEMPT_DURATIONS.length;

export function recordResult(won: boolean, attemptIndex: number) {
  const s = getStats();
  s.played += 1;
  if (won) {
    s.wins += 1;
    s.currentStreak += 1;
    s.maxStreak = Math.max(s.maxStreak, s.currentStreak);
    s.distribution[attemptIndex] = (s.distribution[attemptIndex] || 0) + 1;
  } else {
    s.currentStreak = 0;
  }
  setStats(s);
}

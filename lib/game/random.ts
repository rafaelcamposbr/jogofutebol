export type SeededRandom = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(values: readonly T[]) => T;
  chance: (probability: number) => boolean;
};

export function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string): SeededRandom {
  let state = hashSeed(seed) || 0x6d2b79f5;
  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(values: readonly T[]) {
      if (!values.length) throw new Error("cannot_pick_empty_array");
      return values[Math.floor(next() * values.length)];
    },
    chance(probability) {
      return next() < Math.max(0, Math.min(1, probability));
    },
  };
}

export function deterministicUuid(seed: string) {
  const parts = [0, 1, 2, 3].map((index) => hashSeed(`${seed}:${index}`).toString(16).padStart(8, "0")).join("");
  const chars = parts.slice(0, 32).split("");
  chars[12] = "4";
  chars[16] = ((Number.parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

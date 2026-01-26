import type { ISeededRandom } from "./types";

/**
 * Mulberry32 PRNG - simple, fast, and deterministic
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
function mulberry32(initialSeed: number): () => number {
  let seed = initialSeed;
  return function () {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded random number generator class
 */
export class SeededRandom implements ISeededRandom {
  private nextRandom: () => number;

  constructor(seed: number) {
    this.nextRandom = mulberry32(seed);
  }

  next(): number {
    return this.nextRandom();
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    return array[this.int(0, array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.int(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

/**
 * Create a seeded random number generator (function form)
 */
export function createSeededRandom(seed: number): ISeededRandom {
  return new SeededRandom(seed);
}

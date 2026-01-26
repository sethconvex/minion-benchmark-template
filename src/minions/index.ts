import type { MinionBehavior } from "../../lib/minion-benchmark";
import type { ItemsContext } from "./types";
import { seederBehavior } from "./behaviors/seeder";
import { readerBehavior } from "./behaviors/reader";
import { writerBehavior } from "./behaviors/writer";
import { mixedBehavior } from "./behaviors/mixed";

// Context factory for headless execution
export { createContext } from "./context";

export const behaviors: Record<string, MinionBehavior<ItemsContext>> = {
  seeder: seederBehavior,
  reader: readerBehavior,
  writer: writerBehavior,
  mixed: mixedBehavior,
};

export type { ItemsContext, Item } from "./types";
export {
  seederBehavior,
  readerBehavior,
  writerBehavior,
  mixedBehavior,
};

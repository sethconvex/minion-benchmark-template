import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  useMinionRunner,
  MinionPanel,
  MinionToggle,
  SeededRandom,
} from "../lib/minion-benchmark";
import { behaviors } from "./minions";
import type { ItemsContext, Item } from "./minions";

function getUserId(): string {
  const stored = localStorage.getItem("items-user-id");
  if (stored) return stored;
  const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("items-user-id", newId);
  return newId;
}

function getUserName(): string {
  const stored = localStorage.getItem("items-user-name");
  if (stored) return stored;
  const names = ["Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley"];
  const newName = names[Math.floor(Math.random() * names.length)];
  localStorage.setItem("items-user-name", newName);
  return newName;
}

export default function App() {
  const [visibleId] = useState(getUserId);
  const [userName] = useState(getUserName);
  const [minionMode, setMinionMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Items queries
  const items = useQuery(api.items.listItems, { status: statusFilter, limit: 100 });

  // Mutations
  const createItemMutation = useMutation(api.items.createItem);
  const createItemsMutation = useMutation(api.items.createItems);
  const updateItemMutation = useMutation(api.items.updateItem);
  const deleteItemMutation = useMutation(api.items.deleteItem);

  // Context factory for minion runner
  const createContext = useCallback(
    (log: (msg: string) => void, shouldStop: () => boolean, seed: number): ItemsContext => ({
      random: new SeededRandom(seed),
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      shouldStop,
      log,

      createItem: async (data) => {
        return await createItemMutation({
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          tags: data.tags,
        });
      },

      createItems: async (itemsData) => {
        return await createItemsMutation({
          items: itemsData.map((item) => ({
            title: item.title,
            description: item.description,
            status: item.status,
            priority: item.priority,
            tags: item.tags,
          })),
        });
      },

      updateItem: async (id, data) => {
        await updateItemMutation({
          id: id as Id<"items">,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          tags: data.tags,
        });
      },

      deleteItem: async (id) => {
        await deleteItemMutation({ id: id as Id<"items"> });
      },

      getItems: (): Item[] =>
        (items ?? []).map((item) => ({
          id: item._id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          ownerId: item.ownerId,
          tags: item.tags,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),

      getItemsByStatus: (status) =>
        (items ?? [])
          .filter((item) => item.status === status)
          .map((item) => ({
            id: item._id,
            title: item.title,
            description: item.description,
            status: item.status,
            priority: item.priority,
            ownerId: item.ownerId,
            tags: item.tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),

      getItemsByPriority: (priority) =>
        (items ?? [])
          .filter((item) => item.priority === priority)
          .map((item) => ({
            id: item._id,
            title: item.title,
            description: item.description,
            status: item.status,
            priority: item.priority,
            ownerId: item.ownerId,
            tags: item.tags,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),

      getRandomItem: () => {
        if (!items || items.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * items.length);
        const item = items[randomIndex];
        return {
          id: item._id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          ownerId: item.ownerId,
          tags: item.tags,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      },

      getItemCount: () => (items ?? []).length,
    }),
    [items, createItemMutation, createItemsMutation, updateItemMutation, deleteItemMutation]
  );

  const minion = useMinionRunner(behaviors, createContext);

  const handleAddItem = async () => {
    const title = prompt("Item title:");
    if (title?.trim()) {
      await createItemMutation({ title: title.trim() });
    }
  };

  const statusCounts = {
    all: items?.length ?? 0,
    pending: items?.filter((i) => i.status === "pending").length ?? 0,
    active: items?.filter((i) => i.status === "active").length ?? 0,
    completed: items?.filter((i) => i.status === "completed").length ?? 0,
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Items Benchmark</h1>
        <div className="flex items-center gap-4">
          <MinionToggle enabled={minionMode} onChange={setMinionMode} />
          <div className="text-sm text-gray-600">
            {userName} ({visibleId.slice(0, 8)}...)
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex min-h-0 p-4">
        <div className={`flex-1 flex flex-col min-h-0 ${minionMode ? "mr-80" : ""}`}>
          {/* Filters and stats */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter(undefined)}
                  className={`px-3 py-1 rounded ${
                    !statusFilter ? "bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded ${
                    statusFilter === "pending" ? "bg-yellow-500 text-white" : "bg-yellow-100 hover:bg-yellow-200"
                  }`}
                >
                  Pending ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 rounded ${
                    statusFilter === "active" ? "bg-blue-500 text-white" : "bg-blue-100 hover:bg-blue-200"
                  }`}
                >
                  Active ({statusCounts.active})
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1 rounded ${
                    statusFilter === "completed" ? "bg-green-500 text-white" : "bg-green-100 hover:bg-green-200"
                  }`}
                >
                  Completed ({statusCounts.completed})
                </button>
              </div>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-white rounded-lg shadow">
            {!items ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="mb-2">No items found</p>
                <p className="text-sm">Run the Seeder behavior to create test items</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Title</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Priority</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{item.title}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-slate-600">P{item.priority}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Minion panel */}
        {minionMode && (
          <div className="w-80 flex-shrink-0 ml-4">
            <MinionPanel
              behaviors={behaviors}
              selectedBehavior={minion.selectedBehavior}
              onSelectBehavior={minion.selectBehavior}
              isRunning={minion.isRunning}
              onStart={minion.start}
              onStop={minion.stop}
              onClearLogs={minion.clearLogs}
              logs={minion.logs}
            />
          </div>
        )}
      </main>
    </div>
  );
}

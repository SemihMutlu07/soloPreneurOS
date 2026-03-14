"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { mindQueueItems, type MindQueueItem, type Priority } from "@/lib/mock-data";

const priorityConfig: Record<Priority, { color: string; bg: string; label: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
  important: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Important" },
  "can-wait": { color: "text-blue-400", bg: "bg-blue-500/10", label: "Can Wait" },
};

const STORAGE_KEY = "mind-queue-order";

function loadOrder(): MindQueueItem[] {
  if (typeof window === "undefined") return mindQueueItems;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return mindQueueItems;
    const ids: string[] = JSON.parse(saved);
    const map = new Map(mindQueueItems.map((item) => [item.id, item]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean) as MindQueueItem[];
    const missing = mindQueueItems.filter((item) => !ids.includes(item.id));
    return [...ordered, ...missing];
  } catch {
    return mindQueueItems;
  }
}

export default function MindQueue() {
  const [items, setItems] = useState<MindQueueItem[]>(mindQueueItems);

  useEffect(() => {
    setItems(loadOrder());
  }, []);

  function moveItem(index: number, direction: "up" | "down") {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems.map((i) => i.id)));
  }

  return (
    <div className="card w-full">
      <div className="flex items-center gap-2.5 mb-5">
        <Brain className="w-5 h-5 text-accent-teal" />
        <h2 className="text-base font-semibold font-mono text-gray-100">Mind Queue</h2>
        <span className="text-xs text-text-secondary ml-auto font-normal">{items.length} items</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const config = priorityConfig[item.priority];
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-elevated/50 hover:bg-surface-hover transition-colors group"
            >
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="text-text-muted hover:text-gray-100 disabled:opacity-20 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="text-text-muted hover:text-gray-100 disabled:opacity-20 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 leading-relaxed">{item.text}</p>
                <div className="flex items-center gap-2.5 mt-2">
                  <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium", config.bg, config.color)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-text-secondary">{item.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

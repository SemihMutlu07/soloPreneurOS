"use client";

import { useState, useEffect, useCallback } from "react";
import { ListChecks, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { setAgentResult } from "@/lib/agent-store";
import AgentCardWrapper from "./agent-card-wrapper";

interface TaskItem {
  id: string;
  text: string;
  priority: "critical" | "important" | "can-wait";
  completed: boolean;
  createdAt: string;
}

interface AnalysisResult {
  analysis: string;
  suggestedOrder: string[];
  blockers: string[];
}

const STORAGE_KEY = "daily-ops-tasks";

const priorityConfig: Record<TaskItem["priority"], { color: string; bg: string; label: string; next: TaskItem["priority"] }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", label: "Critical", next: "important" },
  important: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Important", next: "can-wait" },
  "can-wait": { color: "text-blue-400", bg: "bg-blue-500/10", label: "Can Wait", next: "critical" },
};

function loadTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTasks(tasks: TaskItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export default function DailyOps() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [lastRun, setLastRun] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  function addTask() {
    const text = input.trim();
    if (!text) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      text,
      priority: "important",
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setInput("");
  }

  function toggleTask(id: string) {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    saveTasks(updated);
  }

  function deleteTask(id: string) {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  }

  function cyclePriority(id: string) {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, priority: priorityConfig[t.priority].next } : t
    );
    setTasks(updated);
    saveTasks(updated);
  }

  const runAnalysis = useCallback(async () => {
    setStatus("running");
    try {
      const res = await fetch("/api/agents/daily-ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (!res.ok) throw new Error("Failed to analyze tasks");
      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setAgentResult("daily-ops", data, "success", `Analyzed ${tasks.length} tasks`);
      setStatus("success");
      setLastRun(new Date().toISOString());
    } catch {
      setStatus("error");
    }
  }, [tasks]);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <AgentCardWrapper
      agentId="daily-ops"
      agentName="Daily Ops"
      icon={<ListChecks className="w-5 h-5 text-accent-teal" />}
      status={status}
      lastRun={lastRun}
      onRun={runAnalysis}
    >
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          className="flex-1 bg-surface-elevated/50 text-sm text-gray-100 placeholder:text-text-muted rounded-lg px-3 py-2 border border-border-subtle focus:outline-none focus:border-accent-teal/50"
        />
      </div>

      {tasks.length > 0 && (
        <p className="text-xs text-text-secondary mb-3 font-mono">
          {activeTasks.length} active / {completedTasks.length} completed
        </p>
      )}

      <div className="space-y-1.5">
        {activeTasks.map((task) => {
          const config = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-elevated/50 hover:bg-surface-hover transition-colors group"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 rounded border-border-subtle accent-accent-teal shrink-0"
              />
              <span className="flex-1 text-sm text-gray-100 leading-relaxed min-w-0 truncate">
                {task.text}
              </span>
              <button
                onClick={() => cyclePriority(task.id)}
                className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", config.bg, config.color)}
              >
                {config.label}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-elevated/30 group"
          >
            <input
              type="checkbox"
              checked={true}
              onChange={() => toggleTask(task.id)}
              className="w-4 h-4 rounded border-border-subtle accent-accent-teal shrink-0"
            />
            <span className="flex-1 text-sm text-text-muted line-through leading-relaxed min-w-0 truncate">
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-sm text-text-secondary py-4 text-center">
          No tasks yet. Add one above to get started.
        </p>
      )}

      {analysis && (
        <div className="mt-4 space-y-3">
          <div className="p-3.5 rounded-xl bg-surface-elevated/40 border-l-2 border-l-accent-teal">
            <h4 className="text-xs font-semibold font-mono text-accent-teal mb-2">
              Agent&apos;s take:
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">
              {analysis.analysis}
            </p>
          </div>

          {analysis.suggestedOrder.length > 0 && (
            <div className="p-3.5 rounded-xl bg-surface-elevated/40">
              <h4 className="text-xs font-semibold font-mono text-gray-100 mb-2">
                Suggested order:
              </h4>
              <ol className="space-y-1">
                {analysis.suggestedOrder.map((item, i) => (
                  <li key={i} className="text-sm text-text-secondary leading-relaxed">
                    <span className="text-accent-teal font-mono mr-2">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {analysis.blockers.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/5 border-l-2 border-l-accent-amber">
              <h4 className="text-xs font-semibold font-mono text-amber-400 mb-2">
                Blockers:
              </h4>
              <ul className="space-y-1">
                {analysis.blockers.map((b, i) => (
                  <li key={i} className="text-sm text-amber-300/80 leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AgentCardWrapper>
  );
}

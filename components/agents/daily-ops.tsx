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
  critical: { color: "text-accent-red", bg: "bg-accent-red/8", label: "Critical", next: "important" },
  important: { color: "text-accent-amber", bg: "bg-accent-amber/8", label: "Important", next: "can-wait" },
  "can-wait": { color: "text-accent-blue", bg: "bg-accent-blue/8", label: "Can Wait", next: "critical" },
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
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          className="flex-1 bg-surface-elevated/30 text-sm text-text-primary placeholder:text-text-muted rounded-lg px-3 py-2 border border-border focus:outline-none focus:border-accent-teal/30 transition-colors"
        />
      </div>

      {tasks.length > 0 && (
        <p className="text-[11px] text-text-muted mb-2.5">
          {activeTasks.length} active / {completedTasks.length} completed
        </p>
      )}

      <div className="space-y-1 card-scroll">
        {activeTasks.map((task) => {
          const config = priorityConfig[task.priority];
          return (
            <div
              key={task.id}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-elevated/30 hover:bg-surface-hover transition-colors group"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleTask(task.id)}
                className="w-3.5 h-3.5 rounded border-border-strong accent-accent-teal shrink-0"
              />
              <span className="flex-1 text-[13px] text-text-primary leading-snug min-w-0 truncate">
                {task.text}
              </span>
              <button
                onClick={() => cyclePriority(task.id)}
                className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0", config.bg, config.color)}
              >
                {config.label}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-elevated/15 group"
          >
            <input
              type="checkbox"
              checked={true}
              onChange={() => toggleTask(task.id)}
              className="w-3.5 h-3.5 rounded border-border-strong accent-accent-teal shrink-0"
            />
            <span className="flex-1 text-[13px] text-text-muted line-through leading-snug min-w-0 truncate">
              {task.text}
            </span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-sm text-text-muted py-4 text-center">
          No tasks yet. Add one above.
        </p>
      )}

      {analysis && (
        <div className="mt-3 space-y-2.5">
          <div className="p-3 rounded-xl bg-surface-elevated/30 border-l-2 border-l-accent-teal">
            <h4 className="text-[11px] font-semibold text-accent-teal mb-1.5 uppercase tracking-wide">
              Agent&apos;s take
            </h4>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {analysis.analysis}
            </p>
          </div>

          {analysis.suggestedOrder.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-elevated/30">
              <h4 className="text-[11px] font-semibold text-text-primary mb-1.5 uppercase tracking-wide">
                Suggested order
              </h4>
              <ol className="space-y-0.5">
                {analysis.suggestedOrder.map((item, i) => (
                  <li key={i} className="text-[13px] text-text-secondary leading-relaxed">
                    <span className="text-accent-teal font-mono mr-1.5">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {analysis.blockers.length > 0 && (
            <div className="p-3 rounded-xl bg-accent-amber/3 border-l-2 border-l-accent-amber">
              <h4 className="text-[11px] font-semibold text-accent-amber mb-1.5 uppercase tracking-wide">
                Blockers
              </h4>
              <ul className="space-y-0.5">
                {analysis.blockers.map((b, i) => (
                  <li key={i} className="text-[13px] text-amber-200/70 leading-relaxed">
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

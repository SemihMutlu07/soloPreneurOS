"use client";

import { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import { founderStories } from "@/lib/mock-data";

export default function FounderStories() {
  const [index, setIndex] = useState(0);
  const story = founderStories[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % founderStories.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Quote className="w-5 h-5 text-text-muted" />
        <h2 className="text-lg font-semibold font-mono">Founder Stories</h2>
      </div>

      <blockquote className="text-sm text-text-secondary italic leading-relaxed mb-3">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      <div className="mb-3">
        <p className="text-sm font-medium text-text-primary">{story.author}</p>
        <p className="text-xs text-text-muted">{story.role}</p>
      </div>

      <div className="p-2.5 rounded-xl bg-accent-teal/5">
        <p className="text-xs text-accent-teal leading-relaxed">
          <span className="font-medium">Takeaway:</span> {story.takeaway}
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        {founderStories.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === index ? "bg-text-primary" : "bg-text-muted/50"
            }`}
            aria-label={`Story ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

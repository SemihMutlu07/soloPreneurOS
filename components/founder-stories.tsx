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
      <div className="flex items-center gap-2.5 mb-4">
        <Quote className="w-5 h-5 text-text-muted" />
        <h2 className="text-sm font-semibold text-text-primary">Founder Stories</h2>
      </div>

      <blockquote className="text-[13px] text-text-secondary italic leading-relaxed mb-3">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      <div className="mb-3">
        <p className="text-[13px] font-semibold text-text-primary">{story.author}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{story.role}</p>
      </div>

      <div className="p-3 rounded-xl bg-accent-teal/5 border border-accent-teal/8">
        <p className="text-[11px] text-accent-teal leading-relaxed">
          <span className="font-semibold">Takeaway:</span> {story.takeaway}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {founderStories.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "bg-text-primary scale-125" : "bg-text-muted/30 hover:bg-text-muted"
            }`}
            aria-label={`Story ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

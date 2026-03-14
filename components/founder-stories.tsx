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
      <div className="flex items-center gap-2.5 mb-5">
        <Quote className="w-5 h-5 text-text-secondary" />
        <h2 className="text-base font-semibold font-mono text-gray-100">Founder Stories</h2>
      </div>

      <blockquote className="text-sm text-text-secondary italic leading-relaxed mb-4">
        &ldquo;{story.quote}&rdquo;
      </blockquote>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-100">{story.author}</p>
        <p className="text-xs text-text-secondary mt-0.5">{story.role}</p>
      </div>

      <div className="p-3.5 rounded-xl bg-accent-teal/5 border border-accent-teal/10">
        <p className="text-xs text-accent-teal leading-relaxed">
          <span className="font-semibold">Takeaway:</span> {story.takeaway}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5">
        {founderStories.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "bg-gray-100 scale-125" : "bg-text-muted/40 hover:bg-text-muted"
            }`}
            aria-label={`Story ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

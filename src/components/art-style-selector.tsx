"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const ART_STYLES = [
  { id: "collage", name: "Collage", description: "Layered, mixed-media aesthetic" },
  { id: "cinematic", name: "Cinematic", description: "Film-like, dramatic visuals" },
  { id: "digital-art", name: "Digital Art", description: "Modern digital illustration" },
  { id: "neon-futuristic", name: "Neon Futuristic", description: "Cyberpunk, neon-lit scenes" },
  { id: "comic-book", name: "Comic Book", description: "Bold, stylized comic art" },
  { id: "playground", name: "Playground", description: "Bright, playful cartoon style" },
  { id: "4k-realistic", name: "4k Realistic", description: "Ultra-realistic, high detail" },
  { id: "cartoon", name: "Cartoon", description: "Classic animated style" },
  { id: "kawaii", name: "Kawaii", description: "Cute, Japanese-inspired" },
  { id: "anime", name: "Anime", description: "Japanese animation style" },
  { id: "line-art", name: "Line Art", description: "Minimalist line drawings" },
  { id: "japanese-ink", name: "Japanese Ink", description: "Traditional ink painting" },
] as const;

export type ArtStyleId = typeof ART_STYLES[number]["id"];

interface ArtStyleSelectorProps {
  value?: string;
  onChange: (styleId: string) => void;
}

export function ArtStyleSelector({ value, onChange }: ArtStyleSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Choose a generation preset</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Select an art style for your video
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ART_STYLES.map((style) => {
          const isSelected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                "relative aspect-[4/3] rounded-lg border-2 transition-all",
                "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
                "hover:border-zinc-400 dark:hover:border-zinc-600",
                "flex flex-col items-center justify-center p-3",
                isSelected
                  ? "border-yellow-500 dark:border-yellow-500 ring-2 ring-yellow-500/20"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="text-center">
                <div className="text-xs font-semibold mb-1">{style.name}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {style.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


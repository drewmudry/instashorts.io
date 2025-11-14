"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getArtStylePreviewUrl } from "@/lib/art-styles";

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
          Select an art style for your video (hover to see alternate preview)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ART_STYLES.map((style) => {
          const isSelected = value === style.id;
          const icarusUrl = getArtStylePreviewUrl(style.id, "icarus");
          const cleopatraUrl = getArtStylePreviewUrl(style.id, "cleopatra");
          
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                "group relative aspect-[4/3] rounded-lg border-2 transition-all overflow-hidden",
                "hover:border-zinc-400 dark:hover:border-zinc-600",
                isSelected
                  ? "border-yellow-500 dark:border-yellow-500 ring-2 ring-yellow-500/20"
                  : "border-zinc-300 dark:border-zinc-700"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-20 bg-yellow-500 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              {/* Icarus Image (default) */}
              <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0">
                <Image
                  src={icarusUrl}
                  alt={`${style.name} style preview - Icarus`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                  unoptimized
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Cleopatra Image (on hover) */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Image
                  src={cleopatraUrl}
                  alt={`${style.name} style preview - Cleopatra`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                  unoptimized
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 text-center z-10">
                <div className="text-xs font-semibold text-white mb-0.5 drop-shadow-lg">
                  {style.name}
                </div>
                <div className="text-[10px] text-white/90 line-clamp-1 drop-shadow">
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


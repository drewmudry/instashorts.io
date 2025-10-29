'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Avatar {
  id: number;
  userId: number | null;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  styleId: string | null;
  styleName: string | null;
  dimensions: string;
  quality: string;
  jobId: string;
  status: string;
  enhancedPrompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AvatarMasonryProps {
  avatars: Avatar[];
}

export default function AvatarMasonry({ avatars }: AvatarMasonryProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);

  if (avatars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-zinc-300 dark:text-zinc-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No avatars yet
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Get started by creating your first AI-generated avatar
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className="break-inside-avoid group cursor-pointer"
            onClick={() => setSelectedAvatar(avatar)}
          >
            <div className="relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 transition-transform duration-200 hover:scale-[1.02]">
              <img
                src={avatar.thumbnailUrl || avatar.imageUrl}
                alt={avatar.prompt}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {avatar.prompt}
                  </p>
                  {avatar.styleName && (
                    <p className="text-white/80 text-xs mt-1">
                      Style: {avatar.styleName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for selected avatar */}
      {selectedAvatar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAvatar(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAvatar(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex flex-col lg:flex-row max-h-[90vh]">
              <div className="flex-1 bg-zinc-100 dark:bg-black flex items-center justify-center p-4 overflow-auto">
                <img
                  src={selectedAvatar.imageUrl}
                  alt={selectedAvatar.prompt}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="w-full lg:w-96 p-6 overflow-auto">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  Avatar Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Prompt
                    </h3>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {selectedAvatar.prompt}
                    </p>
                  </div>

                  {selectedAvatar.styleName && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Style
                      </h3>
                      <p className="text-zinc-900 dark:text-zinc-100">
                        {selectedAvatar.styleName}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Dimensions
                      </h3>
                      <p className="text-zinc-900 dark:text-zinc-100">
                        {selectedAvatar.dimensions}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Quality
                      </h3>
                      <p className="text-zinc-900 dark:text-zinc-100 uppercase">
                        {selectedAvatar.quality}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Created
                    </h3>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {new Date(selectedAvatar.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <a
                      href={selectedAvatar.imageUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-80 transition-opacity"
                    >
                      Download Image
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


'use client';

import { useState, useEffect } from 'react';
import AvatarMasonry from '@/components/AvatarMasonry';
import AvatarGeneratorModal from '@/components/AvatarGeneratorModal';
import AuthButton from '@/components/AuthButton';
import { getAvatars } from '@/actions/avatar-actions';

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

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAvatars = async () => {
    try {
      setLoading(true);
      const fetchedAvatars = await getAvatars(100);
      setAvatars(fetchedAvatars as Avatar[]);
    } catch (error) {
      console.error('Failed to load avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvatars();
  }, []);

  const handleGenerateSuccess = () => {
    loadAvatars();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-zinc-50">
                InstaShorts
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                AI-powered avatars with Higgsfield Soul
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <AuthButton />
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-80 transition-opacity shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Create Avatar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          </div>
        ) : (
          <AvatarMasonry avatars={avatars} />
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 sm:hidden p-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-80 transition-opacity shadow-2xl"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Generator Modal */}
      <AvatarGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getSoulStyles,
  generateSoulImageAndWait,
  type SoulStyle,
  type Text2ImageSoulParams,
} from '@/actions/soul-actions';
import { saveAvatar } from '@/actions/avatar-actions';

interface AvatarGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AvatarGeneratorModal({
  isOpen,
  onClose,
  onSuccess,
}: AvatarGeneratorModalProps) {
  const { data: session } = useSession();
  const [styles, setStyles] = useState<SoulStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('464ea177-8d40-4940-8d9d-b438bab269c7');
  const [widthAndHeight, setWidthAndHeight] = useState<Text2ImageSoulParams['width_and_height']>('1152x2048');
  const [quality, setQuality] = useState<'720p' | '1080p'>('1080p');
  const [enhancePrompt, setEnhancePrompt] = useState(false);

  // Load available styles on mount
  useEffect(() => {
    async function loadStyles() {
      try {
        const fetchedStyles = await getSoulStyles();
        setStyles(fetchedStyles);
      } catch (err) {
        console.error('Failed to load styles:', err);
        setError('Failed to load Soul styles. Check your API credentials.');
      } finally {
        setLoadingStyles(false);
      }
    }
    if (isOpen) {
      loadStyles();
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Text2ImageSoulParams = {
        prompt: prompt.trim(),
        width_and_height: widthAndHeight,
        quality,
        enhance_prompt: enhancePrompt,
        style_id: selectedStyleId,
        style_strength: 1,
        batch_size: 1,
      };

      console.log('Generating image with params:', params);
      const result = await generateSoulImageAndWait(params);

      const imageUrl = result.job.results?.raw?.url;
      const thumbnailUrl = result.job.results?.min?.url;

      if (imageUrl || thumbnailUrl) {
        const finalImageUrl = imageUrl || thumbnailUrl!;

        // Save to database
        try {
          const selectedStyle = styles.find((s) => s.id === selectedStyleId);
          await saveAvatar({
            userId: session?.user?.id,
            prompt: prompt.trim(),
            imageUrl: finalImageUrl,
            thumbnailUrl: thumbnailUrl,
            styleId: selectedStyleId,
            styleName: selectedStyle?.name,
            dimensions: widthAndHeight,
            quality,
            jobId: result.job.id,
            status: result.job.status,
            enhancedPrompt: result.enhancedPrompt,
          });
          console.log('Avatar saved to database');
          
          // Reset form and close modal
          setPrompt('');
          setError(null);
          onSuccess?.();
          onClose();
        } catch (saveError) {
          console.error('Failed to save avatar to database:', saveError);
          setError('Image generated but failed to save to database');
        }
      } else {
        setError('No image URL in response');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Generate Avatar
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6 text-zinc-600 dark:text-zinc-400"
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            {/* Prompt */}
            <div className="flex flex-col gap-2">
              <label htmlFor="prompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the avatar you want to generate..."
                rows={3}
                required
                disabled={loading}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white resize-none disabled:opacity-50"
              />
            </div>

            {/* Style Selection */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Style
              </label>
              {loadingStyles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div>
                </div>
              ) : (
                <div className="relative -mx-6 px-6">
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyleId(style.id)}
                        disabled={loading}
                        className={`flex-shrink-0 w-32 snap-start group flex flex-col ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            selectedStyleId === style.id
                              ? 'border-black dark:border-white shadow-lg scale-105'
                              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                          }`}
                        >
                          {/* Preview Image */}
                          <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800">
                            <img
                              src={style.preview_url}
                              alt={style.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Selected Indicator */}
                          {selectedStyleId === style.id && (
                            <div className="absolute top-2 right-2 bg-black dark:bg-white rounded-full p-1">
                              <svg
                                className="w-4 h-4 text-white dark:text-black"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Text Container with Fixed Height */}
                        <div className="mt-2 h-14 flex flex-col">
                          {/* Style Name */}
                          <p
                            className={`text-xs font-medium text-center transition-colors ${
                              selectedStyleId === style.id
                                ? 'text-black dark:text-white'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {style.name}
                          </p>
                          
                          {/* Description (if available) - with fixed height space */}
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500 text-center line-clamp-2 flex-1">
                            {style.description || '\u00A0'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div className="flex flex-col gap-2">
              <label htmlFor="dimensions" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Dimensions
              </label>
              <select
                id="dimensions"
                value={widthAndHeight}
                onChange={(e) => setWidthAndHeight(e.target.value as Text2ImageSoulParams['width_and_height'])}
                disabled={loading}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50"
              >
                <option value="1152x2048">Portrait (1152x2048)</option>
                <option value="2048x1152">Landscape (2048x1152)</option>
                <option value="1536x1536">Square (1536x1536)</option>
                <option value="2048x1536">Wide Landscape (2048x1536)</option>
                <option value="1536x2048">Tall Portrait (1536x2048)</option>
                <option value="1344x2016">1344x2016</option>
                <option value="2016x1344">2016x1344</option>
                <option value="960x1696">960x1696</option>
                <option value="1536x1152">1536x1152</option>
                <option value="1696x960">1696x960</option>
                <option value="1152x1536">1152x1536</option>
                <option value="1088x1632">1088x1632</option>
                <option value="1632x1088">1632x1088</option>
              </select>
            </div>

            {/* Quality */}
            <div className="flex flex-col gap-2">
              <label htmlFor="quality" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quality
              </label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value as '720p' | '1080p')}
                disabled={loading}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>

            {/* Enhance Prompt Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enhancePrompt"
                checked={enhancePrompt}
                onChange={(e) => setEnhancePrompt(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
              />
              <label htmlFor="enhancePrompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Enhance prompt automatically
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  Generating your avatar... This may take a minute.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || loadingStyles}
              className="px-6 py-3 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Avatar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


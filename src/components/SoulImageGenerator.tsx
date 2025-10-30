'use client';

import { useState, useEffect } from 'react';
import {
  getSoulStyles,
  generateSoulImageAndWait,
  type SoulStyle,
  type Text2ImageSoulParams,
} from '@/actions/soul-actions';
import { saveAvatar } from '@/actions/avatar-actions';

export default function SoulImageGenerator() {
  const [styles, setStyles] = useState<SoulStyle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('464ea177-8d40-4940-8d9d-b438bab269c7');
  const [widthAndHeight, setWidthAndHeight] = useState<Text2ImageSoulParams['width_and_height']>('1152x2048');
  const [quality, setQuality] = useState<'720p' | '1080p'>('1080p');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [batchSize, setBatchSize] = useState<1 | 4>(1);

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
    loadStyles();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const params: Text2ImageSoulParams = {
        prompt: prompt.trim(),
        width_and_height: widthAndHeight,
        quality,
        enhance_prompt: enhancePrompt,
        style_id: selectedStyleId,
        style_strength: 1,
        batch_size: batchSize,
      };

      console.log('Generating image with params:', params);
      const result = await generateSoulImageAndWait(params);

      const imageUrl = result.job.results?.raw?.url;
      const thumbnailUrl = result.job.results?.min?.url;

      if (imageUrl || thumbnailUrl) {
        const finalImageUrl = imageUrl || thumbnailUrl!;
        setGeneratedImage(finalImageUrl);

        // Save to database
        try {
          const selectedStyle = styles.find((s) => s.id === selectedStyleId);
          await saveAvatar({
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
        } catch (saveError) {
          console.error('Failed to save avatar to database:', saveError);
          // Don't show error to user, just log it
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

  return (
    <div className="flex flex-col gap-8">
      {/* Form Section */}
      <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Generate Soul Image
        </h2>

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
              placeholder="Describe the image you want to generate..."
              rows={3}
              required
              className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white resize-none"
            />
          </div>

          {/* Style Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="style" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Style
            </label>
            {loadingStyles ? (
              <p className="text-sm text-zinc-500">Loading styles...</p>
            ) : (
              <select
                id="style"
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              >
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
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
              className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
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

          {/* Quality and Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="quality" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Quality
              </label>
              <select
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value as '720p' | '1080p')}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="batchSize" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Batch Size
              </label>
              <select
                id="batchSize"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value) as 1 | 4)}
                className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              >
                <option value="1">1 image</option>
                <option value="4">4 images</option>
              </select>
            </div>
          </div>

          {/* Enhance Prompt Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enhancePrompt"
              checked={enhancePrompt}
              onChange={(e) => setEnhancePrompt(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            <label htmlFor="enhancePrompt" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Enhance prompt automatically
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || loadingStyles}
            className="px-6 py-3 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Generating your image... This may take a minute.
          </p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImage && !loading && (
        <div className="flex flex-col gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Generated Image
          </h2>
          <div className="relative w-full overflow-hidden rounded-lg">
            <img
              src={generatedImage}
              alt={prompt}
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <a
              href={generatedImage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Open in New Tab
            </a>
            <button
              onClick={() => {
                setGeneratedImage(null);
                setPrompt('');
              }}
              className="px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


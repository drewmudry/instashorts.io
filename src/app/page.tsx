'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';


export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingMotions, setLoadingMotions] = useState(true);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/app');
    }
  }, [status, router]);


  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
        </div>
      </div>
    );
  }

  // Don't render landing page if authenticated (will redirect)
  if (session) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Content Overlay */}
      <div className="relative z-10">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xl font-bold">🎬</span>
                </div>
                <h1 className="text-xl font-bold text-black dark:text-white">
                  InstaShorts
                </h1>
              </div>

              <AuthButton />
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black dark:text-white mb-6 tracking-tight">
              Create Stunning
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                AI Avatars
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-black/70 dark:text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your ideas into beautiful AI-powered avatars with Higgsfield Soul.
              Professional quality in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => router.push('/signin')}
                className="group relative px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                <span className="flex items-center gap-2">
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
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Get Started
                </span>
              </button>

              <button
                onClick={() => router.push('/signin')}
                className="px-8 py-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm text-black dark:text-white rounded-full font-semibold text-lg hover:bg-white/30 dark:hover:bg-black/30 transition-all border border-black/10 dark:border-white/10"
              >
                Sign In
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-black/10 dark:border-white/10">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Lightning Fast
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Generate professional avatars in seconds with cutting-edge AI
                </p>
              </div>

              <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-black/10 dark:border-white/10">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Multiple Styles
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Choose from various artistic styles to match your vision
                </p>
              </div>

              <div className="bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-black/10 dark:border-white/10">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  HD Quality
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Get stunning 1080p results perfect for any platform
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Motions Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-4">
                Dynamic Motions
              </h2>
              <p className="text-lg text-black/70 dark:text-white/70 max-w-2xl mx-auto">
                Bring your avatars to life with our collection of AI-powered motion presets
              </p>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/signin')}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-2xl"
              >
                Start Creating Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface SignInModalProps {
  trigger?: React.ReactNode;
}

export function SignInModal({ trigger }: SignInModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await authClient.signUp.email({
          email,
          password,
          name,
        });
      } else {
        await authClient.signIn.email({
          email,
          password,
        });
      }
      setIsOpen(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      setError(err?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
      });
    } catch (err: any) {
      setError(err?.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          Sign In
        </Button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:bg-zinc-900 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                {isSignUp ? "Sign Up" : "Sign In"}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {isSignUp
                  ? "Create an account to get started"
                  : "Welcome back! Please sign in to continue"}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-500">OR</span>
              <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              Continue with Google
            </Button>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-primary hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Review() {
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch('/api/review');
        if (!response.ok) {
          throw new Error('Failed to fetch review data');
        }
        const data = await response.json();
        setReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191414] p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1DB954]/20 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-[#1DB954]/10 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#191414] p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg">
            <h2 className="text-red-800 dark:text-red-200 text-xl font-bold">Error</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191414] p-8">
      <main className="max-w-2xl mx-auto relative">
        <button
          onClick={() => router.push('/')}
          className="absolute -left-16 top-0 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-[#1DB954]/10 transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="bg-[#121212] dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-[#1DB954] dark:border-[#1DB954]">
          <h1 className="text-3xl font-bold text-[#1DB954] dark:text-white mb-6">
            Audio Analysis Results
          </h1>
          
          <div className="space-y-6">
            {review && Object.entries(review).map(([key, value]) => (
              <div key={key} className="border-b border-[#1DB954] dark:border-[#1DB954]/20 pb-4">
                <h2 className="text-lg font-semibold text-[#1DB954] dark:text-[#1DB954] mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </h2>
                <p className="text-[#B3B3B3] dark:text-[#B3B3B3]">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

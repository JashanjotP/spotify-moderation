'use client';
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Audio File Upload
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your audio file for processing
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form className="space-y-6">
            <div className="flex flex-col items-center justify-center w-full">
              <label 
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Image
                    src="/upload.svg"
                    alt="Upload icon"
                    width={64}
                    height={64}
                    className="mb-4 dark:invert"
                  />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP3 or MP4 files only
                  </p>
                </div>
                <input 
                  id="audio-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".mp3,.mp4"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Submit for Processing
              </button>
              
              <button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                onClick={() => window.open('https://www.make.com', '_blank')}
              >
                Request Human Review
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Need help? Contact our support team
        </div>
      </main>
    </div>
  );
}

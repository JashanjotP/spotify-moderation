'use client';

import Image from "next/image";
import { useState, DragEvent } from "react";
import { useRouter } from 'next/navigation';
 
export default function Home() {

  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
 
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
 
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
 
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
 
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
 
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.includes('audio/mp3') || file.type.includes('audio/mp4') || 
          file.name.endsWith('.mp3') || file.name.endsWith('.mp4')) {
        console.log('File dropped:', file);
        setFilename(file.name);
      } else {
        alert('Please upload only MP3 or MP4 files');
      }
    }
  };
 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.includes('audio/mp3') || file.type.includes('audio/mp4') || 
          file.name.endsWith('.mp3') || file.name.endsWith('.mp4')) {
        console.log('File selected:', file);
        setFilename(file.name);
      } else {
        alert('Please upload only MP3 or MP4 files');
        e.target.value = ''; // Clear the input
      }
    }
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename) {
      alert('Please select an audio file first');
      return;
    }
  
    setIsProcessing(true);
  
    try {
      const fileInput = document.getElementById("audio-upload") as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        alert("No file found");
        return;
      }
  
      const formData = new FormData();
      formData.append("audio", fileInput.files[0]);
  
      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
      console.log("Transcription Response:", result);
  
      // Navigate to the review page
      //router.push('/review');
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
 
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-blue-900 p-8">
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-4">
            Audio Processor
          </h1>
          <p className="text-indigo-700 dark:text-blue-300 text-lg">
            Upload your audio file for instant processing
          </p>
        </div>
 
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-indigo-100 dark:border-blue-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center justify-center w-full">
              <label 
                htmlFor="audio-upload"
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : filename 
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600' 
                      : 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-700'}
                  hover:bg-indigo-100 dark:hover:bg-indigo-800/30`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {filename ? (
                    <>
                      <div className="w-16 h-16 mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="mb-1 text-md font-medium text-green-600 dark:text-green-400">
                        File selected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                        {filename}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <p className="mb-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        <span className="font-bold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                        MP3 or MP4 audio files
                      </p>
                    </>
                  )}
                </div>
                <input 
                  id="audio-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".mp3,.mp4"
                  onChange={handleFileChange}
                />
              </label>
            </div>
 
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={!filename || isProcessing}
                className={`w-full font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center
                  ${!filename 
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                    : isProcessing
                      ? 'bg-indigo-500 text-white cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Process Audio File'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, DragEvent } from "react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

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
    setError('');

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.includes('audio/mp3') || file.type.includes('audio/mp4') ||
          file.type.includes('audio/mpeg') ||
          file.name.endsWith('.mp3') || file.name.endsWith('.mp4')) {
        console.log('File dropped:', file);
        setFilename(file.name);
      } else {
        setError('Please upload only MP3 or MP4 files');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.includes('audio/mp3') || file.type.includes('audio/mp4') ||
          file.type.includes('audio/mpeg') ||
          file.name.endsWith('.mp3') || file.name.endsWith('.mp4')) {
        console.log('File selected:', file);
        setFilename(file.name);
      } else {
        setError('Please upload only MP3 or MP4 files');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!filename) {
      setError('Please select an audio file first');
      return;
    }

    setIsProcessing(true);

    try {
      const fileInput = document.getElementById("audio-upload") as HTMLInputElement;
      if (!fileInput.files || fileInput.files.length === 0) {
        throw new Error("No file found");
      }

      const formData = new FormData();
      formData.append("audio", fileInput.files[0]);

      // Get transcription and moderation results from transcribe-audio endpoint
      const transcriptionResponse = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
      }

      const result = await transcriptionResponse.json();

      // Set the transcription and moderation results
      setTranscriptionResult({
        text: result.text,
        problematic_sections: result.flaskResponse.problematic_sections,
        misinformation_sections: result.flaskResponse.misinformation_sections,
        timestamp: result.flaskResponse.timestamp
      });
      
      setShowModal(true);
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error instanceof Error ? error.message : 'Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!transcriptionResult?.text) return;
    
    const element = document.createElement("a");
    const file = new Blob([transcriptionResult.text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "transcript.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-[#191414] p-8">
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Audio Content Moderator
          </h1>
          <p className="text-lg text-[#B3B3B3]">
            Upload your audio file to check for problematic content
          </p>
        </div>

        <div className="bg-[#121212] rounded-xl shadow-lg p-8 border border-[#1DB954]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center justify-center w-full">
              <label
                htmlFor="audio-upload"
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                  ${isDragging
                    ? 'border-[#1DB954] bg-[#191414]'
                    : filename
                      ? 'border-[#1DB954] bg-[#1DB954]/20'
                      : 'border-[#1DB954] bg-[#121212]'}
                  hover:border-[#1DB954] hover:bg-[#191414]/10`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 space-y-4">
                  {filename ? (
                    <>
                      <div className="w-16 h-16 mb-3 rounded-full bg-[#1DB954]/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-md font-medium text-[#1DB954]">File selected</p>
                      <p className="text-sm text-[#B3B3B3] bg-[#1DB954]/10 px-3 py-1 rounded-full">
                        {filename}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mb-3 rounded-full bg-[#191414] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-white">
                        <span className="font-bold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-[#1DB954] bg-[#191414]/20 px-3 py-1 rounded-full">
                        MP3 or MP4 audio files
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="audio-upload"
                  type="file"
                  className="hidden"
                  accept="audio/mp3,audio/mp4,audio/mpeg,.mp3,.mp4"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-100/10 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={!filename || isProcessing}
                className={`w-full font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center
                  ${!filename
                    ? 'bg-[#555555] text-[#888888] cursor-not-allowed'
                    : isProcessing
                      ? 'bg-[#1DB954] text-white cursor-wait'
                      : 'bg-gradient-to-r from-[#ff007f] via-[#800080] to-[#1e3a8a] hover:bg-gradient-to-r hover:from-[#ff007f] hover:via-[#800080] hover:to-[#1e3a8a]/80 text-white'}`}
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

        {showModal && transcriptionResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#121212] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 border border-[#1DB954]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-[#B3B3B3] hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[#B3B3B3] text-sm">
                    Analysis completed on: {new Date(transcriptionResult.timestamp).toLocaleString()}
                  </p>
                  <button
                    onClick={handleDownloadTranscript}
                    className="text-[#1DB954] hover:text-[#1DB954]/80 text-sm flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Transcript
                  </button>
                </div>

                <div className="bg-[#191414] p-4 rounded-lg">
                  <h3 className="text-[#1DB954] font-semibold mb-2">Problematic Content</h3>
                  {transcriptionResult.problematic_sections?.length > 0 ? (
                    transcriptionResult.problematic_sections.map((section: any, index: number) => (
                      <div key={index} className="mb-4 border-l-2 border-[#1DB954] pl-3">
                        {section.flagged_lines?.map((line: any, lineIndex: number) => (
                          <div key={lineIndex} className="mb-2">
                            <p className="text-white">{line.text}</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {Object.entries(line.flagged_categories).map(([category, data]: [string, any]) => (
                                <span key={category} className="bg-[#1DB954]/20 text-[#1DB954] rounded px-2 py-1 text-sm">
                                  {category.charAt(0).toUpperCase() + category.slice(1)}: {Math.round(data.score * 100)}%
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-[#B3B3B3]">No problematic content detected</p>
                  )}
                </div>

                <div className="bg-[#191414] p-4 rounded-lg">
                  <h3 className="text-[#1DB954] font-semibold mb-2">Misinformation Check</h3>
                  {transcriptionResult.misinformation_sections?.length > 0 ? (
                    transcriptionResult.misinformation_sections.map((section: any, index: number) => (
                      <div key={index} className="mb-4 border-l-2 border-[#1DB954] pl-3">
                        <p className="text-white mb-2">{section.text}</p>
                        <div className="bg-[#1DB954]/10 p-3 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#1DB954] font-medium">Confidence:</span>
                            <span className="bg-[#1DB954]/20 text-[#1DB954] px-2 py-1 rounded text-sm">
                              {Math.round(section.misinformation_details.confidence * 100)}%
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-[#1DB954] font-medium">Explanation:</span>
                            <p className="text-[#B3B3B3] mt-1">{section.misinformation_details.explanation}</p>
                          </div>
                          <div>
                            <span className="text-[#1DB954] font-medium">Correction:</span>
                            <p className="text-[#B3B3B3] mt-1">{section.misinformation_details.correction}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#B3B3B3]">No misinformation detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
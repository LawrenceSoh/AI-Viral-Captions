import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import PlatformSelector from './components/PlatformSelector';
import ResultsDisplay from './components/ResultsDisplay';
import DocumentationModal from './components/DocumentationModal';
import AdUnit from './components/AdUnit';
import { Platform, GeneratedPlatformContent } from './types';
import { generateCaptions } from './services/geminiService';
import { Sparkles, Loader2, PenTool } from 'lucide-react';
import { LOADING_MESSAGES } from './constants';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  // Default to all platforms selected
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    Platform.TikTok, 
    Platform.Instagram, 
    Platform.Facebook
  ]);
  const [context, setContext] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedPlatformContent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDocOpen, setIsDocOpen] = useState(false);
  
  // Fun loading state message cycler
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isGenerating) {
        interval = window.setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!videoFile) return;
    if (selectedPlatforms.length === 0) {
        setError("Please select at least one platform.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      const generatedData = await generateCaptions(videoFile, context, selectedPlatforms);
      setResults(generatedData);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-gray-100 selection:bg-indigo-500/30">
      
      <DocumentationModal isOpen={isDocOpen} onClose={() => setIsDocOpen(false)} />

      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0f0f11]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                AI Viral Captions
            </span>
          </div>
          <button 
            onClick={() => setIsDocOpen(true)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Documentation
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        
        {/* Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Turn Videos into <span className="text-indigo-400">Viral Vibes</span>
            </h1>
            <p className="text-lg text-gray-400">
                Upload your raw video. We'll watch, listen, and write the perfect captions & tags for every platform.
            </p>
        </div>

        {/* Input Section */}
        <div className="bg-[#16161a] border border-gray-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
            
            {/* Step 1: Upload */}
            <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold ring-1 ring-indigo-500/50">1</span>
                    <h2 className="text-lg font-semibold text-white">Upload Footage</h2>
                </div>
                <VideoUploader file={videoFile} onFileChange={setVideoFile} />
            </div>

            {/* Step 2: Configure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-800/50">
                
                {/* Context Input */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold ring-1 ring-indigo-500/50">2</span>
                         <label htmlFor="context" className="text-lg font-semibold text-white">Vibe Check (Optional)</label>
                    </div>
                    <p className="text-sm text-gray-400">Tell us the goal or tone. e.g. "Funny fail video" or "Professional real estate tour".</p>
                    <div className="relative">
                        <PenTool className="absolute top-3 left-3 text-gray-500" size={16} />
                        <textarea
                            id="context"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Add extra context here..."
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
                        />
                    </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                     <div className="flex items-center space-x-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold ring-1 ring-indigo-500/50">3</span>
                         <h2 className="text-lg font-semibold text-white">Select Channels</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">We'll customize the output for each.</p>
                    <PlatformSelector 
                        selectedPlatforms={selectedPlatforms} 
                        onChange={setSelectedPlatforms} 
                    />
                </div>
            </div>

            {/* Action Area */}
            <div className="pt-6 border-t border-gray-800/50 flex flex-col items-center">
                 {error && (
                    <div className="mb-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                        {error}
                    </div>
                 )}
                
                <button
                    onClick={handleGenerate}
                    disabled={!videoFile || isGenerating || selectedPlatforms.length === 0}
                    className={`
                        w-full md:w-auto px-12 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0
                        ${!videoFile || isGenerating || selectedPlatforms.length === 0
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
                        }
                    `}
                >
                    {isGenerating ? (
                        <div className="flex items-center space-x-2">
                             <Loader2 className="animate-spin" />
                             <span>{LOADING_MESSAGES[loadingMessageIndex]}</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Sparkles size={20} />
                            <span>Generate Content</span>
                        </div>
                    )}
                </button>
            </div>
        </div>

        {/* Results Section */}
        {results && (
             <div id="results">
                <ResultsDisplay results={results} />
             </div>
        )}

        {/* Discreet Advertisement */}
        <AdUnit />

      </main>
      
      {/* Simple Footer */}
      <footer className="border-t border-gray-800 mt-20 py-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} AI Viral Captions. Powered by Google Gemini 2.5.</p>
      </footer>
    </div>
  );
};

export default App;
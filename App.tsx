import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, FileText, Send } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ProductForm from './components/ProductForm';
import PlatformSelector from './components/PlatformSelector';
import OutputTypeSelector from './components/OutputTypeSelector';
import FrameworkSelector from './components/FrameworkSelector';
import ResultsDisplay from './components/ResultsDisplay';
import DocumentationModal from './components/DocumentationModal';
import { Platform, OutputType, Framework, ProductBrief, GenerationResponse } from './types';
import { generateContent } from './services/geminiService';
import { LOADING_MESSAGES } from './constants';

const StepBadge: React.FC<{ n: number }> = ({ n }) => (
  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold ring-1 ring-indigo-500/50">
    {n}
  </span>
);

const App: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const [brief, setBrief] = useState<ProductBrief>({
    targetAudience: '',
    productName: '',
    productDescription: '',
    sellingPoints: [''],
    callToAction: '',
    brandVoice: '',
  });
  // Empty = Auto (AI recommends). Otherwise force these framework(s).
  const [frameworkOverride, setFrameworkOverride] = useState<Framework[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    Platform.TikTok,
    Platform.Instagram,
    Platform.Facebook,
  ]);
  const [outputTypes, setOutputTypes] = useState<OutputType[]>([
    OutputType.VideoScript,
    OutputType.Caption,
    OutputType.AdCopy,
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDocOpen, setIsDocOpen] = useState(false);
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

  const canGenerate =
    images.length > 0 &&
    brief.productName.trim() &&
    brief.productDescription.trim() &&
    selectedPlatforms.length > 0 &&
    outputTypes.length > 0 &&
    !isGenerating;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResults(null);
    try {
      const data = await generateContent(brief, images, selectedPlatforms, outputTypes, frameworkOverride);
      setResults(data);
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
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
              AI Viral Copy
            </span>
          </div>
          <button
            onClick={() => setIsDocOpen(true)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            How it works
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Product Photos into <span className="text-indigo-400">Viral Copy</span>
          </h1>
          <p className="text-lg text-gray-400">
            Upload your product images, add a quick brief, and let AI pick the best copywriting
            framework — then write your scripts, captions, and ads.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-[#16161a] border border-gray-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
          {/* Step 1: Images */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <StepBadge n={1} />
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-gray-400" /> Upload Product Photos
              </h2>
            </div>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* Step 2: Brief */}
          <div className="space-y-4 pt-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3">
              <StepBadge n={2} />
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={18} className="text-gray-400" /> Product Brief
              </h2>
            </div>
            <ProductForm brief={brief} onChange={setBrief} />
          </div>

          {/* Step 3: Channels + outputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-800/50">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <StepBadge n={3} />
                <h2 className="text-lg font-semibold text-white">Select Channels</h2>
              </div>
              <p className="text-sm text-gray-400 mb-2">We tune the copy for each platform.</p>
              <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <StepBadge n={4} />
                <h2 className="text-lg font-semibold text-white">What to Generate</h2>
              </div>
              <p className="text-sm text-gray-400 mb-2">Pick one or more output types.</p>
              <OutputTypeSelector selected={outputTypes} onChange={setOutputTypes} />
            </div>
          </div>

          {/* Step 5: Framework */}
          <div className="space-y-3 pt-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3">
              <StepBadge n={5} />
              <h2 className="text-lg font-semibold text-white">Copywriting Framework</h2>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Let the AI pick the highest-converting framework, or force your own.
            </p>
            <FrameworkSelector selected={frameworkOverride} onChange={setFrameworkOverride} />
          </div>

          {/* Action */}
          <div className="pt-6 border-t border-gray-800/50 flex flex-col items-center">
            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`w-full md:w-auto px-12 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                !canGenerate
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="animate-spin" />
                  <span>{LOADING_MESSAGES[loadingMessageIndex]}</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Send size={20} />
                  <span>Generate Copy</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div id="results">
            <ResultsDisplay data={results} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-20 py-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} AI Viral Copy. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;

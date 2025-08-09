'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ApiKeyManager from '@/components/ApiKeyManager';
import { Sparkles, Presentation, Users, Zap, Calendar, Settings } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useLocalStorage('openai_api_key', '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    if (!loading && (!apiKey || apiKey.trim() === '')) {
      setShowApiKeyModal(true);
    }
  }, [apiKey, loading]);

  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing loading to false');
        // Force loading to false after 10 seconds
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleGenerateSlides = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    if (!apiKey || apiKey.trim() === '') {
      setShowApiKeyModal(true);
      return;
    }
    
    if (!prompt.trim()) return;
    
    router.push(`/generate?prompt=${encodeURIComponent(prompt)}&type=presentation`);
  };

  const handleApiKeySet = (key: string) => {
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Presentation className="h-8 w-8 text-teal-600" />
              <span className="text-xl font-bold text-gray-900">SlideGen AI</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button 
                    onClick={() => router.push('/planner')} 
                    variant="ghost"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Day Planner
                  </Button>
                  <Button 
                    onClick={() => setShowApiKeyModal(true)} 
                    variant="ghost"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    API Key
                  </Button>
                  <Button 
                    onClick={() => router.push('/dashboard')} 
                    variant="outline"
                    size="sm"
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <Button onClick={() => router.push('/auth')} variant="outline">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyManager
          showModal={true}
          onApiKeySet={handleApiKeySet}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Stunning
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
              {' '}AI-Powered{' '}
            </span>
            Presentations
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your ideas into professional slide decks in seconds. Just describe what you want, 
            and our AI will create beautiful, engaging presentations for you.
          </p>
          
          {!apiKey && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-blue-800 text-sm">
                <strong>🚀 Get AI-Powered Presentations:</strong> Enter your OpenAI API key to generate truly personalized, intelligent presentations. 
                <button 
                  onClick={() => setShowApiKeyModal(true)}
                  className="underline hover:no-underline ml-1 font-medium"
                >
                  Add your API key now
                </button>
              </p>
              <p className="text-blue-700 text-xs mt-2">
                💡 Or use <code className="bg-blue-100 px-1 rounded">demo-key</code> to try the basic features
              </p>
            </div>
          )}
          
          {apiKey && apiKey !== 'demo-key' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-green-800 text-sm">
                ✅ <strong>OpenAI API Connected!</strong> You're ready to generate intelligent, personalized presentations.
              </p>
            </div>
          )}
          
          {apiKey === 'demo-key' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-amber-800 text-sm">
                🎭 <strong>Demo Mode:</strong> You're using basic templates. 
                <button 
                  onClick={() => setShowApiKeyModal(true)}
                  className="underline hover:no-underline ml-1 font-medium"
                >
                  Add your OpenAI API key
                </button> for AI-powered, personalized presentations.
              </p>
            </div>
          )}
        </div>

        {/* Main Input */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What presentation would you like to create?
                </label>
                <textarea
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Create a presentation about sustainable energy solutions for businesses, including solar power, wind energy, and cost benefits..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <Button 
                  onClick={handleGenerateSlides}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                  disabled={!prompt.trim()}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Slides
                </Button>
                {user && (
                  <Button 
                    onClick={() => router.push('/planner')}
                    size="lg"
                    variant="outline"
                    className="border-teal-300 text-teal-700 hover:bg-teal-50"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Day Planner
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Generate professional presentations in under 30 seconds</p>
          </Card>
          
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Presentation className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Export Ready</h3>
            <p className="text-gray-600">Download as PowerPoint or present directly in browser</p>
          </Card>
          
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">Chat with AI to refine and customize your slides</p>
          </Card>
        </div>

        {/* Enhanced Features Preview */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ✨ AI-Powered Visual Design
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="font-bold mb-2">Smart Color Themes</h3>
              <p className="text-sm text-gray-600">AI selects perfect colors based on your topic</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="font-bold mb-2">Dynamic Images</h3>
              <p className="text-sm text-gray-600">Relevant high-quality images for every slide</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-bold mb-2">Modern Layouts</h3>
              <p className="text-sm text-gray-600">Hero slides, split layouts, and visual stats</p>
            </div>
          </div>
        </div>

        {/* Sample Prompts */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Try These Enhanced Prompts
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Create a stunning presentation about artificial intelligence and machine learning",
              "Design beautiful slides about sustainable business practices and green technology",
              "Generate a modern presentation on digital transformation in healthcare",
              "Create visually appealing slides about creative design and innovation trends"
            ].map((samplePrompt, index) => (
              <button
                key={index}
                onClick={() => setPrompt(samplePrompt)}
                className="text-left p-4 bg-gradient-to-r from-white/80 to-white/60 rounded-lg border border-gray-200 hover:from-white/90 hover:to-white/80 hover:border-teal-300 transition-all duration-200 hover:shadow-md"
              >
                <p className="text-sm text-gray-700 font-medium">{samplePrompt}</p>
                <p className="text-xs text-teal-600 mt-2">✨ Enhanced with AI styling</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
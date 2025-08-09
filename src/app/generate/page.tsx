'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateSlides, generateDayPlanner } from '@/lib/openai';
import { createProject } from '@/lib/firestore';
import { Loader2, AlertCircle, Sparkles, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GeneratePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiKey] = useLocalStorage('openai_api_key', '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!apiKey) {
      router.push('/');
      return;
    }

    const prompt = searchParams.get('prompt');
    const type = searchParams.get('type') || 'presentation';
    
    if (!prompt) {
      router.push('/');
      return;
    }

    generateContent(prompt, type as 'presentation' | 'planner');
  }, [user, apiKey, searchParams, router]);

  const generateContent = async (prompt: string, type: 'presentation' | 'planner') => {
    let progressInterval: NodeJS.Timeout;
    
    try {
      setLoading(true);
      setError('');
      setProgress(10);
      setCurrentStep('Connecting to AI...');

      // Simulate progress updates
      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 80));
      }, 200); // Faster progress for better UX

      let slideData;
      
      if (apiKey === 'demo-key') {
        setCurrentStep(type === 'planner' ? 'Creating demo daily planner...' : 'Creating demo presentation slides...');
      } else {
        setCurrentStep(type === 'planner' ? 'AI is crafting your personalized daily planner...' : 'AI is generating your custom presentation...');
      }
      
      // Add timeout to slide generation
      slideData = await Promise.race([
        type === 'planner' 
          ? generateDayPlanner(apiKey, [], new Date().toISOString().split('T')[0])
          : generateSlides(apiKey, prompt, false),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Slide generation timeout after 60 seconds')), 60000)
        )
      ]) as any;

      clearInterval(progressInterval);
      setProgress(90);
      setCurrentStep('Saving your project...');

      let projectId;
      try {
        // Try to save to Firestore with timeout
        projectId = await Promise.race([
          createProject(user!.uid, slideData.title, prompt, slideData, type),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Save timeout after 10 seconds')), 10000)
          )
        ]) as string;
      } catch (saveError: any) {
        console.error('Failed to save project:', saveError);
        
        // Fallback: create a temporary project ID and store in sessionStorage
        projectId = `temp_${Date.now()}`;
        const tempProject = {
          id: projectId,
          userId: user!.uid,
          title: slideData.title,
          prompt,
          slideData,
          type,
          isTemporary: true
        };
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`temp_project_${projectId}`, JSON.stringify(tempProject));
        }
        
        console.log('Using temporary project storage due to save failure');
      }

      setProgress(100);
      if (apiKey === 'demo-key') {
        setCurrentStep('Demo presentation ready!');
      } else {
        setCurrentStep('AI-powered presentation complete!');
      }

      // Small delay to show completion
      setTimeout(() => {
        router.push(`/presentation/${projectId}`);
      }, 800);

    } catch (error: any) {
      console.error('Error generating content:', error);
      
      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Provide specific error messages
      let errorMessage = 'Failed to generate content. Please try again.';
      
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key in settings.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      setProgress(0);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                const prompt = searchParams.get('prompt');
                const type = searchParams.get('type') || 'presentation';
                if (prompt) {
                  generateContent(prompt, type as 'presentation' | 'planner');
                } else {
                  router.push('/');
                }
              }}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              Edit Prompt
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const type = searchParams.get('type') || 'presentation';
  const isPlanner = type === 'planner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          {isPlanner ? (
            <Calendar className="h-16 w-16 text-emerald-600 animate-bounce mx-auto mb-4" />
          ) : (
            <Sparkles className="h-16 w-16 text-teal-600 animate-pulse mx-auto mb-4" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isPlanner ? 'Creating Your Daily Planner' : 'Creating Your Presentation'}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {isPlanner 
            ? 'Our AI is organizing your perfect day...'
            : 'Our AI is crafting beautiful slides for you...'
          }
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-teal-600 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Current Step */}
        <p className="text-sm text-gray-500 mb-8">{currentStep}</p>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-white/60 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Tip:</strong> {isPlanner 
              ? 'Your planner will include time blocks, priorities, and productivity tips.'
              : 'You can customize your slides using the AI chat once they\'re ready!'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getProject, updateProject, Project } from '@/lib/firestore';
import SlideViewer from '@/components/SlideViewer';
import AIChat from '@/components/AIChat';
import { Button } from '@/components/ui/Button';
import { Presentation, ArrowLeft, Loader2, Calendar, Share2, Settings } from 'lucide-react';

interface PresentationPageProps {
  params: {
    id: string;
  };
}

export default function PresentationPage({ params }: PresentationPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [slideData, setSlideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    loadPresentation();
  }, [user, params.id, router]);

  const loadPresentation = async () => {
    try {
      setLoading(true);
      
      // Check for temporary projects first
      if (params.id.startsWith('temp_') && typeof window !== 'undefined') {
        const tempProjectData = sessionStorage.getItem(`temp_project_${params.id}`);
        if (tempProjectData) {
          const tempProject = JSON.parse(tempProjectData);
          setProject(tempProject);
          setSlideData(tempProject.slideData);
          setLoading(false);
          return;
        }
      }
      
      const projectData = await getProject(params.id);

      if (!projectData) {
        setError('Project not found.');
        return;
      }

      if (projectData.userId !== user?.uid) {
        setError('You do not have permission to view this project.');
        return;
      }

      setProject(projectData);
      setSlideData(projectData.slideData);
    } catch (error: any) {
      console.error('Error loading project:', error);
      setError(error.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlideUpdate = async (updatedSlideData: any) => {
    try {
      setSaving(true);
      setSlideData(updatedSlideData);
      
      // Update project in Firestore
      await updateProject(params.id, {
        slideData: updatedSlideData,
        slideCount: updatedSlideData.slides?.length || 0
      });

      // Update local project state
      if (project) {
        setProject({
          ...project,
          slideData: updatedSlideData,
          slideCount: updatedSlideData.slides?.length || 0
        });
      }
    } catch (error: any) {
      console.error('Error updating slides:', error);
      alert('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getProjectIcon = () => {
    return project?.type === 'planner' ? Calendar : Presentation;
  };

  const getProjectTypeColor = () => {
    return project?.type === 'planner' ? 'text-emerald-600' : 'text-teal-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Presentation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Create New Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!slideData || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No project data found.</p>
        </div>
      </div>
    );
  }

  const IconComponent = getProjectIcon();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <IconComponent className={`h-6 w-6 ${getProjectTypeColor()}`} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {slideData.title || 'Untitled Project'}
                </h1>
                <p className="text-sm text-gray-500 capitalize">
                  {project.type} • {project.slideCount} slides
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {saving && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </div>
            )}
            
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              variant="outline"
              size="sm"
              className={isChatOpen ? 'bg-teal-50 border-teal-300' : ''}
            >
              <Settings className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>

            <Button
              onClick={() => {
                // TODO: Implement sharing functionality
                alert('Sharing feature coming soon!');
              }}
              variant="outline"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        <SlideViewer
          slideData={slideData}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          projectType={project.type}
        />
        
        <AIChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          slideData={slideData}
          onSlideUpdate={handleSlideUpdate}
          projectType={project.type}
        />
      </div>
    </div>
  );
}
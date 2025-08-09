'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getUserProjects, deleteProject, getUserStats, Project } from '@/lib/firestore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Presentation, Plus, Calendar, Trash2, Eye, LogOut, Search, Filter, BarChart3, Settings, RefreshCw, Wifi } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'presentation' | 'planner'>('all');
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    loadProjects();
    loadStats();
  }, [user, router]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, filterType]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      let allProjects: Project[] = [];
      
      // Load Firestore projects
      try {
        const userProjects = await getUserProjects(user!.uid);
        allProjects = [...userProjects];
      } catch (firestoreError) {
        console.warn('Failed to load Firestore projects:', firestoreError);
      }
      
      // Load local projects from localStorage
      if (typeof window !== 'undefined') {
        try {
          const localProjects = JSON.parse(localStorage.getItem('local_projects') || '[]');
          const userLocalProjects = localProjects.filter((p: any) => p.userId === user!.uid);
          allProjects = [...allProjects, ...userLocalProjects];
        } catch (localError) {
          console.warn('Failed to load local projects:', localError);
        }
        
        // Load temporary projects from sessionStorage
        try {
          const sessionKeys = Object.keys(sessionStorage);
          const tempProjectKeys = sessionKeys.filter(key => key.startsWith('temp_project_'));
          
          for (const key of tempProjectKeys) {
            try {
              const tempProject = JSON.parse(sessionStorage.getItem(key) || '{}');
              if (tempProject.userId === user!.uid) {
                // Convert temp project to proper format
                const formattedTempProject = {
                  ...tempProject,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  slideCount: tempProject.slideData?.slides?.length || 0,
                  isTemporary: true
                };
                allProjects.push(formattedTempProject);
              }
            } catch (tempError) {
              console.warn('Failed to parse temp project:', tempError);
            }
          }
        } catch (sessionError) {
          console.warn('Failed to load temporary projects:', sessionError);
        }
      }
      
      // Sort projects by creation date (newest first)
      allProjects.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : 
                     (a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : new Date(0));
        const dateB = b.createdAt instanceof Date ? b.createdAt : 
                     (b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : new Date(0));
        return dateB.getTime() - dateA.getTime();
      });
      
      setProjects(allProjects);
    } catch (error: any) {
      console.error('Dashboard load error:', error);
      setError(error.message || 'Failed to load projects. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userStats = await getUserStats(user!.uid);
      setStats(userStats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Set default stats if offline
      setStats({
        totalProjects: 0,
        totalSlides: 0,
        presentationCount: 0,
        plannerCount: 0,
        recentProjects: []
      });
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(project => project.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        // Handle temporary projects
        if (projectId.startsWith('temp_')) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`temp_project_${projectId}`);
          }
        }
        // Handle local projects
        else if (projectId.startsWith('local_')) {
          if (typeof window !== 'undefined') {
            const localProjects = JSON.parse(localStorage.getItem('local_projects') || '[]');
            const updatedProjects = localProjects.filter((p: any) => p.id !== projectId);
            localStorage.setItem('local_projects', JSON.stringify(updatedProjects));
          }
        }
        // Handle Firestore projects
        else {
          await deleteProject(projectId, user!.uid);
        }
        
        await loadProjects();
        await loadStats();
      } catch (error: any) {
        alert('Failed to delete project: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatProjectDate = (date: any) => {
    if (!date) return 'Unknown';
    
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), 'MMM d, yyyy');
      }
      // Handle regular Date object
      if (date instanceof Date) {
        return format(date, 'MMM d, yyyy');
      }
      // Handle date string
      if (typeof date === 'string') {
        return format(new Date(date), 'MMM d, yyyy');
      }
      return 'Unknown';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getProjectTypeIcon = (type: string) => {
    return type === 'planner' ? Calendar : Presentation;
  };

  const getProjectTypeColor = (type: string) => {
    return type === 'planner' ? 'text-emerald-600' : 'text-teal-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
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
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <Button onClick={() => router.push('/planner')} variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Day Planner
              </Button>
              <Button onClick={() => router.push('/')} variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Presentation className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Slides</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSlides}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Presentation className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Presentations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.presentationCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Planners</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.plannerCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage and create your AI-powered presentations and planners
            </p>
          </div>
          <Button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All Projects</option>
              <option value="presentation">Presentations</option>
              <option value="planner">Planners</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
              <Button
                onClick={() => {
                  loadProjects();
                  loadStats();
                }}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-amber-600" />
              <p className="text-amber-800">
                You're currently offline. You can view cached projects, but creating new ones requires an internet connection.
              </p>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Presentation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first AI-powered project to get started'
              }
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const IconComponent = getProjectTypeIcon(project.type);
              return (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {project.title || 'Untitled Project'}
                      </CardTitle>
                      <IconComponent className={`h-5 w-5 ${getProjectTypeColor(project.type)} ml-2 flex-shrink-0`} />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Created {formatProjectDate(project.createdAt)}</span>
                    </div>
                    {project.updatedAt && formatProjectDate(project.updatedAt) !== formatProjectDate(project.createdAt) && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Updated {formatProjectDate(project.updatedAt)}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {project.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>{project.slideCount || 0} slides</span>
                      <div className="flex items-center space-x-2">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded-full">
                          {project.type}
                        </span>
                        {(project as any).isTemporary && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                            Temp
                          </span>
                        )}
                        {(project as any).isLocal && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            Local
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => router.push(`/presentation/${project.id}`)}
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  prompt: string;
  slideData: any;
  slideCount: number;
  type: 'presentation' | 'planner';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  thumbnail?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  projectCount: number;
  preferences?: {
    defaultTheme?: string;
    autoSave?: boolean;
  };
}

// Project Management
export const createProject = async (
  userId: string, 
  title: string, 
  prompt: string, 
  slideData: any,
  type: 'presentation' | 'planner' = 'presentation'
): Promise<string> => {
  try {
    const projectData = {
      userId,
      title,
      description: slideData.description || '',
      prompt,
      slideData,
      slideCount: slideData.slides?.length || 0,
      type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add timeout to Firestore operations
    const docRef = await Promise.race([
      addDoc(collection(db, 'projects'), projectData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout after 15 seconds')), 15000)
      )
    ]) as any;
    
    // Update user project count (don't fail if this fails)
    try {
      await Promise.race([
        updateDoc(doc(db, 'users', userId), {
          projectCount: increment(1)
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User update timeout')), 5000)
        )
      ]);
    } catch (updateError) {
      console.warn('Failed to update user project count:', updateError);
    }

    return docRef.id;
  } catch (error: any) {
    console.error('Error creating project:', error);
    
    // Fallback: save to localStorage if Firestore fails
    if (typeof window !== 'undefined') {
      const fallbackId = `local_${Date.now()}`;
      const localProject = {
        id: fallbackId,
        userId,
        title,
        description: slideData.description || '',
        prompt,
        slideData,
        slideCount: slideData.slides?.length || 0,
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocal: true
      };
      
      try {
        const existingProjects = JSON.parse(localStorage.getItem('local_projects') || '[]');
        existingProjects.push(localProject);
        localStorage.setItem('local_projects', JSON.stringify(existingProjects));
        
        console.log('Project saved locally due to Firestore error');
        return fallbackId;
      } catch (localError) {
        console.error('Failed to save locally as well:', localError);
      }
    }
    
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      throw new Error('Cannot create project while offline. Please check your internet connection.');
    }
    
    throw new Error('Failed to create project. Please try again.');
  }
};

export const updateProject = async (
  projectId: string, 
  updates: Partial<Project>
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
};

export const deleteProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    
    // Update user project count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      projectCount: increment(-1)
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  // Check if it's a local project first
  if (projectId.startsWith('local_') && typeof window !== 'undefined') {
    try {
      const localProjects = JSON.parse(localStorage.getItem('local_projects') || '[]');
      const localProject = localProjects.find((p: any) => p.id === projectId);
      if (localProject) {
        return localProject;
      }
    } catch (error) {
      console.error('Error getting local project:', error);
    }
  }

  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await Promise.race([
      getDoc(docRef),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 10000)
      )
    ]) as any;
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    throw new Error('Failed to get project');
  }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    
    return projects;
  } catch (error: any) {
    console.error('Error getting user projects:', error);
    
    // Handle offline scenarios
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.log('Working offline - returning empty projects list');
      return [];
    }
    
    throw new Error('Failed to get projects. Please check your internet connection.');
  }
};

// User Profile Management
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

export const updateUserProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

// Analytics and Statistics
export const getUserStats = async (userId: string) => {
  try {
    const projects = await getUserProjects(userId);
    const totalSlides = projects.reduce((sum, project) => sum + project.slideCount, 0);
    const presentationCount = projects.filter(p => p.type === 'presentation').length;
    const plannerCount = projects.filter(p => p.type === 'planner').length;
    
    return {
      totalProjects: projects.length,
      totalSlides,
      presentationCount,
      plannerCount,
      recentProjects: projects.slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error('Failed to get user statistics');
  }
};

// Search and Filter
export const searchUserProjects = async (
  userId: string, 
  searchTerm: string
): Promise<Project[]> => {
  try {
    const projects = await getUserProjects(userId);
    
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching projects:', error);
    throw new Error('Failed to search projects');
  }
};

export const getProjectsByType = async (
  userId: string, 
  type: 'presentation' | 'planner'
): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    
    return projects;
  } catch (error) {
    console.error('Error getting projects by type:', error);
    throw new Error('Failed to get projects by type');
  }
};
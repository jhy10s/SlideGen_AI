# SlideGen AI - Full-Stack SaaS Presentation Generator

A comprehensive SaaS web application built with Next.js 14 (App Router) that generates professional presentations and daily planners using AI. Features complete authentication, real-time collaboration, and advanced export capabilities.

## 🚀 Features Overview

### Core Functionality
- **AI-Powered Generation**: Create presentations and daily planners using OpenAI GPT-4o
- **Real-time Preview**: Live slide rendering with smooth animations and transitions
- **Interactive AI Chat**: Conversational refinement and customization of content
- **Multi-format Export**: PowerPoint (.pptx) and PDF export capabilities
- **Responsive Design**: Optimized for desktop and mobile devices

### Authentication & Security
- **Firebase Authentication**: Email/password and Google OAuth integration
- **Secure API Key Management**: Client-side storage with validation
- **User Data Protection**: Firestore security rules and data isolation
- **Session Management**: Persistent authentication with automatic refresh

### Advanced Features
- **Day Planner Mode**: AI-generated daily schedules with time management
- **Project Management**: Complete CRUD operations for presentations
- **Search & Filter**: Advanced project discovery and organization
- **Analytics Dashboard**: User statistics and project insights
- **Theme Customization**: Dynamic color schemes and styling

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend & Services
- **Firebase Authentication** for user management
- **Cloud Firestore** for data storage
- **OpenAI API** (GPT-4o) for content generation
- **PptxGenJS** for PowerPoint export

### Development & Testing
- **Jest** for unit testing
- **React Testing Library** for component testing
- **ESLint** for code quality
- **TypeScript** for type safety

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** and npm installed
- **OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Firebase project** (configuration provided)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd slide-generator-saas

# Install dependencies
npm install
```

### 2. Environment Setup

The Firebase configuration is pre-configured in the application. No additional environment variables are required for basic functionality.

### 3. Development Server

```bash
# Start the development server
npm run dev

# Open your browser
# Navigate to http://localhost:3000
```

### 4. First-Time Setup

1. **OpenAI API Key Setup**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - The app will prompt you to enter the key on first use
   - Keys are stored securely in browser localStorage only

2. **Account Creation**
   - Sign up using email/password or Google OAuth
   - Complete profile setup
   - Start creating presentations immediately

## 📖 Detailed Usage Guide

### Creating Presentations

1. **Prompt Input**
   ```
   Example: "Create a presentation about digital marketing strategies 
   for small businesses, including social media, SEO, and content marketing"
   ```

2. **AI Generation Process**
   - GPT-4o analyzes your prompt
   - Generates 5-15 professional slides
   - Includes titles, bullet points, speaker notes
   - Applies appropriate themes and animations

3. **Customization Options**
   - Use AI chat for real-time modifications
   - Change themes, colors, and layouts
   - Add, remove, or reorder slides
   - Update content and speaker notes

### Day Planner Mode

1. **Task Input**
   - Add tasks with time, duration, and priority
   - Set dates and deadlines
   - Include breaks and personal time

2. **AI Optimization**
   - Generates optimized daily schedule
   - Includes productivity tips
   - Suggests time management strategies
   - Creates motivational content

### Export Options

- **PowerPoint (.pptx)**: Full-featured presentations with animations
- **PDF**: Static format for sharing and printing
- **Browser Presentation**: Full-screen mode with keyboard navigation

## 🏗 Project Architecture

### Directory Structure
```
slide-generator-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── generate/          # Content generation
│   │   ├── presentation/[id]/ # Slide viewer/editor
│   │   └── planner/           # Day planner interface
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── SlideViewer.tsx   # Main presentation viewer
│   │   ├── AIChat.tsx        # AI chat interface
│   │   └── ApiKeyManager.tsx # API key management
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/                # Custom React hooks
│   │   └── useLocalStorage.ts # Local storage utilities
│   ├── lib/                  # Core utilities
│   │   ├── firebase.ts       # Firebase configuration
│   │   ├── firestore.ts      # Database operations
│   │   ├── openai.ts         # AI integration
│   │   └── pptx-export.ts    # Export functionality
│   └── __tests__/            # Test files
├── public/                   # Static assets
├── .env.local               # Environment variables
├── jest.config.js           # Testing configuration
└── README.md               # This file
```

### Database Schema (Firestore)

#### Users Collection
```typescript
interface UserProfile {
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
```

#### Projects Collection
```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  prompt: string;
  slideData: SlideData;
  slideCount: number;
  type: 'presentation' | 'planner';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  thumbnail?: string;
}
```

#### Slide Data Structure
```typescript
interface SlideData {
  title: string;
  description?: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
  };
  slides: Slide[];
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Testing Strategy

#### Unit Tests
- Authentication context and hooks
- Component rendering and interactions
- Utility functions and helpers
- API integration functions

#### Integration Tests
- User authentication flows
- Slide generation and editing
- Project management operations
- Export functionality

#### Example Test
```typescript
describe('SlideViewer', () => {
  it('renders slide content correctly', () => {
    render(
      <SlideViewer
        slideData={mockSlideData}
        onToggleChat={mockOnToggleChat}
        isChatOpen={false}
      />
    );

    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});
```

## 🔐 Security Implementation

### API Key Management
- **Client-side Storage**: Keys stored in localStorage only
- **Validation**: Real-time API key validation
- **No Server Storage**: Keys never transmitted to backend
- **User Control**: Easy key management and removal

### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Data Protection
- **User Isolation**: Strict user-based access control
- **Input Sanitization**: All user inputs validated and sanitized
- **Error Handling**: Secure error messages without data leakage
- **Session Security**: Automatic token refresh and validation

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)

1. **Prepare for Deployment**
   ```bash
   npm run build
   npm run test
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Environment Variables**
   - No server-side environment variables required
   - All configuration is client-side

### Alternative Platforms

#### Netlify
```bash
npm run build
# Deploy dist folder to Netlify
```

#### AWS Amplify
```bash
# Connect GitHub repository
# Configure build settings:
# Build command: npm run build
# Publish directory: .next
```

#### Railway
```bash
# Connect GitHub repository
# Railway will auto-detect Next.js configuration
```

## 📊 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Dynamic imports for heavy components
- **Bundle Analysis**: Webpack bundle analyzer integration

### Backend Optimizations
- **Firestore Indexing**: Optimized queries with proper indexes
- **Caching Strategy**: Browser and CDN caching
- **API Rate Limiting**: OpenAI API usage optimization
- **Error Boundaries**: Graceful error handling

### Monitoring
```typescript
// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Goals
- **Components**: >90% coverage
- **Utilities**: >95% coverage
- **Integration**: >80% coverage
- **E2E**: Critical user flows

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core presentation generation
- ✅ Authentication and user management
- ✅ Basic export functionality
- ✅ Day planner mode

### Phase 2 (Next Quarter)
- 🔄 Real-time collaboration
- 🔄 Advanced template library
- 🔄 Voice narration
- 🔄 Mobile app (React Native)

### Phase 3 (Future)
- 📋 Team workspaces
- 📋 Analytics dashboard
- 📋 API for third-party integrations
- 📋 White-label solutions

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### Common Issues

#### API Key Problems
```bash
# Check API key format
# Should start with 'sk-proj-' or 'sk-'
# Verify key has sufficient credits
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Firebase Connection
```bash
# Check network connectivity
# Verify Firebase configuration
# Check browser console for errors
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4o API
- **Firebase** for authentication and database services
- **Vercel** for hosting and deployment platform
- **Next.js** team for the excellent framework
- **TailwindCSS** for the utility-first CSS framework

---

**Built with ❤️ by the SlideGen AI team**

*Last updated: December 2024*
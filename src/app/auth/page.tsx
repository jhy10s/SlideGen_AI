'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Presentation, Mail, Lock, Chrome } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Add timeout for loading state to prevent endless loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Authentication timeout. Please try again.');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      // Don't redirect here - let the useEffect handle it
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // Don't redirect here - let the useEffect handle it
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Presentation className="h-8 w-8 text-teal-600" />
            <span className="text-2xl font-bold text-gray-900">SlideGen AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to access your presentations' 
              : 'Join thousands creating amazing presentations'
            }
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            {/* Toggle between login/signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
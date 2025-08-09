import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  },
  db: {}
}));

// Test component that uses auth
function TestComponent() {
  const { user, signIn, signUp, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in: ${user.email}` : 'Not logged in'}
      </div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password')}>
        Sign Up
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides authentication methods', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Not logged in')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles sign in', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({});
    (auth.signInWithEmailAndPassword as jest.Mock) = mockSignIn;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });
});
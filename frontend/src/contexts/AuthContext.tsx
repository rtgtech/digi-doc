import React, { createContext, useContext, useState, useEffect } from 'react';
import ReactNode from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  about?: string;
  date_of_birth?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  about: string;
  date_of_birth: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // TODO: Validate token with backend and get user info
      // For now, we'll assume it's valid
      setUser({ id: 'temp', name: 'User', email: 'user@example.com' });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const { access_token } = data;

      // Store token
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);

      // TODO: Get user info from token or separate endpoint
      // For now, set basic user info
      setUser({
        id: 'temp', // We'll get this from token decoding later
        name: 'User',
        email: email,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const { access_token } = data;

      // Store token
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);

      // Set user info
      setUser({
        id: 'temp', // We'll get this from token decoding later
        name: userData.name,
        email: userData.email,
        about: userData.about,
        date_of_birth: userData.date_of_birth,
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint if token exists
      if (token) {
        await fetch('http://localhost:8000/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    } finally {
      // Always clear local state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
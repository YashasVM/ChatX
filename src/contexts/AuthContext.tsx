import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'chatx_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);
  const logoutMutation = useMutation(api.auth.logout);
  const updatePresence = useMutation(api.auth.updatePresence);

  useEffect(() => {
    // If no token, we're not loading - show login page
    if (!token) {
      setIsLoading(false);
      return;
    }
    // If we have a token and query has returned (even null), stop loading
    if (user !== undefined) {
      setIsLoading(false);
    }
    // If token is invalid (user is null), clear it
    if (user === null && token) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [user, token]);

  // Update presence periodically
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      updatePresence({ token });
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [token, updatePresence]);

  const login = async (username: string, password: string) => {
    const result = await loginMutation({ username, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  };

  const register = async (username: string, password: string, displayName: string) => {
    const result = await registerMutation({ username, password, displayName });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
  };

  const logout = async () => {
    if (token) {
      await logoutMutation({ token });
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user as User | null,
        token,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

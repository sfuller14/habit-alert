import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';

// Create authentication context
type AuthContextType = {
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any } | undefined>;
  signOut: () => Promise<void>;
  user: any | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  signIn: async () => undefined,
  signUp: async () => undefined,
  signOut: async () => {},
  user: null,
  session: null,
  isLoading: true,
});

// Provider component for authentication
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Check auth state and redirect accordingly
  useEffect(() => {
    const firstSegment = segments[0];
    const isAuthGroup = firstSegment === '(auth)';

    if (!isLoading) {
      if (!session && !isAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/(auth)/login');
      } else if (session && isAuthGroup) {
        // Redirect to home if authenticated but on auth screens
        router.replace('/(tabs)');
      }
    }
  }, [session, segments, isLoading]);

  // Set up auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth functions
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { error, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    signUp,
    signIn,
    signOut,
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use authentication context
export const useAuth = () => useContext(AuthContext);
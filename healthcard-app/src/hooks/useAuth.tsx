import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabaseAuthService, type Session } from '../services/supabaseAuthService';
import type { Profile } from '../types/domain';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await supabaseAuthService.getProfile(nextSession.user);
      
      // Check account status - only 'active' accounts can proceed
      if (nextProfile.account_status !== 'active') {
        console.warn(`Account ${nextProfile.email} is ${nextProfile.account_status}. Logging out.`);
        await supabaseAuthService.logout();
        setSession(null);
        setProfile(null);
        return;
      }
      
      setProfile(nextProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      // If profile loading fails, sign out to prevent stuck state
      if (nextSession) {
        await supabaseAuthService.logout();
        setSession(null);
      }
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const existingSession = await supabaseAuthService.getSession();
        setSession(existingSession);
        await loadProfile(existingSession);
      } catch (error) {
        console.error('Auth bootstrap error:', error);
        setSession(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    const cleanup = supabaseAuthService.onAuthStateChange(async (nextSession: Session | null) => {
      setSession(nextSession);
      await loadProfile(nextSession);
      setLoading(false);
    });

    return () => {
      cleanup();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      refreshProfile: async () => {
        await loadProfile(session);
      },
      signOut: supabaseAuthService.logout,
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

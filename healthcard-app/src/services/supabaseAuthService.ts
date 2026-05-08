import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types/domain';

export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface Session {
  user: {
    id: string;
    email: string;
  };
  access_token: string;
}

export const supabaseAuthService = {
  async login(identifier: string, password: string, expectedRole?: string): Promise<Session> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let resolvedEmail: string;

    // Step 1: Resolve identifier to email
    if (emailPattern.test(normalizedIdentifier)) {
      resolvedEmail = normalizedIdentifier;
    } else {
      // Look up by username in Supabase
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', normalizedIdentifier)
        .single();

      if (error || !profiles) {
        throw new AuthenticationError(
          'No account found with that username or email. Please check your credentials and try again.'
        );
      }

      resolvedEmail = profiles.email;
    }

    // Step 2: Authenticate with Supabase Auth
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      const user = data.user;
      if (!user) {
        throw new AuthenticationError('Login failed: No user data returned');
      }

      // Step 3: Verify role if expectedRole is provided
      if (expectedRole) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          await supabase.auth.signOut();
          throw new AuthenticationError('Account profile not found. Please contact support.');
        }

        const profile = profileData as Profile;

        // Check account status
        if (profile.account_status !== 'active') {
          await supabase.auth.signOut();
          throw new AuthenticationError(
            `Account is ${profile.account_status}. Please contact an administrator.`
          );
        }

        // Map frontend role selection to actual roles
        const roleMapping: Record<string, string[]> = {
          'admin': ['admin', 'super_admin'],
          'encoder': ['encoder'],
          'client': ['client']
        };

        const allowedRoles = roleMapping[expectedRole] || [expectedRole];

        if (!allowedRoles.includes(profile.role)) {
          await supabase.auth.signOut();
          throw new AuthenticationError(
            `This account does not have ${expectedRole} access. Please select the correct portal role or contact support.`
          );
        }
      }

      // Get session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      return {
        user: {
          id: user.id,
          email: user.email || ''
        },
        access_token: session?.access_token || ''
      };

    } catch (error: any) {
      console.error('Supabase auth error:', error);

      // Provide specific error messages based on error type
      if (error.message?.includes('Invalid login credentials')) {
        throw new AuthenticationError(
          'Incorrect password. Please try again or use "Forgot Password" to reset.',
          error.code
        );
      }
      if (error.message?.includes('Too many requests')) {
        throw new AuthenticationError(
          'Too many login attempts. Please wait a few minutes and try again.',
          error.code
        );
      }
      if (error.message?.includes('User disabled')) {
        throw new AuthenticationError(
          'This account has been disabled. Please contact support.',
          error.code
        );
      }

      throw new AuthenticationError(
        `Login failed: ${error.message || 'Unknown error'}`,
        error.code
      );
    }
  },

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalized)) {
      throw new Error('Please provide a valid email address.');
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: `${window.location.origin}/change-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email.');
    }
  },

  async updatePassword(newPassword: string, userId?: string, secret?: string) {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    try {
      // Update password for current user
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Get current user to update the must_change_password flag
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update must_change_password flag in Supabase Database
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }
    } catch (error: any) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      throw error;
    }
  },

  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || ''
        },
        access_token: session.access_token || ''
      };
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session && session.user) {
        callback({
          user: {
            id: session.user.id,
            email: session.user.email || ''
          },
          access_token: session.access_token || ''
        });
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  },

  async getProfile(user: { id: string }): Promise<Profile> {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profileData) {
      throw new Error('Profile not found.');
    }

    return profileData as Profile;
  },

  async requireRole(profile: Profile, role: UserRole) {
    const hasRole = role === 'admin' ? profile.role === 'admin' || profile.role === 'super_admin' : profile.role === role;

    if (!hasRole) {
      throw new Error(`Unauthorized role. Expected ${role}.`);
    }
    if (profile.account_status !== 'active') {
      throw new Error('This account is inactive. Contact an administrator.');
    }
  }
};

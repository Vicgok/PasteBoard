// contexts/auth-types.ts
import type { User, Session, AuthError } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  // Auth State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;

  // Auth Actions
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;

  // Profile Actions
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

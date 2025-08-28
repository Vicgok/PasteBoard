import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
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
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: Error | null }>;
  loadUserProfile: (userId: string) => Promise<Profile | null>;
  upsertUserProfile: (user: User) => Promise<Profile | null>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      profile: null,
      loading: true,
      initialized: false,

      // Setters with debugging
      setUser: (user) => {
        console.log("AuthStore: Setting user", !!user);
        set({ user });
      },
      setSession: (session) => {
        console.log("AuthStore: Setting session", !!session);
        set({ session });
      },
      setProfile: (profile) => {
        console.log("AuthStore: Setting profile", !!profile);
        set({ profile });
      },
      setLoading: (loading) => {
        console.log("AuthStore: Setting loading", loading);
        set({ loading });
      },
      setInitialized: (initialized) => {
        console.log("AuthStore: Setting initialized", initialized);
        set({ initialized });
      },

      // Load user profile from database
      loadUserProfile: async (userId: string): Promise<Profile | null> => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (error) {
            console.error("Error loading profile:", error);
            return null;
          }

          return data;
        } catch (error) {
          console.error("Error loading profile:", error);
          return null;
        }
      },

      // Create or update user profile
      upsertUserProfile: async (user: User): Promise<Profile | null> => {
        try {
          const profileData = {
            id: user.id,
            email: user.email || "",
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",
            avatar_url:
              user.user_metadata?.avatar_url || user.user_metadata?.picture,
          };

          const { data, error } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: "id" })
            .select()
            .single();

          if (error) {
            console.error("Error upserting profile:", error);
            return null;
          }

          return data;
        } catch (error) {
          console.error("Error upserting profile:", error);
          return null;
        }
      },

      // Auth methods - don't set loading to false immediately, let auth state change handle it
      signInWithEmail: async (email: string, password: string) => {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          // Don't set loading to false here - let the auth state change listener handle it
          console.log("signInWithEmail completed", { error: !!error });

          return { error };
        } catch (err) {
          console.error("signInWithEmail error:", err);
          set({ loading: false });
          return { error: err as AuthError };
        }
      },

      signInWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          console.log("signInWithGoogle completed", { error: !!error });

          return { error };
        } catch (err) {
          console.error("signInWithGoogle error:", err);
          set({ loading: false });
          return { error: err as AuthError };
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || email.split("@")[0],
              },
            },
          });
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (!error) {
            set({ user: null, session: null, profile: null });
          }
          return { error };
        } finally {
          set({ loading: false });
        }
      },

      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error };
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return { error: new Error("No user logged in") };

        try {
          const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: data });
          return { error: null };
        } catch (error) {
          console.error("Error updating profile:", error);
          const err = error instanceof Error ? error : new Error(String(error));
          return { error: err };
        }
      },

      reset: () =>
        set({
          user: null,
          session: null,
          profile: null,
          loading: false,
          initialized: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // Changed from sessionStorage to localStorage
      partialize: (state) => ({
        // Only persist session and profile, not user (user is ephemeral)
        session: state.session,
        profile: state.profile,
        initialized: state.initialized, // Include initialized to prevent unnecessary re-initialization
      }),
      // Add onRehydrateStorage to handle proper restoration
      onRehydrateStorage: () => (state) => {
        console.log("AuthStore: Rehydrated from storage", {
          session: !!state?.session,
          profile: !!state?.profile,
          initialized: state?.initialized,
        });

        // If we have a session, restore the user from it
        if (state?.session?.user) {
          console.log("AuthStore: Restoring user from session");
          state.user = state.session.user;
          state.loading = false;
        } else {
          // No valid session - reset to clean state
          console.log(
            "AuthStore: No valid session in storage, resetting state"
          );
          if (!state) {
            return;
          }
          state.user = null;
          state.session = null;
          state.profile = null;
          state.loading = false; // This is crucial - set loading to false
          state.initialized = false; // Reset initialized so authService can re-initialize
        }
      },
    }
  )
);
